/**
 * 시장 사이클 데이터 조회 및 AI 분석 훅
 * - fetch/retry 중복 제거 (useCallback 통합)
 * - AI 분석 상태 관리 포함
 */

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import type {
  MarketCycleResponse,
  MarketCycleData,
  KrMarketCycleResponse,
  KrMarketCycleData,
} from '@/types/economic';
import type { MarketSeason } from '@/components/economic/marketCycleConstants';

export interface AIAnalysisData {
  comment: string;
  recommendation: string;
  risk?: string;
}

export function useMarketCycle(country: 'us' | 'kr' = 'us', isAdmin: boolean = false) {
  const [cycleData, setCycleData] = useState<MarketCycleData | KrMarketCycleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<MarketSeason | null>(null);

  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisData | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // 통합 fetch (기존 useEffect + handleRetry 중복 제거)
  const fetchCycleData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response =
        country === 'kr'
          ? await api.get<KrMarketCycleResponse>(`/api/economic/market-cycle?country=kr`)
          : await api.get<MarketCycleResponse>(`/api/economic/market-cycle?country=us`);

      if (response.data.success && response.data.data) {
        setCycleData(response.data.data);
        setSelectedSeason(response.data.data.season as MarketSeason);
      } else {
        setError(response.data.error || '시장 사이클 데이터를 불러올 수 없습니다.');
      }
    } catch {
      setError('시장 사이클 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  }, [country]);

  useEffect(() => {
    fetchCycleData();
  }, [fetchCycleData]);

  // AI 분석 요청
  const requestAI = useCallback(async () => {
    if (!isAdmin) return;

    setLoadingAI(true);
    setAiError(null);

    try {
      const response =
        country === 'kr'
          ? await api.get<KrMarketCycleResponse>(`/api/economic/market-cycle/analysis?country=kr`)
          : await api.get<MarketCycleResponse>(`/api/economic/market-cycle/analysis?country=us`);

      if (response.data.success && response.data.data) {
        const { ai_comment, ai_recommendation, ai_risk } = response.data.data;

        if (ai_comment && ai_recommendation) {
          setAiAnalysis({
            comment: ai_comment,
            recommendation: ai_recommendation,
            risk: ai_risk || undefined,
          });
        } else {
          setAiError('AI 분석 결과를 받을 수 없습니다.');
        }
      } else {
        setAiError(response.data.error || 'AI 분석 요청 실패');
      }
    } catch {
      setAiError('AI 분석 요청 중 오류가 발생했습니다.');
    } finally {
      setLoadingAI(false);
    }
  }, [country, isAdmin]);

  return {
    cycleData,
    loading,
    error,
    selectedSeason,
    setSelectedSeason,
    aiAnalysis,
    loadingAI,
    aiError,
    retry: fetchCycleData,
    requestAI,
  };
}
