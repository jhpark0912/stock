/**
 * 포트폴리오 API 함수들
 */
import { api, type ApiResponse } from './api';

/**
 * 포트폴리오 아이템 타입
 */
export interface PortfolioItem {
  id: number;
  ticker: string;
  purchase_price: number | null;
  quantity: number | null;
  purchase_date: string | null;
  notes: string | null;
  last_price: number | null;
  profit_percent: number | null;
  last_updated: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * 포트폴리오 생성 요청 타입
 */
export interface CreatePortfolioRequest {
  ticker: string;
  purchase_price?: number | null;
  quantity?: number | null;
  purchase_date?: string | null;
  notes?: string | null;
}

/**
 * 포트폴리오 업데이트 요청 타입
 */
export interface UpdatePortfolioRequest {
  purchase_price?: number | null;
  quantity?: number | null;
  purchase_date?: string | null;
  notes?: string | null;
}

/**
 * 전체 포트폴리오 목록 조회
 */
export async function getPortfolios(): Promise<PortfolioItem[]> {
  const response = await api.get<ApiResponse<PortfolioItem[]>>('/api/portfolio');
  return response.data.data;
}

/**
 * 포트폴리오 생성
 */
export async function createPortfolio(data: CreatePortfolioRequest): Promise<PortfolioItem> {
  const response = await api.post<ApiResponse<PortfolioItem>>('/api/portfolio', data);
  return response.data.data;
}

/**
 * 포트폴리오 업데이트
 */
export async function updatePortfolio(ticker: string, data: UpdatePortfolioRequest): Promise<PortfolioItem> {
  const response = await api.put<ApiResponse<PortfolioItem>>(`/api/portfolio/${ticker}`, data);
  return response.data.data;
}

/**
 * 포트폴리오 삭제
 */
export async function deletePortfolio(ticker: string): Promise<void> {
  await api.delete(`/api/portfolio/${ticker}`);
}

/**
 * 수익률 정보 업데이트
 */
export async function updateProfitInfo(
  ticker: string,
  currentPrice: number,
  purchasePrice: number | null
): Promise<PortfolioItem> {
  // purchasePrice가 없으면 업데이트하지 않음
  if (!purchasePrice) {
    throw new Error('Purchase price is required to calculate profit');
  }

  const profitPercent = ((currentPrice - purchasePrice) / purchasePrice) * 100;

  const response = await api.put<ApiResponse<PortfolioItem>>(`/api/portfolio/${ticker}`, {
    last_price: currentPrice,
    profit_percent: profitPercent,
  });

  return response.data.data;
}
