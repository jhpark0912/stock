import { useState } from 'react';
import { Search, BarChart3, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TechnicalChartCard from '@/components/TechnicalChartCard';
import StockAnalysis from '@/components/StockAnalysis';
import StockNews from '@/components/StockNews';
import { CompanyInfoCard, PriceCard, FinancialMetricsCard } from '@/components/StockInfo';
import DataCharts from '@/components/DataCharts'; // 차트 컴포넌트 임포트
import type { StockData, NewsItem, AIAnalysis } from '@/types/stock';


export default function StockDashboard({
  data,
  newsData,
  aiAnalysis,
  onSearch,
  isLoading = false,
}: StockDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');


  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim().toUpperCase());
    }
  };

  // Empty State
  if (!data && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b px-4 py-3">
          <div className="max-w-6xl mx-auto flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-semibold">주식 분석</span>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-xl text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-6">티커 심볼을 입력하여 분석을 시작하세요</p>

            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                placeholder="예: AAPL, TSLA, GOOGL"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isLoading}
              />
              <Button
                type="submit"
                disabled={isLoading || !searchQuery.trim()}
                className="px-6 py-3"
              >
                {isLoading ? '로딩 중...' : '검색'}
              </Button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  // Main Layout
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <header className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-semibold">주식 분석</span>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
            <input
              type="text"
              placeholder="종목 검색..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="sm"
              disabled={isLoading || !searchQuery.trim()}
            >
              {isLoading ? '로딩 중...' : '검색'}
            </Button>
          </form>
        </div>
      </header>

      {/* Loading State or Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-4">
        {isLoading && (
          <div className="py-16">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="ml-4 text-gray-600">데이터를 불러오는 중...</p>
            </div>
          </div>
        )}

        {!isLoading && data && (
          <div className="space-y-4">
            {/* Row 1: 회사 정보 + 현재가 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <CompanyInfoCard data={data} className="lg:col-span-2" />
              <PriceCard data={data} />
            </div>

            {/* Row 2: 주요 재무 지표 */}
            <FinancialMetricsCard data={data} />

            {/* Row 3: AI 분석 */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 p-6 shadow-md">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-800">AI 투자 분석</h3>
              </div>
              <StockAnalysis analysis={aiAnalysis} error={null} />
            </div>

            {/* Row 4: 기술적 지표 + 뉴스 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <TechnicalChartCard data={data.technical_indicators} compact />
              <StockNews news={newsData?.slice(0, 5) || []} compact />
            </div>

            {/* Row 5: 데이터 차트 */}
            {data.chart_data && data.chart_data.length > 0 && (
                <DataCharts chartData={data.chart_data} ticker={data.ticker} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
