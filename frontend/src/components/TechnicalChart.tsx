import type { TechnicalIndicators } from '../types/stock';

interface TechnicalChartProps {
  data: TechnicalIndicators | null | undefined;
}

export default function TechnicalChart({ data }: TechnicalChartProps) {
  const formatNumber = (value: number | null | undefined, decimals = 2): string => {
    if (value === null || value === undefined) return 'N/A';
    return value.toFixed(decimals);
  };

  if (!data) {
    return (
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">기술적 지표</h2>
        <p className="text-gray-500">기술적 지표 데이터를 불러오는 중...</p>
        <p className="text-sm text-gray-400 mt-2">
          API 호출 시 <code className="bg-gray-100 px-2 py-1 rounded">include_technical=true</code> 파라미터를 추가하세요.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl space-y-6">
      {/* 이동평균 (SMA/EMA) */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">이동평균 (Moving Averages)</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {/* SMA */}
          <div>
            <p className="text-sm text-gray-500">SMA(20일)</p>
            <p className="text-lg font-semibold text-blue-600">{formatNumber(data.sma?.sma20)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">SMA(50일)</p>
            <p className="text-lg font-semibold text-blue-600">{formatNumber(data.sma?.sma50)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">SMA(200일)</p>
            <p className="text-lg font-semibold text-blue-600">{formatNumber(data.sma?.sma200)}</p>
          </div>
          {/* EMA */}
          <div>
            <p className="text-sm text-gray-500">EMA(12일)</p>
            <p className="text-lg font-semibold text-green-600">{formatNumber(data.ema?.ema12)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">EMA(26일)</p>
            <p className="text-lg font-semibold text-green-600">{formatNumber(data.ema?.ema26)}</p>
          </div>
        </div>
      </div>

      {/* RSI */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">상대강도지수 (RSI)</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">RSI(14일)</span>
            <span className="text-2xl font-bold text-purple-600">{formatNumber(data.rsi?.rsi14)}</span>
          </div>
          {data.rsi?.rsi14 !== null && data.rsi?.rsi14 !== undefined && (
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className={`h-4 rounded-full ${
                  data.rsi.rsi14 > 70
                    ? 'bg-red-500'
                    : data.rsi.rsi14 < 30
                    ? 'bg-green-500'
                    : 'bg-yellow-500'
                }`}
                style={{ width: `${data.rsi.rsi14}%` }}
              ></div>
            </div>
          )}
          <div className="flex justify-between text-xs text-gray-500">
            <span>과매도 (&lt;30)</span>
            <span>중립 (30-70)</span>
            <span>과매수 (&gt;70)</span>
          </div>
        </div>
      </div>

      {/* MACD */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">MACD</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">MACD Line</p>
            <p className="text-lg font-semibold text-blue-600">{formatNumber(data.macd?.macd)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Signal Line</p>
            <p className="text-lg font-semibold text-orange-600">{formatNumber(data.macd?.signal)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Histogram</p>
            <p className={`text-lg font-semibold ${
              data.macd?.histogram && data.macd.histogram > 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {formatNumber(data.macd?.histogram)}
            </p>
          </div>
        </div>
      </div>

      {/* Bollinger Bands */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4">볼린저밴드 (Bollinger Bands)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">상단 밴드</p>
            <p className="text-lg font-semibold text-red-600">{formatNumber(data.bollinger_bands?.upper)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">중간 밴드 (SMA20)</p>
            <p className="text-lg font-semibold text-gray-600">{formatNumber(data.bollinger_bands?.middle)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">하단 밴드</p>
            <p className="text-lg font-semibold text-green-600">{formatNumber(data.bollinger_bands?.lower)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
