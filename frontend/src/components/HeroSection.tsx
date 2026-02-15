import { TrendingUp, TrendingDown } from 'lucide-react';
import { calculateProfit } from '../lib/utils';

interface HeroSectionProps {
  ticker?: string;
  companyName?: string;
  currentPrice?: number;
  priceChange?: number;
  priceChangePercent?: number;
  marketCap?: string;
  sector?: string;
  purchasePrice?: number | null;
  quantity?: number | null;
  hasData?: boolean;
}

export function HeroSection({
  ticker,
  companyName,
  currentPrice = 0,
  priceChange = 0,
  priceChangePercent = 0,
  marketCap,
  sector,
  purchasePrice,
  quantity,
  hasData = false,
}: HeroSectionProps) {
  const isPositive = priceChange >= 0;

  // 평가손익 계산
  const profitInfo = calculateProfit(purchasePrice || null, currentPrice, quantity || null);

  // 데이터가 없을 때: 간단한 메시지만 표시
  if (!hasData) {
    return (
      <div className="border-b border-border bg-card">
        <div className="px-3 sm:px-6 py-4 sm:py-8 text-center">
          <h1 className="text-lg sm:text-xl font-semibold text-foreground mb-1 sm:mb-2">
            카테고리를 선택하세요
          </h1>
          <p className="text-sm text-muted-foreground">
            사이드바에서 매물을 선택하거나 새로운 카테고리를 추가해주세요
          </p>
        </div>
      </div>
    );
  }

  // 데이터가 있을 때: 기존 UI 표시
  return (
    <div className="border-b border-border bg-card">
      <div className="px-3 sm:px-6 py-2 sm:py-3">
        {/* 모바일: 한 줄 레이아웃 */}
        <div className="sm:hidden">
          {/* 첫 줄: 티커 + 가격 + 변동률 */}
          <div className="flex items-center justify-between mb-0.5">
            <h1 className="text-base font-bold text-foreground">{ticker || 'N/A'}</h1>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold text-foreground">
                ${(currentPrice || 0).toFixed(2)}
              </span>
              <span
                className={`text-xs font-semibold ${
                  isPositive ? 'text-success' : 'text-destructive'
                }`}
              >
                {isPositive ? '+' : ''}{(priceChangePercent || 0).toFixed(2)}%
              </span>
            </div>
          </div>
          {/* 둘째 줄: 회사명 */}
          <p className="text-[11px] text-muted-foreground truncate">{companyName || 'Select a ticker'}</p>
        </div>

        {/* 데스크톱: 기존 레이아웃 */}
        <div className="hidden sm:block">
          {/* Ticker + Company Name */}
          <div className="mb-2">
            <h1 className="text-xl font-bold text-foreground">{ticker || 'N/A'}</h1>
            <p className="text-sm text-muted-foreground">{companyName || 'Select a ticker'}</p>
          </div>

          {/* Current Price */}
          <div className="flex items-baseline gap-4 mb-2">
            <span className="text-3xl font-bold text-foreground">
              ${(currentPrice || 0).toFixed(2)}
            </span>
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md ${
                isPositive
                  ? 'bg-success/10 text-success'
                  : 'bg-destructive/10 text-destructive'
              }`}
            >
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span className="text-sm font-semibold">
                {isPositive ? '+' : ''}
                {(priceChange || 0).toFixed(2)} ({(priceChangePercent || 0).toFixed(2)}%)
              </span>
            </div>
          </div>

          {/* Market Cap + Sector */}
          <div className="flex gap-4 text-xs text-muted-foreground">
            <div>
              <span className="font-medium">Market Cap: </span>
              <span>{marketCap}</span>
            </div>
            <div className="h-3 w-px bg-border" />
            <div>
              <span className="font-medium">Sector: </span>
              <span>{sector}</span>
            </div>
          </div>
        </div>

        {/* 평단가 정보 (있을 경우에만 표시) */}
        {profitInfo && (
          <div className="mt-1.5 sm:mt-3 pt-1.5 sm:pt-3 border-t border-border">
            {/* 모바일: 간소화된 레이아웃 */}
            <div className="sm:hidden">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">
                  평단 ${profitInfo.purchasePrice.toFixed(2)} × {profitInfo.quantity.toLocaleString()}주
                </span>
                <span
                  className={`font-bold ${
                    profitInfo.isProfit ? 'text-success' : 'text-destructive'
                  }`}
                >
                  {profitInfo.profitPercent > 0 ? '+' : ''}{profitInfo.profitPercent.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* 데스크톱: 기존 상세 레이아웃 */}
            <div className="hidden sm:block">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-medium">평단가:</span>
                  <span className="text-foreground font-semibold">
                    ${profitInfo.purchasePrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-medium">보유 수량:</span>
                  <span className="text-foreground font-semibold">
                    {profitInfo.quantity.toLocaleString()}주
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-medium">매입금액:</span>
                  <span className="text-foreground font-semibold">
                    ${profitInfo.totalPurchaseAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-medium">평가금액:</span>
                  <span className="text-foreground font-semibold">
                    ${profitInfo.totalCurrentAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex items-center gap-2 col-span-2 pt-1 border-t border-border/50">
                  <span className="text-muted-foreground font-medium">총 평가손익:</span>
                  <span
                    className={`text-lg font-bold ${
                      profitInfo.isProfit ? 'text-success' : 'text-destructive'
                    }`}
                  >
                    {profitInfo.totalProfitAmount > 0 ? '+' : ''}
                    ${profitInfo.totalProfitAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    {' '}
                    ({profitInfo.profitPercent > 0 ? '+' : ''}{profitInfo.profitPercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
