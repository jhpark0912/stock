import { useState, useEffect, useCallback } from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';
import { TrendingUp, RefreshCw, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { SectorDetail } from './SectorDetail';
import { getChangeColor, SECTOR_DETAIL } from './sectorConstants';
import { TreemapLegend } from './TreemapLegend';
import type { Country } from '@/types/economic';

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
  top_holdings: string[]; // 상위 보유 종목 (API에서 동적 조회)
}

interface SectorResponse {
  success: boolean;
  data: SectorData[] | null;
  last_updated: string | null;
  error: string | null;
}

// 텍스트 색상 (항상 흰색으로 통일)
const getTextColor = (): string => '#ffffff';

// 커스텀 Treemap 셀
const CustomTreemapContent = (props: any) => {
  const {
    x,
    y,
    width,
    height,
    depth,
    symbol,
    korName,
    change,
    price,
    color,
    onSectorClick,
    data,
    isKorea,
  } = props;

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
                {(change ?? 0) >= 0 ? '+' : ''}
                {(change ?? 0).toFixed(2)}%
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
              {(change ?? 0) >= 0 ? '+' : ''}
              {(change ?? 0).toFixed(1)}%
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
      case '1D':
        return sector.change_1d;
      case '1W':
        return sector.change_1w;
      case '1M':
        return sector.change_1m;
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
            <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
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
      <div className="p-3 sm:p-6">
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
    <div className="p-3 sm:p-6 space-y-3 sm:space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">섹터 로테이션</h2>
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
                    : 'text-muted-foreground hover:text-foreground',
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
      <div className="h-[280px] sm:h-[350px] md:h-[400px] w-full rounded-lg overflow-hidden border bg-gray-900">
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
      <TreemapLegend />

      {/* 푸터 */}
      <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>
            마지막 업데이트: {lastUpdated ? new Date(lastUpdated).toLocaleString('ko-KR') : '-'}
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
