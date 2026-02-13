/**
 * AnalysisHistory - AI 분석 이력 모달/패널
 */

import { useState, useEffect } from 'react';
import { X, Trash2, Calendar, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SavedAnalysis, InvestmentStrategy } from '@/types/stock';
import { getAnalysisHistory, deleteAnalysis } from '@/lib/analysisApi';

interface AnalysisHistoryProps {
  ticker: string;
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}

/**
 * 투자 전략 배지
 */
function StrategyBadge({ strategy }: { strategy: string }) {
  const strategyLower = strategy.toLowerCase() as InvestmentStrategy;

  const styles: Record<InvestmentStrategy, string> = {
    buy: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    hold: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    sell: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  const icons: Record<InvestmentStrategy, React.ReactNode> = {
    buy: <TrendingUp className="h-3 w-3" />,
    hold: <Minus className="h-3 w-3" />,
    sell: <TrendingDown className="h-3 w-3" />,
  };

  const labels: Record<InvestmentStrategy, string> = {
    buy: '매수',
    hold: '보유',
    sell: '매도',
  };

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${styles[strategyLower]}`}>
      {icons[strategyLower]}
      {labels[strategyLower]}
    </span>
  );
}

export function AnalysisHistory({ ticker, isOpen, onClose, onDeleted }: AnalysisHistoryProps) {
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && ticker) {
      loadHistory();
    }
  }, [isOpen, ticker]);

  const loadHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAnalysisHistory(ticker);
      setAnalyses(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '이력 조회 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('이 분석을 삭제하시겠습니까?')) return;

    setDeletingId(id);
    try {
      await deleteAnalysis(id);
      setAnalyses((prev) => prev.filter((a) => a.id !== id));
      onDeleted?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : '삭제 실패');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            분석 이력 - {ticker}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* 콘텐츠 */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              로딩 중...
            </div>
          ) : error ? (
            <div className="text-center py-8 text-destructive">
              {error}
            </div>
          ) : analyses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              저장된 분석이 없습니다.
            </div>
          ) : (
            analyses.map((analysis) => (
              <div
                key={analysis.id}
                className="bg-background border border-border rounded-lg p-4 hover:border-primary/50 transition-colors"
              >
                {/* 헤더 (날짜 + 전략 + 삭제) */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(analysis.created_at).toLocaleString('ko-KR', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                    <StrategyBadge strategy={analysis.strategy} />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(analysis.id)}
                    disabled={deletingId === analysis.id}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* 요약 */}
                <div className="space-y-1">
                  {analysis.summary.split('\n').map((line, idx) => (
                    <p key={idx} className="text-sm text-foreground">
                      • {line}
                    </p>
                  ))}
                </div>

                {/* 가격 정보 */}
                {(analysis.current_price || analysis.user_avg_price) && (
                  <div className="mt-3 pt-3 border-t border-border flex gap-4 text-xs text-muted-foreground">
                    {analysis.current_price && (
                      <span>분석 시 가격: ${analysis.current_price.toFixed(2)}</span>
                    )}
                    {analysis.user_avg_price && (
                      <span>평단가: ${analysis.user_avg_price.toFixed(2)}</span>
                    )}
                    {analysis.profit_loss_ratio !== null && (
                      <span className={analysis.profit_loss_ratio >= 0 ? 'text-success' : 'text-destructive'}>
                        {analysis.profit_loss_ratio >= 0 ? '+' : ''}{analysis.profit_loss_ratio.toFixed(1)}%
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
