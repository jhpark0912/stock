"""
경제 지표 서비스 - yahooquery 기반
"""
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from functools import lru_cache
import time

try:
    from yahooquery import Ticker
    YAHOOQUERY_AVAILABLE = True
except ImportError:
    YAHOOQUERY_AVAILABLE = False

from app.models.economic import (
    EconomicIndicator, 
    HistoryPoint,
    RatesData, 
    CommoditiesData,
    EconomicData
)
from app.services.common.indicator_status import get_indicator_status

logger = logging.getLogger(__name__)

# 캐시 만료 시간 (초)
CACHE_TTL_CURRENT = 300  # 5분
CACHE_TTL_HISTORY = 3600  # 1시간

# 캐시 저장소
_cache: Dict[str, Dict[str, Any]] = {}


def _get_cache(key: str) -> Optional[Any]:
    """캐시에서 데이터 조회"""
    if key in _cache:
        cached = _cache[key]
        if time.time() < cached['expires']:
            logger.debug(f"캐시 히트: {key}")
            return cached['data']
        else:
            logger.debug(f"캐시 만료: {key}")
            del _cache[key]
    return None


def _set_cache(key: str, data: Any, ttl: int):
    """캐시에 데이터 저장"""
    _cache[key] = {
        'data': data,
        'expires': time.time() + ttl
    }
    logger.debug(f"캐시 저장: {key} (TTL: {ttl}s)")


# 지표 메타데이터
INDICATOR_METADATA = {
    # 금리 지표
    "^TNX": {
        "name": "미국채 10년물",
        "metaphor": "전 세계 자산 가격의 중력(Gravity)",
        "description": "미국 정부에게 돈을 빌려주고 받는 이자율입니다. 주식 시장의 가장 강력한 경쟁자입니다.",
        "impact": "이 금리가 오르면(중력이 강해지면), 위험한 주식 대신 안전한 채권으로 돈이 빨려 들어갑니다. 특히 성장주(기술주)에 치명적입니다."
    },
    "^IRX": {
        "name": "기준금리 (3개월 T-Bill)",
        "metaphor": "연준(Fed)의 금리 리모컨",
        "description": "연준이 실제로 조절하는 초단기 금리입니다. 모든 대출금리의 출발점입니다.",
        "impact": "이 금리가 10년물보다 높으면 '장단기 금리 역전'으로, 경기 침체 경보가 울립니다."
    },
    # 변동성 지표
    "^VIX": {
        "name": "VIX (변동성 지수)",
        "metaphor": "시장의 공포 지수 (Fear Gauge)",
        "description": "월가 투자자들이 앞으로 한 달 동안 주가가 얼마나 출렁거릴지 예상하는 수치입니다.",
        "impact": "'공포에 사서 환희에 팔아라'는 격언의 기준입니다. 30 이상이면 패닉 상태이지만, 역설적으로 최고의 저가 매수 기회일 수 있습니다."
    },
    # 원자재 지표
    "CL=F": {
        "name": "WTI 원유",
        "metaphor": "세계 경제의 혈액",
        "description": "서부 텍사스산 경질유 선물 가격입니다. 휘발유, 운송비, 제조원가의 출발점입니다.",
        "impact": "유가 급등 → 물가 상승 → 금리 인상 → 주식 하락의 연쇄 고리를 만듭니다. $80 이상이면 인플레이션 경계가 필요합니다."
    },
    "GC=F": {
        "name": "금 (Gold)",
        "metaphor": "공포의 피난처 (Safe Haven)",
        "description": "금 선물 가격(온스당 달러)입니다. 수천 년간 검증된 '최후의 안전자산'입니다.",
        "impact": "전쟁, 금융위기, 달러 약세 때 급등합니다. 금이 오르면 시장이 불안하다는 신호입니다."
    }
}


def get_yahoo_indicator(symbol: str, include_history: bool = False) -> Optional[EconomicIndicator]:
    """
    yahooquery로 개별 지표 조회
    
    Args:
        symbol: 야후 파이낸스 심볼 (예: ^TNX, ^VIX, CL=F)
        include_history: 30일 히스토리 포함 여부
    
    Returns:
        EconomicIndicator 또는 None
    """
    if not YAHOOQUERY_AVAILABLE:
        logger.error("yahooquery가 설치되지 않았습니다")
        return None
    
    cache_key = f"yahoo_{symbol}_{'history' if include_history else 'current'}"
    cached = _get_cache(cache_key)
    if cached:
        return cached
    
    metadata = INDICATOR_METADATA.get(symbol, {
        "name": symbol,
        "metaphor": "",
        "description": "",
        "impact": ""
    })
    
    try:
        ticker = Ticker(symbol)
        
        # 가격 데이터 조회
        price_data = ticker.price.get(symbol, {})
        
        if isinstance(price_data, str) or not price_data:
            logger.warning(f"가격 데이터 없음: {symbol}")
            return None
        
        current_price = price_data.get('regularMarketPrice')
        previous_close = price_data.get('regularMarketPreviousClose')
        
        if current_price is None:
            logger.warning(f"현재가 없음: {symbol}")
            return None
        
        # 변동 계산
        change = None
        change_percent = None
        if previous_close and previous_close != 0:
            change = current_price - previous_close
            change_percent = (change / previous_close) * 100
        
        # 히스토리 데이터
        history_list = None
        if include_history:
            try:
                # 6개월 히스토리 조회
                hist = ticker.history(period="6mo", interval="1d")
                if hist is not None and not hist.empty:
                    history_list = []
                    # MultiIndex 처리
                    if isinstance(hist.index, tuple) or hasattr(hist.index, 'get_level_values'):
                        hist = hist.reset_index()
                    
                    for idx, row in hist.iterrows():
                        date_val = row.get('date') if 'date' in row else idx
                        close_val = row.get('close') or row.get('adjclose')
                        
                        if close_val is not None:
                            date_str = date_val.strftime('%Y-%m-%d') if hasattr(date_val, 'strftime') else str(date_val)[:10]
                            history_list.append(HistoryPoint(
                                date=date_str,
                                value=float(close_val)
                            ))
            except Exception as e:
                logger.warning(f"히스토리 조회 실패 ({symbol}): {e}")
        
        # 상태 판단
        status, status_label, status_criteria = get_indicator_status(symbol, float(current_price))
        
        indicator = EconomicIndicator(
            symbol=symbol,
            name=metadata["name"],
            value=float(current_price),
            change=float(change) if change is not None else None,
            change_percent=float(change_percent) if change_percent is not None else None,
            metaphor=metadata["metaphor"],
            description=metadata["description"],
            impact=metadata["impact"],
            history=history_list,
            status=status.value,
            status_label=status_label,
            status_criteria=status_criteria
        )
        
        # 캐시 저장
        ttl = CACHE_TTL_HISTORY if include_history else CACHE_TTL_CURRENT
        _set_cache(cache_key, indicator, ttl)
        
        return indicator
        
    except Exception as e:
        logger.error(f"Yahoo 지표 조회 실패 ({symbol}): {e}")
        return None


def get_rates_data(include_history: bool = False) -> RatesData:
    """금리 및 변동성 지표 조회"""
    return RatesData(
        treasury_10y=get_yahoo_indicator("^TNX", include_history),
        treasury_3m=get_yahoo_indicator("^IRX", include_history),
        vix=get_yahoo_indicator("^VIX", include_history)
    )


def get_commodities_data(include_history: bool = False) -> CommoditiesData:
    """원자재 지표 조회"""
    return CommoditiesData(
        wti_oil=get_yahoo_indicator("CL=F", include_history),
        gold=get_yahoo_indicator("GC=F", include_history)
    )


def get_all_yahoo_indicators(include_history: bool = False) -> Dict[str, Any]:
    """
    모든 Yahoo 기반 지표 조회
    
    Returns:
        rates와 commodities 데이터
    """
    return {
        "rates": get_rates_data(include_history),
        "commodities": get_commodities_data(include_history)
    }


def get_all_yahoo_indicators_parallel(include_history: bool = False) -> Dict[str, Any]:
    """
    모든 Yahoo 기반 지표 병렬 조회 (속도 개선)
    
    Returns:
        rates와 commodities 데이터
    """
    from concurrent.futures import ThreadPoolExecutor, as_completed
    
    symbols = ["^TNX", "^IRX", "^VIX", "CL=F", "GC=F"]
    results = {}
    
    start_time = time.time()
    logger.debug(f"Yahoo 지표 병렬 조회 시작 (include_history={include_history})")
    
    with ThreadPoolExecutor(max_workers=5) as executor:
        future_to_symbol = {
            executor.submit(get_yahoo_indicator, sym, include_history): sym 
            for sym in symbols
        }
        
        for future in as_completed(future_to_symbol):
            symbol = future_to_symbol[future]
            try:
                results[symbol] = future.result()
            except Exception as e:
                logger.error(f"Yahoo 지표 조회 실패 ({symbol}): {e}")
                results[symbol] = None
    
    elapsed = time.time() - start_time
    logger.debug(f"Yahoo 지표 병렬 조회 완료: {elapsed:.2f}초")
    
    return {
        "rates": RatesData(
            treasury_10y=results.get("^TNX"),
            treasury_3m=results.get("^IRX"),
            vix=results.get("^VIX")
        ),
        "commodities": CommoditiesData(
            wti_oil=results.get("CL=F"),
            gold=results.get("GC=F")
        )
    }
