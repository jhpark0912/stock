"""
경제 지표 API 라우터
"""
import logging
from fastapi import APIRouter, Query, Depends
from datetime import datetime
from typing import Literal, Optional
from sqlalchemy.orm import Session

from app.models.economic import (
    EconomicResponse, EconomicData,
    KoreaEconomicResponse, KoreaEconomicData, KoreaRatesData, KoreaMacroData, KoreaFxData,
    AllEconomicResponse, AllEconomicData,
    SectorResponse, SectorData,
    SectorHoldingsResponse, SectorHolding,
    MarketCycleResponse,
    KrMarketCycleResponse
)
from app.services.economic_service import get_all_yahoo_indicators_parallel
from app.services.fred_service import get_macro_data_parallel, check_fred_availability
from app.services.sector_service import get_sector_data, get_sector_holdings
from app.services.korea_economic_service import get_all_korea_indicators, check_ecos_availability
from app.services.auth_service import get_current_user, get_current_user_optional
from app.database.connection import get_db
from app.database.models import UserDB
from app.database.user_repository import UserRepository

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/economic")
async def get_economic_indicators(
    country: Literal["us", "kr", "all"] = Query(
        default="us",
        description="조회할 국가 (us: 미국, kr: 한국, all: 전체)"
    ),
    include_history: bool = Query(
        default=False, 
        description="30일 히스토리 데이터 포함 여부"
    )
):
    """
    경제 지표 조회
    
    **미국 (country=us)**:
    - 금리: 미국채 10년물, 3개월 T-Bill
    - 변동성: VIX
    - 거시경제: CPI, M2 (FRED API 필요)
    - 원자재: WTI 원유, 금
    
    **한국 (country=kr)**:
    - 금리: 국고채 10년물, 한국은행 기준금리
    - 변동성: VKOSPI
    - 거시경제: 소비자물가지수, M2 통화량 (ECOS API 필요)
    - 환율: 원/달러 환율
    
    **전체 (country=all)**:
    - 미국 + 한국 지표 통합 조회
    
    Parameters:
    - country: 조회할 국가 (기본값: us)
    - include_history: true 시 30일 히스토리 포함 (스파크라인용)
    
    Returns:
    - 성공 시: 해당 국가의 경제 지표 데이터
    - 실패 시: 에러 메시지
    """
    try:
        logger.debug(f"경제 지표 조회 요청 (country={country}, include_history={include_history})")
        
        import time
        start_time = time.time()
        
        # 미국 지표만 조회
        if country == "us":
            return await _get_us_indicators(include_history)
        
        # 한국 지표만 조회
        elif country == "kr":
            return await _get_kr_indicators(include_history)
        
        # 전체 조회
        else:
            return await _get_all_indicators(include_history)
        
    except Exception as e:
        logger.error(f"경제 지표 조회 실패: {e}")
        return {"success": False, "error": str(e)}


async def _get_us_indicators(include_history: bool) -> EconomicResponse:
    """미국 경제 지표 조회"""
    import time
    from concurrent.futures import ThreadPoolExecutor
    
    start_time = time.time()
    
    # Yahoo + FRED 병렬 조회
    with ThreadPoolExecutor(max_workers=2) as executor:
        yahoo_future = executor.submit(get_all_yahoo_indicators_parallel, include_history)
        fred_future = executor.submit(get_macro_data_parallel, include_history)
        
        yahoo_data = yahoo_future.result()
        macro_data = fred_future.result()
    
    elapsed = time.time() - start_time
    logger.debug(f"미국 경제 지표 조회 완료: {elapsed:.2f}초")
    
    # 응답 구성
    economic_data = EconomicData(
        rates=yahoo_data["rates"],
        macro=macro_data,
        commodities=yahoo_data["commodities"],
        last_updated=datetime.now().isoformat()
    )
    
    # 조회된 지표 개수 로깅
    total_indicators = sum([
        1 for ind in [
            economic_data.rates.treasury_10y,
            economic_data.rates.treasury_3m,
            economic_data.rates.vix,
            economic_data.macro.cpi,
            economic_data.macro.m2,
            economic_data.commodities.wti_oil,
            economic_data.commodities.gold
        ] if ind
    ])
    
    logger.debug(f"미국 경제 지표 조회 완료: {total_indicators}개 지표")
    
    return EconomicResponse(
        success=True,
        data=economic_data
    )


async def _get_kr_indicators(include_history: bool) -> KoreaEconomicResponse:
    """한국 경제 지표 조회"""
    import time
    
    start_time = time.time()
    
    kr_data = get_all_korea_indicators(include_history)
    
    elapsed = time.time() - start_time
    logger.debug(f"한국 경제 지표 조회 완료: {elapsed:.2f}초")
    
    # 응답 구성
    korea_data = KoreaEconomicData(
        rates=KoreaRatesData(
            bond_10y=kr_data["rates"]["bond_10y"],
            base_rate=kr_data["rates"]["base_rate"],
            credit_spread=kr_data["rates"]["credit_spread"]
        ),
        macro=KoreaMacroData(
            cpi=kr_data["macro"]["cpi"],
            m2=kr_data["macro"]["m2"]
        ),
        fx=KoreaFxData(
            usd_krw=kr_data["fx"]["usd_krw"]
        ),
        last_updated=datetime.now().isoformat()
    )

    # 조회된 지표 개수 로깅
    total_indicators = sum([
        1 for ind in [
            korea_data.rates.bond_10y,
            korea_data.rates.base_rate,
            korea_data.rates.credit_spread,
            korea_data.macro.cpi,
            korea_data.macro.m2,
            korea_data.fx.usd_krw
        ] if ind
    ])
    
    logger.debug(f"한국 경제 지표 조회 완료: {total_indicators}개 지표")
    
    return KoreaEconomicResponse(
        success=True,
        data=korea_data
    )


async def _get_all_indicators(include_history: bool) -> AllEconomicResponse:
    """미국 + 한국 경제 지표 통합 조회"""
    import time
    from concurrent.futures import ThreadPoolExecutor
    
    start_time = time.time()
    
    # 미국 + 한국 병렬 조회
    with ThreadPoolExecutor(max_workers=3) as executor:
        yahoo_future = executor.submit(get_all_yahoo_indicators_parallel, include_history)
        fred_future = executor.submit(get_macro_data_parallel, include_history)
        korea_future = executor.submit(get_all_korea_indicators, include_history)
        
        yahoo_data = yahoo_future.result()
        macro_data = fred_future.result()
        kr_data = korea_future.result()
    
    elapsed = time.time() - start_time
    logger.debug(f"전체 경제 지표 조회 완료: {elapsed:.2f}초")
    
    # 미국 데이터
    us_data = EconomicData(
        rates=yahoo_data["rates"],
        macro=macro_data,
        commodities=yahoo_data["commodities"],
        last_updated=datetime.now().isoformat()
    )
    
    # 한국 데이터
    kr_economic_data = KoreaEconomicData(
        rates=KoreaRatesData(
            bond_10y=kr_data["rates"]["bond_10y"],
            base_rate=kr_data["rates"]["base_rate"],
            credit_spread=kr_data["rates"]["credit_spread"]
        ),
        macro=KoreaMacroData(
            cpi=kr_data["macro"]["cpi"],
            m2=kr_data["macro"]["m2"]
        ),
        fx=KoreaFxData(
            usd_krw=kr_data["fx"]["usd_krw"]
        ),
        last_updated=datetime.now().isoformat()
    )
    
    # 통합 응답
    all_data = AllEconomicData(
        us=us_data,
        kr=kr_economic_data
    )
    
    return AllEconomicResponse(
        success=True,
        data=all_data
    )


@router.get("/economic/status")
async def get_economic_status():
    """
    경제 지표 서비스 상태 확인
    
    Returns:
    - FRED API 상태 (미국 거시경제)
    - Yahoo Finance 상태
    - ECOS API 상태 (한국 경제지표)
    """
    from app.services.economic_service import YAHOOQUERY_AVAILABLE
    
    fred_status = check_fred_availability()
    ecos_status = check_ecos_availability()
    
    return {
        "yahoo": {
            "available": YAHOOQUERY_AVAILABLE
        },
        "fred": fred_status,
        "ecos": ecos_status
    }


@router.get("/economic/sectors", response_model=SectorResponse)
async def get_sector_performance(
    country: str = Query('us', regex='^(us|kr|all)$', description="국가 선택: us, kr, all")
):
    """
    섹터 ETF 성과 데이터 조회
    
    미국 GICS 11개 섹터 ETF 또는 한국 KODEX 섹터 ETF의 가격 및 변화율 조회
    
    Parameters:
    - country: 'us' (미국 11개), 'kr' (한국 9개), 'all' (전체 20개)
    
    Returns:
    - 성공 시: 섹터 ETF 데이터 (현재가, 1D/1W/1M 변화율)
    - 실패 시: 에러 메시지
    """
    try:
        logger.debug(f"섹터 ETF 데이터 조회 요청 (country={country})")
        
        sectors = await get_sector_data(country)
        
        if not sectors:
            return SectorResponse(
                success=False,
                error="섹터 데이터를 조회할 수 없습니다."
            )
        
        sector_data = [SectorData(**s) for s in sectors]
        
        logger.debug(f"섹터 ETF 조회 완료: {len(sector_data)}개 (country={country})")
        
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
async def get_sector_holdings_api(
    symbol: str,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    섹터 ETF 보유 종목 조회 (인증 필요)

    특정 섹터 ETF의 상위 보유 종목을 조회합니다.

    Parameters:
    - symbol: 섹터 ETF 심볼
      - 미국: XLK, XLF, XLV 등
      - 한국: 091160.KS, 091170.KS 등 (KIS API 키 필수)

    Returns:
    - 성공 시: 상위 보유 종목 (심볼, 종목명, 비중, 현재가, 변화율)
    - 실패 시: 에러 메시지 (한국 섹터의 경우 requires_kis_key=True 포함)

    Notes:
    - 한국 섹터는 한국투자증권 API 키 필수
    - API 키가 없으면 키 입력 요구 (requires_kis_key=True)
    - Admin은 환경변수 키를 사용할 수 있음
    """
    try:
        logger.debug(f"섹터 보유 종목 조회 요청: {symbol}")
        
        # 한국 섹터인지 확인 (.KS 접미사)
        if symbol.endswith('.KS'):
            from app.services.korea_sector_service import get_korea_sector_holdings

            # KIS API 인증정보 조회
            user_repo = UserRepository(db)
            kis_credentials = user_repo.get_kis_credentials(current_user.id)

            if kis_credentials:
                logger.debug(f"   사용자 {current_user.username}의 KIS 인증정보 확인")
            else:
                # Admin인 경우 환경변수 키 사용 (fallback)
                if current_user.role == "admin":
                    from app.config import settings
                    if settings.kis_app_key and settings.kis_app_secret:
                        logger.debug(f"   Admin 사용자 - 환경변수 KIS 키 사용")
                        kis_credentials = (settings.kis_app_key, settings.kis_app_secret)
                    else:
                        logger.debug(f"   환경변수에 KIS 키 없음 - API 키 필요")
                        return SectorHoldingsResponse(
                            success=False,
                            error="한국 섹터 ETF 구성종목을 조회하려면 한국투자증권 API 키가 필요합니다.",
                            requires_kis_key=True
                        )
                else:
                    logger.debug(f"   KIS 인증정보 없음 - API 키 필요")
                    return SectorHoldingsResponse(
                        success=False,
                        error="한국 섹터 ETF 구성종목을 조회하려면 한국투자증권 API 키가 필요합니다.",
                        requires_kis_key=True
                    )

            result = await get_korea_sector_holdings(symbol, kis_credentials)
        else:
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
            last_updated=datetime.now().isoformat(),
            note=result.get("note")
        )
        
    except Exception as e:
        logger.error(f"섹터 보유 종목 조회 실패 ({symbol}): {e}")
        return SectorHoldingsResponse(
            success=False,
            error=str(e)
        )


@router.get("/economic/market-cycle")
async def get_market_cycle(
    country: Literal["us", "kr"] = Query(
        default="us",
        description="조회할 국가 (us: 미국, kr: 한국)"
    )
):
    """
    시장 사이클 (경기 계절) 조회

    **미국 (country=us)**:
    - INDPRO, CPI, VIX/금리차 기반으로 시장을 4계절로 분류
    - 봄 (회복기): INDPRO 상승, 저물가
    - 여름 (활황기): INDPRO 1.5%+, 양호한 물가
    - 가을 (후퇴기): INDPRO 하락, 고물가
    - 겨울 (침체기): INDPRO 마이너스, 디플레

    **한국 (country=kr)**:
    - 수출, CPI, 신용 스프레드 기반으로 시장을 4계절로 분류
    - 봄 (회복기): 수출 0~10% 상승, 저물가
    - 여름 (활황기): 수출 10%+, 양호한 물가
    - 가을 (후퇴기): 수출 하락세, 고물가
    - 겨울 (침체기): 수출 역성장, 고위험

    Parameters:
    - country: 조회할 국가 (기본값: us)

    Returns:
    - 성공 시: 시장 사이클 데이터 (계절, 지표, 신뢰도)
    - 실패 시: 에러 메시지
    """
    try:
        logger.debug(f"시장 사이클 조회 요청 (country={country})")

        if country == "us":
            from app.services.market_cycle_service import get_real_market_cycle
            cycle_data = get_real_market_cycle()
            logger.debug(f"미국 시장 사이클 조회 완료: {cycle_data.season}")
            return MarketCycleResponse(success=True, data=cycle_data)
        else:  # kr
            from app.services.kr_market_cycle_service import get_real_kr_market_cycle, get_sample_kr_market_cycle
            try:
                cycle_data = get_real_kr_market_cycle()
                logger.debug(f"한국 시장 사이클 조회 완료: {cycle_data.season}")
            except Exception as kr_error:
                logger.warning(f"한국 시장 사이클 실제 데이터 조회 실패, 샘플 데이터 반환: {kr_error}")
                cycle_data = get_sample_kr_market_cycle()
            return KrMarketCycleResponse(success=True, data=cycle_data)

    except Exception as e:
        logger.error(f"시장 사이클 조회 실패 (country={country}): {e}", exc_info=True)
        if country == "us":
            return MarketCycleResponse(success=False, error=str(e))
        else:
            return KrMarketCycleResponse(success=False, error=str(e))


@router.get("/economic/market-cycle/analysis")
async def get_market_cycle_with_ai(
    country: Literal["us", "kr"] = Query(
        default="us",
        description="조회할 국가 (us: 미국, kr: 한국)"
    )
):
    """
    시장 사이클 + AI 분석 조회 (Admin 전용)

    기본 시장 사이클 데이터에 Gemini AI 기반 멘토 코멘트 추가

    Parameters:
    - country: 조회할 국가 (기본값: us)

    Returns:
    - 성공 시: 시장 사이클 데이터 + AI 코멘트/추천
    - 실패 시: 에러 메시지

    Note:
    - Gemini API 키 필요 (환경 변수 GEMINI_API_KEY)
    - Admin 권한 필요 (향후 추가)
    """
    try:
        from app.config import settings

        logger.debug(f"시장 사이클 AI 분석 조회 요청 (country={country})")

        # Gemini API 키 확인 (Secret Manager 또는 .env)
        api_key = settings.gemini_api_key

        if country == "us":
            from app.services.market_cycle_service import get_real_market_cycle, generate_ai_comment

            cycle_data = get_real_market_cycle()

            if not api_key:
                logger.warning("GEMINI_API_KEY 없음 - AI 코멘트 생략")
                return MarketCycleResponse(success=True, data=cycle_data)

            # AI 코멘트 생성
            try:
                ai_result = generate_ai_comment(cycle_data, api_key)
                cycle_data.ai_comment = ai_result['comment']
                cycle_data.ai_recommendation = ai_result['recommendation']
                cycle_data.ai_risk = ai_result.get('risk')
                logger.debug(f"AI 코멘트 생성 완료: {len(ai_result['comment'])}자")
            except Exception as ai_error:
                logger.error(f"AI 코멘트 생성 실패 (무시): {ai_error}")

            return MarketCycleResponse(success=True, data=cycle_data)

        else:  # kr
            from app.services.kr_market_cycle_service import get_real_kr_market_cycle, get_sample_kr_market_cycle, generate_kr_ai_comment

            # 실제 데이터 조회 (실패 시 샘플 데이터)
            try:
                cycle_data = get_real_kr_market_cycle()
            except Exception as kr_error:
                logger.warning(f"한국 시장 사이클 실제 데이터 조회 실패, 샘플 데이터 반환: {kr_error}")
                cycle_data = get_sample_kr_market_cycle()

            if not api_key:
                logger.warning("GEMINI_API_KEY 없음 - AI 코멘트 생략")
                return KrMarketCycleResponse(success=True, data=cycle_data)

            # AI 코멘트 생성
            try:
                ai_result = generate_kr_ai_comment(cycle_data, api_key)
                cycle_data.ai_comment = ai_result['comment']
                cycle_data.ai_recommendation = ai_result['recommendation']
                cycle_data.ai_risk = ai_result.get('risk')
                logger.debug(f"AI 코멘트 생성 완료: {len(ai_result['comment'])}자")
            except Exception as ai_error:
                logger.error(f"AI 코멘트 생성 실패 (무시): {ai_error}")

            return KrMarketCycleResponse(success=True, data=cycle_data)

    except Exception as e:
        logger.error(f"시장 사이클 AI 분석 조회 실패 (country={country}): {e}", exc_info=True)
        if country == "us":
            return MarketCycleResponse(success=False, error=str(e))
        else:
            return KrMarketCycleResponse(success=False, error=str(e))



@router.get("/economic/market-review/{country}")
async def get_market_review_api(
    country: Literal["us", "kr"] = "kr",
    current_user: Optional[UserDB] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """
    증시 마감 리뷰 조회

    **한국 (country=kr)**:
    - 마감 시간: 15:30 KST
    - 지수: KOSPI, KOSDAQ
    - 급등/급락 종목 Top 5 (KIS API 사용 - 로그인 및 KIS 키 필요)
    - 섹터 등락률
    - 시총 Top 5 (KOSPI/KOSDAQ)

    **미국 (country=us)**:
    - 마감 시간: 16:00 EST
    - 지수: S&P 500, NASDAQ, DOW
    - 급등/급락 종목 Top 5
    - 섹터 등락률
    - 시총 Top 5

    Parameters:
    - country: 조회할 국가 (기본값: kr)

    Returns:
    - 성공 시: 마감 리뷰 데이터
    - 실패 시: 에러 메시지

    Notes:
    - 장 마감 후 데이터는 다음 거래일까지 캐시됩니다
    - 한국 급등/급락 종목은 로그인 후 사용자별 KIS API 키 필요
    - KIS 키가 없으면 급등/급락 데이터는 빈 배열로 반환
    """
    from app.models.economic import MarketReviewResponse
    from app.services.market_review_service import get_market_review

    try:
        logger.debug(f"증시 마감 리뷰 조회 요청 (country={country})")

        # KIS API 자격 증명 (한국 급등/급락 조회용)
        kis_app_key = None
        kis_app_secret = None

        if country == "kr" and current_user:
            # 로그인한 사용자의 KIS 자격 증명 조회
            user_repo = UserRepository(db)
            kis_credentials = user_repo.get_kis_credentials(current_user.id)
            if kis_credentials:
                kis_app_key, kis_app_secret = kis_credentials
                logger.debug(f"사용자 KIS 자격 증명 사용 (user_id={current_user.id})")
            else:
                logger.debug(f"사용자 KIS 자격 증명 없음 (user_id={current_user.id})")

        review_data = await get_market_review(
            country,
            kis_app_key=kis_app_key,
            kis_app_secret=kis_app_secret
        )

        logger.debug(f"증시 마감 리뷰 조회 완료 (country={country})")

        return MarketReviewResponse(
            success=True,
            data=review_data,
        )

    except Exception as e:
        logger.error(f"증시 마감 리뷰 조회 실패 (country={country}): {e}", exc_info=True)
        return MarketReviewResponse(
            success=False,
            error=str(e),
        )


@router.post("/economic/market-review/{country}/ai")
async def generate_market_review_ai_api(
    country: Literal["us", "kr"] = "kr",
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    AI 마감 리뷰 분석 생성

    Gemini AI를 사용하여 오늘의 시장을 분석합니다.

    Parameters:
    - country: 분석할 국가 (기본값: kr)

    Returns:
    - 성공 시: AI 분석 결과 (오늘의 포인트, 섹터 인사이트, 내일 전망)
    - 실패 시: 에러 메시지

    Notes:
    - 로그인 필요
    - Gemini API 키 필요 (사용자 API 키 또는 환경변수)
    """
    from app.models.economic import MarketReviewAIResponse
    from app.services.market_review_service import get_market_review, generate_market_review_ai
    from app.database.user_repository import UserRepository
    from app.config import settings

    try:
        logger.debug(f"AI 마감 리뷰 분석 요청 (country={country}, user={current_user.username})")

        # Gemini API 키 조회
        user_repo = UserRepository(db)
        api_key = user_repo.get_gemini_api_key(current_user.id)

        if not api_key:
            # Admin인 경우 환경변수 키 사용
            if current_user.role == "admin" and settings.gemini_api_key:
                api_key = settings.gemini_api_key
            else:
                return MarketReviewAIResponse(
                    success=False,
                    error="AI 분석을 위해 Gemini API 키가 필요합니다.",
                )

        # 마감 리뷰 데이터 조회
        review_data = await get_market_review(country)

        # AI 분석 생성
        ai_result = await generate_market_review_ai(review_data, api_key)

        logger.debug(f"AI 마감 리뷰 분석 완료 (country={country})")

        return MarketReviewAIResponse(
            success=True,
            data=ai_result,
        )

    except Exception as e:
        logger.error(f"AI 마감 리뷰 분석 실패 (country={country}): {e}", exc_info=True)
        return MarketReviewAIResponse(
            success=False,
            error=str(e),
        )
