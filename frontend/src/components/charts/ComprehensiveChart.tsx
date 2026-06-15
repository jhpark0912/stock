/**
 * 종합 분석 차트 (모든 기술적 지표 통합)
 */

import { useState } from 'react';
import {
  ComposedChart,
  Line,
  Bar,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatPrice, AXIS_STYLE, type FormattedChartData } from './chartUtils';

interface ComprehensiveChartProps {
  data: FormattedChartData[];
  ticker?: string;
}

export function ComprehensiveChart({ data, ticker }: ComprehensiveChartProps) {
  const [visible, setVisible] = useState({
    price: true,
    volume: true,
    sma20: true,
    sma50: true,
    sma200: true,
    bb_upper: true,
    bb_middle: true,
    bb_lower: true,
    area: true,
  });

  const handleLegendClick = (e: any) => {
    if (e.value === 'BB 영역') {
      setVisible((prev) => ({ ...prev, area: !prev.area }));
    } else {
      const key = e.dataKey as keyof typeof visible;
      setVisible((prev) => ({ ...prev, [key]: !prev[key] }));
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-xs text-muted-foreground mb-2">{d.date}</p>
        <p className="text-sm font-bold text-foreground">종가: {formatPrice(d.price, ticker)}</p>
        {d.sma20 && <p className="text-xs text-blue-500">SMA20: {formatPrice(d.sma20, ticker)}</p>}
        {d.sma50 && (
          <p className="text-xs text-orange-500">SMA50: {formatPrice(d.sma50, ticker)}</p>
        )}
        {d.sma200 && (
          <p className="text-xs text-red-500">SMA200: {formatPrice(d.sma200, ticker)}</p>
        )}
        {d.bb_upper && (
          <p className="text-xs text-purple-500">
            BB: {d.bb_lower ? formatPrice(d.bb_lower, ticker) : '-'} -{' '}
            {formatPrice(d.bb_upper, ticker)}
          </p>
        )}
        <p className="text-xs text-muted-foreground">거래량: {(d.volume / 1000000).toFixed(2)}M</p>
      </div>
    );
  };

  return (
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
          <XAxis dataKey="date" {...AXIS_STYLE} interval="preserveStartEnd" />
          <YAxis yAxisId="price" {...AXIS_STYLE} />
          <YAxis
            yAxisId="volume"
            orientation="right"
            {...AXIS_STYLE}
            tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '10px', cursor: 'pointer' }}
            iconSize={10}
            onClick={handleLegendClick}
          />

          {/* 거래량 */}
          <Bar
            yAxisId="volume"
            dataKey="volume"
            fill="#14B8A6"
            opacity={0.2}
            name="거래량"
            hide={!visible.volume}
          />

          {/* 볼린저밴드 영역 */}
          <Area
            yAxisId="price"
            type="monotone"
            dataKey="bb_upper"
            stroke="none"
            fill="url(#bbAreaComprehensive)"
            name="BB 영역"
            hide={!visible.area}
          />
          <Area
            yAxisId="price"
            type="monotone"
            dataKey="bb_lower"
            stroke="none"
            fill="url(#bbAreaComprehensive)"
            hide={!visible.area}
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
            hide={!visible.bb_upper}
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
            hide={!visible.bb_middle}
          />
          <Line
            yAxisId="price"
            type="monotone"
            dataKey="bb_lower"
            stroke="#a855f7"
            strokeWidth={1}
            dot={false}
            name="BB 하단"
            hide={!visible.bb_lower}
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
            hide={!visible.sma20}
          />
          <Line
            yAxisId="price"
            type="monotone"
            dataKey="sma50"
            stroke="#f97316"
            strokeWidth={1}
            dot={false}
            name="SMA50"
            hide={!visible.sma50}
          />
          <Line
            yAxisId="price"
            type="monotone"
            dataKey="sma200"
            stroke="#ef4444"
            strokeWidth={1}
            dot={false}
            name="SMA200"
            hide={!visible.sma200}
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
            hide={!visible.price}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
