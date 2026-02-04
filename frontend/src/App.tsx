import { useState, useEffect } from 'react';
import axios from 'axios';
import { AppLayout } from './components/AppLayout';
import { Sidebar } from './components/Sidebar';
import { HeroSection } from './components/HeroSection';
import { MainTabs } from './components/MainTabs';
import { CategoryMetrics } from './components/CategoryMetrics';
import { StockChart } from './components/StockChart';
import { GaugeBar } from './components/GaugeBar';
import { LoadingSpinner } from './components/LoadingSpinner';
import { api } from './lib/api';
import type { ApiResponse } from './lib/api';
import type { StockData, NewsItem, AIAnalysis } from './types/stock';
import type { UserSettings, SectionVisibility } from './types/user';
import { loadSettings, saveSettings } from './utils/storage';

function App() {
  // 시장 데이터 상태
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [newsData, setNewsData] = useState<NewsItem[] | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [, setError] = useState<string | null>(null);

  // 탭별 독립적인 로딩 상태
  const [loadingStates, setLoadingStates] = useState({
    stock: false,    // 주식 기본 데이터 (Overview, Chart, Technical)
    news: false,     // 뉴스
    ai: false,       // AI 분석
  });

  // 사용자 설정 상태 (localStorage에서 로드)
  const [userSettings, setUserSettings] = useState<UserSettings>(() => loadSettings());

  // userSettings 변경 시 localStorage에 자동 저장
  useEffect(() => {
    saveSettings(userSettings);
  }, [userSettings]);

  // 초기 자동 로딩 제거 - 사용자가 직접 티커를 선택할 때까지 대기
  // useEffect(() => {
  //   if (
  //     userSettings.selectedTicker &&
  //     userSettings.tickers.length > 0 &&
  //     userSettings.tickers.some(t => t.symbol === userSettings.selectedTicker) &&
  //     !stockData
  //   ) {
  //     fetchStockData(userSettings.selectedTicker);
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  const fetchStockData = async (tickerSymbol: string) => {
    // 모든 상태 초기화
    setLoadingStates({ stock: true, news: true, ai: true });
    setError(null);
    setStockData(null);
    setNewsData(null);
    setAiAnalysis(null);

    try {
      // 1. 주식 데이터 먼저 로드 (가장 중요한 데이터 - Overview, Chart, Technical 탭용)
      const stockResponse = await api.get<ApiResponse<StockData>>(
        `/api/stock/${tickerSymbol}?include_technical=true&include_chart=true`
      );

      if (stockResponse.data.success && stockResponse.data.data) {
        const stock = stockResponse.data.data;
        setStockData(stock);
        setLoadingStates(prev => ({ ...prev, stock: false }));

        // 2. 뉴스 로드 (독립적 - News 탭용)
        api.get<ApiResponse<NewsItem[]>>(`/api/stock/${tickerSymbol}/news`)
          .then(newsResponse => {
            if (newsResponse.data.success) {
              setNewsData(newsResponse.data.data);
            }
          })
          .catch(err => console.error('뉴스 조회 실패:', err))
          .finally(() => {
            setLoadingStates(prev => ({ ...prev, news: false }));
          });

        // 3. AI 분석 로드 (독립적 - AI 탭용)
        api.post<ApiResponse<AIAnalysis>>(`/api/stock/${tickerSymbol}/analysis`, stock)
          .then(analysisResponse => {
            if (analysisResponse.data.success) {
              setAiAnalysis(analysisResponse.data.data);
            }
          })
          .catch(err => console.error('AI 분석 실패:', err))
          .finally(() => {
            setLoadingStates(prev => ({ ...prev, ai: false }));
          });
      } else {
        setError(stockResponse.data.error || '알 수 없는 오류가 발생했습니다.');
        setLoadingStates({ stock: false, news: false, ai: false });
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || err.message);
      } else {
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      }
      setLoadingStates({ stock: false, news: false, ai: false });
    }
  };

  /**
   * 매물 등록
   */
  const handleAddTicker = (symbol: string) => {
    // 중복 체크
    if (userSettings.tickers.some(t => t.symbol === symbol)) {
      alert(`${symbol}은 이미 등록된 카테고리입니다.`);
      return;
    }

    // 매물 등록
    setUserSettings(prev => ({
      ...prev,
      tickers: [
        ...prev.tickers,
        {
          symbol,
          purchasePrice: null,
          addedAt: new Date().toISOString(),
        },
      ],
    }));
  };

  /**
   * 매물 제거
   */
  const handleRemoveTicker = (symbol: string) => {
    setUserSettings(prev => ({
      ...prev,
      tickers: prev.tickers.filter(t => t.symbol !== symbol),
      // 제거한 매물이 선택된 매물이라면 선택 해제
      selectedTicker: prev.selectedTicker === symbol ? null : prev.selectedTicker,
    }));
  };

  /**
   * 매물 선택 (조회)
   */
  const handleSelectTicker = (symbol: string) => {
    // 선택된 매물 업데이트
    setUserSettings(prev => ({
      ...prev,
      selectedTicker: symbol,
    }));

    // 시장 데이터 조회
    fetchStockData(symbol);
  };

  /**
   * 구매가 업데이트
   */
  const handleUpdatePurchasePrice = (symbol: string, price: number | null) => {
    setUserSettings(prev => ({
      ...prev,
      tickers: prev.tickers.map(t =>
        t.symbol === symbol
          ? { ...t, purchasePrice: price }
          : t
      ),
    }));
  };

  /**
   * 섹션 토글
   */
  const handleToggleSection = (sectionKey: keyof SectionVisibility) => {
    setUserSettings(prev => ({
      ...prev,
      sectionVisibility: {
        ...prev.sectionVisibility,
        [sectionKey]: !prev.sectionVisibility[sectionKey],
      },
    }));
  };

  // Sidebar용 티커 선택 핸들러 (Sidebar 컴포넌트와 연동)
  const handleSidebarTickerSelect = (symbol: string) => {
    handleSelectTicker(symbol);
  };

  // 로딩 중이거나 데이터가 없을 때 기본값
  const getEmptyMessage = () => {
    if (userSettings.tickers.length === 0) {
      return 'Click "Add Ticker" to get started';
    }
    if (!userSettings.selectedTicker) {
      return 'Select a ticker from sidebar';
    }
    return 'Click a ticker to load data';
  };

  // HeroSection용 데이터 변환
  const displayData = stockData
    ? {
        ticker: stockData.ticker,
        companyName: stockData.company.name,
        currentPrice: stockData.price.current,
        priceChange: stockData.price.current - stockData.price.open,
        priceChangePercent: ((stockData.price.current - stockData.price.open) / stockData.price.open) * 100,
        marketCap: stockData.market_cap
          ? `$${(stockData.market_cap / 1e9).toFixed(2)}B`
          : 'N/A',
        sector: stockData.company.sector || 'N/A',
        hasData: true,
      }
    : {
        ticker: undefined,
        companyName: undefined,
        currentPrice: 0,
        priceChange: 0,
        priceChangePercent: 0,
        marketCap: 'N/A',
        sector: 'N/A',
        hasData: false,
      };

  // Sidebar용 티커 리스트 변환 (빈 배열 허용)
  const sidebarTickers = userSettings.tickers.map(t => ({
    symbol: t.symbol,
    profitPercent: t.purchasePrice && stockData?.currentPrice
      ? ((stockData.currentPrice - t.purchasePrice) / t.purchasePrice) * 100
      : 0,
  }));

  return (
    <AppLayout
      sidebar={
        <Sidebar
          onTickerSelect={handleSidebarTickerSelect}
          onAddTicker={handleAddTicker}
          onRemoveTicker={handleRemoveTicker}
          initialTickers={sidebarTickers}
          selectedTicker={userSettings.selectedTicker || sidebarTickers[0]?.symbol}
        />
      }
    >
      {/* HeroSection - 현재가 표시 */}
      <HeroSection
        ticker={displayData.ticker}
        companyName={displayData.companyName}
        currentPrice={displayData.currentPrice}
        priceChange={displayData.priceChange}
        priceChangePercent={displayData.priceChangePercent}
        marketCap={displayData.marketCap}
        sector={displayData.sector}
        hasData={displayData.hasData}
      />

      {/* MainTabs - 5개 탭 시스템 */}
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
                <div className="p-6 space-y-4">
                  <div className="bg-card border border-border rounded-lg p-6">
                    <h2 className="text-xl font-semibold text-foreground mb-4">
                      AI 분석 (Gemini)
                    </h2>
                    {aiAnalysis ? (
                      <div className="prose prose-sm max-w-none text-muted-foreground">
                        <div className="whitespace-pre-wrap">{aiAnalysis.report}</div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-sm text-muted-foreground mb-1">
                          {userSettings.tickers.length === 0
                            ? 'No tickers added yet.'
                            : stockData
                            ? 'AI analysis data not available.'
                            : 'No data loaded.'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {userSettings.tickers.length === 0
                            ? 'Add a ticker from the sidebar to get started.'
                            : !stockData
                            ? 'Click a ticker from the sidebar to load data.'
                            : 'AI analysis will appear here when available.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
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
                        {/* RSI */}
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

                        {/* MACD */}
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

                        {/* SMA 20 */}
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

                        {/* Bollinger Bands */}
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
    </AppLayout>
  );
}

export default App;
