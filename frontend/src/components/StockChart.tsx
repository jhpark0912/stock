/**
 * Step 9-1: StockChart (동적 데이터 구현 + 기술적 지표 추가)
 * 주가 차트 컴포넌트 (recharts 사용)
 * 실제 ChartDataPoint[] 사용 + SMA, 볼린저밴드, 거래량 표시
 */

import {
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
} from 'recharts';
import type { ChartDataPoint } from '../types/stock';

interface StockChartProps {
  ticker?: string;
  chartData?: ChartDataPoint[] | null;
  chartType?: 'line' | 'area';
}

// 차트 데이터 변환 (모든 필드 포함)
const formatChartData = (data: ChartDataPoint[]) => {
  return data.map((point) => ({
    date: new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    price: point.close || 0,
    volume: point.volume || 0,
    sma20: point.sma20,
    sma50: point.sma50,
    sma200: point.sma200,
    bb_upper: point.bb_upper,
    bb_middle: point.bb_middle,
    bb_lower: point.bb_lower,
  }));
};

export function StockChart({ ticker, chartData, chartType = 'area' }: StockChartProps) {
  // 실제 데이터가 없으면 빈 메시지 표시
  if (!chartData || chartData.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-card border border-border rounded-lg p-6 text-center">
          <p className="text-sm text-muted-foreground">차트 데이터가 없습니다.</p>
        </div>
      </div>
    );
  }

  const data = formatChartData(chartData);

  // 커스텀 툴팁 - 주가용
  const PriceTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-xs text-muted-foreground mb-2">{data.date}</p>
          <div className="space-y-1">
            <p className="text-sm font-bold text-foreground">종가: ${data.price.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">
              거래량: {(data.volume / 1000000).toFixed(2)}M
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // 커스텀 툴팁 - 이동평균선용
  const SMATooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-xs text-muted-foreground mb-2">{data.date}</p>
          <div className="space-y-1">
            <p className="text-sm font-bold text-foreground">종가: ${data.price.toFixed(2)}</p>
            {data.sma20 && (
              <p className="text-xs text-blue-500">SMA20: ${data.sma20.toFixed(2)}</p>
            )}
            {data.sma50 && (
              <p className="text-xs text-orange-500">SMA50: ${data.sma50.toFixed(2)}</p>
            )}
            {data.sma200 && (
              <p className="text-xs text-red-500">SMA200: ${data.sma200.toFixed(2)}</p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // 커스텀 툴팁 - 볼린저밴드용
  const BBTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-xs text-muted-foreground mb-2">{data.date}</p>
          <div className="space-y-1">
            <p className="text-sm font-bold text-foreground">종가: ${data.price.toFixed(2)}</p>
            {data.bb_upper && (
              <>
                <p className="text-xs text-purple-500">상단: ${data.bb_upper.toFixed(2)}</p>
                <p className="text-xs text-gray-500">중간: ${data.bb_middle?.toFixed(2)}</p>
                <p className="text-xs text-purple-500">하단: ${data.bb_lower?.toFixed(2)}</p>
              </>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // 커스텀 툴팁 - 종합 차트용
  const ComprehensiveTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="text-xs text-muted-foreground mb-2">{data.date}</p>
          <div className="space-y-1">
            <p className="text-sm font-bold text-foreground">종가: ${data.price.toFixed(2)}</p>
            {data.sma20 && (
              <p className="text-xs text-blue-500">SMA20: ${data.sma20.toFixed(2)}</p>
            )}
            {data.sma50 && (
              <p className="text-xs text-orange-500">SMA50: ${data.sma50.toFixed(2)}</p>
            )}
            {data.sma200 && (
              <p className="text-xs text-red-500">SMA200: ${data.sma200.toFixed(2)}</p>
            )}
            {data.bb_upper && (
              <p className="text-xs text-purple-500">
                BB: ${data.bb_lower?.toFixed(2)} - ${data.bb_upper.toFixed(2)}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              거래량: {(data.volume / 1000000).toFixed(2)}M
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-4 space-y-3">
      {/* 차트 정보 요약 */}
      <div className="bg-card border border-border rounded-lg p-3">
        <div className="grid grid-cols-4 gap-3">
          <div>
            <p className="text-xs text-muted-foreground">종목</p>
            <p className="text-sm font-semibold text-foreground">{ticker}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">시작가</p>
            <p className="text-sm font-semibold text-foreground">${data[0].price.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">현재가</p>
            <p className="text-sm font-semibold text-foreground">
              ${data[data.length - 1].price.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">변동률</p>
            <p
              className={`text-sm font-semibold ${
                data[data.length - 1].price >= data[0].price
                  ? 'text-success'
                  : 'text-destructive'
              }`}
            >
              {(
                ((data[data.length - 1].price - data[0].price) / data[0].price) *
                100
              ).toFixed(2)}
              %
            </p>
          </div>
        </div>
      </div>

      {/* 2x2 차트 그리드 */}
      <div className="grid grid-cols-2 gap-3">
        {/* 1. 주가 + 거래량 차트 */}
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="mb-2">
            <h3 className="text-sm font-semibold text-foreground">📈 주가 추이</h3>
            <p className="text-xs text-muted-foreground mt-0.5">종가 + 거래량</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '10px' }}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                interval="preserveStartEnd"
              />
              <YAxis
                yAxisId="price"
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '10px' }}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                yAxisId="volume"
                orientation="right"
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '10px' }}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
              />
              <Tooltip content={<PriceTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px' }} iconSize={12} />
              <Bar
                yAxisId="volume"
                dataKey="volume"
                fill="#14B8A6"
                opacity={0.5}
                name="거래량"
              />
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="price"
                stroke="#06B6D4"
                strokeWidth={2.5}
                dot={false}
                name="종가"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* 2. 이동평균선 차트 */}
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="mb-2">
            <h3 className="text-sm font-semibold text-foreground">📊 이동평균선</h3>
            <p className="text-xs text-muted-foreground mt-0.5">SMA 20/50/200일</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '10px' }}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '10px' }}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip content={<SMATooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px' }} iconSize={12} />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
                name="종가"
              />
              <Line
                type="monotone"
                dataKey="sma20"
                stroke="#3b82f6"
                strokeWidth={1.5}
                dot={false}
                name="SMA20"
              />
              <Line
                type="monotone"
                dataKey="sma50"
                stroke="#f97316"
                strokeWidth={1.5}
                dot={false}
                name="SMA50"
              />
              <Line
                type="monotone"
                dataKey="sma200"
                stroke="#ef4444"
                strokeWidth={1.5}
                dot={false}
                name="SMA200"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* 3. 볼린저밴드 차트 */}
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="mb-2">
            <h3 className="text-sm font-semibold text-foreground">📉 볼린저밴드</h3>
            <p className="text-xs text-muted-foreground mt-0.5">변동성 분석</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={data}>
              <defs>
                <linearGradient id="bbArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '10px' }}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '10px' }}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip content={<BBTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px' }} iconSize={12} />
              <Area
                type="monotone"
                dataKey="bb_upper"
                stroke="none"
                fill="url(#bbArea)"
                name="밴드 영역"
              />
              <Area
                type="monotone"
                dataKey="bb_lower"
                stroke="none"
                fill="url(#bbArea)"
              />
              <Line
                type="monotone"
                dataKey="bb_upper"
                stroke="#a855f7"
                strokeWidth={1.5}
                dot={false}
                name="상단"
              />
              <Line
                type="monotone"
                dataKey="bb_middle"
                stroke="#94a3b8"
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
                name="중간"
              />
              <Line
                type="monotone"
                dataKey="bb_lower"
                stroke="#a855f7"
                strokeWidth={1.5}
                dot={false}
                name="하단"
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#F59E0B"
                strokeWidth={2.5}
                dot={false}
                name="종가"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* 4. 종합 차트 (모든 지표) */}
        <div className="bg-card border border-border rounded-lg p-3">
          <div className="mb-2">
            <h3 className="text-sm font-semibold text-foreground">📊 종합 분석</h3>
            <p className="text-xs text-muted-foreground mt-0.5">모든 지표 통합 보기</p>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={data}>
              <defs>
                <linearGradient id="bbAreaComprehensive" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="date"
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '10px' }}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                interval="preserveStartEnd"
              />
              <YAxis
                yAxisId="price"
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '10px' }}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis
                yAxisId="volume"
                orientation="right"
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: '10px' }}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`}
              />
              <Tooltip content={<ComprehensiveTooltip />} />
              <Legend wrapperStyle={{ fontSize: '10px' }} iconSize={10} />

              {/* 거래량 */}
              <Bar
                yAxisId="volume"
                dataKey="volume"
                fill="#14B8A6"
                opacity={0.2}
                name="거래량"
              />

              {/* 볼린저밴드 영역 */}
              <Area
                yAxisId="price"
                type="monotone"
                dataKey="bb_upper"
                stroke="none"
                fill="url(#bbAreaComprehensive)"
                name="BB 영역"
              />
              <Area
                yAxisId="price"
                type="monotone"
                dataKey="bb_lower"
                stroke="none"
                fill="url(#bbAreaComprehensive)"
              />

              {/* 볼린저밴드 선 */}
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="bb_upper"
                stroke="#a855f7"
                strokeWidth={1}
                dot={false}
                name="BB 상단"
              />
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="bb_middle"
                stroke="#94a3b8"
                strokeWidth={0.5}
                strokeDasharray="2 2"
                dot={false}
                name="BB 중간"
              />
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="bb_lower"
                stroke="#a855f7"
                strokeWidth={1}
                dot={false}
                name="BB 하단"
              />

              {/* 이동평균선 */}
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="sma20"
                stroke="#3b82f6"
                strokeWidth={1}
                dot={false}
                name="SMA20"
              />
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="sma50"
                stroke="#f97316"
                strokeWidth={1}
                dot={false}
                name="SMA50"
              />
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="sma200"
                stroke="#ef4444"
                strokeWidth={1}
                dot={false}
                name="SMA200"
              />

              {/* 종가 (메인) */}
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="price"
                stroke="#06B6D4"
                strokeWidth={2}
                dot={false}
                name="종가"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
