import { useState } from 'react';
import { Search } from 'lucide-react';

interface StockSearchProps {
  onSearch: (ticker: string) => void;
  isLoading?: boolean;
}

export default function StockSearch({ onSearch, isLoading = false }: StockSearchProps) {
  const [ticker, setTicker] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticker.trim()) {
      onSearch(ticker.trim().toUpperCase());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-lg">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            placeholder="종목 코드 입력 (예: AAPL, TSLA)"
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !ticker.trim()}
          className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors shadow-sm"
        >
          {isLoading ? '검색 중...' : '검색'}
        </button>
      </div>
    </form>
  );
}
