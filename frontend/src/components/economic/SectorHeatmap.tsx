import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, RefreshCw, Clock, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { api } from '@/lib/api';
import { LoadingSpinner } from '@/components/LoadingSpinner';

// 섹터 상세 정보 (툴팁용)
const SECTOR_DETAIL: Record<string, { 
  detail: string;          // 툴팁 상세 설명
  examples: string[];      // 대표 기업
}> = {
  XLK: {
    detail: '기술 섹터는 하드웨어, 소프트웨어, 반도체, IT 서비스 기업으로 구성됩니다. 성장주 중심으로 금리에 민감합니다.',
    examples: ['AAPL', 'MSFT', 'NVDA'],
  },
  XLF: {
    detail: '금융 섹터는 은행, 보험사, 자산운용사, 투자은행으로 구성됩니다. 금리 상승 시 수혜를 받는 경향이 있습니다.',
    examples: ['JPM', 'BAC', 'WFC'],
  },
  XLV: {
    detail: '헬스케어 섹터는 제약, 바이오테크, 의료기기, 헬스케어 서비스 기업으로 구성됩니다. 경기 방어적 성격이 있습니다.',
    examples: ['UNH', 'JNJ', 'LLY'],
  },
  XLE: {
    detail: '에너지 섹터는 석유/가스 탐사, 생산, 정제, 에너지 장비 기업으로 구성됩니다. 원유 가격에 민감합니다.',
    examples: ['XOM', 'CVX', 'COP'],
  },
  XLI: {
    detail: '산업재 섹터는 항공우주, 건설, 기계, 운송 기업으로 구성됩니다. 경기 사이클에 민감한 편입니다.',
    examples: ['CAT', 'BA', 'UNP'],
  },
  XLB: {
    detail: '소재 섹터는 화학, 금속/광업, 건축자재, 포장재 기업으로 구성됩니다. 원자재 가격에 영향을 받습니다.',
    examples: ['LIN', 'APD', 'FCX'],
  },
  XLY: {
    detail: '경기소비재 섹터는 자동차, 소매유통, 호텔/레저, 의류 기업으로 구성됩니다. 소비자 지출에 민감합니다.',
    examples: ['AMZN', 'TSLA', 'HD'],
  },
  XLP: {
    detail: '필수소비재 섹터는 식음료, 생활용품, 담배 기업으로 구성됩니다. 경기 방어적이며 배당 수익률이 높습니다.',
    examples: ['PG', 'KO', 'PEP'],
  },
  XLRE: {
    detail: '부동산 섹터는 리츠(REITs)와 부동산 개발/운영 기업으로 구성됩니다. 금리에 민감하며 배당 수익률이 높습니다.',
    examples: ['AMT', 'PLD', 'EQIX'],
  },
  XLU: {
    detail: '유틸리티 섹터는 전력, 가스, 수도 공급 기업으로 구성됩니다. 규제 산업으로 안정적이며 배당이 높습니다.',
    examples: ['NEE', 'DUK', 'SO'],
  },
  XLC: {
    detail: '커뮤니케이션 섹터는 미디어, 통신, 인터넷/소셜미디어 기업으로 구성됩니다. 광고 시장에 민감합니다.',
    examples: ['META', 'GOOGL', 'DIS'],
  },
};

type Period = '1D' | '1W' | '1M';

interface SectorData {
  symbol: string;
  name: string;
  name_en: string;
  description: string;
  price: number;
  change_1d: number;
  change_1w: number;
  change_1m: number;
}

interface SectorResponse {
  success: boolean;
  data: SectorData[] | null;
  last_updated: string | null;
  error: string | null;
}

export function SectorHeatmap() {
  const [period, setPeriod] = useState<Period>('1D');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sectors, setSectors] = useState<SectorData[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const response = await api.get<SectorResponse>('/api/economic/sectors');
      
      if (response.data.success && response.data.data) {
        setSectors(response.data.data);
        setLastUpdated(response.data.last_updated);
      } else {
        setError(response.data.error || '섹터 데이터를 불러올 수 없습니다.');
      }
    } catch (err) {
      console.error('섹터 데이터 조회 실패:', err);
      setError('섹터 데이터를 불러오는 중 오류가 발생했습니다.');
    }
  }, []);

  // 초기 로드
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };
    loadData();
  }, [fetchData]);

  // 기간에 따른 변화율 가져오기
  const getChange = (sector: SectorData): number => {
    switch (period) {
      case '1D': return sector.change_1d;
      case '1W': return sector.change_1w;
      case '1M': return sector.change_1m;
    }
  };

  // 변화율에 따른 배경색
  const getChangeColor = (change: number): string => {
    if (change >= 3) return 'bg-green-600 text-white';
    if (change >= 1) return 'bg-green-500 text-white';
    if (change >= 0) return 'bg-green-400/70 text-green-900 dark:text-green-100';
    if (change >= -1) return 'bg-red-400/70 text-red-900 dark:text-red-100';
    if (change >= -3) return 'bg-red-500 text-white';
    return 'bg-red-600 text-white';
  };

  // 변화율에 따른 텍스트 색상 (보조 정보용)
  const getSecondaryTextColor = (change: number): string => {
    if (change >= 1 || change <= -1) return 'text-white/70';
    return change >= 0 ? 'text-green-700/70 dark:text-green-200/70' : 'text-red-700/70 dark:text-red-200/70';
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  if (loading) {
    return <LoadingSpinner message="섹터 데이터 로딩 중..." />;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 text-center">
          <p className="text-destructive font-medium mb-2">오류 발생</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">섹터 로테이션</h2>
            <p className="text-sm text-muted-foreground">GICS 11개 섹터 ETF 성과</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 기간 선택 */}
          <div className="flex items-center bg-muted rounded-lg p-1">
            {(['1D', '1W', '1M'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
                  period === p
                    ? 'bg-background text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {p}
              </button>
            ))}
          </div>

          {/* 새로고침 */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="gap-2"
          >
            <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
            새로고침
          </Button>
        </div>
      </div>

      {/* 히트맵 그리드 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {sectors.map((sector) => {
          const change = getChange(sector);
          const colorClass = getChangeColor(change);
          const secondaryTextClass = getSecondaryTextColor(change);
          const detail = SECTOR_DETAIL[sector.symbol];

          return (
            <div
              key={sector.symbol}
              className={cn(
                'rounded-lg p-4 transition-all duration-200 cursor-pointer hover:scale-[1.02] hover:shadow-lg',
                colorClass
              )}
            >
              {/* 상단: 심볼 + 한글명 + 툴팁 */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-lg">{sector.symbol}</div>
                  <div className="text-sm opacity-90">{sector.name}</div>
                </div>
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button className="p-1 rounded hover:bg-white/20 transition-colors">
                        <Info className="h-4 w-4 opacity-70 cursor-help" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent 
                      side="top" 
                      className="max-w-xs whitespace-pre-line text-left"
                    >
                      <p className="font-medium mb-1">{sector.symbol} ({sector.name})</p>
                      <p className="text-xs text-muted-foreground mb-2">{detail?.detail}</p>
                      <p className="text-xs">
                        <span className="text-muted-foreground">대표 종목: </span>
                        {detail?.examples.join(', ')}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              {/* 설명 */}
              <div className={cn('text-xs mt-2 line-clamp-1', secondaryTextClass)}>
                {sector.description}
              </div>
              
              {/* 변화율 */}
              <div className="flex items-center gap-1 mt-3">
                <span className="text-xl font-semibold">
                  {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                </span>
                {change >= 0 ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
              </div>
              
              {/* 현재가 */}
              <div className={cn('text-sm', secondaryTextClass)}>
                ${sector.price.toFixed(2)}
              </div>
            </div>
          );
        })}
      </div>

      {/* 푸터 */}
      <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>
            마지막 업데이트: {lastUpdated 
              ? new Date(lastUpdated).toLocaleString('ko-KR') 
              : '-'}
          </span>
        </div>
        {refreshing && (
          <div className="text-xs">업데이트 중...</div>
        )}
      </div>
    </div>
  );
}
