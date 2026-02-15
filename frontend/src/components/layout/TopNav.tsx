/**
 * TopNav - 상단 네비게이션 컴포넌트
 * 페이지 전환 + 사용자 정보 + 로그아웃
 */

import { useState } from 'react';
import { Globe, Briefcase, Settings, Shield, LogOut, User, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { ThemeToggle } from '../ThemeToggle';

// 페이지 타입 정의
export type PageType = 'economic' | 'portfolio' | 'settings' | 'admin';

interface PageConfig {
  id: PageType;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const pageConfigs: PageConfig[] = [
  { id: 'economic', label: 'Economic', icon: <Globe className="h-4 w-4" /> },
  { id: 'portfolio', label: 'Portfolio', icon: <Briefcase className="h-4 w-4" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
  { id: 'admin', label: 'Admin', icon: <Shield className="h-4 w-4" />, adminOnly: true },
];

interface TopNavProps {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
  isAdmin?: boolean;
  username?: string;
  onLogout?: () => void;
}

export function TopNav({
  currentPage,
  onPageChange,
  isAdmin = false,
  username = 'User',
  onLogout,
}: TopNavProps) {
  // 모바일 메뉴 토글 상태
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const visiblePages = pageConfigs.filter((page) => !page.adminOnly || isAdmin);

  return (
    <header className="h-14 flex-none border-b border-border bg-card flex items-center justify-between px-2 sm:px-4 md:px-6 relative">
      {/* 좌측: 로고 + 네비게이션 */}
      <div className="flex items-center gap-1 sm:gap-4 md:gap-8 flex-shrink-0">
        {/* 모바일 햄버거 메뉴 */}
        <button
          className="md:hidden p-1.5 sm:p-2 rounded-md hover:bg-muted transition-colors flex-shrink-0"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="메뉴 열기"
        >
          {mobileMenuOpen ? (
            <X className="h-5 w-5 text-foreground" />
          ) : (
            <Menu className="h-5 w-5 text-foreground" />
          )}
        </button>

        {/* 로고 */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <div className="h-6 w-6 sm:h-8 sm:w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-[10px] sm:text-sm">RD</span>
          </div>
          <span className="hidden sm:inline font-semibold text-lg">Rice Digger</span>
        </div>

        {/* 네비게이션 탭 - 데스크탑 */}
        <nav className="hidden md:flex items-center gap-1">
          {visiblePages.map((page) => (
            <button
              key={page.id}
              onClick={() => onPageChange(page.id)}
              className={cn(
                'flex items-center gap-2 px-3 lg:px-4 py-2 rounded-md text-sm font-medium transition-all',
                currentPage === page.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {page.icon}
              <span className="hidden lg:inline">{page.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* 우측: 테마 토글 + 사용자 정보 + 로그아웃 */}
      <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
        {/* 테마 토글 */}
        <ThemeToggle />

        {/* 구분선 - md 이상에서만 표시 */}
        <div className="hidden md:block h-6 w-px bg-border" />

        {/* 사용자 정보 - md 이상에서만 표시 */}
        <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span>{username}</span>
        </div>

        {/* 로그아웃 버튼 */}
        <Button
          variant="outline"
          size="sm"
          className="gap-1 px-1.5 sm:px-3 h-8"
          onClick={onLogout}
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">로그아웃</span>
        </Button>
      </div>

      {/* 모바일 드롭다운 메뉴 */}
      {mobileMenuOpen && (
        <div className="absolute top-14 left-0 right-0 z-50 bg-card border-b border-border shadow-lg md:hidden">
          <nav className="flex flex-col p-2">
            {visiblePages.map((page) => (
              <button
                key={page.id}
                onClick={() => {
                  onPageChange(page.id);
                  setMobileMenuOpen(false);
                }}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all',
                  currentPage === page.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                {page.icon}
                {page.label}
              </button>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
