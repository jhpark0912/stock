/**
 * App 메인 컴포넌트
 * Phase 2: API 통합 완료 - 인증 기반 라우팅
 */

import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LoginPage } from './components/auth/LoginPage'
import { Dashboard } from './components/Dashboard'
import { AdminPage } from './components/admin/AdminPage'
import { SettingsPage } from './components/settings/SettingsPage'
import { LoadingSpinner } from './components/LoadingSpinner'
import { Button } from './components/ui/button'
import { LogOut, Shield, LayoutDashboard, Settings } from 'lucide-react'

/**
 * 페이지 타입
 */
type PageType = 'dashboard' | 'admin' | 'settings'

/**
 * 인증된 앱 컨테이너
 */
function AuthenticatedApp() {
  const { user, logout, isLoading } = useAuth()
  const [currentPage, setCurrentPage] = useState<PageType>('dashboard')

  // 사용자 변경 시 페이지 리셋 (로그아웃 후 재로그인 시)
  useEffect(() => {
    if (user && user.role !== 'admin' && currentPage === 'admin') {
      // 일반 유저가 관리자 페이지에 있으면 대시보드로 이동
      setCurrentPage('dashboard')
    }
  }, [user, currentPage])

  // 로그아웃 핸들러 (페이지 상태 리셋 포함)
  const handleLogout = () => {
    setCurrentPage('dashboard') // 페이지 상태 리셋
    logout()
  }

  // 초기 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner message="로딩 중..." />
      </div>
    )
  }

  // 미인증 - 로그인 페이지
  if (!user) {
    return <LoginPage />
  }

  // 헤더 액션 버튼들
  const headerActions = (
    <>
      {/* 대시보드 버튼 (설정/관리자 페이지에서만 표시) */}
      {currentPage !== 'dashboard' && (
        <Button
          onClick={() => setCurrentPage('dashboard')}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <LayoutDashboard className="h-4 w-4" />
          대시보드
        </Button>
      )}

      {/* 설정 버튼 */}
      <Button
        onClick={() => setCurrentPage('settings')}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <Settings className="h-4 w-4" />
        설정
      </Button>

      {/* 관리자 버튼 (관리자만 표시) */}
      {user.role === 'admin' && (
        <Button
          onClick={() => setCurrentPage('admin')}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <Shield className="h-4 w-4" />
          관리자
        </Button>
      )}

      {/* 로그아웃 버튼 */}
      <Button
        onClick={handleLogout}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        <LogOut className="h-4 w-4" />
        로그아웃
      </Button>
    </>
  )

  // 인증됨 - 대시보드/관리자/설정 페이지
  switch (currentPage) {
    case 'dashboard':
      return (
        <Dashboard
          headerActions={headerActions}
          onNavigateToSettings={() => setCurrentPage('settings')}
        />
      )
    case 'admin':
      return <AdminPage headerActions={headerActions} />
    case 'settings':
      return <SettingsPage headerActions={headerActions} />
    default:
      return <Dashboard headerActions={headerActions} />
  }
}

/**
 * App 루트 컴포넌트
 */
function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  )
}

export default App
