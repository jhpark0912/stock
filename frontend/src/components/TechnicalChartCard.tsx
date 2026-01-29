import { TrendingUp, Activity, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { TechnicalIndicators } from '@/types/stock';

// --- Helper Functions ---
const formatNumber = (value: number | null | undefined, decimals = 2): string => {
  if (value === null || value === undefined) return 'N/A';
  return value.toFixed(decimals);
};

// --- Child Components for each Indicator ---

const MovingAveragesIndicator = ({ data }: { data: { sma: TechnicalIndicators['sma'], ema: TechnicalIndicators['ema'] } }) => (
  <div className="p-4 border rounded-lg h-full bg-background">
    <h4 className="text-sm font-semibold flex items-center gap-1.5">
      <TrendingUp className="h-4 w-4 text-muted-foreground" />
      이동평균
    </h4>
    <p className="text-xs text-muted-foreground mb-3">단순/지수 이동평균</p>
    <div className="grid grid-cols-3 gap-x-2 gap-y-3">
      {[
        { label: 'SMA 20', value: data.sma?.sma20 },
        { label: 'SMA 50', value: data.sma?.sma50 },
        { label: 'SMA 200', value: data.sma?.sma200 },
        { label: 'EMA 12', value: data.ema?.ema12 },
        { label: 'EMA 26', value: data.ema?.ema26 },
      ].map(item => (
        <div className="space-y-0.5" key={item.label}>
          <p className="text-xs text-muted-foreground">{item.label}</p>
          <p className="text-sm font-semibold">{item.value ? `$${formatNumber(item.value)}` : 'N/A'}</p>
        </div>
      ))}
    </div>
  </div>
);

const RsiIndicator = ({ rsi }: { rsi: TechnicalIndicators['rsi'] }) => {
  const rsiValue = rsi?.rsi14;
  const getRSIColor = (val: number) => {
    if (val < 30) return 'bg-green-500/80';
    if (val > 70) return 'bg-red-500/80';
    return 'bg-blue-500/80';
  };

  return (
    <div className="p-4 border rounded-lg h-full bg-background">
      <h4 className="text-sm font-semibold flex items-center gap-1.5">
        <Activity className="h-4 w-4 text-muted-foreground" />
        상대강도지수 (RSI)
      </h4>
      <p className="text-xs text-muted-foreground mb-3">14일 RSI 모멘텀 지표</p>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-muted-foreground">RSI (14일)</span>
        <span className="text-xl font-bold">{formatNumber(rsiValue)}</span>
      </div>
      {rsiValue !== null && rsiValue !== undefined && (
        <div>
          <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all ${getRSIColor(rsiValue)}`}
              style={{ width: `${Math.min(rsiValue, 100)}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mt-1.5">
            <span className="text-green-600">과매도</span>
            <span>중립</span>
            <span className="text-red-600">과매수</span>
          </div>
        </div>
      )}
    </div>
  );
};

const MacdIndicator = ({ macd }: { macd: TechnicalIndicators['macd'] }) => (
  <div className="p-4 border rounded-lg h-full bg-background">
    <h4 className="text-sm font-semibold flex items-center gap-1.5">
      <BarChart3 className="h-4 w-4 text-muted-foreground" />
      MACD
    </h4>
    <p className="text-xs text-muted-foreground mb-3">이동평균 수렴확산</p>
    <div className="grid grid-cols-3 gap-2">
      <div>
        <p className="text-xs text-muted-foreground">MACD 선</p>
        <p className="text-sm font-semibold">{formatNumber(macd?.macd)}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">시그널 선</p>
        <p className="text-sm font-semibold">{formatNumber(macd?.signal)}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">히스토그램</p>
        <p className={`text-sm font-semibold ${(macd?.histogram ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {formatNumber(macd?.histogram)}
        </p>
      </div>
    </div>
  </div>
);

const BollingerBandsIndicator = ({ bands }: { bands: TechnicalIndicators['bollinger_bands'] }) => (
  <div className="p-4 border rounded-lg h-full bg-background">
    <h4 className="text-sm font-semibold flex items-center gap-1.5">
      <Activity className="h-4 w-4 text-muted-foreground" />
      볼린저 밴드
    </h4>
    <p className="text-xs text-muted-foreground mb-3">변동성 및 가격 수준 지표</p>
    <div className="grid grid-cols-3 gap-2">
      <div>
        <p className="text-xs text-muted-foreground">상단 밴드</p>
        <p className="text-sm font-semibold text-red-600">{formatNumber(bands?.upper)}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">중간 밴드</p>
        <p className="text-sm font-semibold">{formatNumber(bands?.middle)}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">하단 밴드</p>
        <p className="text-sm font-semibold text-green-600">{formatNumber(bands?.lower)}</p>
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            기술적 분석
          </CardTitle>
          <CardDescription>기술적 지표 로딩 중...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48 bg-muted/50 rounded-lg flex items-center justify-center border">
            <div className="text-center space-y-2">
              <Activity className="h-10 w-10 text-muted-foreground mx-auto animate-pulse" />
              <p className="text-sm text-muted-foreground">데이터 로딩 중...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Compact Layout (2x2 Grid)
  if (compact) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            기술적 분석
          </CardTitle>
          <CardDescription>주요 기술적 지표 요약</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <MovingAveragesIndicator data={{ sma: data.sma, ema: data.ema }} />
            <RsiIndicator rsi={data.rsi} />
            <MacdIndicator macd={data.macd} />
            <BollingerBandsIndicator bands={data.bollinger_bands} />
          </div>
        </CardContent>
      </Card>
    );
  }

  // --- Original Layout (Individual Cards) ---
  
  // RSI-specific helpers for original layout
  const getRSIColor = (rsi: number | null | undefined) => {
    if (rsi === null || rsi === undefined) return 'bg-muted';
    if (rsi < 30) return 'bg-green-500';
    if (rsi > 70) return 'bg-red-500';
    return 'bg-primary';
  };

  const getRSITextColor = (rsi: number | null | undefined) => {
    if (rsi === null || rsi === undefined) return 'text-muted-foreground';
    if (rsi < 30) return 'text-green-500';
    if (rsi > 70) return 'text-red-500';
    return 'text-primary';
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            이동평균
          </CardTitle>
          <CardDescription>단순/지수 이동평균</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* SMA */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">SMA 20</p>
              <p className="text-lg font-semibold text-foreground">
                {data.sma?.sma20 ? `$${formatNumber(data.sma.sma20)}` : 'N/A'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">SMA 50</p>
              <p className="text-lg font-semibold text-foreground">
                {data.sma?.sma50 ? `$${formatNumber(data.sma.sma50)}` : 'N/A'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">SMA 200</p>
              <p className="text-lg font-semibold text-foreground">
                {data.sma?.sma200 ? `$${formatNumber(data.sma.sma200)}` : 'N/A'}
              </p>
            </div>
            {/* EMA */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">EMA 12</p>
              <p className="text-lg font-semibold text-foreground">
                {data.ema?.ema12 ? `$${formatNumber(data.ema.ema12)}` : 'N/A'}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">EMA 26</p>
              <p className="text-lg font-semibold text-foreground">
                {data.ema?.ema26 ? `$${formatNumber(data.ema.ema26)}` : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            상대강도지수 (RSI)
          </CardTitle>
          <CardDescription>14일 RSI 모멘텀 지표</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">RSI (14일)</span>
            <span className={`text-2xl font-bold ${getRSITextColor(data.rsi?.rsi14)}`}>
              {formatNumber(data.rsi?.rsi14)}
            </span>
          </div>
          {data.rsi?.rsi14 !== null && data.rsi?.rsi14 !== undefined && (
            <div>
              <div className="w-full bg-muted rounded-full h-4 overflow-hidden">
                <div
                  className={`h-4 rounded-full transition-all ${getRSIColor(data.rsi.rsi14)}`}
                  style={{ width: `${Math.min(data.rsi.rsi14, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span className="text-green-500">과매도 (&lt;30)</span>
                <span>중립 (30-70)</span>
                <span className="text-red-500">과매수 (&gt;70)</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            MACD
          </CardTitle>
          <CardDescription>이동평균 수렴확산</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">MACD 선</p>
              <p className="text-lg font-semibold text-foreground">
                {formatNumber(data.macd?.macd)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">시그널 선</p>
              <p className="text-lg font-semibold text-foreground">
                {formatNumber(data.macd?.signal)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">히스토그램</p>
              <p className={`text-lg font-semibold ${(data.macd?.histogram ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatNumber(data.macd?.histogram)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            볼린저 밴드
          </CardTitle>
          <CardDescription>변동성 및 가격 수준 지표</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">상단 밴드</p>
              <p className="text-lg font-semibold text-red-500">
                {formatNumber(data.bollinger_bands?.upper)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">중간 밴드 (SMA 20)</p>
              <p className="text-lg font-semibold text-foreground">
                {formatNumber(data.bollinger_bands?.middle)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">하단 밴드</p>
              <p className="text-lg font-semibold text-green-500">
                {formatNumber(data.bollinger_bands?.lower)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
