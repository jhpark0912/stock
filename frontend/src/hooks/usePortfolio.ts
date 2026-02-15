/**
 * usePortfolio - 포트폴리오 데이터 관리 커스텀 훅
 * PortfolioPage의 데이터 로직을 분리하여 재사용 가능하게 함
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import { api } from '@/lib/api';
import type { ApiResponse } from '@/lib/api';
import type { StockData, NewsItem, AIAnalysis } from '@/types/stock';
import type { UserSettings } from '@/types/user';
import { getPortfolios, createPortfolio, deletePortfolio, updatePortfolio, updateProfitInfo } from '@/lib/portfolioApi';
import { useAuth } from '@/contexts/AuthContext';

interface LoadingStates {
  stock: boolean;
  news: boolean;
  ai: boolean;
}

interface AIError {
  type: 'no_key' | 'api_error';
  message: string;
}

export function usePortfolio() {
  // 인증 상태
  const { user } = useAuth();

  // 시장 데이터 상태
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [newsData, setNewsData] = useState<NewsItem[] | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [aiError, setAiError] = useState<AIError | null>(null);
  const [, setError] = useState<string | null>(null);

  // 탭별 독립적인 로딩 상태
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    stock: false,
    news: false,
    ai: false,
  });

  // 사용자 설정 상태 (DB에서 로드)
  const [userSettings, setUserSettings] = useState<UserSettings>({
    tickers: [],
    selectedTicker: null,
    sectionVisibility: {
      companyInfo: true,
      financialMetrics: true,
      aiAnalysis: true,
      technicalIndicators: true,
      news: true,
      charts: true,
    },
  });

  // 초기 로딩 시 DB에서 포트폴리오 데이터 가져오기
  useEffect(() => {
    const loadPortfoliosFromDB = async () => {
      try {
        const portfolios = await getPortfolios();
        setUserSettings(prev => ({
          ...prev,
          tickers: portfolios.map(p => ({
            symbol: p.ticker,
            displayName: p.display_name || undefined,
            purchasePrice: p.purchase_price,
            quantity: p.quantity,
            purchaseDate: p.purchase_date || undefined,
            addedAt: p.created_at,
            lastPrice: p.last_price || undefined,
            profitPercent: p.profit_percent || undefined,
            lastUpdated: p.last_updated || undefined,
          })),
        }));
      } catch (error) {
        console.error('Failed to load portfolios from DB:', error);
      }
    };

    loadPortfoliosFromDB();
  }, []);

  const fetchStockData = async (tickerSymbol: string) => {
    setLoadingStates({ stock: true, news: true, ai: false });
    setError(null);
    setStockData(null);
    setNewsData(null);
    setAiAnalysis(null);
    setAiError(null);

    try {
      const stockResponse = await api.get<ApiResponse<StockData>>(
        `/api/stock/${tickerSymbol}?include_technical=true&include_chart=true`
      );

      if (stockResponse.data.success && stockResponse.data.data) {
        const stock = stockResponse.data.data;
        setStockData(stock);
        setLoadingStates(prev => ({ ...prev, stock: false }));

        const ticker = userSettings.tickers.find(t => t.symbol === tickerSymbol);
        if (ticker) {
          updateProfitInfo(tickerSymbol, stock.price.current, ticker.purchasePrice)
            .then(updatedPortfolio => {
              setUserSettings(prev => ({
                ...prev,
                tickers: prev.tickers.map(t =>
                  t.symbol === tickerSymbol
                    ? {
                        ...t,
                        lastPrice: updatedPortfolio.last_price,
                        profitPercent: updatedPortfolio.profit_percent,
                        lastUpdated: updatedPortfolio.last_updated,
                      }
                    : t
                ),
              }));
            })
            .catch(err => console.error('수익률 업데이트 실패:', err));
        }

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

  const handleAddTicker = async (symbol: string) => {
    if (userSettings.tickers.some(t => t.symbol === symbol)) {
      alert(`${symbol}은 이미 등록된 카테고리입니다.`);
      return;
    }

    try {
      await createPortfolio({ ticker: symbol });

      setUserSettings(prev => ({
        ...prev,
        tickers: [
          ...prev.tickers,
          {
            symbol,
            purchasePrice: null,
            quantity: null,
            purchaseDate: undefined,
            addedAt: new Date().toISOString(),
            lastPrice: undefined,
            profitPercent: undefined,
            lastUpdated: undefined,
          },
        ],
      }));
    } catch (error) {
      console.error('Failed to add ticker:', error);
      alert('매물 등록에 실패했습니다.');
    }
  };

  const handleRemoveTicker = async (symbol: string) => {
    try {
      await deletePortfolio(symbol);

      setUserSettings(prev => ({
        ...prev,
        tickers: prev.tickers.filter(t => t.symbol !== symbol),
        selectedTicker: prev.selectedTicker === symbol ? null : prev.selectedTicker,
      }));
    } catch (error) {
      console.error('Failed to remove ticker:', error);
      alert('매물 제거에 실패했습니다.');
    }
  };

  const handleSelectTicker = (symbol: string) => {
    setUserSettings(prev => ({
      ...prev,
      selectedTicker: symbol,
    }));

    fetchStockData(symbol);
  };

  const handleUpdatePurchasePrice = async (symbol: string, price: number | null, quantity: number | null) => {
    try {
      await updatePortfolio(symbol, {
        purchase_price: price,
        quantity: quantity,
      });

      setUserSettings(prev => ({
        ...prev,
        tickers: prev.tickers.map(t =>
          t.symbol === symbol
            ? { ...t, purchasePrice: price, quantity: quantity }
            : t
        ),
      }));
    } catch (error) {
      console.error('Failed to update purchase price and quantity:', error);
      alert('평단가 및 수량 업데이트에 실패했습니다.');
    }
  };

  const handleUpdateDisplayName = async (symbol: string, displayName: string | null) => {
    try {
      await updatePortfolio(symbol, {
        display_name: displayName,
      });

      setUserSettings(prev => ({
        ...prev,
        tickers: prev.tickers.map(t =>
          t.symbol === symbol
            ? { ...t, displayName: displayName || undefined }
            : t
        ),
      }));
    } catch (error) {
      console.error('Failed to update display name:', error);
      alert('한글 이름 업데이트에 실패했습니다.');
    }
  };

  // AI 분석 수동 실행
  const handleAnalyzeAI = async () => {
    if (!stockData) return;

    // Gemini 키 없는 경우 체크
    if (!user?.has_gemini_key && user?.role !== 'admin') {
      setAiError({ type: 'no_key', message: 'Gemini API 키가 설정되지 않았습니다.' });
      return;
    }

    setLoadingStates(prev => ({ ...prev, ai: true }));
    setAiError(null);
    setAiAnalysis(null);

    try {
      const analysisResponse = await api.post<ApiResponse<AIAnalysis>>(
        `/api/stock/${stockData.ticker}/analysis`,
        stockData
      );

      if (analysisResponse.data.success) {
        setAiAnalysis(analysisResponse.data.data);
      } else {
        const errorMsg = analysisResponse.data.error || 'AI 분석 결과를 가져올 수 없습니다.';
        if (errorMsg.toLowerCase().includes('api key') || errorMsg.toLowerCase().includes('gemini')) {
          setAiError({ type: 'no_key', message: errorMsg });
        } else {
          setAiError({ type: 'api_error', message: errorMsg });
        }
      }
    } catch (err) {
      console.error('AI 분석 실패:', err);
      let errorMessage = 'AI 분석 중 오류가 발생했습니다.';

      if (axios.isAxiosError(err)) {
        const responseError = err.response?.data?.error || err.message;
        errorMessage = responseError;

        if (responseError.toLowerCase().includes('api key') ||
            responseError.toLowerCase().includes('gemini') ||
            err.response?.status === 401) {
          setAiError({ type: 'no_key', message: responseError });
        } else {
          setAiError({ type: 'api_error', message: errorMessage });
        }
      } else {
        setAiError({ type: 'api_error', message: errorMessage });
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, ai: false }));
    }
  };

  // 파생 데이터: displayData
  const currentTicker = stockData ? userSettings.tickers.find(t => t.symbol === stockData.ticker) : null;
  const displayData = stockData
    ? {
        ticker: stockData.ticker,
        companyName: stockData.company.name,
        displayName: currentTicker?.displayName || null,
        currentPrice: stockData.price.current,
        priceChange: stockData.price.current - stockData.price.open,
        priceChangePercent: ((stockData.price.current - stockData.price.open) / stockData.price.open) * 100,
        marketCap: stockData.market_cap
          ? `$${(stockData.market_cap / 1e9).toFixed(2)}B`
          : 'N/A',
        sector: stockData.company.sector || 'N/A',
        purchasePrice: currentTicker?.purchasePrice || null,
        quantity: currentTicker?.quantity || null,
        hasData: true,
      }
    : {
        ticker: undefined,
        companyName: undefined,
        displayName: null,
        currentPrice: 0,
        priceChange: 0,
        priceChangePercent: 0,
        marketCap: 'N/A',
        sector: 'N/A',
        purchasePrice: null,
        quantity: null,
        hasData: false,
      };

  // 파생 데이터: sidebarTickers
  const sidebarTickers = userSettings.tickers.map(t => {
    const hasPurchasePrice = t.purchasePrice !== null && t.purchasePrice !== undefined;
    const hasStoredProfit = t.profitPercent !== null && t.profitPercent !== undefined;

    let profitPercent: number | null | undefined;

    if (!hasPurchasePrice) {
      profitPercent = null;
    } else if (hasStoredProfit) {
      profitPercent = t.profitPercent!;
    } else {
      profitPercent = undefined;
    }

    return {
      symbol: t.symbol,
      displayName: t.displayName,
      purchasePrice: t.purchasePrice,
      quantity: t.quantity,
      purchaseDate: t.purchaseDate,
      addedAt: t.addedAt,
      lastPrice: t.lastPrice,
      profitPercent,
      lastUpdated: t.lastUpdated,
    };
  });

  return {
    // 상태
    user,
    stockData,
    newsData,
    aiAnalysis,
    aiError,
    loadingStates,
    userSettings,

    // 액션
    fetchStockData,
    handleAddTicker,
    handleRemoveTicker,
    handleSelectTicker,
    handleUpdatePurchasePrice,
    handleUpdateDisplayName,
    handleAnalyzeAI,

    // 파생 데이터
    displayData,
    sidebarTickers,
  };
}
