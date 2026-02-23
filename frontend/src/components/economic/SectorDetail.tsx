import { useState, useEffect } from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';
import { X, Loader2, AlertCircle, Key } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { getChangeColor, SECTOR_INFO } from './sectorConstants';
import { TreemapLegend } from './TreemapLegend';

interface SectorHolding {
  symbol: string;
  name: string;
  weight: number;
  price: number | null;
  change_1d: number | null;
}

interface SectorHoldingsResponse {
  success: boolean;
  sector_symbol: string | null;
  sector_name: string | null;
  holdings: SectorHolding[] | null;
  last_updated: string | null;
  error: string | null;
  note?: string | null;
  requires_kis_key?: boolean;
}

interface SectorDetailProps {
  symbol: string;
  name: string;
  onClose: () => void;
  onStockClick?: (symbol: string) => void;
}

// 커스텀 툴팁 (섹터 히트맵과 동일한 스타일)
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-popover border rounded-lg shadow-lg p-3 max-w-xs">
      <div className="font-semibold mb-1">{data.isKorea ? data.name : data.symbol}</div>
      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
        {data.isKorea ? data.symbol : data.name}
      </p>
      <div className="space-y-1 text-xs">
        {data.weight !== null && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">비중</span>
            <span className="font-medium">{data.weight.toFixed(2)}%</span>
          </div>
        )}
        {data.price !== null && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">가격</span>
            <span className="font-medium">${data.price.toFixed(2)}</span>
          </div>
        )}
        {data.change !== null && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">변화율</span>
            <span
              className={cn('font-medium', data.change >= 0 ? 'text-green-600' : 'text-red-600')}
            >
              {data.change >= 0 ? '+' : ''}
              {data.change.toFixed(2)}%
            </span>
          </div>
        )}
      </div>
      <div className="mt-2 pt-2 border-t text-xs text-muted-foreground">
        클릭하여 상세 페이지 이동
      </div>
    </div>
  );
};

// 커스텀 Treemap 셀 (섹터 히트맵과 동일한 스타일)
const CustomTreemapContent = (props: any) => {
  const { x, y, width, height, depth, symbol, name, weight, change, color, onStockClick, isKorea } =
    props;

  // root 노드는 렌더링하지 않음 (depth === 1이 실제 데이터)
  if (depth === 0 || !symbol) {
    return null;
  }

  // 섹터 히트맵과 동일한 조건
  const showFullInfo = width > 100 && height > 70;
  const showSymbol = width > 60 && height > 40;

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
        onClick={() => onStockClick && onStockClick(symbol)}
      />
      {showSymbol && (
        <>
          {/* 메인 텍스트: 한국은 종목명, 미국은 심볼 */}
          <text
            x={x + width / 2}
            y={y + (showFullInfo ? height / 2 - 12 : height / 2 - 4)}
            textAnchor="middle"
            fill="#ffffff"
            stroke="none"
            fontSize={showFullInfo ? 18 : 14}
            fontWeight="bold"
            style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
            className="pointer-events-none select-none"
          >
            {isKorea ? name : symbol}
          </text>

          {showFullInfo && (
            <>
              {/* 비중 (weight가 있을 때만) */}
              {weight !== null && (
                <text
                  x={x + width / 2}
                  y={y + height / 2 + 6}
                  textAnchor="middle"
                  fill="#ffffff"
                  stroke="none"
                  fontSize={13}
                  fontWeight="500"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                  className="pointer-events-none select-none"
                >
                  {weight.toFixed(1)}%
                </text>
              )}

              {/* 변화율 */}
              {change !== null && (
                <text
                  x={x + width / 2}
                  y={y + height / 2 + 24}
                  textAnchor="middle"
                  fill="#ffffff"
                  stroke="none"
                  fontSize={16}
                  fontWeight="bold"
                  style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
                  className="pointer-events-none select-none"
                >
                  {change >= 0 ? '+' : ''}
                  {change.toFixed(2)}%
                </text>
              )}
            </>
          )}

          {/* 작은 셀에서 변화율만 표시 */}
          {!showFullInfo && width > 70 && change !== null && (
            <text
              x={x + width / 2}
              y={y + height / 2 + 12}
              textAnchor="middle"
              fill="#ffffff"
              stroke="none"
              fontSize={12}
              fontWeight="bold"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
              className="pointer-events-none select-none"
            >
              {change >= 0 ? '+' : ''}
              {change.toFixed(1)}%
            </text>
          )}
        </>
      )}
    </g>
  );
};

export function SectorDetail({ symbol, name, onClose, onStockClick }: SectorDetailProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [holdings, setHoldings] = useState<SectorHolding[]>([]);
  const [requiresKisKey, setRequiresKisKey] = useState(false);

  useEffect(() => {
    const fetchHoldings = async () => {
      try {
        setLoading(true);
        setError(null);
        setRequiresKisKey(false);

        const response = await api.get<SectorHoldingsResponse>(
          `/api/economic/sectors/${symbol}/holdings`,
        );

        if (response.data.success && response.data.holdings) {
          setHoldings(response.data.holdings);
          // pykrx fallback인 경우 KIS 키 안내 배너 표시
          if (response.data.requires_kis_key) {
            setRequiresKisKey(true);
          }
        } else {
          setError(response.data.error || '보유 종목을 불러올 수 없습니다.');
        }
      } catch (err) {
        setError('보유 종목을 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchHoldings();
  }, [symbol]);

  const handleStockClick = (stockSymbol: string) => {
    if (onStockClick) {
      onStockClick(stockSymbol);
    }
  };

  // 한국 섹터인지 확인
  const isKorea = symbol.endsWith('.KS');

  // Treemap 데이터 생성
  const treemapData = holdings.map((holding) => ({
    symbol: holding.symbol,
    name: holding.name,
    weight: holding.weight,
    size: Math.max(holding.weight, 0.5), // 최소 크기 보장
    price: holding.price,
    change: holding.change_1d,
    color: getChangeColor(holding.change_1d),
    isKorea,
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-background border rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[85vh] overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span className="text-primary">{symbol}</span>
              <span className="text-muted-foreground">|</span>
              <span>{name}</span>
            </h3>
            {/* 초보자 친화 비유 설명 */}
            {SECTOR_INFO[symbol] && (
              <p className="text-sm text-muted-foreground/80 italic mt-1">
                {SECTOR_INFO[symbol].metaphor}
              </p>
            )}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* 섹터 설명 */}
        {SECTOR_INFO[symbol] && (
          <div className="px-4 py-3 bg-muted/20 border-b">
            <p className="text-sm text-muted-foreground">{SECTOR_INFO[symbol].description}</p>
          </div>
        )}

        {/* 컨텐츠 */}
        <div className="p-4 overflow-y-auto max-h-[calc(85vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">로딩 중...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <AlertCircle className="h-10 w-10 text-destructive mb-3" />
              <p className="text-destructive font-medium mb-1">오류 발생</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* KIS API 키 안내 배너 (pykrx fallback 시) */}
              {requiresKisKey && (
                <div className="flex items-start gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <Key className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground font-medium">마감 데이터로 표시 중</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      한국투자증권 API 키를 설정하면 실시간 상세 정보(비중 포함)를 확인할 수
                      있습니다.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-shrink-0 h-7 text-xs"
                    onClick={() => {
                      onClose();
                      window.location.href = '/settings';
                    }}
                  >
                    설정
                  </Button>
                </div>
              )}
              {/* 트리맵 */}
              <div className="h-[300px] w-full rounded-lg overflow-hidden border bg-gray-900">
                <ResponsiveContainer width="100%" height="100%">
                  <Treemap
                    data={treemapData}
                    dataKey="size"
                    aspectRatio={4 / 3}
                    stroke="#374151"
                    isAnimationActive={false}
                    content={<CustomTreemapContent onStockClick={handleStockClick} />}
                  >
                    <Tooltip content={<CustomTooltip />} />
                  </Treemap>
                </ResponsiveContainer>
              </div>

              {/* 범례 */}
              <TreemapLegend />

              {/* 상위 5개 종목 상세 */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-3 py-2 text-sm font-medium">상위 5개 보유 종목</div>
                <div className="divide-y">
                  {holdings.slice(0, 5).map((holding, index) => (
                    <div
                      key={holding.symbol}
                      onClick={() => handleStockClick(holding.symbol)}
                      className="flex items-center justify-between p-3 hover:bg-muted/30 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-muted-foreground w-5">
                          {index + 1}
                        </span>
                        <div>
                          <div className="font-semibold text-sm">
                            {isKorea ? holding.name : holding.symbol}
                          </div>
                          <div className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                            {isKorea ? holding.symbol : holding.name}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        {holding.weight !== null && (
                          <div>
                            <div className="text-sm font-medium">{holding.weight.toFixed(2)}%</div>
                            <div className="text-xs text-muted-foreground">비중</div>
                          </div>
                        )}
                        {holding.change_1d !== null && (
                          <div
                            className={cn(
                              'text-sm font-medium min-w-[60px] text-right',
                              holding.change_1d >= 0 ? 'text-green-600' : 'text-red-600',
                            )}
                          >
                            {holding.change_1d >= 0 ? '+' : ''}
                            {holding.change_1d.toFixed(2)}%
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        {!loading && !error && (
          <div className="p-3 border-t bg-muted/20">
            <p className="text-xs text-muted-foreground text-center">
              셀 크기는 비중을, 색상은 일일 변화율을 나타냅니다
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
