/**
 * 수익률 계산 유틸리티
 */

import type { ProfitInfo } from '../types/user';

/**
 * 구매가와 현재가를 기반으로 수익률 계산
 * @param purchasePrice 구매가
 * @param currentPrice 현재가
 * @returns 수익률 정보
 */
export const calculateProfit = (
  purchasePrice: number,
  currentPrice: number
): ProfitInfo => {
  // 수익 금액 계산 (현재가 - 구매가)
  const profitAmount = currentPrice - purchasePrice;

  // 수익률 계산 (수익 금액 / 구매가 * 100)
  const profitPercent = (profitAmount / purchasePrice) * 100;

  // 수익 여부 (0 이상이면 수익, 음수면 손실)
  const isProfit = profitAmount >= 0;

  return {
    purchasePrice,
    currentPrice,
    profitAmount,
    profitPercent,
    isProfit,
  };
};

/**
 * 금액을 통화 형식으로 포맷
 * @param amount 금액
 * @param currency 통화 기호 (기본값: '$')
 * @returns 포맷된 금액 문자열
 * @example formatCurrency(1234.56) // "$1,234.56"
 */
export const formatCurrency = (amount: number, currency: string = '$'): string => {
  const formatted = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const sign = amount >= 0 ? '+' : '-';
  return `${sign}${currency}${formatted}`;
};

/**
 * 퍼센트를 포맷
 * @param percent 퍼센트 값
 * @returns 포맷된 퍼센트 문자열
 * @example formatPercent(5.234) // "+5.23%"
 */
export const formatPercent = (percent: number): string => {
  const sign = percent >= 0 ? '+' : '';
  return `${sign}${percent.toFixed(2)}%`;
};

/**
 * 수익률 정보를 간단한 문자열로 변환
 * @param profitInfo 수익률 정보
 * @returns 포맷된 수익률 문자열
 * @example formatProfitInfo({...}) // "+$5.20 (+5.23%)"
 */
export const formatProfitInfo = (profitInfo: ProfitInfo): string => {
  const amount = formatCurrency(profitInfo.profitAmount);
  const percent = formatPercent(profitInfo.profitPercent);
  return `${amount} (${percent})`;
};

/**
 * 간단한 퍼센트 표시 (사이드바용)
 * @param profitInfo 수익률 정보
 * @returns 간단한 퍼센트 문자열
 * @example formatSimplePercent({...}) // "+5.2%"
 */
export const formatSimplePercent = (profitInfo: ProfitInfo): string => {
  return formatPercent(profitInfo.profitPercent);
};
