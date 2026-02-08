/**
 * 시장 사이클 (경기 계절) 섹션 컴포넌트
 * Simple 뷰의 한 섹션으로 표시
 * 클릭 시 상세 정보 표시 (확장/접기)
 */

import { useState, useEffect } from 'react';
import { Thermometer, Info, ChevronDown, ChevronUp, Sparkles, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import type { MarketCycleResponse, MarketCycleData } from '@/types/economic';

// ============================================================
// Types
// ============================================================

type MarketSeason = 'spring' | 'summer' | 'autumn' | 'winter';

interface SeasonInfo {
  key: MarketSeason;
  name: string;
  subName: string;
  emoji: string;
  description: string;
  characteristics: string[];
  color: string;
  bgColor: string;
  borderColor: string;
  sectors: string[];
}

interface MarketCycleSectionProps {
  isAdmin?: boolean;
}

// ============================================================
// Constants
// ============================================================

const SEASONS: SeasonInfo[] = [
  {
    key: 'spring',
    name: '봄',
    subName: '회복기',
    emoji: '🌸',
    description: '경기 바닥에서 회복 시작',
    characteristics: ['생산 회복 추세', '저물가', '금리 완화'],
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-50 dark:bg-pink-950/30',
    borderColor: 'border-pink-300 dark:border-pink-700',
    sectors: ['기술주', '소비재', '소형주'],
  },
  {
    key: 'summer',
    name: '여름',
    subName: '활황기',
    emoji: '☀️',
    description: '경기 확장, 기업 실적 호조',
    characteristics: ['생산 확장', '양호한 물가', '낮은 변동성'],
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-300 dark:border-amber-700',
    sectors: ['산업재', '금융', '에너지'],
  },
  {
    key: 'autumn',
    name: '가을',
    subName: '후퇴기',
    emoji: '🍂',
    description: '과열 후 둔화 시작',
    characteristics: ['생산 둔화 추세', '높은 물가', 'VIX 상승'],
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    borderColor: 'border-orange-300 dark:border-orange-700',
    sectors: ['유틸리티', '헬스케어', '필수소비재'],
  },
  {
    key: 'winter',
    name: '겨울',
    subName: '침체기',
    emoji: '❄️',
    description: '경기 수축, 방어적 투자',
    characteristics: ['생산 감소', '디플레 우려', '금리 인하 기대'],
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-300 dark:border-blue-700',
    sectors: ['채권', '현금', '방어주'],
  },
];

// ============================================================
// Main Component
// ============================================================

export function MarketCycleSection({ isAdmin = false }: MarketCycleSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // 시장 사이클 데이터 상태
  const [cycleData, setCycleData] = useState<MarketCycleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<MarketSeason | null>(null);

  // AI 분석 상태
  const [aiAnalysis, setAiAnalysis] = useState<{
    comment: string;
    recommendation: string;
    risk?: string;
  } | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // 시장 사이클 데이터 조회
  useEffect(() => {
    const fetchCycleData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.get<MarketCycleResponse>(
          '/api/economic/market-cycle'
        );

        if (response.data.success && response.data.data) {
          setCycleData(response.data.data);
          setSelectedSeason(response.data.data.season);
        } else {
          setError(response.data.error || '시장 사이클 데이터를 불러올 수 없습니다.');
        }
      } catch (err) {
        setError('시장 사이클 데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchCycleData();
  }, []);

  const selectedSeasonInfo = SEASONS.find((s) => s.key === (selectedSeason || cycleData?.season))!;

  // 재시도 함수
  const handleRetry = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get<MarketCycleResponse>(
        '/api/economic/market-cycle'
      );

      if (response.data.success && response.data.data) {
        setCycleData(response.data.data);
        setSelectedSeason(response.data.data.season);
      } else {
        setError(response.data.error || '시장 사이클 데이터를 불러올 수 없습니다.');
      }
    } catch (err) {
      setError('시장 사이클 데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // AI 분석 요청
  const handleRequestAI = async () => {
    if (!isAdmin) return;

    setLoadingAI(true);
    setAiError(null);

    try {
      const response = await api.get<MarketCycleResponse>(
        '/api/economic/market-cycle/analysis'
      );

      if (response.data.success && response.data.data) {
        const { ai_comment, ai_recommendation, ai_risk } = response.data.data;
        
        if (ai_comment && ai_recommendation) {
          setAiAnalysis({
            comment: ai_comment,
            recommendation: ai_recommendation,
            risk: ai_risk || undefined,
          });
        } else {
          setAiError('AI 분석 결과를 받을 수 없습니다.');
        }
      } else {
        setAiError(response.data.error || 'AI 분석 요청 실패');
      }
    } catch (error) {
      console.error('AI 분석 요청 오류:', error);
      setAiError('AI 분석 요청 중 오류가 발생했습니다.');
    } finally {
      setLoadingAI(false);
    }
  };

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
              <Button
                onClick={handleRetry}
                variant="outline"
                size="sm"
                className="w-full"
              >
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
                산업생산, CPI, VIX 지표를 종합하여 현재 시장 사이클을 판단합니다.
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
                    setSelectedSeason(season.key);
                    if (!expanded) setExpanded(true);
                  }}
                  className={cn(
                    'flex-1 flex flex-col items-center py-3 px-2 rounded-lg border-2 transition-all',
                    'hover:shadow-sm',
                    isActive
                      ? cn(season.bgColor, season.borderColor, 'shadow-sm')
                      : isSelected && expanded
                      ? 'bg-muted border-muted-foreground/30'
                      : 'bg-muted/30 border-transparent hover:border-muted-foreground/20'
                  )}
                >
                  {/* 현재 표시 */}
                  {isActive && (
                    <span className="text-[10px] font-semibold text-primary mb-1">현재</span>
                  )}
                  <span className="text-2xl">{season.emoji}</span>
                  <span
                    className={cn(
                      'text-sm font-medium mt-1',
                      isActive ? season.color : 'text-muted-foreground'
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
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">
                        <span className="text-muted-foreground">산업생산 </span>
                        <span className="font-medium">{cycleData.indpro.value > 0 ? '+' : ''}{cycleData.indpro.value.toFixed(1)}%</span>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs whitespace-pre-line text-left">
                      <p className="font-medium mb-1">🏭 산업생산지수 - "경제의 체온계"</p>
                      <p className="text-xs mb-1">공장·광산·전기 생산량을 측정하는 지표.</p>
                      <p className="text-xs text-muted-foreground">YoY 0% 기준으로 경기 확장/수축 판단. 상승하면 경기 회복, 하락하면 둔화 신호</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <span className="text-muted-foreground">|</span>

                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">
                        <span className="text-muted-foreground">CPI </span>
                        <span className="font-medium">{cycleData.cpi.value.toFixed(1)}%</span>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs whitespace-pre-line text-left">
                      <p className="font-medium mb-1">🛒 소비자물가지수 - "장바구니 물가"</p>
                      <p className="text-xs mb-1">실제 구매하는 상품·서비스 가격 변화를 측정.</p>
                      <p className="text-xs text-muted-foreground">2% 목표. 높으면 금리 인상 → 주식 하락 압력</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <span className="text-muted-foreground">|</span>

                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">
                        <span className="text-muted-foreground">VIX </span>
                        <span className="font-medium">{cycleData.vix.value.toFixed(1)}</span>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs whitespace-pre-line text-left">
                      <p className="font-medium mb-1">📊 변동성지수 - "공포 지수"</p>
                      <p className="text-xs mb-1">투자자들의 불안감을 숫자로 표현한 지표.</p>
                      <p className="text-xs text-muted-foreground">20 이하=안정, 30 이상=공포. 높을수록 변동성 크고 안전자산 선호</p>
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
              <p className="text-xs text-muted-foreground leading-relaxed">
                📊 {cycleData.reasoning}
              </p>
            </div>
          </div>

          {/* 상세 정보 (확장 시) */}
          {expanded && (
            <div className="mt-4 pt-4 border-t space-y-4">
              {/* 선택된 계절 정보 */}
              <div
                className={cn(
                  'p-4 rounded-lg border-2',
                  selectedSeasonInfo.bgColor,
                  selectedSeasonInfo.borderColor
                )}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{selectedSeasonInfo.emoji}</span>
                  <div>
                    <h4 className={cn('font-semibold', selectedSeasonInfo.color)}>
                      {selectedSeasonInfo.name} ({selectedSeasonInfo.subName})
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedSeasonInfo.description}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* 주요 특징 */}
                  <div>
                    <h5 className="text-xs font-medium text-muted-foreground mb-2">주요 특징</h5>
                    <ul className="space-y-1">
                      {selectedSeasonInfo.characteristics.map((char, idx) => (
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
                      {selectedSeasonInfo.sectors.map((sector, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 text-xs bg-background/80 rounded-md border"
                        >
                          {sector}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin 전용: AI 멘토 분석 */}
              {isAdmin && (
                <div>
                  {/* AI 분석 요청 버튼 (분석 전) */}
                  {!aiAnalysis && !loadingAI && (
                    <Button
                      onClick={handleRequestAI}
                      variant="outline"
                      className="w-full gap-2 border-primary/20 hover:bg-primary/5"
                    >
                      <Sparkles className="h-4 w-4 text-primary" />
                      AI 멘토 분석 받기
                      <span className="ml-auto px-2 py-0.5 text-[10px] font-medium bg-primary/20 text-primary rounded-full">
                        Admin 전용
                      </span>
                    </Button>
                  )}

                  {/* 로딩 상태 */}
                  {loadingAI && (
                    <div className="p-4 bg-muted/50 rounded-lg border border-dashed">
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        AI 멘토가 시장을 분석하고 있습니다...
                      </div>
                    </div>
                  )}

                  {/* 에러 상태 */}
                  {aiError && (
                    <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg">
                      <p className="text-sm text-destructive">{aiError}</p>
                      <Button
                        onClick={handleRequestAI}
                        variant="outline"
                        size="sm"
                        className="mt-2 w-full"
                      >
                        다시 시도
                      </Button>
                    </div>
                  )}

                  {/* AI 분석 결과 */}
                  {aiAnalysis && (
                    <div className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <h5 className="text-sm font-semibold text-foreground">AI 멘토 분석</h5>
                        <span className="ml-auto px-2 py-0.5 text-[10px] font-medium bg-primary/20 text-primary rounded-full">
                          Admin 전용
                        </span>
                      </div>

                      <p className="text-sm text-foreground leading-relaxed mb-3">
                        {aiAnalysis.comment}
                      </p>

                      {aiAnalysis.recommendation && (
                        <div className="p-3 bg-background/60 rounded-lg border border-primary/10">
                          <h6 className="text-xs font-medium text-primary mb-1">💡 추천 전략</h6>
                          <p className="text-sm text-muted-foreground">
                            {aiAnalysis.recommendation}
                          </p>
                        </div>
                      )}

                      {aiAnalysis.risk && (
                        <div className="p-3 mt-2 bg-destructive/5 rounded-lg border border-destructive/10">
                          <h6 className="text-xs font-medium text-destructive mb-1">⚠️ 리스크</h6>
                          <p className="text-sm text-muted-foreground">
                            {aiAnalysis.risk}
                          </p>
                        </div>
                      )}

                      {/* 새로고침 버튼 */}
                      <Button
                        onClick={handleRequestAI}
                        variant="ghost"
                        size="sm"
                        className="w-full mt-3 text-xs"
                      >
                        다시 분석
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
