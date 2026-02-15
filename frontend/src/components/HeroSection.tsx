import { useState } from 'react';
import { TrendingUp, TrendingDown, Pencil, Check, X } from 'lucide-react';
import { calculateProfit, formatCurrency, formatLargeCurrency, isKoreanTicker } from '../lib/utils';

interface HeroSectionProps {
  ticker?: string;
  companyName?: string;
  displayName?: string | null;
  currentPrice?: number;
  priceChange?: number;
  priceChangePercent?: number;
  marketCap?: string;
  sector?: string;
  purchasePrice?: number | null;
  quantity?: number | null;
  hasData?: boolean;
  onUpdateDisplayName?: (displayName: string | null) => void;
}

export function HeroSection({
  ticker,
  companyName,
  displayName,
  currentPrice = 0,
  priceChange = 0,
  priceChangePercent = 0,
  marketCap,
  sector,
  purchasePrice,
  quantity,
  hasData = false,
  onUpdateDisplayName,
}: HeroSectionProps) {
  const isPositive = priceChange >= 0;

  // 한글 이름 편집 상태
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(displayName || '');

  // 편집 시작
  const handleStartEdit = () => {
    setNameInput(displayName || '');
    setIsEditingName(true);
  };

  // 저장
  const handleSaveName = () => {
    const trimmedName = nameInput.trim();
    onUpdateDisplayName?.(trimmedName || null);
    setIsEditingName(false);
  };

  // 취소
  const handleCancelEdit = () => {
    setNameInput(displayName || '');
    setIsEditingName(false);
  };

  // Enter/Escape 키 처리
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // 평가손익 계산
  const profitInfo = calculateProfit(purchasePrice || null, currentPrice, quantity || null);

  // 데이터가 없을 때: 간단한 메시지만 표시
  if (!hasData) {
    return (
      <div className="border-b border-border bg-card">
        <div className="px-3 sm:px-6 py-4 sm:py-8 text-center">
          <h1 className="text-lg sm:text-xl font-semibold text-foreground mb-1 sm:mb-2">
            카테고리를 선택하세요
          </h1>
          <p className="text-sm text-muted-foreground">
            사이드바에서 매물을 선택하거나 새로운 카테고리를 추가해주세요
          </p>
        </div>
      </div>
    );
  }

  // 데이터가 있을 때: 기존 UI 표시
  return (
    <div className="border-b border-border bg-card">
      <div className="px-3 sm:px-6 py-2 sm:py-3">
        {/* 모바일: 한 줄 레이아웃 */}
        <div className="sm:hidden">
          {/* 첫 줄: 이름 + 가격 + 변동률 */}
          <div className="flex items-center justify-between mb-0.5">
            {isEditingName ? (
              <div className="flex items-center gap-1.5 flex-1 mr-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="이름 (예: 애플)"
                  className="flex-1 px-2 py-0.5 text-sm border border-border rounded bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="p-1 hover:bg-success/10 rounded transition-colors"
                  aria-label="저장"
                >
                  <Check className="h-3.5 w-3.5 text-success" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-1 hover:bg-destructive/10 rounded transition-colors"
                  aria-label="취소"
                >
                  <X className="h-3.5 w-3.5 text-destructive" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <h1 className="text-base font-bold text-foreground truncate">
                  {displayName || companyName || 'N/A'}
                </h1>
                <button
                  onClick={handleStartEdit}
                  className="p-0.5 hover:bg-muted rounded transition-colors flex-shrink-0"
                  aria-label="이름 편집"
                >
                  <Pencil className="h-3 w-3 text-muted-foreground hover:text-primary" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-lg font-bold text-foreground">
                {formatCurrency(currentPrice || 0, ticker)}
              </span>
              <span
                className={`text-xs font-semibold ${
                  isPositive ? 'text-success' : 'text-destructive'
                }`}
              >
                {isPositive ? '+' : ''}{(priceChangePercent || 0).toFixed(2)}%
              </span>
            </div>
          </div>
          {/* 둘째 줄: 티커 */}
          <p className="text-[11px] text-muted-foreground">{ticker || 'N/A'}</p>
        </div>

        {/* 데스크톱: 기존 레이아웃 */}
        <div className="hidden sm:block">
          {/* 이름 (첫째 줄) + 티커 (둘째 줄) */}
          <div className="mb-2">
            {isEditingName ? (
              <div className="flex items-center gap-2 mb-1">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="이름 (예: 애플)"
                  className="w-48 px-2 py-1 text-lg font-bold border border-border rounded bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                />
                <button
                  onClick={handleSaveName}
                  className="p-1 hover:bg-success/10 rounded transition-colors"
                  aria-label="저장"
                >
                  <Check className="h-4 w-4 text-success" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="p-1 hover:bg-destructive/10 rounded transition-colors"
                  aria-label="취소"
                >
                  <X className="h-4 w-4 text-destructive" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-bold text-foreground">
                  {displayName || companyName || 'N/A'}
                </h1>
                <button
                  onClick={handleStartEdit}
                  className="p-0.5 hover:bg-muted rounded transition-colors"
                  aria-label="이름 편집"
                >
                  <Pencil className="h-3.5 w-3.5 text-muted-foreground hover:text-primary" />
                </button>
              </div>
            )}
            <p className="text-sm text-muted-foreground">{ticker || 'N/A'}</p>
          </div>

          {/* Current Price */}
          <div className="flex items-baseline gap-4 mb-2">
            <span className="text-3xl font-bold text-foreground">
              {formatCurrency(currentPrice || 0, ticker)}
            </span>
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md ${
                isPositive
                  ? 'bg-success/10 text-success'
                  : 'bg-destructive/10 text-destructive'
              }`}
            >
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span className="text-sm font-semibold">
                {isPositive ? '+' : ''}
                {isKoreanTicker(ticker) ? Math.round(priceChange || 0).toLocaleString('ko-KR') : (priceChange || 0).toFixed(2)} ({(priceChangePercent || 0).toFixed(2)}%)
              </span>
            </div>
          </div>

          {/* Market Cap + Sector */}
          <div className="flex gap-4 text-xs text-muted-foreground">
            <div>
              <span className="font-medium">Market Cap: </span>
              <span>{marketCap}</span>
            </div>
            <div className="h-3 w-px bg-border" />
            <div>
              <span className="font-medium">Sector: </span>
              <span>{sector}</span>
            </div>
          </div>
        </div>

        {/* 평단가 정보 (있을 경우에만 표시) */}
        {profitInfo && (
          <div className="mt-1.5 sm:mt-3 pt-1.5 sm:pt-3 border-t border-border">
            {/* 모바일: 간소화된 레이아웃 */}
            <div className="sm:hidden">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">
                  평단 {formatCurrency(profitInfo.purchasePrice, ticker)} × {profitInfo.quantity.toLocaleString()}주
                </span>
                <span
                  className={`font-bold ${
                    profitInfo.isProfit ? 'text-success' : 'text-destructive'
                  }`}
                >
                  {profitInfo.profitPercent > 0 ? '+' : ''}{profitInfo.profitPercent.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* 데스크톱: 기존 상세 레이아웃 */}
            <div className="hidden sm:block">
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-medium">평단가:</span>
                  <span className="text-foreground font-semibold">
                    {formatCurrency(profitInfo.purchasePrice, ticker)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-medium">보유 수량:</span>
                  <span className="text-foreground font-semibold">
                    {profitInfo.quantity.toLocaleString()}주
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-medium">매입금액:</span>
                  <span className="text-foreground font-semibold">
                    {formatLargeCurrency(profitInfo.totalPurchaseAmount, ticker)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-medium">평가금액:</span>
                  <span className="text-foreground font-semibold">
                    {formatLargeCurrency(profitInfo.totalCurrentAmount, ticker)}
                  </span>
                </div>
                <div className="flex items-center gap-2 col-span-2 pt-1 border-t border-border/50">
                  <span className="text-muted-foreground font-medium">총 평가손익:</span>
                  <span
                    className={`text-lg font-bold ${
                      profitInfo.isProfit ? 'text-success' : 'text-destructive'
                    }`}
                  >
                    {profitInfo.totalProfitAmount > 0 ? '+' : ''}
                    {formatLargeCurrency(Math.abs(profitInfo.totalProfitAmount), ticker)}
                    {' '}
                    ({profitInfo.profitPercent > 0 ? '+' : ''}{profitInfo.profitPercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
