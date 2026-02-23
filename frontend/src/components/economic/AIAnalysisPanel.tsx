/**
 * AI 멘토 분석 패널 (Admin 전용)
 * 시장 사이클 AI 분석 요청/결과/에러 표시
 */

import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AIAnalysisData } from '@/hooks/economic/useMarketCycle';

interface AIAnalysisPanelProps {
  aiAnalysis: AIAnalysisData | null;
  loadingAI: boolean;
  aiError: string | null;
  onRequestAI: () => void;
}

export function AIAnalysisPanel({
  aiAnalysis,
  loadingAI,
  aiError,
  onRequestAI,
}: AIAnalysisPanelProps) {
  return (
    <div>
      {/* AI 분석 요청 버튼 (분석 전) */}
      {!aiAnalysis && !loadingAI && (
        <Button
          onClick={onRequestAI}
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
          <Button onClick={onRequestAI} variant="outline" size="sm" className="mt-2 w-full">
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

          <p className="text-sm text-foreground leading-relaxed mb-3">{aiAnalysis.comment}</p>

          {aiAnalysis.recommendation && (
            <div className="p-3 bg-background/60 rounded-lg border border-primary/10">
              <h6 className="text-xs font-medium text-primary mb-1">추천 전략</h6>
              <p className="text-sm text-muted-foreground">{aiAnalysis.recommendation}</p>
            </div>
          )}

          {aiAnalysis.risk && (
            <div className="p-3 mt-2 bg-destructive/5 rounded-lg border border-destructive/10">
              <h6 className="text-xs font-medium text-destructive mb-1">리스크</h6>
              <p className="text-sm text-muted-foreground">{aiAnalysis.risk}</p>
            </div>
          )}

          <Button onClick={onRequestAI} variant="ghost" size="sm" className="w-full mt-3 text-xs">
            다시 분석
          </Button>
        </div>
      )}
    </div>
  );
}
