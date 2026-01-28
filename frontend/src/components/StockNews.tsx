import type { NewsItem } from '../types/stock';

// 날짜 포맷팅 함수
const formatDate = (dateString: string | null) => {
  if (!dateString) return '날짜 정보 없음';
  try {
    const date = new Date(dateString);
    // 간단한 'YYYY-MM-DD HH:mm' 형식
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date);
  } catch (e) {
    console.error('Invalid date format:', dateString);
    return '날짜 형식 오류';
  }
};


const StockNews = ({ news }: { news: NewsItem[] }) => {
  return (
    <div className="w-full max-w-4xl p-6 bg-white rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">관련 뉴스</h2>
      </div>

      {!news || news.length === 0 ? (
        <p className="text-gray-500">이 종목에 대한 최신 뉴스가 없습니다.</p>
      ) : (
        <div className="space-y-4">
          {news.map((item, index) => (
            <a
              key={index}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-colors duration-200 rounded-md"
            >
              <h3 className="text-lg font-semibold text-blue-600 hover:underline mb-1">
                {item.title}
              </h3>
              <div className="text-sm text-gray-500 flex items-center space-x-4">
                <span>{item.source || '출처 없음'}</span>
                <span>·</span>
                <span>{formatDate(item.published_at)}</span>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default StockNews;
