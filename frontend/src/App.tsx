import { useState, useEffect } from 'react';
import axios from 'axios';
import StockDashboard from './components/StockDashboard';
import { api } from './lib/api';
import type { ApiResponse } from './lib/api';
import type { StockData, NewsItem, AIAnalysis } from './types/stock';
import type { UserSettings, SectionVisibility } from './types/user';
import { loadSettings, saveSettings } from './utils/storage';

function App() {
  // 주식 데이터 상태
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [newsData, setNewsData] = useState<NewsItem[] | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 사용자 설정 상태 (localStorage에서 로드)
  const [userSettings, setUserSettings] = useState<UserSettings>(() => loadSettings());

  // userSettings 변경 시 localStorage에 자동 저장
  useEffect(() => {
    saveSettings(userSettings);
  }, [userSettings]);

  const fetchStockData = async (tickerSymbol: string) => {
    setIsLoading(true);
    setError(null);
    setStockData(null);
    setNewsData(null);
    setAiAnalysis(null);

    try {
      // 1. 주식 데이터 조회 (차트 데이터 포함)
      const stockResponse = await api.get<ApiResponse<StockData>>(
        `/api/stock/${tickerSymbol}?include_technical=true&include_chart=true`
      );

      if (stockResponse.data.success && stockResponse.data.data) {
        const stock = stockResponse.data.data;
        setStockData(stock);

        // 2. 뉴스 + AI 분석 병렬 조회 (Promise.allSettled로 일부 실패해도 계속 진행)
        const [newsResponse, analysisResponse] = await Promise.allSettled([
          api.get<ApiResponse<NewsItem[]>>(`/api/stock/${tickerSymbol}/news`),
          api.post<ApiResponse<AIAnalysis>>(`/api/stock/${tickerSymbol}/analysis`, stock)
        ]);

        // 뉴스 처리
        if (newsResponse.status === 'fulfilled' && newsResponse.value.data.success) {
          setNewsData(newsResponse.value.data.data);
        } else if (newsResponse.status === 'rejected') {
          console.error('뉴스 조회 실패:', newsResponse.reason);
        }

        // AI 분석 처리
        if (analysisResponse.status === 'fulfilled' && analysisResponse.value.data.success) {
          setAiAnalysis(analysisResponse.value.data.data);
        } else if (analysisResponse.status === 'rejected') {
          console.error('AI 분석 실패:', analysisResponse.reason);
        }
      } else {
        setError(stockResponse.data.error || '알 수 없는 오류가 발생했습니다.');
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || err.message);
      } else {
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 티커 추가
   */
  const handleAddTicker = (symbol: string) => {
    // 중복 체크
    if (userSettings.tickers.some(t => t.symbol === symbol)) {
      alert(`${symbol}은 이미 추가된 종목입니다.`);
      return;
    }

    // 티커 추가
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
   * 티커 삭제
   */
  const handleRemoveTicker = (symbol: string) => {
    setUserSettings(prev => ({
      ...prev,
      tickers: prev.tickers.filter(t => t.symbol !== symbol),
      // 삭제한 티커가 선택된 티커라면 선택 해제
      selectedTicker: prev.selectedTicker === symbol ? null : prev.selectedTicker,
    }));
  };

  /**
   * 티커 선택 (조회)
   */
  const handleSelectTicker = (symbol: string) => {
    // 선택된 티커 업데이트
    setUserSettings(prev => ({
      ...prev,
      selectedTicker: symbol,
    }));

    // 주식 데이터 조회
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

  return (
    <StockDashboard
      data={stockData}
      newsData={newsData}
      aiAnalysis={aiAnalysis}
      userSettings={userSettings}
      onSearch={fetchStockData}
      onAddTicker={handleAddTicker}
      onRemoveTicker={handleRemoveTicker}
      onSelectTicker={handleSelectTicker}
      onUpdatePurchasePrice={handleUpdatePurchasePrice}
      onToggleSection={handleToggleSection}
      isLoading={isLoading}
    />
  );
}

export default App;
