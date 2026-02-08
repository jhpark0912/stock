/**
 * 국가 선택 탭 컴포넌트
 */

import type { Country } from '@/types/economic';
import { cn } from '@/lib/utils';

interface CountryTabProps {
  selected: Country;
  onChange: (country: Country) => void;
}

const COUNTRIES: { value: Country; label: string; flag: string }[] = [
  { value: 'us', label: '미국', flag: '🇺🇸' },
  { value: 'kr', label: '한국', flag: '🇰🇷' },
  { value: 'all', label: '전체', flag: '🌏' },
];

export function CountryTab({ selected, onChange }: CountryTabProps) {
  return (
    <div className="flex items-center bg-muted rounded-lg p-1">
      {COUNTRIES.map(({ value, label, flag }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-1.5',
            selected === value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <span>{flag}</span>
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
