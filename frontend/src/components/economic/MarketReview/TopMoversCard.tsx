/**
 * 급등/급락 종목 카드 컴포넌트
 */

import { TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { StockMoverData } from '@/types/marketReview';

interface TopMoversCardProps {
  title: string;
  type: 'gainers' | 'losers';
  stocks: StockMoverData[];
  country: 'kr' | 'us';
}

function formatPrice(price: number, country: 'kr' | 'us'): string {
  if (country === 'kr') {
    return price.toLocaleString('ko-KR') + '원';
  }
  return '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatPercent(value: number): string {
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(2)}%`;
}

export function TopMoversCard({ title, type, stocks, country }: TopMoversCardProps) {
  const isGainers = type === 'gainers';
  const Icon = isGainers ? TrendingUp : TrendingDown;
  const iconColor = isGainers ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400';
  const headerBg = isGainers
    ? 'bg-emerald-50 dark:bg-emerald-950/30'
    : 'bg-red-50 dark:bg-red-950/30';

  return (
    <div className="bg-card border rounded-lg overflow-hidden">
      {/* 헤더 */}
      <div className={cn('px-4 py-3 flex items-center gap-2', headerBg)}>
        <Icon className={cn('h-5 w-5', iconColor)} />
        <h3 className="font-semibold text-foreground">{title}</h3>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground w-8">#</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">종목명</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">현재가</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">등락률</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock) => (
              <tr
                key={stock.symbol}
                className="border-b last:border-b-0 hover:bg-muted/20 transition-colors"
              >
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {stock.rank}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-sm text-foreground">
                    {stock.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stock.symbol}
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-sm font-medium text-foreground">
                  {formatPrice(stock.price, country)}
                </td>
                <td className={cn(
                  'px-4 py-3 text-right text-sm font-bold',
                  isGainers ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
                )}>
                  {formatPercent(stock.change_percent)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {stocks.length === 0 && (
        <div className="p-6 text-center text-sm text-muted-foreground">
          데이터가 없습니다.
        </div>
      )}
    </div>
  );
}
