"""
FRED API 서비스 - CPI, M2 통화량 조회
"""
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import time

from app.config import settings
from app.models.economic import EconomicIndicator, HistoryPoint, MacroData
from app.services.indicator_status import get_indicator_status

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
        "metaphor": "연준의 브레이크 페달",
        "description": "도시 소비자가 구매하는 상품/서비스 가격의 평균 변화를 측정",
        "impact": "높으면 금리 인상 → 주식 하락 압력"
    },
    "M2SL": {
        "name": "M2 통화량",
        "metaphor": "바닷물의 양",
        "description": "현금 + 예금 + MMF 등 유동성이 높은 자산의 총량",
        "impact": "증가 시 자산가격 상승, 감소 시 하락 압력"
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


def get_macro_data(include_history: bool = False) -> MacroData:
    """거시경제 지표 조회 (CPI, M2)"""
    return MacroData(
        cpi=get_fred_indicator("CPIAUCSL", include_history),
        m2=get_fred_indicator("M2SL", include_history)
    )


def get_macro_data_parallel(include_history: bool = False) -> MacroData:
    """거시경제 지표 병렬 조회 (CPI, M2)"""
    from concurrent.futures import ThreadPoolExecutor, as_completed
    import time as time_module
    
    series_ids = ["CPIAUCSL", "M2SL"]
    results = {}
    
    start_time = time_module.time()
    logger.debug(f"FRED 지표 병렬 조회 시작 (include_history={include_history})")
    
    with ThreadPoolExecutor(max_workers=2) as executor:
        future_to_series = {
            executor.submit(get_fred_indicator, series_id, include_history): series_id
            for series_id in series_ids
        }
        
        for future in as_completed(future_to_series):
            series_id = future_to_series[future]
            try:
                results[series_id] = future.result()
            except Exception as e:
                logger.error(f"FRED 지표 조회 실패 ({series_id}): {e}")
                results[series_id] = None
    
    elapsed = time_module.time() - start_time
    logger.debug(f"FRED 지표 병렬 조회 완료: {elapsed:.2f}초")
    
    return MacroData(
        cpi=results.get("CPIAUCSL"),
        m2=results.get("M2SL")
    )


def check_fred_availability() -> Dict[str, Any]:
    """FRED API 사용 가능 여부 확인"""
    return {
        "fredapi_installed": FRED_AVAILABLE,
        "api_key_configured": bool(settings.fred_api_key) if hasattr(settings, 'fred_api_key') else False
    }
