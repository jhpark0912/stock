/**
 * TopNav - 상단 네비게이션 컴포넌트
 * 페이지 전환 + 사용자 정보 + 로그아웃
 */

import { Globe, Briefcase, Settings, Shield, LogOut, User } from 'lucide-react';
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
  return (
    <header className="h-14 flex-none border-b border-border bg-card flex items-center justify-between px-6">
      {/* 좌측: 로고 + 네비게이션 */}
      <div className="flex items-center gap-8">
        {/* 로고 */}
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">RD</span>
          </div>
          <span className="font-semibold text-lg">Rice Digger</span>
        </div>

        {/* 네비게이션 탭 */}
        <nav className="flex items-center gap-1">
          {pageConfigs
            .filter((page) => !page.adminOnly || isAdmin)
            .map((page) => (
              <button
                key={page.id}
                onClick={() => onPageChange(page.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all',
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

      {/* 우측: 테마 토글 + 사용자 정보 + 로그아웃 */}
      <div className="flex items-center gap-3">
        {/* 테마 토글 */}
        <ThemeToggle />

        {/* 구분선 */}
        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <User className="h-4 w-4" />
          <span>{username}</span>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={onLogout}>
          <LogOut className="h-4 w-4" />
          로그아웃
        </Button>
      </div>
    </header>
  );
}
