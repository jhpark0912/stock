/**
 * StealthPortfolioPage - 분석 보고서 섹션 (요약/저장/이력 포함)
 */

import { useState, useEffect } from 'react';
import { RefreshCw, FileText, Save, History } from 'lucide-react';
import { useAnalysisSummary } from '@/hooks/useAnalysisSummary';
import { NoteSection, strategyToLabel } from '@/components/stealth/StealthPortfolioComponents';
import { StealthAnalysisHistory } from '@/components/stealth/StealthAnalysisHistory';
import type { StockData, AIAnalysis } from '@/types/stock';

interface StealthAnalysisSectionProps {
  stockData: StockData;
  aiAnalysis: AIAnalysis | null;
  aiError: { type: string; message: string } | null;
  loadingAI: boolean;
  onAnalyzeAI: () => void;
}

export function StealthAnalysisSection({
  stockData,
  aiAnalysis,
  aiError,
  loadingAI,
  onAnalyzeAI,
}: StealthAnalysisSectionProps) {
  const { summary, summaryLoading, summaryError, saveLoading, saveSuccess, generate, save, reset } =
    useAnalysisSummary(stockData.ticker, stockData.price.current);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiAnalysis]);

  const handleGenerateSummary = () => {
    if (aiAnalysis) generate(aiAnalysis.report);
  };

  const handleSaveAnalysis = () => {
    save(aiAnalysis?.report);
  };

  const handleAnalyzeWithReset = () => {
    reset();
    onAnalyzeAI();
  };

  return (
    <>
      <NoteSection title="분석 보고서">
        <div className="space-y-3">
          {aiAnalysis ? (
            <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
              {aiAnalysis.report}
            </div>
          ) : aiError ? (
            <p className="text-sm text-muted-foreground">{aiError.message}</p>
          ) : (
            <p className="text-sm text-muted-foreground">분석 보고서가 없습니다.</p>
          )}

          {aiAnalysis && (
            <div className="border-t border-border pt-3 mt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-muted-foreground">요약</span>
                {!summary && !summaryLoading && (
                  <button
                    onClick={handleGenerateSummary}
                    className="flex items-center gap-1 px-2 py-1 text-xs border border-border rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                  >
                    <FileText className="h-3 w-3" />
                    요약 생성
                  </button>
                )}
              </div>

              {summaryLoading && <p className="text-xs text-muted-foreground">요약 생성 중...</p>}
              {summaryError && <p className="text-xs text-muted-foreground">{summaryError}</p>}

              {summary && (
                <div className="space-y-2">
                  {summary.summary.split('\n').map((line, idx) => (
                    <p key={idx} className="text-sm text-foreground">
                      - {line}
                    </p>
                  ))}
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-muted-foreground">
                      방향: {strategyToLabel(summary.strategy)}
                    </span>
                    <button
                      onClick={handleSaveAnalysis}
                      disabled={saveLoading || saveSuccess}
                      className="flex items-center gap-1 px-2 py-1 text-xs border border-border rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
                    >
                      <Save className="h-3 w-3" />
                      {saveLoading ? '저장 중...' : saveSuccess ? '저장 완료' : '저장'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={aiAnalysis ? handleAnalyzeWithReset : onAnalyzeAI}
              disabled={loadingAI}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              {loadingAI ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <FileText className="h-3 w-3" />
              )}
              {loadingAI ? '분석 중...' : aiAnalysis ? '재분석' : 'AI 분석 요청'}
            </button>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border rounded hover:bg-muted transition-colors ${
                showHistory
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <History className="h-3 w-3" />
              이력
            </button>
          </div>
        </div>
      </NoteSection>

      {showHistory && (
        <StealthAnalysisHistory ticker={stockData.ticker} onClose={() => setShowHistory(false)} />
      )}
    </>
  );
}
