/**
 * 경제 지표 대시보드 메인 컴포넌트
 */

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, TrendingUp, BarChart3, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IndicatorCard } from './IndicatorCard';
import { LoadingSpinner } from './LoadingSpinner';
import { EconomicChartView, SectorHeatmap, MarketCycleSection, CountryTab, MarketReviewSection } from './economic';
import { api } from '@/lib/api';
import type {
  EconomicData, EconomicViewMode, EconomicResponse,
  KoreaEconomicData, KoreaEconomicResponse,
  Country
} from '@/types/economic';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

type EconomicTab = 'indicators' | 'sectors' | 'review';

interface EconomicIndicatorsProps {
  className?: string;
}

export function EconomicIndicators({ className }: EconomicIndicatorsProps) {
  const { user } = useAuth();
  const [country, setCountry] = useState<Country>(null);
  const [sectorCountry, setSectorCountry] = useState<Country>(null);  // 섹터 히트맵용 국가
  const [data, setData] = useState<EconomicData | null>(null);
  const [krData, setKrData] = useState<KoreaEconomicData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<EconomicViewMode>('simple');
  const [refreshing, setRefreshing] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [krHistoryLoaded, setKrHistoryLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<EconomicTab>('indicators');
  const [indicatorsLoaded, setIndicatorsLoaded] = useState(false);
  const [krIndicatorsLoaded, setKrIndicatorsLoaded] = useState(false);

  const fetchData = useCallback(async (targetCountry: Country, includeHistory: boolean = false) => {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (targetCountry) params.set('country', targetCountry);
      if (includeHistory) params.set('include_history', 'true');

      if (targetCountry === 'us') {
        const response = await api.get<EconomicResponse>(`/api/economic?${params}`);
        if (response.data.success && response.data.data) {
          setData(response.data.data);
          setIndicatorsLoaded(true);
          if (includeHistory) setHistoryLoaded(true);
        } else {
          setError(response.data.error || '경제 지표를 불러올 수 없습니다.');
        }
      } else if (targetCountry === 'kr') {
        const response = await api.get<KoreaEconomicResponse>(`/api/economic?${params}`);
        if (response.data.success && response.data.data) {
          setKrData(response.data.data);
          setKrIndicatorsLoaded(true);
          if (includeHistory) setKrHistoryLoaded(true);
        } else {
          setError(response.data.error || '한국 경제 지표를 불러올 수 없습니다.');
        }
      }
    } catch (err) {
      setError('경제 지표를 불러오는 중 오류가 발생했습니다.');
    }
  }, []);

  // 경제 지표 탭 선택 시 데이터 로드 (국가별)
  useEffect(() => {
    if (activeTab === 'indicators' && !loading && country !== null) {
      const needsLoad = (country === 'us' && !indicatorsLoaded) ||
                        (country === 'kr' && !krIndicatorsLoaded);
      if (needsLoad) {
        const loadData = async () => {
          setLoading(true);
          await fetchData(country, false);
          setLoading(false);
        };
        loadData();
      }
    }
  }, [activeTab, country, indicatorsLoaded, krIndicatorsLoaded, loading, fetchData]);

  // 뷰 모드 변경 시 히스토리 데이터 로드
  useEffect(() => {
    if (activeTab === 'indicators' && viewMode === 'chart' && country !== null) {
      const needsHistoryLoad = (country === 'us' && !historyLoaded) ||
                               (country === 'kr' && !krHistoryLoaded);
      if (needsHistoryLoad) {
        const loadHistoryData = async () => {
          setRefreshing(true);
          await fetchData(country, true);
          setRefreshing(false);
        };
        loadHistoryData();
      }
    }
  }, [activeTab, viewMode, country, historyLoaded, krHistoryLoaded, fetchData]);

  // 국가 변경 핸들러
  const handleCountryChange = (newCountry: Country) => {
    setCountry(newCountry);
  };

  const handleRefresh = async () => {
    if (country === null) return;
    setRefreshing(true);
    await fetchData(country, viewMode === 'chart');
    setRefreshing(false);
  };

  const handleViewModeChange = (mode: EconomicViewMode) => {
    setViewMode(mode);
  };

  // 서브 탭 헤더 컴포넌트
  const SubTabHeader = () => (
    <div className="px-6 pt-6 pb-4 border-b">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab('indicators')}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-md transition-colors',
              activeTab === 'indicators'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            경제 지표
          </button>
          <button
            onClick={() => setActiveTab('sectors')}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-md transition-colors',
              activeTab === 'sectors'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            섹터 히트맵
          </button>
          <button
            onClick={() => setActiveTab('review')}
            className={cn(
              'px-4 py-2 text-sm font-medium rounded-md transition-colors',
              activeTab === 'review'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            마감 리뷰
          </button>
        </div>
        {/* 국가 선택 탭 */}
        {activeTab === 'indicators' && (
          <CountryTab selected={country} onChange={handleCountryChange} />
        )}
        {activeTab === 'sectors' && (
          <CountryTab selected={sectorCountry} onChange={setSectorCountry} />
        )}
      </div>
    </div>
  );

  // 섹터 히트맵 탭
  if (activeTab === 'sectors') {
    return (
      <div className={cn('h-full', className)}>
        <SubTabHeader />
        <SectorHeatmap country={sectorCountry} />
      </div>
    );
  }

  // 마감 리뷰 탭
  if (activeTab === 'review') {
    return (
      <div className={cn('h-full flex flex-col overflow-hidden', className)}>
        <SubTabHeader />
        <div className="flex-1 overflow-auto">
          <MarketReviewSection />
        </div>
      </div>
    );
  }

  // 국가 선택 안내
  if (country === null) {
    return (
      <div className={cn('h-full', className)}>
        <SubTabHeader />
        <div className="flex items-center justify-center h-[calc(100%-80px)]">
          <div className="text-center max-w-md px-6">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
                <BarChart3 className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-2">
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
        <SubTabHeader />
        <LoadingSpinner message="경제 지표 로딩 중..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('h-full', className)}>
        <SubTabHeader />
        <div className="p-6">
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 text-center">
            <p className="text-destructive font-medium mb-2">오류 발생</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              다시 시도
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Chart 뷰 - 미국
  if (viewMode === 'chart' && country === 'us' && data) {
    return (
      <div className={cn('h-full', className)}>
        <SubTabHeader />
        <EconomicChartView
          data={data}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onViewModeChange={handleViewModeChange}
          country="us"
        />
      </div>
    );
  }

  // Chart 뷰 - 한국
  if (viewMode === 'chart' && country === 'kr' && krData) {
    return (
      <div className={cn('h-full', className)}>
        <SubTabHeader />
        <EconomicChartView
          data={krData as any}  // 타입 호환을 위해 임시로 any 사용
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onViewModeChange={handleViewModeChange}
          country="kr"
        />
      </div>
    );
  }

  // Simple 뷰
  return (
    <div className={cn('h-full', className)}>
      <SubTabHeader />

      <div className="p-6 space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BarChart3 className="h-6 w-6 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">시장 경제 지표</h2>
          </div>

          <div className="flex items-center gap-2">
            {/* 뷰 토글 */}
            <div className="flex items-center bg-muted rounded-lg p-1">
              <button
                onClick={() => setViewMode('simple')}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  viewMode === 'simple'
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
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
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Chart
              </button>
            </div>

            {/* 새로고침 버튼 */}
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="icon"
              disabled={refreshing}
            >
              <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            </Button>
          </div>
        </div>

        {/* 로딩 오버레이 */}
        {refreshing && (
          <div className="text-center text-sm text-muted-foreground">
            데이터 업데이트 중...
          </div>
        )}

        {/* 시장 사이클 섹션 */}
        {country === 'us' && <MarketCycleSection country="us" isAdmin={user?.role === 'admin'} />}
        {country === 'kr' && <MarketCycleSection country="kr" isAdmin={user?.role === 'admin'} />}

        {/* 미국 지표 */}
        {country === 'us' && (
          <>
            {/* 금리 & 변동성 섹션 */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium text-foreground">🇺🇸 금리 & 변동성</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <IndicatorCard
                  indicator={data?.rates.treasury_10y || null}
                  showChart={false}
                  formatType="percent"
                  icon="🏛️"
                />
                <IndicatorCard
                  indicator={data?.rates.treasury_3m || null}
                  showChart={false}
                  formatType="percent"
                  icon="🏛️"
                />
                <IndicatorCard
                  indicator={data?.rates.vix || null}
                  showChart={false}
                  formatType="number"
                  icon="📈"
                />
              </div>
            </section>

            {/* 거시경제 섹션 */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium text-foreground">🇺🇸 거시경제</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <IndicatorCard
                  indicator={data?.macro.cpi || null}
                  showChart={false}
                  formatType="number"
                  icon="📊"
                />
                <IndicatorCard
                  indicator={data?.macro.m2 || null}
                  showChart={false}
                  formatType="trillion"
                  icon="💵"
                />
              </div>
              {/* FRED API 안내 */}
              {(!data?.macro.cpi && !data?.macro.m2) && (
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

            {/* 원자재 섹션 */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium text-foreground">🇺🇸 원자재</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <IndicatorCard
                  indicator={data?.commodities.wti_oil || null}
                  showChart={false}
                  formatType="currency"
                  icon="🛢️"
                />
                <IndicatorCard
                  indicator={data?.commodities.gold || null}
                  showChart={false}
                  formatType="currency"
                  icon="💰"
                />
              </div>
            </section>

            {/* 마지막 업데이트 시간 */}
            {data?.last_updated && (
              <div className="text-center text-xs text-muted-foreground">
                마지막 업데이트: {new Date(data.last_updated).toLocaleString('ko-KR')}
              </div>
            )}
          </>
        )}

        {/* 한국 지표 */}
        {country === 'kr' && (
          <>
            {/* 금리 섹션 */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium text-foreground">🇰🇷 금리</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <IndicatorCard
                  indicator={krData?.rates.bond_10y || null}
                  showChart={false}
                  formatType="percent"
                  icon="🏛️"
                />
                <IndicatorCard
                  indicator={krData?.rates.base_rate || null}
                  showChart={false}
                  formatType="percent"
                  icon="🏛️"
                />
              </div>
            </section>

            {/* 신용 스프레드 섹션 */}
            {krData?.rates.credit_spread && (
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

            {/* 거시경제 섹션 */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium text-foreground">🇰🇷 거시경제</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <IndicatorCard
                  indicator={krData?.macro.cpi || null}
                  showChart={false}
                  formatType="number"
                  icon="📊"
                />
                <IndicatorCard
                  indicator={krData?.macro.m2 || null}
                  showChart={false}
                  formatType="trillion"
                  icon="💵"
                />
              </div>
              {/* ECOS API 안내 */}
              {(!krData?.macro.cpi && !krData?.macro.m2) && (
                <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                  <p>
                    💡 한국 CPI와 M2 데이터를 보려면 ECOS API 키가 필요합니다.
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

            {/* 환율 섹션 */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <DollarSign className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-medium text-foreground">🇰🇷 환율</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <IndicatorCard
                  indicator={krData?.fx.usd_krw || null}
                  showChart={false}
                  formatType="currency"
                  icon="💱"
                />
              </div>
            </section>

            {/* 마지막 업데이트 시간 */}
            {krData?.last_updated && (
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
