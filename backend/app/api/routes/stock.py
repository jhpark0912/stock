"""
주식 데이터 API 엔드포인트
"""
from fastapi import APIRouter, HTTPException, Query
from app.models.stock import StockResponse, StockData, NewsResponse, NewsItem, AnalysisResponse, AIAnalysis
from app.services.stock_service import StockService

router = APIRouter()
stock_service = StockService()


@router.get("/stock/{ticker}", response_model=StockResponse)
async def get_stock(
    ticker: str,
    include_technical: bool = Query(False, description="기술적 지표 포함 여부")
) -> StockResponse:
    """
    주식 실시간 데이터 조회

    Args:
        ticker: 주식 티커 심볼 (예: AAPL, TSLA, GOOGL)
        include_technical: 기술적 지표 포함 여부 (기본값: False)

    Returns:
        StockResponse: 주식 데이터 또는 에러 정보

    Examples:
        - GET /api/stock/AAPL
        - GET /api/stock/AAPL?include_technical=true
        - GET /api/stock/TSLA
    """
    try:
        stock_data = stock_service.get_stock_data(ticker, include_technical=include_technical)
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
        # 상세 오류 로깅 (실제 운영 환경에서는 로거 사용)
        print(f"Unhandled error in get_stock: {e}")
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
        print(f"Unhandled error in get_stock_news: {e}")
        raise HTTPException(status_code=500, detail=f"서버 내부 오류: {str(e)}")

@router.get("/stock/{ticker}/analysis", response_model=AnalysisResponse)
async def get_stock_analysis(
    ticker: str
) -> AnalysisResponse:
    """
    Gemini AI를 이용한 종합 주식 분석

    Args:
        ticker: 주식 티커 심볼 (예: AAPL, TSLA, GOOGL)

    Returns:
        AnalysisResponse: AI 분석 보고서 또는 에러 정보
    """
    try:
        # 1. 기술적 지표를 포함한 전체 주식 데이터 가져오기
        stock_data = stock_service.get_stock_data(ticker, include_technical=True)

        # 2. Gemini AI로 분석
        analysis_result = stock_service.get_comprehensive_analysis(stock_data)
        
        return AnalysisResponse(
            success=True,
            data=analysis_result,
            error=None
        )
    except ValueError as e:
        if "API 키가 설정되지 않았습니다" in str(e):
             raise HTTPException(status_code=500, detail=str(e))
        if "429" in str(e) or "요청 제한 초과" in str(e):
            raise HTTPException(status_code=429, detail=str(e))
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"Unhandled error in get_stock_analysis: {e}")
        raise HTTPException(status_code=500, detail=f"서버 내부 오류: {str(e)}")
