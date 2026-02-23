/**
 * 관리자 페이지
 * 사용자 관리 (승인, 거부, 삭제)
 */

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import {
  Check,
  X,
  UserX,
  Trash2,
  RefreshCw,
  Shield,
  Settings,
  Activity,
  Users,
} from 'lucide-react';
import * as adminApi from '@/lib/adminApi';
import type { UserResponse } from '@/types/auth';
import type { LogLevel, LogLevelResponse } from '@/types/admin';
import { PageHeader, PageContainer } from '@/components/layout';

/**
 * 관리자 페이지
 */
export function AdminPage() {
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState<UserResponse[]>([]);
  const [pendingUsers, setPendingUsers] = useState<UserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 로그 레벨 상태
  const [logLevel, setLogLevel] = useState<LogLevelResponse | null>(null);
  const [isUpdatingLogLevel, setIsUpdatingLogLevel] = useState(false);

  /**
   * 데이터 로드
   */
  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [all, pending, logLevelData] = await Promise.all([
        adminApi.getAllUsers(),
        adminApi.getPendingUsers(),
        adminApi.getLogLevel(),
      ]);

      setAllUsers(all);
      setPendingUsers(pending);
      setLogLevel(logLevelData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '데이터를 불러오는데 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 초기 로드
   */
  useEffect(() => {
    loadData();
  }, []);

  /**
   * 사용자 승인
   */
  const handleApprove = async (userId: number, username: string) => {
    if (!confirm(`"${username}" 사용자를 승인하시겠습니까?`)) {
      return;
    }

    try {
      await adminApi.approveUser(userId);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : '승인에 실패했습니다');
    }
  };

  /**
   * 사용자 거부
   */
  const handleReject = async (userId: number, username: string) => {
    if (!confirm(`"${username}" 사용자를 거부하시겠습니까? (계정이 삭제됩니다)`)) {
      return;
    }

    try {
      await adminApi.rejectUser(userId);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : '거부에 실패했습니다');
    }
  };

  /**
   * 사용자 비활성화
   */
  const handleDeactivate = async (userId: number, username: string, isActive: boolean) => {
    if (!confirm(`"${username}" 사용자를 ${isActive ? '비활성화' : '활성화'}하시겠습니까?`)) {
      return;
    }

    try {
      await adminApi.deactivateUser(userId);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : '상태 변경에 실패했습니다');
    }
  };

  /**
   * 사용자 삭제
   */
  const handleDelete = async (userId: number, username: string) => {
    if (!confirm(`"${username}" 사용자를 영구 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      await adminApi.deleteUser(userId);
      await loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제에 실패했습니다');
    }
  };

  /**
   * 로그 레벨 변경
   */
  const handleLogLevelChange = async (level: LogLevel) => {
    if (
      !confirm(
        `로그 레벨을 "${level}"로 변경하시겠습니까?\n\n⚠️ 컨테이너 재시작 시 환경 변수 값으로 초기화됩니다.`,
      )
    ) {
      return;
    }

    setIsUpdatingLogLevel(true);
    try {
      const result = await adminApi.updateLogLevel({ level });
      setLogLevel(result);
      alert(`✅ 로그 레벨이 "${level}"로 변경되었습니다.`);
    } catch (err) {
      alert(err instanceof Error ? err.message : '로그 레벨 변경에 실패했습니다');
    } finally {
      setIsUpdatingLogLevel(false);
    }
  };

  // 관리자 권한 체크
  if (user?.role !== 'admin') {
    return (
      <div className="h-full min-h-0 flex flex-col">
        <PageHeader title="관리자" description="접근 권한이 필요합니다" />
        <PageContainer className="flex items-center justify-center">
          <Card className="w-full max-w-md p-8 text-center">
            <Shield className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-foreground mb-2">접근 권한 없음</h2>
            <p className="text-sm text-muted-foreground">관리자만 접근 가능한 페이지입니다.</p>
          </Card>
        </PageContainer>
      </div>
    );
  }

  // 로딩 중
  if (isLoading) {
    return (
      <div className="h-full min-h-0 flex flex-col">
        <PageHeader title="관리자" description="데이터를 불러오는 중..." />
        <PageContainer className="flex items-center justify-center">
          <LoadingSpinner message="데이터를 불러오는 중..." />
        </PageContainer>
      </div>
    );
  }

  // 에러
  if (error) {
    return (
      <div className="h-full min-h-0 flex flex-col">
        <PageHeader title="관리자" description="오류가 발생했습니다" />
        <PageContainer className="flex items-center justify-center">
          <Card className="w-full max-w-md p-8 text-center">
            <h2 className="text-2xl font-semibold text-destructive mb-2">오류 발생</h2>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={loadData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              다시 시도
            </Button>
          </Card>
        </PageContainer>
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 flex flex-col">
      <PageHeader
        title="관리자"
        description={`시스템 설정 및 사용자 관리 · 전체 ${allUsers.length}명 · 승인 대기 ${pendingUsers.length}명`}
        actions={
          <Button onClick={loadData} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            새로고침
          </Button>
        }
      />
      <PageContainer>
        <div className="max-w-6xl mx-auto">
          {/* 탭 */}
          <Tabs defaultValue="users" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="users" className="gap-2">
                <Users className="h-4 w-4" />
                사용자 관리
              </TabsTrigger>
              <TabsTrigger value="system" className="gap-2">
                <Settings className="h-4 w-4" />
                시스템 설정
              </TabsTrigger>
            </TabsList>

            {/* 사용자 관리 탭 */}
            <TabsContent value="users" className="space-y-6 mt-6">
              {/* 승인 대기 섹션 */}
              <Card className="p-6">
                <h2 className="text-2xl font-semibold text-foreground mb-4">
                  승인 대기 ({pendingUsers.length})
                </h2>

                {pendingUsers.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">
                      승인 대기 중인 사용자가 없습니다
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingUsers.map((pendingUser) => (
                      <div
                        key={pendingUser.id}
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border hover:border-primary/50 transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {pendingUser.username}
                          </p>
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
                          <p className="text-sm font-medium text-foreground">
                            {targetUser.username}
                          </p>
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
                                handleDeactivate(
                                  targetUser.id,
                                  targetUser.username,
                                  targetUser.is_active,
                                )
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
            </TabsContent>

            {/* 시스템 설정 탭 */}
            <TabsContent value="system" className="space-y-6 mt-6">
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="h-5 w-5 text-primary" />
                  <h2 className="text-2xl font-semibold text-foreground">로그 레벨 관리</h2>
                </div>

                {/* 로그 레벨 설정 */}
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-4">
                      애플리케이션 로그 상세도를 조정합니다. 변경 사항은 즉시 적용되지만 컨테이너
                      재시작 시 초기화됩니다.
                    </p>

                    {logLevel && (
                      <div className="flex items-center gap-2 text-sm mb-4">
                        <span className="text-muted-foreground">현재 로그 레벨:</span>
                        <span className="font-mono bg-primary/10 text-primary px-3 py-1 rounded-md font-semibold">
                          {logLevel.current_level}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 로그 레벨 버튼 */}
                  {logLevel && (
                    <div className="flex flex-wrap gap-2">
                      {logLevel.available_levels.map((level) => {
                        const isActive = level === logLevel.current_level;
                        const levelConfig = {
                          DEBUG: {
                            label: 'DEBUG',
                            desc: '상세 디버깅',
                            variant: 'outline' as const,
                            color: 'text-blue-500',
                          },
                          INFO: {
                            label: 'INFO',
                            desc: '일반 정보',
                            variant: 'outline' as const,
                            color: 'text-green-500',
                          },
                          WARNING: {
                            label: 'WARNING',
                            desc: '경고만',
                            variant: 'outline' as const,
                            color: 'text-yellow-500',
                          },
                          ERROR: {
                            label: 'ERROR',
                            desc: '에러만',
                            variant: 'outline' as const,
                            color: 'text-orange-500',
                          },
                          CRITICAL: {
                            label: 'CRITICAL',
                            desc: '심각한 에러',
                            variant: 'outline' as const,
                            color: 'text-red-500',
                          },
                        }[level];

                        return (
                          <Button
                            key={level}
                            onClick={() => handleLogLevelChange(level)}
                            disabled={isUpdatingLogLevel || isActive}
                            size="sm"
                            variant={isActive ? 'default' : levelConfig.variant}
                            className={`gap-2 ${!isActive && levelConfig.color}`}
                          >
                            {isActive && '✓ '}
                            {levelConfig.label}
                            <span className="text-xs opacity-70">({levelConfig.desc})</span>
                          </Button>
                        );
                      })}
                    </div>
                  )}

                  {/* 로그 레벨 설명 */}
                  <div className="mt-4 p-4 bg-muted/50 rounded-lg border border-border">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <strong className="text-foreground">💡 로그 레벨 가이드:</strong>
                      <br />• <strong>DEBUG</strong>: 모든 요청/응답 상세, Query params, Headers 등
                      포함 (개발용)
                      <br />• <strong>INFO</strong>: 주요 이벤트만 기록 (기본값, 권장)
                      <br />• <strong>WARNING</strong>: 경고 및 에러만 기록 (프로덕션 권장)
                      <br />• <strong>ERROR/CRITICAL</strong>: 심각한 에러만 기록 (성능 최적화)
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </PageContainer>
    </div>
  );
}
