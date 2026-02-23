/**
 * StealthHomePage - 경제지표 위장 페이지 (오케스트레이터)
 * 회의록(경제지표) / 사업현황(섹터) / 업무일지(마감리뷰) 3탭
 */

import { Search, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Country } from '@/types/economic';
import { useStealthHome } from '@/hooks/useStealthHome';
import { StealthMemoTab } from '@/components/stealth/StealthMemoTab';
import { StealthStatusTab } from '@/components/stealth/StealthStatusTab';
import { StealthJournalTab } from '@/components/stealth/StealthJournalTab';

function StealthCountryTab({
  selected,
  onChange,
  showAll = false,
}: {
  selected: Country;
  onChange: (c: Country) => void;
  showAll?: boolean;
}) {
  const items: { value: Country; label: string }[] = [
    { value: 'us', label: '해외팀' },
    { value: 'kr', label: '국내팀' },
  ];
  if (showAll) items.push({ value: 'all', label: '전체' });

  return (
    <div className="flex items-center gap-0.5 sm:gap-1 bg-muted rounded-lg p-1">
      {items.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={cn(
            'px-1.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap',
            selected === value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

const TABS = [
  { key: 'memo', label: '회의록' },
  { key: 'status', label: '사업현황' },
  { key: 'journal', label: '업무일지' },
] as const;

export function StealthHomePage() {
  const {
    activeTab,
    setActiveTab,
    usData,
    krData,
    usCycle,
    krCycle,
    memoLoading,
    memoError,
    searchQuery,
    setSearchQuery,
    matchesSearch,
    sectorCountry,
    setSectorCountry,
    sectors,
    sectorLastUpdated,
    sectorLoading,
    sectorError,
    reviewCountry,
    setReviewCountry,
    reviewData,
    reviewLoading,
    reviewError,
    handleRefresh,
    isLoading,
  } = useStealthHome();

  return (
    <div className="h-full min-h-0 flex flex-col bg-background">
      {/* 상단 헤더 */}
      <div className="flex-none border-b border-border px-3 sm:px-6 pt-3 sm:pt-4 pb-2 sm:pb-3">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <h1 className="text-base sm:text-lg font-medium text-foreground">내 메모</h1>
          <div className="flex items-center gap-2">
            {activeTab === 'memo' && (
              <div className="relative hidden sm:block">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-sm border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring w-40"
                />
              </div>
            )}
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
              title="새로고침"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-0.5 sm:gap-1 bg-muted rounded-lg p-1 overflow-x-auto">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={cn(
                  'px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap',
                  activeTab === key
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex-shrink-0">
            {activeTab === 'status' && (
              <StealthCountryTab selected={sectorCountry} onChange={setSectorCountry} showAll />
            )}
            {activeTab === 'journal' && (
              <StealthCountryTab selected={reviewCountry} onChange={setReviewCountry} />
            )}
          </div>
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="flex-1 overflow-auto px-3 sm:px-6 py-3 sm:py-4 space-y-4 sm:space-y-6">
        {activeTab === 'memo' && (
          <StealthMemoTab
            usData={usData}
            krData={krData}
            usCycle={usCycle}
            krCycle={krCycle}
            loading={memoLoading}
            error={memoError}
            hasData={usData || krData}
            matchesSearch={matchesSearch}
          />
        )}
        {activeTab === 'status' && (
          <StealthStatusTab
            sectors={sectors}
            loading={sectorLoading}
            error={sectorError}
            lastUpdated={sectorLastUpdated}
            country={sectorCountry}
          />
        )}
        {activeTab === 'journal' && (
          <StealthJournalTab
            data={reviewData}
            loading={reviewLoading}
            error={reviewError}
            country={reviewCountry}
          />
        )}
      </div>
    </div>
  );
}
