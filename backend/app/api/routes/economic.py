"""
경제 지표 API 라우터
"""
import logging
from fastapi import APIRouter, Query
from datetime import datetime

from app.models.economic import (
    EconomicResponse, EconomicData, 
    SectorResponse, SectorData,
    SectorHoldingsResponse, SectorHolding,
    MarketCycleResponse
)
from app.services.economic_service import get_all_yahoo_indicators_parallel
from app.services.fred_service import get_macro_data_parallel, check_fred_availability
from app.services.sector_service import get_sector_data, get_sector_holdings

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


@router.get("/economic/sectors", response_model=SectorResponse)
async def get_sector_performance():
    """
    섹터 ETF 성과 데이터 조회
    
    GICS 11개 섹터 ETF의 가격 및 변화율 조회
    - XLK (기술), XLF (금융), XLV (헬스케어), XLE (에너지)
    - XLI (산업재), XLB (소재), XLY (경기소비재), XLP (필수소비재)
    - XLRE (부동산), XLU (유틸리티), XLC (커뮤니케이션)
    
    Returns:
    - 성공 시: 11개 섹터 ETF 데이터 (현재가, 1D/1W/1M 변화율)
    - 실패 시: 에러 메시지
    """
    try:
        logger.debug("섹터 ETF 데이터 조회 요청")
        
        sectors = await get_sector_data()
        
        if not sectors:
            return SectorResponse(
                success=False,
                error="섹터 데이터를 조회할 수 없습니다."
            )
        
        sector_data = [SectorData(**s) for s in sectors]
        
        logger.debug(f"섹터 ETF 조회 완료: {len(sector_data)}개")
        
        return SectorResponse(
            success=True,
            data=sector_data,
            last_updated=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"섹터 ETF 조회 실패: {e}")
        return SectorResponse(
            success=False,
            error=str(e)
        )


@router.get("/economic/sectors/{symbol}/holdings", response_model=SectorHoldingsResponse)
async def get_sector_holdings_api(symbol: str):
    """
    섹터 ETF 보유 종목 조회
    
    특정 섹터 ETF의 상위 10개 보유 종목을 조회합니다.
    
    Parameters:
    - symbol: 섹터 ETF 심볼 (예: XLK, XLF, XLV 등)
    
    Returns:
    - 성공 시: 상위 10개 보유 종목 (심볼, 종목명, 비중, 현재가, 변화율)
    - 실패 시: 에러 메시지
    """
    try:
        logger.debug(f"섹터 보유 종목 조회 요청: {symbol}")
        
        result = await get_sector_holdings(symbol)
        
        if not result:
            return SectorHoldingsResponse(
                success=False,
                error=f"'{symbol}' 섹터의 보유 종목을 조회할 수 없습니다."
            )
        
        holdings = [SectorHolding(**h) for h in result["holdings"]]
        
        logger.debug(f"섹터 보유 종목 조회 완료: {symbol} ({len(holdings)}개)")
        
        return SectorHoldingsResponse(
            success=True,
            sector_symbol=result["sector_symbol"],
            sector_name=result["sector_name"],
            holdings=holdings,
            last_updated=datetime.now().isoformat()
        )
        
    except Exception as e:
        logger.error(f"섹터 보유 종목 조회 실패 ({symbol}): {e}")
        return SectorHoldingsResponse(
            success=False,
            error=str(e)
        )


@router.get("/economic/market-cycle", response_model=MarketCycleResponse)
async def get_market_cycle():
    """
    시장 사이클 (경기 계절) 조회

    PMI, CPI, VIX/금리차 기반으로 시장을 4계절로 분류:
    - 봄 (회복기): PMI 상승, 저물가
    - 여름 (활황기): PMI 50+, 양호한 물가
    - 가을 (후퇴기): PMI 하락, 고물가
    - 겨울 (침체기): PMI 50-, 디플레

    Returns:
    - 성공 시: 시장 사이클 데이터 (계절, 지표, 신뢰도)
    - 실패 시: 에러 메시지
    """
    try:
        logger.debug("시장 사이클 조회 요청")

        # Phase 2: 실제 데이터 기반 판단
        from app.services.market_cycle_service import get_real_market_cycle

        cycle_data = get_real_market_cycle()

        logger.debug(f"시장 사이클 조회 완료: {cycle_data.season}")

        return MarketCycleResponse(
            success=True,
            data=cycle_data
        )

    except Exception as e:
        logger.error(f"시장 사이클 조회 실패: {e}", exc_info=True)
        return MarketCycleResponse(
            success=False,
            error=str(e)
        )


@router.get("/economic/market-cycle/analysis", response_model=MarketCycleResponse)
async def get_market_cycle_with_ai():
    """
    시장 사이클 + AI 분석 조회 (Admin 전용)

    기본 시장 사이클 데이터에 Gemini AI 기반 멘토 코멘트 추가

    Returns:
    - 성공 시: 시장 사이클 데이터 + AI 코멘트/추천
    - 실패 시: 에러 메시지

    Note:
    - Gemini API 키 필요 (환경 변수 GEMINI_API_KEY)
    - Admin 권한 필요 (향후 추가)
    """
    try:
        import os
        from app.services.market_cycle_service import get_real_market_cycle, generate_ai_comment

        logger.debug("시장 사이클 AI 분석 조회 요청")

        # Phase 2: 실제 데이터 기반 판단
        cycle_data = get_real_market_cycle()

        # Gemini API 키 확인
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            logger.warning("GEMINI_API_KEY 없음 - AI 코멘트 생략")
            return MarketCycleResponse(
                success=True,
                data=cycle_data
            )

        # AI 코멘트 생성
        try:
            ai_result = generate_ai_comment(cycle_data, api_key)
            cycle_data.ai_comment = ai_result['comment']
            cycle_data.ai_recommendation = ai_result['recommendation']
            cycle_data.ai_risk = ai_result.get('risk')

            logger.debug(f"AI 코멘트 생성 완료: {len(ai_result['comment'])}자")

        except Exception as ai_error:
            logger.error(f"AI 코멘트 생성 실패 (무시): {ai_error}")
            # AI 실패해도 기본 데이터는 반환

        return MarketCycleResponse(
            success=True,
            data=cycle_data
        )

    except Exception as e:
        logger.error(f"시장 사이클 AI 분석 조회 실패: {e}", exc_info=True)
        return MarketCycleResponse(
            success=False,
            error=str(e)
        )
