/**
 * 매물 목록 사이드바 컴포넌트
 * 사용자가 등록한 매물 목록을 표시하고 관리
 */

import React, { useState } from 'react';
import { Plus, X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { UserTicker, ProfitInfo } from '../types/user';
import { calculateProfit, formatSimplePercent } from '../utils/profit';
import type { StockData } from '../types/stock';

interface TickerListSidebarProps {
  /** 사용자 매물 목록 */
  tickers: UserTicker[];
  /** 현재 선택된 매물 */
  selectedTicker: string | null;
  /** 현재 조회 중인 시장 데이터 (수익 계산용) */
  stockData: StockData | null;
  /** 매물 등록 핸들러 */
  onAddTicker: (symbol: string) => void;
  /** 매물 제거 핸들러 */
  onRemoveTicker: (symbol: string) => void;
  /** 매물 선택 핸들러 (조회) */
  onSelectTicker: (symbol: string) => void;
}

export const TickerListSidebar: React.FC<TickerListSidebarProps> = ({
  tickers,
  selectedTicker,
  stockData,
  onAddTicker,
  onRemoveTicker,
  onSelectTicker,
}) => {
  const [inputValue, setInputValue] = useState('');

  /**
   * 매물 등록 핸들러
   */
  const handleAdd = () => {
    const trimmed = inputValue.trim().toUpperCase();
    if (trimmed) {
      onAddTicker(trimmed);
      setInputValue(''); // 입력 필드 초기화
    }
  };

  /**
   * Enter 키 입력 시 매물 등록
   */
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  /**
   * 매물의 수익 계산 (있는 경우)
   */
  const getTickerProfit = (ticker: UserTicker): ProfitInfo | null => {
    // 구매가가 없으면 null
    if (ticker.purchasePrice === null) return null;

    // 현재 선택된 매물이고, stockData가 있으면 수익 계산
    if (ticker.symbol === selectedTicker && stockData) {
      return calculateProfit(ticker.purchasePrice, stockData.price.current);
    }

    // 선택되지 않은 매물은 수익 계산 불가
    return null;
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800">내 카테고리</h2>
      </div>

      {/* 매물 등록 입력 */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value.toUpperCase())}
            onKeyPress={handleKeyPress}
            placeholder="매물 입력 (예: AAPL)"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            maxLength={10}
          />
          <button
            onClick={handleAdd}
            disabled={!inputValue.trim()}
            className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            title="매물 등록"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 매물 목록 */}
      <div className="flex-1 overflow-y-auto">
        {tickers.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            <p>등록된 카테고리가 없습니다</p>
            <p className="mt-1 text-xs">위에서 매물을 등록해주세요</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {tickers.map((ticker) => {
              const isSelected = ticker.symbol === selectedTicker;
              const profit = getTickerProfit(ticker);

              return (
                <li
                  key={ticker.symbol}
                  className={`
                    group relative p-3 cursor-pointer transition-colors
                    ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : 'hover:bg-gray-50'}
                  `}
                  onClick={() => onSelectTicker(ticker.symbol)}
                >
                  <div className="flex items-center justify-between">
                    {/* 매물 심볼 */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${isSelected ? 'text-blue-700' : 'text-gray-800'}`}>
                          {ticker.symbol}
                        </span>
                        {isSelected && (
                          <span className="text-xs text-blue-600">●</span>
                        )}
                      </div>

                      {/* 수익률 표시 */}
                      {profit ? (
                        <div className={`text-sm mt-1 flex items-center gap-1 ${
                          profit.isProfit ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {profit.isProfit ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          <span className="font-medium">
                            {formatSimplePercent(profit)}
                          </span>
                        </div>
                      ) : ticker.purchasePrice === null ? (
                        <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <Minus className="w-3 h-3" />
                          <span>매입가 미입력</span>
                        </div>
                      ) : null}
                    </div>

                    {/* 삭제 버튼 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveTicker(ticker.symbol);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded-md"
                      title={`${ticker.symbol} 삭제`}
                      aria-label={`${ticker.symbol} 삭제`}
                    >
                      <X className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* 푸터 (매물 개수 표시) */}
      {tickers.length > 0 && (
        <div className="p-3 border-t border-gray-200 text-xs text-gray-500 text-center">
          {tickers.length}개 카테고리 추적 중
        </div>
      )}
    </div>
  );
};
