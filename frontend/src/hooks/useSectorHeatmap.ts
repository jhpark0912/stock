/**
 * useSectorHeatmap - 섹터 히트맵 데이터 훅
 * 상태 관리, API 호출, 파생 데이터(treemapData) 제공
 */

import { useState, useCallback, useEffect } from 'react';
import { api } from '@/lib/api';
import { getChangeColor } from '@/components/economic/sectorConstants';
import type { Country, SectorData, SectorResponse } from '@/types/economic';

export type Period = '1D' | '1W' | '1M';

export function useSectorHeatmap(country: Country) {
  const [period, setPeriod] = useState<Period>('1D');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sectors, setSectors] = useState<SectorData[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [selectedSector, setSelectedSector] = useState<SectorData | null>(null);

  const fetchData = useCallback(async () => {
    if (country === null) return;
    try {
      setError(null);
      const response = await api.get<SectorResponse>(`/api/economic/sectors?country=${country}`);
      if (response.data.success && response.data.data) {
        setSectors(response.data.data);
        setLastUpdated(response.data.last_updated);
      } else {
        setError(response.data.error || '섹터 데이터를 불러올 수 없습니다.');
      }
    } catch {
      setError('섹터 데이터를 불러오는 중 오류가 발생했습니다.');
    }
  }, [country]);

  useEffect(() => {
    if (country === null) return;
    const loadData = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };
    loadData();
  }, [fetchData, country]);

  const getChange = (sector: SectorData): number => {
    switch (period) {
      case '1D':
        return sector.change_1d;
      case '1W':
        return sector.change_1w;
      case '1M':
        return sector.change_1m;
    }
  };

  const treemapData = sectors.map((sector) => {
    const change = getChange(sector);
    const isKorea = sector.symbol.endsWith('.KS');
    return {
      name: sector.symbol,
      symbol: sector.symbol,
      korName: sector.name,
      size: Math.max(sector.market_cap, 1000000000),
      change,
      price: sector.price,
      color: getChangeColor(change),
      data: sector,
      isKorea,
    };
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleSectorClick = (sector: SectorData) => {
    setSelectedSector(sector);
  };

  const handleCloseSectorDetail = () => {
    setSelectedSector(null);
  };

  const handleStockClick = (symbol: string) => {
    window.open(`/stock/${symbol}`, '_blank');
  };

  return {
    period,
    setPeriod,
    loading,
    refreshing,
    error,
    sectors,
    lastUpdated,
    selectedSector,
    treemapData,
    handleRefresh,
    handleSectorClick,
    handleCloseSectorDetail,
    handleStockClick,
  };
}
