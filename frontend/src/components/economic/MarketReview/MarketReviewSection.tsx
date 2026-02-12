/**
 * 증시 마감 리뷰 메인 섹션 컴포넌트
 * 한국/미국 증시 마감 리뷰 통합 표시
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { RefreshCw, Calendar, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { IndexSummary } from './IndexSummary';
import { TopMoversCard } from './TopMoversCard';
import { MajorStocksCard } from './MajorStocksCard';
import { SectorSummary } from './SectorSummary';
import { AIInsightCard } from './AIInsightCard';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { api } from '@/lib/api';
import type { MarketReviewData, MarketReviewAI, MarketReviewResponse, MarketReviewAIResponse } from '@/types/marketReview';
import type { Country } from '@/types/economic';
import { CountryTab } from '../CountryTab';

// Mock 데이터 (Fallback)
import { mockKrMarketReview, mockUsMarketReview, mockKrAIAnalysis, mockUsAIAnalysis } from '@/mocks/marketReviewMock';

interface MarketReviewSectionProps {
  className?: string;
}

// 날짜 포맷 함수
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const weekday = weekdays[date.getDay()];
  
  return `${year}년 ${month}월 ${day}일 (${weekday})`;
}

type ReviewCountry = 'kr' | 'us';

export function MarketReviewSection({ className }: MarketReviewSectionProps) {
  const [country, setCountry] = useState<ReviewCountry>('kr');
  const [data, setData] = useState<MarketReviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [useMock, setUseMock] = useState(false); // false: 실제 API 사용, true: Mock 데이터
  
  // 중복 호출 방지용 ref
  const loadingRef = useRef(false);
  const loadedCountryRef = useRef<ReviewCountry | null>(null);

  // 데이터 로드
  const loadData = useCallback(async (targetCountry: ReviewCountry, forceRefresh = false) => {
    // 이미 로딩 중이면 무시
    if (loadingRef.current) return;
    
    // 이미 해당 국가 데이터가 로드되었고, 강제 새로고침이 아니면 무시
    if (!forceRefresh && loadedCountryRef.current === targetCountry) return;
    
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    
    try {
      if (useMock) {
        // Mock 데이터 사용 (Fallback)
        await new Promise(resolve => setTimeout(resolve, 500));
        const mockData = targetCountry === 'kr' ? mockKrMarketReview : mockUsMarketReview;
        setData(mockData);
      } else {
        // 실제 API 호출
        const response = await api.get<MarketReviewResponse>(`/api/economic/market-review/${targetCountry}`);
        if (response.data.success && response.data.data) {
          setData(response.data.data);
        } else {
          // API 실패 시 Mock 데이터로 Fallback
          const mockData = targetCountry === 'kr' ? mockKrMarketReview : mockUsMarketReview;
          setData(mockData);
          setError(response.data.error || null);
        }
      }
    } catch (err) {
      // API 오류 시 Mock 데이터로 Fallback
      const mockData = targetCountry === 'kr' ? mockKrMarketReview : mockUsMarketReview;
      setData(mockData);
      setError('실시간 데이터를 불러올 수 없어 샘플 데이터를 표시합니다.');
    } finally {
      setLoading(false);
      loadingRef.current = false;
      loadedCountryRef.current = targetCountry;
    }
  }, [useMock]);

  // AI 분석 생성
  const handleGenerateAI = useCallback(async () => {
    if (!data) return;
    
    setAiLoading(true);
    try {
      if (useMock) {
        // Mock AI 분석
        await new Promise(resolve => setTimeout(resolve, 1500));
        const mockAI = country === 'kr' ? mockKrAIAnalysis : mockUsAIAnalysis;
        setData(prev => prev ? { ...prev, ai_analysis: mockAI } : null);
      } else {
        // 실제 AI API 호출
        const response = await api.post<MarketReviewAIResponse>(`/api/economic/market-review/${country}/ai`);
        if (response.data.success && response.data.data) {
          setData(prev => prev ? { ...prev, ai_analysis: response.data.data } : null);
        } else {
          // AI 실패 시 Mock 데이터로 Fallback
          const mockAI = country === 'kr' ? mockKrAIAnalysis : mockUsAIAnalysis;
          setData(prev => prev ? { ...prev, ai_analysis: mockAI } : null);
        }
      }
    } catch (err) {
      // AI 오류 시 Mock 데이터로 Fallback
      const mockAI = country === 'kr' ? mockKrAIAnalysis : mockUsAIAnalysis;
      setData(prev => prev ? { ...prev, ai_analysis: mockAI } : null);
    } finally {
      setAiLoading(false);
    }
  }, [data, country, useMock]);

  // 국가 변경 시 데이터 로드
  useEffect(() => {
    loadData(country);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country]); // loadData를 의존성에서 제외하여 중복 호출 방지

  // 국가 변경 핸들러 (타입 변환)
  const handleCountryChange = (newCountry: Country) => {
    if (newCountry === 'kr' || newCountry === 'us') {
      // 국가 변경 시 캐시된 데이터 초기화
      loadedCountryRef.current = null;
      setCountry(newCountry);
    }
  };

  // 새로고침 핸들러
  const handleRefresh = () => {
    loadData(country, true); // forceRefresh = true
  };

  const getFlag = () => {
    return country === 'kr' ? '🇰🇷' : '🇺🇸';
  };

  const getCountryName = () => {
    return country === 'kr' ? '한국' : '미국';
  };

  // 로딩 상태
  if (loading) {
    return (
      <div className={cn('', className)}>
        <LoadingSpinner message={`${getCountryName()} 증시 마감 리뷰 로딩 중...`} />
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className={cn('', className)}>
        {/* 국가 선택 탭 */}
        <div className="px-6 py-4 border-b">
          <CountryTab
            selected={country}
            onChange={handleCountryChange}
          />
        </div>

        <div className="flex items-center justify-center p-6">
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 text-center max-w-md">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
            <p className="text-destructive font-medium mb-2">데이터 로드 실패</p>
            <p className="text-sm text-muted-foreground mb-4">{error}</p>
            <Button onClick={handleRefresh} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              다시 시도
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 데이터 없음
  if (!data) {
    return (
      <div className={cn('', className)}>
        {/* 국가 선택 탭 */}
        <div className="px-6 py-4 border-b">
          <CountryTab
            selected={country}
            onChange={handleCountryChange}
          />
        </div>

        <div className="flex items-center justify-center p-6">
          <div className="text-center text-muted-foreground">
            데이터가 없습니다.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('', className)}>
      {/* 국가 선택 탭 */}
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <CountryTab
          selected={country}
          onChange={handleCountryChange}
        />

        {/* 새로고침 버튼 */}
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          새로고침
        </Button>
      </div>

      {/* 마감 리뷰 헤더 */}
      <div className="px-6 py-4 bg-muted/30 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{getFlag()}</span>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {formatDate(data.date)} {getCountryName()} 증시 마감 리뷰
              </h2>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  마감 시간: {data.market_close_time}
                </span>
                {data.is_market_closed && (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" />
                    장 마감
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 - 스크롤은 상위 컨테이너에서 처리 */}
      <div className="p-6 space-y-6">
        {/* 주요 지수 */}
        <IndexSummary indices={data.indices} country={country} />

        {/* 급등/급락 종목 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopMoversCard
            title="급등주 TOP 5"
            type="gainers"
            stocks={data.top_gainers}
            country={country}
          />
          <TopMoversCard
            title="급락주 TOP 5"
            type="losers"
            stocks={data.top_losers}
            country={country}
          />
        </div>

        {/* 섹터별 등락률 */}
        <SectorSummary sectors={data.sector_performance} country={country} />

        {/* 주요 종목 (시가총액 Top 5) */}
        {country === 'kr' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {data.major_stocks_kospi && (
              <MajorStocksCard
                title="KOSPI 시총 TOP 5"
                stocks={data.major_stocks_kospi}
                country="kr"
              />
            )}
            {data.major_stocks_kosdaq && (
              <MajorStocksCard
                title="KOSDAQ 시총 TOP 5"
                stocks={data.major_stocks_kosdaq}
                country="kr"
              />
            )}
          </div>
        )}

        {country === 'us' && data.major_stocks && (
          <MajorStocksCard
            title="S&P 500 시총 TOP 5"
            stocks={data.major_stocks}
            country="us"
          />
        )}

        {/* AI 분석 */}
        <AIInsightCard
          analysis={data.ai_analysis}
          onGenerate={handleGenerateAI}
          loading={aiLoading}
          country={country}
        />
      </div>
    </div>
  );
}
