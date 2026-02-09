/**
 * 상세 차트 컴포넌트 (큰 사이즈, 기간 선택 포함)
 */

import { useState, useMemo } from 'react';
import {
  Line,
  LineChart,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from 'recharts';

import type { EconomicIndicator } from '@/types/economic';
import { cn } from '@/lib/utils';

interface DetailChartProps {
  indicator: EconomicIndicator;
  compareIndicators?: EconomicIndicator[];
  loading?: boolean;
}

type Period = '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

// 차트 색상 팔레트
const CHART_COLORS = [
  'var(--color-primary)',
  'var(--color-success)',
  'var(--color-warning)',
  'var(--color-destructive)',
  '#8b5cf6', // violet
  '#06b6d4', // cyan
];

export function DetailChart({ indicator, compareIndicators = [], loading = false }: DetailChartProps) {
  // 데이터 주기 판별 함수 (월간 vs 일간)
  const isMonthlyData = (symbol: string): boolean => {
    // FRED: 미국 월간 데이터
    if (symbol === 'CPIAUCSL' || symbol === 'M2SL') return true;

    // ECOS 월간 데이터
    if (symbol === 'KR_CPI' || symbol === 'KR_M2' || symbol === 'KR_INDPRO' || symbol === 'KR_EXPORT') {
      return true;
    }

    // 그 외: 일간 데이터 (미국 금리, 한국 금리, 환율 등)
    return false;
  };

  const isMonthly = isMonthlyData(indicator.symbol);

  // 월간 데이터: 장기 기간, 일간 데이터: 단기 기간
  const [period, setPeriod] = useState<Period>(isMonthly ? '1Y' : '1M');

  // 기간에 따라 데이터 필터링
  const filterByPeriod = (data: { date: string; value: number }[], period: Period, isMonthly: boolean) => {
    if (!data || data.length === 0) return [];

    // 전체 데이터 표시
    if (period === 'ALL') {
      return data;
    }

    // 월간 데이터(FRED, ECOS): 데이터 포인트 개수 기준
    if (isMonthly) {
      let pointsToShow = 12; // 기본 1년 = 12개월

      switch (period) {
        case '3M':
          pointsToShow = 3;
          break;
        case '6M':
          pointsToShow = 6;
          break;
        case '1Y':
          pointsToShow = 12;
          break;
      }

      // 최근 N개 데이터 포인트 반환
      return data.slice(-pointsToShow);
    }

    // 일간 데이터(Yahoo): 날짜 기준
    const now = new Date();
    let daysBack = 30;

    switch (period) {
      case '1W':
        daysBack = 7;
        break;
      case '1M':
        daysBack = 30;
        break;
      case '3M':
        daysBack = 90;
        break;
      case '6M':
        daysBack = 180;
        break;
      case '1Y':
        daysBack = 365;
        break;
    }

    const cutoff = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    const filtered = data.filter(point => {
      const pointDate = new Date(point.date);
      return pointDate >= cutoff;
    });

    // 필터링 결과가 비어있으면 전체 데이터 반환
    if (filtered.length === 0) {
      console.warn('[DetailChart] 필터링 결과가 비어있어 전체 데이터를 표시합니다');
      return data;
    }

    return filtered;
  };

  // 메인 지표 + 비교 지표 데이터 병합
  const chartData = useMemo(() => {
    const mainHistory = indicator.history || [];
    const filteredMain = filterByPeriod(mainHistory, period, isMonthly);

    if (filteredMain.length === 0) return [];

    // 날짜를 기준으로 데이터 병합
    const dateMap = new Map<string, Record<string, number>>();

    // 메인 지표 추가
    filteredMain.forEach(point => {
      dateMap.set(point.date, {
        date: new Date(point.date).getTime(),
        [indicator.symbol]: point.value,
      });
    });

    // 비교 지표 추가
    compareIndicators.forEach(comp => {
      const compHistory = comp.history || [];
      const compIsMonthly = isMonthlyData(comp.symbol);
      const filteredComp = filterByPeriod(compHistory, period, compIsMonthly);

      filteredComp.forEach(point => {
        const existing = dateMap.get(point.date);
        if (existing) {
          existing[comp.symbol] = point.value;
        }
      });
    });

    // 날짜순 정렬
    return Array.from(dateMap.values()).sort((a, b) => a.date - b.date);
  }, [indicator, compareIndicators, period, isMonthly]);

  // Y축 도메인 계산
  const yDomain = useMemo(() => {
    if (chartData.length === 0) return [0, 100];

    const allValues: number[] = [];
    chartData.forEach(point => {
      Object.entries(point).forEach(([key, value]) => {
        if (key !== 'date' && typeof value === 'number') {
          allValues.push(value);
        }
      });
    });

    if (allValues.length === 0) return [0, 100];

    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    const padding = (max - min) * 0.1;

    return [min - padding, max + padding];
  }, [chartData]);

  // 값 포맷팅
  const formatValue = (value: number): string => {
    if (value >= 1000) {
      return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
    }
    return value.toFixed(2);
  };

  // 날짜 포맷팅
  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp);
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
  };

  // 데이터 없음
  if (!indicator.history || indicator.history.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="h-[200px] flex items-center justify-center">
          <p className="text-muted-foreground">히스토리 데이터가 없습니다</p>
        </div>
      </div>
    );
  }

  // 모든 라인 (메인 + 비교)
  const allLines = [indicator, ...compareIndicators];

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      {/* 기간 선택 */}
      <div className="flex justify-end mb-4">
        <div className="flex items-center bg-muted rounded-lg p-1 gap-0.5">
          {/* 월간 데이터: 장기, 일간 데이터: 단기+중기 */}
          {(isMonthly
            ? (['3M', '6M', '1Y', 'ALL'] as Period[])
            : (['1W', '1M', '3M', '6M'] as Period[])
          ).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'px-2.5 py-1 text-xs font-medium rounded-md transition-colors',
                period === p
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* 차트 */}
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />

          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
            axisLine={{ stroke: 'var(--color-border)' }}
            tickLine={{ stroke: 'var(--color-border)' }}
          />

          <YAxis
            domain={yDomain}
            tickFormatter={formatValue}
            tick={{ fontSize: 11, fill: 'var(--color-muted-foreground)' }}
            axisLine={{ stroke: 'var(--color-border)' }}
            tickLine={{ stroke: 'var(--color-border)' }}
            width={50}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--color-popover)',
              border: '1px solid var(--color-border)',
              borderRadius: '8px',
              fontSize: '12px',
              padding: '8px 12px',
            }}
            labelFormatter={(timestamp) => {
              const date = new Date(timestamp);
              return date.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              });
            }}
            formatter={(value: number, name: string) => {
              const ind = allLines.find(i => i.symbol === name);
              return [formatValue(value), ind?.name || name];
            }}
          />

          {compareIndicators.length > 0 && (
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              formatter={(value) => {
                const ind = allLines.find(i => i.symbol === value);
                return ind?.name || value;
              }}
            />
          )}

          {/* 메인 라인 */}
          <Line
            type="monotone"
            dataKey={indicator.symbol}
            stroke={CHART_COLORS[0]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: CHART_COLORS[0] }}
            name={indicator.symbol}
          />

          {/* 비교 라인들 */}
          {compareIndicators.map((comp, index) => (
            <Line
              key={comp.symbol}
              type="monotone"
              dataKey={comp.symbol}
              stroke={CHART_COLORS[(index + 1) % CHART_COLORS.length]}
              strokeWidth={1.5}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 3 }}
              name={comp.symbol}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
