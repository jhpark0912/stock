/**
 * 스텔스 모드 Context
 * 주식 대시보드를 메모/노트 앱 UI로 위장
 * ThemeProvider 패턴 따름 - localStorage 기반 상태 유지
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

type StealthProviderState = {
  stealthMode: boolean;
  toggleStealth: () => void;
};

const STORAGE_KEY = 'stock-stealth-mode';

const StealthContext = createContext<StealthProviderState | undefined>(undefined);

export function StealthProvider({ children }: { children: React.ReactNode }) {
  const [stealthMode, setStealthMode] = useState<boolean>(
    () => localStorage.getItem(STORAGE_KEY) === 'true'
  );

  // document.title 동기화
  useEffect(() => {
    if (stealthMode) {
      document.title = '내 메모';
    } else {
      document.title = 'Rice Digger';
    }
  }, [stealthMode]);

  const toggleStealth = useCallback(() => {
    setStealthMode(prev => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  return (
    <StealthContext.Provider value={{ stealthMode, toggleStealth }}>
      {children}
    </StealthContext.Provider>
  );
}

export const useStealthMode = () => {
  const context = useContext(StealthContext);
  if (context === undefined) {
    throw new Error('useStealthMode must be used within a StealthProvider');
  }
  return context;
};
