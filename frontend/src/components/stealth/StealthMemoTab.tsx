/**
 * StealthHomePage - 회의록 탭 (경제지표 데이터)
 */

import type {
  EconomicData,
  KoreaEconomicData,
  MarketCycleData,
  KrMarketCycleData,
} from '@/types/economic';
import {
  formatIndicatorLine,
  formatDate,
  getTodayString,
  seasonToLabel,
  MemoSection,
  MemoBlock,
  MemoItem,
  CheckItem,
} from '@/components/stealth/StealthMemoComponents';

interface StealthMemoTabProps {
  usData: EconomicData | null;
  krData: KoreaEconomicData | null;
  usCycle: MarketCycleData | null;
  krCycle: KrMarketCycleData | null;
  loading: boolean;
  error: string | null;
  hasData: EconomicData | KoreaEconomicData | null;
  matchesSearch: (text: string) => boolean;
}

export function StealthMemoTab({
  usData,
  krData,
  usCycle,
  krCycle,
  loading,
  error,
  hasData,
  matchesSearch,
}: StealthMemoTabProps) {
  const today = getTodayString();

  return (
    <>
      {error && (
        <div className="text-sm text-muted-foreground p-3 border border-border rounded-md">
          {error}
        </div>
      )}

      {loading && !hasData && <div className="text-sm text-muted-foreground">불러오는 중...</div>}

      {usData && matchesSearch('주간 회의록 금리 변동성 거시경제 원자재') && (
        <MemoSection title={`주간 회의록 - ${today}`}>
          <div className="space-y-4">
            {matchesSearch('금리 변동성 국채 vix') && (
              <MemoBlock heading="논의 사항: 금리/변동성">
                <MemoItem
                  label="국채 10Y"
                  value={formatIndicatorLine(usData.rates.treasury_10y, 'percent')}
                />
                <MemoItem
                  label="국채 3M"
                  value={formatIndicatorLine(usData.rates.treasury_3m, 'percent')}
                />
                <MemoItem
                  label="변동성지수"
                  value={formatIndicatorLine(usData.rates.vix, 'number')}
                />
              </MemoBlock>
            )}

            {matchesSearch('거시경제 물가 통화량 cpi m2') && (
              <MemoBlock heading="거시경제 메모">
                <MemoItem
                  label="물가상승률"
                  value={formatIndicatorLine(usData.macro.cpi, 'number')}
                />
                <MemoItem
                  label="통화량(M2)"
                  value={formatIndicatorLine(usData.macro.m2, 'trillion')}
                />
              </MemoBlock>
            )}

            {matchesSearch('자원 현황 원유 금') && (
              <MemoBlock heading="자원 현황">
                <MemoItem
                  label="원유(WTI)"
                  value={formatIndicatorLine(usData.commodities.wti_oil, 'currency')}
                />
                <MemoItem
                  label="금"
                  value={formatIndicatorLine(usData.commodities.gold, 'currency')}
                />
              </MemoBlock>
            )}

            {usData.last_updated && (
              <div className="text-xs text-muted-foreground pt-1">
                작성일: {formatDate(usData.last_updated)}
              </div>
            )}
          </div>
        </MemoSection>
      )}

      {(usCycle || krCycle) && matchesSearch('분기 평가 사이클 단계 현황') && (
        <MemoSection title="분기 평가 현황">
          <div className="space-y-4">
            {usCycle && (
              <MemoBlock heading="해외 사업부">
                <MemoItem label="현재 단계" value={seasonToLabel(usCycle.season_name)} />
                <MemoItem label="신뢰도" value={`${usCycle.confidence}%`} />
                <MemoItem label="전환 신호" value={usCycle.transition_signal} />
                <div className="mt-1.5 pl-3 text-xs text-muted-foreground leading-relaxed">
                  {usCycle.reasoning}
                </div>
              </MemoBlock>
            )}
            {krCycle && (
              <MemoBlock heading="국내 사업부">
                <MemoItem label="현재 단계" value={seasonToLabel(krCycle.season_name)} />
                <MemoItem label="신뢰도" value={`${krCycle.confidence}%`} />
                <MemoItem label="전환 신호" value={krCycle.transition_signal} />
                <div className="mt-1.5 pl-3 text-xs text-muted-foreground leading-relaxed">
                  {krCycle.reasoning}
                </div>
              </MemoBlock>
            )}
          </div>
        </MemoSection>
      )}

      {krData && matchesSearch('업무 체크리스트 환율 금리 한국') && (
        <MemoSection title="업무 체크리스트">
          <div className="space-y-4">
            {matchesSearch('금리 국고채 기준금리') && (
              <MemoBlock heading="금리 확인">
                <CheckItem
                  label="국고채 10Y"
                  value={formatIndicatorLine(krData.rates.bond_10y, 'percent')}
                  checked
                />
                <CheckItem
                  label="기준금리"
                  value={formatIndicatorLine(krData.rates.base_rate, 'percent')}
                  checked
                />
                {krData.rates.credit_spread && (
                  <CheckItem
                    label="신용 스프레드"
                    value={formatIndicatorLine(krData.rates.credit_spread, 'percent')}
                    checked
                  />
                )}
              </MemoBlock>
            )}

            {matchesSearch('거시경제 선행지수 소비자심리 수출') && (
              <MemoBlock heading="거시지표 확인">
                <CheckItem
                  label="선행지수"
                  value={formatIndicatorLine(krData.macro.leading_index, 'number')}
                  checked={!!krData.macro.leading_index?.value}
                />
                <CheckItem
                  label="소비자심리"
                  value={formatIndicatorLine(krData.macro.ccsi, 'number')}
                  checked={!!krData.macro.ccsi?.value}
                />
                <CheckItem
                  label="수출액"
                  value={formatIndicatorLine(krData.macro.export, 'number')}
                  checked={!!krData.macro.export?.value}
                />
              </MemoBlock>
            )}

            {matchesSearch('환율 원달러') && (
              <MemoBlock heading="환율 확인">
                <CheckItem
                  label="원/달러"
                  value={
                    krData.fx.usd_krw?.value
                      ? `${krData.fx.usd_krw.value.toLocaleString('ko-KR')}원${
                          krData.fx.usd_krw.change_percent !== null
                            ? ` (${krData.fx.usd_krw.change_percent >= 0 ? '+' : ''}${krData.fx.usd_krw.change_percent.toFixed(1)}%)`
                            : ''
                        }`
                      : '데이터 없음'
                  }
                  checked={!!krData.fx.usd_krw?.value}
                />
              </MemoBlock>
            )}

            {krData.last_updated && (
              <div className="text-xs text-muted-foreground pt-1">
                작성일: {formatDate(krData.last_updated)}
              </div>
            )}
          </div>
        </MemoSection>
      )}

      {!loading && !hasData && !error && (
        <div className="text-sm text-muted-foreground text-center py-12">메모가 없습니다.</div>
      )}
    </>
  );
}
