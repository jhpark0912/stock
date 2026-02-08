/**
 * 경제 지표 대시보드 메인 컴포넌트
 */

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, TrendingUp, BarChart3, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IndicatorCard } from './IndicatorCard';
import { LoadingSpinner } from './LoadingSpinner';
import { EconomicChartView, SectorHeatmap, MarketCycleSection } from './economic';
import { api } from '@/lib/api';
import type { EconomicData, EconomicViewMode, EconomicResponse } from '@/types/economic';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

type EconomicTab = 'indicators' | 'sectors';

interface EconomicIndicatorsProps {
  className?: string;
}

export function EconomicIndicators({ className }: EconomicIndicatorsProps) {
  const { user } = useAuth();
  const [data, setData] = useState<EconomicData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<EconomicViewMode>('simple');
  const [refreshing, setRefreshing] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState<EconomicTab>('indicators');
  const [indicatorsLoaded, setIndicatorsLoaded] = useState(false);

  const fetchData = useCallback(async (includeHistory: boolean = false) => {
    try {
      setError(null);
      const response = await api.get<EconomicResponse>(
        `/api/economic${includeHistory ? '?include_history=true' : ''}`
      );

      if (response.data.success && response.data.data) {
        setData(response.data.data);
        setIndicatorsLoaded(true);

        if (includeHistory) {
          setHistoryLoaded(true);
        }
      } else {
        setError(response.data.error || '경제 지표를 불러올 수 없습니다.');
      }
    } catch (err) {
      setError('경제 지표를 불러오는 중 오류가 발생했습니다.');
    }
  }, []);

  // 경제 지표 탭 선택 시 데이터 로드 (최초 1회)
  useEffect(() => {
    if (activeTab === 'indicators' && !indicatorsLoaded && !loading) {
      const loadData = async () => {
        setLoading(true);
        await fetchData(false);
        setLoading(false);
      };
      loadData();
    }
  }, [activeTab, indicatorsLoaded, loading, fetchData]);

  // 뷰 모드 변경 시 히스토리 데이터 로드
  useEffect(() => {
    if (activeTab === 'indicators' && viewMode === 'chart' && !historyLoaded) {
      const loadHistoryData = async () => {
        setRefreshing(true);
        await fetchData(true);
        setRefreshing(false);
      };
      loadHistoryData();
    }
  }, [activeTab, viewMode, historyLoaded, fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData(viewMode === 'chart');
    setRefreshing(false);
  };

  const handleViewModeChange = (mode: EconomicViewMode) => {
    setViewMode(mode);
  };

  // 서브 탭 헤더 컴포넌트
  const SubTabHeader = () => (
    <div className="px-6 pt-6 pb-4 border-b">
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
      </div>
    </div>
  );

  // 섹터 히트맵 탭
  if (activeTab === 'sectors') {
    return (
      <div className={cn('h-full', className)}>
        <SubTabHeader />
        <SectorHeatmap />
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

  // Chart 뷰
  if (viewMode === 'chart' && data) {
    return (
      <div className={cn('h-full', className)}>
        <SubTabHeader />
        <EconomicChartView
          data={data}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          onViewModeChange={handleViewModeChange}
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
        <MarketCycleSection isAdmin={user?.role === 'admin'} />

        {/* 금리 & 변동성 섹션 */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-medium text-foreground">금리 & 변동성</h3>
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
            <h3 className="text-lg font-medium text-foreground">거시경제</h3>
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
            <h3 className="text-lg font-medium text-foreground">원자재</h3>
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
      </div>
    </div>
  );
}
