/**
 * 비교 지표 선택 컴포넌트
 */

import { Check } from 'lucide-react';
import type { EconomicIndicator } from '@/types/economic';
import { cn } from '@/lib/utils';

interface CompareSelectorProps {
  indicators: EconomicIndicator[];
  selectedSymbol: string;  // 메인으로 선택된 지표 (비교 대상에서 제외)
  compareSymbols: string[];  // 비교할 지표들
  onToggle: (symbol: string) => void;
}

// 지표별 아이콘
const indicatorIcons: Record<string, string> = {
  '^TNX': '🏛️',
  '^IRX': '🏛️',
  '^VIX': '📊',
  'CL=F': '🛢️',
  'GC=F': '💰',
  'CPIAUCSL': '📊',
  'M2SL': '💵',
};

export function CompareSelector({
  indicators,
  selectedSymbol,
  compareSymbols,
  onToggle
}: CompareSelectorProps) {
  // 메인 지표 제외
  const availableIndicators = indicators.filter(i => i.symbol !== selectedSymbol);

  // 히스토리가 있는 지표만 비교 가능
  const comparableIndicators = availableIndicators.filter(i => i.history && i.history.length > 0);

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
        <span>📊</span>
        관련 지표 비교
      </h4>

      {comparableIndicators.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          비교 가능한 지표가 없습니다
        </p>
      ) : (
        <div className="space-y-2">
          {comparableIndicators.map((indicator) => {
            const isSelected = compareSymbols.includes(indicator.symbol);
            const icon = indicatorIcons[indicator.symbol] || '📊';

            return (
              <button
                key={indicator.symbol}
                onClick={() => onToggle(indicator.symbol)}
                className={cn(
                  'w-full flex items-center justify-between p-2 rounded-md transition-colors',
                  'hover:bg-muted/50',
                  isSelected && 'bg-primary/10'
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{icon}</span>
                  <span className={cn(
                    'text-sm',
                    isSelected ? 'text-foreground font-medium' : 'text-muted-foreground'
                  )}>
                    {indicator.name}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {formatValue(indicator)}
                  </span>

                  <div className={cn(
                    'w-5 h-5 rounded border flex items-center justify-center transition-colors',
                    isSelected
                      ? 'bg-primary border-primary text-primary-foreground'
                      : 'border-border'
                  )}>
                    {isSelected && <Check className="h-3 w-3" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {compareSymbols.length > 0 && (
        <p className="text-xs text-muted-foreground mt-3">
          {compareSymbols.length}개 지표 비교 중
        </p>
      )}
    </div>
  );
}

// 값 포맷팅 헬퍼
function formatValue(indicator: EconomicIndicator): string {
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
  return value.toFixed(2);
}
