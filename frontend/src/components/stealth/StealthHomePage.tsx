/**
 * StealthHomePage - 경제지표 위장 페이지
 * 회의록/업무 메모 형태로 경제 지표 데이터를 표시
 * 3개 탭: 회의록(경제지표) / 사업현황(섹터) / 업무일지(마감리뷰)
 * 차트 완전 숨김, 색상 코딩 제거, 이모지 없음
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Search, RefreshCw } from 'lucide-react';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type {
  EconomicData,
  EconomicResponse,
  KoreaEconomicData,
  KoreaEconomicResponse,
  EconomicIndicator,
  MarketCycleData,
  MarketCycleResponse,
  KrMarketCycleData,
  KrMarketCycleResponse,
  Country,
} from '@/types/economic';
import type { MarketReviewData, MarketReviewResponse } from '@/types/marketReview';

type StealthTab = 'memo' | 'status' | 'journal';

// 섹터 데이터 타입 (SectorHeatmap에서 사용하는 것과 동일)
interface SectorData {
  symbol: string;
  name: string;
  name_en: string;
  description: string;
  price: number;
  change_1d: number;
  change_1w: number;
  change_1m: number;
  market_cap: number;
  top_holdings: string[];
}

interface SectorResponse {
  success: boolean;
  data: SectorData[] | null;
  last_updated: string | null;
  error: string | null;
}

/** 지표를 메모 텍스트로 포맷 */
function formatIndicatorLine(
  indicator: EconomicIndicator | null,
  formatType: 'percent' | 'currency' | 'number' | 'trillion'
): string {
  if (!indicator || indicator.value === null) return '데이터 없음';

  let valueStr: string;
  switch (formatType) {
    case 'percent':
      valueStr = `${indicator.value.toFixed(2)}%`;
      break;
    case 'currency':
      valueStr = `$${indicator.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      break;
    case 'trillion':
      valueStr = `${(indicator.value / 1e12).toFixed(2)}T`;
      break;
    default:
      valueStr = indicator.value.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 2 });
  }

  const changeStr = indicator.change_percent !== null
    ? ` (${indicator.change_percent >= 0 ? '+' : ''}${indicator.change_percent.toFixed(1)}%)`
    : '';

  return `${valueStr}${changeStr}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function getTodayString(): string {
  return new Date().toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

/** 시장 사이클 계절을 업무 용어로 변환 */
function seasonToLabel(seasonName: string): string {
  if (seasonName.includes('봄') || seasonName.includes('회복')) return '회복 단계';
  if (seasonName.includes('여름') || seasonName.includes('활황')) return '성장 단계';
  if (seasonName.includes('가을') || seasonName.includes('후퇴')) return '조정 단계';
  if (seasonName.includes('겨울') || seasonName.includes('침체')) return '정비 단계';
  return seasonName;
}

/** 스텔스 국가 선택 (해외팀/국내팀) */
function StealthCountryTab({
  selected,
  onChange,
  showAll = false,
}: {
  selected: Country;
  onChange: (c: Country) => void;
  showAll?: boolean;
}) {
  const items: { value: Country; label: string }[] = [
    { value: 'us', label: '해외팀' },
    { value: 'kr', label: '국내팀' },
  ];
  if (showAll) {
    items.push({ value: 'all', label: '전체' });
  }

  return (
    <div className="flex items-center gap-0.5 sm:gap-1 bg-muted rounded-lg p-1">
      {items.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={cn(
            'px-1.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap',
            selected === value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export function StealthHomePage() {
  const [activeTab, setActiveTab] = useState<StealthTab>('memo');

  // --- 회의록 탭 (경제지표) ---
  const [usData, setUsData] = useState<EconomicData | null>(null);
  const [krData, setKrData] = useState<KoreaEconomicData | null>(null);
  const [usCycle, setUsCycle] = useState<MarketCycleData | null>(null);
  const [krCycle, setKrCycle] = useState<KrMarketCycleData | null>(null);
  const [memoLoading, setMemoLoading] = useState(false);
  const [memoError, setMemoError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // --- 사업현황 탭 (섹터) ---
  const [sectorCountry, setSectorCountry] = useState<Country>('us');
  const [sectors, setSectors] = useState<SectorData[]>([]);
  const [sectorLastUpdated, setSectorLastUpdated] = useState<string | null>(null);
  const [sectorLoading, setSectorLoading] = useState(false);
  const [sectorError, setSectorError] = useState<string | null>(null);

  // --- 업무일지 탭 (마감리뷰) ---
  const [reviewCountry, setReviewCountry] = useState<Country>('us');
  const [reviewData, setReviewData] = useState<MarketReviewData | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const reviewLoadedRef = useRef<string | null>(null);

  // 회의록 데이터 로드
  const fetchMemoData = useCallback(async () => {
    setMemoLoading(true);
    setMemoError(null);
    try {
      const [usRes, krRes, usCycleRes, krCycleRes] = await Promise.allSettled([
        api.get<EconomicResponse>('/api/economic?country=us'),
        api.get<KoreaEconomicResponse>('/api/economic?country=kr'),
        api.get<MarketCycleResponse>('/api/economic/market-cycle?country=us'),
        api.get<KrMarketCycleResponse>('/api/economic/market-cycle?country=kr'),
      ]);
      if (usRes.status === 'fulfilled' && usRes.value.data.success && usRes.value.data.data) {
        setUsData(usRes.value.data.data);
      }
      if (krRes.status === 'fulfilled' && krRes.value.data.success && krRes.value.data.data) {
        setKrData(krRes.value.data.data);
      }
      if (usCycleRes.status === 'fulfilled' && usCycleRes.value.data.success && usCycleRes.value.data.data) {
        setUsCycle(usCycleRes.value.data.data);
      }
      if (krCycleRes.status === 'fulfilled' && krCycleRes.value.data.success && krCycleRes.value.data.data) {
        setKrCycle(krCycleRes.value.data.data);
      }
    } catch {
      setMemoError('데이터를 불러올 수 없습니다.');
    } finally {
      setMemoLoading(false);
    }
  }, []);

  // 섹터 데이터 로드
  const fetchSectorData = useCallback(async (country: Country) => {
    if (country === null) return;
    setSectorLoading(true);
    setSectorError(null);
    try {
      const response = await api.get<SectorResponse>(`/api/economic/sectors?country=${country}`);
      if (response.data.success && response.data.data) {
        setSectors(response.data.data);
        setSectorLastUpdated(response.data.last_updated);
      } else {
        setSectorError(response.data.error || '데이터를 불러올 수 없습니다.');
      }
    } catch {
      setSectorError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setSectorLoading(false);
    }
  }, []);

  // 마감리뷰 데이터 로드
  const fetchReviewData = useCallback(async (country: Country, force = false) => {
    if (country === null || country === 'all') return;
    const cacheKey = country;
    if (!force && reviewLoadedRef.current === cacheKey) return;
    setReviewLoading(true);
    setReviewError(null);
    try {
      const response = await api.get<MarketReviewResponse>(`/api/economic/market-review/${country}`);
      if (response.data.success && response.data.data) {
        setReviewData(response.data.data);
      } else {
        setReviewError(response.data.error || '데이터를 불러올 수 없습니다.');
      }
    } catch {
      setReviewError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setReviewLoading(false);
      reviewLoadedRef.current = cacheKey;
    }
  }, []);

  // 초기 로드: 회의록 탭
  useEffect(() => {
    fetchMemoData();
  }, [fetchMemoData]);

  // 사업현황 탭 국가 변경 시
  useEffect(() => {
    if (activeTab === 'status' && sectorCountry !== null) {
      fetchSectorData(sectorCountry);
    }
  }, [activeTab, sectorCountry, fetchSectorData]);

  // 업무일지 탭 국가 변경 시
  useEffect(() => {
    if (activeTab === 'journal' && reviewCountry !== null && reviewCountry !== 'all') {
      reviewLoadedRef.current = null;
      fetchReviewData(reviewCountry);
    }
  }, [activeTab, reviewCountry, fetchReviewData]);

  const today = getTodayString();
  const hasMemoData = usData || krData;

  const matchesSearch = (text: string): boolean => {
    if (!searchQuery) return true;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  };

  const handleRefresh = () => {
    if (activeTab === 'memo') fetchMemoData();
    else if (activeTab === 'status') fetchSectorData(sectorCountry);
    else if (activeTab === 'journal') fetchReviewData(reviewCountry, true);
  };

  const isLoading = activeTab === 'memo' ? memoLoading
    : activeTab === 'status' ? sectorLoading
    : reviewLoading;

  return (
    <div className="h-full min-h-0 flex flex-col bg-background">
      {/* 상단 헤더 - SubTabHeader 패턴 */}
      <div className="flex-none border-b border-border px-3 sm:px-6 pt-3 sm:pt-4 pb-2 sm:pb-3">
        {/* 1행: 제목 + 새로고침 */}
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <h1 className="text-base sm:text-lg font-medium text-foreground">내 메모</h1>
          <div className="flex items-center gap-2">
            {/* 검색: 회의록 탭 + sm 이상에서만 */}
            {activeTab === 'memo' && (
              <div className="relative hidden sm:block">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 text-sm border border-border rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring w-40"
                />
              </div>
            )}
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors"
              title="새로고침"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 2행: 탭 + 국가 선택 (모바일: 세로 배치, sm 이상: 가로 배치) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
          {/* 메인 탭 */}
          <div className="flex items-center gap-0.5 sm:gap-1 bg-muted rounded-lg p-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('memo')}
              className={cn(
                'px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap',
                activeTab === 'memo'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              회의록
            </button>
            <button
              onClick={() => setActiveTab('status')}
              className={cn(
                'px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap',
                activeTab === 'status'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              사업현황
            </button>
            <button
              onClick={() => setActiveTab('journal')}
              className={cn(
                'px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap',
                activeTab === 'journal'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              업무일지
            </button>
          </div>

          {/* 국가 선택: 사업현황/업무일지에서만 */}
          <div className="flex-shrink-0">
            {activeTab === 'status' && (
              <StealthCountryTab selected={sectorCountry} onChange={setSectorCountry} showAll />
            )}
            {activeTab === 'journal' && (
              <StealthCountryTab selected={reviewCountry} onChange={setReviewCountry} />
            )}
          </div>
        </div>
      </div>

      {/* 탭 콘텐츠 */}
      <div className="flex-1 overflow-auto px-3 sm:px-6 py-3 sm:py-4 space-y-4 sm:space-y-6">
        {/* 회의록 탭 */}
        {activeTab === 'memo' && (
          <MemoTabContent
            usData={usData}
            krData={krData}
            usCycle={usCycle}
            krCycle={krCycle}
            loading={memoLoading}
            error={memoError}
            hasData={hasMemoData}
            today={today}
            matchesSearch={matchesSearch}
          />
        )}

        {/* 사업현황 탭 */}
        {activeTab === 'status' && (
          <StatusTabContent
            sectors={sectors}
            loading={sectorLoading}
            error={sectorError}
            lastUpdated={sectorLastUpdated}
            country={sectorCountry}
          />
        )}

        {/* 업무일지 탭 */}
        {activeTab === 'journal' && (
          <JournalTabContent
            data={reviewData}
            loading={reviewLoading}
            error={reviewError}
            country={reviewCountry}
          />
        )}
      </div>
    </div>
  );
}

// ─── 회의록 탭 (기존 StealthHomePage 내용) ───

function MemoTabContent({
  usData,
  krData,
  usCycle,
  krCycle,
  loading,
  error,
  hasData,
  today,
  matchesSearch,
}: {
  usData: EconomicData | null;
  krData: KoreaEconomicData | null;
  usCycle: MarketCycleData | null;
  krCycle: KrMarketCycleData | null;
  loading: boolean;
  error: string | null;
  hasData: EconomicData | KoreaEconomicData | null;
  today: string;
  matchesSearch: (text: string) => boolean;
}) {
  return (
    <>
      {error && (
        <div className="text-sm text-muted-foreground p-3 border border-border rounded-md">
          {error}
        </div>
      )}

      {loading && !hasData && (
        <div className="text-sm text-muted-foreground">불러오는 중...</div>
      )}

      {/* 주간 회의록 - 미국 데이터 */}
      {usData && matchesSearch('주간 회의록 금리 변동성 거시경제 원자재') && (
        <MemoSection title={`주간 회의록 - ${today}`}>
          <div className="space-y-4">
            {matchesSearch('금리 변동성 국채 vix') && (
              <MemoBlock heading="논의 사항: 금리/변동성">
                <MemoItem label="국채 10Y" value={formatIndicatorLine(usData.rates.treasury_10y, 'percent')} />
                <MemoItem label="국채 3M" value={formatIndicatorLine(usData.rates.treasury_3m, 'percent')} />
                <MemoItem label="변동성지수" value={formatIndicatorLine(usData.rates.vix, 'number')} />
              </MemoBlock>
            )}

            {matchesSearch('거시경제 물가 통화량 cpi m2') && (
              <MemoBlock heading="거시경제 메모">
                <MemoItem label="물가상승률" value={formatIndicatorLine(usData.macro.cpi, 'number')} />
                <MemoItem label="통화량(M2)" value={formatIndicatorLine(usData.macro.m2, 'trillion')} />
              </MemoBlock>
            )}

            {matchesSearch('자원 현황 원유 금') && (
              <MemoBlock heading="자원 현황">
                <MemoItem label="원유(WTI)" value={formatIndicatorLine(usData.commodities.wti_oil, 'currency')} />
                <MemoItem label="금" value={formatIndicatorLine(usData.commodities.gold, 'currency')} />
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

      {/* 분기 평가 - 시장 사이클 */}
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

      {/* 업무 체크리스트 - 한국 데이터 */}
      {krData && matchesSearch('업무 체크리스트 환율 금리 한국') && (
        <MemoSection title="업무 체크리스트">
          <div className="space-y-4">
            {matchesSearch('금리 국고채 기준금리') && (
              <MemoBlock heading="금리 확인">
                <CheckItem label="국고채 10Y" value={formatIndicatorLine(krData.rates.bond_10y, 'percent')} checked />
                <CheckItem label="기준금리" value={formatIndicatorLine(krData.rates.base_rate, 'percent')} checked />
                {krData.rates.credit_spread && (
                  <CheckItem label="신용 스프레드" value={formatIndicatorLine(krData.rates.credit_spread, 'percent')} checked />
                )}
              </MemoBlock>
            )}

            {matchesSearch('거시경제 선행지수 소비자심리 수출') && (
              <MemoBlock heading="거시지표 확인">
                <CheckItem label="선행지수" value={formatIndicatorLine(krData.macro.leading_index, 'number')} checked={!!krData.macro.leading_index?.value} />
                <CheckItem label="소비자심리" value={formatIndicatorLine(krData.macro.ccsi, 'number')} checked={!!krData.macro.ccsi?.value} />
                <CheckItem label="수출액" value={formatIndicatorLine(krData.macro.export, 'number')} checked={!!krData.macro.export?.value} />
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
        <div className="text-sm text-muted-foreground text-center py-12">
          메모가 없습니다.
        </div>
      )}
    </>
  );
}

// ─── 사업현황 탭 (섹터 히트맵 → 부서별 실적표) ───

function StatusTabContent({
  sectors,
  loading,
  error,
  lastUpdated,
  country,
}: {
  sectors: SectorData[];
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
  country: Country;
}) {
  if (country === null) {
    return (
      <div className="text-sm text-muted-foreground text-center py-12">
        팀을 선택하세요.
      </div>
    );
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

  if (sectors.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-12">
        데이터가 없습니다.
      </div>
    );
  }

  const formatChange = (v: number): string => {
    return `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`;
  };

  return (
    <MemoSection title={`부서별 실적 현황 - ${getTodayString()}`}>
      <div className="space-y-4">
        <MemoBlock heading="실적 요약">
          <div className="overflow-x-auto -mx-3">
            <div className="min-w-[20rem] px-3">
              {/* 테이블 헤더 */}
              <div className="flex items-baseline gap-2 text-[10px] sm:text-xs text-muted-foreground border-b border-border pb-1 mb-1">
                <span className="flex-1 min-w-0">부서</span>
                <span className="w-14 sm:w-16 text-right shrink-0">금일</span>
                <span className="w-14 sm:w-16 text-right shrink-0">주간</span>
                <span className="w-14 sm:w-16 text-right shrink-0">월간</span>
              </div>
              {/* 데이터 행 */}
              {sectors.map((sector) => (
                <div key={sector.symbol} className="flex items-baseline gap-2 text-xs sm:text-sm py-0.5">
                  <span className="flex-1 min-w-0 text-muted-foreground truncate">{sector.name}</span>
                  <span className="w-14 sm:w-16 text-right shrink-0 text-foreground font-mono text-[10px] sm:text-xs">
                    {formatChange(sector.change_1d)}
                  </span>
                  <span className="w-14 sm:w-16 text-right shrink-0 text-foreground font-mono text-[10px] sm:text-xs">
                    {formatChange(sector.change_1w)}
                  </span>
                  <span className="w-14 sm:w-16 text-right shrink-0 text-foreground font-mono text-[10px] sm:text-xs">
                    {formatChange(sector.change_1m)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </MemoBlock>

        {/* 상위 성과 / 하위 성과 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <MemoBlock heading="성과 우수 부서">
            {[...sectors]
              .sort((a, b) => b.change_1d - a.change_1d)
              .slice(0, 3)
              .map((s) => (
                <MemoItem key={s.symbol} label={s.name} value={formatChange(s.change_1d)} />
              ))}
          </MemoBlock>
          <MemoBlock heading="개선 필요 부서">
            {[...sectors]
              .sort((a, b) => a.change_1d - b.change_1d)
              .slice(0, 3)
              .map((s) => (
                <MemoItem key={s.symbol} label={s.name} value={formatChange(s.change_1d)} />
              ))}
          </MemoBlock>
        </div>

        {lastUpdated && (
          <div className="text-xs text-muted-foreground pt-1">
            작성일: {formatDate(lastUpdated)}
          </div>
        )}
      </div>
    </MemoSection>
  );
}

// ─── 업무일지 탭 (마감리뷰 → 일일 업무 보고) ───

function JournalTabContent({
  data,
  loading,
  error,
  country,
}: {
  data: MarketReviewData | null;
  loading: boolean;
  error: string | null;
  country: Country;
}) {
  if (country === null || country === 'all') {
    return (
      <div className="text-sm text-muted-foreground text-center py-12">
        팀을 선택하세요.
      </div>
    );
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
      <div className="text-sm text-muted-foreground text-center py-12">
        데이터가 없습니다.
      </div>
    );
  }

  const teamLabel = country === 'kr' ? '국내팀' : '해외팀';
  const dateLabel = formatDate(data.date);

  return (
    <>
      <MemoSection title={`${teamLabel} 일일 업무 보고 - ${dateLabel}`}>
        <div className="space-y-4">
          {/* 주요 프로젝트 현황 (지수) */}
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

          {/* 성과 우수 항목 (급등주) */}
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

          {/* 개선 필요 항목 (급락주) */}
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

          {/* 부서별 평가 (섹터 등락) */}
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

          {/* 핵심 과제 현황 (주요 종목) */}
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

          {/* 총평 (AI 분석) */}
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

// ─── 공용 서브 컴포넌트 ───

/** 메모 섹션 (카드 형태) */
function MemoSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-border rounded-lg bg-card">
      <div className="px-3 sm:px-4 py-2.5 sm:py-3 border-b border-border">
        <h2 className="text-xs sm:text-sm font-medium text-foreground">{title}</h2>
      </div>
      <div className="px-3 sm:px-4 py-2.5 sm:py-3">{children}</div>
    </div>
  );
}

/** 메모 블록 (소제목 + 내용) */
function MemoBlock({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-1.5 sm:mb-2">{heading}</h3>
      <div className="space-y-1 pl-2 sm:pl-3">{children}</div>
    </div>
  );
}

/** 메모 항목 (불릿 포인트 스타일) */
function MemoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5 sm:gap-2 text-xs sm:text-sm">
      <span className="text-muted-foreground shrink-0">-</span>
      <span className="text-muted-foreground shrink-0">{label}:</span>
      <span className="text-foreground break-all">{value}</span>
    </div>
  );
}

/** 체크리스트 항목 */
function CheckItem({ label, value, checked = false }: { label: string; value: string; checked?: boolean }) {
  return (
    <div className="flex items-baseline gap-1.5 sm:gap-2 text-xs sm:text-sm">
      <span className="text-muted-foreground font-mono text-[10px] sm:text-xs shrink-0">{checked ? '[v]' : '[ ]'}</span>
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="text-foreground break-all">{value}</span>
    </div>
  );
}
