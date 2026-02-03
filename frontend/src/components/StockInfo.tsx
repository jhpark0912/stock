import type { StockData } from '../types/stock';
import { Building2, TrendingUp, TrendingDown } from 'lucide-react';
import PurchasePriceInput from './PurchasePriceInput';
import ProfitDisplay from './ProfitDisplay';
import { cn } from '@/lib/utils';
import { FinancialMetricsCards } from './FinancialMetricsCards';

// --- Helper Functions & Components ---

const formatMarketCap = (value: number | null): string => {
  if (value === null || value === undefined) return 'N/A';
  const trillion = value / 1e12;
  return `${trillion.toFixed(2)}조 원`;
};

// --- Child Components for each section ---

export const CompanyInfoCard = ({ data, className }: { data: StockData, className?: string }) => {
  return (
    <div className={cn(
      "bg-card border border-border/30 rounded-2xl p-8 h-full transition-all duration-200",
      "shadow-sm hover:shadow-md hover:-translate-y-0.5",
      className
    )}>
      <div className="flex items-start gap-4">
        <Building2 className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
        <div className="flex-1 min-w-0">
          <h2 className="text-3xl font-bold mb-1">{data.company.name}</h2>
          <p className="text-sm text-muted-foreground mb-4">{data.ticker}</p>

          {data.company.sector && (
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-medium border border-primary/20">
                {data.company.sector}
              </span>
              {data.company.industry && (
                <span className="px-3 py-1.5 bg-muted/50 text-muted-foreground rounded-lg text-xs font-medium border border-border/50">
                  {data.company.industry}
                </span>
              )}
            </div>
          )}

          {data.company.summary_translated && (
            <p className="text-sm text-foreground/70 leading-relaxed line-clamp-3" title={data.company.summary_translated}>
              {data.company.summary_translated}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export const PriceCard = ({ 
  data, 
  className,
  ticker,
  purchasePrice,
  onUpdatePurchasePrice,
}: { 
  data: StockData;
  className?: string;
  ticker?: string;
  purchasePrice?: number | null;
  onUpdatePurchasePrice?: (price: number | null) => void;
}) => {
  const priceChange = data.price.current - data.price.open;
  const priceChangePercent = data.price.open
    ? ((priceChange / data.price.open) * 100)
    : 0;
  const isPositive = priceChange > 0;

  // 수익률 계산 (구매가가 있을 때만)
  const profitInfo = purchasePrice !== null && purchasePrice !== undefined
    ? {
        purchasePrice,
        currentPrice: data.price.current,
        profitAmount: data.price.current - purchasePrice,
        profitPercent: ((data.price.current - purchasePrice) / purchasePrice) * 100,
        isProfit: data.price.current >= purchasePrice,
      }
    : null;

  return (
    <div className={cn(
      "bg-card border border-border/30 rounded-2xl p-8 h-full transition-all duration-200",
      "shadow-sm hover:shadow-md hover:-translate-y-0.5",
      className
    )}>
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">현재가</h3>
      <div className="text-5xl font-bold mb-3">
        ${data.price.current.toFixed(2)}
      </div>
      <div className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg w-fit",
        isPositive ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
      )}>
        {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        <span className="text-sm font-semibold">
          {isPositive ? '+' : ''}{priceChange.toFixed(2)} ({isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%)
        </span>
      </div>

      {/* 구매가 입력 */}
      {ticker && onUpdatePurchasePrice && (
        <>
          <div className="mt-8 pt-8 border-t border-border/50">
            <PurchasePriceInput
              ticker={ticker}
              currentPrice={data.price.current}
              purchasePrice={purchasePrice ?? null}
              onUpdate={onUpdatePurchasePrice}
            />
          </div>

          {/* 수익률 표시 (구매가가 있을 때만) */}
          {profitInfo && (
            <div className="mt-4">
              <ProfitDisplay profitInfo={profitInfo} />
            </div>
          )}
        </>
      )}

      {/* 시가총액 */}
      <div className="mt-8 pt-8 border-t border-border/50">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">시가총액</span>
          <span className="font-semibold">{formatMarketCap(data.market_cap)}</span>
        </div>
      </div>
    </div>
  );
};

// --- Main Component (for backward compatibility and layout) ---

interface StockInfoProps {
  data: StockData;
}

export default function StockInfo({ data }: StockInfoProps) {
  return (
    <div className="space-y-6 @container/main">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <CompanyInfoCard data={data} className="lg:col-span-2" />
        <PriceCard data={data} />
      </div>
      <FinancialMetricsCards data={data} />
    </div>
  );
}
