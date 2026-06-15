/**
 * 트리맵 색상 범례 (SectorDetail + SectorHeatmap 공유)
 */

export function TreemapLegend() {
  return (
    <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-3 rounded-sm bg-green-600" />
          <span>+3% 이상</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-3 rounded-sm bg-green-500" />
          <span>+1~3%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-3 rounded-sm bg-green-300" />
          <span>0~+1%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-3 rounded-sm bg-red-300" />
          <span>0~-1%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-3 rounded-sm bg-red-500" />
          <span>-1~-3%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-3 rounded-sm bg-red-600" />
          <span>-3% 이하</span>
        </div>
      </div>
    </div>
  );
}
