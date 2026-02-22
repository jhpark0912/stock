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
    philly_fed: Optional[EconomicIndicator] = None   # 필라델피아 연준 스프레드 (신규주문-재고)
    cfnai: Optional[EconomicIndicator] = None         # 시카고 연준 국가활동지수 (3개월 이동평균)
    umcsent: Optional[EconomicIndicator] = None       # 미시간대 소비자심리지수


class CommoditiesData(BaseModel):
    """원자재 지표"""
    wti_oil: Optional[EconomicIndicator] = None
    gold: Optional[EconomicIndicator] = None


class EconomicData(BaseModel):
    """경제 지표 전체 응답 (미국)"""
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
# 한국 경제 지표 관련 모델
# ============================================

class KoreaRatesData(BaseModel):
    """한국 금리 및 변동성 지표"""
    bond_10y: Optional[EconomicIndicator] = None  # 국고채 10년물
    base_rate: Optional[EconomicIndicator] = None  # 한국은행 기준금리
    credit_spread: Optional[EconomicIndicator] = None  # 신용 스프레드 (회사채-국고채)


class KoreaMacroData(BaseModel):
    """한국 거시경제 지표"""
    leading_index: Optional[EconomicIndicator] = None  # 선행지수 순환변동치
    ccsi: Optional[EconomicIndicator] = None           # 소비자심리지수
    export: Optional[EconomicIndicator] = None         # 월간 수출액 BOP
    cpi: Optional[EconomicIndicator] = None            # 소비자물가지수
    m2: Optional[EconomicIndicator] = None             # M2 통화량         # 월간 수출액 BOP


class KoreaFxData(BaseModel):
    """한국 환율 지표"""
    usd_krw: Optional[EconomicIndicator] = None  # 원/달러 환율


class KoreaEconomicData(BaseModel):
    """한국 경제 지표 전체 응답"""
    rates: KoreaRatesData
    macro: KoreaMacroData
    fx: KoreaFxData
    last_updated: str


class KoreaEconomicResponse(BaseModel):
    """한국 경제 지표 API 응답 형식"""
    success: bool
    data: Optional[KoreaEconomicData] = None
    error: Optional[str] = None


class AllEconomicData(BaseModel):
    """미국 + 한국 통합 경제 지표"""
    us: EconomicData
    kr: KoreaEconomicData


class AllEconomicResponse(BaseModel):
    """통합 경제 지표 API 응답 형식"""
    success: bool
    data: Optional[AllEconomicData] = None
    error: Optional[str] = None


# ============================================
# 섹터 히트맵 관련 모델
# ============================================

class SectorData(BaseModel):
    """개별 섹터 ETF 데이터"""
    symbol: str          # ETF 심볼 (XLK, 091160.KS)
    name: str            # 한글명 (기술)
    name_en: str         # 영문명 (Technology)
    description: str     # 짧은 설명 (반도체, 소프트웨어, IT서비스)
    price: float         # 현재가
    change_1d: float     # 일간 변화율 (%)
    change_1w: float     # 주간 변화율 (%)
    change_1m: float     # 월간 변화율 (%)
    market_cap: float    # AUM/시가총액 (트리맵 크기용)
    top_holdings: List[str] = []  # 상위 보유 종목
    country: str = 'us'  # 국가 구분 (us, kr)  # 상위 보유 종목 (DB 캐시에서 조회)


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
    weight: Optional[float] = None     # 비중 (12.5) - pykrx는 비중 정보 없음
    price: Optional[float] = None      # 현재가
    change_1d: Optional[float] = None  # 일간 변화율


class SectorHoldingsResponse(BaseModel):
    """섹터 보유 종목 API 응답 형식"""
    success: bool
    sector_symbol: Optional[str] = None   # ETF 심볼 (XLK, 091160.KS)
    sector_name: Optional[str] = None     # 섹터명 (기술, 반도체)
    holdings: Optional[List[SectorHolding]] = None
    last_updated: Optional[str] = None
    note: Optional[str] = None            # 데이터 출처 안내
    error: Optional[str] = None
    requires_kis_key: Optional[bool] = None  # 한국투자증권 API 키 필요 여부


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


# ============================================
# 한국 시장 사이클 관련 모델
# ============================================

class KrMarketCycleIndicator(BaseModel):
    """한국 시장 사이클 판단을 위한 개별 지표"""
    value: float
    trend: str  # "상승 추세", "하락 추세", "안정"
    label: Optional[str] = None
    mom_change: Optional[str] = None  # 전월 대비 변화 ("+0.2", "-0.1")


class KrMarketCycleData(BaseModel):
    """한국 시장 사이클 데이터"""
    season: str  # spring, summer, autumn, winter
    season_name: str  # "봄 (회복기)", "여름 (활황기)" 등
    season_emoji: str  # 🌸, ☀️, 🍂, ❄️
    confidence: int  # 0-100
    score: float  # 가중치 점수
    transition_signal: str  # "안정적 유지", "가을로 전환 가능성 있음" 등
    reasoning: str  # 판단 근거 (1-2문장)

    # 한국 지표
    export: KrMarketCycleIndicator  # 수출액 YoY
    cpi: KrMarketCycleIndicator  # 소비자물가지수
    credit_spread: KrMarketCycleIndicator  # 신용 스프레드

    # 한국 특화 섹터
    sectors: Optional[List[str]] = None

    # AI 분석 (Admin 전용)
    ai_comment: Optional[str] = None
    ai_recommendation: Optional[str] = None
    ai_risk: Optional[str] = None


class KrMarketCycleResponse(BaseModel):
    """한국 시장 사이클 API 응답"""
    success: bool
    data: Optional[KrMarketCycleData] = None
    error: Optional[str] = None


# ============================================
# 증시 마감 리뷰 관련 모델
# ============================================

class MarketIndexData(BaseModel):
    """지수 데이터"""
    symbol: str           # ^KS11, ^KQ11, ^GSPC, ^IXIC, ^DJI
    name: str             # KOSPI, KOSDAQ, S&P 500, NASDAQ, DOW
    close: float          # 종가
    change: float         # 등락폭
    change_percent: float # 등락률 (%)
    open: Optional[float] = None    # 시가
    high: Optional[float] = None    # 고가
    low: Optional[float] = None     # 저가
    volume: Optional[int] = None    # 거래량
    prev_close: Optional[float] = None  # 전일 종가


class StockMoverData(BaseModel):
    """급등/급락 종목 데이터"""
    rank: int             # 순위
    symbol: str           # 종목 코드
    name: str             # 종목명
    price: float          # 현재가
    change_percent: float # 등락률 (%)
    volume: Optional[int] = None  # 거래량


class MajorStockData(BaseModel):
    """주요 종목 (시가총액 Top) 데이터"""
    rank: int             # 시가총액 순위
    symbol: str           # 종목 코드
    name: str             # 종목명
    price: float          # 현재가
    change_percent: float # 등락률 (%)
    market_cap: float     # 시가총액 (억원 또는 백만달러)


class SectorPerformanceData(BaseModel):
    """섹터 등락 데이터"""
    sector: str           # 섹터명
    change_percent: float # 등락률 (%)
    top_stock: Optional[str] = None  # 대표 종목


class MarketReviewAI(BaseModel):
    """AI 분석 결과"""
    summary: str                     # 오늘의 포인트 (1-3문장)
    sector_insight: Optional[str] = None   # 섹터 인사이트
    tomorrow_outlook: Optional[str] = None # 내일 전망
    generated_at: str                # 생성 시간


class MarketReviewData(BaseModel):
    """마감 리뷰 전체 데이터"""
    country: str  # "kr" | "us"
    date: str     # YYYY-MM-DD
    market_close_time: str  # "15:30 KST" 또는 "16:00 EST"
    is_market_closed: bool

    indices: List[MarketIndexData]
    top_gainers: List[StockMoverData]   # 급등주 Top 5
    top_losers: List[StockMoverData]    # 급락주 Top 5
    sector_performance: List[SectorPerformanceData]

    # 주요 종목 (시가총액 Top 5)
    major_stocks_kospi: Optional[List[MajorStockData]] = None   # 한국 KOSPI
    major_stocks_kosdaq: Optional[List[MajorStockData]] = None  # 한국 KOSDAQ
    major_stocks: Optional[List[MajorStockData]] = None         # 미국 S&P 500

    ai_analysis: Optional[MarketReviewAI] = None


class MarketReviewResponse(BaseModel):
    """마감 리뷰 API 응답 형식"""
    success: bool
    data: Optional[MarketReviewData] = None
    cached: bool = False
    cache_expires_at: Optional[str] = None
    error: Optional[str] = None


class MarketReviewAIResponse(BaseModel):
    """AI 분석 API 응답"""
    success: bool
    data: Optional[MarketReviewAI] = None
    error: Optional[str] = None
