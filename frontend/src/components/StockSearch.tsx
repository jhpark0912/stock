import { useState } from 'react';

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
    <form onSubmit={handleSubmit} className="w-full max-w-md">
      <div className="flex gap-2">
        <input
          type="text"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          placeholder="티커 입력 (예: AAPL, TSLA)"
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !ticker.trim()}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? '검색 중...' : '검색'}
        </button>
      </div>
    </form>
  );
}
