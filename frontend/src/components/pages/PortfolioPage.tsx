/**
 * PortfolioPage - 포트폴리오 관리 페이지
 * 데이터 로직은 usePortfolio 훅으로 분리됨
 */

import { useState } from 'react';
import { PanelLeft } from 'lucide-react';
import { Sidebar } from '../Sidebar';
import { HeroSection } from '../HeroSection';
import { MainTabs } from '../MainTabs';
import { CategoryMetrics } from '../CategoryMetrics';
import { StockChart } from '../StockChart';
import { GaugeBar } from '../GaugeBar';
import { LoadingSpinner } from '../LoadingSpinner';
import { AIAnalysisTab } from '../AIAnalysisTab';
import { usePortfolio } from '@/hooks/usePortfolio';

interface PortfolioPageProps {
  /** 설정 페이지로 이동하는 콜백 */
  onNavigateToSettings?: () => void;
}

export function PortfolioPage({ onNavigateToSettings }: PortfolioPageProps) {
  // 사이드바 토글 상태
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const {
    user,
    stockData,
    newsData,
    aiAnalysis,
    aiError,
    loadingStates,
    userSettings,
    handleAddTicker,
    handleRemoveTicker,
    handleSelectTicker,
    handleUpdatePurchasePrice,
    handleAnalyzeAI,
    displayData,
    sidebarTickers,
  } = usePortfolio();

  // 티커 선택 시 사이드바 닫기
  const handleSelectTickerWithClose = (symbol: string) => {
    handleSelectTicker(symbol);
    setSidebarOpen(false);
  };

  return (
    <div className="h-full min-h-0 flex flex-col">
      {/* 모바일 헤더 - 햄버거 메뉴 */}
      <div className="flex-none flex items-center gap-3 px-4 py-2 border-b border-border bg-card">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-md hover:bg-muted transition-colors"
          aria-label="티커 목록 열기"
        >
          <PanelLeft className="h-5 w-5 text-foreground" />
        </button>
        <span className="text-sm font-medium text-foreground">
          {userSettings.selectedTicker || '티커를 선택하세요'}
        </span>
      </div>

      {/* 사이드바 (슬라이드 오버레이) */}
      <Sidebar
        onTickerSelect={handleSelectTickerWithClose}
        onAddTicker={handleAddTicker}
        onRemoveTicker={handleRemoveTicker}
        onUpdatePurchasePrice={handleUpdatePurchasePrice}
        initialTickers={sidebarTickers}
        selectedTicker={userSettings.selectedTicker || sidebarTickers[0]?.symbol}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* 메인 콘텐츠 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 주식 선택 시에만 HeroSection 표시 */}
        {stockData && (
          <HeroSection
            ticker={displayData.ticker}
            companyName={displayData.companyName}
            currentPrice={displayData.currentPrice}
            priceChange={displayData.priceChange}
            priceChangePercent={displayData.priceChangePercent}
            marketCap={displayData.marketCap}
            sector={displayData.sector}
            purchasePrice={displayData.purchasePrice}
            quantity={displayData.quantity}
            hasData={displayData.hasData}
          />
        )}

        {/* 주식 미선택 시: 안내 메시지 */}
        {!stockData && !loadingStates.stock && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-lg text-muted-foreground mb-2">
                {userSettings.tickers.length === 0
                  ? '아직 등록된 티커가 없습니다.'
                  : '사이드바에서 티커를 선택하세요.'}
              </p>
              <p className="text-sm text-muted-foreground">
                {userSettings.tickers.length === 0
                  ? '사이드바에서 "Add Ticker"를 클릭하여 시작하세요.'
                  : '주식 정보를 확인하려면 티커를 클릭하세요.'}
              </p>
            </div>
          </div>
        )}

        {/* 주식 선택 시: MainTabs 표시 */}
        {(stockData || loadingStates.stock) && (
          <div className="flex-1 overflow-auto">
            <MainTabs>
              {(activeTab) => {
                switch (activeTab) {
                  case 'overview':
                    if (loadingStates.stock) {
                      return <LoadingSpinner message="Loading stock data..." />;
                    }
                    return stockData ? (
                      <CategoryMetrics financials={stockData.financials} />
                    ) : (
                      <div className="p-6">
                        <div className="bg-card border border-border rounded-lg p-6 text-center">
                          <p className="text-sm text-muted-foreground mb-1">
                            {userSettings.tickers.length === 0
                              ? 'No tickers added yet.'
                              : 'No data loaded.'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {userSettings.tickers.length === 0
                              ? 'Add a ticker from the sidebar to get started.'
                              : 'Click a ticker from the sidebar to load data.'}
                          </p>
                        </div>
                      </div>
                    );

                  case 'ai':
                    if (loadingStates.ai) {
                      return <LoadingSpinner message="AI is analyzing..." />;
                    }
                    return (
                      <AIAnalysisTab
                        stockData={stockData}
                        aiAnalysis={aiAnalysis}
                        aiError={aiError}
                        user={user}
                        onAnalyzeAI={handleAnalyzeAI}
                        onNavigateToSettings={onNavigateToSettings}
                        tickerCount={userSettings.tickers.length}
                      />
                    );

                  case 'chart':
                    if (loadingStates.stock) {
                      return <LoadingSpinner message="Loading chart data..." />;
                    }
                    return stockData ? (
                      <StockChart
                        ticker={stockData.ticker}
                        chartData={stockData.chart_data || null}
                        chartType="area"
                      />
                    ) : (
                      <div className="p-6">
                        <div className="bg-card border border-border rounded-lg p-6 text-center">
                          <p className="text-sm text-muted-foreground mb-1">
                            {userSettings.tickers.length === 0
                              ? 'No tickers added yet.'
                              : 'No chart data loaded.'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {userSettings.tickers.length === 0
                              ? 'Add a ticker from the sidebar to get started.'
                              : 'Click a ticker from the sidebar to load data.'}
                          </p>
                        </div>
                      </div>
                    );

                  case 'technical':
                    if (loadingStates.stock) {
                      return <LoadingSpinner message="Loading technical indicators..." />;
                    }
                    return (
                      <div className="p-6 space-y-4">
                        <div className="bg-card border border-border rounded-lg p-6">
                          <h2 className="text-xl font-semibold text-foreground mb-4">
                            기술적 지표
                          </h2>
                          {stockData?.technical_indicators ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <h3 className="text-sm font-medium text-muted-foreground">RSI (14일)</h3>
                                <p className="text-2xl font-bold text-foreground">
                                  {stockData.technical_indicators.rsi?.rsi14?.toFixed(1) || 'N/A'}
                                </p>
                                <GaugeBar
                                  percent={stockData.technical_indicators.rsi?.rsi14 || 0}
                                  colorType="success"
                                  height="md"
                                />
                                <p className="text-xs text-muted-foreground">
                                  {stockData.technical_indicators.rsi?.rsi14 && stockData.technical_indicators.rsi.rsi14 > 70
                                    ? '과매수'
                                    : stockData.technical_indicators.rsi?.rsi14 && stockData.technical_indicators.rsi.rsi14 < 30
                                    ? '과매도'
                                    : '중립'}
                                </p>
                              </div>

                              <div className="space-y-2">
                                <h3 className="text-sm font-medium text-muted-foreground">MACD</h3>
                                <p
                                  className={`text-2xl font-bold ${
                                    stockData.technical_indicators.macd?.macd && stockData.technical_indicators.macd.macd > 0
                                      ? 'text-success'
                                      : 'text-destructive'
                                  }`}
                                >
                                  {stockData.technical_indicators.macd?.macd
                                    ? (stockData.technical_indicators.macd.macd > 0 ? '+' : '') +
                                      stockData.technical_indicators.macd.macd.toFixed(2)
                                    : 'N/A'}
                                </p>
                                <GaugeBar
                                  percent={Math.min(Math.abs(stockData.technical_indicators.macd?.macd || 0) * 10, 100)}
                                  colorType={
                                    stockData.technical_indicators.macd?.macd && stockData.technical_indicators.macd.macd > 0
                                      ? 'success'
                                      : 'destructive'
                                  }
                                  height="md"
                                />
                                <p className="text-xs text-muted-foreground">
                                  {stockData.technical_indicators.macd?.macd && stockData.technical_indicators.macd.macd > 0
                                    ? '상승 신호'
                                    : '하락 신호'}
                                </p>
                              </div>

                              <div className="space-y-2">
                                <h3 className="text-sm font-medium text-muted-foreground">SMA (20일)</h3>
                                <p className="text-2xl font-bold text-foreground">
                                  ${stockData.technical_indicators.sma?.sma20?.toFixed(2) || 'N/A'}
                                </p>
                                <GaugeBar percent={55} colorType="primary" height="md" />
                                <p className="text-xs text-muted-foreground">
                                  {stockData.price.current > (stockData.technical_indicators.sma?.sma20 || 0)
                                    ? '현재가 상회'
                                    : '현재가 하회'}
                                </p>
                              </div>

                              <div className="space-y-2">
                                <h3 className="text-sm font-medium text-muted-foreground">볼린저밴드</h3>
                                <p className="text-2xl font-bold text-foreground">
                                  {stockData.technical_indicators.bollinger_bands?.middle
                                    ? `$${stockData.technical_indicators.bollinger_bands.middle.toFixed(2)}`
                                    : 'N/A'}
                                </p>
                                <GaugeBar percent={50} colorType="primary" height="md" />
                                <p className="text-xs text-muted-foreground">밴드 중앙 위치</p>
                              </div>
                            </div>
                          ) : (
                            <div className="text-center py-6">
                              <p className="text-sm text-muted-foreground mb-1">
                                {userSettings.tickers.length === 0
                                  ? 'No tickers added yet.'
                                  : 'No technical data loaded.'}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {userSettings.tickers.length === 0
                                  ? 'Add a ticker from the sidebar to get started.'
                                  : 'Click a ticker from the sidebar to load data.'}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );

                  case 'news':
                    if (loadingStates.news) {
                      return <LoadingSpinner message="Loading news..." />;
                    }
                    return (
                      <div className="p-6 space-y-3">
                        {newsData && newsData.length > 0 ? (
                          newsData.map((news, index) => (
                            <a
                              key={index}
                              href={news.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block bg-card border border-border rounded-lg p-4 hover:shadow-lg hover:border-primary/50 transition-all"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <h3 className="text-sm font-medium text-foreground mb-1 hover:text-primary transition-colors">
                                    {news.title}
                                  </h3>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    {news.source && <span>{news.source}</span>}
                                    {news.source && news.published_at && <span>•</span>}
                                    {news.published_at && (
                                      <span>{new Date(news.published_at).toLocaleDateString('ko-KR')}</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </a>
                          ))
                        ) : (
                          <div className="bg-card border border-border rounded-lg p-6 text-center">
                            <p className="text-sm text-muted-foreground mb-1">
                              {userSettings.tickers.length === 0
                                ? 'No tickers added yet.'
                                : stockData
                                ? 'No news available.'
                                : 'No data loaded.'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {userSettings.tickers.length === 0
                                ? 'Add a ticker from the sidebar to get started.'
                                : !stockData
                                ? 'Click a ticker from the sidebar to load data.'
                                : 'News will appear here when available.'}
                            </p>
                          </div>
                        )}
                      </div>
                    );

                  default:
                    return null;
                }
              }}
            </MainTabs>
          </div>
        )}
      </div>
    </div>
  );
}
