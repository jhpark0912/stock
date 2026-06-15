/**
 * 이동평균선 (SMA 20/50/200) 차트
 */

import { useState } from 'react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatPrice, AXIS_STYLE, type FormattedChartData } from './chartUtils';

interface SMAChartProps {
  data: FormattedChartData[];
  ticker?: string;
}

export function SMAChart({ data, ticker }: SMAChartProps) {
  const [visible, setVisible] = useState({ price: true, sma20: true, sma50: true, sma200: true });

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
        {d.sma20 && <p className="text-xs text-blue-500">SMA20: {formatPrice(d.sma20, ticker)}</p>}
        {d.sma50 && (
          <p className="text-xs text-orange-500">SMA50: {formatPrice(d.sma50, ticker)}</p>
        )}
        {d.sma200 && (
          <p className="text-xs text-red-500">SMA200: {formatPrice(d.sma200, ticker)}</p>
        )}
      </div>
    );
  };

  return (
    <div className="bg-card border border-border rounded-lg p-3">
      <div className="mb-2">
        <h3 className="text-sm font-semibold text-foreground">📊 이동평균선</h3>
        <p className="text-xs text-muted-foreground mt-0.5">SMA 20/50/200일</p>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="date" {...AXIS_STYLE} interval="preserveStartEnd" />
          <YAxis {...AXIS_STYLE} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '11px', cursor: 'pointer' }}
            iconSize={12}
            onClick={handleLegendClick}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#10B981"
            strokeWidth={2}
            dot={false}
            name="종가"
            hide={!visible.price}
          />
          <Line
            type="monotone"
            dataKey="sma20"
            stroke="#3b82f6"
            strokeWidth={1.5}
            dot={false}
            name="SMA20"
            hide={!visible.sma20}
          />
          <Line
            type="monotone"
            dataKey="sma50"
            stroke="#f97316"
            strokeWidth={1.5}
            dot={false}
            name="SMA50"
            hide={!visible.sma50}
          />
          <Line
            type="monotone"
            dataKey="sma200"
            stroke="#ef4444"
            strokeWidth={1.5}
            dot={false}
            name="SMA200"
            hide={!visible.sma200}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
