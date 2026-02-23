/**
 * AI 분석 요약 생성/저장 공유 훅
 * AIAnalysisTab + StealthPortfolioPage 공통 사용
 */

import { useState } from 'react';
import { generateSummary, saveAnalysis } from '@/lib/analysisApi';
import type { AnalysisSummary } from '@/types/stock';

export function useAnalysisSummary(ticker: string, currentPrice?: number) {
  const [summary, setSummary] = useState<AnalysisSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const generate = async (report: string) => {
    setSummaryLoading(true);
    setSummaryError(null);
    setSaveSuccess(false);

    try {
      const result = await generateSummary(ticker, report);
      setSummary(result);
    } catch (e) {
      setSummaryError(e instanceof Error ? e.message : '요약 생성 실패');
    } finally {
      setSummaryLoading(false);
    }
  };

  const save = async (fullReport?: string) => {
    if (!summary) return;

    setSaveLoading(true);
    try {
      await saveAnalysis(ticker, {
        summary: summary.summary,
        strategy: summary.strategy,
        current_price: currentPrice,
        full_report: fullReport,
      });
      setSaveSuccess(true);
    } catch (e) {
      setSummaryError(e instanceof Error ? e.message : '저장 실패');
    } finally {
      setSaveLoading(false);
    }
  };

  const reset = () => {
    setSummary(null);
    setSaveSuccess(false);
    setSummaryError(null);
  };

  return {
    summary,
    summaryLoading,
    summaryError,
    saveLoading,
    saveSuccess,
    generate,
    save,
    reset,
  };
}
