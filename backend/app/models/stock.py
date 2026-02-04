"""
주식 데이터 모델
"""
from __future__ import annotations
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime


class PriceInfo(BaseModel):
    """가격 정보"""
    current: Optional[float] = None
    open: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    close: Optional[float] = None  # 종가 추가
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


class SMAInfo(BaseModel):
    """단순이동평균 (SMA)"""
    sma20: Optional[float] = None
    sma50: Optional[float] = None
    sma200: Optional[float] = None


class EMAInfo(BaseModel):
    """지수이동평균 (EMA)"""
    ema12: Optional[float] = None
    ema26: Optional[float] = None


class RSIInfo(BaseModel):
    """상대강도지수 (RSI)"""
    rsi14: Optional[float] = None


class MACDInfo(BaseModel):
    """MACD 지표"""
    macd: Optional[float] = None
    signal: Optional[float] = None
    histogram: Optional[float] = None


class BollingerBandsInfo(BaseModel):
    """볼린저밴드"""
    upper: Optional[float] = None
    middle: Optional[float] = None
    lower: Optional[float] = None


class TechnicalIndicators(BaseModel):
    """기술적 지표 통합"""
    sma: Optional[SMAInfo] = None
    ema: Optional[EMAInfo] = None
    rsi: Optional[RSIInfo] = None
    macd: Optional[MACDInfo] = None
    bollinger_bands: Optional[BollingerBandsInfo] = None


class NewsItem(BaseModel):
    """뉴스 기사"""
    title: str
    link: str
    published_at: Optional[datetime] = None
    source: Optional[str] = None


class AIAnalysis(BaseModel):
    """Gemini AI 종합 분석 결과"""
    report: str


class StockData(BaseModel):
    """주식 데이터"""
    ticker: str
    timestamp: datetime
    market_cap: Optional[float] = None
    price: PriceInfo
    financials: FinancialsInfo
    company: CompanyInfo
    technical_indicators: Optional[TechnicalIndicators] = None
    chart_data: Optional[list[ChartDataPoint]] = None  # 차트 데이터 추가
    news: Optional[list[NewsItem]] = None
    ai_analysis: Optional[AIAnalysis] = None


class StockResponse(BaseModel):
    """API 응답 모델"""
    success: bool
    data: Optional[StockData] = None
    error: Optional[str] = None

class HistoricalStockData(BaseModel):
    """과거 주식 데이터"""
    ticker: str
    date: str
    open: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    close: Optional[float] = None
    volume: Optional[int] = None

class HistoricalStockResponse(BaseModel):
    """과거 주식 데이터 API 응답 모델"""
    success: bool
    data: Optional[HistoricalStockData] = None
    error: Optional[str] = None

class NewsResponse(BaseModel):
    """뉴스 API 응답 모델"""
    success: bool
    data: Optional[list[NewsItem]] = None
    error: Optional[str] = None


class AnalysisResponse(BaseModel):
    """AI 분석 API 응답 모델"""
    success: bool
    data: Optional[AIAnalysis] = None
    error: Optional[str] = None


class ChartDataPoint(BaseModel):
    """차트의 단일 데이터 포인트"""
    date: str
    close: Optional[float] = None
    volume: Optional[int] = None
    sma20: Optional[float] = None
    sma50: Optional[float] = None
    sma200: Optional[float] = None
    rsi: Optional[float] = None
    macd: Optional[float] = None
    macd_signal: Optional[float] = None
    macd_hist: Optional[float] = None
    bb_upper: Optional[float] = None
    bb_middle: Optional[float] = None
    bb_lower: Optional[float] = None


class ChartResponse(BaseModel):
    """차트 데이터 API 응답 모델"""
    success: bool
    data: Optional[list[ChartDataPoint]] = None
    error: Optional[str] = None
