/**
 * 주요 종목 (시가총액 Top 5) 카드 컴포넌트
 */

import { Crown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MajorStockData } from '@/types/marketReview';

interface MajorStocksCardProps {
  title: string;
  stocks: MajorStockData[];
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

function formatMarketCap(value: number, country: 'kr' | 'us'): string {
  // 한국: 억원, 미국: 백만달러
  if (country === 'kr') {
    if (value >= 10000) {
      return (value / 10000).toFixed(1) + '조';
    }
    return value.toLocaleString('ko-KR') + '억';
  } else {
    if (value >= 1000) {
      return '$' + (value / 1000).toFixed(2) + 'T';
    }
    return '$' + value.toFixed(0) + 'B';
  }
}

export function MajorStocksCard({ title, stocks, country }: MajorStocksCardProps) {
  return (
    <div className="bg-card border rounded-lg overflow-hidden">
      {/* 헤더 */}
      <div className="px-4 py-3 flex items-center gap-2 bg-amber-50 dark:bg-amber-950/30">
        <Crown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
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
              <th className="px-4 py-2 text-right text-xs font-medium text-muted-foreground">시총</th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock) => {
              const isPositive = stock.change_percent > 0;
              const isNegative = stock.change_percent < 0;

              return (
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
                    isPositive && 'text-emerald-600 dark:text-emerald-400',
                    isNegative && 'text-red-600 dark:text-red-400',
                    !isPositive && !isNegative && 'text-muted-foreground'
                  )}>
                    {formatPercent(stock.change_percent)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-muted-foreground">
                    {formatMarketCap(stock.market_cap, country)}
                  </td>
                </tr>
              );
            })}
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
