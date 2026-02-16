/**
 * Step 9-1: StockChart (동적 데이터 구현 + 기술적 지표 추가)
 * 주가 차트 컴포넌트 (recharts 사용)
 * 실제 ChartDataPoint[] 사용 + SMA, 볼린저밴드, 거래량 표시
 */

import { useState } from 'react';
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

// 한국 주식 여부 판별
const isKoreanStock = (ticker?: string): boolean => {
  if (!ticker) return false;
  const upperTicker = ticker.toUpperCase();
  return upperTicker.endsWith('.KS') || upperTicker.endsWith('.KQ');
};

// 통화 포맷팅 (한국 주식: 원화, 그 외: 달러)
const formatPrice = (price: number, ticker?: string): string => {
  if (isKoreanStock(ticker)) {
    // 한국 원화: 소수점 없음, 천 단위 콤마
    return `₩${price.toLocaleString('ko-KR', { maximumFractionDigits: 0 })}`;
  }
  // 미국 달러: 소수점 2자리
  return `$${price.toFixed(2)}`;
};

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

export function StockChart({ ticker, chartData, chartType: _chartType = 'area' }: StockChartProps) {
  // 각 차트별 데이터 표시 상태 관리
  const [visibleLines1, setVisibleLines1] = useState({
    price: true,
    volume: true,
  });

  const [visibleLines2, setVisibleLines2] = useState({
    price: true,
    sma20: true,
    sma50: true,
    sma200: true,
  });

  const [visibleLines3, setVisibleLines3] = useState({
    price: true,
    bb_upper: true,
    bb_middle: true,
    bb_lower: true,
    area: true, // 밴드 영역
  });

  const [visibleLines4, setVisibleLines4] = useState({
    price: true,
    volume: true,
    sma20: true,
    sma50: true,
    sma200: true,
    bb_upper: true,
    bb_middle: true,
    bb_lower: true,
    area: true, // BB 영역
  });

  // 범례 클릭 핸들러
  const handleLegendClick1 = (e: any) => {
    const dataKey = e.dataKey;
    setVisibleLines1((prev) => ({ ...prev, [dataKey]: !prev[dataKey as keyof typeof prev] }));
  };

  const handleLegendClick2 = (e: any) => {
    const dataKey = e.dataKey;
    setVisibleLines2((prev) => ({ ...prev, [dataKey]: !prev[dataKey as keyof typeof prev] }));
  };

  const handleLegendClick3 = (e: any) => {
    const dataKey = e.dataKey;
    const value = e.value; // 범례에 표시된 이름 (name 속성 값)
    
    // '밴드 영역'을 클릭했을 때만 area 토글
    if (value === '밴드 영역') {
      setVisibleLines3((prev) => ({ ...prev, area: !prev.area }));
    } else {
      setVisibleLines3((prev) => ({ ...prev, [dataKey]: !prev[dataKey as keyof typeof prev] }));
    }
  };

  const handleLegendClick4 = (e: any) => {
    const dataKey = e.dataKey;
    const value = e.value; // 범례에 표시된 이름 (name 속성 값)
    
    // 'BB 영역'을 클릭했을 때만 area 토글
    if (value === 'BB 영역') {
      setVisibleLines4((prev) => ({ ...prev, area: !prev.area }));
    } else {
      setVisibleLines4((prev) => ({ ...prev, [dataKey]: !prev[dataKey as keyof typeof prev] }));
    }
  };

  // 실제 데이터가 없으면 빈 메시지 표시
  if (!chartData || chartData.length === 0) {
    return (
      <div className="p-3 sm:p-6">
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
            <p className="text-sm font-bold text-foreground">종가: {formatPrice(data.price, ticker)}</p>
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
            <p className="text-sm font-bold text-foreground">종가: {formatPrice(data.price, ticker)}</p>
            {data.sma20 && (
              <p className="text-xs text-blue-500">SMA20: {formatPrice(data.sma20, ticker)}</p>
            )}
            {data.sma50 && (
              <p className="text-xs text-orange-500">SMA50: {formatPrice(data.sma50, ticker)}</p>
            )}
            {data.sma200 && (
              <p className="text-xs text-red-500">SMA200: {formatPrice(data.sma200, ticker)}</p>
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
            <p className="text-sm font-bold text-foreground">종가: {formatPrice(data.price, ticker)}</p>
            {data.bb_upper && (
              <>
                <p className="text-xs text-purple-500">상단: {formatPrice(data.bb_upper, ticker)}</p>
                <p className="text-xs text-gray-500">중간: {data.bb_middle ? formatPrice(data.bb_middle, ticker) : '-'}</p>
                <p className="text-xs text-purple-500">하단: {data.bb_lower ? formatPrice(data.bb_lower, ticker) : '-'}</p>
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
            <p className="text-sm font-bold text-foreground">종가: {formatPrice(data.price, ticker)}</p>
            {data.sma20 && (
              <p className="text-xs text-blue-500">SMA20: {formatPrice(data.sma20, ticker)}</p>
            )}
            {data.sma50 && (
              <p className="text-xs text-orange-500">SMA50: {formatPrice(data.sma50, ticker)}</p>
            )}
            {data.sma200 && (
              <p className="text-xs text-red-500">SMA200: {formatPrice(data.sma200, ticker)}</p>
            )}
            {data.bb_upper && (
              <p className="text-xs text-purple-500">
                BB: {data.bb_lower ? formatPrice(data.bb_lower, ticker) : '-'} - {formatPrice(data.bb_upper, ticker)}
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <div>
            <p className="text-xs text-muted-foreground">종목</p>
            <p className="text-sm font-semibold text-foreground">{ticker}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">시작가</p>
            <p className="text-sm font-semibold text-foreground">{formatPrice(data[0].price, ticker)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">현재가</p>
            <p className="text-sm font-semibold text-foreground">
              {formatPrice(data[data.length - 1].price, ticker)}
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
              <Legend 
                wrapperStyle={{ fontSize: '11px', cursor: 'pointer' }} 
                iconSize={12} 
                onClick={handleLegendClick1}
              />
              <Bar
                yAxisId="volume"
                dataKey="volume"
                fill="#14B8A6"
                opacity={0.5}
                name="거래량"
                hide={!visibleLines1.volume}
              />
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="price"
                stroke="#06B6D4"
                strokeWidth={2.5}
                dot={false}
                name="종가"
                hide={!visibleLines1.price}
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
              <Legend 
                wrapperStyle={{ fontSize: '11px', cursor: 'pointer' }} 
                iconSize={12} 
                onClick={handleLegendClick2}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#10B981"
                strokeWidth={2}
                dot={false}
                name="종가"
                hide={!visibleLines2.price}
              />
              <Line
                type="monotone"
                dataKey="sma20"
                stroke="#3b82f6"
                strokeWidth={1.5}
                dot={false}
                name="SMA20"
                hide={!visibleLines2.sma20}
              />
              <Line
                type="monotone"
                dataKey="sma50"
                stroke="#f97316"
                strokeWidth={1.5}
                dot={false}
                name="SMA50"
                hide={!visibleLines2.sma50}
              />
              <Line
                type="monotone"
                dataKey="sma200"
                stroke="#ef4444"
                strokeWidth={1.5}
                dot={false}
                name="SMA200"
                hide={!visibleLines2.sma200}
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
              <Legend 
                wrapperStyle={{ fontSize: '11px', cursor: 'pointer' }} 
                iconSize={12} 
                onClick={handleLegendClick3}
              />
              <Area
                type="monotone"
                dataKey="bb_upper"
                stroke="none"
                fill="url(#bbArea)"
                name="밴드 영역"
                hide={!visibleLines3.area}
              />
              <Area
                type="monotone"
                dataKey="bb_lower"
                stroke="none"
                fill="url(#bbArea)"
                hide={!visibleLines3.area}
                legendType="none"
              />
              <Line
                type="monotone"
                dataKey="bb_upper"
                stroke="#a855f7"
                strokeWidth={1.5}
                dot={false}
                name="상단"
                hide={!visibleLines3.bb_upper}
              />
              <Line
                type="monotone"
                dataKey="bb_middle"
                stroke="#94a3b8"
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
                name="중간"
                hide={!visibleLines3.bb_middle}
              />
              <Line
                type="monotone"
                dataKey="bb_lower"
                stroke="#a855f7"
                strokeWidth={1.5}
                dot={false}
                name="하단"
                hide={!visibleLines3.bb_lower}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#F59E0B"
                strokeWidth={2.5}
                dot={false}
                name="종가"
                hide={!visibleLines3.price}
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
              <Legend 
                wrapperStyle={{ fontSize: '10px', cursor: 'pointer' }} 
                iconSize={10} 
                onClick={handleLegendClick4}
              />

              {/* 거래량 */}
              <Bar
                yAxisId="volume"
                dataKey="volume"
                fill="#14B8A6"
                opacity={0.2}
                name="거래량"
                hide={!visibleLines4.volume}
              />

              {/* 볼린저밴드 영역 */}
              <Area
                yAxisId="price"
                type="monotone"
                dataKey="bb_upper"
                stroke="none"
                fill="url(#bbAreaComprehensive)"
                name="BB 영역"
                hide={!visibleLines4.area}
              />
              <Area
                yAxisId="price"
                type="monotone"
                dataKey="bb_lower"
                stroke="none"
                fill="url(#bbAreaComprehensive)"
                hide={!visibleLines4.area}
                legendType="none"
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
                hide={!visibleLines4.bb_upper}
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
                hide={!visibleLines4.bb_middle}
              />
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="bb_lower"
                stroke="#a855f7"
                strokeWidth={1}
                dot={false}
                name="BB 하단"
                hide={!visibleLines4.bb_lower}
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
                hide={!visibleLines4.sma20}
              />
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="sma50"
                stroke="#f97316"
                strokeWidth={1}
                dot={false}
                name="SMA50"
                hide={!visibleLines4.sma50}
              />
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="sma200"
                stroke="#ef4444"
                strokeWidth={1}
                dot={false}
                name="SMA200"
                hide={!visibleLines4.sma200}
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
                hide={!visibleLines4.price}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
