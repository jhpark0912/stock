"""
포트폴리오 API 엔드포인트
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.repository import PortfolioRepository
from app.models.portfolio import (
    PortfolioCreate,
    PortfolioUpdate,
    ApiResponse,
    PortfolioResponse,
)

router = APIRouter()


@router.post("/portfolio", status_code=201)
async def create_portfolio(
    portfolio: PortfolioCreate,
    db: Session = Depends(get_db)
):
    """포트폴리오 추가"""
    try:
        db_portfolio = PortfolioRepository.create(db, portfolio)
        return ApiResponse(
            success=True,
            data=PortfolioResponse.model_validate(db_portfolio)
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/portfolio")
async def get_all_portfolios(db: Session = Depends(get_db)):
    """전체 조회"""
    portfolios = PortfolioRepository.get_all(db)
    return ApiResponse(
        success=True,
        data=[PortfolioResponse.model_validate(p) for p in portfolios]
    )


@router.get("/portfolio/{ticker}")
async def get_portfolio(ticker: str, db: Session = Depends(get_db)):
    """개별 조회"""
    portfolio = PortfolioRepository.get_by_ticker(db, ticker)
    if not portfolio:
        raise HTTPException(status_code=404, detail=f"Ticker {ticker} not found")

    return ApiResponse(
        success=True,
        data=PortfolioResponse.model_validate(portfolio)
    )


@router.put("/portfolio/{ticker}")
async def update_portfolio(
    ticker: str,
    portfolio: PortfolioUpdate,
    db: Session = Depends(get_db)
):
    """수정"""
    updated = PortfolioRepository.update(db, ticker, portfolio)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Ticker {ticker} not found")

    return ApiResponse(
        success=True,
        data=PortfolioResponse.model_validate(updated)
    )


@router.delete("/portfolio/{ticker}", status_code=204)
async def delete_portfolio(ticker: str, db: Session = Depends(get_db)):
    """삭제"""
    deleted = PortfolioRepository.delete(db, ticker)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Ticker {ticker} not found")
