/**
 * 매입가 입력 컴포넌트
 * 사용자가 카테고리별 매입가를 입력하고 수정할 수 있는 인라인 입력 필드
 */

import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PurchasePriceInputProps {
  /** 매물 심볼 */
  ticker: string;
  /** 현재 시세 */
  currentPrice: number;
  /** 현재 매입가 (null이면 미입력) */
  purchasePrice: number | null;
  /** 매입가 업데이트 콜백 */
  onUpdate: (price: number | null) => void;
}

export default function PurchasePriceInput({
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

    // 빈 값 허용 (매입가 삭제)
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

    // 빈 값이면 null로 저장 (매입가 삭제)
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
   * "현재 시세로 설정" 버튼 클릭 핸들러
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
        <Input
          type="text"
          inputMode="decimal"
          placeholder="$0.00"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsFocused(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />

        {/* 현재 시세로 설정 버튼 */}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSetCurrentPrice}
        >
          현재가
        </Button>
      </div>

      {!purchasePrice && (
        <p className="text-xs text-muted-foreground">
          매입가를 입력하면 수익률이 표시됩니다
        </p>
      )}
    </div>
  );
}
