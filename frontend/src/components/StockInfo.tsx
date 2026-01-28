import type { StockData } from '../types/stock';

interface StockInfoProps {
  data: StockData;
}

export default function StockInfo({ data }: StockInfoProps) {
  const formatNumber = (value: number | null, decimals = 2): string => {
    if (value === null || value === undefined) return 'N/A';
    return value.toLocaleString('ko-KR', { 
      minimumFractionDigits: decimals, 
      maximumFractionDigits: decimals 
    });
  };

  const formatPercent = (value: number | null): string => {
    if (value === null || value === undefined) return 'N/A';
    return `${(value * 100).toFixed(2)}%`;
  };

  const formatCurrency = (value: number | null): string => {
    if (value === null || value === undefined) return 'N/A';
    return `$${formatNumber(value)}`;
  };

  const formatLargeNumber = (value: number | null): string => {
    if (value === null || value === undefined) return 'N/A';
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return formatCurrency(value);
  };

  return (
    <div className="w-full max-w-4xl space-y-6">
      {/* 회사 정보 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">{data.company.name}</h2>
            <p className="text-lg text-gray-600">{data.ticker}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">시가총액</p>
            <p className="text-xl font-semibold text-gray-800">{formatLargeNumber(data.market_cap)}</p>
          </div>
        </div>
        
        {data.company.sector && (
          <div className="flex gap-2 mb-4">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              {data.company.sector}
            </span>
            {data.company.industry && (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                {data.company.industry}
              </span>
            )}
          </div>
        )}

        {data.company.summary_translated && (
          <p className="text-gray-700 leading-relaxed">{data.company.summary_translated}</p>
        )}
      </div>

      {/* 가격 정보 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">가격 정보</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">현재가</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(data.price.current)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">시가</p>
            <p className="text-lg font-semibold text-gray-800">{formatCurrency(data.price.open)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">고가</p>
            <p className="text-lg font-semibold text-red-600">{formatCurrency(data.price.high)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">저가</p>
            <p className="text-lg font-semibold text-green-600">{formatCurrency(data.price.low)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">거래량</p>
            <p className="text-lg font-semibold text-gray-800">{formatNumber(data.price.volume, 0)}</p>
          </div>
        </div>
      </div>

      {/* 재무 지표 */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">재무 지표</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">PER (Trailing)</p>
            <p className="text-lg font-semibold text-gray-800">{formatNumber(data.financials.trailing_pe)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">PER (Forward)</p>
            <p className="text-lg font-semibold text-gray-800">{formatNumber(data.financials.forward_pe)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">PBR</p>
            <p className="text-lg font-semibold text-gray-800">{formatNumber(data.financials.pbr)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">PEG</p>
            <p className="text-lg font-semibold text-gray-800">{formatNumber(data.financials.peg)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">ROE</p>
            <p className="text-lg font-semibold text-gray-800">{formatPercent(data.financials.roe)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">영업이익률</p>
            <p className="text-lg font-semibold text-gray-800">{formatPercent(data.financials.opm)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">부채비율</p>
            <p className="text-lg font-semibold text-gray-800">{formatNumber(data.financials.debt_to_equity)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">유동비율</p>
            <p className="text-lg font-semibold text-gray-800">{formatNumber(data.financials.current_ratio)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">당좌비율</p>
            <p className="text-lg font-semibold text-gray-800">{formatNumber(data.financials.quick_ratio)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">배당수익률</p>
            <p className="text-lg font-semibold text-gray-800">{formatPercent(data.financials.dividend_yield)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">배당성향</p>
            <p className="text-lg font-semibold text-gray-800">{formatPercent(data.financials.payout_ratio)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">매출 성장률</p>
            <p className="text-lg font-semibold text-gray-800">{formatPercent(data.financials.revenue_growth)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">이익 성장률</p>
            <p className="text-lg font-semibold text-gray-800">{formatPercent(data.financials.earnings_growth)}</p>
          </div>
        </div>
      </div>

      {/* 타임스탬프 */}
      <div className="text-center text-sm text-gray-500">
        마지막 업데이트: {new Date(data.timestamp).toLocaleString('ko-KR')}
      </div>
    </div>
  );
}
