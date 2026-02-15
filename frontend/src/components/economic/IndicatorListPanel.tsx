/**
 * 좌측 지표 목록 패널
 */

import type { EconomicIndicator } from '@/types/economic';
import { cn } from '@/lib/utils';

interface IndicatorItem {
  indicator: EconomicIndicator;
  category: string;
}

interface IndicatorListPanelProps {
  indicators: IndicatorItem[];
  selectedSymbol: string;
  onSelect: (symbol: string) => void;
}

// 카테고리별 아이콘
const categoryIcons: Record<string, string> = {
  // 미국
  '💵 금리 & 변동성': '💹',
  '📊 거시경제': '📈',
  '🛢️ 원자재': '🛢️',
  // 한국
  '🇰🇷 금리': '💹',
  '🇰🇷 거시경제': '📈',
  '🇰🇷 환율': '💱',
};

// 지표별 아이콘
const indicatorIcons: Record<string, string> = {
  // 미국
  '^TNX': '🏛️',
  '^IRX': '🏛️',
  '^VIX': '📊',
  'CL=F': '🛢️',
  'GC=F': '💰',
  'CPIAUCSL': '📊',
  'M2SL': '💵',
  // 한국
  'KR_BOND_10Y': '🏛️',
  'KR_BASE_RATE': '🏛️',
  'KR_CREDIT_SPREAD': '📊',
  'KR_CPI': '📊',
  'KR_M2': '💵',
  'KRW=X': '💱',
};

// 상태별 스타일
const statusColors: Record<string, string> = {
  good: 'text-green-600 dark:text-green-400',
  caution: 'text-yellow-600 dark:text-yellow-400',
  danger: 'text-red-600 dark:text-red-400',
  none: 'text-muted-foreground',
};

export function IndicatorListPanel({
  indicators,
  selectedSymbol,
  onSelect
}: IndicatorListPanelProps) {
  // 카테고리별로 그룹화
  const grouped = indicators.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, IndicatorItem[]>);

  // 값 포맷팅
  const formatValue = (indicator: EconomicIndicator): string => {
    if (indicator.value === null) return 'N/A';
    const value = indicator.value;
    const symbol = indicator.symbol;

    if (symbol.includes('TNX') || symbol.includes('IRX')) {
      return `${value.toFixed(2)}%`;
    }
    if (symbol.includes('VIX')) {
      return value.toFixed(2);
    }
    if (symbol.includes('CL=F') || symbol.includes('GC=F')) {
      return `$${value.toFixed(0)}`;
    }
    if (value >= 1000) {
      return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
    }
    return value.toFixed(2);
  };

  return (
    <div className="w-full lg:w-56 border-r border-border bg-card overflow-y-auto">
      {Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="py-2">
          {/* 카테고리 헤더 */}
          <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <span>{categoryIcons[category] || '📊'}</span>
            <span>{category}</span>
          </div>

          {/* 지표 목록 */}
          {items.map(({ indicator }) => {
            const isSelected = indicator.symbol === selectedSymbol;
            const icon = indicatorIcons[indicator.symbol] || '📊';
            const statusColor = statusColors[indicator.status || 'none'];

            return (
              <button
                key={indicator.symbol}
                onClick={() => onSelect(indicator.symbol)}
                className={cn(
                  'w-full px-4 py-3 text-left transition-colors',
                  'hover:bg-muted/50',
                  'focus:outline-none focus:bg-muted/50',
                  isSelected && 'bg-primary/10 border-l-2 border-primary'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base flex-shrink-0">{icon}</span>
                    <span className={cn(
                      'text-sm font-medium truncate',
                      isSelected ? 'text-foreground' : 'text-muted-foreground'
                    )}>
                      {indicator.name}
                    </span>
                  </div>
                </div>

                <div className="mt-1 flex items-center justify-between">
                  <span className={cn(
                    'text-lg font-bold',
                    isSelected ? 'text-foreground' : 'text-foreground/80'
                  )}>
                    {formatValue(indicator)}
                  </span>

                  {indicator.status_label && (
                    <span className={cn('text-xs font-medium', statusColor)}>
                      {indicator.status_label}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
