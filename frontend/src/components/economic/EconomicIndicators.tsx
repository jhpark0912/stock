/**
 * 경제 지표 대시보드 메인 컴포넌트
 */

import { RefreshCw, TrendingUp, BarChart3, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IndicatorCard } from './IndicatorCard';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { EconomicChartView } from './EconomicChartView';
import { SectorHeatmap } from './SectorHeatmap';
import { MarketCycleSection } from './MarketCycleSection';
import { MarketReviewSection } from './MarketReview';
import { EconomicSubTabs } from './EconomicSubTabs';
import { useEconomicData } from '@/hooks/economic/useEconomicData';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface EconomicIndicatorsProps {
  className?: string;
}

export function EconomicIndicators({ className }: EconomicIndicatorsProps) {
  const { user } = useAuth();
  const {
    country,
    setCountry,
    sectorCountry,
    setSectorCountry,
    reviewCountry,
    setReviewCountry,
    data,
    krData,
    loading,
    error,
    viewMode,
    setViewMode,
    refreshing,
    activeTab,
    setActiveTab,
    handleRefresh,
  } = useEconomicData();

  const subTabs = (
    <EconomicSubTabs
      activeTab={activeTab}
      onTabChange={setActiveTab}
      country={country}
      onCountryChange={setCountry}
      sectorCountry={sectorCountry}
      onSectorCountryChange={setSectorCountry}
      reviewCountry={reviewCountry}
      onReviewCountryChange={setReviewCountry}
    />
  );

  // 섹터 히트맵 탭
  if (activeTab === 'sectors') {
    return (
      <div className={cn('h-full', className)}>
        {subTabs}
        <SectorHeatmap country={sectorCountry} />
      </div>
    );
  }

  // 마감 리뷰 탭
  if (activeTab === 'review') {
    if (reviewCountry === null || reviewCountry === 'all') {
      return (
        <div className={cn('h-full', className)}>
          {subTabs}
          <div className="flex items-center justify-center h-[calc(100%-80px)]">
            <div className="text-center max-w-md px-6">
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
                  <TrendingUp className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                  마감 리뷰를 확인할 국가를 선택하세요
                </h3>
                <p className="text-sm text-muted-foreground">
                  상단 우측의 국가 탭을 클릭하여 시작하세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className={cn('h-full flex flex-col overflow-hidden', className)}>
        {subTabs}
        <div className="flex-1 overflow-auto">
          <MarketReviewSection country={reviewCountry} />
        </div>
      </div>
    );
  }

  // 국가 미선택
  if (country === null) {
    return (
      <div className={cn('h-full', className)}>
        {subTabs}
        <div className="flex items-center justify-center h-[calc(100%-80px)]">
          <div className="text-center max-w-md px-6">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
                <BarChart3 className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                경제 지표를 확인할 국가를 선택하세요
              </h3>
              <p className="text-sm text-muted-foreground">
                상단 우측의 국가 탭을 클릭하여 시작하세요.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={cn('h-full', className)}>
        {subTabs}
        <LoadingSpinner message="경제 지표 로딩 중..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('h-full', className)}>
        {subTabs}
        <div className="p-6">
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 text-center">
            <p className="text-destructive font-medium mb-2">오류 발생</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={handleRefresh} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              다시 시도
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Chart 뷰
  if (viewMode === 'chart') {
    const chartData = country === 'kr' ? krData : data;
    if (chartData) {
      return (
        <div className={cn('h-full', className)}>
          {subTabs}
          <EconomicChartView
            data={chartData as any}
            onRefresh={handleRefresh}
            refreshing={refreshing}
            onViewModeChange={setViewMode}
            country={country}
          />
        </div>
      );
    }
  }

  // Simple 뷰
  return (
    <div className={cn('h-full', className)}>
      {subTabs}
      <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-primary" />
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">시장 경제 지표</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-muted rounded-lg p-1">
              <button
                onClick={() => setViewMode('simple')}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  viewMode === 'simple'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Simple
              </button>
              <button
                onClick={() => setViewMode('chart')}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  viewMode === 'chart'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                Chart
              </button>
            </div>
            <Button onClick={handleRefresh} variant="outline" size="icon" disabled={refreshing}>
              <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            </Button>
          </div>
        </div>

        {refreshing && (
          <div className="text-center text-sm text-muted-foreground">데이터 업데이트 중...</div>
        )}

        <MarketCycleSection
          country={country === 'all' ? undefined : country}
          isAdmin={user?.role === 'admin'}
        />

        {/* 미국 지표 */}
        {country === 'us' && data && (
          <>
            <section>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium text-foreground">🇺🇸 금리 & 변동성</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <IndicatorCard
                  indicator={data.rates.treasury_10y || null}
                  showChart={false}
                  formatType="percent"
                  icon="🏛️"
                />
                <IndicatorCard
                  indicator={data.rates.treasury_3m || null}
                  showChart={false}
                  formatType="percent"
                  icon="🏛️"
                />
                <IndicatorCard
                  indicator={data.rates.vix || null}
                  showChart={false}
                  formatType="number"
                  icon="📈"
                />
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium text-foreground">🇺🇸 거시경제</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <IndicatorCard
                  indicator={data.macro.philly_fed || null}
                  showChart={false}
                  formatType="number"
                  icon="🏭"
                />
                <IndicatorCard
                  indicator={data.macro.cfnai || null}
                  showChart={false}
                  formatType="number"
                  icon="📋"
                />
                <IndicatorCard
                  indicator={data.macro.umcsent || null}
                  showChart={false}
                  formatType="number"
                  icon="👛"
                />
                <IndicatorCard
                  indicator={data.macro.cpi || null}
                  showChart={false}
                  formatType="number"
                  icon="📊"
                />
                <IndicatorCard
                  indicator={data.macro.m2 || null}
                  showChart={false}
                  formatType="trillion"
                  icon="💵"
                />
              </div>
              {!data.macro.cpi && !data.macro.m2 && (
                <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                  <p>
                    💡 CPI와 M2 데이터를 보려면 FRED API 키가 필요합니다.
                    <a
                      href="https://fred.stlouisfed.org/docs/api/api_key.html"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline ml-1"
                    >
                      API 키 발급 →
                    </a>
                  </p>
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium text-foreground">🇺🇸 원자재</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <IndicatorCard
                  indicator={data.commodities.wti_oil || null}
                  showChart={false}
                  formatType="currency"
                  icon="🛢️"
                />
                <IndicatorCard
                  indicator={data.commodities.gold || null}
                  showChart={false}
                  formatType="currency"
                  icon="💰"
                />
              </div>
            </section>

            {data.last_updated && (
              <div className="text-center text-xs text-muted-foreground">
                마지막 업데이트: {new Date(data.last_updated).toLocaleString('ko-KR')}
              </div>
            )}
          </>
        )}

        {/* 한국 지표 */}
        {country === 'kr' && krData && (
          <>
            <section>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium text-foreground">🇰🇷 금리</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <IndicatorCard
                  indicator={krData.rates.bond_10y || null}
                  showChart={false}
                  formatType="percent"
                  icon="🏛️"
                />
                <IndicatorCard
                  indicator={krData.rates.base_rate || null}
                  showChart={false}
                  formatType="percent"
                  icon="🏛️"
                />
              </div>
            </section>

            {krData.rates.credit_spread && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-medium text-foreground">🇰🇷 신용 스프레드</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <IndicatorCard
                    indicator={krData.rates.credit_spread}
                    showChart={false}
                    formatType="percent"
                    icon="📊"
                  />
                </div>
              </section>
            )}

            <section>
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium text-foreground">🇰🇷 거시경제</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <IndicatorCard
                  indicator={krData.macro.leading_index || null}
                  showChart={false}
                  formatType="number"
                  icon="🧭"
                />
                <IndicatorCard
                  indicator={krData.macro.ccsi || null}
                  showChart={false}
                  formatType="number"
                  icon="😊"
                />
                <IndicatorCard
                  indicator={krData.macro.export || null}
                  showChart={false}
                  formatType="number"
                  icon="🚢"
                />
              </div>
              {!krData.macro.leading_index && !krData.macro.ccsi && !krData.macro.export && (
                <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                  <p>
                    💡 한국 거시경제 지표를 보려면 ECOS API 키가 필요합니다.
                    <a
                      href="https://ecos.bok.or.kr/api/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline ml-1"
                    >
                      API 키 발급 →
                    </a>
                  </p>
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium text-foreground">🇰🇷 환율</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <IndicatorCard
                  indicator={krData.fx.usd_krw || null}
                  showChart={false}
                  formatType="currency"
                  icon="💱"
                />
              </div>
            </section>

            {krData.last_updated && (
              <div className="text-center text-xs text-muted-foreground">
                마지막 업데이트: {new Date(krData.last_updated).toLocaleString('ko-KR')}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
