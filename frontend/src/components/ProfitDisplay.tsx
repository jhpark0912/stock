/**
 * 수익률 표시 컴포넌트
 * 구매가 대비 현재가의 수익/손실을 시각적으로 표시
 */

import { TrendingUp, TrendingDown } from 'lucide-react';
import type { ProfitInfo } from '@/types/user';
import {
  formatCurrency,
  formatPercent,
  formatProfitInfo,
  formatSimplePercent,
} from '@/utils/profit';

interface ProfitDisplayProps {
  /** 수익률 정보 */
  profitInfo: ProfitInfo;
  /** 간단한 표시 모드 (퍼센트만 표시) */
  compact?: boolean;
}

export default function ProfitDisplay({
  profitInfo,
  compact = false,
}: ProfitDisplayProps) {
  const { isProfit, profitAmount, profitPercent } = profitInfo;

  // 색상 클래스
  const colorClass = isProfit ? 'text-green-600' : 'text-red-600';
  const bgClass = isProfit ? 'bg-green-50' : 'bg-red-50';

  // 아이콘
  const Icon = isProfit ? TrendingUp : TrendingDown;

  // Compact 모드: 퍼센트만 간단히 표시
  if (compact) {
    return (
      <div className={`inline-flex items-center gap-1 ${colorClass}`}>
        <Icon className="h-3 w-3" />
        <span className="text-xs font-medium">
          {formatSimplePercent(profitInfo)}
        </span>
      </div>
    );
  }

  // 일반 모드: 전체 정보 표시
  return (
    <div className={`${bgClass} rounded-lg p-3 border ${isProfit ? 'border-green-200' : 'border-red-200'}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-xs text-gray-600 mb-1">수익률</p>
          <div className={`flex items-center gap-1 ${colorClass}`}>
            <Icon className="h-4 w-4" />
            <span className="text-lg font-bold">
              {formatPercent(profitPercent)}
            </span>
          </div>
          <p className={`text-sm font-medium mt-1 ${colorClass}`}>
            {formatCurrency(profitAmount)}
          </p>
        </div>

        {/* 구매가 vs 현재가 비교 */}
        <div className="text-right text-xs text-gray-500">
          <p>구매가: ${profitInfo.purchasePrice.toFixed(2)}</p>
          <p>현재가: ${profitInfo.currentPrice.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
