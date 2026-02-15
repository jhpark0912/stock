/**
 * Step 8: Sidebar (실제 로직 통합)
 * 티커 목록 상태 관리 + 추가/삭제/선택 기능 + 평단가 입력
 */

import { useState, useEffect } from 'react';
import { Plus, X, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserTicker } from '../types/user';

// Sidebar에서 사용하는 Ticker 타입은 UserTicker를 그대로 사용

interface SidebarProps {
  onTickerSelect?: (symbol: string) => void;
  onAddTicker?: (symbol: string) => void;
  onRemoveTicker?: (symbol: string) => void;
  onUpdatePurchasePrice?: (symbol: string, price: number | null, quantity: number | null) => void;
  initialTickers?: UserTicker[];
  selectedTicker?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({
  onTickerSelect,
  onAddTicker,
  onRemoveTicker,
  onUpdatePurchasePrice,
  initialTickers = [],
  selectedTicker: selectedTickerProp,
  isOpen = true,
  onClose,
}: SidebarProps) {
  // 티커 목록 상태
  const [tickers, setTickers] = useState<UserTicker[]>(initialTickers);

  // 선택된 티커 상태 (내부 상태와 외부 prop 동기화)
  const [selectedTicker, setSelectedTicker] = useState<string>(
    selectedTickerProp || (initialTickers.length > 0 ? initialTickers[0].symbol : '')
  );

  // initialTickers가 변경될 때마다 상태 업데이트
  useEffect(() => {
    setTickers(initialTickers);
  }, [initialTickers]);

  // selectedTickerProp이 변경될 때마다 상태 업데이트
  useEffect(() => {
    if (selectedTickerProp) {
      setSelectedTicker(selectedTickerProp);
    }
  }, [selectedTickerProp]);

  // 새 티커 입력 상태
  const [newTickerInput, setNewTickerInput] = useState<string>('');
  const [isAddingTicker, setIsAddingTicker] = useState<boolean>(false);

  // 평단가 및 수량 편집 상태
  const [editingTicker, setEditingTicker] = useState<string | null>(null);
  const [purchasePriceInput, setPurchasePriceInput] = useState<string>('');
  const [quantityInput, setQuantityInput] = useState<string>('');

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

    // 부모 컴포넌트에 알림 (부모가 상태를 업데이트하고, props를 통해 다시 전달됨)
    onAddTicker?.(symbol);

    // 입력 필드 초기화
    setNewTickerInput('');
    setIsAddingTicker(false);

    // 선택 상태는 즉시 업데이트 (UX 개선)
    setSelectedTicker(symbol);
    onTickerSelect?.(symbol);
  };

  // 티커 삭제 핸들러
  const handleDeleteTicker = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 버튼 클릭 시 선택 이벤트 막기

    // 부모 컴포넌트에 알림 (부모가 상태를 업데이트함)
    onRemoveTicker?.(symbol);

    // 삭제된 티커가 선택되어 있었다면 선택 해제 (부모가 처리하지만 즉시 반영)
    if (selectedTicker === symbol) {
      const remainingTickers = tickers.filter((t) => t.symbol !== symbol);
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

  // 평단가 및 수량 편집 시작
  const handleStartEditPrice = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTicker(symbol);
    
    // 기존 값 불러오기
    const ticker = tickers.find(t => t.symbol === symbol);
    setPurchasePriceInput(ticker?.purchasePrice?.toString() || '');
    setQuantityInput(ticker?.quantity?.toString() || '');
  };

  // 평단가 및 수량 저장
  const handleSavePurchasePrice = (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const price = purchasePriceInput.trim() === ''
      ? null
      : parseFloat(purchasePriceInput);

    const quantity = quantityInput.trim() === ''
      ? null
      : parseInt(quantityInput, 10);

    if (price !== null && isNaN(price)) {
      alert('유효한 가격을 입력하세요.');
      return;
    }

    if (quantity !== null && (isNaN(quantity) || quantity <= 0)) {
      alert('유효한 수량을 입력하세요 (양수).');
      return;
    }

    onUpdatePurchasePrice?.(symbol, price, quantity);
    setEditingTicker(null);
    setPurchasePriceInput('');
    setQuantityInput('');
  };

  // 평단가 입력 Enter 핸들러
  const handlePriceKeyPress = (symbol: string, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSavePurchasePrice(symbol, e as any);
    } else if (e.key === 'Escape') {
      setEditingTicker(null);
      setPurchasePriceInput('');
      setQuantityInput('');
    }
  };

  return (
    <>
      {/* 백드롭 오버레이 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* 사이드바 */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 sm:w-72 bg-card border-r border-border",
          "flex flex-col h-full",
          "transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* 헤더 - 고정 */}
        <div className="flex-none px-3 py-2 border-b border-border flex items-center justify-between">
          <h2 className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            MY TICKERS
          </h2>
          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-muted transition-colors"
            aria-label="사이드바 닫기"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
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
              {/* 티커 정보 행 */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-medium">{ticker.displayName || ticker.symbol}</span>
                  {ticker.displayName && (
                    <span className="text-[10px] text-muted-foreground">{ticker.symbol}</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {/* 수익률 표시 */}
                  <span
                    className={`text-[10px] font-semibold ${
                      ticker.profitPercent === undefined
                        ? 'text-muted-foreground'
                        : ticker.profitPercent === null
                        ? 'text-muted-foreground'
                        : ticker.profitPercent > 0
                        ? 'text-success'
                        : ticker.profitPercent < 0
                        ? 'text-destructive'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {ticker.profitPercent === undefined
                      ? '-'
                      : ticker.profitPercent === null
                      ? 'Set Price'
                      : `${ticker.profitPercent > 0 ? '+' : ''}${ticker.profitPercent.toFixed(1)}%`}
                  </span>

                  {/* 평단가 편집 버튼 (모바일: 항상 표시, 데스크톱: hover 시 표시) */}
                  <button
                    onClick={(e) => handleStartEditPrice(ticker.symbol, e)}
                    className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1 sm:p-0.5 hover:bg-primary/10 rounded"
                    aria-label={`Edit purchase price for ${ticker.symbol}`}
                  >
                    <Edit2 className="h-3 w-3 sm:h-2.5 sm:w-2.5 text-primary" />
                  </button>

                  {/* 삭제 버튼 (모바일: 항상 표시, 데스크톱: hover 시 표시) */}
                  <button
                    onClick={(e) => handleDeleteTicker(ticker.symbol, e)}
                    className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-1 sm:p-0.5 hover:bg-destructive/10 rounded"
                    aria-label={`Delete ${ticker.symbol}`}
                  >
                    <X className="h-3 w-3 sm:h-2.5 sm:w-2.5 text-destructive" />
                  </button>
                </div>
              </div>

              {/* 평단가 및 수량 입력 UI (편집 중일 때만 표시) */}
              {editingTicker === ticker.symbol && (
                <div className="mt-1.5 space-y-1.5 sm:space-y-1" onClick={(e) => e.stopPropagation()}>
                  {/* 평단가 입력 */}
                  <input
                    type="number"
                    value={purchasePriceInput}
                    onChange={(e) => setPurchasePriceInput(e.target.value)}
                    onKeyDown={(e) => handlePriceKeyPress(ticker.symbol, e)}
                    placeholder="평단가 (USD)"
                    className="w-full px-2 sm:px-1.5 py-1.5 sm:py-0.5 text-xs sm:text-[10px] border border-border rounded bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    autoFocus
                  />
                  {/* 수량 입력 */}
                  <input
                    type="number"
                    value={quantityInput}
                    onChange={(e) => setQuantityInput(e.target.value)}
                    onKeyDown={(e) => handlePriceKeyPress(ticker.symbol, e)}
                    placeholder="수량"
                    min="1"
                    step="1"
                    className="w-full px-2 sm:px-1.5 py-1.5 sm:py-0.5 text-xs sm:text-[10px] border border-border rounded bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  {/* 버튼 그룹 */}
                  <div className="flex items-center gap-1.5 sm:gap-1">
                    <button
                      onClick={(e) => handleSavePurchasePrice(ticker.symbol, e)}
                      className="flex-1 px-2 sm:px-1.5 py-1.5 sm:py-0.5 bg-primary text-primary-foreground rounded text-xs sm:text-[10px] font-medium hover:opacity-90"
                    >
                      저장
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingTicker(null);
                        setPurchasePriceInput('');
                        setQuantityInput('');
                      }}
                      className="flex-1 px-2 sm:px-1.5 py-1.5 sm:py-0.5 bg-secondary text-secondary-foreground rounded text-xs sm:text-[10px] font-medium hover:opacity-90"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      </aside>
    </>
  );
}
