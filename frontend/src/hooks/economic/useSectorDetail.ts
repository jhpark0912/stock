/**
 * useSectorDetail - 섹터 보유 종목 데이터 훅
 * 상태 관리, API 호출, treemapData 파생 데이터 제공
 */

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { getChangeColor } from '@/components/economic/sectorConstants';
import type { SectorHolding, SectorHoldingsResponse } from '@/types/economic';

export function useSectorDetail(symbol: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [holdings, setHoldings] = useState<SectorHolding[]>([]);
  const [requiresKisKey, setRequiresKisKey] = useState(false);

  useEffect(() => {
    const fetchHoldings = async () => {
      try {
        setLoading(true);
        setError(null);
        setRequiresKisKey(false);

        const response = await api.get<SectorHoldingsResponse>(
          `/api/economic/sectors/${symbol}/holdings`,
        );

        if (response.data.success && response.data.holdings) {
          setHoldings(response.data.holdings);
          if (response.data.requires_kis_key) {
            setRequiresKisKey(true);
          }
        } else {
          setError(response.data.error || '보유 종목을 불러올 수 없습니다.');
        }
      } catch {
        setError('보유 종목을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchHoldings();
  }, [symbol]);

  const isKorea = symbol.endsWith('.KS');

  const treemapData = holdings.map((holding) => ({
    symbol: holding.symbol,
    name: holding.name,
    weight: holding.weight,
    size: Math.max(holding.weight, 0.5),
    price: holding.price,
    change: holding.change_1d,
    color: getChangeColor(holding.change_1d),
    isKorea,
  }));

  return {
    loading,
    error,
    holdings,
    requiresKisKey,
    isKorea,
    treemapData,
  };
}
