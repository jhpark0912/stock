import type { TechnicalIndicators } from '../types/stock';
import { TrendingUp, Activity, BarChart3 } from 'lucide-react';

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
      <div className="w-full max-w-6xl bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          기술적 지표
        </h3>
        <p className="text-sm text-gray-500">데이터를 불러오는 중...</p>
      </div>
    );
  }

  // RSI 색상 결정
  const getRSIColor = (rsi: number | null | undefined) => {
    if (rsi === null || rsi === undefined) return 'bg-gray-600';
    if (rsi < 30) return 'bg-green-500'; // 과매도 - 매수 기회
    if (rsi > 70) return 'bg-red-500'; // 과매수 - 매도 고려
    return 'bg-blue-500'; // 중립
  };

  return (
    <div className="w-full max-w-6xl space-y-4">
      {/* 이동평균 (SMA/EMA) */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          이동평균
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {/* SMA */}
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">SMA(20일)</p>
            <p className="text-sm font-medium text-gray-700">{formatNumber(data.sma?.sma20)}</p>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">SMA(50일)</p>
            <p className="text-sm font-medium text-gray-700">{formatNumber(data.sma?.sma50)}</p>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">SMA(200일)</p>
            <p className="text-sm font-medium text-gray-700">{formatNumber(data.sma?.sma200)}</p>
          </div>
          {/* EMA */}
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">EMA(12일)</p>
            <p className="text-sm font-medium text-gray-700">{formatNumber(data.ema?.ema12)}</p>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">EMA(26일)</p>
            <p className="text-sm font-medium text-gray-700">{formatNumber(data.ema?.ema26)}</p>
          </div>
        </div>
      </div>

      {/* RSI */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          RSI (상대강도지수)
        </h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-gray-500">RSI(14일)</span>
            <span className="text-base font-semibold text-gray-700">{formatNumber(data.rsi?.rsi14)}</span>
          </div>
          {data.rsi?.rsi14 !== null && data.rsi?.rsi14 !== undefined && (
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${getRSIColor(data.rsi.rsi14)}`}
                style={{ width: `${Math.min(data.rsi.rsi14, 100)}%` }}
              ></div>
            </div>
          )}
          <div className="flex justify-between text-xs text-gray-500">
            <span className="text-green-600">과매도 (&lt;30)</span>
            <span>중립 (30-70)</span>
            <span className="text-red-600">과매수 (&gt;70)</span>
          </div>
        </div>
      </div>

      {/* MACD */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          MACD
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">MACD Line</p>
            <p className="text-sm font-medium text-gray-700">{formatNumber(data.macd?.macd)}</p>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">Signal Line</p>
            <p className="text-sm font-medium text-gray-700">{formatNumber(data.macd?.signal)}</p>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">Histogram</p>
            <p className={`text-sm font-medium ${(data.macd?.histogram ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatNumber(data.macd?.histogram)}
            </p>
          </div>
        </div>
      </div>

      {/* Bollinger Bands */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          볼린저밴드
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">상단 밴드</p>
            <p className="text-sm font-medium text-red-600">{formatNumber(data.bollinger_bands?.upper)}</p>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">중간 밴드 (SMA20)</p>
            <p className="text-sm font-medium text-gray-700">{formatNumber(data.bollinger_bands?.middle)}</p>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-xs text-gray-500">하단 밴드</p>
            <p className="text-sm font-medium text-green-600">{formatNumber(data.bollinger_bands?.lower)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
