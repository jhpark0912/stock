/**
 * 시장 사이클 (경기 계절) 섹션 컴포넌트
 * Simple 뷰의 한 섹션으로 표시
 * 클릭 시 상세 정보 표시 (확장/접기)
 *
 * 분리된 모듈:
 * - useMarketCycle: 데이터 조회 + AI 분석 로직
 * - marketCycleConstants: 계절 상수 + 타입
 * - SeasonDetailPanel: 확장 시 계절 상세 정보
 * - AIAnalysisPanel: Admin AI 분석 섹션
 */

import { useState } from 'react';
import { Thermometer, Info, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useMarketCycle } from '@/hooks/useMarketCycle';
import { US_SEASONS, KR_SEASONS } from './marketCycleConstants';
import type { MarketSeason } from './marketCycleConstants';
import { SeasonDetailPanel } from './SeasonDetailPanel';
import { AIAnalysisPanel } from './AIAnalysisPanel';

interface MarketCycleSectionProps {
  isAdmin?: boolean;
  country?: 'us' | 'kr';
}

export function MarketCycleSection({ isAdmin = false, country = 'us' }: MarketCycleSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const {
    cycleData,
    loading,
    error,
    selectedSeason,
    setSelectedSeason,
    aiAnalysis,
    loadingAI,
    aiError,
    retry,
    requestAI,
  } = useMarketCycle(country, isAdmin);

  const SEASONS = country === 'kr' ? KR_SEASONS : US_SEASONS;
  const selectedSeasonInfo = SEASONS.find((s) => s.key === (selectedSeason || cycleData?.season))!;

  // 로딩 상태
  if (loading) {
    return (
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Thermometer className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium text-foreground">시장 사이클</h3>
        </div>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">시장 사이클 분석 중...</span>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  // 에러 상태
  if (error || !cycleData) {
    return (
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Thermometer className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium text-foreground">시장 사이클</h3>
        </div>
        <Card>
          <CardContent className="p-4">
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
              <p className="text-sm text-destructive mb-2">
                {error || '시장 사이클 데이터를 불러올 수 없습니다.'}
              </p>
              <Button onClick={retry} variant="outline" size="sm" className="w-full">
                다시 시도
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section>
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Thermometer className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium text-foreground">시장 사이클</h3>
        </div>

        {/* 신뢰도 & 도움말 */}
        <div
          className="relative"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground cursor-help">
            <Info className="h-4 w-4" />
            <span>신뢰도 {cycleData.confidence}%</span>
          </div>
          {showTooltip && (
            <div className="absolute right-0 top-full mt-2 w-56 p-3 bg-popover border rounded-lg shadow-lg z-10">
              <p className="text-xs text-muted-foreground">
                {country === 'kr'
                  ? '수출액, CPI, 신용 스프레드 지표를 종합하여 현재 시장 사이클을 판단합니다.'
                  : '산업생산, CPI, VIX 지표를 종합하여 현재 시장 사이클을 판단합니다.'}
              </p>
            </div>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          {/* 4계절 표시 */}
          <div className="flex items-center justify-between gap-2 mb-4">
            {SEASONS.map((season) => {
              const isActive = season.key === cycleData.season;
              const isSelected = season.key === selectedSeason;
              return (
                <button
                  key={season.key}
                  onClick={() => {
                    setSelectedSeason(season.key as MarketSeason);
                    if (!expanded) setExpanded(true);
                  }}
                  className={cn(
                    'flex-1 flex flex-col items-center py-3 px-2 rounded-lg border-2 transition-all',
                    'hover:shadow-sm',
                    isActive
                      ? cn(season.bgColor, season.borderColor, 'shadow-sm')
                      : isSelected && expanded
                        ? 'bg-muted border-muted-foreground/30'
                        : 'bg-muted/30 border-transparent hover:border-muted-foreground/20',
                  )}
                >
                  {isActive && (
                    <span className="text-[10px] font-semibold text-primary mb-1">현재</span>
                  )}
                  <span className="text-2xl">{season.emoji}</span>
                  <span
                    className={cn(
                      'text-sm font-medium mt-1',
                      isActive ? season.color : 'text-muted-foreground',
                    )}
                  >
                    {season.name}
                  </span>
                  {isActive && (
                    <span className="text-[10px] text-muted-foreground">{season.subName}</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* 현재 상태 요약 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-2 py-2 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-4 text-sm">
                {/* 첫 번째 지표: 미국=산업생산, 한국=수출 */}
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">
                        {country === 'kr' ? (
                          <>
                            <span className="text-muted-foreground">수출 </span>
                            <span className="font-medium">
                              {'export' in cycleData && cycleData.export.value > 0 ? '+' : ''}
                              {'export' in cycleData ? cycleData.export.value.toFixed(1) : '0.0'}%
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-muted-foreground">산업생산 </span>
                            <span className="font-medium">
                              {'indpro' in cycleData && cycleData.indpro.value > 0 ? '+' : ''}
                              {'indpro' in cycleData ? cycleData.indpro.value.toFixed(1) : '0.0'}%
                            </span>
                          </>
                        )}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs whitespace-pre-line text-left">
                      {country === 'kr' ? (
                        <>
                          <p className="font-medium mb-1">수출액 - "세계 경제 체온계"</p>
                          <p className="text-xs mb-1">한국 상품 수출 금액 (YoY 변화율).</p>
                          <p className="text-xs text-muted-foreground">
                            0% 기준으로 경기 확장/수축 판단. 상승 시 경기 확장, 하락 시 수축 신호
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-medium mb-1">산업생산지수 - "경제의 체온계"</p>
                          <p className="text-xs mb-1">공장·광산·전기 생산량을 측정하는 지표.</p>
                          <p className="text-xs text-muted-foreground">
                            YoY 0% 기준으로 경기 확장/수축 판단. 상승하면 경기 회복, 하락하면 둔화
                            신호
                          </p>
                        </>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <span className="text-muted-foreground">|</span>

                {/* 두 번째 지표: CPI */}
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">
                        <span className="text-muted-foreground">CPI </span>
                        <span className="font-medium">{cycleData.cpi.value.toFixed(1)}%</span>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs whitespace-pre-line text-left">
                      <p className="font-medium mb-1">소비자물가지수 - "장바구니 물가"</p>
                      <p className="text-xs mb-1">실제 구매하는 상품·서비스 가격 변화를 측정.</p>
                      <p className="text-xs text-muted-foreground">
                        2% 목표. 높으면 금리 인상 → 주식 하락 압력
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <span className="text-muted-foreground">|</span>

                {/* 세 번째 지표: 미국=VIX, 한국=신용스프레드 */}
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">
                        {country === 'kr' ? (
                          <>
                            <span className="text-muted-foreground">스프레드 </span>
                            <span className="font-medium">
                              {'credit_spread' in cycleData
                                ? cycleData.credit_spread.value.toFixed(0)
                                : '0'}
                              bp
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-muted-foreground">VIX </span>
                            <span className="font-medium">
                              {'vix' in cycleData ? cycleData.vix.value.toFixed(1) : '0.0'}
                            </span>
                          </>
                        )}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs whitespace-pre-line text-left">
                      {country === 'kr' ? (
                        <>
                          <p className="font-medium mb-1">신용 스프레드 - "리스크 체감 온도"</p>
                          <p className="text-xs mb-1">회사채와 국고채 금리 차이 (basis point).</p>
                          <p className="text-xs text-muted-foreground">
                            60bp 이하=안정, 80bp 이상=위험. 높을수록 시장 불안
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-medium mb-1">변동성지수 - "공포 지수"</p>
                          <p className="text-xs mb-1">투자자들의 불안감을 숫자로 표현한 지표.</p>
                          <p className="text-xs text-muted-foreground">
                            20 이하=안정, 30 이상=공포. 높을수록 변동성 크고 안전자산 선호
                          </p>
                        </>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* 확장/접기 버튼 */}
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-background"
              >
                <span>{expanded ? '접기' : '상세보기'}</span>
                {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            </div>

            {/* 판단 근거 */}
            <div className="px-3 py-2 bg-primary/5 border-l-2 border-primary rounded">
              <p className="text-xs text-muted-foreground leading-relaxed">{cycleData.reasoning}</p>
            </div>
          </div>

          {/* 상세 정보 (확장 시) */}
          {expanded && (
            <div className="mt-4 pt-4 border-t space-y-4">
              <SeasonDetailPanel seasonInfo={selectedSeasonInfo} />

              {isAdmin && (
                <AIAnalysisPanel
                  aiAnalysis={aiAnalysis}
                  loadingAI={loadingAI}
                  aiError={aiError}
                  onRequestAI={requestAI}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
