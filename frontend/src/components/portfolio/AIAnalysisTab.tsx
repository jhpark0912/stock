/**
 * AIAnalysisTab - AI 분석 탭 오케스트레이터
 * 전체 보고서, 요약 생성/저장, 이력 보기 기능 포함
 */

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Key, Play, AlertCircle, RefreshCw, FileText, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnalysisHistory } from './AnalysisHistory';
import { AIAnalysisHeader, AIAnalysisStatusCard } from './AIAnalysisComponents';
import { StrategyBadge } from '@/components/common/StrategyBadge';
import type { StockData, AIAnalysis } from '@/types/stock';
import type { UserResponse } from '@/types/auth';
import { useAnalysisSummary } from '@/hooks/common/useAnalysisSummary';

interface AIAnalysisTabProps {
  stockData: StockData | null;
  aiAnalysis: AIAnalysis | null;
  aiError: { type: 'no_key' | 'api_error'; message: string } | null;
  user: UserResponse | null;
  onAnalyzeAI: () => void;
  onNavigateToSettings?: () => void;
  tickerCount: number;
}

export function AIAnalysisTab({
  stockData,
  aiAnalysis,
  aiError,
  user,
  onAnalyzeAI,
  onNavigateToSettings,
  tickerCount,
}: AIAnalysisTabProps) {
  const { summary, summaryLoading, summaryError, saveLoading, saveSuccess, generate, save, reset } =
    useAnalysisSummary(stockData?.ticker ?? '', stockData?.price.current);

  const [historyOpen, setHistoryOpen] = useState(false);
  const openHistory = () => setHistoryOpen(true);

  const handleGenerateSummary = () => {
    if (aiAnalysis) generate(aiAnalysis.report);
  };

  const handleSaveAnalysis = () => {
    save(aiAnalysis?.report);
  };

  const handleAnalyzeAIWithReset = () => {
    reset();
    onAnalyzeAI();
  };

  const renderContent = () => {
    // API 키 없음
    if (!user?.has_gemini_key && user?.role !== 'admin') {
      return (
        <AIAnalysisStatusCard
          icon={Key}
          iconClassName="text-warning"
          iconBgClassName="bg-warning/10"
          title="Gemini API 키가 필요합니다"
          description="AI 주식 분석 기능을 사용하려면 Google Gemini API 키를 설정해주세요. 설정 페이지에서 API 키를 등록할 수 있습니다."
          action={
            <Button onClick={onNavigateToSettings} className="gap-2">
              <Key className="h-4 w-4" />
              설정에서 API 키 등록하기
            </Button>
          }
          onHistoryOpen={openHistory}
          showHeader={!!stockData}
        />
      );
    }

    // AI 분석 에러
    if (aiError) {
      const isNoKey = aiError.type === 'no_key';
      return (
        <AIAnalysisStatusCard
          icon={isNoKey ? Key : AlertCircle}
          iconClassName={isNoKey ? 'text-warning' : 'text-destructive'}
          iconBgClassName={isNoKey ? 'bg-warning/10' : 'bg-destructive/10'}
          title={isNoKey ? 'API 키 오류' : 'AI 분석 실패'}
          description={aiError.message}
          action={
            isNoKey ? (
              <Button onClick={onNavigateToSettings} className="gap-2">
                <Key className="h-4 w-4" />
                설정에서 API 키 확인하기
              </Button>
            ) : (
              <Button onClick={handleAnalyzeAIWithReset} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                다시 시도
              </Button>
            )
          }
          onHistoryOpen={openHistory}
          showHeader={!!stockData}
        />
      );
    }

    // AI 분석 결과 표시
    if (aiAnalysis) {
      return (
        <div className="p-6 space-y-4">
          <div className="bg-card border border-border rounded-lg p-6">
            <AIAnalysisHeader
              titleIcon={<FileText className="h-5 w-5" />}
              onHistoryOpen={openHistory}
              extraButtons={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAnalyzeAIWithReset}
                  className="gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  재분석
                </Button>
              }
            />
            <div className="markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiAnalysis.report}</ReactMarkdown>
            </div>
          </div>

          {/* 요약 섹션 카드 */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">요약</h3>
              {!summary && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateSummary}
                  disabled={summaryLoading}
                  className="gap-2"
                >
                  {summaryLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      생성 중...
                    </>
                  ) : (
                    <>
                      <FileText className="h-4 w-4" />
                      요약 생성
                    </>
                  )}
                </Button>
              )}
            </div>

            {summaryError && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {summaryError}
              </div>
            )}

            {!summary && !summaryLoading && !summaryError && (
              <p className="text-sm text-muted-foreground">
                "요약 생성" 버튼을 클릭하면 AI가 보고서를 3줄로 요약하고 투자 전략을 제안합니다.
              </p>
            )}

            {summaryLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {summary && (
              <div className="space-y-4">
                <div className="space-y-2">
                  {summary.summary.split('\n').map((line, idx) => (
                    <p key={idx} className="text-sm text-foreground flex items-start gap-2">
                      <span className="text-primary font-medium">{idx + 1}.</span>
                      {line}
                    </p>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground">투자 전략:</span>
                    <StrategyBadge strategy={summary.strategy} />
                  </div>

                  <Button
                    onClick={handleSaveAnalysis}
                    disabled={saveLoading || saveSuccess}
                    className="gap-2"
                    variant={saveSuccess ? 'outline' : 'default'}
                  >
                    {saveLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        저장 중...
                      </>
                    ) : saveSuccess ? (
                      <>
                        <Save className="h-4 w-4" />
                        저장 완료
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        저장
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // 분석 시작 전 상태
    if (stockData) {
      return (
        <AIAnalysisStatusCard
          icon={Play}
          iconClassName="text-primary"
          iconBgClassName="bg-primary/10"
          title="AI 분석 준비 완료"
          description={
            <>
              <span className="font-medium text-foreground">{stockData.ticker}</span>에 대한 AI 기반
              투자 분석을 시작하려면 아래 버튼을 클릭하세요.
            </>
          }
          action={
            <Button onClick={onAnalyzeAI} className="gap-2">
              <Play className="h-4 w-4" />
              AI 분석 시작
            </Button>
          }
          onHistoryOpen={openHistory}
        />
      );
    }

    // 티커 미선택 상태
    return (
      <div className="p-3 sm:p-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-1">
              {tickerCount === 0 ? 'No tickers added yet.' : 'No data loaded.'}
            </p>
            <p className="text-xs text-muted-foreground">
              {tickerCount === 0
                ? 'Add a ticker from the sidebar to get started.'
                : 'Click a ticker from the sidebar to load data.'}
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {renderContent()}

      {/* 분석 이력 모달 — 1회만 렌더링 */}
      {stockData && (
        <AnalysisHistory
          ticker={stockData.ticker}
          isOpen={historyOpen}
          onClose={() => setHistoryOpen(false)}
        />
      )}
    </>
  );
}
