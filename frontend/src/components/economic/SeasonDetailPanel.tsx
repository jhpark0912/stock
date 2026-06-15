/**
 * 시장 사이클 계절 상세 정보 패널
 * 주요 특징 + 유망 섹터 표시
 */

import { cn } from '@/lib/utils';
import type { SeasonInfo } from './marketCycleConstants';

interface SeasonDetailPanelProps {
  seasonInfo: SeasonInfo;
}

export function SeasonDetailPanel({ seasonInfo }: SeasonDetailPanelProps) {
  return (
    <div className={cn('p-4 rounded-lg border-2', seasonInfo.bgColor, seasonInfo.borderColor)}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">{seasonInfo.emoji}</span>
        <div>
          <h4 className={cn('font-semibold', seasonInfo.color)}>
            {seasonInfo.name} ({seasonInfo.subName})
          </h4>
          <p className="text-sm text-muted-foreground">{seasonInfo.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* 주요 특징 */}
        <div>
          <h5 className="text-xs font-medium text-muted-foreground mb-2">주요 특징</h5>
          <ul className="space-y-1">
            {seasonInfo.characteristics.map((char, idx) => (
              <li key={idx} className="text-sm flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-primary" />
                {char}
              </li>
            ))}
          </ul>
        </div>

        {/* 유망 섹터 */}
        <div>
          <h5 className="text-xs font-medium text-muted-foreground mb-2">유망 섹터</h5>
          <div className="flex flex-wrap gap-1.5">
            {seasonInfo.sectors.map((sector, idx) => (
              <span key={idx} className="px-2 py-1 text-xs bg-background/80 rounded-md border">
                {sector}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
