/**
 * Step 6-7: MetricCard (리팩토링)
 * 개별 지표 카드 컴포넌트 (재사용 가능)
 * GaugeBar 컴포넌트 사용
 */

import { HelpCircle } from 'lucide-react';
import { GaugeBar } from './GaugeBar';

interface MetricCardProps {
  name: string;
  value: string | number;
  gaugePercent: number;
  description: string;
  category: string;
  colorType: 'primary' | 'success' | 'warning';
  tooltip?: string;
}

const colorClasses = {
  primary: {
    bg: 'bg-primary',
    text: 'text-primary',
    badge: 'text-primary',
  },
  success: {
    bg: 'bg-success',
    text: 'text-success',
    badge: 'text-success',
  },
  warning: {
    bg: 'bg-warning',
    text: 'text-warning',
    badge: 'text-warning',
  },
};

export function MetricCard({
  name,
  value,
  gaugePercent,
  description,
  category: _category, // 향후 기능 구현을 위해 유지
  colorType,
  tooltip,
}: MetricCardProps) {
  const colors = colorClasses[colorType];

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-2 hover:shadow-lg transition-shadow">
      {/* 지표명 + 툴팁 아이콘 */}
      <div className="flex items-center gap-1.5">
        <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {name}
        </h3>
        {tooltip && (
          <div className="relative group">
            <HelpCircle className="h-3 w-3 text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-help" />
            {/* 툴팁 */}
            <div className="absolute left-0 top-full mt-1 w-48 p-2 bg-popover border border-border rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
              <p className="text-xs text-popover-foreground leading-relaxed">{tooltip}</p>
            </div>
          </div>
        )}
      </div>

      {/* 지표값 */}
      <div className={`text-2xl font-bold ${colors.text}`}>{value}</div>

      {/* 게이지 바 */}
      <GaugeBar percent={gaugePercent} colorType={colorType} height="md" />

      {/* 설명 */}
      <p className="text-[10px] text-muted-foreground">{description}</p>
    </div>
  );
}
