/**
 * AI 분석 인사이트 카드 컴포넌트
 * 버튼 클릭 시 AI 분석 생성
 */

import { useState } from 'react';
import { Bot, Sparkles, Loader2, AlertCircle, ChevronDown, ChevronUp, Key, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { MarketReviewAI } from '@/types/marketReview';

interface AIInsightCardProps {
  analysis: MarketReviewAI | null | undefined;
  onGenerate: () => Promise<void>;
  loading?: boolean;
  country: 'kr' | 'us';
  disabled?: boolean;
  disabledReason?: string;
  error?: string | null;
}

export function AIInsightCard({
  analysis,
  onGenerate,
  loading = false,
  country,
  disabled = false,
  disabledReason,
  error,
}: AIInsightCardProps) {
  const [expanded, setExpanded] = useState(true);

  const getFlag = () => {
    return country === 'kr' ? '🇰🇷' : '🇺🇸';
  };

  return (
    <div className="bg-card border rounded-lg overflow-hidden">
      {/* 헤더 */}
      <div
        className={cn(
          'px-4 py-3 flex items-center justify-between cursor-pointer',
          'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30'
        )}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="font-semibold text-foreground">
            {getFlag()} AI 오늘의 포인트
          </h3>
        </div>
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
      </div>

      {/* 콘텐츠 */}
      {expanded && (
        <div className="p-4">
          {/* 분석이 없을 때: 생성 버튼 또는 에러 */}
          {!analysis && !loading && (
            <div className="text-center py-8 space-y-4">
              {/* 에러 상태 */}
              {error ? (
                <>
                  {/* API 키 관련 에러 */}
                  {(error.includes('API 키') || error.includes('Gemini')) ? (
                    <>
                      <div className="flex justify-center">
                        <div className="h-16 w-16 rounded-full bg-warning/10 flex items-center justify-center">
                          <Key className="h-8 w-8 text-warning" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          Gemini API 키가 필요합니다
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                          AI 마감 리뷰 분석 기능을 사용하려면 Google Gemini API 키를 설정해주세요.
                          설정 페이지에서 API 키를 등록할 수 있습니다.
                        </p>
                      </div>
                      <Button
                        onClick={() => window.location.href = '/settings'}
                        className="gap-2"
                      >
                        <Key className="h-4 w-4" />
                        설정에서 API 키 등록하기
                      </Button>
                    </>
                  ) : (
                    /* 일반 에러 */
                    <>
                      <div className="flex justify-center">
                        <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                          <AlertCircle className="h-8 w-8 text-destructive" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          AI 분석 실패
                        </h3>
                        <p className="text-sm text-muted-foreground max-w-md mx-auto">
                          {error}
                        </p>
                      </div>
                      <Button
                        onClick={onGenerate}
                        variant="outline"
                        className="gap-2"
                      >
                        <RefreshCw className="h-4 w-4" />
                        다시 시도
                      </Button>
                    </>
                  )}
                </>
              ) : (
                /* 정상 상태: 생성 버튼 */
                <>
                  <div className="flex justify-center">
                    <div className="h-16 w-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                      <Sparkles className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      AI 마감 리뷰 분석
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      AI가 오늘의 시장을 분석하여 핵심 포인트를 요약해 드립니다.
                    </p>
                  </div>
                  <Button
                    onClick={onGenerate}
                    disabled={disabled || loading}
                    className="gap-2"
                  >
                    <Bot className="h-4 w-4" />
                    AI 분석 생성
                  </Button>
                  {disabled && disabledReason && (
                    <div className="flex items-center justify-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                      <AlertCircle className="h-4 w-4" />
                      <span>{disabledReason}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* 로딩 중 */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <Loader2 className="h-8 w-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
              <p className="text-sm text-muted-foreground">
                AI가 시장을 분석하고 있습니다...
              </p>
            </div>
          )}

          {/* 분석 결과 */}
          {analysis && !loading && (
            <div className="space-y-4">
              {/* 오늘의 포인트 */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  오늘의 포인트
                </h4>
                <p className="text-sm text-foreground/90 leading-relaxed pl-3">
                  {analysis.summary}
                </p>
              </div>

              {/* 섹터 인사이트 */}
              {analysis.sector_insight && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                    섹터 인사이트
                  </h4>
                  <p className="text-sm text-foreground/90 leading-relaxed pl-3">
                    {analysis.sector_insight}
                  </p>
                </div>
              )}

              {/* 내일 전망 */}
              {analysis.tomorrow_outlook && (
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    내일 전망
                  </h4>
                  <p className="text-sm text-foreground/90 leading-relaxed pl-3">
                    {analysis.tomorrow_outlook}
                  </p>
                </div>
              )}

              {/* 생성 시간 */}
              <div className="pt-3 border-t text-xs text-muted-foreground text-right">
                생성: {new Date(analysis.generated_at).toLocaleString('ko-KR')}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
