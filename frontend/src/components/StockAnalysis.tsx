import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { AIAnalysis } from '../types/stock';

interface StockAnalysisProps {
  analysis: AIAnalysis | null;
  error: string | null;
}

const StockAnalysis = ({ analysis, error }: StockAnalysisProps) => {
  if (error) {
    return (
      <div className="w-full max-w-4xl p-6 mt-6 bg-red-50 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-red-800 mb-4">AI 분석 오류</h2>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!analysis) {
    return null; // 분석 결과가 없으면 아무것도 렌더링하지 않음
  }

  return (
    <div className="w-full max-w-4xl p-6 mt-6 bg-gray-50 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Gemini AI 종합 분석</h2>
      <div className="prose prose-lg max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis.report}</ReactMarkdown>
      </div>
    </div>
  );
};

export default StockAnalysis;
