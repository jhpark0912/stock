/**
 * StealthHomePage - 업무일지 탭 (마감리뷰 → 일일 업무 보고)
 */

import type { Country } from '@/types/economic';
import type { MarketReviewData } from '@/types/marketReview';
import {
  formatDate,
  MemoSection,
  MemoBlock,
  MemoItem,
} from '@/components/stealth/StealthMemoComponents';

interface StealthJournalTabProps {
  data: MarketReviewData | null;
  loading: boolean;
  error: string | null;
  country: Country;
}

export function StealthJournalTab({ data, loading, error, country }: StealthJournalTabProps) {
  if (country === null || country === 'all') {
    return <div className="text-sm text-muted-foreground text-center py-12">팀을 선택하세요.</div>;
  }

  if (loading) {
    return <div className="text-sm text-muted-foreground">불러오는 중...</div>;
  }

  if (error) {
    return (
      <div className="text-sm text-muted-foreground p-3 border border-border rounded-md">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-sm text-muted-foreground text-center py-12">데이터가 없습니다.</div>
    );
  }

  const teamLabel = country === 'kr' ? '국내팀' : '해외팀';
  const dateLabel = formatDate(data.date);

  return (
    <>
      <MemoSection title={`${teamLabel} 일일 업무 보고 - ${dateLabel}`}>
        <div className="space-y-4">
          {data.indices.length > 0 && (
            <MemoBlock heading="주요 프로젝트 현황">
              {data.indices.map((idx) => (
                <MemoItem
                  key={idx.symbol}
                  label={idx.name}
                  value={`${idx.close.toLocaleString()} (${idx.change_percent >= 0 ? '+' : ''}${idx.change_percent.toFixed(2)}%)`}
                />
              ))}
            </MemoBlock>
          )}

          {data.top_gainers.length > 0 && (
            <MemoBlock heading="성과 우수 항목">
              {data.top_gainers.slice(0, 5).map((stock) => (
                <MemoItem
                  key={stock.symbol}
                  label={stock.name}
                  value={`+${stock.change_percent.toFixed(2)}%`}
                />
              ))}
            </MemoBlock>
          )}

          {data.top_losers.length > 0 && (
            <MemoBlock heading="개선 필요 항목">
              {data.top_losers.slice(0, 5).map((stock) => (
                <MemoItem
                  key={stock.symbol}
                  label={stock.name}
                  value={`${stock.change_percent.toFixed(2)}%`}
                />
              ))}
            </MemoBlock>
          )}

          {data.sector_performance.length > 0 && (
            <MemoBlock heading="부서별 평가">
              {data.sector_performance.map((sp) => (
                <MemoItem
                  key={sp.sector}
                  label={sp.sector}
                  value={`${sp.change_percent >= 0 ? '+' : ''}${sp.change_percent.toFixed(2)}%${sp.top_stock ? ` (${sp.top_stock})` : ''}`}
                />
              ))}
            </MemoBlock>
          )}

          {data.major_stocks && data.major_stocks.length > 0 && (
            <MemoBlock heading="핵심 과제 현황">
              {data.major_stocks.map((stock) => (
                <MemoItem
                  key={stock.symbol}
                  label={stock.name}
                  value={`${stock.change_percent >= 0 ? '+' : ''}${stock.change_percent.toFixed(2)}%`}
                />
              ))}
            </MemoBlock>
          )}
          {data.major_stocks_kospi && data.major_stocks_kospi.length > 0 && (
            <MemoBlock heading="핵심 과제 - 1팀">
              {data.major_stocks_kospi.map((stock) => (
                <MemoItem
                  key={stock.symbol}
                  label={stock.name}
                  value={`${stock.change_percent >= 0 ? '+' : ''}${stock.change_percent.toFixed(2)}%`}
                />
              ))}
            </MemoBlock>
          )}
          {data.major_stocks_kosdaq && data.major_stocks_kosdaq.length > 0 && (
            <MemoBlock heading="핵심 과제 - 2팀">
              {data.major_stocks_kosdaq.map((stock) => (
                <MemoItem
                  key={stock.symbol}
                  label={stock.name}
                  value={`${stock.change_percent >= 0 ? '+' : ''}${stock.change_percent.toFixed(2)}%`}
                />
              ))}
            </MemoBlock>
          )}

          {data.ai_analysis && (
            <MemoBlock heading="총평">
              <div className="text-xs sm:text-sm text-foreground whitespace-pre-wrap leading-relaxed pl-2 sm:pl-3">
                {data.ai_analysis.summary}
              </div>
              {data.ai_analysis.tomorrow_outlook && (
                <div className="mt-2">
                  <MemoItem label="향후 전망" value={data.ai_analysis.tomorrow_outlook} />
                </div>
              )}
            </MemoBlock>
          )}

          <div className="text-xs text-muted-foreground pt-1">
            작성일: {dateLabel} / 마감: {data.market_close_time}
          </div>
        </div>
      </MemoSection>
    </>
  );
}
