/**
 * StealthHomePage 데이터 훅
 * 경제지표(메모), 섹터(사업현황), 마감리뷰(업무일지) 3탭 데이터 관리
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '@/lib/api';
import type {
  EconomicData,
  EconomicResponse,
  KoreaEconomicData,
  KoreaEconomicResponse,
  MarketCycleData,
  MarketCycleResponse,
  KrMarketCycleData,
  KrMarketCycleResponse,
  Country,
} from '@/types/economic';
import type { MarketReviewData, MarketReviewResponse } from '@/types/marketReview';
import type { SectorData, SectorResponse } from '@/components/stealth/StealthMemoComponents';

export type StealthTab = 'memo' | 'status' | 'journal';

export function useStealthHome() {
  const [activeTab, setActiveTab] = useState<StealthTab>('memo');

  // 회의록 탭 (경제지표)
  const [usData, setUsData] = useState<EconomicData | null>(null);
  const [krData, setKrData] = useState<KoreaEconomicData | null>(null);
  const [usCycle, setUsCycle] = useState<MarketCycleData | null>(null);
  const [krCycle, setKrCycle] = useState<KrMarketCycleData | null>(null);
  const [memoLoading, setMemoLoading] = useState(false);
  const [memoError, setMemoError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // 사업현황 탭 (섹터)
  const [sectorCountry, setSectorCountry] = useState<Country>('us');
  const [sectors, setSectors] = useState<SectorData[]>([]);
  const [sectorLastUpdated, setSectorLastUpdated] = useState<string | null>(null);
  const [sectorLoading, setSectorLoading] = useState(false);
  const [sectorError, setSectorError] = useState<string | null>(null);

  // 업무일지 탭 (마감리뷰)
  const [reviewCountry, setReviewCountry] = useState<Country>('us');
  const [reviewData, setReviewData] = useState<MarketReviewData | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const reviewLoadedRef = useRef<string | null>(null);

  const fetchMemoData = useCallback(async () => {
    setMemoLoading(true);
    setMemoError(null);
    try {
      const [usRes, krRes, usCycleRes, krCycleRes] = await Promise.allSettled([
        api.get<EconomicResponse>('/api/economic?country=us'),
        api.get<KoreaEconomicResponse>('/api/economic?country=kr'),
        api.get<MarketCycleResponse>('/api/economic/market-cycle?country=us'),
        api.get<KrMarketCycleResponse>('/api/economic/market-cycle?country=kr'),
      ]);
      if (usRes.status === 'fulfilled' && usRes.value.data.success && usRes.value.data.data) {
        setUsData(usRes.value.data.data);
      }
      if (krRes.status === 'fulfilled' && krRes.value.data.success && krRes.value.data.data) {
        setKrData(krRes.value.data.data);
      }
      if (
        usCycleRes.status === 'fulfilled' &&
        usCycleRes.value.data.success &&
        usCycleRes.value.data.data
      ) {
        setUsCycle(usCycleRes.value.data.data);
      }
      if (
        krCycleRes.status === 'fulfilled' &&
        krCycleRes.value.data.success &&
        krCycleRes.value.data.data
      ) {
        setKrCycle(krCycleRes.value.data.data);
      }
    } catch {
      setMemoError('데이터를 불러올 수 없습니다.');
    } finally {
      setMemoLoading(false);
    }
  }, []);

  const fetchSectorData = useCallback(async (country: Country) => {
    if (country === null) return;
    setSectorLoading(true);
    setSectorError(null);
    try {
      const response = await api.get<SectorResponse>(`/api/economic/sectors?country=${country}`);
      if (response.data.success && response.data.data) {
        setSectors(response.data.data);
        setSectorLastUpdated(response.data.last_updated);
      } else {
        setSectorError(response.data.error || '데이터를 불러올 수 없습니다.');
      }
    } catch {
      setSectorError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setSectorLoading(false);
    }
  }, []);

  const fetchReviewData = useCallback(async (country: Country, force = false) => {
    if (country === null || country === 'all') return;
    const cacheKey = country;
    if (!force && reviewLoadedRef.current === cacheKey) return;
    setReviewLoading(true);
    setReviewError(null);
    try {
      const response = await api.get<MarketReviewResponse>(
        `/api/economic/market-review/${country}`,
      );
      if (response.data.success && response.data.data) {
        setReviewData(response.data.data);
      } else {
        setReviewError(response.data.error || '데이터를 불러올 수 없습니다.');
      }
    } catch {
      setReviewError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setReviewLoading(false);
      reviewLoadedRef.current = cacheKey;
    }
  }, []);

  useEffect(() => {
    fetchMemoData();
  }, [fetchMemoData]);

  useEffect(() => {
    if (activeTab === 'status' && sectorCountry !== null) {
      fetchSectorData(sectorCountry);
    }
  }, [activeTab, sectorCountry, fetchSectorData]);

  useEffect(() => {
    if (activeTab === 'journal' && reviewCountry !== null && reviewCountry !== 'all') {
      reviewLoadedRef.current = null;
      fetchReviewData(reviewCountry);
    }
  }, [activeTab, reviewCountry, fetchReviewData]);

  const handleRefresh = () => {
    if (activeTab === 'memo') fetchMemoData();
    else if (activeTab === 'status') fetchSectorData(sectorCountry);
    else if (activeTab === 'journal') fetchReviewData(reviewCountry, true);
  };

  const isLoading =
    activeTab === 'memo' ? memoLoading : activeTab === 'status' ? sectorLoading : reviewLoading;

  const matchesSearch = (text: string): boolean => {
    if (!searchQuery) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  return {
    activeTab,
    setActiveTab,
    usData,
    krData,
    usCycle,
    krCycle,
    memoLoading,
    memoError,
    searchQuery,
    setSearchQuery,
    matchesSearch,
    sectorCountry,
    setSectorCountry,
    sectors,
    sectorLastUpdated,
    sectorLoading,
    sectorError,
    reviewCountry,
    setReviewCountry,
    reviewData,
    reviewLoading,
    reviewError,
    handleRefresh,
    isLoading,
  };
}
