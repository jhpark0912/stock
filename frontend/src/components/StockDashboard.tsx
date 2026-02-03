/**
 * 시장 대시보드 메인 컴포넌트
 * Sidebar (매물 목록) + Main Content (시장 정보) 레이아웃
 */

import { useState } from 'react';
import { Search, BarChart3, Sparkles, LineChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardDescription, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TickerListSidebar } from '@/components/TickerListSidebar';
import TechnicalChartCard from '@/components/TechnicalChartCard';
import StockAnalysis from '@/components/StockAnalysis';
import StockNews from '@/components/StockNews';
import { CompanyInfoCard, PriceCard } from '@/components/StockInfo';
import { FinancialMetricsCards } from '@/components/FinancialMetricsCards';
import DataCharts from '@/components/DataCharts';
import type { StockData, NewsItem, AIAnalysis } from '@/types/stock';
import type { UserSettings, SectionVisibility } from '@/types/user';

interface StockDashboardProps {
  /** 시장 데이터 */
  data: StockData | null;
  /** 뉴스 데이터 */
  newsData: NewsItem[] | null;
  /** AI 분석 데이터 */
  aiAnalysis: AIAnalysis | null;
  /** 사용자 설정 */
  userSettings: UserSettings;
  /** 검색 핸들러 */
  onSearch: (ticker: string) => void;
  /** 매물 등록 핸들러 */
  onAddTicker: (symbol: string) => void;
  /** 매물 제거 핸들러 */
  onRemoveTicker: (symbol: string) => void;
  /** 매물 선택 핸들러 */
  onSelectTicker: (symbol: string) => void;
  /** 매입가 업데이트 핸들러 */
  onUpdatePurchasePrice: (symbol: string, price: number | null) => void;
  /** 섹션 토글 핸들러 */
  onToggleSection: (sectionKey: keyof SectionVisibility) => void;
  /** 로딩 상태 */
  isLoading?: boolean;
}

export default function StockDashboard({
  data,
  newsData,
  aiAnalysis,
  userSettings,
  onSearch,
  onAddTicker,
  onRemoveTicker,
  onSelectTicker,
  onUpdatePurchasePrice,
  isLoading = false,
}: StockDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim().toUpperCase());
    }
  };

  // Empty State (데이터 없고 로딩 중이 아닐 때)
  if (!data && !isLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        {/* Sidebar - 매물 목록 */}
        <TickerListSidebar
          tickers={userSettings.tickers}
          selectedTicker={userSettings.selectedTicker}
          stockData={data}
          onAddTicker={onAddTicker}
          onRemoveTicker={onRemoveTicker}
          onSelectTicker={onSelectTicker}
        />

        {/* Main Content - Empty State */}
        <div className="flex-1 flex flex-col">
          <header className="bg-card shadow-sm px-4 py-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold">시장 분석</span>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-4 py-8">
            <div className="w-full max-w-6xl mx-auto">
              {/* 검색 폼 */}
              <div className="max-w-xl mx-auto text-center mb-12">
                <Search className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
                <p className="text-neutral-500 mb-6">
                  {userSettings.tickers.length > 0
                    ? '왼쪽에서 카테고리를 선택하거나 새로운 매물을 조회하세요'
                    : '매물 심볼을 입력하여 분석을 시작하세요'}
                </p>

                <form onSubmit={handleSearch} className="space-y-4">
                  <Input
                    type="text"
                    placeholder="예: AAPL, TSLA, GOOGL"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    disabled={isLoading || !searchQuery.trim()}
                    size="lg"
                    className="w-full"
                  >
                    <Search className="mr-2 h-4 w-4" />
                    {isLoading ? '로딩 중...' : '조회'}
                  </Button>
                </form>
              </div>

              {/* Dashboard 스타일 Card 샘플 */}
              <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    📊 Dashboard 스타일 Card 샘플
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    shadcn dashboard 구조 - Label + BigNumber + StatusText + Detail
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* 샘플 Card 1 */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Total Revenue</CardDescription>
                      <CardTitle className="text-3xl font-bold">$1,250.00</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <span>Trending up this month</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Visitors for the last 6 months
                      </p>
                    </CardContent>
                  </Card>

                  {/* 샘플 Card 2 */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Active Accounts</CardDescription>
                      <CardTitle className="text-3xl font-bold">45,678</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <span>Strong user retention</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Engagement exceed targets
                      </p>
                    </CardContent>
                  </Card>

                  {/* 샘플 Card 3 */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Growth Rate</CardDescription>
                      <CardTitle className="text-3xl font-bold">4.5%</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <span>Steady performance increase</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Meets growth projections
                      </p>
                    </CardContent>
                  </Card>

                  {/* 샘플 Card 4 */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardDescription>Conversion Rate</CardDescription>
                      <CardTitle className="text-3xl font-bold">12.3%</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-1 text-sm font-medium">
                        <span>Above industry average</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Optimized user experience
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  // Main Layout - Sidebar + Content
  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - 매물 목록 */}
      <TickerListSidebar
        tickers={userSettings.tickers}
        selectedTicker={userSettings.selectedTicker}
        stockData={data}
        onAddTicker={onAddTicker}
        onRemoveTicker={onRemoveTicker}
        onSelectTicker={onSelectTicker}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Sticky Header */}
        <header className="bg-card shadow-sm px-4 py-3 sticky top-0 z-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              <span className="text-lg font-semibold">시장 분석</span>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
              <Input
                type="text"
                placeholder="카테고리 조회..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="sm"
                disabled={isLoading || !searchQuery.trim()}
              >
                <Search className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </header>

        {/* Loading State or Main Content */}
        <main className="flex-1 overflow-y-auto px-4 py-4">
          {isLoading && (
            <div className="py-16">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                <p className="ml-4 text-neutral-600">데이터를 불러오는 중...</p>
              </div>
            </div>
          )}

          {!isLoading && data && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="mx-auto max-w-6xl">
                <TabsTrigger value="overview" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  개요
                </TabsTrigger>
                <TabsTrigger value="ai" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  AI 분석
                </TabsTrigger>
                <TabsTrigger value="chart" className="gap-2">
                  <LineChart className="h-4 w-4" />
                  차트
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: 개요 */}
              <TabsContent value="overview" className="mt-6">
                <div className="space-y-6 max-w-6xl mx-auto">
                  {/* Row 1: 회사 정보 + 현재가 */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <CompanyInfoCard data={data} className="lg:col-span-2" />
                    <PriceCard
                      data={data}
                      ticker={data.ticker}
                      purchasePrice={
                        userSettings.tickers.find(t => t.symbol === data.ticker)?.purchasePrice ?? null
                      }
                      onUpdatePurchasePrice={(price) => onUpdatePurchasePrice(data.ticker, price)}
                    />
                  </div>

                  {/* Row 2: 주요 재무 지표 */}
                  <FinancialMetricsCards data={data} />

                  {/* Row 3: 뉴스 */}
                  <StockNews news={newsData || []} />
                </div>
              </TabsContent>

              {/* Tab 2: AI 분석 */}
              <TabsContent value="ai" className="mt-6">
                <div className="max-w-6xl mx-auto">
                  <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-8">
                    <div className="flex items-center gap-3 mb-6">
                      <Sparkles className="h-6 w-6 text-primary" />
                      <h2 className="text-2xl font-bold">AI 투자 분석</h2>
                    </div>
                    <StockAnalysis analysis={aiAnalysis} error={null} />
                  </div>
                </div>
              </TabsContent>

              {/* Tab 3: 차트 */}
              <TabsContent value="chart" className="mt-6">
                <div className="space-y-6 max-w-6xl mx-auto">
                  {/* 기술적 지표 */}
                  <TechnicalChartCard data={data.technical_indicators} />

                  {/* 데이터 차트 */}
                  {data.chart_data && data.chart_data.length > 0 && (
                    <DataCharts chartData={data.chart_data} ticker={data.ticker} />
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </main>
      </div>
    </div>
  );
}
