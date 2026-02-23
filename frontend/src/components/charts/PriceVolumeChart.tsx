/**
 * 주가 추이 + 거래량 차트
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
} from 'recharts';
import { formatPrice, AXIS_STYLE, type FormattedChartData } from './chartUtils';

interface PriceVolumeChartProps {
  data: FormattedChartData[];
  ticker?: string;
}

export function PriceVolumeChart({ data, ticker }: PriceVolumeChartProps) {
  const [visible, setVisible] = useState({ price: true, volume: true });

  const handleLegendClick = (e: any) => {
    const key = e.dataKey as keyof typeof visible;
    setVisible((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const d = payload[0].payload;
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-xs text-muted-foreground mb-2">{d.date}</p>
        <p className="text-sm font-bold text-foreground">종가: {formatPrice(d.price, ticker)}</p>
        <p className="text-xs text-muted-foreground">거래량: {(d.volume / 1000000).toFixed(2)}M</p>
      </div>
    );
  };

  return (
    <div className="bg-card border border-border rounded-lg p-3">
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-foreground">📈 주가 추이</h3>
        <p className="text-xs text-muted-foreground mt-0.5">종가 + 거래량</p>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data}>
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
            wrapperStyle={{ fontSize: '11px', cursor: 'pointer' }}
            iconSize={12}
            onClick={handleLegendClick}
          />
          <Bar
            yAxisId="volume"
            dataKey="volume"
            fill="#14B8A6"
            opacity={0.5}
            name="거래량"
            hide={!visible.volume}
          />
          <Line
            yAxisId="price"
            type="monotone"
            dataKey="price"
            stroke="#06B6D4"
            strokeWidth={2.5}
            dot={false}
            name="종가"
            hide={!visible.price}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
