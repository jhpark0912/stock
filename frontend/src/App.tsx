/**
 * App 메인 컴포넌트
 * Phase 2: API 통합 완료 - 인증 기반 라우팅
 */

import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LoginPage } from './components/auth/LoginPage'
import { Dashboard } from './components/Dashboard'
import { AdminPage } from './components/admin/AdminPage'
import { LoadingSpinner } from './components/LoadingSpinner'
import { Button } from './components/ui/button'
import { LogOut, Shield, LayoutDashboard } from 'lucide-react'

/**
 * 페이지 타입
 */
type PageType = 'dashboard' | 'admin'

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
      {/* 관리자 페이지 전환 버튼 (관리자만 표시) */}
      {user.role === 'admin' && (
        <Button
          onClick={() => setCurrentPage(currentPage === 'dashboard' ? 'admin' : 'dashboard')}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          {currentPage === 'dashboard' ? (
            <>
              <Shield className="h-4 w-4" />
              관리자
            </>
          ) : (
            <>
              <LayoutDashboard className="h-4 w-4" />
              대시보드
            </>
          )}
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

  // 인증됨 - 대시보드/관리자 페이지
  return currentPage === 'dashboard' ? (
    <Dashboard headerActions={headerActions} />
  ) : (
    <AdminPage headerActions={headerActions} />
  )
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
