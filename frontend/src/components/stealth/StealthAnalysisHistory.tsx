/**
 * StealthPortfolioPage - 분석 이력 인라인 패널
 */

import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { getAnalysisHistory, deleteAnalysis } from '@/lib/analysisApi';
import { NoteSection, strategyToLabel } from '@/components/stealth/StealthPortfolioComponents';
import type { SavedAnalysis } from '@/types/stock';

interface StealthAnalysisHistoryProps {
  ticker: string;
  onClose: () => void;
}

export function StealthAnalysisHistory({ ticker, onClose }: StealthAnalysisHistoryProps) {
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticker]);

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
    setDeletingId(id);
    try {
      await deleteAnalysis(id);
      setAnalyses((prev) => prev.filter((a) => a.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : '삭제 실패');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <NoteSection title="분석 이력">
      <div className="space-y-3">
        {loading ? (
          <p className="text-xs text-muted-foreground">불러오는 중...</p>
        ) : error ? (
          <p className="text-xs text-muted-foreground">{error}</p>
        ) : analyses.length === 0 ? (
          <p className="text-xs text-muted-foreground">저장된 이력이 없습니다.</p>
        ) : (
          analyses.map((analysis) => (
            <div key={analysis.id} className="border border-border rounded p-3 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {new Date(analysis.created_at).toLocaleString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                  {' / '}
                  {strategyToLabel(analysis.strategy)}
                </span>
                <button
                  onClick={() => handleDelete(analysis.id)}
                  disabled={deletingId === analysis.id}
                  className="p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-50"
                  title="삭제"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
              {analysis.summary.split('\n').map((line, idx) => (
                <p key={idx} className="text-sm text-foreground">
                  - {line}
                </p>
              ))}
              {analysis.current_price && (
                <p className="text-xs text-muted-foreground pt-1">
                  기록 시점: ${analysis.current_price.toFixed(2)}
                </p>
              )}
            </div>
          ))
        )}
        <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">
          닫기
        </button>
      </div>
    </NoteSection>
  );
}
