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
