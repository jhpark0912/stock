/**
 * 관리자 페이지
 * 사용자 관리 (승인, 거부, 삭제)
 */

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { useAuth } from '@/contexts/AuthContext'
import { Check, X, UserX, Trash2, RefreshCw, Shield } from 'lucide-react'
import * as adminApi from '@/lib/adminApi'
import type { UserResponse } from '@/types/auth'

interface AdminPageProps {
  /** 헤더 우측에 표시할 추가 액션 버튼들 */
  headerActions?: React.ReactNode;
}

/**
 * 관리자 페이지
 */
export function AdminPage({ headerActions }: AdminPageProps) {
  const { user } = useAuth()
  const [allUsers, setAllUsers] = useState<UserResponse[]>([])
  const [pendingUsers, setPendingUsers] = useState<UserResponse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * 데이터 로드
   */
  const loadData = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [all, pending] = await Promise.all([
        adminApi.getAllUsers(),
        adminApi.getPendingUsers(),
      ])

      setAllUsers(all)
      setPendingUsers(pending)
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * 초기 로드
   */
  useEffect(() => {
    loadData()
  }, [])

  /**
   * 사용자 승인
   */
  const handleApprove = async (userId: number, username: string) => {
    if (!confirm(`"${username}" 사용자를 승인하시겠습니까?`)) {
      return
    }

    try {
      await adminApi.approveUser(userId)
      await loadData()
    } catch (err) {
      alert(err instanceof Error ? err.message : '승인에 실패했습니다')
    }
  }

  /**
   * 사용자 거부
   */
  const handleReject = async (userId: number, username: string) => {
    if (!confirm(`"${username}" 사용자를 거부하시겠습니까? (계정이 삭제됩니다)`)) {
      return
    }

    try {
      await adminApi.rejectUser(userId)
      await loadData()
    } catch (err) {
      alert(err instanceof Error ? err.message : '거부에 실패했습니다')
    }
  }

  /**
   * 사용자 비활성화
   */
  const handleDeactivate = async (userId: number, username: string, isActive: boolean) => {
    if (!confirm(`"${username}" 사용자를 ${isActive ? '비활성화' : '활성화'}하시겠습니까?`)) {
      return
    }

    try {
      await adminApi.deactivateUser(userId)
      await loadData()
    } catch (err) {
      alert(err instanceof Error ? err.message : '상태 변경에 실패했습니다')
    }
  }

  /**
   * 사용자 삭제
   */
  const handleDelete = async (userId: number, username: string) => {
    if (!confirm(`"${username}" 사용자를 영구 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      return
    }

    try {
      await adminApi.deleteUser(userId)
      await loadData()
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제에 실패했습니다')
    }
  }

  // 관리자 권한 체크
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-foreground mb-2">접근 권한 없음</h2>
          <p className="text-sm text-muted-foreground">관리자만 접근 가능한 페이지입니다.</p>
        </Card>
      </div>
    )
  }

  // 로딩 중
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner message="데이터를 불러오는 중..." />
      </div>
    )
  }

  // 에러
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 text-center">
          <h2 className="text-2xl font-semibold text-destructive mb-2">오류 발생</h2>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            다시 시도
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* 헤더 */}
      <header className="w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="flex h-14 items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-foreground">관리자 페이지</h1>
          <div className="flex items-center gap-2">
            {headerActions}
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <div className="p-6">
        <div className="max-w-6xl mx-auto space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">사용자 관리</h1>
            <p className="text-sm text-muted-foreground">
              전체 {allUsers.length}명 · 승인 대기 {pendingUsers.length}명
            </p>
          </div>
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            새로고침
          </Button>
        </div>

        {/* 승인 대기 섹션 */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            승인 대기 ({pendingUsers.length})
          </h2>

          {pendingUsers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">승인 대기 중인 사용자가 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingUsers.map((pendingUser) => (
                <div
                  key={pendingUser.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{pendingUser.username}</p>
                    <p className="text-xs text-muted-foreground">
                      가입일: {new Date(pendingUser.created_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApprove(pendingUser.id, pendingUser.username)}
                      size="sm"
                      variant="default"
                      className="gap-2"
                    >
                      <Check className="h-4 w-4" />
                      승인
                    </Button>
                    <Button
                      onClick={() => handleReject(pendingUser.id, pendingUser.username)}
                      size="sm"
                      variant="destructive"
                      className="gap-2"
                    >
                      <X className="h-4 w-4" />
                      거부
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 전체 사용자 섹션 */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            전체 사용자 ({allUsers.length})
          </h2>

          <div className="space-y-3">
            {allUsers.map((targetUser) => (
              <div
                key={targetUser.id}
                className="flex items-center justify-between p-4 bg-card rounded-lg border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-foreground">{targetUser.username}</p>
                    {targetUser.role === 'admin' && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                        관리자
                      </span>
                    )}
                    {!targetUser.is_approved && (
                      <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-md">
                        승인 대기
                      </span>
                    )}
                    {!targetUser.is_active && (
                      <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-md">
                        비활성
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    가입일: {new Date(targetUser.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>

                {/* 자기 자신이 아닌 경우만 액션 버튼 표시 */}
                {targetUser.id !== user.id && (
                  <div className="flex gap-2">
                    {targetUser.is_approved && (
                      <Button
                        onClick={() =>
                          handleDeactivate(targetUser.id, targetUser.username, targetUser.is_active)
                        }
                        size="sm"
                        variant="outline"
                        className="gap-2"
                      >
                        <UserX className="h-4 w-4" />
                        {targetUser.is_active ? '비활성화' : '활성화'}
                      </Button>
                    )}
                    <Button
                      onClick={() => handleDelete(targetUser.id, targetUser.username)}
                      size="sm"
                      variant="destructive"
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      삭제
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
        </div>
      </div>
    </div>
  )
}
