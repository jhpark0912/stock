/**
 * AIAnalysisTab - AI 분석 탭 컴포넌트
 * 전체 보고서, 요약 생성/저장, 이력 보기 기능 포함
 */

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  Key,
  Play,
  AlertCircle,
  RefreshCw,
  FileText,
  Save,
  History,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnalysisHistory } from './AnalysisHistory';
import type { StockData, AIAnalysis, AnalysisSummary, InvestmentStrategy } from '@/types/stock';
import type { UserResponse } from '@/types/auth';
import { generateSummary, saveAnalysis } from '@/lib/analysisApi';

interface AIAnalysisTabProps {
  stockData: StockData | null;
  aiAnalysis: AIAnalysis | null;
  aiError: { type: 'no_key' | 'api_error'; message: string } | null;
  user: UserResponse | null;
  onAnalyzeAI: () => void;
  onNavigateToSettings?: () => void;
  tickerCount: number;
}

/**
 * 투자 전략 배지
 */
function StrategyBadge({ strategy }: { strategy: InvestmentStrategy }) {
  const styles: Record<InvestmentStrategy, string> = {
    buy: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    hold: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    sell: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  const icons: Record<InvestmentStrategy, React.ReactNode> = {
    buy: <TrendingUp className="h-4 w-4" />,
    hold: <Minus className="h-4 w-4" />,
    sell: <TrendingDown className="h-4 w-4" />,
  };

  const labels: Record<InvestmentStrategy, string> = {
    buy: '매수',
    hold: '보유',
    sell: '매도',
  };

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${styles[strategy]}`}>
      {icons[strategy]}
      {labels[strategy]}
    </span>
  );
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
  // 요약 관련 상태
  const [summary, setSummary] = useState<AnalysisSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // 저장 관련 상태
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 이력 모달 상태
  const [historyOpen, setHistoryOpen] = useState(false);

  // 요약 생성
  const handleGenerateSummary = async () => {
    if (!stockData || !aiAnalysis) return;

    setSummaryLoading(true);
    setSummaryError(null);
    setSaveSuccess(false);

    try {
      const result = await generateSummary(stockData.ticker, aiAnalysis.report);
      setSummary(result);
    } catch (e) {
      setSummaryError(e instanceof Error ? e.message : '요약 생성 실패');
    } finally {
      setSummaryLoading(false);
    }
  };

  // 분석 저장
  const handleSaveAnalysis = async () => {
    if (!stockData || !summary) return;

    setSaveLoading(true);

    try {
      await saveAnalysis(stockData.ticker, {
        summary: summary.summary,
        strategy: summary.strategy,
        current_price: stockData.price.current,
        full_report: aiAnalysis?.report,
      });
      setSaveSuccess(true);
    } catch (e) {
      setSummaryError(e instanceof Error ? e.message : '저장 실패');
    } finally {
      setSaveLoading(false);
    }
  };

  // AI 분석 요청 시 기존 요약 초기화
  const handleAnalyzeAIWithReset = () => {
    setSummary(null);
    setSaveSuccess(false);
    setSummaryError(null);
    onAnalyzeAI();
  };

  // API 키 없음
  if (!user?.has_gemini_key && user?.role !== 'admin') {
    return (
      <div className="p-3 sm:p-6">
        <div className="bg-card border border-border rounded-lg p-6">
          {/* 헤더 - 이력 버튼 포함 */}
          {stockData && (
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                AI 분석 (Gemini)
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHistoryOpen(true)}
                className="gap-2"
              >
                <History className="h-4 w-4" />
                이력 보기
              </Button>
            </div>
          )}

          <div className="text-center py-12 space-y-4">
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
                AI 주식 분석 기능을 사용하려면 Google Gemini API 키를 설정해주세요.
                설정 페이지에서 API 키를 등록할 수 있습니다.
              </p>
            </div>
            <Button onClick={onNavigateToSettings} className="gap-2">
              <Key className="h-4 w-4" />
              설정에서 API 키 등록하기
            </Button>
          </div>
        </div>

        {/* 분석 이력 모달 */}
        {stockData && (
          <AnalysisHistory
            ticker={stockData.ticker}
            isOpen={historyOpen}
            onClose={() => setHistoryOpen(false)}
          />
        )}
      </div>
    );
  }

  // AI 분석 에러
  if (aiError) {
    return (
      <div className="p-3 sm:p-6">
        <div className="bg-card border border-border rounded-lg p-6">
          {/* 헤더 - 이력 버튼 포함 */}
          {stockData && (
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                AI 분석 (Gemini)
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHistoryOpen(true)}
                className="gap-2"
              >
                <History className="h-4 w-4" />
                이력 보기
              </Button>
            </div>
          )}

          <div className="text-center py-12 space-y-4">
            <div className="flex justify-center">
              <div className={`h-16 w-16 rounded-full flex items-center justify-center ${
                aiError.type === 'no_key' ? 'bg-warning/10' : 'bg-destructive/10'
              }`}>
                {aiError.type === 'no_key' ? (
                  <Key className="h-8 w-8 text-warning" />
                ) : (
                  <AlertCircle className="h-8 w-8 text-destructive" />
                )}
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                {aiError.type === 'no_key' ? 'API 키 오류' : 'AI 분석 실패'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {aiError.message}
              </p>
            </div>
            {aiError.type === 'no_key' ? (
              <Button onClick={onNavigateToSettings} className="gap-2">
                <Key className="h-4 w-4" />
                설정에서 API 키 확인하기
              </Button>
            ) : (
              <Button onClick={handleAnalyzeAIWithReset} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                다시 시도
              </Button>
            )}
          </div>
        </div>

        {/* 분석 이력 모달 */}
        {stockData && (
          <AnalysisHistory
            ticker={stockData.ticker}
            isOpen={historyOpen}
            onClose={() => setHistoryOpen(false)}
          />
        )}
      </div>
    );
  }

  // AI 분석 결과 표시
  if (aiAnalysis) {
    return (
      <div className="p-6 space-y-4">
        {/* 전체 보고서 카드 */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5" />
              AI 분석 (Gemini)
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHistoryOpen(true)}
                className="gap-2"
              >
                <History className="h-4 w-4" />
                이력 보기
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAnalyzeAIWithReset}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                재분석
              </Button>
            </div>
          </div>

          <div className="markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {aiAnalysis.report}
            </ReactMarkdown>
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
              {/* 요약 내용 */}
              <div className="space-y-2">
                {summary.summary.split('\n').map((line, idx) => (
                  <p key={idx} className="text-sm text-foreground flex items-start gap-2">
                    <span className="text-primary font-medium">{idx + 1}.</span>
                    {line}
                  </p>
                ))}
              </div>

              {/* 투자 전략 */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">투자 전략:</span>
                  <StrategyBadge strategy={summary.strategy} />
                </div>

                {/* 저장 버튼 */}
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

        {/* 분석 이력 모달 */}
        {stockData && (
          <AnalysisHistory
            ticker={stockData.ticker}
            isOpen={historyOpen}
            onClose={() => setHistoryOpen(false)}
          />
        )}
      </div>
    );
  }

  // 분석 시작 전 상태
  if (stockData) {
    return (
      <div className="p-3 sm:p-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">
              AI 분석 (Gemini)
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHistoryOpen(true)}
              className="gap-2"
            >
              <History className="h-4 w-4" />
              이력 보기
            </Button>
          </div>

          <div className="text-center py-12 space-y-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Play className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                AI 분석 준비 완료
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                <span className="font-medium text-foreground">{stockData.ticker}</span>에 대한
                AI 기반 투자 분석을 시작하려면 아래 버튼을 클릭하세요.
              </p>
            </div>
            <Button onClick={onAnalyzeAI} className="gap-2">
              <Play className="h-4 w-4" />
              AI 분석 시작
            </Button>
          </div>
        </div>

        {/* 분석 이력 모달 */}
        <AnalysisHistory
          ticker={stockData.ticker}
          isOpen={historyOpen}
          onClose={() => setHistoryOpen(false)}
        />
      </div>
    );
  }

  // 티커 미선택 상태
  return (
    <div className="p-3 sm:p-6">
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground mb-1">
            {tickerCount === 0
              ? 'No tickers added yet.'
              : 'No data loaded.'}
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
}
