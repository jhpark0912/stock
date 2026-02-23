import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Key, Save, Trash2, Eye, EyeOff, Building2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  updateGeminiKey,
  deleteGeminiKey,
  getGeminiKeyStatus,
  updateKISCredentials,
  deleteKISCredentials,
  getKISCredentialsStatus,
} from '@/lib/authApi';
import { PageHeader, PageContainer } from '@/components/layout';

/**
 * 설정 페이지 - API 키 관리
 */
export function SettingsPage() {
  const { token, user } = useAuth();

  // ============ Gemini API 키 상태 ============
  const [apiKey, setApiKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [keyPreview, setKeyPreview] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ============ 한국투자증권 API 키 상태 ============
  const [kisAppKey, setKisAppKey] = useState('');
  const [kisAppSecret, setKisAppSecret] = useState('');
  const [hasKisCredentials, setHasKisCredentials] = useState(false);
  const [kisAppKeyPreview, setKisAppKeyPreview] = useState<string | null>(null);
  const [showKisAppKey, setShowKisAppKey] = useState(false);
  const [showKisAppSecret, setShowKisAppSecret] = useState(false);
  const [isKisLoading, setIsKisLoading] = useState(false);
  const [isKisFetching, setIsKisFetching] = useState(true);
  const [kisError, setKisError] = useState<string | null>(null);
  const [kisSuccess, setKisSuccess] = useState<string | null>(null);

  /**
   * Gemini API 키 상태 조회
   */
  const fetchKeyStatus = async () => {
    if (!token) return;

    setIsFetching(true);
    try {
      const status = await getGeminiKeyStatus(token);
      setHasKey(status.has_key);
      setKeyPreview(status.key_preview || null);
    } catch (err) {
      console.error('API 키 상태 조회 실패:', err);
    } finally {
      setIsFetching(false);
    }
  };

  /**
   * 한국투자증권 API 키 상태 조회
   */
  const fetchKisCredentialsStatus = async () => {
    if (!token) return;

    setIsKisFetching(true);
    try {
      const status = await getKISCredentialsStatus(token);
      setHasKisCredentials(status.has_credentials);
      setKisAppKeyPreview(status.app_key_preview || null);
    } catch (err) {
      console.error('KIS API 키 상태 조회 실패:', err);
    } finally {
      setIsKisFetching(false);
    }
  };

  /**
   * 컴포넌트 마운트 시 API 키 상태 조회
   */
  useEffect(() => {
    fetchKeyStatus();
    fetchKisCredentialsStatus();
  }, [token]);

  /**
   * Gemini API 키 저장
   */
  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // 클라이언트 검증
    if (!apiKey || apiKey.trim().length < 10) {
      setError('유효한 Gemini API 키를 입력해주세요 (최소 10자)');
      return;
    }

    if (!token) {
      setError('로그인이 필요합니다');
      return;
    }

    setIsLoading(true);

    try {
      // API 키 저장
      const result = await updateGeminiKey(token, apiKey.trim());

      // 성공 메시지
      setSuccess('Gemini API 키가 저장되었습니다');

      // 상태 업데이트
      setHasKey(result.has_key);
      setKeyPreview(result.key_preview || null);

      // 입력 필드 초기화
      setApiKey('');
      setShowApiKey(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'API 키 저장 중 오류가 발생했습니다';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Gemini API 키 삭제
   */
  const handleDeleteKey = async () => {
    if (!confirm('Gemini API 키를 삭제하시겠습니까?\nAI 분석 기능을 사용할 수 없게 됩니다.')) {
      return;
    }

    setError(null);
    setSuccess(null);

    if (!token) {
      setError('로그인이 필요합니다');
      return;
    }

    setIsLoading(true);

    try {
      // API 키 삭제
      await deleteGeminiKey(token);

      // 성공 메시지
      setSuccess('Gemini API 키가 삭제되었습니다');

      // 상태 업데이트
      setHasKey(false);
      setKeyPreview(null);
      setApiKey('');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'API 키 삭제 중 오류가 발생했습니다';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 한국투자증권 API 키 저장
   */
  const handleSaveKisCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setKisError(null);
    setKisSuccess(null);

    // 클라이언트 검증
    if (!kisAppKey || kisAppKey.trim().length < 10) {
      setKisError('유효한 App Key를 입력해주세요 (최소 10자)');
      return;
    }

    if (!kisAppSecret || kisAppSecret.trim().length < 20) {
      setKisError('유효한 App Secret을 입력해주세요 (최소 20자)');
      return;
    }

    if (!token) {
      setKisError('로그인이 필요합니다');
      return;
    }

    setIsKisLoading(true);

    try {
      // API 키 저장
      const result = await updateKISCredentials(token, kisAppKey.trim(), kisAppSecret.trim());

      // 성공 메시지
      setKisSuccess('한국투자증권 API 키가 저장되었습니다');

      // 상태 업데이트
      setHasKisCredentials(result.has_credentials);
      setKisAppKeyPreview(result.app_key_preview || null);

      // 입력 필드 초기화
      setKisAppKey('');
      setKisAppSecret('');
      setShowKisAppKey(false);
      setShowKisAppSecret(false);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'API 키 저장 중 오류가 발생했습니다';
      setKisError(errorMessage);
    } finally {
      setIsKisLoading(false);
    }
  };

  /**
   * 한국투자증권 API 키 삭제
   */
  const handleDeleteKisCredentials = async () => {
    if (
      !confirm(
        '한국투자증권 API 키를 삭제하시겠습니까?\n한국 섹터 ETF 구성종목 상세정보를 조회할 수 없게 됩니다.',
      )
    ) {
      return;
    }

    setKisError(null);
    setKisSuccess(null);

    if (!token) {
      setKisError('로그인이 필요합니다');
      return;
    }

    setIsKisLoading(true);

    try {
      // API 키 삭제
      await deleteKISCredentials(token);

      // 성공 메시지
      setKisSuccess('한국투자증권 API 키가 삭제되었습니다');

      // 상태 업데이트
      setHasKisCredentials(false);
      setKisAppKeyPreview(null);
      setKisAppKey('');
      setKisAppSecret('');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'API 키 삭제 중 오류가 발생했습니다';
      setKisError(errorMessage);
    } finally {
      setIsKisLoading(false);
    }
  };

  return (
    <div className="h-full min-h-0 flex flex-col">
      <PageHeader title="설정" description="AI 분석 및 한국 섹터 정보를 위한 API 키를 관리합니다" />
      <PageContainer centered padded>
        <div className="space-y-6">
          {/* ==================== Gemini API 키 관리 ==================== */}
          <Card className="border-border shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                Gemini API 키
              </CardTitle>
              <CardDescription>
                Google Gemini API 키를 등록하여 AI 주식 분석 기능을 사용하세요
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* 로딩 중 */}
              {isFetching ? (
                <div className="flex items-center justify-center py-8">
                  <span className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {/* 현재 API 키 상태 */}
                  {hasKey && keyPreview && (
                    <div className="p-4 rounded-lg bg-success/10 border border-success/20 space-y-2">
                      <p className="text-sm font-medium text-success">
                        ✓ API 키가 등록되어 있습니다
                      </p>
                      <p className="text-sm text-muted-foreground font-mono">{keyPreview}</p>
                    </div>
                  )}

                  {/* API 키가 없을 때 안내 */}
                  {!hasKey && (
                    <div className="p-4 rounded-lg bg-warning/10 border border-warning/20 space-y-2">
                      <p className="text-sm text-warning">
                        ⚠️ API 키가 등록되지 않았습니다.
                        {user?.role === 'admin'
                          ? ' (관리자는 환경변수 키를 사용할 수 있습니다)'
                          : ' AI 분석 기능을 사용하려면 API 키를 등록해주세요.'}
                      </p>
                      {user?.role === 'admin' && (
                        <p className="text-xs text-muted-foreground">
                          💡 개인 API 키를 등록하지 않으면 서버의 환경변수에 설정된 API 키가
                          사용됩니다.
                        </p>
                      )}
                    </div>
                  )}

                  {/* API 키 입력 폼 */}
                  <form onSubmit={handleSaveKey} className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="api-key" className="text-sm font-medium text-foreground">
                        {hasKey ? '새 API 키' : 'API 키'}
                      </label>
                      <div className="relative">
                        <Input
                          id="api-key"
                          type={showApiKey ? 'text' : 'password'}
                          placeholder="Gemini API 키를 입력하세요"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          className="h-11 pr-12"
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          disabled={isLoading}
                        >
                          {showApiKey ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Google AI Studio에서 API 키를 발급받을 수 있습니다:{' '}
                        <a
                          href="https://aistudio.google.com/app/apikey"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          aistudio.google.com/app/apikey
                        </a>
                      </p>
                    </div>

                    {/* 에러 메시지 */}
                    {error && (
                      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                        <p className="text-sm text-destructive">{error}</p>
                      </div>
                    )}

                    {/* 성공 메시지 */}
                    {success && (
                      <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                        <p className="text-sm text-success">{success}</p>
                      </div>
                    )}

                    {/* 버튼 그룹 */}
                    <div className="flex gap-3">
                      {/* 저장 버튼 */}
                      <Button type="submit" className="flex-1 h-11" disabled={isLoading || !apiKey}>
                        {isLoading ? (
                          <span className="flex items-center gap-2">
                            <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            저장 중...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Save className="h-4 w-4" />
                            {hasKey ? 'API 키 변경' : 'API 키 저장'}
                          </span>
                        )}
                      </Button>

                      {/* 삭제 버튼 (API 키가 있을 때만) */}
                      {hasKey && (
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={handleDeleteKey}
                          disabled={isLoading}
                          className="h-11"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </form>

                  {/* 안내 사항 */}
                  <div className="pt-4 border-t border-border space-y-3">
                    <h4 className="text-sm font-medium text-foreground">안내 사항</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>API 키는 암호화되어 안전하게 저장됩니다</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>등록된 API 키는 사용자 본인의 AI 분석 요청에만 사용됩니다</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>API 키가 없으면 AI 분석 탭을 사용할 수 없습니다</span>
                      </li>
                    </ul>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* ==================== 한국투자증권 API 키 관리 ==================== */}
          <Card className="border-border shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                한국투자증권 API 키
              </CardTitle>
              <CardDescription>
                한국투자증권 Open API 키를 등록하여 한국 섹터 ETF 구성종목 정보를 조회하세요
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* 로딩 중 */}
              {isKisFetching ? (
                <div className="flex items-center justify-center py-8">
                  <span className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {/* 현재 API 키 상태 */}
                  {hasKisCredentials && kisAppKeyPreview && (
                    <div className="p-4 rounded-lg bg-success/10 border border-success/20 space-y-2">
                      <p className="text-sm font-medium text-success">
                        ✓ 한국투자증권 API 키가 등록되어 있습니다
                      </p>
                      <p className="text-sm text-muted-foreground font-mono">{kisAppKeyPreview}</p>
                    </div>
                  )}

                  {/* API 키가 없을 때 안내 */}
                  {!hasKisCredentials && (
                    <div className="p-4 rounded-lg bg-warning/10 border border-warning/20 space-y-2">
                      <p className="text-sm text-warning">
                        ⚠️ API 키가 등록되지 않았습니다.
                        {user?.role === 'admin'
                          ? ' (관리자는 환경변수 키를 사용할 수 있습니다)'
                          : ' 한국 섹터 ETF 구성종목을 조회하려면 API 키를 등록해주세요.'}
                      </p>
                      {user?.role === 'admin' && (
                        <p className="text-xs text-muted-foreground">
                          💡 개인 API 키를 등록하지 않으면 서버의 환경변수에 설정된 API 키가
                          사용됩니다.
                        </p>
                      )}
                    </div>
                  )}

                  {/* API 키 입력 폼 */}
                  <form onSubmit={handleSaveKisCredentials} className="space-y-4">
                    {/* App Key */}
                    <div className="space-y-2">
                      <label htmlFor="kis-app-key" className="text-sm font-medium text-foreground">
                        {hasKisCredentials ? '새 App Key' : 'App Key'}
                      </label>
                      <div className="relative">
                        <Input
                          id="kis-app-key"
                          type={showKisAppKey ? 'text' : 'password'}
                          placeholder="App Key를 입력하세요"
                          value={kisAppKey}
                          onChange={(e) => setKisAppKey(e.target.value)}
                          className="h-11 pr-12"
                          disabled={isKisLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowKisAppKey(!showKisAppKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          disabled={isKisLoading}
                        >
                          {showKisAppKey ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* App Secret */}
                    <div className="space-y-2">
                      <label
                        htmlFor="kis-app-secret"
                        className="text-sm font-medium text-foreground"
                      >
                        {hasKisCredentials ? '새 App Secret' : 'App Secret'}
                      </label>
                      <div className="relative">
                        <Input
                          id="kis-app-secret"
                          type={showKisAppSecret ? 'text' : 'password'}
                          placeholder="App Secret을 입력하세요"
                          value={kisAppSecret}
                          onChange={(e) => setKisAppSecret(e.target.value)}
                          className="h-11 pr-12"
                          disabled={isKisLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowKisAppSecret(!showKisAppSecret)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          disabled={isKisLoading}
                        >
                          {showKisAppSecret ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        한국투자증권 API 포털에서 키를 발급받을 수 있습니다:{' '}
                        <a
                          href="https://apiportal.koreainvestment.com"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          apiportal.koreainvestment.com
                        </a>
                      </p>
                    </div>

                    {/* 에러 메시지 */}
                    {kisError && (
                      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                        <p className="text-sm text-destructive">{kisError}</p>
                      </div>
                    )}

                    {/* 성공 메시지 */}
                    {kisSuccess && (
                      <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                        <p className="text-sm text-success">{kisSuccess}</p>
                      </div>
                    )}

                    {/* 버튼 그룹 */}
                    <div className="flex gap-3">
                      {/* 저장 버튼 */}
                      <Button
                        type="submit"
                        className="flex-1 h-11"
                        disabled={isKisLoading || !kisAppKey || !kisAppSecret}
                      >
                        {isKisLoading ? (
                          <span className="flex items-center gap-2">
                            <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            저장 중...
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <Save className="h-4 w-4" />
                            {hasKisCredentials ? 'API 키 변경' : 'API 키 저장'}
                          </span>
                        )}
                      </Button>

                      {/* 삭제 버튼 (API 키가 있을 때만) */}
                      {hasKisCredentials && (
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={handleDeleteKisCredentials}
                          disabled={isKisLoading}
                          className="h-11"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </form>

                  {/* 안내 사항 */}
                  <div className="pt-4 border-t border-border space-y-3">
                    <h4 className="text-sm font-medium text-foreground">안내 사항</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>API 키는 암호화되어 안전하게 저장됩니다</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>한국 섹터 ETF의 실시간 구성종목 정보를 조회할 수 있습니다</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>API 키가 없으면 한국 섹터의 상세정보를 볼 수 없습니다</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>
                        <span>실전투자용 API 키를 사용하는 것을 권장합니다</span>
                      </li>
                    </ul>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </div>
  );
}
