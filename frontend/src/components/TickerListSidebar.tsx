/**
 * 매물 목록 사이드바 컴포넌트
 * 사용자가 등록한 매물 목록을 표시하고 관리
 */

import React, { useState, useEffect } from 'react';
import { Plus, X, TrendingUp, TrendingDown, Minus, Menu, ChevronLeft } from 'lucide-react';
import type { UserTicker, ProfitInfo } from '../types/user';
import { calculateProfit, formatSimplePercent } from '../utils/profit';
import type { StockData } from '../types/stock';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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
  const [isOpen, setIsOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // localStorage에 상태 저장
  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(isOpen));
  }, [isOpen]);

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
    <div className={`bg-card border-r border-border flex flex-col h-full transition-all duration-300 ${
      isOpen ? 'w-64' : 'w-16'
    }`}>
      {/* 헤더 */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        {isOpen ? (
          <>
            <h2 className="text-lg font-semibold">내 카테고리</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(true)}
            className="h-8 w-8 mx-auto"
          >
            <Menu className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* 매물 등록 입력 (펼쳐진 상태만) */}
      {isOpen && (
        <div className="p-4 border-b border-border">
          <div className="flex gap-2">
            <Input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value.toUpperCase())}
              onKeyPress={handleKeyPress}
              placeholder="매물 입력"
              maxLength={10}
            />
            <Button
              onClick={handleAdd}
              disabled={!inputValue.trim()}
              size="icon"
              aria-label="매물 등록"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* 매물 목록 */}
      <div className="flex-1 overflow-y-auto">
        {tickers.length === 0 ? (
          isOpen ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              <p>등록된 카테고리가 없습니다</p>
              <p className="mt-1 text-xs">위에서 매물을 등록해주세요</p>
            </div>
          ) : null
        ) : (
          <ul className={isOpen ? "divide-y divide-border" : ""}>
            {tickers.map((ticker) => {
              const isSelected = ticker.symbol === selectedTicker;
              const profit = getTickerProfit(ticker);

              // 접힌 상태 UI
              if (!isOpen) {
                return (
                  <li
                    key={ticker.symbol}
                    className={`
                      p-2 cursor-pointer transition-all text-center
                      ${isSelected ? 'bg-primary/10 border-l-2 border-primary' : 'hover:bg-muted'}
                    `}
                    onClick={() => onSelectTicker(ticker.symbol)}
                    title={ticker.symbol}
                  >
                    <span className={`text-sm font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                      {ticker.symbol[0]}
                    </span>
                  </li>
                );
              }

              // 펼쳐진 상태 UI
              return (
                <li
                  key={ticker.symbol}
                  className={`
                    group relative p-3 cursor-pointer transition-all
                    ${isSelected ? 'bg-primary/5 border-l-2 border-primary' : 'hover:bg-muted'}
                  `}
                  onClick={() => onSelectTicker(ticker.symbol)}
                >
                  <div className="flex items-center justify-between">
                    {/* 매물 심볼 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                          {ticker.symbol}
                        </span>
                        {isSelected && (
                          <span className="text-xs text-primary">●</span>
                        )}
                      </div>

                      {/* 수익률 표시 */}
                      {profit ? (
                        <div className={`text-sm mt-1 flex items-center gap-1 ${
                          profit.isProfit ? 'text-success' : 'text-destructive'
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
                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
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
                      className="opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-destructive/10 rounded-md active:scale-95"
                      title={`${ticker.symbol} 삭제`}
                      aria-label={`${ticker.symbol} 삭제`}
                    >
                      <X className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* 푸터 (매물 개수 표시) */}
      {tickers.length > 0 && isOpen && (
        <div className="p-3 border-t border-border text-xs text-muted-foreground text-center">
          {tickers.length}개 카테고리 추적 중
        </div>
      )}
    </div>
  );
};
