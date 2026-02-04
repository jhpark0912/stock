/**
 * Step 8: Sidebar (실제 로직 통합)
 * 티커 목록 상태 관리 + 추가/삭제/선택 기능
 */

import { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface Ticker {
  symbol: string;
  profitPercent: number;
}

interface SidebarProps {
  onTickerSelect?: (symbol: string) => void;
  onAddTicker?: (symbol: string) => void;
  onRemoveTicker?: (symbol: string) => void;
  initialTickers?: Ticker[];
  selectedTicker?: string;
}

export function Sidebar({
  onTickerSelect,
  onAddTicker,
  onRemoveTicker,
  initialTickers = [],
  selectedTicker: selectedTickerProp,
}: SidebarProps) {
  // 티커 목록 상태
  const [tickers, setTickers] = useState<Ticker[]>(initialTickers);

  // 선택된 티커 상태 (내부 상태와 외부 prop 동기화)
  const [selectedTicker, setSelectedTicker] = useState<string>(
    selectedTickerProp || (initialTickers.length > 0 ? initialTickers[0].symbol : '')
  );

  // 새 티커 입력 상태
  const [newTickerInput, setNewTickerInput] = useState<string>('');
  const [isAddingTicker, setIsAddingTicker] = useState<boolean>(false);

  // 티커 선택 핸들러
  const handleSelectTicker = (symbol: string) => {
    setSelectedTicker(symbol);
    onTickerSelect?.(symbol);
  };

  // 티커 추가 핸들러
  const handleAddTicker = () => {
    if (!newTickerInput.trim()) return;

    const symbol = newTickerInput.trim().toUpperCase();

    // 중복 체크
    if (tickers.some((t) => t.symbol === symbol)) {
      alert('이미 추가된 티커입니다.');
      return;
    }

    // 부모 컴포넌트에 알림 (있으면)
    onAddTicker?.(symbol);

    // 새 티커 추가 (임시로 profitPercent는 0)
    setTickers([...tickers, { symbol, profitPercent: 0 }]);
    setNewTickerInput('');
    setIsAddingTicker(false);
    setSelectedTicker(symbol);
    onTickerSelect?.(symbol);
  };

  // 티커 삭제 핸들러
  const handleDeleteTicker = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 버튼 클릭 시 선택 이벤트 막기

    // 부모 컴포넌트에 알림 (있으면)
    onRemoveTicker?.(symbol);

    const remainingTickers = tickers.filter((t) => t.symbol !== symbol);
    setTickers(remainingTickers);

    // 삭제된 티커가 선택되어 있었다면 첫 번째 티커 선택 (없으면 빈 문자열)
    if (selectedTicker === symbol) {
      if (remainingTickers.length > 0) {
        setSelectedTicker(remainingTickers[0].symbol);
        onTickerSelect?.(remainingTickers[0].symbol);
      } else {
        setSelectedTicker('');
      }
    }
  };

  // Enter 키 입력 핸들러
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddTicker();
    } else if (e.key === 'Escape') {
      setIsAddingTicker(false);
      setNewTickerInput('');
    }
  };

  return (
    <aside className="w-60 bg-card hidden lg:flex lg:flex-col h-full border-r border-border">
      {/* 헤더 - 고정 */}
      <div className="flex-none px-3 py-2 border-b border-border">
        <h2 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          MY TICKERS
        </h2>
      </div>

      {/* 추가 버튼 또는 입력 필드 - 고정 */}
      <div className="flex-none p-1.5">
        {!isAddingTicker ? (
          <button
            onClick={() => setIsAddingTicker(true)}
            className="w-full flex items-center justify-start gap-1 px-2.5 py-1 border-2 border-dashed border-border rounded-md text-[10px] font-medium text-muted-foreground hover:bg-primary/10 hover:border-primary hover:text-primary transition-all"
          >
            <Plus className="h-2.5 w-2.5" />
            Add Ticker
          </button>
        ) : (
          <div className="space-y-1">
            <input
              type="text"
              value={newTickerInput}
              onChange={(e) => setNewTickerInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="티커 입력 (예: MSFT)"
              className="w-full px-2.5 py-1 text-[10px] border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              autoFocus
            />
            <div className="flex gap-1">
              <button
                onClick={handleAddTicker}
                className="flex-1 px-2.5 py-1 bg-primary text-primary-foreground rounded-md text-[10px] font-medium hover:opacity-90 transition-opacity"
              >
                추가
              </button>
              <button
                onClick={() => {
                  setIsAddingTicker(false);
                  setNewTickerInput('');
                }}
                className="flex-1 px-2.5 py-1 bg-secondary text-secondary-foreground rounded-md text-[10px] font-medium hover:opacity-90 transition-opacity"
              >
                취소
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 티커 리스트 - 스크롤 가능 영역 */}
      <div className="flex-1 overflow-y-auto">
        {tickers.length === 0 ? (
          <div className="px-3 py-3 text-center">
            <p className="text-[10px] text-muted-foreground">
              No tickers added yet.
            </p>
            <p className="text-[9px] text-muted-foreground mt-0.5">
              Click "Add Ticker" above.
            </p>
          </div>
        ) : (
          tickers.map((ticker) => (
            <div
              key={ticker.symbol}
              onClick={() => handleSelectTicker(ticker.symbol)}
              className={`w-full px-2.5 py-1.5 cursor-pointer transition-all duration-200 relative group ${
                ticker.symbol === selectedTicker
                  ? 'bg-primary/10 text-primary border-l-2 border-primary'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">{ticker.symbol}</span>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[10px] font-semibold ${
                      ticker.profitPercent > 0 ? 'text-success' : 'text-destructive'
                    }`}
                  >
                    {ticker.profitPercent > 0 ? '+' : ''}
                    {ticker.profitPercent.toFixed(1)}%
                  </span>
                  {/* 삭제 버튼 (hover 시 표시) */}
                  <button
                    onClick={(e) => handleDeleteTicker(ticker.symbol, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-destructive/10 rounded"
                    aria-label={`Delete ${ticker.symbol}`}
                  >
                    <X className="h-2.5 w-2.5 text-destructive" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
