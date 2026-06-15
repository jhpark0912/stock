/**
 * Gemini API 키 관리 카드
 * 키 상태 조회, 저장, 삭제 기능
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Key, Save, Trash2, Eye, EyeOff } from 'lucide-react';
import { updateGeminiKey, deleteGeminiKey, getGeminiKeyStatus } from '@/lib/authApi';
import type { UserResponse } from '@/types/auth';

interface GeminiKeyCardProps {
  token: string | null;
  user: UserResponse | null;
}

export function GeminiKeyCard({ token, user }: GeminiKeyCardProps) {
  const [apiKey, setApiKey] = useState('');
  const [hasKey, setHasKey] = useState(false);
  const [keyPreview, setKeyPreview] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
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
    fetchKeyStatus();
  }, [token]);

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

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
      const result = await updateGeminiKey(token, apiKey.trim());
      setSuccess('Gemini API 키가 저장되었습니다');
      setHasKey(result.has_key);
      setKeyPreview(result.key_preview || null);
      setApiKey('');
      setShowApiKey(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'API 키 저장 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

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
      await deleteGeminiKey(token);
      setSuccess('Gemini API 키가 삭제되었습니다');
      setHasKey(false);
      setKeyPreview(null);
      setApiKey('');
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
          <Key className="h-5 w-5 text-primary" />
          Gemini API 키
        </CardTitle>
        <CardDescription>
          Google Gemini API 키를 등록하여 AI 주식 분석 기능을 사용하세요
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {isFetching ? (
          <div className="flex items-center justify-center py-8">
            <span className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* 현재 API 키 상태 */}
            {hasKey && keyPreview && (
              <div className="p-4 rounded-lg bg-success/10 border border-success/20 space-y-2">
                <p className="text-sm font-medium text-success">API 키가 등록되어 있습니다</p>
                <p className="text-sm text-muted-foreground font-mono">{keyPreview}</p>
              </div>
            )}

            {!hasKey && (
              <div className="p-4 rounded-lg bg-warning/10 border border-warning/20 space-y-2">
                <p className="text-sm text-warning">
                  API 키가 등록되지 않았습니다.
                  {user?.role === 'admin'
                    ? ' (관리자는 환경변수 키를 사용할 수 있습니다)'
                    : ' AI 분석 기능을 사용하려면 API 키를 등록해주세요.'}
                </p>
                {user?.role === 'admin' && (
                  <p className="text-xs text-muted-foreground">
                    개인 API 키를 등록하지 않으면 서버의 환경변수에 설정된 API 키가 사용됩니다.
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
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
  );
}
