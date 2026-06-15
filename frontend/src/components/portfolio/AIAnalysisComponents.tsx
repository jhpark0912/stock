/**
 * AIAnalysisComponents - AI 분석 탭 공용 서브컴포넌트
 * - AIAnalysisHeader: 제목 + 이력 버튼 + 선택적 추가 버튼
 * - AIAnalysisStatusCard: 아이콘 + 제목 + 설명 + 액션 버튼 (no_key, error, initial 공용)
 */

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { History } from 'lucide-react';
import { Button } from '@/components/ui/button';

/* ─── AIAnalysisHeader ─── */

interface AIAnalysisHeaderProps {
  title?: string;
  titleIcon?: ReactNode;
  onHistoryOpen: () => void;
  extraButtons?: ReactNode;
}

export function AIAnalysisHeader({
  title = 'AI 분석 (Gemini)',
  titleIcon,
  onHistoryOpen,
  extraButtons,
}: AIAnalysisHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg sm:text-xl font-semibold text-foreground flex items-center gap-2">
        {titleIcon}
        {title}
      </h2>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onHistoryOpen} className="gap-2">
          <History className="h-4 w-4" />
          이력 보기
        </Button>
        {extraButtons}
      </div>
    </div>
  );
}

/* ─── AIAnalysisStatusCard ─── */

interface AIAnalysisStatusCardProps {
  icon: LucideIcon;
  iconClassName: string;
  iconBgClassName: string;
  title: string;
  description: ReactNode;
  action: ReactNode;
  onHistoryOpen: () => void;
  showHeader?: boolean;
}

export function AIAnalysisStatusCard({
  icon: Icon,
  iconClassName,
  iconBgClassName,
  title,
  description,
  action,
  onHistoryOpen,
  showHeader = true,
}: AIAnalysisStatusCardProps) {
  return (
    <div className="p-3 sm:p-6">
      <div className="bg-card border border-border rounded-lg p-6">
        {showHeader && <AIAnalysisHeader onHistoryOpen={onHistoryOpen} />}

        <div className="text-center py-12 space-y-4">
          <div className="flex justify-center">
            <div
              className={`h-16 w-16 rounded-full flex items-center justify-center ${iconBgClassName}`}
            >
              <Icon className={`h-8 w-8 ${iconClassName}`} />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">{description}</p>
          </div>
          {action}
        </div>
      </div>
    </div>
  );
}
