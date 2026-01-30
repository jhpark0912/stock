import { useState } from 'react';
import axios from 'axios';
import StockDashboard from './components/StockDashboard';
import { api } from './lib/api';
import type { ApiResponse } from './lib/api';
import type { StockData, NewsItem, AIAnalysis } from './types/stock';

function App() {
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [newsData, setNewsData] = useState<NewsItem[] | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  return (
    <StockDashboard
      data={stockData}
      newsData={newsData}
      aiAnalysis={aiAnalysis}
      onSearch={fetchStockData}
      isLoading={isLoading}
    />
  );
}

export default App;
