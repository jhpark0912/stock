import { TrendingUp, TrendingDown } from 'lucide-react';

interface HeroSectionProps {
  ticker?: string;
  companyName?: string;
  currentPrice?: number;
  priceChange?: number;
  priceChangePercent?: number;
  marketCap?: string;
  sector?: string;
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
  hasData = false,
}: HeroSectionProps) {
  const isPositive = priceChange >= 0;

  // 데이터가 없을 때: 간단한 메시지만 표시
  if (!hasData) {
    return (
      <div className="border-b border-border bg-card">
        <div className="px-6 py-8 text-center">
          <h1 className="text-xl font-semibold text-foreground mb-2">
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
      <div className="px-6 py-3">
        {/* Ticker + Company Name */}
        <div className="mb-2">
          <h1 className="text-xl font-bold text-foreground">{ticker || 'N/A'}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{companyName || 'Select a ticker'}</p>
        </div>

        {/* Current Price */}
        <div className="flex items-baseline gap-4 mb-2">
          <span className="text-3xl font-bold text-foreground">
            ${(currentPrice || 0).toFixed(2)}
          </span>

          {/* Price Change */}
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
    </div>
  );
}
