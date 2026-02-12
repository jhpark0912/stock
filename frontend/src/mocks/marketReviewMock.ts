/**
 * 증시 마감 리뷰 Mock 데이터
 * UI 개발 및 테스트용
 */

import type { MarketReviewData, MarketReviewAI } from '@/types/marketReview';

// 한국 증시 마감 리뷰 Mock 데이터
export const mockKrMarketReview: MarketReviewData = {
  country: 'kr',
  date: '2026-02-12',
  market_close_time: '15:30 KST',
  is_market_closed: true,

  indices: [
    {
      symbol: '^KS11',
      name: 'KOSPI',
      close: 2650.32,
      change: 32.15,
      change_percent: 1.23,
      open: 2625.50,
      high: 2658.80,
      low: 2618.40,
      volume: 485320000,
      prev_close: 2618.17,
    },
    {
      symbol: '^KQ11',
      name: 'KOSDAQ',
      close: 850.25,
      change: -5.80,
      change_percent: -0.68,
      open: 855.30,
      high: 860.15,
      low: 845.20,
      volume: 1250680000,
      prev_close: 856.05,
    },
  ],

  top_gainers: [
    { rank: 1, symbol: '005930', name: 'OO전자', price: 52300, change_percent: 29.9, volume: 12500000 },
    { rank: 2, symbol: '068270', name: 'OO바이오', price: 18500, change_percent: 25.3, volume: 8750000 },
    { rank: 3, symbol: '247540', name: 'OO소재', price: 34200, change_percent: 22.1, volume: 5680000 },
    { rank: 4, symbol: '000660', name: 'OO반도체', price: 87400, change_percent: 18.7, volume: 4520000 },
    { rank: 5, symbol: '373220', name: 'OO에너지', price: 15800, change_percent: 15.4, volume: 3890000 },
  ],

  top_losers: [
    { rank: 1, symbol: '207940', name: 'XX제약', price: 12450, change_percent: -15.2, volume: 6540000 },
    { rank: 2, symbol: '010130', name: 'XX건설', price: 8900, change_percent: -12.8, volume: 4320000 },
    { rank: 3, symbol: '105560', name: 'XX금융', price: 22100, change_percent: -10.5, volume: 3150000 },
    { rank: 4, symbol: '051910', name: 'XX화학', price: 45600, change_percent: -8.9, volume: 2890000 },
    { rank: 5, symbol: '017670', name: 'XX통신', price: 31200, change_percent: -7.2, volume: 2450000 },
  ],

  sector_performance: [
    { sector: '반도체', change_percent: 2.5, top_stock: 'SK하이닉스' },
    { sector: '헬스케어', change_percent: 1.8, top_stock: '삼성바이오' },
    { sector: '금융', change_percent: 0.9, top_stock: 'KB금융' },
    { sector: 'IT', change_percent: 0.3, top_stock: '네이버' },
    { sector: '자동차', change_percent: -0.5, top_stock: '현대차' },
    { sector: '건설', change_percent: -1.2, top_stock: '대우건설' },
    { sector: '에너지', change_percent: -1.8, top_stock: 'SK이노베이션' },
    { sector: '운송', change_percent: -2.1, top_stock: 'HMM' },
  ],

  major_stocks_kospi: [
    { rank: 1, symbol: '005930', name: '삼성전자', price: 72500, change_percent: 1.2, market_cap: 4328500 },
    { rank: 2, symbol: '000660', name: 'SK하이닉스', price: 142000, change_percent: 2.8, market_cap: 1033800 },
    { rank: 3, symbol: '373220', name: 'LG에너지솔루션', price: 405000, change_percent: -0.5, market_cap: 948700 },
    { rank: 4, symbol: '207940', name: '삼성바이오로직스', price: 820000, change_percent: 0.8, market_cap: 583500 },
    { rank: 5, symbol: '005380', name: '현대차', price: 198500, change_percent: 1.5, market_cap: 422300 },
  ],

  major_stocks_kosdaq: [
    { rank: 1, symbol: '247540', name: '에코프로비엠', price: 258000, change_percent: -2.1, market_cap: 185600 },
    { rank: 2, symbol: '091990', name: '셀트리온헬스케어', price: 68500, change_percent: 0.5, market_cap: 98500 },
    { rank: 3, symbol: '066970', name: '엘앤에프', price: 108500, change_percent: 1.8, market_cap: 85200 },
    { rank: 4, symbol: '028300', name: 'HLB', price: 52300, change_percent: -1.2, market_cap: 72300 },
    { rank: 5, symbol: '196170', name: '알테오젠', price: 86200, change_percent: 3.2, market_cap: 65800 },
  ],

  ai_analysis: undefined, // 버튼 클릭 시 생성
};

// 미국 증시 마감 리뷰 Mock 데이터
export const mockUsMarketReview: MarketReviewData = {
  country: 'us',
  date: '2026-02-11',
  market_close_time: '16:00 EST',
  is_market_closed: true,

  indices: [
    {
      symbol: '^GSPC',
      name: 'S&P 500',
      close: 5125.42,
      change: 43.28,
      change_percent: 0.85,
      open: 5085.20,
      high: 5132.50,
      low: 5078.90,
      volume: 3250000000,
      prev_close: 5082.14,
    },
    {
      symbol: '^IXIC',
      name: 'NASDAQ',
      close: 16245.80,
      change: 197.32,
      change_percent: 1.23,
      open: 16050.45,
      high: 16280.90,
      low: 16025.30,
      volume: 5420000000,
      prev_close: 16048.48,
    },
    {
      symbol: '^DJI',
      name: 'DOW',
      close: 38654.20,
      change: 172.85,
      change_percent: 0.45,
      open: 38520.30,
      high: 38695.40,
      low: 38485.20,
      volume: 285000000,
      prev_close: 38481.35,
    },
  ],

  top_gainers: [
    { rank: 1, symbol: 'NVDA', name: 'NVIDIA', price: 785.50, change_percent: 8.5, volume: 52000000 },
    { rank: 2, symbol: 'AMD', name: 'AMD', price: 168.25, change_percent: 6.2, volume: 38500000 },
    { rank: 3, symbol: 'TSLA', name: 'Tesla', price: 245.80, change_percent: 5.8, volume: 85000000 },
    { rank: 4, symbol: 'META', name: 'Meta', price: 485.30, change_percent: 4.5, volume: 22000000 },
    { rank: 5, symbol: 'AMZN', name: 'Amazon', price: 178.90, change_percent: 3.8, volume: 45000000 },
  ],

  top_losers: [
    { rank: 1, symbol: 'PFE', name: 'Pfizer', price: 28.45, change_percent: -4.5, volume: 32000000 },
    { rank: 2, symbol: 'BA', name: 'Boeing', price: 205.30, change_percent: -3.8, volume: 18500000 },
    { rank: 3, symbol: 'DIS', name: 'Disney', price: 95.20, change_percent: -3.2, volume: 15000000 },
    { rank: 4, symbol: 'XOM', name: 'Exxon Mobil', price: 108.75, change_percent: -2.5, volume: 12500000 },
    { rank: 5, symbol: 'CVX', name: 'Chevron', price: 152.40, change_percent: -2.1, volume: 8500000 },
  ],

  sector_performance: [
    { sector: 'Technology', change_percent: 2.1, top_stock: 'NVDA' },
    { sector: 'Consumer Discretionary', change_percent: 1.5, top_stock: 'TSLA' },
    { sector: 'Communication', change_percent: 1.2, top_stock: 'META' },
    { sector: 'Financials', change_percent: 0.5, top_stock: 'JPM' },
    { sector: 'Healthcare', change_percent: -0.3, top_stock: 'UNH' },
    { sector: 'Industrials', change_percent: -0.8, top_stock: 'BA' },
    { sector: 'Energy', change_percent: -1.5, top_stock: 'XOM' },
    { sector: 'Utilities', change_percent: -0.2, top_stock: 'NEE' },
  ],

  major_stocks: [
    { rank: 1, symbol: 'AAPL', name: 'Apple', price: 185.25, change_percent: 1.2, market_cap: 2850000 },
    { rank: 2, symbol: 'MSFT', name: 'Microsoft', price: 415.80, change_percent: 0.8, market_cap: 3090000 },
    { rank: 3, symbol: 'GOOGL', name: 'Alphabet', price: 145.60, change_percent: 1.5, market_cap: 1820000 },
    { rank: 4, symbol: 'AMZN', name: 'Amazon', price: 178.90, change_percent: 3.8, market_cap: 1870000 },
    { rank: 5, symbol: 'NVDA', name: 'NVIDIA', price: 785.50, change_percent: 8.5, market_cap: 1940000 },
  ],

  ai_analysis: undefined,
};

// AI 분석 Mock 데이터 (한국)
export const mockKrAIAnalysis: MarketReviewAI = {
  summary: '반도체 섹터 강세 속에 KOSPI가 1% 이상 상승 마감했습니다. 외국인 자금 유입이 지속되며 대형주 중심의 상승세가 나타났습니다.',
  sector_insight: '반도체/헬스케어 강세, 건설/운송 약세. AI 관련 종목 관심 지속.',
  tomorrow_outlook: '미국 증시 영향과 원/달러 환율 흐름 주시 필요.',
  generated_at: new Date().toISOString(),
};

// AI 분석 Mock 데이터 (미국)
export const mockUsAIAnalysis: MarketReviewAI = {
  summary: '기술주 강세로 나스닥이 1.2% 상승 마감했습니다. NVIDIA 실적 기대감과 AI 투자 확대가 주요 상승 요인입니다.',
  sector_insight: 'Technology 섹터가 시장을 주도하며, Energy 섹터는 유가 하락으로 약세.',
  tomorrow_outlook: '연준 인사 발언과 경제 지표 발표에 주목. 변동성 확대 가능성.',
  generated_at: new Date().toISOString(),
};
