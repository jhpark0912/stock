/**
 * 지수 마감 요약 컴포넌트
 * KOSPI/KOSDAQ 또는 S&P 500/NASDAQ/DOW 지수를 개별 카드로 표시
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { IndexData } from '@/types/marketReview';

interface IndexSummaryProps {
  indices: IndexData[];
  country: 'kr' | 'us';
}

function formatNumber(value: number, decimals: number = 2): string {
  return value.toLocaleString('ko-KR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatChange(value: number): string {
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${formatNumber(value)}`;
}

function formatPercent(value: number): string {
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(2)}%`;
}

export function IndexSummary({ indices, country }: IndexSummaryProps) {
  const getFlag = () => {
    return country === 'kr' ? '🇰🇷' : '🇺🇸';
  };

  return (
    <div className={cn(
      'grid gap-4',
      indices.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'
    )}>
      {indices.map((index) => {
        const isPositive = index.change_percent > 0;
        const isNegative = index.change_percent < 0;
        const isNeutral = index.change_percent === 0;

        const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
        const iconColor = isPositive
          ? 'text-emerald-600 dark:text-emerald-400'
          : isNegative
            ? 'text-red-600 dark:text-red-400'
            : 'text-muted-foreground';
        const headerBg = isPositive
          ? 'bg-emerald-50 dark:bg-emerald-950/30'
          : isNegative
            ? 'bg-red-50 dark:bg-red-950/30'
            : 'bg-muted/30';

        return (
          <div
            key={index.symbol}
            className="bg-card border rounded-lg overflow-hidden"
          >
            {/* 헤더 */}
            <div className={cn('px-4 py-3 flex items-center gap-2', headerBg)}>
              <Icon className={cn('h-5 w-5', iconColor)} />
              <h3 className="font-semibold text-foreground">
                {getFlag()} {index.name}
              </h3>
            </div>

            {/* 콘텐츠 */}
            <div className="p-4">
              {/* 종가 */}
              <div className="text-2xl font-bold text-foreground mb-1">
                {formatNumber(index.close)}
              </div>

              {/* 등락폭/등락률 */}
              <div className={cn(
                'flex items-center gap-2 text-sm font-medium',
                isPositive && 'text-emerald-600 dark:text-emerald-400',
                isNegative && 'text-red-600 dark:text-red-400',
                isNeutral && 'text-muted-foreground'
              )}>
                <span>{formatChange(index.change)}</span>
                <span>({formatPercent(index.change_percent)})</span>
              </div>

              {/* 추가 정보 (고가/저가/거래량) */}
              {(index.high || index.low || index.volume) && (
                <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  {index.high && (
                    <div>
                      <div className="text-muted-foreground/60">고가</div>
                      <div className="font-medium">{formatNumber(index.high)}</div>
                    </div>
                  )}
                  {index.low && (
                    <div>
                      <div className="text-muted-foreground/60">저가</div>
                      <div className="font-medium">{formatNumber(index.low)}</div>
                    </div>
                  )}
                  {index.volume && (
                    <div>
                      <div className="text-muted-foreground/60">거래량</div>
                      <div className="font-medium">
                        {(index.volume / 1000000).toFixed(0)}M
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
