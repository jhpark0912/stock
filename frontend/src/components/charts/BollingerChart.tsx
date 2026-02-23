/**
 * 볼린저밴드 차트
 */

import { useState } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { formatPrice, AXIS_STYLE, type FormattedChartData } from './chartUtils';

interface BollingerChartProps {
  data: FormattedChartData[];
  ticker?: string;
}

export function BollingerChart({ data, ticker }: BollingerChartProps) {
  const [visible, setVisible] = useState({
    price: true,
    bb_upper: true,
    bb_middle: true,
    bb_lower: true,
    area: true,
  });

  const handleLegendClick = (e: any) => {
    if (e.value === '밴드 영역') {
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
        {d.bb_upper && (
          <>
            <p className="text-xs text-purple-500">상단: {formatPrice(d.bb_upper, ticker)}</p>
            <p className="text-xs text-gray-500">
              중간: {d.bb_middle ? formatPrice(d.bb_middle, ticker) : '-'}
            </p>
            <p className="text-xs text-purple-500">
              하단: {d.bb_lower ? formatPrice(d.bb_lower, ticker) : '-'}
            </p>
          </>
        )}
      </div>
    );
  };

  return (
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
          <XAxis dataKey="date" {...AXIS_STYLE} interval="preserveStartEnd" />
          <YAxis {...AXIS_STYLE} />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '11px', cursor: 'pointer' }}
            iconSize={12}
            onClick={handleLegendClick}
          />
          <Area
            type="monotone"
            dataKey="bb_upper"
            stroke="none"
            fill="url(#bbArea)"
            name="밴드 영역"
            hide={!visible.area}
          />
          <Area
            type="monotone"
            dataKey="bb_lower"
            stroke="none"
            fill="url(#bbArea)"
            hide={!visible.area}
            legendType="none"
          />
          <Line
            type="monotone"
            dataKey="bb_upper"
            stroke="#a855f7"
            strokeWidth={1.5}
            dot={false}
            name="상단"
            hide={!visible.bb_upper}
          />
          <Line
            type="monotone"
            dataKey="bb_middle"
            stroke="#94a3b8"
            strokeWidth={1}
            strokeDasharray="3 3"
            dot={false}
            name="중간"
            hide={!visible.bb_middle}
          />
          <Line
            type="monotone"
            dataKey="bb_lower"
            stroke="#a855f7"
            strokeWidth={1.5}
            dot={false}
            name="하단"
            hide={!visible.bb_lower}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#F59E0B"
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
