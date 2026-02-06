/**
 * 전체 레이아웃 구조
 * Header (상단 고정) + Sidebar (왼쪽, 토글 가능) + MainContent (메인)
 */

import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface AppLayoutProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  /** 헤더 우측에 표시할 추가 액션 버튼들 */
  headerActions?: React.ReactNode;
}

export function AppLayout({ sidebar, children, headerActions }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header - 상단 고정 */}
      <header className="flex-none z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-6">
          {/* 좌측: 햄버거 메뉴 + 타이틀 */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="h-9 w-9 rounded-lg hover:bg-muted transition-colors flex items-center justify-center"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? (
                <X className="h-5 w-5 text-foreground" />
              ) : (
                <Menu className="h-5 w-5 text-foreground" />
              )}
            </button>
            <h1 className="text-lg font-semibold text-foreground">Stock Dashboard</h1>
          </div>

          {/* 우측: 추가 액션 + 다크모드 토글 */}
          <div className="flex items-center gap-2">
            {headerActions}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content - Sidebar + Content (남은 공간 전체 사용) */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - 조건부 렌더링 */}
        <div
          className={`transition-all duration-300 ${
            sidebarOpen ? 'w-60' : 'w-0'
          } overflow-hidden`}
        >
          {sidebar}
        </div>

        {/* Main Content Area - 메인 영역만 스크롤 */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
