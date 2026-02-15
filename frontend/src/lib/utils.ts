import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 평가손익 계산
 */
export interface ProfitInfo {
  purchasePrice: number;
  quantity: number;
  totalPurchaseAmount: number;
  totalCurrentAmount: number;
  totalProfitAmount: number;
  profitPercent: number;
  isProfit: boolean;
}

/**
 * 한국 주식 티커인지 확인 (.KS: 코스피, .KQ: 코스닥)
 */
export function isKoreanTicker(ticker?: string): boolean {
  if (!ticker) return false;
  const upperTicker = ticker.toUpperCase();
  return upperTicker.endsWith('.KS') || upperTicker.endsWith('.KQ');
}

/**
 * 티커에 따라 적절한 통화 기호 반환
 */
export function getCurrencySymbol(ticker?: string): string {
  return isKoreanTicker(ticker) ? '₩' : '$';
}

/**
 * 금액을 통화에 맞게 포맷팅
 * - 한국 주식: 원화 (정수, 천단위 구분)
 * - 미국 주식: 달러 (소수점 2자리)
 */
export function formatCurrency(amount: number, ticker?: string): string {
  const isKorean = isKoreanTicker(ticker);

  if (isKorean) {
    // 원화: 정수로 표시, 천단위 구분
    return `₩${Math.round(amount).toLocaleString('ko-KR')}`;
  } else {
    // 달러: 소수점 2자리
    return `$${amount.toFixed(2)}`;
  }
}

/**
 * 큰 금액을 통화에 맞게 포맷팅 (총액 등)
 */
export function formatLargeCurrency(amount: number, ticker?: string): string {
  const isKorean = isKoreanTicker(ticker);

  if (isKorean) {
    return `₩${Math.round(amount).toLocaleString('ko-KR')}`;
  } else {
    return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
}

export function calculateProfit(
  purchasePrice: number | null,
  currentPrice: number,
  quantity: number | null
): ProfitInfo | null {
  // 구매가나 수량이 없으면 계산 불가
  if (purchasePrice === null || purchasePrice === undefined || quantity === null || quantity === undefined) {
    return null;
  }

  // 총 구매금액
  const totalPurchaseAmount = purchasePrice * quantity;

  // 총 평가금액
  const totalCurrentAmount = currentPrice * quantity;

  // 평가손익
  const totalProfitAmount = totalCurrentAmount - totalPurchaseAmount;

  // 수익률 (%)
  const profitPercent = (totalProfitAmount / totalPurchaseAmount) * 100;

  return {
    purchasePrice,
    quantity,
    totalPurchaseAmount,
    totalCurrentAmount,
    totalProfitAmount,
    profitPercent,
    isProfit: totalProfitAmount >= 0,
  };
}
