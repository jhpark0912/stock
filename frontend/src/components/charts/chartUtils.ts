/**
 * 주식 차트 공용 유틸리티
 */

import type { ChartDataPoint } from '@/types/stock';

export interface FormattedChartData {
  date: string;
  price: number;
  volume: number;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  bb_upper: number | null;
  bb_middle: number | null;
  bb_lower: number | null;
}

/** 한국 주식 여부 판별 (.KS, .KQ 접미사) */
export const isKoreanStock = (ticker?: string): boolean => {
  if (!ticker) return false;
  const upper = ticker.toUpperCase();
  return upper.endsWith('.KS') || upper.endsWith('.KQ');
};

/** 통화 포맷팅 (한국 원화 / 미국 달러) */
export const formatPrice = (price: number, ticker?: string): string => {
  if (isKoreanStock(ticker)) {
    return `₩${price.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}`;
  }
  return `$${price.toFixed(2)}`;
};

/** ChartDataPoint[] → 차트 렌더링용 데이터 변환 */
export const formatChartData = (data: ChartDataPoint[]): FormattedChartData[] => {
  return data.map((point) => ({
    date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    price: point.close || 0,
    volume: point.volume || 0,
    sma20: point.sma20,
    sma50: point.sma50,
    sma200: point.sma200,
    bb_upper: point.bb_upper,
    bb_middle: point.bb_middle,
    bb_lower: point.bb_lower,
  }));
};

/** 공통 축 스타일 */
export const AXIS_STYLE = {
  stroke: 'hsl(var(--muted-foreground))',
  style: { fontSize: '10px' },
  tick: { fill: 'hsl(var(--muted-foreground))' },
} as const;
