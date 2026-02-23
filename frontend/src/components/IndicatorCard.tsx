/**
 * 경제 지표 카드 컴포넌트
 */

import { useState, useRef, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, Info, X } from 'lucide-react';
import type { EconomicIndicator, IndicatorStatus } from '@/types/economic';
import { MiniSparkline } from './MiniSparkline';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  icon = '📊',
}: IndicatorCardProps) {
  const [showDetail, setShowDetail] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // 바깥 클릭 시 닫기
  useEffect(() => {
    if (!showDetail) return;
    const handleClick = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setShowDetail(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showDetail]);

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
      case 'trillion': {
        const trillion = value / 1000;
        return `$${trillion.toFixed(2)}T`;
      }
      default:
        return value.toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
    }
  };

  const getChangeDisplay = () => {
    if (indicator.yoy_change !== null && indicator.yoy_change !== undefined) {
      const isPositive = indicator.yoy_change > 0;
      const isNeutral = indicator.yoy_change === 0;

      return {
        value: `YoY ${isPositive ? '+' : ''}${indicator.yoy_change.toFixed(1)}%`,
        color: isNeutral
          ? 'text-muted-foreground'
          : isPositive
            ? 'text-success'
            : 'text-destructive',
        Icon: isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown,
      };
    }

    if (indicator.change_percent !== null && indicator.change_percent !== undefined) {
      const isPositive = indicator.change_percent > 0;
      const isNeutral = Math.abs(indicator.change_percent) < 0.01;

      return {
        value: `${isPositive ? '+' : ''}${indicator.change_percent.toFixed(2)}%`,
        color: isNeutral
          ? 'text-muted-foreground'
          : isPositive
            ? 'text-success'
            : 'text-destructive',
        Icon: isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown,
      };
    }

    return null;
  };

  const changeDisplay = getChangeDisplay();

  const getSparklineColor = (): 'success' | 'destructive' | 'primary' => {
    if (indicator.change_percent !== null && indicator.change_percent !== undefined) {
      return indicator.change_percent >= 0 ? 'success' : 'destructive';
    }
    if (indicator.yoy_change !== null && indicator.yoy_change !== undefined) {
      return indicator.yoy_change >= 0 ? 'success' : 'destructive';
    }
    return 'primary';
  };

  const status = (indicator.status as IndicatorStatus) || 'none';
  const statusStyle = statusStyles[status];
  const hasStatus = indicator.status && indicator.status !== 'none' && indicator.status_label;
  const hasDetail = indicator.description || indicator.impact;

  return (
    <div ref={cardRef} className="relative">
      <div
        className={cn(
          'bg-card border rounded-lg p-4 transition-colors',
          showDetail
            ? 'border-primary/50 ring-1 ring-primary/20'
            : 'border-border hover:border-primary/50',
        )}
      >
        {/* 헤더: 아이콘 + 이름 + 상태 배지 */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg flex-shrink-0">{icon}</span>
            <span className="text-sm font-medium text-muted-foreground truncate">
              {indicator.name}
            </span>
            {hasDetail && (
              <button
                onClick={() => setShowDetail(!showDetail)}
                className={cn(
                  'flex-shrink-0 p-0.5 rounded-full transition-colors',
                  showDetail
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground/50 hover:text-muted-foreground hover:bg-muted',
                )}
                aria-label="상세 설명 보기"
              >
                {showDetail ? <X className="h-3.5 w-3.5" /> : <Info className="h-3.5 w-3.5" />}
              </button>
            )}
          </div>

          {hasStatus && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className={cn(
                      'px-2 py-0.5 text-xs font-medium rounded-full border flex-shrink-0 cursor-help',
                      statusStyle.bg,
                      statusStyle.text,
                      statusStyle.border,
                    )}
                  >
                    {indicator.status_label}
                  </span>
                </TooltipTrigger>
                {indicator.status_criteria && (
                  <TooltipContent side="top" className="max-w-xs whitespace-pre-line text-left">
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
          <p className="text-xs text-muted-foreground/70 mb-2 italic">"{indicator.metaphor}"</p>
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
            <MiniSparkline data={indicator.history} height={80} color={getSparklineColor()} />
          </div>
        )}
      </div>

      {/* 플로팅 상세 설명 패널 — 카드 바깥, 레이아웃에 영향 없음 */}
      {showDetail && hasDetail && (
        <div
          className="absolute left-0 right-0 top-full mt-2 z-50
          bg-card border border-primary/30 rounded-lg p-4 shadow-lg
          text-xs leading-relaxed space-y-2.5
          animate-in fade-in-0 zoom-in-95 duration-150"
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="text-base">{icon}</span>
              <span className="font-semibold text-sm text-foreground">{indicator.name}</span>
            </div>
            <button
              onClick={() => setShowDetail(false)}
              className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* 비유 문구 */}
          {indicator.metaphor && (
            <p className="text-primary/80 font-medium italic">"{indicator.metaphor}"</p>
          )}

          {indicator.description && (
            <div>
              <p className="font-semibold text-foreground mb-0.5">이게 뭔가요?</p>
              <p className="text-muted-foreground">{indicator.description}</p>
            </div>
          )}
          {indicator.impact && (
            <div>
              <p className="font-semibold text-foreground mb-0.5">왜 중요해요?</p>
              <p className="text-muted-foreground">{indicator.impact}</p>
            </div>
          )}
          {indicator.status_criteria && (
            <div>
              <p className="font-semibold text-foreground mb-0.5">판독기</p>
              <p className="text-muted-foreground whitespace-pre-line">
                {indicator.status_criteria}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
