/**
 * StealthHomePage - 사업현황 탭 (섹터 히트맵 → 부서별 실적표)
 */

import type { Country } from '@/types/economic';
import {
  getTodayString,
  formatDate,
  MemoSection,
  MemoBlock,
  MemoItem,
} from '@/components/stealth/StealthMemoComponents';
import type { SectorData } from '@/components/stealth/StealthMemoComponents';

interface StealthStatusTabProps {
  sectors: SectorData[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  country: Country;
}

export function StealthStatusTab({
  sectors,
  loading,
  error,
  lastUpdated,
  country,
}: StealthStatusTabProps) {
  if (country === null) {
    return <div className="text-sm text-muted-foreground text-center py-12">팀을 선택하세요.</div>;
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">불러오는 중...</div>;
  }

  if (error) {
    return (
      <div className="text-sm text-muted-foreground p-3 border border-border rounded-md">
        {error}
      </div>
    );
  }

  if (sectors.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-12">데이터가 없습니다.</div>
    );
  }

  const formatChange = (v: number): string => `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;

  return (
    <MemoSection title={`부서별 실적 현황 - ${getTodayString()}`}>
      <div className="space-y-4">
        <MemoBlock heading="실적 요약">
          <div className="overflow-x-auto -mx-3">
            <div className="min-w-[20rem] px-3">
              <div className="flex items-baseline gap-2 text-[10px] sm:text-xs text-muted-foreground border-b border-border pb-1 mb-1">
                <span className="flex-1 min-w-0">부서</span>
                <span className="w-14 sm:w-16 text-right shrink-0">금일</span>
                <span className="w-14 sm:w-16 text-right shrink-0">주간</span>
                <span className="w-14 sm:w-16 text-right shrink-0">월간</span>
              </div>
              {sectors.map((sector) => (
                <div
                  key={sector.symbol}
                  className="flex items-baseline gap-2 text-xs sm:text-sm py-0.5"
                >
                  <span className="flex-1 min-w-0 text-muted-foreground truncate">
                    {sector.name}
                  </span>
                  <span className="w-14 sm:w-16 text-right shrink-0 text-foreground font-mono text-[10px] sm:text-xs">
                    {formatChange(sector.change_1d)}
                  </span>
                  <span className="w-14 sm:w-16 text-right shrink-0 text-foreground font-mono text-[10px] sm:text-xs">
                    {formatChange(sector.change_1w)}
                  </span>
                  <span className="w-14 sm:w-16 text-right shrink-0 text-foreground font-mono text-[10px] sm:text-xs">
                    {formatChange(sector.change_1m)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </MemoBlock>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MemoBlock heading="성과 우수 부서">
            {[...sectors]
              .sort((a, b) => b.change_1d - a.change_1d)
              .slice(0, 3)
              .map((s) => (
                <MemoItem key={s.symbol} label={s.name} value={formatChange(s.change_1d)} />
              ))}
          </MemoBlock>
          <MemoBlock heading="개선 필요 부서">
            {[...sectors]
              .sort((a, b) => a.change_1d - b.change_1d)
              .slice(0, 3)
              .map((s) => (
                <MemoItem key={s.symbol} label={s.name} value={formatChange(s.change_1d)} />
              ))}
          </MemoBlock>
        </div>

        {lastUpdated && (
          <div className="text-xs text-muted-foreground pt-1">
            작성일: {formatDate(lastUpdated)}
          </div>
        )}
      </div>
    </MemoSection>
  );
}
