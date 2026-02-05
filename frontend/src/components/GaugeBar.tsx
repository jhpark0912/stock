/**
 * Step 7: GaugeBar
 * 애니메이션 프로그레스 바 컴포넌트 (재사용 가능)
 */

interface GaugeBarProps {
  percent: number; // 0-100
  colorType: 'primary' | 'success' | 'warning' | 'destructive';
  height?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

const colorClasses = {
  primary: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
};

const heightClasses = {
  sm: 'h-1',
  md: 'h-1.5',
  lg: 'h-2',
};

export function GaugeBar({
  percent,
  colorType,
  height = 'md',
  animated = true,
}: GaugeBarProps) {
  // percent를 0-100 범위로 제한
  const clampedPercent = Math.min(Math.max(percent, 0), 100);

  return (
    <div className={`w-full ${heightClasses[height]} bg-muted rounded-full overflow-hidden`}>
      <div
        className={`h-full ${colorClasses[colorType]} rounded-full ${
          animated ? 'transition-all duration-500' : ''
        }`}
        style={{ width: `${clampedPercent}%` }}
      ></div>
    </div>
  );
}
