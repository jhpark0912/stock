"""
한국 경제 지표 서비스

ECOS (한국은행 경제통계시스템) API 및 Yahoo Finance를 사용하여
한국 경제 지표를 조회합니다.
"""

import logging
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timedelta
from typing import Dict, Optional

import requests

from app.config import settings
from app.models.economic import EconomicIndicator, HistoryPoint
from app.services.common.indicator_status import get_indicator_status

logger = logging.getLogger(__name__)

# ============================================
# ECOS API 설정
# ============================================

ECOS_BASE_URL = "https://ecos.bok.or.kr/api/StatisticSearch"

# ECOS API 시리즈 정의
# stat_code: 통계표 코드
# item_code: 항목 코드
# cycle: 데이터 주기 (M: 월간, D: 일간)
ECOS_SERIES = {
    "KR_BOND_10Y": {
        "stat_code": "817Y002",
        "item_code": "010210000",  # 국고채 10년물 (010200000은 3년물)
        "item_code2": None,
        "cycle": "D",
        "name": "국고채 10년물",
        "metaphor": "한국 자산시장의 중력",
        "description": "한국 정부가 발행하는 10년 만기 국채의 수익률입니다. 주택담보대출 금리의 기준이 됩니다.",
        "impact": "이 금리가 오르면 대출이자가 올라 부동산·주식에 하방 압력이 커집니다. 미국 10년물에 연동되어 움직입니다.",
    },
    "KR_BASE_RATE": {
        "stat_code": "722Y001",
        "item_code": "0101000",
        "item_code2": None,
        "cycle": "D",
        "name": "한국은행 기준금리",
        "metaphor": "한국 경제의 온도 조절기",
        "description": "한국은행이 금융기관과 거래할 때 기준이 되는 금리입니다. 모든 금리의 출발점입니다.",
        "impact": "인상하면 예금이자는 오르지만 대출이자도 올라 소비·투자가 위축됩니다. 인하하면 돈이 풀려 주식·부동산에 호재입니다.",
    },
    "KR_CPI": {
        "stat_code": "901Y009",
        "item_code": "0",
        "item_code2": None,
        "cycle": "M",
        "name": "한국 소비자물가지수",
        "metaphor": "장바구니 물가 (한국판 CPI)",
        "description": "마트에서 장을 보는 비용이 작년보다 얼마나 올랐는지 보여줍니다. 한국은행의 목표는 2%입니다.",
        "impact": "2%대면 안정적, 3% 넘으면 금리 인상 압력이 커져 주식·부동산에 악재입니다. 마이너스면 디플레이션 경고입니다.",
    },
    "KR_M2": {
        "stat_code": "161Y006",  # M2 상품별 구성내역(평잔, 원계열)
        "item_code": "BBHA00",  # M2(평잔, 원계열)
        "item_code2": None,
        "cycle": "M",
        "name": "한국 M2 통화량",
        "metaphor": "한국 주식시장의 연료",
        "description": "시중에 풀린 현금, 예적금 등 바로 쓸 수 있는 돈의 총량입니다.",
        "impact": "M2가 늘어나면 갈 곳 없는 돈이 주식·부동산으로 흘러갑니다. 줄어들면 자산 가격 하락 압력이 커집니다.",
    },
    "KR_EXPORT": {
        "stat_code": "301Y013",
        "item_code": "110000",
        "item_code2": None,
        "cycle": "M",
        "name": "월간 수출액 (BOP)",
        "metaphor": "코스피의 심장 박동",
        "description": "국제수지 기준 상품 수출 금액(백만달러)입니다. 반도체·자동차 등 한국 주력 수출품이 세계에서 얼마나 팔리는지 보여줍니다.",
        "impact": "수출 YoY 증가 → 기업 실적 개선 → 코스피 상승 동력. 3개월 연속 감소 시 경기 침체 신호.",
    },
    "KR_INDPRO": {
        "stat_code": "901Y033",
        "item_code": "A00",  # 전산업 (2020=100)
        "item_code2": "2",  # 계절조정 (1=원계열, 2=계절조정)
        "cycle": "M",
        "name": "전산업생산지수",
        "metaphor": "한국 공장의 심장 박동",
        "description": "광업, 제조업, 전기가스업의 생산량을 종합한 지수입니다(2020=100). 한국 경제의 실물 활동을 직접 보여줍니다.",
        "impact": "100 이상이면 기준기간보다 생산이 활발한 것이고, YoY 양수(+)면 경기 확장 신호입니다.",
    },
    "KR_LEADING_INDEX": {
        "stat_code": "901Y067",
        "item_code": "I16E",
        "item_code2": None,
        "cycle": "M",
        "name": "선행지수 순환변동치",
        "metaphor": "경기의 내비게이션",
        "description": "6~9개월 후 경기 방향을 미리 보여주는 지표입니다. 기준값 100을 중심으로 위면 경기 확장, 아래면 경기 수축을 예고합니다.",
        "impact": "100 이상 & 상승이면 경기 확장 신호로 주식 비중 확대. 하락 전환하면 경기 고점 통과 가능성, 하락장 대비 필요.",
    },
    "KR_CCSI": {
        "stat_code": "511Y002",
        "item_code": "FME",
        "item_code2": None,
        "cycle": "M",
        "name": "소비자심리지수 (CCSI)",
        "metaphor": "국민 경기 체감 온도",
        "description": "소비자들이 현재·미래 경기를 어떻게 느끼는지 수치화한 지표입니다. 기준값 100이 '보통'입니다.",
        "impact": "100 초과면 '먹고살 만하다' → 소비 활성화 기대. 100 미만이면 '지갑 닫음' → 경기 침체 우려.",
    },
}

# Yahoo Finance 한국 지표
YAHOO_KR_SYMBOLS = {
    # "^VKOSPI": {
    #     "name": "VKOSPI",
    #     "metaphor": "한국판 공포지수",
    #     "description": "KOSPI 200 옵션의 내재 변동성을 측정",
    #     "impact": "20 이하 안정, 30 이상 공포. 높을수록 시장 불안"
    # },  # Yahoo Finance에서 제공하지 않음
    "KRW=X": {
        "name": "원/달러 환율",
        "metaphor": "한국 경제의 체온계",
        "description": "1달러를 사기 위해 필요한 원화입니다. 환율이 오르면 원화 가치가 떨어진다는 뜻입니다.",
        "impact": "1,300원 이상이면 수입 물가 상승으로 서민 생활이 힘들어지고, 외국인 투자자가 한국 주식을 팔고 나갈 수 있습니다.",
    }
}

# 캐시 설정
_cache: Dict[str, tuple] = {}
ECOS_CACHE_TTL = 24 * 60 * 60  # 24시간 (ECOS는 일간/월간 데이터)
YAHOO_CACHE_TTL = 5 * 60  # 5분


def _get_cached(key: str, ttl: int) -> Optional[any]:
    """캐시에서 데이터 조회"""
    if key in _cache:
        data, timestamp = _cache[key]
        if time.time() - timestamp < ttl:
            return data
    return None


def _set_cache(key: str, data: any):
    """캐시에 데이터 저장"""
    _cache[key] = (data, time.time())


# ============================================
# ECOS API 조회 함수
# ============================================


def get_ecos_indicator(series_id: str, include_history: bool = False) -> Optional[EconomicIndicator]:
    """
    ECOS API에서 개별 지표 조회

    Args:
        series_id: 시리즈 ID (KR_BOND_10Y, KR_BASE_RATE 등)
        include_history: 히스토리 포함 여부

    Returns:
        EconomicIndicator 또는 None
    """
    api_key = settings.ecos_api_key
    if not api_key:
        logger.warning("ECOS_API_KEY가 설정되지 않았습니다.")
        return None

    if series_id not in ECOS_SERIES:
        logger.error(f"알 수 없는 ECOS 시리즈: {series_id}")
        return None

    # 캐시 확인
    cache_key = f"ecos_{series_id}_{include_history}"
    cached = _get_cached(cache_key, ECOS_CACHE_TTL)
    if cached:
        logger.debug(f"ECOS 캐시 히트: {series_id}")
        return cached

    series = ECOS_SERIES[series_id]
    stat_code = series["stat_code"]
    item_code = series["item_code"]
    item_code2 = series.get("item_code2")
    cycle = series["cycle"]

    # 날짜 범위 설정
    today = datetime.now()
    if cycle == "M":
        # 월간 데이터: 히스토리 포함 시 약 3.5년, 미포함 시 15개월
        end_date = today.strftime("%Y%m")
        if include_history:
            start_date = (today - timedelta(days=1280)).strftime("%Y%m")  # ~42개월
        else:
            start_date = (today - timedelta(days=460)).strftime("%Y%m")  # ~15개월
    else:
        # 일간 데이터: 최근 200일 (6개월 + 여유)
        end_date = today.strftime("%Y%m%d")
        start_date = (today - timedelta(days=200)).strftime("%Y%m%d")

    try:
        # item_code2가 있으면 URL에 추가
        # ECOS API는 한 번에 최대 100,000개까지 조회 가능
        if item_code2:
            url = f"{ECOS_BASE_URL}/{api_key}/json/kr/1/10000/{stat_code}/{cycle}/{start_date}/{end_date}/{item_code}/{item_code2}"
        else:
            url = f"{ECOS_BASE_URL}/{api_key}/json/kr/1/10000/{stat_code}/{cycle}/{start_date}/{end_date}/{item_code}"

        logger.debug(f"ECOS API 호출: {series_id}")
        logger.debug(f"ECOS URL: {url}")

        response = requests.get(url, timeout=20)
        response.raise_for_status()
        data = response.json()

        # 응답 파싱
        if "StatisticSearch" not in data:
            if "RESULT" in data:
                error_msg = data["RESULT"].get("MESSAGE", "Unknown error")
                error_code = data["RESULT"].get("CODE", "")
                logger.error(f"ECOS API 에러 ({series_id}): {error_msg} (코드: {error_code})")
                logger.debug(f"ECOS 응답: {data}")
            return None

        rows = data["StatisticSearch"].get("row", [])
        if not rows:
            logger.warning(f"ECOS 데이터 없음: {series_id}")
            return None

        # 최신 값 추출
        latest = rows[-1]
        latest_date = latest.get("TIME", "")
        value = float(latest.get("DATA_VALUE", 0))

        logger.info(f"✅ ECOS {series_id}: 최신 데이터 {latest_date} = {value} (총 {len(rows)}개)")

        # 변화율 계산 (전기 대비)
        change = None
        change_percent = None
        yoy_change = None

        if len(rows) >= 2:
            prev_value = float(rows[-2].get("DATA_VALUE", 0))
            if prev_value != 0:
                change = value - prev_value
                change_percent = (change / prev_value) * 100

        # YoY 변화율 (월간 데이터만)
        if cycle == "M" and len(rows) >= 13:
            yoy_value = float(rows[-13].get("DATA_VALUE", 0))
            if yoy_value != 0:
                yoy_change = ((value - yoy_value) / yoy_value) * 100

        # 히스토리 데이터 구성
        history = None
        if include_history:
            history = []
            # 일간 데이터: 최근 200개 (약 7~8개월), 월간 데이터: 최근 36개 (3년)
            max_points = 200 if cycle == "D" else 36
            for row in rows[-max_points:]:
                date_str = row.get("TIME", "")
                if cycle == "M":
                    # YYYYMM -> YYYY-MM
                    date_str = f"{date_str[:4]}-{date_str[4:]}"
                else:
                    # YYYYMMDD -> YYYY-MM-DD
                    date_str = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:]}"

                history.append(HistoryPoint(date=date_str, value=float(row.get("DATA_VALUE", 0))))

        # 상태 판단
        status, status_label, status_criteria = get_indicator_status(series_id, value, yoy_change)

        indicator = EconomicIndicator(
            symbol=series_id,
            name=series["name"],
            value=value,
            change=change,
            change_percent=change_percent,
            yoy_change=yoy_change,
            metaphor=series["metaphor"],
            description=series["description"],
            impact=series["impact"],
            history=history,
            status=status.value,
            status_label=status_label,
            status_criteria=status_criteria,
        )

        _set_cache(cache_key, indicator)
        return indicator

    except requests.exceptions.RequestException as e:
        logger.error(f"ECOS API 요청 실패 ({series_id}): {e}")
        return None
    except Exception as e:
        logger.error(f"ECOS 데이터 처리 실패 ({series_id}): {e}")
        return None


def get_credit_spread(include_history: bool = False) -> Optional[EconomicIndicator]:
    """
    신용 스프레드 (회사채-국고채 금리 차이) 조회

    Args:
        include_history: 히스토리 포함 여부

    Returns:
        EconomicIndicator 또는 None
    """
    api_key = settings.ecos_api_key
    if not api_key:
        logger.warning("ECOS_API_KEY가 설정되지 않았습니다.")
        return None

    # 캐시 확인
    cache_key = f"ecos_credit_spread_{include_history}"
    cached = _get_cached(cache_key, ECOS_CACHE_TTL)
    if cached:
        logger.debug("신용 스프레드 캐시 히트")
        return cached

    stat_code = "817Y002"
    treasury_code = "010200000"  # 국고채 3년
    corporate_code = "010300000"  # 회사채 3년(AA-)

    # 날짜 범위 설정 (일간 데이터)
    today = datetime.now()
    end_date = today.strftime("%Y%m%d")
    start_date = (today - timedelta(days=200)).strftime("%Y%m%d")

    try:
        # 국고채 3년 조회 (최대 10000개)
        treasury_url = (
            f"{ECOS_BASE_URL}/{api_key}/json/kr/1/10000/{stat_code}/D/{start_date}/{end_date}/{treasury_code}"
        )
        logger.debug(f"국고채 3년 URL: {treasury_url}")

        treasury_response = requests.get(treasury_url, timeout=20)
        treasury_response.raise_for_status()
        treasury_data = treasury_response.json()

        if "StatisticSearch" not in treasury_data:
            logger.error(f"국고채 3년 조회 실패: {treasury_data}")
            return None

        treasury_rows = treasury_data["StatisticSearch"].get("row", [])
        if not treasury_rows:
            logger.warning("국고채 3년 데이터 없음")
            return None

        # 회사채 3년(AA-) 조회 (최대 10000개)
        corporate_url = (
            f"{ECOS_BASE_URL}/{api_key}/json/kr/1/10000/{stat_code}/D/{start_date}/{end_date}/{corporate_code}"
        )
        logger.debug(f"회사채 3년 URL: {corporate_url}")

        corporate_response = requests.get(corporate_url, timeout=20)
        corporate_response.raise_for_status()
        corporate_data = corporate_response.json()

        if "StatisticSearch" not in corporate_data:
            logger.error(f"회사채 3년 조회 실패: {corporate_data}")
            return None

        corporate_rows = corporate_data["StatisticSearch"].get("row", [])
        if not corporate_rows:
            logger.warning("회사채 3년 데이터 없음")
            return None

        # 최신 스프레드 계산
        latest_date = treasury_rows[-1].get("TIME", "")
        latest_treasury = float(treasury_rows[-1].get("DATA_VALUE", 0))
        latest_corporate = float(corporate_rows[-1].get("DATA_VALUE", 0))
        spread = latest_corporate - latest_treasury

        logger.info(
            f"✅ ECOS 신용스프레드: 최신 데이터 {latest_date} = {spread:.3f}%p (국고채: {len(treasury_rows)}개, 회사채: {len(corporate_rows)}개)"
        )

        # 이전 스프레드 (변화율 계산용)
        change = None
        change_percent = None
        if len(treasury_rows) >= 2 and len(corporate_rows) >= 2:
            prev_treasury = float(treasury_rows[-2].get("DATA_VALUE", 0))
            prev_corporate = float(corporate_rows[-2].get("DATA_VALUE", 0))
            prev_spread = prev_corporate - prev_treasury

            if prev_spread != 0:
                change = spread - prev_spread
                change_percent = (change / prev_spread) * 100

        # 히스토리 데이터 구성
        history = None
        if include_history:
            history = []
            # 날짜별로 스프레드 계산 (일간 데이터: 최근 200개)
            min_len = min(len(treasury_rows), len(corporate_rows))
            max_points = 200  # 약 7~8개월
            for i in range(max(0, min_len - max_points), min_len):
                date_str = treasury_rows[i].get("TIME", "")
                # YYYYMMDD -> YYYY-MM-DD
                date_str = f"{date_str[:4]}-{date_str[4:6]}-{date_str[6:]}"

                t_value = float(treasury_rows[i].get("DATA_VALUE", 0))
                c_value = float(corporate_rows[i].get("DATA_VALUE", 0))
                spread_value = c_value - t_value

                history.append(HistoryPoint(date=date_str, value=round(spread_value, 3)))

        # 상태 판단
        status, status_label, status_criteria = get_indicator_status("KR_CREDIT_SPREAD", spread)

        indicator = EconomicIndicator(
            symbol="KR_CREDIT_SPREAD",
            name="신용 스프레드",
            value=round(spread, 3),
            change=round(change, 3) if change else None,
            change_percent=round(change_percent, 2) if change_percent else None,
            metaphor="기업 신용 위험의 체온계",
            description="기업이 돈을 빌릴 때 내는 이자율(회사채)에서 정부가 내는 이자율(국고채)을 뺀 차이입니다. 기업의 부도 위험이 클수록 벌어집니다.",
            impact="0.5%p 이하면 시장이 안정적이고, 1%p 이상으로 벌어지면 '기업 부도 공포'가 커지는 신호입니다. 2008년 금융위기 때 급등했습니다.",
            history=history,
            status=status.value,
            status_label=status_label,
            status_criteria=status_criteria,
        )

        _set_cache(cache_key, indicator)
        return indicator

    except requests.exceptions.RequestException as e:
        logger.error(f"신용 스프레드 조회 실패: {e}")
        return None
    except Exception as e:
        logger.error(f"신용 스프레드 처리 실패: {e}")
        return None


def get_yahoo_kr_indicator(symbol: str, include_history: bool = False) -> Optional[EconomicIndicator]:
    """
    Yahoo Finance에서 한국 지표 조회

    Args:
        symbol: Yahoo 심볼 (^VKOSPI, KRW=X 등)
        include_history: 히스토리 포함 여부

    Returns:
        EconomicIndicator 또는 None
    """
    if symbol not in YAHOO_KR_SYMBOLS:
        logger.error(f"알 수 없는 Yahoo 한국 심볼: {symbol}")
        return None

    # 캐시 확인
    cache_key = f"yahoo_kr_{symbol}_{include_history}"
    cached = _get_cached(cache_key, YAHOO_CACHE_TTL)
    if cached:
        logger.debug(f"Yahoo KR 캐시 히트: {symbol}")
        return cached

    try:
        # yahooquery 사용
        from yahooquery import Ticker

        ticker = Ticker(symbol)
        price_data = ticker.price.get(symbol, {})

        if isinstance(price_data, str) or not price_data:
            logger.warning(f"Yahoo 한국 지표 조회 실패: {symbol}")
            return None

        value = price_data.get("regularMarketPrice")
        if value is None:
            return None

        change = price_data.get("regularMarketChange")
        change_percent = price_data.get("regularMarketChangePercent")
        if change_percent:
            change_percent = change_percent * 100

        # 히스토리 조회
        history = None
        if include_history:
            hist = ticker.history(period="6mo", interval="1d")
            if not hist.empty:
                history = []
                for date, row in hist.iterrows():
                    if isinstance(date, tuple):
                        date = date[1]  # MultiIndex의 경우
                    history.append(
                        HistoryPoint(date=str(date)[:10], value=float(row.get("close", row.get("adjclose", 0))))
                    )

        meta = YAHOO_KR_SYMBOLS[symbol]

        # 상태 판단
        status, status_label, status_criteria = get_indicator_status(symbol, value)

        indicator = EconomicIndicator(
            symbol=symbol,
            name=meta["name"],
            value=value,
            change=change,
            change_percent=change_percent,
            metaphor=meta["metaphor"],
            description=meta["description"],
            impact=meta["impact"],
            history=history,
            status=status.value,
            status_label=status_label,
            status_criteria=status_criteria,
        )

        _set_cache(cache_key, indicator)
        return indicator

    except ImportError:
        logger.error("yahooquery 라이브러리가 설치되지 않았습니다.")
        return None
    except Exception as e:
        logger.error(f"Yahoo 한국 지표 조회 실패 ({symbol}): {e}")
        return None


# ============================================
# 통합 조회 함수
# ============================================


def get_all_korea_indicators(include_history: bool = False) -> Dict:
    """
    모든 한국 경제 지표 병렬 조회

    Returns:
        {
            "rates": { bond_10y, base_rate, credit_spread },
            "macro": { cpi, m2 },
            "fx": { usd_krw }
        }

    Note:
        credit_spread는 회사채-국고채 금리 차이 (신용 스프레드)
    """
    logger.debug("한국 경제 지표 전체 조회 시작")

    results = {
        "rates": {
            "bond_10y": None,
            "base_rate": None,
            "credit_spread": None,  # 신용 스프레드 (회사채-국고채 금리 차이)
        },
        "macro": {"leading_index": None, "ccsi": None, "export": None},
        "fx": {"usd_krw": None},
    }

    def fetch_ecos(series_id: str):
        return (series_id, get_ecos_indicator(series_id, include_history))

    def fetch_yahoo(symbol: str):
        return (symbol, get_yahoo_kr_indicator(symbol, include_history))

    def fetch_credit_spread():
        return ("KR_CREDIT_SPREAD", get_credit_spread(include_history))

    # 병렬 조회
    with ThreadPoolExecutor(max_workers=7) as executor:
        # ECOS 지표
        ecos_futures = [
            executor.submit(fetch_ecos, "KR_BOND_10Y"),
            executor.submit(fetch_ecos, "KR_BASE_RATE"),
            executor.submit(fetch_ecos, "KR_LEADING_INDEX"),
            executor.submit(fetch_ecos, "KR_CCSI"),
            executor.submit(fetch_ecos, "KR_EXPORT"),
        ]

        # Yahoo 지표
        yahoo_futures = [
            executor.submit(fetch_yahoo, "KRW=X"),
        ]

        # 신용 스프레드
        spread_future = executor.submit(fetch_credit_spread)

        # 결과 수집
        for future in ecos_futures + yahoo_futures + [spread_future]:
            try:
                series_id, indicator = future.result(timeout=30)
                if indicator:
                    if series_id == "KR_BOND_10Y":
                        results["rates"]["bond_10y"] = indicator
                    elif series_id == "KR_BASE_RATE":
                        results["rates"]["base_rate"] = indicator
                    elif series_id == "KR_CREDIT_SPREAD":
                        results["rates"]["credit_spread"] = indicator
                    elif series_id == "KR_LEADING_INDEX":
                        results["macro"]["leading_index"] = indicator
                    elif series_id == "KR_CCSI":
                        results["macro"]["ccsi"] = indicator
                    elif series_id == "KR_EXPORT":
                        results["macro"]["export"] = indicator
                    elif series_id == "KRW=X":
                        results["fx"]["usd_krw"] = indicator
            except Exception as e:
                logger.error(f"지표 조회 실패: {e}")

    logger.debug("한국 경제 지표 전체 조회 완료")
    return results


def check_ecos_availability() -> Dict:
    """
    ECOS API 상태 확인

    Returns:
        {"available": bool, "message": str}
    """
    api_key = settings.ecos_api_key

    if not api_key:
        return {
            "available": False,
            "message": "ECOS_API_KEY가 설정되지 않았습니다. 한국 경제 지표를 조회하려면 https://ecos.bok.or.kr/api/ 에서 API 키를 발급받으세요.",
        }

    return {"available": True, "message": "ECOS API 키가 설정되어 있습니다."}
