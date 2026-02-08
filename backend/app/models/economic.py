"""
경제 지표 관련 Pydantic 모델
"""
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class HistoryPoint(BaseModel):
    """히스토리 데이터 포인트"""
    date: str
    value: float


class EconomicIndicator(BaseModel):
    """개별 경제 지표"""
    symbol: str
    name: str
    value: Optional[float] = None
    change: Optional[float] = None
    change_percent: Optional[float] = None
    metaphor: str
    description: str
    impact: str
    history: Optional[List[HistoryPoint]] = None
    
    # FRED 데이터 전용 (YoY 변화율)
    yoy_change: Optional[float] = None
    
    # 상태 판단 결과
    status: Optional[str] = None  # good, caution, danger, none
    status_label: Optional[str] = None  # 좋음/주의/위험 또는 안정/불안/공포
    status_criteria: Optional[str] = None  # 판단 기준 설명 (툴팁용)


class RatesData(BaseModel):
    """금리 및 변동성 지표"""
    treasury_10y: Optional[EconomicIndicator] = None
    treasury_3m: Optional[EconomicIndicator] = None
    vix: Optional[EconomicIndicator] = None


class MacroData(BaseModel):
    """거시경제 지표 (FRED)"""
    cpi: Optional[EconomicIndicator] = None
    m2: Optional[EconomicIndicator] = None
    indpro: Optional[EconomicIndicator] = None


class CommoditiesData(BaseModel):
    """원자재 지표"""
    wti_oil: Optional[EconomicIndicator] = None
    gold: Optional[EconomicIndicator] = None


class EconomicData(BaseModel):
    """경제 지표 전체 응답"""
    rates: RatesData
    macro: MacroData
    commodities: CommoditiesData
    last_updated: str


class EconomicResponse(BaseModel):
    """API 응답 형식"""
    success: bool
    data: Optional[EconomicData] = None
    error: Optional[str] = None


# ============================================
# 섹터 히트맵 관련 모델
# ============================================

class SectorData(BaseModel):
    """개별 섹터 ETF 데이터"""
    symbol: str          # ETF 심볼 (XLK)
    name: str            # 한글명 (기술)
    name_en: str         # 영문명 (Technology)
    description: str     # 짧은 설명 (반도체, 소프트웨어, IT서비스)
    price: float         # 현재가
    change_1d: float     # 일간 변화율 (%)
    change_1w: float     # 주간 변화율 (%)
    change_1m: float     # 월간 변화율 (%)
    market_cap: float    # AUM/시가총액 (트리맵 크기용)
    top_holdings: List[str] = []  # 상위 보유 종목 (DB 캐시에서 조회)


class SectorResponse(BaseModel):
    """섹터 API 응답 형식"""
    success: bool
    data: Optional[List[SectorData]] = None
    last_updated: Optional[str] = None
    error: Optional[str] = None


# ============================================
# 섹터 보유 종목 관련 모델 (Phase 2)
# ============================================

class SectorHolding(BaseModel):
    """섹터 ETF 보유 종목"""
    symbol: str              # 종목 심볼 (MSFT)
    name: str                # 종목명 (Microsoft Corporation)
    weight: float            # 비중 (12.5)
    price: Optional[float] = None      # 현재가
    change_1d: Optional[float] = None  # 일간 변화율


class SectorHoldingsResponse(BaseModel):
    """섹터 보유 종목 API 응답 형식"""
    success: bool
    sector_symbol: Optional[str] = None   # ETF 심볼 (XLK)
    sector_name: Optional[str] = None     # 섹터명 (기술)
    holdings: Optional[List[SectorHolding]] = None
    last_updated: Optional[str] = None
    error: Optional[str] = None


# ============================================
# 시장 사이클 관련 모델
# ============================================

class MarketCycleIndicator(BaseModel):
    """시장 사이클 판단을 위한 개별 지표"""
    value: float
    trend: str  # "상승 추세", "하락 추세", "안정"
    label: Optional[str] = None
    mom_change: Optional[str] = None  # 전월 대비 변화 ("+0.2", "-0.1")


class MarketCycleData(BaseModel):
    """시장 사이클 데이터"""
    season: str  # spring, summer, autumn, winter
    season_name: str  # "봄 (회복기)", "여름 (활황기)" 등
    season_emoji: str  # 🌸, ☀️, 🍂, ❄️
    confidence: int  # 0-100
    score: float  # 가중치 점수
    transition_signal: str  # "안정적 유지", "가을로 전환 가능성 있음" 등
    reasoning: str  # 판단 근거 (1-2문장)

    # 지표 상세
    indpro: MarketCycleIndicator  # 산업생산지수 (INDPRO)
    cpi: MarketCycleIndicator
    vix: MarketCycleIndicator
    yield_spread: Optional[float] = None  # 10Y-3M 금리차 (basis points)
    
    # AI 분석 (Admin 전용)
    ai_comment: Optional[str] = None
    ai_recommendation: Optional[str] = None
    ai_risk: Optional[str] = None


class MarketCycleResponse(BaseModel):
    """시장 사이클 API 응답"""
    success: bool
    data: Optional[MarketCycleData] = None
    error: Optional[str] = None
