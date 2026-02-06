/**
 * 판단 기준 게이지 컴포넌트
 */

import type { EconomicIndicator } from '@/types/economic';
import { cn } from '@/lib/utils';

interface StatusGaugeProps {
  indicator: EconomicIndicator;
}

// 지표별 임계값 정의
const THRESHOLDS: Record<string, {
  good: { min?: number; max?: number };
  caution: { min?: number; max?: number };
  danger: { min?: number; max?: number };
  unit: string;
  reversed?: boolean; // true면 낮을수록 좋음
}> = {
  '^VIX': {
    good: { max: 20 },
    caution: { min: 20, max: 30 },
    danger: { min: 30 },
    unit: '',
    reversed: true,
  },
  '^TNX': {
    good: { max: 3.5 },
    caution: { min: 3.5, max: 4.5 },
    danger: { min: 4.5 },
    unit: '%',
    reversed: true,
  },
  '^IRX': {
    good: { max: 3.0 },
    caution: { min: 3.0, max: 5.0 },
    danger: { min: 5.0 },
    unit: '%',
    reversed: true,
  },
  'CL=F': {
    good: { min: 60, max: 80 },
    caution: { min: 80, max: 95 },
    danger: { min: 95 },
    unit: '$',
  },
  'GC=F': {
    good: {},
    caution: {},
    danger: {},
    unit: '$',
  },
};

// 상태별 스타일
const statusStyles = {
  good: {
    bg: 'bg-green-500',
    text: 'text-green-600 dark:text-green-400',
    label: '좋음',
  },
  caution: {
    bg: 'bg-yellow-500',
    text: 'text-yellow-600 dark:text-yellow-400',
    label: '주의',
  },
  danger: {
    bg: 'bg-red-500',
    text: 'text-red-600 dark:text-red-400',
    label: '위험',
  },
};

export function StatusGauge({ indicator }: StatusGaugeProps) {
  const threshold = THRESHOLDS[indicator.symbol];
  const value = indicator.value;
  const status = indicator.status as 'good' | 'caution' | 'danger' | undefined;

  // 임계값이 없거나 상태가 없으면 기본 표시
  if (!threshold || !status || status === 'none' as any || value === null) {
    return (
      <div className="bg-card border border-border rounded-lg p-4">
        <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
          <span>📋</span>
          판단 기준
        </h4>
        <p className="text-sm text-muted-foreground">
          이 지표는 상태 판단 기준이 설정되지 않았습니다.
        </p>
      </div>
    );
  }

  // 게이지 위치 계산 (0-100%)
  const calculateGaugePosition = (): number => {
    if (value === null) return 50;

    // 전체 범위 결정
    const allValues = [
      threshold.good.min,
      threshold.good.max,
      threshold.caution.min,
      threshold.caution.max,
      threshold.danger.min,
      threshold.danger.max,
    ].filter((v): v is number => v !== undefined);

    if (allValues.length < 2) return 50;

    const min = Math.min(...allValues) * 0.8;
    const max = Math.max(...allValues) * 1.2;
    const range = max - min;

    let position = ((value - min) / range) * 100;
    position = Math.max(0, Math.min(100, position));

    return position;
  };

  const gaugePosition = calculateGaugePosition();
  const style = statusStyles[status] || statusStyles.caution;

  // 포맷팅
  const formatThreshold = (val: number | undefined): string => {
    if (val === undefined) return '-';
    return threshold.unit === '$'
      ? `${threshold.unit}${val}`
      : `${val}${threshold.unit}`;
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h4 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
        <span>📋</span>
        판단 기준
      </h4>

      {/* 기준값 리스트 */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="w-3 h-3 rounded-full bg-green-500"></span>
          <span className="text-muted-foreground">좋음:</span>
          <span className="text-foreground">
            {threshold.good.max !== undefined && `< ${formatThreshold(threshold.good.max)}`}
            {threshold.good.min !== undefined && threshold.good.max !== undefined && ' ~ '}
            {threshold.good.min !== undefined && threshold.good.max === undefined && `> ${formatThreshold(threshold.good.min)}`}
            {threshold.good.min !== undefined && threshold.good.max !== undefined &&
              `${formatThreshold(threshold.good.min)} ~ ${formatThreshold(threshold.good.max)}`}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
          <span className="text-muted-foreground">주의:</span>
          <span className="text-foreground">
            {threshold.caution.min !== undefined && formatThreshold(threshold.caution.min)}
            {threshold.caution.min !== undefined && threshold.caution.max !== undefined && ' ~ '}
            {threshold.caution.max !== undefined && formatThreshold(threshold.caution.max)}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="w-3 h-3 rounded-full bg-red-500"></span>
          <span className="text-muted-foreground">위험:</span>
          <span className="text-foreground">
            {threshold.danger.min !== undefined && `> ${formatThreshold(threshold.danger.min)}`}
            {threshold.danger.max !== undefined && `< ${formatThreshold(threshold.danger.max)}`}
          </span>
        </div>
      </div>

      {/* 게이지 바 */}
      <div className="relative">
        <div className="h-3 rounded-full overflow-hidden flex">
          <div className="flex-1 bg-green-500/30"></div>
          <div className="flex-1 bg-yellow-500/30"></div>
          <div className="flex-1 bg-red-500/30"></div>
        </div>

        {/* 현재 위치 마커 */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 transition-all duration-300"
          style={{ left: `${gaugePosition}%` }}
        >
          <div className={cn(
            'w-5 h-5 rounded-full border-2 border-background shadow-md',
            style.bg
          )}></div>
        </div>
      </div>

      {/* 현재 값 표시 */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">현재값</span>
        <span className={cn('text-lg font-bold', style.text)}>
          {threshold.unit === '$' ? `${threshold.unit}${value?.toFixed(2)}` : `${value?.toFixed(2)}${threshold.unit}`}
          <span className="ml-2 text-sm font-medium">({style.label})</span>
        </span>
      </div>
    </div>
  );
}
