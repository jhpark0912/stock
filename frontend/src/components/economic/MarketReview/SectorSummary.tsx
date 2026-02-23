/**
 * 섹터별 등락률 히트맵 컴포넌트
 * 기존 SectorHeatmap 스타일을 차용한 그리드 히트맵
 */

import { BarChart3 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SectorPerformanceData } from '@/types/marketReview';

interface SectorSummaryProps {
  sectors: SectorPerformanceData[];
  country: 'kr' | 'us';
}

// 변화율에 따른 배경색 반환 (SectorHeatmap과 동일한 색상 체계)
function getChangeColor(change: number): string {
  if (change >= 3) return 'bg-green-700';
  if (change >= 1) return 'bg-green-600';
  if (change >= 0) return 'bg-green-500';
  if (change >= -1) return 'bg-red-500';
  if (change >= -3) return 'bg-red-600';
  return 'bg-red-700';
}

function formatPercent(value: number): string {
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(2)}%`;
}

export function SectorSummary({ sectors, country }: SectorSummaryProps) {
  // 등락률로 정렬 (상승 -> 하락)
  const sortedSectors = [...sectors].sort((a, b) => b.change_percent - a.change_percent);

  const getFlag = () => {
    return country === 'kr' ? '🇰🇷' : '🇺🇸';
  };

  if (sortedSectors.length === 0) {
    return (
      <div className="bg-card border rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">{getFlag()} 섹터별 등락률</h3>
        </div>
        <div className="p-6 text-center text-sm text-muted-foreground">섹터 데이터가 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-lg p-4">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-foreground">{getFlag()} 섹터별 등락률</h3>
      </div>

      {/* 히트맵 그리드 (4x2 고정) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {sortedSectors.map((sector) => {
          const colorClass = getChangeColor(sector.change_percent);

          return (
            <div
              key={sector.sector}
              className={cn(
                'relative rounded-lg p-4 h-[80px] flex flex-col items-center justify-center transition-transform hover:scale-[1.02] cursor-default',
                colorClass,
              )}
            >
              {/* 섹터명 */}
              <span className="text-white text-base font-semibold text-center leading-tight drop-shadow-sm">
                {sector.sector}
              </span>

              {/* 등락률 */}
              <span className="text-white text-xl font-bold mt-1.5 drop-shadow-sm">
                {formatPercent(sector.change_percent)}
              </span>
            </div>
          );
        })}
      </div>

      {/* 범례 */}
      <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t text-xs text-muted-foreground flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-3 rounded-sm bg-green-700" />
          <span>+3% 이상</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-3 rounded-sm bg-green-600" />
          <span>+1~3%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-3 rounded-sm bg-green-500" />
          <span>0~+1%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-3 rounded-sm bg-red-500" />
          <span>0~-1%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-3 rounded-sm bg-red-600" />
          <span>-1~-3%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-3 rounded-sm bg-red-700" />
          <span>-3% 이하</span>
        </div>
      </div>
    </div>
  );
}
