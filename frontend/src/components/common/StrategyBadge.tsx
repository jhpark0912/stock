/**
 * StrategyBadge - 투자 전략 배지 컴포넌트 (buy/hold/sell)
 */

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { InvestmentStrategy } from '@/types/stock';

export function StrategyBadge({ strategy }: { strategy: InvestmentStrategy }) {
  const styles: Record<InvestmentStrategy, string> = {
    buy: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    hold: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    sell: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  const icons: Record<InvestmentStrategy, React.ReactNode> = {
    buy: <TrendingUp className="h-4 w-4" />,
    hold: <Minus className="h-4 w-4" />,
    sell: <TrendingDown className="h-4 w-4" />,
  };

  const labels: Record<InvestmentStrategy, string> = {
    buy: '매수',
    hold: '보유',
    sell: '매도',
  };

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${styles[strategy]}`}
    >
      {icons[strategy]}
      {labels[strategy]}
    </span>
  );
}
