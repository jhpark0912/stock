"""
주식 데이터 API 엔드포인트
"""
from fastapi import APIRouter, HTTPException
from app.models.stock import StockResponse, StockData
from app.services.stock_service import StockService

router = APIRouter()


@router.get("/stock/{ticker}", response_model=StockResponse)
async def get_stock(ticker: str) -> StockResponse:
    """
    주식 실시간 데이터 조회

    Args:
        ticker: 주식 티커 심볼 (예: AAPL, TSLA, GOOGL)

    Returns:
        StockResponse: 주식 데이터 또는 에러 정보

    Examples:
        - GET /api/stock/AAPL
        - GET /api/stock/TSLA
    """
    try:
        stock_data = StockService.get_stock_data(ticker)
        return StockResponse(
            success=True,
            data=stock_data,
            error=None
        )
    except ValueError as e:
        return StockResponse(
            success=False,
            data=None,
            error=str(e)
        )
    except Exception as e:
        return StockResponse(
            success=False,
            data=None,
            error=f"서버 내부 오류: {str(e)}"
        )
