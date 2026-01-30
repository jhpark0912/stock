// frontend/src/components/DataCharts.tsx
import { AreaChart, Area, BarChart, Bar, LineChart, Line, ComposedChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { ChartDataPoint } from '@/types/stock';
import { useMemo } from 'react';

interface DataChartsProps {
  chartData: ChartDataPoint[];
  ticker: string;
}

// --- Reusable Components & Helpers ---

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-2 text-xs bg-background/90 border rounded-lg shadow-lg">
        <p className="font-bold">{label}</p>
        <div className="mt-1 space-y-0.5">
          {payload.map((p: any) => (
            <p key={p.name} style={{ color: p.color }}>
              {`${p.name}: ${p.value?.toFixed(2) ?? 'N/A'}`}
            </p>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const numberFormatter = (number: number) => {
  if (number > 1000000000) return `${(number / 1000000000).toFixed(1)}B`;
  if (number > 1000000) return `${(number / 1000000).toFixed(1)}M`;
  if (number > 1000) return `${(number / 1000).toFixed(1)}K`;
  return number.toString();
};


// --- Chart Components ---

const PriceVolumeChart = ({ data }: { data: ChartDataPoint[] }) => {
    const yAxisDomain = useMemo(() => {
        if (!data || data.length === 0) return [0, 100];
        const prices = data.map(d => d.close).filter(p => p !== null) as number[];
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const padding = (max - min) * 0.1;
        return [min - padding, max + padding];
    }, [data]);

    return (
        <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted) / 0.5)" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" domain={yAxisDomain} orientation="left" stroke="#8884d8" tick={{ fontSize: 12 }} tickFormatter={(val) => `$${val.toFixed(0)}`} />
                <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" tick={{ fontSize: 12 }} tickFormatter={numberFormatter} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconSize={10} wrapperStyle={{fontSize: "12px"}}/>

                {/* Price & Bollinger Bands */}
                <Line type="monotone" dataKey="close" name="종가" stroke="#8884d8" strokeWidth={2} dot={false} yAxisId="left" />
                <Line dataKey="bb_upper" name="볼린저 상단" stroke="#ff7300" strokeDasharray="3 3" dot={false} yAxisId="left" />
                <Line dataKey="bb_lower" name="볼린저 하단" stroke="#387908" strokeDasharray="3 3" dot={false} yAxisId="left" />
                
                {/* SMAs */}
                <Line type="monotone" dataKey="sma20" name="SMA 20" stroke="#82ca9d" dot={false} yAxisId="left" />
                <Line type="monotone" dataKey="sma50" name="SMA 50" stroke="#e5a72c" dot={false} yAxisId="left" />
                <Line type="monotone" dataKey="sma200" name="SMA 200" stroke="#e52c2c" dot={false} yAxisId="left" />
                
                {/* Volume */}
                <Bar yAxisId="right" dataKey="volume" name="거래량" fill="hsl(var(--muted))" barSize={10} />
            </ComposedChart>
        </ResponsiveContainer>
    );
};

const RsiChart = ({ data }: { data: ChartDataPoint[] }) => (
    <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted) / 0.5)" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconSize={10} wrapperStyle={{fontSize: "12px"}}/>
            <Area type="monotone" dataKey="rsi" name="RSI" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
            <Line type="monotone" dataKey={() => 70} stroke="#ff7300" strokeDasharray="5 5" dot={false} />
            <Line type="monotone" dataKey={() => 30} stroke="#387908" strokeDasharray="5 5" dot={false} />
        </AreaChart>
    </ResponsiveContainer>
);

const MacdChart = ({ data }: { data: ChartDataPoint[] }) => (
    <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted) / 0.5)" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconSize={10} wrapperStyle={{fontSize: "12px"}}/>
            <Bar dataKey="macd_hist" name="히스토그램" barSize={5}>
                {data.map((entry, index) => (
                    <Bar key={`cell-${index}`} fill={entry.macd_hist && entry.macd_hist > 0 ? '#82ca9d' : '#ef5350'} />
                ))}
            </Bar>
            <Line type="monotone" dataKey="macd" name="MACD" stroke="#8884d8" dot={false} />
            <Line type="monotone" dataKey="macd_signal" name="시그널" stroke="#ff7300" dot={false} />
        </ComposedChart>
    </ResponsiveContainer>
);

export default function DataCharts({ chartData, ticker }: DataChartsProps) {
  if (!chartData || chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>차트 데이터</CardTitle>
        </CardHeader>
        <CardContent>
          <p>차트 데이터를 불러오고 있습니다...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
        {/* 주가 차트 - 상단 전체 너비 */}
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base">{ticker} 주가 차트</CardTitle>
                <CardDescription className="text-xs">주가, 이동평균선, 볼린저밴드 및 거래량</CardDescription>
            </CardHeader>
            <CardContent>
                <PriceVolumeChart data={chartData} />
            </CardContent>
        </Card>

        {/* RSI & MACD - 2열 그리드 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">RSI (상대강도지수)</CardTitle>
                    <CardDescription className="text-xs">과매수(70 이상) / 과매도(30 이하) 구간</CardDescription>
                </CardHeader>
                <CardContent>
                    <RsiChart data={chartData} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base">MACD (이동평균 수렴확산)</CardTitle>
                    <CardDescription className="text-xs">단기 및 장기 추세의 관계</CardDescription>
                </CardHeader>
                <CardContent>
                    <MacdChart data={chartData} />
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
