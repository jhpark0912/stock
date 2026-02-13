/**
 * AI 분석 요약 저장 API 함수들
 */
import { api } from './api';
import type {
  AnalysisSummary,
  SummaryResponse,
  SavedAnalysis,
  SaveAnalysisRequest,
  SaveAnalysisResponse,
  AnalysisListResponse,
} from '../types/stock';

/**
 * 요약 생성 (Gemini 호출)
 * @param ticker 종목 티커
 * @param fullReport 전체 마크다운 보고서
 */
export async function generateSummary(
  ticker: string,
  fullReport: string
): Promise<AnalysisSummary> {
  const response = await api.post<SummaryResponse>(
    `/api/stock/${ticker}/analysis/summary`,
    { full_report: fullReport }
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || '요약 생성 실패');
  }

  return response.data.data;
}

/**
 * 분석 저장
 * @param ticker 종목 티커
 * @param data 저장할 분석 데이터
 */
export async function saveAnalysis(
  ticker: string,
  data: SaveAnalysisRequest
): Promise<SavedAnalysis> {
  const response = await api.post<SaveAnalysisResponse>(
    `/api/stock/${ticker}/analysis/save`,
    data
  );

  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || '분석 저장 실패');
  }

  return response.data.data;
}

/**
 * 티커별 분석 이력 조회
 * @param ticker 종목 티커
 */
export async function getAnalysisHistory(
  ticker: string
): Promise<SavedAnalysis[]> {
  const response = await api.get<AnalysisListResponse>(
    `/api/stock/${ticker}/analysis/history`
  );

  if (!response.data.success) {
    throw new Error(response.data.error || '분석 이력 조회 실패');
  }

  return response.data.data || [];
}

/**
 * 티커별 최신 분석 조회
 * @param ticker 종목 티커
 */
export async function getLatestAnalysis(
  ticker: string
): Promise<SavedAnalysis | null> {
  const response = await api.get<SaveAnalysisResponse>(
    `/api/stock/${ticker}/analysis/latest`
  );

  if (!response.data.success) {
    throw new Error(response.data.error || '최신 분석 조회 실패');
  }

  return response.data.data;
}

/**
 * 사용자의 모든 분석 조회
 */
export async function getAllAnalyses(): Promise<SavedAnalysis[]> {
  const response = await api.get<AnalysisListResponse>(
    '/api/stock/analysis/all'
  );

  if (!response.data.success) {
    throw new Error(response.data.error || '전체 분석 조회 실패');
  }

  return response.data.data || [];
}

/**
 * 티커별 분석 전체 삭제
 * @param ticker 종목 티커
 */
export async function deleteTickerAnalyses(
  ticker: string
): Promise<{ deleted_count: number }> {
  const response = await api.delete<{ success: boolean; deleted_count: number }>(
    `/api/stock/${ticker}/analysis`
  );

  return { deleted_count: response.data.deleted_count };
}

/**
 * 단일 분석 삭제
 * @param analysisId 분석 ID
 */
export async function deleteAnalysis(
  analysisId: number
): Promise<{ deleted_id: number }> {
  const response = await api.delete<{ success: boolean; deleted_id: number }>(
    `/api/stock/analysis/${analysisId}`
  );

  return { deleted_id: response.data.deleted_id };
}
