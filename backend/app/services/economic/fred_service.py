"""
FRED API 서비스 - CPI, M2 통화량 조회
"""
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import time

from app.config import settings
from app.models.economic import EconomicIndicator, HistoryPoint, MacroData
from app.services.common.indicator_status import get_indicator_status

logger = logging.getLogger(__name__)

# FRED API 사용 가능 여부 확인
try:
    from fredapi import Fred
    FRED_AVAILABLE = True
except ImportError:
    FRED_AVAILABLE = False
    logger.warning("fredapi가 설치되지 않았습니다. pip install fredapi")

# 캐시 설정
CACHE_TTL_FRED = 86400  # 24시간 (월/주 단위 업데이트 데이터)
_cache: Dict[str, Dict[str, Any]] = {}


def _get_cache(key: str) -> Optional[Any]:
    """캐시에서 데이터 조회"""
    if key in _cache:
        cached = _cache[key]
        if time.time() < cached['expires']:
            logger.debug(f"FRED 캐시 히트: {key}")
            return cached['data']
        else:
            logger.debug(f"FRED 캐시 만료: {key}")
            del _cache[key]
    return None


def _set_cache(key: str, data: Any, ttl: int = CACHE_TTL_FRED):
    """캐시에 데이터 저장"""
    _cache[key] = {
        'data': data,
        'expires': time.time() + ttl
    }
    logger.debug(f"FRED 캐시 저장: {key} (TTL: {ttl}s)")


# FRED 시리즈 메타데이터
FRED_METADATA = {
    "CPIAUCSL": {
        "name": "CPI (소비자물가지수)",
        "metaphor": "연준(Fed)의 금리 브레이크 페달",
        "description": "작년보다 물가가 얼마나 올랐는지 보여줍니다. 연준의 목표는 2.0%입니다.",
        "impact": "2%대면 골디락스(이상적)로 금리 인하 기대감이 올라갑니다. 3% 이상이면 인플레이션 고착화로 연준이 긴축을 계속해 주식 악재입니다."
    },
    "M2SL": {
        "name": "M2 통화량",
        "metaphor": "주식 시장의 연료 (유동성)",
        "description": "시중에 풀린 현금, 예금 등 바로 쓸 수 있는 돈의 총량입니다.",
        "impact": "기업 실적이 안 좋아도 돈을 엄청나게 풀면(M2 증가) 주가는 오를 수 있습니다(유동성 장세). 반대로 M2가 줄면 자산 가격 하락 압력이 커집니다."
    },
    "INDPRO": {
        "name": "산업생산지수",
        "metaphor": "미국 공장의 심장 박동",
        "description": "제조업, 광업, 유틸리티의 실질 생산량 지수입니다. 매달 15일에 발표됩니다.",
        "impact": "YoY 변화율이 양수(+)면 공장이 더 바쁘게 돌아가는 것이고, 음수(-)면 생산이 줄어 경기 수축 신호입니다."
    },
    "PHILLY_FED_SPREAD": {
        "name": "필라델피아 연준 스프레드",
        "metaphor": "기업들의 미래 일감 (신규주문 - 재고)",
        "description": "공장에 새로 들어온 주문량에서 창고에 쌓인 재고량을 뺀 값입니다. 주가보다 6개월 먼저 움직이는 선행지표입니다.",
        "impact": "양수(+)면 주문 폭주로 공장 풀가동(경기 확장 → 주식 매수). 음수(-)면 주문은 없는데 재고만 쌓여 공장 가동 중단(경기 침체 → 주식 매도)."
    },
    "CFNAIMA3": {
        "name": "시카고 연준 국가활동지수",
        "metaphor": "미국 경제 종합 건강검진표",
        "description": "생산, 고용, 소비 등 85개 경제 지표를 믹서기에 갈아서 만든 단 하나의 숫자입니다(3개월 이동평균).",
        "impact": "개별 뉴스(고용 쇼크 등)에 일희일비하지 않고 큰 흐름을 볼 때 씁니다. -0.7 아래면 '경기 침체(Recession) 확정'으로 주식 시장 폭락 경보입니다."
    },
    "UMCSENT": {
        "name": "미시간대 소비자심리지수",
        "metaphor": "미국인들의 지갑 여는 기분",
        "description": "미국 일반 시민들에게 '요즘 먹고살 만합니까?'라고 설문 조사한 점수입니다. 미국 GDP의 70%는 소비입니다.",
        "impact": "심리가 얼어붙으면 기업 물건이 안 팔립니다. 80 이상이면 자신감 뿜뿜, 60 이하면 지갑 닫음으로 심각한 불황 공포입니다."
    }
}


def _get_fred_client() -> Optional["Fred"]:
    """FRED API 클라이언트 생성"""
    if not FRED_AVAILABLE:
        return None
    
    api_key = settings.fred_api_key
    if not api_key:
        logger.warning("FRED_API_KEY가 설정되지 않았습니다")
        return None
    
    try:
        return Fred(api_key=api_key)
    except Exception as e:
        logger.error(f"FRED 클라이언트 생성 실패: {e}")
        return None


def get_fred_indicator(
    series_id: str, 
    include_history: bool = False
) -> Optional[EconomicIndicator]:
    """
    FRED에서 개별 시리즈 조회
    
    Args:
        series_id: FRED 시리즈 ID (예: CPIAUCSL, M2SL)
        include_history: 히스토리 포함 여부
    
    Returns:
        EconomicIndicator 또는 None
    """
    cache_key = f"fred_{series_id}_{'history' if include_history else 'current'}"
    cached = _get_cache(cache_key)
    if cached:
        return cached
    
    fred = _get_fred_client()
    if not fred:
        return None
    
    metadata = FRED_METADATA.get(series_id, {
        "name": series_id,
        "metaphor": "",
        "description": "",
        "impact": ""
    })
    
    try:
        # 최근 2년 데이터 조회 (YoY 계산용)
        end_date = datetime.now()
        start_date = end_date - timedelta(days=365 * 2)
        
        data = fred.get_series(
            series_id,
            observation_start=start_date,
            observation_end=end_date
        )
        
        if data is None or data.empty:
            logger.warning(f"FRED 데이터 없음: {series_id}")
            return None
        
        # 최신값
        current_value = float(data.iloc[-1])
        
        # YoY 변화율 계산 (12개월 전 대비)
        yoy_change = None
        if len(data) >= 12:
            # 월간 데이터이므로 12개 전 값과 비교
            year_ago_value = float(data.iloc[-13]) if len(data) >= 13 else float(data.iloc[0])
            if year_ago_value != 0:
                yoy_change = ((current_value - year_ago_value) / year_ago_value) * 100
        
        # 히스토리 데이터 (최근 30개 데이터 포인트)
        history_list = None
        if include_history:
            history_list = []
            recent_data = data.tail(30)
            for date, value in recent_data.items():
                if value is not None and not (isinstance(value, float) and value != value):  # NaN 체크
                    history_list.append(HistoryPoint(
                        date=date.strftime('%Y-%m-%d'),
                        value=float(value)
                    ))
        
        # 상태 판단 (FRED는 YoY 변화율 기반)
        status, status_label, status_criteria = get_indicator_status(series_id, current_value, yoy_change)
        
        indicator = EconomicIndicator(
            symbol=series_id,
            name=metadata["name"],
            value=current_value,
            change=None,  # FRED는 일간 변동률 대신 YoY 사용
            change_percent=None,
            yoy_change=yoy_change,
            metaphor=metadata["metaphor"],
            description=metadata["description"],
            impact=metadata["impact"],
            history=history_list,
            status=status.value,
            status_label=status_label,
            status_criteria=status_criteria
        )
        
        _set_cache(cache_key, indicator)
        return indicator
        
    except Exception as e:
        logger.error(f"FRED 시리즈 조회 실패 ({series_id}): {e}")
        return None


def _get_fred_raw_series(series_id: str):
    """
    FRED에서 raw pandas Series를 반환 (EconomicIndicator 변환 없이)
    Philly Fed 스프레드 계산용
    """
    import pandas as pd

    cache_key = f"fred_raw_{series_id}"
    cached = _get_cache(cache_key)
    if cached is not None:
        return cached

    fred = _get_fred_client()
    if not fred:
        return None

    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=365 * 2)
        data = fred.get_series(
            series_id,
            observation_start=start_date,
            observation_end=end_date
        )
        if data is None or data.empty:
            logger.warning(f"FRED 데이터 없음: {series_id}")
            return None

        _set_cache(cache_key, data)
        return data
    except Exception as e:
        logger.error(f"FRED raw 시리즈 조회 실패 ({series_id}): {e}")
        return None


def _calculate_philly_spread(new_orders_series, inventories_series, include_history: bool = False) -> Optional[EconomicIndicator]:
    """
    Philly Fed 신규주문-재고 스프레드 계산 (날짜 기반 매핑)
    """
    import pandas as pd

    if new_orders_series is None or inventories_series is None:
        return None

    try:
        # pandas Series → DataFrame으로 변환 후 날짜 기준 inner join
        df_orders = pd.DataFrame({'new_orders': new_orders_series})
        df_inv = pd.DataFrame({'inventories': inventories_series})
        merged = df_orders.join(df_inv, how='inner').dropna()

        if merged.empty:
            logger.warning("Philly Fed 스프레드: 매칭 데이터 없음")
            return None

        merged = merged.assign(spread=merged['new_orders'] - merged['inventories'])
        current_value = float(merged['spread'].iloc[-1])

        # 히스토리 데이터
        history_list = None
        if include_history:
            history_list = []
            recent = merged.tail(30)
            for date, row in recent.iterrows():
                spread_val = float(row['spread'])
                if spread_val == spread_val:  # NaN 체크
                    history_list.append(HistoryPoint(
                        date=date.strftime('%Y-%m-%d'),
                        value=spread_val
                    ))

        metadata = FRED_METADATA["PHILLY_FED_SPREAD"]
        status, status_label, status_criteria = get_indicator_status("PHILLY_FED_SPREAD", current_value)

        return EconomicIndicator(
            symbol="PHILLY_FED_SPREAD",
            name=metadata["name"],
            value=current_value,
            change=None,
            change_percent=None,
            yoy_change=None,
            metaphor=metadata["metaphor"],
            description=metadata["description"],
            impact=metadata["impact"],
            history=history_list,
            status=status.value,
            status_label=status_label,
            status_criteria=status_criteria
        )
    except Exception as e:
        logger.error(f"Philly Fed 스프레드 계산 실패: {e}")
        return None


def get_macro_data(include_history: bool = False) -> MacroData:
    """거시경제 지표 조회 (CPI, M2, INDPRO)"""
    return MacroData(
        cpi=get_fred_indicator("CPIAUCSL", include_history),
        m2=get_fred_indicator("M2SL", include_history),
        indpro=get_fred_indicator("INDPRO", include_history)
    )


def get_macro_data_parallel(include_history: bool = False) -> MacroData:
    """거시경제 지표 병렬 조회 (CPI, M2, INDPRO, CFNAI, UMCSENT + Philly Fed Spread)"""
    from concurrent.futures import ThreadPoolExecutor, as_completed
    import time as time_module

    # 단일 시리즈 (get_fred_indicator로 조회)
    series_ids = ["CPIAUCSL", "M2SL", "INDPRO", "CFNAIMA3", "UMCSENT"]
    # Philly Fed는 2개 시리즈를 raw로 조회 후 스프레드 계산
    philly_series = ["NOCDFSA066MSFRBPHI", "IVCDFSA066MSFRBPHI"]

    results = {}

    start_time = time_module.time()
    logger.debug(f"FRED 지표 병렬 조회 시작 (include_history={include_history})")

    with ThreadPoolExecutor(max_workers=7) as executor:
        future_to_key = {}
        # 단일 시리즈 조회
        for sid in series_ids:
            future_to_key[executor.submit(get_fred_indicator, sid, include_history)] = sid
        # Philly Fed raw 시리즈 조회
        for sid in philly_series:
            future_to_key[executor.submit(_get_fred_raw_series, sid)] = sid

        for future in as_completed(future_to_key):
            key = future_to_key[future]
            try:
                results[key] = future.result()
            except Exception as e:
                logger.error(f"FRED 지표 조회 실패 ({key}): {e}")
                results[key] = None

    # Philly Fed Spread 계산 (날짜 기반 매핑)
    philly_fed = _calculate_philly_spread(
        results.get("NOCDFSA066MSFRBPHI"),
        results.get("IVCDFSA066MSFRBPHI"),
        include_history
    )

    elapsed = time_module.time() - start_time
    logger.debug(f"FRED 지표 병렬 조회 완료: {elapsed:.2f}초")

    return MacroData(
        cpi=results.get("CPIAUCSL"),
        m2=results.get("M2SL"),
        indpro=results.get("INDPRO"),
        philly_fed=philly_fed,
        cfnai=results.get("CFNAIMA3"),
        umcsent=results.get("UMCSENT"),
    )


def check_fred_availability() -> Dict[str, Any]:
    """FRED API 사용 가능 여부 확인"""
    return {
        "fredapi_installed": FRED_AVAILABLE,
        "api_key_configured": bool(settings.fred_api_key) if hasattr(settings, 'fred_api_key') else False
    }
