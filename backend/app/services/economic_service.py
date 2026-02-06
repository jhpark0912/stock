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
from app.services.indicator_status import get_indicator_status

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
        "metaphor": "무위험 수익의 기준",
        "description": "미국 정부가 10년간 빌린 돈에 대해 지급하는 이자율",
        "impact": "주식, 부동산, 채권 등 모든 자산 가격에 영향"
    },
    "^IRX": {
        "name": "기준금리 (3개월 T-Bill)",
        "metaphor": "자산 가격의 중력",
        "description": "연준의 단기 금리 정책을 반영하는 지표",
        "impact": "금리 인상 시 주식/부동산 하락 압력"
    },
    # 변동성 지표
    "^VIX": {
        "name": "VIX (변동성 지수)",
        "metaphor": "시장의 공포 온도계",
        "description": "S&P 500 옵션 시장에서 측정한 향후 30일 변동성 예상치",
        "impact": "20 이상 시 불안, 30 이상 시 공포 국면"
    },
    # 원자재 지표
    "CL=F": {
        "name": "WTI 원유",
        "metaphor": "물가의 주범",
        "description": "서부 텍사스산 경질유 선물 가격",
        "impact": "휘발유, 운송비, 제조원가에 직접 영향"
    },
    "GC=F": {
        "name": "금 (Gold)",
        "metaphor": "공포의 피난처",
        "description": "금 선물 가격 (온스당 달러)",
        "impact": "불확실성 증가 시 상승, 달러 약세 시 상승"
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
                # 30일 히스토리 조회
                hist = ticker.history(period="1mo", interval="1d")
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
    logger.info(f"Yahoo 지표 병렬 조회 시작 (include_history={include_history})")
    
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
    logger.info(f"Yahoo 지표 병렬 조회 완료: {elapsed:.2f}초")
    
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
