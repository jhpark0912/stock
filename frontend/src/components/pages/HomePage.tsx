/**
 * HomePage - Economic Overview 페이지
 * EconomicIndicators 컴포넌트를 전체 화면으로 표시
 */

import { EconomicIndicators } from '../EconomicIndicators';
import { PageHeader } from '@/components/layout';

export function HomePage() {
  return (
    <div className="h-full min-h-0 flex flex-col">
      <PageHeader
        title="Economic Overview"
        description="거시경제 지표 현황"
      />
      {/* 콘텐츠 - EconomicIndicators 전체 사용 (패딩 없이) */}
      <div className="flex-1 min-h-0 overflow-auto">
        <EconomicIndicators />
      </div>
    </div>
  );
}
