/**
 * 경제 지표 Chart 뷰 - 전체 페이지 레이아웃
 */

import { useState, useMemo } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IndicatorListPanel } from './IndicatorListPanel';
import { DetailChart } from './DetailChart';
import { StatusGauge } from './StatusGauge';
import { CompareSelector } from './CompareSelector';
import type { EconomicData, KoreaEconomicData, EconomicIndicator, Country } from '@/types/economic';
import { cn } from '@/lib/utils';

interface EconomicChartViewProps {
  data: EconomicData | KoreaEconomicData;
  onRefresh: () => void;
  refreshing: boolean;
  onViewModeChange: (mode: 'simple' | 'chart') => void;
  country: Country;
}

// 모든 지표를 플랫 배열로 변환 - 미국 데이터
function getUsIndicators(data: EconomicData): { indicator: EconomicIndicator; category: string }[] {
  const indicators: { indicator: EconomicIndicator; category: string }[] = [];

  // 금리 & 변동성
  if (data.rates.treasury_10y) indicators.push({ indicator: data.rates.treasury_10y, category: '💵 금리 & 변동성' });
  if (data.rates.treasury_3m) indicators.push({ indicator: data.rates.treasury_3m, category: '💵 금리 & 변동성' });
  if (data.rates.vix) indicators.push({ indicator: data.rates.vix, category: '💵 금리 & 변동성' });

  // 거시경제
  if (data.macro.philly_fed) indicators.push({ indicator: data.macro.philly_fed, category: '📊 거시경제' });
  if (data.macro.cfnai) indicators.push({ indicator: data.macro.cfnai, category: '📊 거시경제' });
  if (data.macro.umcsent) indicators.push({ indicator: data.macro.umcsent, category: '📊 거시경제' });
  if (data.macro.cpi) indicators.push({ indicator: data.macro.cpi, category: '📊 거시경제' });
  if (data.macro.m2) indicators.push({ indicator: data.macro.m2, category: '📊 거시경제' });

  // 원자재
  if (data.commodities.wti_oil) indicators.push({ indicator: data.commodities.wti_oil, category: '🛢️ 원자재' });
  if (data.commodities.gold) indicators.push({ indicator: data.commodities.gold, category: '🛢️ 원자재' });

  return indicators;
}

// 모든 지표를 플랫 배열로 변환 - 한국 데이터
function getKrIndicators(data: KoreaEconomicData): { indicator: EconomicIndicator; category: string }[] {
  const indicators: { indicator: EconomicIndicator; category: string }[] = [];

  // 금리
  if (data.rates.bond_10y) indicators.push({ indicator: data.rates.bond_10y, category: '🇰🇷 금리' });
  if (data.rates.base_rate) indicators.push({ indicator: data.rates.base_rate, category: '🇰🇷 금리' });
  if (data.rates.credit_spread) indicators.push({ indicator: data.rates.credit_spread, category: '🇰🇷 금리' });

  // 거시경제
  if (data.macro.leading_index) indicators.push({ indicator: data.macro.leading_index, category: '🇰🇷 거시경제' });
  if (data.macro.ccsi) indicators.push({ indicator: data.macro.ccsi, category: '🇰🇷 거시경제' });
  if (data.macro.export) indicators.push({ indicator: data.macro.export, category: '🇰🇷 거시경제' });

  // 환율
  if (data.fx.usd_krw) indicators.push({ indicator: data.fx.usd_krw, category: '🇰🇷 환율' });

  return indicators;
}

// 국가에 따라 적절한 함수 호출
function getAllIndicators(data: EconomicData | KoreaEconomicData, country: Country): { indicator: EconomicIndicator; category: string }[] {
  if (country === 'kr') {
    return getKrIndicators(data as KoreaEconomicData);
  } else {
    return getUsIndicators(data as EconomicData);
  }
}

export function EconomicChartView({
  data,
  onRefresh,
  refreshing,
  onViewModeChange,
  country
}: EconomicChartViewProps) {
  // 선택된 지표 (기본: 첫 번째 지표)
  const allIndicators = useMemo(() => getAllIndicators(data, country), [data, country]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>(
    allIndicators[0]?.indicator.symbol || ''
  );

  // 비교할 지표들
  const [compareSymbols, setCompareSymbols] = useState<string[]>([]);

  // 모바일 뷰 상태: 'list' | 'chart'
  const [mobileView, setMobileView] = useState<'list' | 'chart'>('list');

  // 선택된 지표 찾기
  const selectedIndicator = useMemo(() => {
    return allIndicators.find(item => item.indicator.symbol === selectedSymbol)?.indicator || null;
  }, [allIndicators, selectedSymbol]);

  // 비교 지표들 찾기
  const compareIndicators = useMemo(() => {
    return allIndicators
      .filter(item => compareSymbols.includes(item.indicator.symbol))
      .map(item => item.indicator);
  }, [allIndicators, compareSymbols]);

  // 비교 지표 토글
  const handleCompareToggle = (symbol: string) => {
    setCompareSymbols(prev =>
      prev.includes(symbol)
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  return (
    <div className="flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="text-lg sm:text-xl font-semibold text-foreground">시장 경제 지표</h2>

        <div className="flex items-center gap-2">
          {/* 뷰 토글 */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            <button
              onClick={() => onViewModeChange('simple')}
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                'text-muted-foreground hover:text-foreground'
              )}
            >
              Simple
            </button>
            <button
              className={cn(
                'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                'bg-background text-foreground shadow-sm'
              )}
            >
              Chart
            </button>
          </div>

          {/* 새로고침 */}
          <Button
            onClick={onRefresh}
            variant="outline"
            size="icon"
            disabled={refreshing}
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* 모바일 탭 토글 */}
      <div className="flex lg:hidden border-b border-border">
        <button
          onClick={() => setMobileView('list')}
          className={cn(
            'flex-1 py-3 text-sm font-medium transition-colors',
            mobileView === 'list'
              ? 'text-primary border-b-2 border-primary bg-primary/5'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          📋 지표 목록
        </button>
        <button
          onClick={() => setMobileView('chart')}
          className={cn(
            'flex-1 py-3 text-sm font-medium transition-colors',
            mobileView === 'chart'
              ? 'text-primary border-b-2 border-primary bg-primary/5'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          📈 차트
        </button>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="flex">
        {/* 좌측: 지표 목록 - 모바일에서는 탭에 따라 표시/숨김 */}
        <div className={cn(
          'lg:block lg:w-56 lg:flex-shrink-0',
          mobileView === 'list' ? 'block w-full' : 'hidden'
        )}>
          <IndicatorListPanel
            indicators={allIndicators}
            selectedSymbol={selectedSymbol}
            onSelect={(symbol) => {
              setSelectedSymbol(symbol);
              setMobileView('chart'); // 지표 선택 시 자동으로 차트 뷰로 전환
            }}
          />
        </div>

        {/* 우측: 상세 정보 - 모바일에서는 탭에 따라 표시/숨김 */}
        <div className={cn(
          'flex-1 p-4 sm:p-6',
          'lg:block',
          mobileView === 'chart' ? 'block' : 'hidden'
        )}>
          {selectedIndicator ? (
            <div className="space-y-6">
              {/* 지표 헤더 */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-foreground">
                    {selectedIndicator.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedIndicator.symbol}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-foreground">
                    {formatValue(selectedIndicator)}
                  </div>
                  {selectedIndicator.change_percent !== null && (
                    <div className={cn(
                      'text-sm font-medium',
                      selectedIndicator.change_percent >= 0 ? 'text-success' : 'text-destructive'
                    )}>
                      {selectedIndicator.change_percent >= 0 ? '▲' : '▼'}{' '}
                      {selectedIndicator.change_percent >= 0 ? '+' : ''}
                      {selectedIndicator.change_percent.toFixed(2)}%
                    </div>
                  )}
                </div>
              </div>

              {/* 메인 차트 */}
              <DetailChart
                indicator={selectedIndicator}
                compareIndicators={compareIndicators}
              />

              {/* 하단 정보 영역 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 판단 기준 */}
                <StatusGauge indicator={selectedIndicator} />

                {/* 비교 지표 선택 */}
                <CompareSelector
                  indicators={allIndicators.map(i => i.indicator)}
                  selectedSymbol={selectedSymbol}
                  compareSymbols={compareSymbols}
                  onToggle={handleCompareToggle}
                />
              </div>

              {/* 설명 */}
              {selectedIndicator.metaphor && (
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">"{selectedIndicator.metaphor}"</span>
                    {selectedIndicator.description && (
                      <span className="ml-2">- {selectedIndicator.description}</span>
                    )}
                  </p>
                  {selectedIndicator.impact && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {selectedIndicator.impact}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              지표를 선택해주세요
            </div>
          )}
        </div>
      </div>

      {/* 마지막 업데이트 */}
      {data.last_updated && (
        <div className="p-2 text-center text-xs text-muted-foreground border-t border-border">
          마지막 업데이트: {new Date(data.last_updated).toLocaleString('ko-KR')}
        </div>
      )}
    </div>
  );
}

// 값 포맷팅 헬퍼
function formatValue(indicator: EconomicIndicator): string {
  if (indicator.value === null) return 'N/A';

  const symbol = indicator.symbol;
  const value = indicator.value;

  // 금리 지표 (%)
  if (symbol.includes('TNX') || symbol.includes('IRX')) {
    return `${value.toFixed(2)}%`;
  }

  // VIX
  if (symbol.includes('VIX')) {
    return value.toFixed(2);
  }

  // 원자재 ($)
  if (symbol.includes('CL=F') || symbol.includes('GC=F')) {
    return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  // FRED 데이터 (CPI, M2)
  if (value >= 1000) {
    return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  return value.toFixed(2);
}
