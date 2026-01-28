import { useState } from 'react';
import axios from 'axios';
import StockSearch from './components/StockSearch';
import StockInfo from './components/StockInfo';
import TechnicalChart from './components/TechnicalChart';
import StockNews from './components/StockNews';
import StockAnalysis from './components/StockAnalysis'; // AI 분석 컴포넌트
import { api, fetchStockAnalysis } from './lib/api';
import type { ApiResponse } from './lib/api';
import type { StockData, NewsItem, AIAnalysis } from './types/stock';

function App() {
  const [ticker, setTicker] = useState<string>('');
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [news, setNews] = useState<NewsItem[] | null>(null);
  const [analysisData, setAnalysisData] = useState<AIAnalysis | null>(null); // AI 분석 결과
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isNewsLoading, setIsNewsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false); // AI 분석 로딩
  const [analysisError, setAnalysisError] = useState<string | null>(null); // AI 분석 에러

  const handleAnalyze = async () => {
    if (!ticker) return;
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisData(null);

    try {
      const response = await fetchStockAnalysis(ticker);
      if (response.success && response.data) {
        setAnalysisData(response.data);
      } else {
        setAnalysisError(response.error || 'AI 분석 데이터를 가져오는 중 알 수 없는 오류가 발생했습니다.');
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setAnalysisError(err.response?.data?.error || err.message);
      } else {
        setAnalysisError('AI 분석 중 오류가 발생했습니다.');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const fetchNewsData = async (tickerSymbol: string) => {
    setIsNewsLoading(true);
    try {
      const response = await api.get<ApiResponse<NewsItem[]>>(`/api/stock/${tickerSymbol}/news`);
      if (response.data.success && response.data.data) {
        setNews(response.data.data);
      } else {
        console.error(response.data.error || '뉴스를 가져오는 중 알 수 없는 오류 발생');
        setNews([]);
      }
    } catch (err) {
      console.error('뉴스 데이터를 가져오는 중 오류가 발생했습니다.', err);
      setNews([]);
    } finally {
      setIsNewsLoading(false);
    }
  };

  const fetchStockData = async (tickerSymbol: string) => {
    setIsLoading(true);
    setError(null);
    setStockData(null);
    setNews(null);
    setAnalysisData(null); // 새 검색 시 분석 데이터 초기화
    setAnalysisError(null);

    try {
      const response = await api.get<ApiResponse<StockData>>(`/api/stock/${tickerSymbol}?include_technical=true`);

      if (response.data.success && response.data.data) {
        setStockData(response.data.data);
        setTicker(tickerSymbol);
        await fetchNewsData(tickerSymbol);
      } else {
        setError(response.data.error || '알 수 없는 오류가 발생했습니다.');
      }
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || err.message);
      } else {
        setError('데이터를 가져오는 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            📈 주식 정보 조회 (AI 분석)
          </h1>
          <p className="text-gray-600">
            실시간 주식 데이터, 뉴스, 그리고 Gemini AI 기반 분석을 확인하세요
          </p>
        </div>

        <div className="flex justify-center mb-8">
          <StockSearch onSearch={fetchStockData} isLoading={isLoading} />
        </div>

        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="ml-4 text-gray-600">주식 정보를 가져오는 중...</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
              <p className="font-bold">오류 발생</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {stockData && !isLoading && (
          <div className="flex flex-col items-center space-y-8">
            <StockInfo data={stockData} />
            <TechnicalChart data={stockData.technical_indicators} />
            
            {/* AI 분석 실행 섹션 */}
            <div className="w-full max-w-4xl p-6 bg-white rounded-lg shadow-md text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">AI 종합 분석</h2>
              <p className="text-gray-600 mb-6">
                Gemini AI를 사용하여 이 주식에 대한 심층 분석 보고서를 생성합니다.
              </p>
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="px-6 py-3 font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
              >
                {isAnalyzing ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    <span>분석 중...</span>
                  </div>
                ) : (
                  'Gemini AI 종합 분석 실행'
                )}
              </button>
            </div>

            <StockAnalysis analysis={analysisData} error={analysisError} />
            
            {isNewsLoading && (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
                <p className="ml-3 text-gray-500">관련 뉴스를 가져오는 중...</p>
              </div>
            )}

            {news && !isNewsLoading && (
              <StockNews news={news} />
            )}

          </div>
        )}

        {!stockData && !error && !isLoading && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">티커를 입력하고 검색해보세요</p>
            <p className="text-sm">예시: AAPL, TSLA, GOOGL, MSFT</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
