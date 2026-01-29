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
      <div className="flex items-center gap-2 text-red-600">
        <AlertCircle className="w-4 h-4" />
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">AI 분석을 생성 중입니다...</p>
      </div>
    );
  }

  return (
    <div className="prose prose-sm max-w-none text-gray-700">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis.report}</ReactMarkdown>
    </div>
  );
};

export default StockAnalysis;
