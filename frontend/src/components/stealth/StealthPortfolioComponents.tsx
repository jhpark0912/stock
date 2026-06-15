/**
 * StealthPortfolioPage 공용 UI 컴포넌트 & 유틸
 */

import type { InvestmentStrategy } from '@/types/stock';

export function NoteSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-xs font-medium text-muted-foreground mb-2">{title}</h2>
      <div className="pl-3">{children}</div>
    </div>
  );
}

export function ProjectInfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2 text-sm">
      <span className="text-muted-foreground">-</span>
      <span className="text-muted-foreground min-w-[5rem]">{label}:</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}

export function strategyToLabel(strategy: string): string {
  const s = strategy.toLowerCase() as InvestmentStrategy;
  const map: Record<InvestmentStrategy, string> = {
    buy: '확대',
    hold: '유지',
    sell: '축소',
  };
  return map[s] || strategy;
}
