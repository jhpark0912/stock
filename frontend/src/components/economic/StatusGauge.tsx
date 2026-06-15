/**
 * 판단 기준 게이지 컴포넌트
 */

import type { EconomicIndicator } from '@/types/economic';
import { cn } from '@/lib/utils';

interface StatusGaugeProps {
  indicator: EconomicIndicator;
}

// 지표별 임계값 정의
const THRESHOLDS: Record<
  string,
  {
    good: { min?: number; max?: number };
    caution: { min?: number; max?: number };
    danger: { min?: number; max?: number };
    unit: string;
    reversed?: boolean; // true면 낮을수록 좋음
  }
> = {
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
  CPIAUCSL: {
    good: { min: 1.5, max: 2.5 },
    caution: { min: 2.5, max: 4.0 },
    danger: { min: 4.0 },
    unit: '%',
  },
  M2SL: {
    good: { min: 4, max: 8 },
    caution: { min: 1, max: 4 },
    danger: { max: 0 },
    unit: '%',
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

  // CPI와 M2는 YoY 변화율을 사용, 나머지는 절대값 사용
  const isFredIndicator = indicator.symbol === 'CPIAUCSL' || indicator.symbol === 'M2SL';
  const value = isFredIndicator ? indicator.yoy_change : indicator.value;

  const status = indicator.status as 'good' | 'caution' | 'danger' | undefined;

  // 임계값이 없거나 상태가 없으면 기본 표시
  if (!threshold || !status || status === ('none' as any) || value === null) {
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

  const style = statusStyles[status] || statusStyles.caution;

  // 포맷팅
  const formatThreshold = (val: number | undefined): string => {
    if (val === undefined) return '-';
    return threshold.unit === '$' ? `${threshold.unit}${val}` : `${val}${threshold.unit}`;
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h4 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
        <span>📋</span>
        판단 기준
      </h4>

      {/* 기준값 리스트 */}
      <div className="space-y-2.5">
        <div className="flex items-center gap-2 text-sm">
          <span className="w-3 h-3 rounded-full bg-green-500"></span>
          <span className="text-muted-foreground min-w-[40px]">좋음:</span>
          <span className="text-foreground">
            {threshold.good.max !== undefined && `< ${formatThreshold(threshold.good.max)}`}
            {threshold.good.min !== undefined && threshold.good.max !== undefined && ' ~ '}
            {threshold.good.min !== undefined &&
              threshold.good.max === undefined &&
              `> ${formatThreshold(threshold.good.min)}`}
            {threshold.good.min !== undefined &&
              threshold.good.max !== undefined &&
              `${formatThreshold(threshold.good.min)} ~ ${formatThreshold(threshold.good.max)}`}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="w-3 h-3 rounded-full bg-yellow-500"></span>
          <span className="text-muted-foreground min-w-[40px]">주의:</span>
          <span className="text-foreground">
            {threshold.caution.min !== undefined && formatThreshold(threshold.caution.min)}
            {threshold.caution.min !== undefined && threshold.caution.max !== undefined && ' ~ '}
            {threshold.caution.max !== undefined && formatThreshold(threshold.caution.max)}
          </span>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <span className="w-3 h-3 rounded-full bg-red-500"></span>
          <span className="text-muted-foreground min-w-[40px]">위험:</span>
          <span className="text-foreground">
            {threshold.danger.min !== undefined && `> ${formatThreshold(threshold.danger.min)}`}
            {threshold.danger.max !== undefined && `< ${formatThreshold(threshold.danger.max)}`}
          </span>
        </div>
      </div>

      {/* 현재 값 표시 */}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {isFredIndicator ? 'YoY 변화율' : '현재값'}
        </span>
        <span className={cn('text-lg font-bold', style.text)}>
          {value !== null && value !== undefined
            ? isFredIndicator
              ? // FRED 지표: YoY 변화율 표시
                `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
              : // 기타 지표: 절대값 표시
                threshold.unit === '$'
                ? `${threshold.unit}${value.toFixed(2)}`
                : `${value.toFixed(2)}${threshold.unit}`
            : 'N/A'}
          <span className="ml-2 text-sm font-medium">({style.label})</span>
        </span>
      </div>
    </div>
  );
}
