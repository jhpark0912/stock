/**
 * App 메인 컴포넌트
 * TopNav 기반 페이지 아키텍처
 */

import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { LoginPage } from './components/auth/LoginPage'
import { TopNav, type PageType } from './components/layout/TopNav'
import { HomePage } from './components/pages/HomePage'
import { PortfolioPage } from './components/pages/PortfolioPage'
import { AdminPage } from './components/admin/AdminPage'
import { SettingsPage } from './components/settings/SettingsPage'
import { LoadingSpinner } from './components/LoadingSpinner'

/**
 * 인증된 앱 컨테이너
 */
function AuthenticatedApp() {
  const { user, logout, isLoading } = useAuth()
  const [currentPage, setCurrentPage] = useState<PageType>('economic')

  // 사용자 변경 시 페이지 리셋 (로그아웃 후 재로그인 시)
  useEffect(() => {
    if (user && user.role !== 'admin' && currentPage === 'admin') {
      // 일반 유저가 관리자 페이지에 있으면 economic으로 이동
      setCurrentPage('economic')
    }
  }, [user, currentPage])

  // 로그아웃 핸들러 (페이지 상태 리셋 포함)
  const handleLogout = () => {
    setCurrentPage('economic') // 페이지 상태 리셋
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

  // 인증됨 - TopNav + 페이지 콘텐츠
  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* 상단 네비게이션 */}
      <TopNav
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        isAdmin={user.role === 'admin'}
        username={user.username}
        onLogout={handleLogout}
      />

      {/* 페이지 콘텐츠 */}
      <main className="flex-1 min-h-0">
        {currentPage === 'economic' && <HomePage />}
        {currentPage === 'portfolio' && (
          <PortfolioPage onNavigateToSettings={() => setCurrentPage('settings')} />
        )}
        {currentPage === 'settings' && <SettingsPage />}
        {currentPage === 'admin' && user.role === 'admin' && <AdminPage />}
      </main>
    </div>
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
