"""
경제 지표 API 라우터
"""
import logging
from fastapi import APIRouter, Query
from datetime import datetime

from app.models.economic import EconomicResponse, EconomicData
from app.services.economic_service import get_all_yahoo_indicators_parallel
from app.services.fred_service import get_macro_data_parallel, check_fred_availability

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/economic", response_model=EconomicResponse)
async def get_economic_indicators(
    include_history: bool = Query(
        default=False, 
        description="30일 히스토리 데이터 포함 여부"
    )
):
    """
    경제 지표 조회
    
    - 금리: 미국채 10년물, 3개월 T-Bill
    - 변동성: VIX
    - 거시경제: CPI, M2 (FRED API 필요)
    - 원자재: WTI 원유, 금
    
    Parameters:
    - include_history: true 시 30일 히스토리 포함 (스파크라인용)
    
    Returns:
    - 성공 시: 모든 경제 지표 데이터
    - 실패 시: 에러 메시지
    """
    try:
        logger.debug(f"경제 지표 조회 요청 (include_history={include_history})")
        
        import time
        start_time = time.time()
        
        # Yahoo + FRED 병렬 조회
        from concurrent.futures import ThreadPoolExecutor
        
        with ThreadPoolExecutor(max_workers=2) as executor:
            yahoo_future = executor.submit(get_all_yahoo_indicators_parallel, include_history)
            fred_future = executor.submit(get_macro_data_parallel, include_history)
            
            yahoo_data = yahoo_future.result()
            macro_data = fred_future.result()
        
        elapsed = time.time() - start_time
        logger.debug(f"전체 경제 지표 조회 완료: {elapsed:.2f}초")
        
        # 응답 구성
        economic_data = EconomicData(
            rates=yahoo_data["rates"],
            macro=macro_data,
            commodities=yahoo_data["commodities"],
            last_updated=datetime.now().isoformat()
        )
        
        # 조회된 지표 개수 로깅
        total_indicators = 0
        if economic_data.rates.treasury_10y:
            total_indicators += 1
        if economic_data.rates.treasury_3m:
            total_indicators += 1
        if economic_data.rates.vix:
            total_indicators += 1
        if economic_data.macro.cpi:
            total_indicators += 1
        if economic_data.macro.m2:
            total_indicators += 1
        if economic_data.commodities.wti_oil:
            total_indicators += 1
        if economic_data.commodities.gold:
            total_indicators += 1
        
        logger.debug(f"경제 지표 조회 완료: {total_indicators}개 지표")
        
        return EconomicResponse(
            success=True,
            data=economic_data
        )
        
    except Exception as e:
        logger.error(f"경제 지표 조회 실패: {e}")
        return EconomicResponse(
            success=False,
            error=str(e)
        )


@router.get("/economic/status")
async def get_economic_status():
    """
    경제 지표 서비스 상태 확인
    
    Returns:
    - FRED API 상태
    - Yahoo Finance 상태
    """
    from app.services.economic_service import YAHOOQUERY_AVAILABLE
    
    fred_status = check_fred_availability()
    
    return {
        "yahoo": {
            "available": YAHOOQUERY_AVAILABLE
        },
        "fred": fred_status
    }
