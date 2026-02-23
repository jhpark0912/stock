/**
 * 주가 차트 메인 컴포넌트 (2x2 그리드 오케스트레이터)
 */

import { useMemo } from 'react';
import type { ChartDataPoint } from '@/types/stock';
import { formatPrice, formatChartData } from './charts/chartUtils';
import { PriceVolumeChart } from './charts/PriceVolumeChart';
import { SMAChart } from './charts/SMAChart';
import { BollingerChart } from './charts/BollingerChart';
import { ComprehensiveChart } from './charts/ComprehensiveChart';

interface StockChartProps {
  ticker?: string;
  chartData?: ChartDataPoint[] | null;
  chartType?: 'line' | 'area';
}

export function StockChart({ ticker, chartData, chartType: _chartType = 'area' }: StockChartProps) {
  const data = useMemo(() => (chartData ? formatChartData(chartData) : []), [chartData]);

  if (!chartData || chartData.length === 0) {
    return (
      <div className="p-3 sm:p-6">
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <p className="text-sm text-muted-foreground">차트 데이터가 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-3">
      {/* 차트 정보 요약 */}
      <div className="bg-card border border-border rounded-lg p-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <div>
            <p className="text-xs text-muted-foreground">종목</p>
            <p className="text-sm font-semibold text-foreground">{ticker}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">시작가</p>
            <p className="text-sm font-semibold text-foreground">
              {formatPrice(data[0].price, ticker)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">현재가</p>
            <p className="text-sm font-semibold text-foreground">
              {formatPrice(data[data.length - 1].price, ticker)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">변동률</p>
            <p
              className={`text-sm font-semibold ${
                data[data.length - 1].price >= data[0].price ? 'text-success' : 'text-destructive'
              }`}
            >
              {(((data[data.length - 1].price - data[0].price) / data[0].price) * 100).toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      {/* 2x2 차트 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <PriceVolumeChart data={data} ticker={ticker} />
        <SMAChart data={data} ticker={ticker} />
        <BollingerChart data={data} ticker={ticker} />
        <ComprehensiveChart data={data} ticker={ticker} />
      </div>
    </div>
  );
}
