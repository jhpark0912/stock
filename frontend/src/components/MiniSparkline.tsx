/**
 * 미니 스파크라인 차트 컴포넌트
 * recharts 기반
 */

import { useMemo } from 'react';
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import type { HistoryPoint } from '@/types/economic';

interface MiniSparklineProps {
  data: HistoryPoint[];
  height?: number;
  color?: 'primary' | 'success' | 'destructive';
}

export function MiniSparkline({
  data,
  height = 80,
  color = 'primary'
}: MiniSparklineProps) {
  // 색상 매핑 (Tailwind CSS 변수 사용)
  const strokeColor = useMemo(() => {
    switch (color) {
      case 'success':
        return 'var(--color-success)';
      case 'destructive':
        return 'var(--color-destructive)';
      default:
        return 'var(--color-primary)';
    }
  }, [color]);

  // 데이터가 없거나 부족한 경우
  if (!data || data.length < 2) {
    return (
      <div
        className="flex items-center justify-center text-muted-foreground text-xs"
        style={{ height }}
      >
        데이터 부족
      </div>
    );
  }

  // 차트 데이터 정규화 (날짜 포맷팅)
  const chartData = useMemo(() => {
    return data.map(point => ({
      date: point.date,
      // X축 표시용 간단한 날짜 (MM/DD)
      shortDate: point.date.slice(5), // "2026-01-15" -> "01-15"
      value: point.value
    }));
  }, [data]);

  // Y축 도메인 계산 (약간의 여백 추가)
  const domain = useMemo(() => {
    const values = chartData.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.15;
    return [min - padding, max + padding];
  }, [chartData]);

  // Y축 틱 값 (최소, 최대만)
  const yTicks = useMemo(() => {
    const values = chartData.map(d => d.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    return [min, max];
  }, [chartData]);

  // X축 틱 값 (시작, 끝만)
  const xTicks = useMemo(() => {
    if (chartData.length < 2) return [];
    return [chartData[0].shortDate, chartData[chartData.length - 1].shortDate];
  }, [chartData]);

  // 값 포맷팅 (소수점 2자리)
  const formatValue = (value: number) => {
    if (value >= 1000) {
      return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
    }
    return value.toFixed(2);
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={chartData}
        margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
      >
        {/* X축: 시작/끝 날짜만 표시 */}
        <XAxis
          dataKey="shortDate"
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
          ticks={xTicks}
          interval="preserveStartEnd"
        />

        {/* Y축: 최소/최대값만 표시 */}
        <YAxis
          domain={domain}
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 10, fill: 'var(--color-muted-foreground)' }}
          ticks={yTicks}
          tickFormatter={formatValue}
          width={45}
          orientation="right"
        />

        {/* 툴팁 */}
        <Tooltip
          contentStyle={{
            backgroundColor: 'var(--color-popover)',
            border: '1px solid var(--color-border)',
            borderRadius: '6px',
            fontSize: '12px',
            padding: '6px 10px',
          }}
          labelStyle={{ color: 'var(--color-muted-foreground)', marginBottom: '2px' }}
          formatter={(value: number) => [formatValue(value), '값']}
          labelFormatter={(label) => `날짜: ${label}`}
        />

        {/* 라인 */}
        <Line
          type="monotone"
          dataKey="value"
          stroke={strokeColor}
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 3, fill: strokeColor }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
