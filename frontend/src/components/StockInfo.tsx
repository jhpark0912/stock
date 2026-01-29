import type { StockData } from '../types/stock';
import { Building2, TrendingUp, TrendingDown } from 'lucide-react';

// --- Helper Functions & Components ---

const formatMarketCap = (value: number | null): string => {
  if (value === null || value === undefined) return 'N/A';
  const trillion = value / 1e12;
  return `${trillion.toFixed(2)}조 원`;
};

const MetricItem = ({ label, value, format }: { label: string; value: number | null; format?: 'number' | 'percent' }) => {
  const formattedValue = value !== null && value !== undefined
    ? format === 'percent'
      ? `${(value * 100).toFixed(1)}%`
      : value.toFixed(2)
    : 'N/A';

  return (
    <div className="p-2 bg-background rounded">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold">{formattedValue}</p>
    </div>
  );
};


// --- Child Components for each section ---

export const CompanyInfoCard = ({ data, className }: { data: StockData, className?: string }) => {
  return (
    <div className={`bg-white rounded-lg border p-4 h-full ${className}`}>
      <div className="flex items-start gap-4">
        <Building2 className="w-6 h-6 text-gray-600 flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h2 className="text-xl font-semibold">{data.company.name}</h2>
          <p className="text-sm text-gray-500 mb-2">{data.ticker}</p>

          {data.company.sector && (
            <div className="flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                {data.company.sector}
              </span>
              {data.company.industry && (
                <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs">
                  {data.company.industry}
                </span>
              )}
            </div>
          )}
          
          {data.company.summary_translated && (
            <p className="text-sm text-gray-700 mt-3 leading-relaxed line-clamp-3">
              {data.company.summary_translated}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export const PriceCard = ({ data, className }: { data: StockData, className?: string }) => {
  const priceChange = data.price.current - data.price.open;
  const priceChangePercent = data.price.open
    ? ((priceChange / data.price.open) * 100)
    : 0;
  const isPositive = priceChange > 0;

  return (
    <div className={`bg-white rounded-lg border p-4 h-full ${className}`}>
      <h3 className="text-sm text-gray-500 mb-1">현재가</h3>
      <div className="text-3xl font-bold">
        ${data.price.current.toFixed(2)}
      </div>
      <div className={`flex items-center gap-1 mt-1 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        <span className="text-sm font-medium">
          {isPositive ? '+' : ''}{priceChange.toFixed(2)} ({isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%)
        </span>
      </div>
      <div className="mt-4 pt-4 border-t">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">시가총액</span>
          <span className="font-semibold">{formatMarketCap(data.market_cap)}</span>
        </div>
      </div>
    </div>
  );
};

export const FinancialMetricsCard = ({ data, className }: { data: StockData, className?: string }) => {
  return (
    <div className={`bg-white rounded-lg border p-4 ${className}`}>
      <h3 className="text-base font-semibold text-gray-700 mb-3">주요 재무 지표</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        <MetricItem label="PER" value={data.financials.trailing_pe} />
        <MetricItem label="PBR" value={data.financials.pbr} />
        <MetricItem label="ROE" value={data.financials.roe} format="percent" />
        <MetricItem label="영업이익률" value={data.financials.opm} format="percent" />
        <MetricItem label="부채비율" value={data.financials.debt_to_equity} />
        <MetricItem label="유동비율" value={data.financials.current_ratio} />
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
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <CompanyInfoCard data={data} className="lg:col-span-2" />
        <PriceCard data={data} />
      </div>
      <FinancialMetricsCard data={data} />
    </div>
  );
}
