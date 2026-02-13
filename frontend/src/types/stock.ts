export interface StockPrice {
  current: number;
  open: number;
  high: number;
  low: number;
  close: number | null;  // 종가 추가
  volume: number;
}

export interface StockFinancials {
  trailing_pe: number | null;
  forward_pe: number | null;
  pbr: number | null;
  roe: number | null;
  opm: number | null;
  peg: number | null;
  debt_to_equity: number | null;
  current_ratio: number | null;
  quick_ratio: number | null;
  dividend_yield: number | null;
  payout_ratio: number | null;
  revenue_growth: number | null;
  earnings_growth: number | null;
}

export interface StockCompany {
  name: string;
  sector: string | null;
  industry: string | null;
  summary_original: string | null;
  summary_translated: string | null;
}

export interface SMAInfo {
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
}

export interface EMAInfo {
  ema12: number | null;
  ema26: number | null;
}

export interface RSIInfo {
  rsi14: number | null;
}

export interface MACDInfo {
  macd: number | null;
  signal: number | null;
  histogram: number | null;
}

export interface BollingerBandsInfo {
  upper: number | null;
  middle: number | null;
  lower: number | null;
}

export interface TechnicalIndicators {
  sma: SMAInfo | null;
  ema: EMAInfo | null;
  rsi: RSIInfo | null;
  macd: MACDInfo | null;
  bollinger_bands: BollingerBandsInfo | null;
}

export interface NewsItem {
  title: string;
  link: string;
  published_at: string | null;
  source: string | null;
}

export interface StockData {
  ticker: string;
  timestamp: string;
  market_cap: number | null;
  price: StockPrice;
  financials: StockFinancials;
  company: StockCompany;
  technical_indicators?: TechnicalIndicators | null;
  chart_data?: ChartDataPoint[] | null;
  news?: NewsItem[] | null;
}

export interface AIAnalysis {
  report: string;
}

export interface ChartDataPoint {
  date: string;
  close: number | null;
  volume: number | null;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  rsi: number | null;
  macd: number | null;
  macd_signal: number | null;
  macd_hist: number | null;
  bb_upper: number | null;
  bb_middle: number | null;
  bb_lower: number | null;
}

// ============ AI 분석 요약 저장 관련 타입 ============

export type InvestmentStrategy = 'buy' | 'hold' | 'sell';

export interface AnalysisSummary {
  summary: string;  // 3줄 요약 (줄바꿈으로 구분)
  strategy: InvestmentStrategy;
}

export interface SummaryRequest {
  full_report: string;
}

export interface SummaryResponse {
  success: boolean;
  data: AnalysisSummary | null;
  error: string | null;
}

export interface SavedAnalysis {
  id: number;
  ticker: string;
  summary: string;
  strategy: string;
  current_price: number | null;
  user_avg_price: number | null;
  profit_loss_ratio: number | null;
  full_report: string | null;
  created_at: string;
}

export interface SaveAnalysisRequest {
  summary: string;
  strategy: InvestmentStrategy;
  current_price?: number;
  user_avg_price?: number;
  profit_loss_ratio?: number;
  full_report?: string;
}

export interface SaveAnalysisResponse {
  success: boolean;
  data: SavedAnalysis | null;
  error: string | null;
}

export interface AnalysisListResponse {
  success: boolean;
  data: SavedAnalysis[] | null;
  error: string | null;
}
