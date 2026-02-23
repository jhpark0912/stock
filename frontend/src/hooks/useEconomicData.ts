/**
 * 경제 지표 데이터 fetch/상태 관리 훅
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type {
  EconomicData,
  EconomicViewMode,
  EconomicResponse,
  KoreaEconomicData,
  KoreaEconomicResponse,
  Country,
} from '@/types/economic';

export type EconomicTab = 'indicators' | 'sectors' | 'review';

export function useEconomicData() {
  const [country, setCountry] = useState<Country>(null);
  const [sectorCountry, setSectorCountry] = useState<Country>(null);
  const [reviewCountry, setReviewCountry] = useState<Country>(null);
  const [data, setData] = useState<EconomicData | null>(null);
  const [krData, setKrData] = useState<KoreaEconomicData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<EconomicViewMode>('simple');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<EconomicTab>('indicators');
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [krHistoryLoaded, setKrHistoryLoaded] = useState(false);
  const [indicatorsLoaded, setIndicatorsLoaded] = useState(false);
  const [krIndicatorsLoaded, setKrIndicatorsLoaded] = useState(false);

  const fetchData = useCallback(async (targetCountry: Country, includeHistory: boolean = false) => {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (targetCountry) params.set('country', targetCountry);
      if (includeHistory) params.set('include_history', 'true');

      if (targetCountry === 'us') {
        const response = await api.get<EconomicResponse>(`/api/economic?${params}`);
        if (response.data.success && response.data.data) {
          setData(response.data.data);
          setIndicatorsLoaded(true);
          if (includeHistory) setHistoryLoaded(true);
        } else {
          setError(response.data.error || '경제 지표를 불러올 수 없습니다.');
        }
      } else if (targetCountry === 'kr') {
        const response = await api.get<KoreaEconomicResponse>(`/api/economic?${params}`);
        if (response.data.success && response.data.data) {
          setKrData(response.data.data);
          setKrIndicatorsLoaded(true);
          if (includeHistory) setKrHistoryLoaded(true);
        } else {
          setError(response.data.error || '한국 경제 지표를 불러올 수 없습니다.');
        }
      }
    } catch {
      setError('경제 지표를 불러오는 중 오류가 발생했습니다.');
    }
  }, []);

  // 경제 지표 탭 선택 시 데이터 로드 (국가별)
  useEffect(() => {
    if (activeTab === 'indicators' && !loading && country !== null) {
      const needsLoad =
        (country === 'us' && !indicatorsLoaded) || (country === 'kr' && !krIndicatorsLoaded);
      if (needsLoad) {
        const loadData = async () => {
          setLoading(true);
          await fetchData(country, false);
          setLoading(false);
        };
        loadData();
      }
    }
  }, [activeTab, country, indicatorsLoaded, krIndicatorsLoaded, loading, fetchData]);

  // 뷰 모드 변경 시 히스토리 데이터 로드
  useEffect(() => {
    if (activeTab === 'indicators' && viewMode === 'chart' && country !== null) {
      const needsHistoryLoad =
        (country === 'us' && !historyLoaded) || (country === 'kr' && !krHistoryLoaded);
      if (needsHistoryLoad) {
        const loadHistoryData = async () => {
          setRefreshing(true);
          await fetchData(country, true);
          setRefreshing(false);
        };
        loadHistoryData();
      }
    }
  }, [activeTab, viewMode, country, historyLoaded, krHistoryLoaded, fetchData]);

  const handleRefresh = async () => {
    if (country === null) return;
    setRefreshing(true);
    await fetchData(country, viewMode === 'chart');
    setRefreshing(false);
  };

  return {
    country,
    setCountry,
    sectorCountry,
    setSectorCountry,
    reviewCountry,
    setReviewCountry,
    data,
    krData,
    loading,
    error,
    viewMode,
    setViewMode,
    refreshing,
    activeTab,
    setActiveTab,
    handleRefresh,
  };
}
