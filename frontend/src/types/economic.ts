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
