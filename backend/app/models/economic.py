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


class SectorResponse(BaseModel):
    """섹터 API 응답 형식"""
    success: bool
    data: Optional[List[SectorData]] = None
    last_updated: Optional[str] = None
    error: Optional[str] = None
