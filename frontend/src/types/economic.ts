/**
 * 경제 지표 관련 TypeScript 타입 정의
 */

export interface HistoryPoint {
  date: string;
  value: number;
}

// 지표 상태 타입
export type IndicatorStatus = 'good' | 'caution' | 'danger' | 'none';

export interface EconomicIndicator {
  symbol: string;
  name: string;
  value: number | null;
  change: number | null;
  change_percent: number | null;
  metaphor: string;
  description: string;
  impact: string;
  history: HistoryPoint[] | null;
  yoy_change?: number | null;  // FRED 데이터 전용 (YoY 변화율)
  status?: IndicatorStatus | null;  // 상태 (good, caution, danger, none)
  status_label?: string | null;  // 상태 라벨 (좋음/주의/위험 또는 안정/불안/공포)
  status_criteria?: string | null;  // 판단 기준 설명 (툴팁용)
}

export interface RatesData {
  treasury_10y: EconomicIndicator | null;
  treasury_3m: EconomicIndicator | null;
  vix: EconomicIndicator | null;
}

export interface MacroData {
  cpi: EconomicIndicator | null;
  m2: EconomicIndicator | null;
  indpro?: EconomicIndicator | null;
  philly_fed: EconomicIndicator | null;     // 필라델피아 연준 스프레드
  cfnai: EconomicIndicator | null;          // 시카고 연준 국가활동지수
  umcsent: EconomicIndicator | null;        // 미시간대 소비자심리지수
}

export interface CommoditiesData {
  wti_oil: EconomicIndicator | null;
  gold: EconomicIndicator | null;
}

export interface EconomicData {
  rates: RatesData;
  macro: MacroData;
  commodities: CommoditiesData;
  last_updated: string;
}

export interface EconomicResponse {
  success: boolean;
  data: EconomicData | null;
  error: string | null;
}

// 뷰 모드 타입
export type EconomicViewMode = 'simple' | 'chart';

// 국가 타입
export type Country = 'us' | 'kr' | 'all' | null;

// ============================================
// 한국 경제 지표 타입
// ============================================

export interface KoreaRatesData {
  bond_10y: EconomicIndicator | null;  // 국고채 10년물
  base_rate: EconomicIndicator | null;  // 한국은행 기준금리
  credit_spread: EconomicIndicator | null;  // 신용 스프레드 (회사채-국고채)
}

export interface KoreaMacroData {
  leading_index: EconomicIndicator | null;  // 선행지수 순환변동치
  ccsi: EconomicIndicator | null;           // 소비자심리지수
  export: EconomicIndicator | null;         // 월간 수출액 BOP
}

export interface KoreaFxData {
  usd_krw: EconomicIndicator | null;  // 원/달러 환율
}

export interface KoreaEconomicData {
  rates: KoreaRatesData;
  macro: KoreaMacroData;
  fx: KoreaFxData;
  last_updated: string;
}

export interface KoreaEconomicResponse {
  success: boolean;
  data: KoreaEconomicData | null;
  error: string | null;
}

// 미국 + 한국 통합
export interface AllEconomicData {
  us: EconomicData;
  kr: KoreaEconomicData;
}

export interface AllEconomicResponse {
  success: boolean;
  data: AllEconomicData | null;
  error: string | null;
}

// ============================================
// 시장 사이클 타입
// ============================================

export type MarketSeason = 'spring' | 'summer' | 'autumn' | 'winter';

export interface MarketCycleIndicator {
  value: number;
  trend: string;  // "상승 추세", "하락 추세", "안정"
  label?: string;
  mom_change?: string;  // 전월 대비 변화 ("+0.2", "-0.1")
}

export interface MarketCycleData {
  season: MarketSeason;
  season_name: string;  // "봄 (회복기)", "여름 (활황기)" 등
  season_emoji: string;  // 🌸, ☀️, 🍂, ❄️
  confidence: number;  // 0-100
  score: number;
  transition_signal: string;  // "안정적 유지", "가을로 전환 가능성 있음" 등
  reasoning: string;  // 판단 근거 (1-2문장)

  // 지표 상세
  indpro: MarketCycleIndicator;  // 산업생산지수 (INDPRO)
  cpi: MarketCycleIndicator;
  vix: MarketCycleIndicator;
  yield_spread?: number;  // 10Y-3M 금리차 (basis points)

  // AI 분석 (Admin 전용)
  ai_comment?: string;
  ai_recommendation?: string;
  ai_risk?: string;
}

export interface MarketCycleResponse {
  success: boolean;
  data: MarketCycleData | null;
  error?: string;
}

// ============================================
// 한국 시장 사이클 타입
// ============================================

export interface KrMarketCycleIndicator {
  value: number;
  trend: string;  // "상승 추세", "하락 추세", "안정"
  label?: string;
  mom_change?: string;  // 전월 대비 변화 ("+0.2", "-0.1")
}

export interface KrMarketCycleData {
  season: MarketSeason;
  season_name: string;  // "봄 (회복기)", "여름 (활황기)" 등
  season_emoji: string;  // 🌸, ☀️, 🍂, ❄️
  confidence: number;  // 0-100
  score: number;
  transition_signal: string;  // "안정적 유지", "가을로 전환 가능성 있음" 등
  reasoning: string;  // 판단 근거 (1-2문장)

  // 한국 지표
  export: KrMarketCycleIndicator;  // 수출액 YoY
  cpi: KrMarketCycleIndicator;  // 소비자물가지수
  credit_spread: KrMarketCycleIndicator;  // 신용 스프레드

  // 한국 특화 섹터
  sectors?: string[];

  // AI 분석 (Admin 전용)
  ai_comment?: string;
  ai_recommendation?: string;
  ai_risk?: string;
}

export interface KrMarketCycleResponse {
  success: boolean;
  data: KrMarketCycleData | null;
  error?: string;
}
