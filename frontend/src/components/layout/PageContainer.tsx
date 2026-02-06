/**
 * 공통 페이지 콘텐츠 컨테이너 컴포넌트
 * 스크롤 영역, 패딩, 중앙 정렬 등 레이아웃 옵션 제공
 */

import { cn } from '@/lib/utils';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  centered?: boolean;
  padded?: boolean;
}

export function PageContainer({
  children,
  className,
  centered = false,
  padded = true
}: PageContainerProps) {
  return (
    <div className={cn(
      "flex-1 min-h-0 overflow-auto",
      padded && "p-6",
      className
    )}>
      <div className={cn(centered && "max-w-2xl mx-auto")}>
        {children}
      </div>
    </div>
  );
}
