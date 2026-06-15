/**
 * 한국투자증권 API 키 관리 카드
 * 키 상태 조회, 저장, 삭제 기능
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Trash2, Eye, EyeOff, Building2 } from 'lucide-react';
import { updateKISCredentials, deleteKISCredentials, getKISCredentialsStatus } from '@/lib/authApi';
import type { UserResponse } from '@/types/auth';

interface KISKeyCardProps {
  token: string | null;
  user: UserResponse | null;
}

export function KISKeyCard({ token, user }: KISKeyCardProps) {
  const [kisAppKey, setKisAppKey] = useState('');
  const [kisAppSecret, setKisAppSecret] = useState('');
  const [hasKisCredentials, setHasKisCredentials] = useState(false);
  const [kisAppKeyPreview, setKisAppKeyPreview] = useState<string | null>(null);
  const [showKisAppKey, setShowKisAppKey] = useState(false);
  const [showKisAppSecret, setShowKisAppSecret] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!token) return;
      setIsFetching(true);
      try {
        const status = await getKISCredentialsStatus(token);
        setHasKisCredentials(status.has_credentials);
        setKisAppKeyPreview(status.app_key_preview || null);
      } catch (err) {
        console.error('KIS API 키 상태 조회 실패:', err);
      } finally {
        setIsFetching(false);
      }
    };
    fetchStatus();
  }, [token]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!kisAppKey || kisAppKey.trim().length < 10) {
      setError('유효한 App Key를 입력해주세요 (최소 10자)');
      return;
    }
    if (!kisAppSecret || kisAppSecret.trim().length < 20) {
      setError('유효한 App Secret을 입력해주세요 (최소 20자)');
      return;
    }
    if (!token) {
      setError('로그인이 필요합니다');
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateKISCredentials(token, kisAppKey.trim(), kisAppSecret.trim());
      setSuccess('한국투자증권 API 키가 저장되었습니다');
      setHasKisCredentials(result.has_credentials);
      setKisAppKeyPreview(result.app_key_preview || null);
      setKisAppKey('');
      setKisAppSecret('');
      setShowKisAppKey(false);
      setShowKisAppSecret(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'API 키 저장 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        '한국투자증권 API 키를 삭제하시겠습니까?\n한국 섹터 ETF 구성종목 상세정보를 조회할 수 없게 됩니다.',
      )
    ) {
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
      await deleteKISCredentials(token);
      setSuccess('한국투자증권 API 키가 삭제되었습니다');
      setHasKisCredentials(false);
      setKisAppKeyPreview(null);
      setKisAppKey('');
      setKisAppSecret('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'API 키 삭제 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
        {isFetching ? (
          <div className="flex items-center justify-center py-8">
            <span className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {hasKisCredentials && kisAppKeyPreview && (
              <div className="p-4 rounded-lg bg-success/10 border border-success/20 space-y-2">
                <p className="text-sm font-medium text-success">
                  한국투자증권 API 키가 등록되어 있습니다
                </p>
                <p className="text-sm text-muted-foreground font-mono">{kisAppKeyPreview}</p>
              </div>
            )}

            {!hasKisCredentials && (
              <div className="p-4 rounded-lg bg-warning/10 border border-warning/20 space-y-2">
                <p className="text-sm text-warning">
                  API 키가 등록되지 않았습니다.
                  {user?.role === 'admin'
                    ? ' (관리자는 환경변수 키를 사용할 수 있습니다)'
                    : ' 한국 섹터 ETF 구성종목을 조회하려면 API 키를 등록해주세요.'}
                </p>
                {user?.role === 'admin' && (
                  <p className="text-xs text-muted-foreground">
                    개인 API 키를 등록하지 않으면 서버의 환경변수에 설정된 API 키가 사용됩니다.
                  </p>
                )}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
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
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKisAppKey(!showKisAppKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isLoading}
                  >
                    {showKisAppKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* App Secret */}
              <div className="space-y-2">
                <label htmlFor="kis-app-secret" className="text-sm font-medium text-foreground">
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
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowKisAppSecret(!showKisAppSecret)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    disabled={isLoading}
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

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}
              {success && (
                <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                  <p className="text-sm text-success">{success}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="submit"
                  className="flex-1 h-11"
                  disabled={isLoading || !kisAppKey || !kisAppSecret}
                >
                  {isLoading ? (
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
                {hasKisCredentials && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="h-11"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </form>

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
  );
}
