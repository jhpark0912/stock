"""
주식 데이터 API 엔드포인트
"""
from fastapi import APIRouter, HTTPException, Query
from app.models.stock import (
    StockResponse, StockData, NewsResponse, NewsItem, 
    AnalysisResponse, AIAnalysis, ChartResponse
)
from app.services.stock_service import StockService

router = APIRouter()
stock_service = StockService()


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
    stock_data: StockData
) -> AnalysisResponse:
    """
    Gemini AI를 이용한 종합 주식 분석

    ⚠️ 이 엔드포인트는 POST 메서드를 사용합니다.
    프론트엔드에서 이미 조회한 주식 데이터를 전송하여
    Yahoo Finance API 중복 호출을 방지합니다.

    Args:
        ticker: 주식 티커 심볼 (예: AAPL, TSLA, GOOGL)
        stock_data: 이미 조회된 주식 데이터 (기술적 지표 포함 권장)

    Returns:
        AnalysisResponse: AI 분석 보고서 또는 에러 정보

    Example:
        POST /api/stock/AAPL/analysis
        Body: { "ticker": "AAPL", "timestamp": "2024-01-01T00:00:00", ... }
    """
    try:
        # 티커 일치 여부 확인
        if stock_data.ticker.upper() != ticker.upper():
            raise ValueError(
                f"URL의 티커({ticker})와 요청 본문의 티커({stock_data.ticker})가 일치하지 않습니다."
            )

        # Gemini AI로 분석 (전달받은 데이터 사용, Yahoo API 재호출 없음)
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
        raise HTTPException(status_code=500, detail=f"서버 내부 오류: {str(e)}")
