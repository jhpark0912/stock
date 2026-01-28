"""
주식 데이터 모델
"""
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime


class PriceInfo(BaseModel):
    """가격 정보"""
    current: Optional[float] = None
    open: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    volume: Optional[int] = None


class FinancialsInfo(BaseModel):
    """재무 지표"""
    # 밸류에이션
    trailing_pe: Optional[float] = None
    forward_pe: Optional[float] = None
    pbr: Optional[float] = None
    roe: Optional[float] = None
    opm: Optional[float] = None
    peg: Optional[float] = None

    # 재무 건전성
    debt_to_equity: Optional[float] = None
    current_ratio: Optional[float] = None
    quick_ratio: Optional[float] = None

    # 배당
    dividend_yield: Optional[float] = None
    payout_ratio: Optional[float] = None

    # 성장성
    revenue_growth: Optional[float] = None
    earnings_growth: Optional[float] = None


class CompanyInfo(BaseModel):
    """회사 정보"""
    name: Optional[str] = None
    sector: Optional[str] = None
    industry: Optional[str] = None
    summary_original: Optional[str] = None
    summary_translated: Optional[str] = None


class StockData(BaseModel):
    """주식 데이터"""
    ticker: str
    timestamp: datetime
    market_cap: Optional[float] = None
    price: PriceInfo
    financials: FinancialsInfo
    company: CompanyInfo


class StockResponse(BaseModel):
    """API 응답 모델"""
    success: bool
    data: Optional[StockData] = None
    error: Optional[str] = None
