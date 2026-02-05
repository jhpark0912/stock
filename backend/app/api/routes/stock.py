"""
주식 데이터 API 엔드포인트
"""
import logging
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session
from app.models.stock import (
    StockResponse, StockData, NewsResponse, NewsItem, 
    AnalysisResponse, AIAnalysis, ChartResponse
)
from app.services.stock_service import StockService
from app.services.auth_service import get_current_user
from app.database.connection import get_db
from app.database.user_repository import UserRepository
from app.database.repository import PortfolioRepository
from app.database.models import UserDB

logger = logging.getLogger(__name__)

router = APIRouter()
stock_service = StockService()

logger.info("📌 Stock 라우터 초기화 완료")


@router.get("/stock/{ticker}", response_model=StockResponse)
async def get_stock(
    ticker: str,
    include_technical: bool = Query(False, description="기술적 지표 포함 여부"),
    include_chart: bool = Query(False, description="차트 데이터 포함 여부")
) -> StockResponse:
    """
    주식 실시간 데이터 조회

    Args:
        ticker: 주식 티커 심볼 (예: AAPL, TSLA, GOOGL)
        include_technical: 기술적 지표 포함 여부 (기본값: False)
        include_chart: 차트 데이터 포함 여부 (기본값: False)

    Returns:
        StockResponse: 주식 데이터 또는 에러 정보

    Examples:
        - GET /api/stock/AAPL
        - GET /api/stock/AAPL?include_technical=true
        - GET /api/stock/AAPL?include_technical=true&include_chart=true
        - GET /api/stock/TSLA
    """
    logger.info(f"📈 주식 데이터 조회: GET /stock/{ticker}")
    try:
        stock_data = stock_service.get_stock_data(
            ticker,
            include_technical=include_technical,
            include_chart=include_chart
        )
        return StockResponse(
            success=True,
            data=stock_data,
            error=None
        )
    except ValueError as e:
        # 429 에러에 대해 HTTP 상태 코드 429 반환
        if "429" in str(e) or "요청 제한 초과" in str(e):
            raise HTTPException(status_code=429, detail=str(e))
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"서버 내부 오류: {str(e)}")

@router.get("/stock/{ticker}/news", response_model=NewsResponse)
async def get_stock_news(
    ticker: str
) -> NewsResponse:
    """
    주식 뉴스 데이터 조회

    Args:
        ticker: 주식 티커 심볼 (예: AAPL, TSLA, GOOGL)

    Returns:
        NewsResponse: 뉴스 데이터 또는 에러 정보

    Examples:
        - GET /api/stock/AAPL/news
    """
    logger.info(f"📰 뉴스 조회: GET /stock/{ticker}/news")
    try:
        news_data = stock_service.get_news(ticker)
        return NewsResponse(
            success=True,
            data=news_data,
            error=None
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"서버 내부 오류: {str(e)}")


@router.get("/stock/{ticker}/chart-data", response_model=ChartResponse)
async def get_chart_data(
    ticker: str,
    period: str = Query("1y", description="차트 데이터 기간 (예: 1y, 2y, 5y, max)")
) -> ChartResponse:
    """
    차트용 시계열 데이터 조회 (기술적 지표 포함)

    Args:
        ticker: 주식 티커 심볼
        period: 조회 기간

    Returns:
        ChartResponse: 차트 데이터 또는 에러 정보
    """
    try:
        chart_data = stock_service.get_chart_data(ticker, period)
        return ChartResponse(
            success=True,
            data=chart_data,
            error=None
        )
    except ValueError as e:
        if "429" in str(e) or "요청 제한 초과" in str(e):
            raise HTTPException(status_code=429, detail=str(e))
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"서버 내부 오류: {str(e)}")


@router.post("/stock/{ticker}/analysis", response_model=AnalysisResponse)
async def get_stock_analysis(
    ticker: str,
    stock_data: StockData,
    current_user: UserDB = Depends(get_current_user),  # 인증 필수
    db: Session = Depends(get_db)
) -> AnalysisResponse:
    """
    Gemini AI를 이용한 종합 주식 분석

    ⚠️ 이 엔드포인트는 POST 메서드를 사용합니다.
    프론트엔드에서 이미 조회한 주식 데이터를 전송하여
    Yahoo Finance API 중복 호출을 방지합니다.

    **🔐 인증 필수**: 로그인한 사용자만 사용 가능
    **🔑 API 키 필수**: 사용자의 Gemini API 키가 등록되어 있어야 함

    Args:
        ticker: 주식 티커 심볼 (예: AAPL, TSLA, GOOGL)
        stock_data: 이미 조회된 주식 데이터 (기술적 지표 포함 권장)
        current_user: 현재 로그인한 사용자 (자동 주입)
        db: 데이터베이스 세션 (자동 주입)

    Returns:
        AnalysisResponse: AI 분석 보고서 또는 에러 정보

    Example:
        POST /api/stock/AAPL/analysis
        Headers: { "Authorization": "Bearer <token>" }
        Body: { "ticker": "AAPL", "timestamp": "2024-01-01T00:00:00", ... }
    """
    logger.info(f"💡 분석 요청 수신: POST /stock/{ticker}/analysis")
    logger.info(f"   👤 사용자: {current_user.username}")
    logger.info(f"   📊 데이터 티커: {stock_data.ticker}")
    
    try:
        # 유저의 Gemini API 키 조회
        user_repo = UserRepository(db)
        gemini_key = user_repo.get_gemini_key(current_user.id)
        
        # API 키가 없는 경우
        if not gemini_key:
            # Admin인 경우 환경변수 키 사용 (fallback)
            if current_user.role == "admin":
                from app.config import settings
                if settings.gemini_api_key:
                    logger.info(f"   🔑 Admin 사용자 - 환경변수 API 키 사용")
                    gemini_key = settings.gemini_api_key
                else:
                    logger.error(f"   ❌ 환경변수에 Gemini API 키가 설정되지 않음")
                    raise HTTPException(
                        status_code=500,
                        detail="서버에 Gemini API 키가 설정되지 않았습니다. 관리자에게 문의하세요."
                    )
            else:
                # 일반 유저는 반드시 자신의 키를 등록해야 함
                logger.error(f"   ❌ Gemini API 키 없음 (사용자: {current_user.username})")
                raise HTTPException(
                    status_code=400,
                    detail="Gemini API 키가 등록되지 않았습니다. 설정에서 API 키를 등록해주세요."
                )
        else:
            logger.info(f"   🔑 사용자 API 키 확인 완료")
        
        # 티커 일치 여부 확인
        if stock_data.ticker.upper() != ticker.upper():
            logger.error(f"   ❌ 티커 불일치: URL={ticker}, Body={stock_data.ticker}")
            raise ValueError(
                f"URL의 티커({ticker})와 요청 본문의 티커({stock_data.ticker})가 일치하지 않습니다."
            )

        logger.info(f"   ✅ 티커 일치 확인 완료")
        
        # 포트폴리오에서 평단가 정보 조회
        portfolio_repo = PortfolioRepository()
        portfolio_item = portfolio_repo.get_by_ticker(db, ticker)
        
        user_avg_price = None
        user_profit_loss_ratio = None
        user_weight = None
        
        if portfolio_item and portfolio_item.purchase_price:
            user_avg_price = float(portfolio_item.purchase_price)
            if portfolio_item.profit_percent:
                user_profit_loss_ratio = float(portfolio_item.profit_percent)
            logger.info(f"   📊 포트폴리오 정보: 평단가={user_avg_price}, 수익률={user_profit_loss_ratio}%")
        else:
            logger.info(f"   📊 포트폴리오 정보 없음 - 일반 분석 진행")
        
        logger.info(f"   🤖 Gemini AI 분석 시작...")
        
        # Gemini AI로 분석 (유저 API 키 + 평단가 정보 사용)
        analysis_result = await stock_service.get_comprehensive_analysis(
            stock_data,
            user_api_key=gemini_key,
            user_avg_price=user_avg_price,
            user_profit_loss_ratio=user_profit_loss_ratio,
            user_weight=user_weight
        )

        logger.info(f"   ✅ Gemini AI 분석 완료")
        
        return AnalysisResponse(
            success=True,
            data=analysis_result,
            error=None
        )
    except ValueError as e:
        logger.error(f"   ❌ ValueError: {str(e)}")
        if "API 키가 설정되지 않았습니다" in str(e):
             raise HTTPException(status_code=500, detail=str(e))
        if "429" in str(e) or "요청 제한 초과" in str(e):
            raise HTTPException(status_code=429, detail=str(e))
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"   ❌ Exception: {str(e)}")
        raise HTTPException(status_code=500, detail=f"서버 내부 오류: {str(e)}")
