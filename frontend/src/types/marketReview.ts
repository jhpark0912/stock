/**
 * 증시 마감 리뷰 관련 TypeScript 타입 정의
 */

// 지수 데이터
export interface IndexData {
  symbol: string;         // ^KS11, ^KQ11, ^GSPC, ^IXIC, ^DJI
  name: string;           // KOSPI, KOSDAQ, S&P 500, NASDAQ, DOW
  close: number;          // 종가
  change: number;         // 등락폭
  change_percent: number; // 등락률 (%)
  open?: number;          // 시가
  high?: number;          // 고가
  low?: number;           // 저가
  volume?: number;        // 거래량
  prev_close?: number;    // 전일 종가
}

// 급등/급락 종목 데이터
export interface StockMoverData {
  rank: number;           // 순위
  symbol: string;         // 종목 코드
  name: string;           // 종목명
  price: number;          // 현재가
  change_percent: number; // 등락률 (%)
  volume?: number;        // 거래량
}

// 주요 종목 (시가총액 Top) 데이터
export interface MajorStockData {
  rank: number;           // 시가총액 순위
  symbol: string;         // 종목 코드
  name: string;           // 종목명
  price: number;          // 현재가
  change_percent: number; // 등락률 (%)
  market_cap: number;     // 시가총액 (억원 또는 백만달러)
}

// 섹터 등락 데이터
export interface SectorPerformanceData {
  sector: string;         // 섹터명
  change_percent: number; // 등락률 (%)
  top_stock?: string;     // 대표 종목
}

// AI 분석 결과
export interface MarketReviewAI {
  summary: string;           // 오늘의 포인트 (1-3문장)
  sector_insight?: string;   // 섹터 인사이트
  tomorrow_outlook?: string; // 내일 전망
  generated_at: string;      // 생성 시간
}

// 마감 리뷰 전체 데이터
export interface MarketReviewData {
  country: 'kr' | 'us';
  date: string;                          // YYYY-MM-DD
  market_close_time: string;             // "15:30 KST" 또는 "16:00 EST"
  is_market_closed: boolean;

  indices: IndexData[];
  top_gainers: StockMoverData[];         // 급등주 Top 5
  top_losers: StockMoverData[];          // 급락주 Top 5
  sector_performance: SectorPerformanceData[];

  // 주요 종목 (시가총액 Top 5)
  major_stocks_kospi?: MajorStockData[]; // 한국 KOSPI
  major_stocks_kosdaq?: MajorStockData[];// 한국 KOSDAQ
  major_stocks?: MajorStockData[];       // 미국 S&P 500

  ai_analysis?: MarketReviewAI;
}

// API 응답 형식
export interface MarketReviewResponse {
  success: boolean;
  data: MarketReviewData | null;
  cached: boolean;
  cache_expires_at?: string;
  error?: string;
}

// AI 분석 API 응답
export interface MarketReviewAIResponse {
  success: boolean;
  data: MarketReviewAI | null;
  error?: string;
}
