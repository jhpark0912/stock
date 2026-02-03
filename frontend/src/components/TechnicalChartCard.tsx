import { TrendingUp, Activity, BarChart3 } from 'lucide-react';

import type { TechnicalIndicators } from '@/types/stock';

// --- Helper Functions ---
const formatNumber = (value: number | null | undefined, decimals = 2): string => {
  if (value === null || value === undefined) return 'N/A';
  return value.toFixed(decimals);
};

// --- Child Components for each Indicator ---

const MovingAveragesIndicator = ({ data }: { data: { sma: TechnicalIndicators['sma'], ema: TechnicalIndicators['ema'] } }) => (
  <div className="p-6 rounded-xl h-full bg-card/30 border border-transparent hover:border-border/50 transition-all duration-200">
    <h4 className="text-sm font-semibold flex items-center gap-2 mb-1">
      <TrendingUp className="h-4 w-4 text-primary" />
      이동평균
    </h4>
    <p className="text-xs text-muted-foreground mb-4">단순/지수 이동평균</p>
    <div className="grid grid-cols-3 gap-x-3 gap-y-4">
      {[
        { label: 'SMA 20', value: data.sma?.sma20 },
        { label: 'SMA 50', value: data.sma?.sma50 },
        { label: 'SMA 200', value: data.sma?.sma200 },
        { label: 'EMA 12', value: data.ema?.ema12 },
        { label: 'EMA 26', value: data.ema?.ema26 },
      ].map(item => (
        <div className="space-y-1" key={item.label}>
          <p className="text-xs text-muted-foreground">{item.label}</p>
          <p className="text-base font-semibold">{item.value ? `$${formatNumber(item.value)}` : 'N/A'}</p>
        </div>
      ))}
    </div>
  </div>
);

const RsiIndicator = ({ rsi }: { rsi: TechnicalIndicators['rsi'] }) => {
  const rsiValue = rsi?.rsi14;
  const getRSIColor = (val: number) => {
    if (val < 30) return 'bg-success';
    if (val > 70) return 'bg-destructive';
    return 'bg-primary';
  };

  return (
    <div className="p-6 rounded-xl h-full bg-card/30 border border-transparent hover:border-border/50 transition-all duration-200">
      <h4 className="text-sm font-semibold flex items-center gap-2 mb-1">
        <Activity className="h-4 w-4 text-primary" />
        상대강도지수 (RSI)
      </h4>
      <p className="text-xs text-muted-foreground mb-4">14일 RSI 모멘텀 지표</p>
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm text-muted-foreground">RSI (14일)</span>
        <span className="text-2xl font-bold">{formatNumber(rsiValue)}</span>
      </div>
      {rsiValue !== null && rsiValue !== undefined && (
        <div>
          <div className="w-full bg-muted/50 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${getRSIColor(rsiValue)}`}
              style={{ width: `${Math.min(rsiValue, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-2">
            <span className="text-success">과매도</span>
            <span>중립</span>
            <span className="text-destructive">과매수</span>
          </div>
        </div>
      )}
    </div>
  );
};

const MacdIndicator = ({ macd }: { macd: TechnicalIndicators['macd'] }) => (
  <div className="p-6 rounded-xl h-full bg-card/30 border border-transparent hover:border-border/50 transition-all duration-200">
    <h4 className="text-sm font-semibold flex items-center gap-2 mb-1">
      <BarChart3 className="h-4 w-4 text-primary" />
      MACD
    </h4>
    <p className="text-xs text-muted-foreground mb-4">이동평균 수렴확산</p>
    <div className="grid grid-cols-3 gap-3">
      <div>
        <p className="text-xs text-muted-foreground mb-1">MACD 선</p>
        <p className="text-base font-semibold">{formatNumber(macd?.macd)}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1">시그널 선</p>
        <p className="text-base font-semibold">{formatNumber(macd?.signal)}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1">히스토그램</p>
        <p className={`text-base font-semibold ${(macd?.histogram ?? 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
          {formatNumber(macd?.histogram)}
        </p>
      </div>
    </div>
  </div>
);

const BollingerBandsIndicator = ({ bands }: { bands: TechnicalIndicators['bollinger_bands'] }) => (
  <div className="p-6 rounded-xl h-full bg-card/30 border border-transparent hover:border-border/50 transition-all duration-200">
    <h4 className="text-sm font-semibold flex items-center gap-2 mb-1">
      <Activity className="h-4 w-4 text-primary" />
      볼린저 밴드
    </h4>
    <p className="text-xs text-muted-foreground mb-4">변동성 및 가격 수준 지표</p>
    <div className="grid grid-cols-3 gap-3">
      <div>
        <p className="text-xs text-muted-foreground mb-1">상단 밴드</p>
        <p className="text-base font-semibold text-destructive">{formatNumber(bands?.upper)}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1">중간 밴드</p>
        <p className="text-base font-semibold">{formatNumber(bands?.middle)}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1">하단 밴드</p>
        <p className="text-base font-semibold text-success">{formatNumber(bands?.lower)}</p>
      </div>
    </div>
  </div>
);


// --- Main Component ---

interface TechnicalChartCardProps {
  data: TechnicalIndicators | null | undefined;
  compact?: boolean;
}

export default function TechnicalChartCard({ data, compact = false }: TechnicalChartCardProps) {

  // Loading State
  if (!data) {
    return (
      <div className="bg-card/50 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="h-6 w-6 text-primary" />
          <h3 className="text-2xl font-bold">기술적 분석</h3>
        </div>
        <div className="h-48 bg-muted/30 rounded-xl flex items-center justify-center">
          <div className="text-center space-y-3">
            <Activity className="h-10 w-10 text-muted-foreground mx-auto animate-pulse" />
            <p className="text-sm text-muted-foreground">데이터 로딩 중...</p>
          </div>
        </div>
      </div>
    );
  }

  // Compact Layout (2x2 Grid)
  if (compact) {
    return (
      <div className="bg-card/50 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="h-6 w-6 text-primary" />
          <div>
            <h3 className="text-2xl font-bold">기술적 분석</h3>
            <p className="text-sm text-muted-foreground">주요 기술적 지표 요약</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <MovingAveragesIndicator data={{ sma: data.sma, ema: data.ema }} />
          <RsiIndicator rsi={data.rsi} />
          <MacdIndicator macd={data.macd} />
          <BollingerBandsIndicator bands={data.bollinger_bands} />
        </div>
      </div>
    );
  }

  // --- Original Layout (Individual Cards) ---
  
  // RSI-specific helpers for original layout
  const getRSIColor = (rsi: number | null | undefined) => {
    if (rsi === null || rsi === undefined) return 'bg-muted';
    if (rsi < 30) return 'bg-success';
    if (rsi > 70) return 'bg-destructive';
    return 'bg-primary';
  };

  const getRSITextColor = (rsi: number | null | undefined) => {
    if (rsi === null || rsi === undefined) return 'text-muted-foreground';
    if (rsi < 30) return 'text-success';
    if (rsi > 70) return 'text-destructive';
    return 'text-primary';
  };
  
  return (
    <div className="space-y-8">
      <div className="bg-card/50 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="h-6 w-6 text-primary" />
          <div>
            <h3 className="text-2xl font-bold">이동평균</h3>
            <p className="text-sm text-muted-foreground">단순/지수 이동평균</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {/* SMA */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">SMA 20</p>
              <p className="text-xl font-semibold text-foreground">
                {data.sma?.sma20 ? `$${formatNumber(data.sma.sma20)}` : 'N/A'}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">SMA 50</p>
              <p className="text-xl font-semibold text-foreground">
                {data.sma?.sma50 ? `$${formatNumber(data.sma.sma50)}` : 'N/A'}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">SMA 200</p>
              <p className="text-xl font-semibold text-foreground">
                {data.sma?.sma200 ? `$${formatNumber(data.sma.sma200)}` : 'N/A'}
              </p>
            </div>
            {/* EMA */}
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">EMA 12</p>
              <p className="text-xl font-semibold text-foreground">
                {data.ema?.ema12 ? `$${formatNumber(data.ema.ema12)}` : 'N/A'}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">EMA 26</p>
              <p className="text-xl font-semibold text-foreground">
                {data.ema?.ema26 ? `$${formatNumber(data.ema.ema26)}` : 'N/A'}
              </p>
            </div>
          </div>
      </div>

      <div className="bg-card/50 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <Activity className="h-6 w-6 text-primary" />
          <div>
            <h3 className="text-2xl font-bold">상대강도지수 (RSI)</h3>
            <p className="text-sm text-muted-foreground">14일 RSI 모멘텀 지표</p>
          </div>
        </div>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">RSI (14일)</span>
            <span className={`text-3xl font-bold ${getRSITextColor(data.rsi?.rsi14)}`}>
              {formatNumber(data.rsi?.rsi14)}
            </span>
          </div>
          {data.rsi?.rsi14 !== null && data.rsi?.rsi14 !== undefined && (
            <div>
              <div className="w-full bg-muted/50 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${getRSIColor(data.rsi.rsi14)}`}
                  style={{ width: `${Math.min(data.rsi.rsi14, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-3">
                <span className="text-success">과매도 (&lt;30)</span>
                <span>중립 (30-70)</span>
                <span className="text-destructive">과매수 (&gt;70)</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-card/50 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="h-6 w-6 text-primary" />
          <div>
            <h3 className="text-2xl font-bold">MACD</h3>
            <p className="text-sm text-muted-foreground">이동평균 수렴확산</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">MACD 선</p>
              <p className="text-xl font-semibold text-foreground">
                {formatNumber(data.macd?.macd)}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">시그널 선</p>
              <p className="text-xl font-semibold text-foreground">
                {formatNumber(data.macd?.signal)}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">히스토그램</p>
              <p className={`text-xl font-semibold ${(data.macd?.histogram ?? 0) >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatNumber(data.macd?.histogram)}
              </p>
            </div>
          </div>
      </div>

      <div className="bg-card/50 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="h-6 w-6 text-primary" />
          <div>
            <h3 className="text-2xl font-bold">볼린저 밴드</h3>
            <p className="text-sm text-muted-foreground">변동성 및 가격 수준 지표</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">상단 밴드</p>
            <p className="text-xl font-semibold text-destructive">
              {formatNumber(data.bollinger_bands?.upper)}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">중간 밴드 (SMA 20)</p>
            <p className="text-xl font-semibold text-foreground">
              {formatNumber(data.bollinger_bands?.middle)}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">하단 밴드</p>
            <p className="text-xl font-semibold text-success">
              {formatNumber(data.bollinger_bands?.lower)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
