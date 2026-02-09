import { useState, useEffect, useCallback } from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';
import { TrendingUp, RefreshCw, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SectorDetail } from './SectorDetail';
import type { Country } from '@/types/economic';

// 섹터 상세 설명 (툴팁용)
const SECTOR_DETAIL: Record<string, string> = {
  // 미국 섹터
  XLK: '기술 섹터는 하드웨어, 소프트웨어, 반도체, IT 서비스 기업으로 구성됩니다. 성장주 중심으로 금리에 민감합니다.',
  XLF: '금융 섹터는 은행, 보험사, 자산운용사, 투자은행으로 구성됩니다. 금리 상승 시 수혜를 받는 경향이 있습니다.',
  XLV: '헬스케어 섹터는 제약, 바이오테크, 의료기기, 헬스케어 서비스 기업으로 구성됩니다. 경기 방어적 성격이 있습니다.',
  XLE: '에너지 섹터는 석유/가스 탐사, 생산, 정제, 에너지 장비 기업으로 구성됩니다. 원유 가격에 민감합니다.',
  XLI: '산업재 섹터는 항공우주, 건설, 기계, 운송 기업으로 구성됩니다. 경기 사이클에 민감한 편입니다.',
  XLB: '소재 섹터는 화학, 금속/광업, 건축자재, 포장재 기업으로 구성됩니다. 원자재 가격에 영향을 받습니다.',
  XLY: '경기소비재 섹터는 자동차, 소매유통, 호텔/레저, 의류 기업으로 구성됩니다. 소비자 지출에 민감합니다.',
  XLP: '필수소비재 섹터는 식음료, 생활용품, 담배 기업으로 구성됩니다. 경기 방어적이며 배당 수익률이 높습니다.',
  XLRE: '부동산 섹터는 리츠(REITs)와 부동산 개발/운영 기업으로 구성됩니다. 금리에 민감하며 배당 수익률이 높습니다.',
  XLU: '유틸리티 섹터는 전력, 가스, 수도 공급 기업으로 구성됩니다. 규제 산업으로 안정적이며 배당이 높습니다.',
  XLC: '커뮤니케이션 섹터는 미디어, 통신, 인터넷/소셜미디어 기업으로 구성됩니다. 광고 시장에 민감합니다.',
  // 한국 섹터
  '091160.KS': '반도체 섹터는 삼성전자, SK하이닉스 등 메모리 반도체 세계 1위 기업들로 구성됩니다. 글로벌 IT 수요에 민감합니다.',
  '091170.KS': '은행 섹터는 KB금융, 신한지주, 하나금융 등 대형 금융그룹으로 구성됩니다. 금리와 부동산 시장에 영향받습니다.',
  '266420.KS': '헬스케어 섹터는 삼성바이오, 셀트리온 등 바이오시밀러 강자들로 구성됩니다. 글로벌 제약시장 진출이 특징입니다.',
  '117460.KS': '에너지화학 섹터는 LG화학, SK이노베이션 등으로 구성됩니다. 유가와 배터리 수요에 민감합니다.',
  '266370.KS': 'IT 섹터는 네이버, 카카오 등 플랫폼 기업으로 구성됩니다. 광고 시장과 신사업 성장에 영향받습니다.',
  '091180.KS': '자동차 섹터는 현대차, 기아 등 완성차와 부품사로 구성됩니다. 전기차 전환이 핵심 이슈입니다.',
  '117700.KS': '건설 섹터는 삼성물산, 현대건설 등으로 구성됩니다. 부동산 경기와 해외수주에 영향받습니다.',
  '140710.KS': '운송 섹터는 HMM, 대한항공 등으로 구성됩니다. 글로벌 물류 수요와 유가에 민감합니다.',
  '102970.KS': '증권 섹터는 미래에셋, 한국투자 등으로 구성됩니다. 주식시장 거래대금과 금리에 영향받습니다.',
  '266390.KS': '경기소비재 섹터는 호텔신라, 현대백화점 등으로 구성됩니다. 소비심리와 관광 수요에 민감합니다.',
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
  market_cap: number;
  top_holdings: string[];  // 상위 보유 종목 (API에서 동적 조회)
}

interface SectorResponse {
  success: boolean;
  data: SectorData[] | null;
  last_updated: string | null;
  error: string | null;
}

// 변화율에 따른 색상 반환 (더 진한 색상으로 가시성 향상)
const getChangeColor = (change: number): string => {
  if (change >= 3) return '#15803d';      // green-700
  if (change >= 1) return '#16a34a';      // green-600
  if (change >= 0) return '#22c55e';      // green-500
  if (change >= -1) return '#ef4444';     // red-500
  if (change >= -3) return '#dc2626';     // red-600
  return '#b91c1c';                        // red-700
};

// 텍스트 색상 (항상 흰색으로 통일)
const getTextColor = (): string => '#ffffff';

// 커스텀 툴팁
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;
  const detail = SECTOR_DETAIL[data.symbol];
  const topHoldings = data.data?.top_holdings || [];

  if (!detail) return null;

  return (
    <div className="bg-popover border rounded-lg shadow-lg p-3 max-w-xs">
      <div className="font-semibold mb-1">
        {data.symbol} ({data.korName})
      </div>
      <p className="text-xs text-muted-foreground mb-2">{detail}</p>
      {topHoldings.length > 0 && (
        <p className="text-xs">
          <span className="text-muted-foreground">대표 종목: </span>
          {topHoldings.join(', ')}
        </p>
      )}
      <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
        클릭하여 상위 종목 확인
      </div>
    </div>
  );
};

// 커스텀 Treemap 셀
const CustomTreemapContent = (props: any) => {
  const { x, y, width, height, depth, symbol, korName, change, price, color, onSectorClick, data, isKorea } = props;

  // root 노드는 렌더링하지 않음 (depth === 1이 실제 데이터)
  if (depth === 0 || !symbol) {
    return null;
  }

  // 너무 작은 셀은 텍스트 생략
  const showFullInfo = width > 100 && height > 70;
  const showSymbol = width > 60 && height > 40;
  const textColor = getTextColor();

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={color}
        stroke="#1f2937"
        strokeWidth={2}
        rx={4}
        className="cursor-pointer transition-opacity hover:opacity-90"
        onClick={() => data && onSectorClick(data)}
      />
      {showSymbol && (
        <>
          {/* 메인 텍스트: 한국은 종목명, 미국은 심볼 */}
          <text
            x={x + width / 2}
            y={y + (showFullInfo ? height / 2 - 18 : height / 2 - 6)}
            textAnchor="middle"
            fill={textColor}
            stroke="none"
            fontSize={showFullInfo ? 18 : 14}
            fontWeight="bold"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
            className="pointer-events-none select-none"
          >
            {isKorea ? korName : symbol}
          </text>

          {showFullInfo && (
            <>
              {/* 서브 텍스트: 한국은 심볼, 미국은 한글명 */}
              <text
                x={x + width / 2}
                y={y + height / 2 + 2}
                textAnchor="middle"
                fill={textColor}
                stroke="none"
                fontSize={13}
                fontWeight="500"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                className="pointer-events-none select-none"
              >
                {isKorea ? symbol : korName}
              </text>

              {/* 변화율 */}
              <text
                x={x + width / 2}
                y={y + height / 2 + 22}
                textAnchor="middle"
                fill={textColor}
                stroke="none"
                fontSize={16}
                fontWeight="bold"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                className="pointer-events-none select-none"
              >
                {(change ?? 0) >= 0 ? '+' : ''}{(change ?? 0).toFixed(2)}%
              </text>

              {/* 가격 */}
              {width > 120 && height > 90 && price != null && (
                <text
                  x={x + width / 2}
                  y={y + height / 2 + 40}
                  textAnchor="middle"
                  fill={textColor}
                  stroke="none"
                  fontSize={12}
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                  className="pointer-events-none select-none"
                >
                  {isKorea ? `₩${price.toLocaleString()}` : `$${price.toFixed(2)}`}
                </text>
              )}
            </>
          )}

          {/* 작은 셀에서 변화율만 표시 */}
          {!showFullInfo && width > 70 && (
            <text
              x={x + width / 2}
              y={y + height / 2 + 10}
              textAnchor="middle"
              fill={textColor}
              stroke="none"
              fontSize={12}
              fontWeight="bold"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
              className="pointer-events-none select-none"
            >
              {(change ?? 0) >= 0 ? '+' : ''}{(change ?? 0).toFixed(1)}%
            </text>
          )}
        </>
      )}
    </g>
  );
};

interface SectorHeatmapProps {
  country: Country;
}

export function SectorHeatmap({ country }: SectorHeatmapProps) {
  const [period, setPeriod] = useState<Period>('1D');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sectors, setSectors] = useState<SectorData[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [selectedSector, setSelectedSector] = useState<SectorData | null>(null);

  const fetchData = useCallback(async () => {
    if (country === null) return;
    try {
      setError(null);
      const response = await api.get<SectorResponse>(`/api/economic/sectors?country=${country}`);

      if (response.data.success && response.data.data) {
        setSectors(response.data.data);
        setLastUpdated(response.data.last_updated);
      } else {
        setError(response.data.error || '섹터 데이터를 불러올 수 없습니다.');
      }
    } catch (err) {
      setError('섹터 데이터를 불러오는 중 오류가 발생했습니다.');
    }
  }, [country]);

  useEffect(() => {
    if (country === null) return;
    const loadData = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };
    loadData();
  }, [fetchData, country]);

  // 기간에 따른 변화율
  const getChange = (sector: SectorData): number => {
    switch (period) {
      case '1D': return sector.change_1d;
      case '1W': return sector.change_1w;
      case '1M': return sector.change_1m;
    }
  };

  // Treemap 데이터 생성
  const treemapData = sectors.map((sector) => {
    const change = getChange(sector);
    // 한국 섹터인지 확인 (.KS 접미사)
    const isKorea = sector.symbol.endsWith('.KS');
    return {
      name: sector.symbol,
      symbol: sector.symbol,
      korName: sector.name,
      size: Math.max(sector.market_cap, 1000000000), // 최소 크기 보장
      change,
      price: sector.price,
      color: getChangeColor(change),
      data: sector,
      isKorea,
    };
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleSectorClick = (sector: SectorData) => {
    setSelectedSector(sector);
  };

  const handleCloseSectorDetail = () => {
    setSelectedSector(null);
  };

  const handleStockClick = (symbol: string) => {
    window.open(`/stock/${symbol}`, '_blank');
  };

  // 국가 선택 안내
  if (country === null) {
    return (
      <div className="flex items-center justify-center h-[calc(100%-80px)]">
        <div className="text-center max-w-md px-6">
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
              <TrendingUp className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              섹터 정보를 확인할 국가를 선택하세요
            </h3>
            <p className="text-sm text-muted-foreground">
              상단 우측의 국가 탭을 클릭하여 시작하세요.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner message="섹터 데이터 로딩 중..." />;
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 text-center">
          <p className="text-destructive font-medium mb-2">오류 발생</p>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={handleRefresh} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">섹터 로테이션</h2>
            <p className="text-sm text-muted-foreground">
              {country === 'us' && 'GICS 11개 섹터 ETF (AUM 기준)'}
              {country === 'kr' && 'KODEX 10개 섹터 ETF (AUM 기준)'}
              {country === 'all' && '미국 11개 + 한국 10개 섹터 ETF'}
            </p>
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

      {/* 트리맵 */}
      <div className="h-[400px] w-full rounded-lg overflow-hidden border bg-gray-900">
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={treemapData}
            dataKey="size"
            aspectRatio={4 / 3}
            stroke="#374151"
            isAnimationActive={false}
            content={<CustomTreemapContent onSectorClick={handleSectorClick} />}
          >
            <Tooltip content={<CustomTooltip />} />
          </Treemap>
        </ResponsiveContainer>
      </div>

      {/* 범례 */}
      <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-3 rounded-sm bg-green-600" />
            <span>+3% 이상</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-3 rounded-sm bg-green-500" />
            <span>+1~3%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-3 rounded-sm bg-green-300" />
            <span>0~+1%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-3 rounded-sm bg-red-300" />
            <span>0~-1%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-3 rounded-sm bg-red-500" />
            <span>-1~-3%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-3 rounded-sm bg-red-600" />
            <span>-3% 이하</span>
          </div>
        </div>
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
        <div className="text-xs">클릭하여 상위 종목 확인</div>
      </div>

      {/* 섹터 상세 모달 */}
      {selectedSector && (
        <SectorDetail
          symbol={selectedSector.symbol}
          name={selectedSector.name}
          onClose={handleCloseSectorDetail}
          onStockClick={handleStockClick}
        />
      )}
    </div>
  );
}
