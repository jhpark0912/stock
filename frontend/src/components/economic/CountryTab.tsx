/**
 * 국가 선택 탭 컴포넌트
 */

import type { Country } from '@/types/economic';
import { cn } from '@/lib/utils';
import { Globe } from 'lucide-react';

interface CountryTabProps {
  selected: Country;
  onChange: (country: Country) => void;
}

type CountryConfig = {
  value: Country;
  label: string;
  flagCode?: string;  // flagcdn.com 국가 코드
  isGlobe?: boolean;
};

const COUNTRIES: CountryConfig[] = [
  { value: 'us', label: '미국', flagCode: 'us' },
  { value: 'kr', label: '한국', flagCode: 'kr' },
  { value: 'all', label: '전체', isGlobe: true },
];

export function CountryTab({ selected, onChange }: CountryTabProps) {
  return (
    <div className="flex items-center bg-muted rounded-lg p-1">
      {COUNTRIES.map(({ value, label, flagCode, isGlobe }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={cn(
            'px-1.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center gap-1 sm:gap-1.5',
            selected === value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {isGlobe ? (
            <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          ) : (
            <img
              src={`https://flagcdn.com/w40/${flagCode}.png`}
              srcSet={`https://flagcdn.com/w80/${flagCode}.png 2x`}
              alt={label}
              className="w-4 h-3 sm:w-5 sm:h-3.5 rounded-sm object-cover"
            />
          )}
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
}
