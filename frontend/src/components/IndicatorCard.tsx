/**
 * 경제 지표 카드 컴포넌트
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { EconomicIndicator, IndicatorStatus } from '@/types/economic';
import { MiniSparkline } from './MiniSparkline';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface IndicatorCardProps {
  indicator: EconomicIndicator | null;
  showChart?: boolean;
  /** 값 포맷팅 방식 */
  formatType?: 'percent' | 'currency' | 'number' | 'trillion';
  /** 아이콘 이모지 */
  icon?: string;
}

// 상태별 스타일 매핑
const statusStyles: Record<IndicatorStatus, { bg: string; text: string; border: string }> = {
  good: {
    bg: 'bg-green-500/10',
    text: 'text-green-600 dark:text-green-400',
    border: 'border-green-500/30',
  },
  caution: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-600 dark:text-yellow-400',
    border: 'border-yellow-500/30',
  },
  danger: {
    bg: 'bg-red-500/10',
    text: 'text-red-600 dark:text-red-400',
    border: 'border-red-500/30',
  },
  none: {
    bg: 'bg-muted',
    text: 'text-muted-foreground',
    border: 'border-border',
  },
};

export function IndicatorCard({ 
  indicator, 
  showChart = false,
  formatType = 'number',
  icon = '📊'
}: IndicatorCardProps) {
  if (!indicator) {
    return (
      <div className="bg-card border border-border rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-muted rounded w-24 mb-2"></div>
        <div className="h-8 bg-muted rounded w-20 mb-2"></div>
        <div className="h-3 bg-muted rounded w-16"></div>
      </div>
    );
  }

  const formatValue = (value: number | null): string => {
    if (value === null || value === undefined) return 'N/A';
    
    switch (formatType) {
      case 'percent':
        return `${value.toFixed(2)}%`;
      case 'currency':
        return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'trillion':
        // M2는 billions 단위로 제공되므로 trillion으로 변환
        const trillion = value / 1000;
        return `$${trillion.toFixed(2)}T`;
      default:
        return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
  };

  const getChangeDisplay = () => {
    // YoY 변화율이 있으면 우선 사용 (FRED 데이터)
    if (indicator.yoy_change !== null && indicator.yoy_change !== undefined) {
      const isPositive = indicator.yoy_change > 0;
      const isNeutral = indicator.yoy_change === 0;
      
      return {
        value: `YoY ${isPositive ? '+' : ''}${indicator.yoy_change.toFixed(1)}%`,
        color: isNeutral ? 'text-muted-foreground' : isPositive ? 'text-success' : 'text-destructive',
        Icon: isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown
      };
    }
    
    // 일간 변동률
    if (indicator.change_percent !== null && indicator.change_percent !== undefined) {
      const isPositive = indicator.change_percent > 0;
      const isNeutral = Math.abs(indicator.change_percent) < 0.01;
      
      return {
        value: `${isPositive ? '+' : ''}${indicator.change_percent.toFixed(2)}%`,
        color: isNeutral ? 'text-muted-foreground' : isPositive ? 'text-success' : 'text-destructive',
        Icon: isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown
      };
    }
    
    return null;
  };

  const changeDisplay = getChangeDisplay();

  // 스파크라인 색상 결정
  const getSparklineColor = (): 'success' | 'destructive' | 'primary' => {
    if (indicator.change_percent !== null && indicator.change_percent !== undefined) {
      return indicator.change_percent >= 0 ? 'success' : 'destructive';
    }
    if (indicator.yoy_change !== null && indicator.yoy_change !== undefined) {
      return indicator.yoy_change >= 0 ? 'success' : 'destructive';
    }
    return 'primary';
  };

  // 상태 배지 스타일
  const status = (indicator.status as IndicatorStatus) || 'none';
  const statusStyle = statusStyles[status];
  const hasStatus = indicator.status && indicator.status !== 'none' && indicator.status_label;

  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:border-primary/50 transition-colors">
      {/* 헤더: 아이콘 + 이름 + 상태 배지 */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg flex-shrink-0">{icon}</span>
          <span className="text-sm font-medium text-muted-foreground truncate">
            {indicator.name}
          </span>
        </div>
        
        {/* 상태 배지 (호버 시 판단 기준 표시) */}
        {hasStatus && (
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className={cn(
                  'px-2 py-0.5 text-xs font-medium rounded-full border flex-shrink-0 cursor-help',
                  statusStyle.bg,
                  statusStyle.text,
                  statusStyle.border
                )}>
                  {indicator.status_label}
                </span>
              </TooltipTrigger>
              {indicator.status_criteria && (
                <TooltipContent 
                  side="top" 
                  className="max-w-xs whitespace-pre-line text-left"
                >
                  <p className="font-medium mb-1">{indicator.name} 판단 기준</p>
                  <p className="text-xs">{indicator.status_criteria}</p>
                </TooltipContent>
              )}
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      {/* 비유 문구 (Simple 모드에서만) */}
      {!showChart && indicator.metaphor && (
        <p className="text-xs text-muted-foreground/70 mb-2 italic">
          "{indicator.metaphor}"
        </p>
      )}
      
      {/* 현재 값 */}
      <div className="text-2xl font-bold text-foreground mb-1">
        {formatValue(indicator.value)}
      </div>
      
      {/* 변동률 */}
      {changeDisplay && (
        <div className={cn('flex items-center gap-1 text-sm', changeDisplay.color)}>
          <changeDisplay.Icon className="h-4 w-4" />
          <span>{changeDisplay.value}</span>
        </div>
      )}
      
      {/* 스파크라인 (Chart 모드) */}
      {showChart && indicator.history && indicator.history.length > 0 && (
        <div className="mt-3">
          <MiniSparkline
            data={indicator.history}
            height={80}
            color={getSparklineColor()}
          />
        </div>
      )}
    </div>
  );
}
