/**
 * 설정 페이지 - API 키 관리
 * 각 카드 컴포넌트가 자체 state/로직 관리
 */

import { useAuth } from '@/contexts/AuthContext';
import { PageHeader, PageContainer } from '@/components/layout';
import { GeminiKeyCard } from './GeminiKeyCard';
import { KISKeyCard } from './KISKeyCard';

export function SettingsPage() {
  const { token, user } = useAuth();

  return (
    <div className="h-full min-h-0 flex flex-col">
      <PageHeader title="설정" description="AI 분석 및 한국 섹터 정보를 위한 API 키를 관리합니다" />
      <PageContainer centered padded>
        <div className="space-y-6">
          <GeminiKeyCard token={token} user={user} />
          <KISKeyCard token={token} user={user} />
        </div>
      </PageContainer>
    </div>
  );
}
