/**
 * 경제 지표 서브 탭 헤더 (경제지표 / 섹터 / 리뷰 + 국가 선택)
 */

import { cn } from '@/lib/utils';
import { CountryTab } from './CountryTab';
import type { Country } from '@/types/economic';
import type { EconomicTab } from '@/hooks/useEconomicData';

interface EconomicSubTabsProps {
  activeTab: EconomicTab;
  onTabChange: (tab: EconomicTab) => void;
  country: Country;
  onCountryChange: (c: Country) => void;
  sectorCountry: Country;
  onSectorCountryChange: (c: Country) => void;
  reviewCountry: Country;
  onReviewCountryChange: (c: Country) => void;
}

const TABS: { key: EconomicTab; label: string }[] = [
  { key: 'indicators', label: '경제지표' },
  { key: 'sectors', label: '섹터' },
  { key: 'review', label: '리뷰' },
];

export function EconomicSubTabs({
  activeTab,
  onTabChange,
  country,
  onCountryChange,
  sectorCountry,
  onSectorCountryChange,
  reviewCountry,
  onReviewCountryChange,
}: EconomicSubTabsProps) {
  const countryProps =
    activeTab === 'indicators'
      ? { selected: country, onChange: onCountryChange }
      : activeTab === 'sectors'
        ? { selected: sectorCountry, onChange: onSectorCountryChange }
        : { selected: reviewCountry, onChange: onReviewCountryChange };

  return (
    <div className="px-3 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-0.5 sm:gap-1 bg-muted rounded-lg p-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={cn(
                'px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap',
                activeTab === tab.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex-shrink-0">
          <CountryTab selected={countryProps.selected} onChange={countryProps.onChange} />
        </div>
      </div>
    </div>
  );
}
