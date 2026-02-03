import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { AIAnalysis } from '../types/stock';
import { AlertCircle } from 'lucide-react';

interface StockAnalysisProps {
  analysis: AIAnalysis | null;
  error?: string | null;
}

const StockAnalysis = ({ analysis, error }: StockAnalysisProps) => {
  if (error) {
    return (
      <div className="flex items-center gap-2 text-destructive p-4 bg-destructive/5 rounded-lg border border-destructive/20">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm font-medium">{error}</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
          <p className="text-sm text-muted-foreground">AI 분석을 생성 중입니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="prose prose-lg max-w-none prose-headings:text-foreground prose-p:text-foreground/90 prose-strong:text-foreground prose-a:text-primary">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis.report}</ReactMarkdown>
    </div>
  );
};

export default StockAnalysis;
