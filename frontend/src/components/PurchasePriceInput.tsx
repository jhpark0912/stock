/**
 * 구매가 입력 컴포넌트
 * 사용자가 종목별 구매가를 입력하고 수정할 수 있는 인라인 입력 필드
 */

import { useState, useEffect } from 'react';
import { DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PurchasePriceInputProps {
  /** 티커 심볼 */
  ticker: string;
  /** 현재가 */
  currentPrice: number;
  /** 현재 구매가 (null이면 미입력) */
  purchasePrice: number | null;
  /** 구매가 업데이트 콜백 */
  onUpdate: (price: number | null) => void;
}

export default function PurchasePriceInput({
  ticker,
  currentPrice,
  purchasePrice,
  onUpdate,
}: PurchasePriceInputProps) {
  // 로컬 상태 (입력 중인 값)
  const [inputValue, setInputValue] = useState<string>(
    purchasePrice !== null ? purchasePrice.toString() : ''
  );
  const [isFocused, setIsFocused] = useState(false);

  // purchasePrice가 외부에서 변경되면 inputValue 동기화
  useEffect(() => {
    if (!isFocused) {
      setInputValue(purchasePrice !== null ? purchasePrice.toString() : '');
    }
  }, [purchasePrice, isFocused]);

  /**
   * 입력값 변경 핸들러
   * 숫자와 소수점만 입력 가능
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // 빈 값 허용 (구매가 삭제)
    if (value === '') {
      setInputValue('');
      return;
    }

    // 숫자와 소수점만 허용 (정규식: 숫자, 소수점 1개까지)
    const regex = /^\d*\.?\d*$/;
    if (regex.test(value)) {
      setInputValue(value);
    }
  };

  /**
   * 포커스 아웃 핸들러
   * 입력값을 숫자로 변환하여 저장
   */
  const handleBlur = () => {
    setIsFocused(false);

    // 빈 값이면 null로 저장 (구매가 삭제)
    if (inputValue.trim() === '') {
      onUpdate(null);
      setInputValue('');
      return;
    }

    // 숫자로 변환
    const numValue = parseFloat(inputValue);

    // 유효한 숫자가 아니면 이전 값으로 복원
    if (isNaN(numValue) || numValue <= 0) {
      setInputValue(purchasePrice !== null ? purchasePrice.toString() : '');
      return;
    }

    // 소수점 2자리까지 반올림하여 저장
    const roundedValue = Math.round(numValue * 100) / 100;
    onUpdate(roundedValue);
    setInputValue(roundedValue.toString());
  };

  /**
   * Enter 키로 저장, Esc 키로 취소
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur(); // 포커스 아웃으로 저장
    } else if (e.key === 'Escape') {
      // 이전 값으로 복원하고 포커스 해제
      setInputValue(purchasePrice !== null ? purchasePrice.toString() : '');
      e.currentTarget.blur();
    }
  };

  /**
   * "현재가로 설정" 버튼 클릭 핸들러
   */
  const handleSetCurrentPrice = () => {
    const roundedPrice = Math.round(currentPrice * 100) / 100;
    onUpdate(roundedPrice);
    setInputValue(roundedPrice.toString());
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        {/* 입력 필드 */}
        <div className="relative flex-1">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <DollarSign className="h-4 w-4" />
          </div>
          <input
            type="text"
            inputMode="decimal"
            placeholder="구매가 입력"
            className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={inputValue}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
          />
        </div>

        {/* 현재가로 설정 버튼 */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSetCurrentPrice}
          className="text-xs whitespace-nowrap"
        >
          현재가로 설정
        </Button>
      </div>

      {/* 힌트 텍스트 */}
      {!purchasePrice && (
        <p className="text-xs text-gray-400">
          구매가를 입력하면 수익률을 확인할 수 있습니다
        </p>
      )}
    </div>
  );
}
