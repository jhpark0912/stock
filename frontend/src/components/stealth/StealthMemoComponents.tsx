/**
 * StealthHomePage 공용 UI 컴포넌트 & 유틸
 * MemoSection, MemoBlock, MemoItem, CheckItem + 포맷 함수
 */

import type { EconomicIndicator, SectorData, SectorResponse } from '@/types/economic';

// 타입 re-export (하위 호환)
export type { SectorData, SectorResponse };

// ─── 유틸 함수 ───

export function formatIndicatorLine(
  indicator: EconomicIndicator | null,
  formatType: 'percent' | 'currency' | 'number' | 'trillion',
): string {
  if (!indicator || indicator.value === null) return '데이터 없음';

  let valueStr: string;
  switch (formatType) {
    case 'percent':
      valueStr = `${indicator.value.toFixed(2)}%`;
      break;
    case 'currency':
      valueStr = `$${indicator.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      break;
    case 'trillion':
      valueStr = `${(indicator.value / 1e12).toFixed(2)}T`;
      break;
    default:
      valueStr = indicator.value.toLocaleString('en-US', {
        minimumFractionDigits: 1,
        maximumFractionDigits: 2,
      });
  }

  const changeStr =
    indicator.change_percent !== null
      ? ` (${indicator.change_percent >= 0 ? '+' : ''}${indicator.change_percent.toFixed(1)}%)`
      : '';

  return `${valueStr}${changeStr}`;
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function getTodayString(): string {
  return new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function seasonToLabel(seasonName: string): string {
  if (seasonName.includes('봄') || seasonName.includes('회복')) return '회복 단계';
  if (seasonName.includes('여름') || seasonName.includes('활황')) return '성장 단계';
  if (seasonName.includes('가을') || seasonName.includes('후퇴')) return '조정 단계';
  if (seasonName.includes('겨울') || seasonName.includes('침체')) return '정비 단계';
  return seasonName;
}

// ─── 공용 UI 컴포넌트 ───

export function MemoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-border rounded-lg bg-card">
      <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-border">
        <h2 className="text-xs sm:text-sm font-medium text-foreground">{title}</h2>
      </div>
      <div className="px-3 sm:px-4 py-2.5 sm:py-3">{children}</div>
    </div>
  );
}

export function MemoBlock({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-1.5 sm:mb-2">
        {heading}
      </h3>
      <div className="space-y-1 pl-2 sm:pl-3">{children}</div>
    </div>
  );
}

export function MemoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5 sm:gap-2 text-xs sm:text-sm">
      <span className="text-muted-foreground shrink-0">-</span>
      <span className="text-muted-foreground shrink-0">{label}:</span>
      <span className="text-foreground break-all">{value}</span>
    </div>
  );
}

export function CheckItem({
  label,
  value,
  checked = false,
}: {
  label: string;
  value: string;
  checked?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-1.5 sm:gap-2 text-xs sm:text-sm">
      <span className="text-muted-foreground font-mono text-[10px] sm:text-xs shrink-0">
        {checked ? '[v]' : '[ ]'}
      </span>
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-foreground break-all">{value}</span>
    </div>
  );
}
