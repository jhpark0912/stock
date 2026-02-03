import type { NewsItem } from '../types/stock';
import { Newspaper, ExternalLink } from 'lucide-react';


// 날짜 포맷팅 함수
const formatDate = (dateString: string | null) => {
  if (!dateString) return '날짜 정보 없음';
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  } catch (e) {
    return '날짜 형식 오류';
  }
};

interface StockNewsProps {
  news: NewsItem[] | null;
  compact?: boolean;
}

const StockNews = ({ news, compact = false }: StockNewsProps) => {

  // Main content renderer
  const renderContent = () => {
    if (!news || news.length === 0) {
      return <p className="text-sm text-muted-foreground">관련 뉴스가 없습니다.</p>;
    }

    return (
      <div className={compact ? "space-y-2" : "space-y-3"}>
        {news.map((item, index) => (
          <a
            key={index}
            href={item.link}
            target="_blank"
            rel="noopener noreferrer"
            className={`block p-3 border border-border rounded-lg hover:border-primary hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group ${compact ? 'bg-background/50' : ''}`}
          >
            <div className="flex items-start justify-between gap-2">
              <h4 className={`text-sm font-medium text-foreground group-hover:text-primary flex-1 ${compact ? 'line-clamp-2' : ''}`}>
                {item.title}
              </h4>
              <ExternalLink className="w-3 h-3 text-muted-foreground flex-shrink-0 mt-0.5" />
            </div>
            <div className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
              <span className="font-medium">{item.source || '출처 없음'}</span>
              <span>·</span>
              <span>{formatDate(item.published_at)}</span>
            </div>
          </a>
        ))}
      </div>
    );
  };
  
  // Compact version for the main dashboard
  if (compact) {
    return (
      <div className="bg-card/50 rounded-2xl p-8">
        <div className="flex items-center gap-3 mb-6">
          <Newspaper className="h-6 w-6 text-primary" />
          <h3 className="text-2xl font-bold">관련 뉴스</h3>
        </div>
        {renderContent()}
      </div>
    );
  }

  // Full-size version (e.g., for a dedicated news page)
  return (
    <div className="w-full max-w-6xl bg-card/50 rounded-2xl p-8">
      <div className="flex items-center gap-3 mb-4">
        <Newspaper className="h-6 w-6 text-primary" />
        <div>
          <h3 className="text-2xl font-bold">관련 뉴스</h3>
          <p className="text-sm text-muted-foreground">이 카테고리와 관련된 최신 뉴스 목록입니다.</p>
        </div>
      </div>
      {renderContent()}
    </div>
  );
};

export default StockNews;
