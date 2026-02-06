import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LogIn, UserPlus, Coffee, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

/**
 * 로그인/회원가입 페이지
 * Phase 2: API 연결 완료
 */
export function LoginPage() {
  const auth = useAuth()
  // 로그인 폼 상태
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: '',
  })

  // 회원가입 폼 상태
  const [registerForm, setRegisterForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
  })

  // 로딩 상태
  const [isLoading, setIsLoading] = useState(false)

  // 에러 메시지
  const [error, setError] = useState<string | null>(null)

  // 성공 메시지
  const [success, setSuccess] = useState<string | null>(null)

  /**
   * 탭 전환 핸들러
   * 탭 전환 시 에러/성공 메시지 및 입력 필드 초기화
   */
  const handleTabChange = (_value: string) => {
    setError(null)
    setSuccess(null)

    // 입력 필드 초기화
    setLoginForm({
      username: '',
      password: '',
    })
    setRegisterForm({
      username: '',
      password: '',
      confirmPassword: '',
    })
  }

  // 로그인 처리 (Phase 2: 실제 API 호출)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // 클라이언트 검증
    if (!loginForm.username || !loginForm.password) {
      setError('사용자명과 비밀번호를 입력해주세요')
      return
    }

    if (loginForm.username.length < 3) {
      setError('사용자명은 최소 3자 이상이어야 합니다')
      return
    }

    if (loginForm.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다')
      return
    }

    setIsLoading(true)

    try {
      // 실제 API 호출
      await auth.login({
        username: loginForm.username,
        password: loginForm.password,
      })
      // 로그인 성공 시 자동으로 대시보드로 이동 (AuthProvider에서 처리)
    } catch (err) {
      // 에러 처리
      const errorMessage = err instanceof Error ? err.message : '로그인 중 오류가 발생했습니다'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // 회원가입 처리 (Phase 2: 실제 API 호출)
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // 클라이언트 검증
    if (!registerForm.username || !registerForm.password || !registerForm.confirmPassword) {
      setError('모든 필드를 입력해주세요')
      return
    }

    if (registerForm.username.length < 3) {
      setError('사용자명은 최소 3자 이상이어야 합니다')
      return
    }

    if (registerForm.password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다')
      return
    }

    if (registerForm.password !== registerForm.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다')
      return
    }

    setIsLoading(true)

    try {
      // 실제 API 호출
      await auth.register({
        username: registerForm.username,
        password: registerForm.password,
      })

      // 성공 메시지 표시 (구조화된 메시지는 렌더링에서 처리)
      setSuccess('success')

      // 폼 초기화
      setRegisterForm({
        username: '',
        password: '',
        confirmPassword: '',
      })
    } catch (err) {
      // 에러 처리
      const errorMessage = err instanceof Error ? err.message : '회원가입 중 오류가 발생했습니다'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {/* 배경 장식 */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/10 pointer-events-none" />

      {/* 메인 카드 */}
      <Card className="w-full max-w-md relative z-10 border-border shadow-xl">
        {/* 탭 */}
        <div className="p-8">
          <Tabs defaultValue="login" className="w-full" onValueChange={handleTabChange}>
            {/* 탭 헤더 */}
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login" className="gap-2">
                <LogIn className="h-4 w-4" />
                로그인
              </TabsTrigger>
              <TabsTrigger value="register" className="gap-2">
                <UserPlus className="h-4 w-4" />
                회원가입
              </TabsTrigger>
            </TabsList>

            {/* 로그인 탭 */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                {/* 사용자명 */}
                <div className="space-y-2">
                  <label htmlFor="login-username" className="text-sm font-medium text-foreground">
                    사용자명
                  </label>
                  <Input
                    id="login-username"
                    type="text"
                    placeholder="사용자명을 입력하세요"
                    value={loginForm.username}
                    onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                    className="h-11"
                    disabled={isLoading}
                  />
                </div>

                {/* 비밀번호 */}
                <div className="space-y-2">
                  <label htmlFor="login-password" className="text-sm font-medium text-foreground">
                    비밀번호
                  </label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="비밀번호를 입력하세요"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                    className="h-11"
                    disabled={isLoading}
                  />
                </div>

                {/* 에러 메시지 */}
                {error && (
                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div className="space-y-1 flex-1">
                        {error.split('\n').map((line, index) => (
                          <p key={index} className="text-sm text-destructive">
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 성공 메시지 */}
                {success && (
                  <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-success">
                          로그인 성공
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 로그인 버튼 */}
                <Button
                  type="submit"
                  className="w-full h-11 text-base font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      로그인 중...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <LogIn className="h-5 w-5" />
                      로그인
                    </span>
                  )}
                </Button>
              </form>
            </TabsContent>

            {/* 회원가입 탭 */}
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                {/* 사용자명 */}
                <div className="space-y-2">
                  <label htmlFor="register-username" className="text-sm font-medium text-foreground">
                    사용자명
                  </label>
                  <Input
                    id="register-username"
                    type="text"
                    placeholder="사용자명을 입력하세요 (최소 3자)"
                    value={registerForm.username}
                    onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                    className="h-11"
                    disabled={isLoading}
                  />
                </div>

                {/* 비밀번호 */}
                <div className="space-y-2">
                  <label htmlFor="register-password" className="text-sm font-medium text-foreground">
                    비밀번호
                  </label>
                  <Input
                    id="register-password"
                    type="password"
                    placeholder="비밀번호를 입력하세요 (최소 6자)"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                    className="h-11"
                    disabled={isLoading}
                  />
                </div>

                {/* 비밀번호 확인 */}
                <div className="space-y-2">
                  <label htmlFor="register-confirm-password" className="text-sm font-medium text-foreground">
                    비밀번호 확인
                  </label>
                  <Input
                    id="register-confirm-password"
                    type="password"
                    placeholder="비밀번호를 다시 입력하세요"
                    value={registerForm.confirmPassword}
                    onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                    className="h-11"
                    disabled={isLoading}
                  />
                </div>

                {/* 에러 메시지 */}
                {error && (
                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div className="space-y-1 flex-1">
                        {error.split('\n').map((line, index) => (
                          <p key={index} className="text-sm text-destructive">
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 성공 메시지 */}
                {success && (
                  <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                      <div className="space-y-2 flex-1">
                        <p className="text-sm font-medium text-success">
                          회원가입 신청이 완료되었습니다
                        </p>
                        <div className="flex items-start gap-2 text-xs text-muted-foreground">
                          <Coffee className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <p>관리자 승인 후 로그인이 가능합니다.<br />커피를 보내면 더 빨리 될수도</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 회원가입 버튼 */}
                <Button
                  type="submit"
                  className="w-full h-11 text-base font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      가입 중...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <UserPlus className="h-5 w-5" />
                      회원가입
                    </span>
                  )}
                </Button>

                {/* 안내 메시지 */}
                <div className="pt-4 space-y-2">
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Coffee className="h-4 w-4 text-primary/60" />
                    <p className="text-center">
                      관리자 승인 후 로그인 가능합니다
                    </p>
                  </div>
                </div>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  )
}
