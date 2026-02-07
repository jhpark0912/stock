import { useState, useEffect } from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';
import {
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';

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
}

interface SectorDetailProps {
  symbol: string;
  name: string;
  onClose: () => void;
  onStockClick?: (symbol: string) => void;
}

// 섹터별 초보자 친화 설명 (경제지표의 metaphor 스타일)
const SECTOR_INFO: Record<string, { metaphor: string; description: string }> = {
  XLK: {
    metaphor: '💻 "미래를 만드는 기업들의 집합소"',
    description: '애플, 마이크로소프트, 엔비디아 등 IT 기업들이 모여있어요. 금리가 오르면 주가가 빠지는 경향이 있어요.',
  },
  XLF: {
    metaphor: '🏦 "돈이 흐르는 곳"',
    description: '은행, 보험사, 증권사 등이 포함돼요. 금리가 오르면 이자 수익이 늘어나 좋아지는 편이에요.',
  },
  XLV: {
    metaphor: '💊 "건강은 불황도 이긴다"',
    description: '제약, 의료기기 회사들이에요. 경기가 나빠도 사람들은 아프면 병원에 가야 해서 안정적이에요.',
  },
  XLE: {
    metaphor: '⛽ "세상을 움직이는 연료"',
    description: '석유, 가스 회사들이에요. 유가가 오르면 함께 오르고, 유가가 떨어지면 함께 떨어져요.',
  },
  XLI: {
    metaphor: '🏗️ "경제가 잘 돌아가면 바빠지는 곳"',
    description: '항공, 건설, 기계 회사들이에요. 경기가 좋아지면 공장이 돌아가고 물건이 옮겨져요.',
  },
  XLB: {
    metaphor: '🧱 "모든 제품의 원재료"',
    description: '철강, 화학, 건축자재 회사들이에요. 원자재 가격과 함께 움직이는 편이에요.',
  },
  XLY: {
    metaphor: '🛍️ "지갑이 두꺼워지면 찾는 곳"',
    description: '자동차, 명품, 호텔, 레저 회사들이에요. 사람들이 돈을 쓰고 싶을 때 좋아져요.',
  },
  XLP: {
    metaphor: '🧴 "매일 쓰는 생필품"',
    description: '식품, 음료, 생활용품 회사들이에요. 경기가 나빠도 사람들은 밥은 먹어야 해서 안정적이에요.',
  },
  XLRE: {
    metaphor: '🏠 "땅과 건물의 힘"',
    description: '부동산 투자 회사(리츠)들이에요. 금리가 오르면 부담이 커져서 주가가 빠지는 편이에요.',
  },
  XLU: {
    metaphor: '💡 "전기와 물은 언제나 필요해"',
    description: '전력, 가스, 수도 회사들이에요. 필수 서비스라 안정적이고 배당금도 잘 줘요.',
  },
  XLC: {
    metaphor: '📱 "소통과 콘텐츠의 세상"',
    description: '구글, 메타, 넷플릭스 같은 회사들이에요. 광고 시장과 함께 움직이는 경향이 있어요.',
  },
};

// 변화율에 따른 색상 반환 (섹터 히트맵과 동일)
const getChangeColor = (change: number | null): string => {
  if (change === null) return '#6b7280'; // gray-500
  if (change >= 3) return '#15803d';      // green-700
  if (change >= 1) return '#16a34a';      // green-600
  if (change >= 0) return '#22c55e';      // green-500
  if (change >= -1) return '#ef4444';     // red-500
  if (change >= -3) return '#dc2626';     // red-600
  return '#b91c1c';                        // red-700
};

// 커스텀 툴팁 (섹터 히트맵과 동일한 스타일)
const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-popover border rounded-lg shadow-lg p-3 max-w-xs">
      <div className="font-semibold mb-1">
        {data.symbol}
      </div>
      <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
        {data.name}
      </p>
      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">비중</span>
          <span className="font-medium">{data.weight.toFixed(2)}%</span>
        </div>
        {data.price !== null && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">가격</span>
            <span className="font-medium">${data.price.toFixed(2)}</span>
          </div>
        )}
        {data.change !== null && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">변화율</span>
            <span className={cn(
              'font-medium',
              data.change >= 0 ? 'text-green-600' : 'text-red-600'
            )}>
              {data.change >= 0 ? '+' : ''}{data.change.toFixed(2)}%
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
  const { x, y, width, height, depth, symbol, weight, change, color, onStockClick } = props;

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
          {/* 심볼 */}
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
            {symbol}
          </text>

          {showFullInfo && (
            <>
              {/* 비중 */}
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
                  {change >= 0 ? '+' : ''}{change.toFixed(2)}%
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
              {change >= 0 ? '+' : ''}{change.toFixed(1)}%
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

  useEffect(() => {
    const fetchHoldings = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.get<SectorHoldingsResponse>(
          `/api/economic/sectors/${symbol}/holdings`
        );

        if (response.data.success && response.data.holdings) {
          setHoldings(response.data.holdings);
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

  // Treemap 데이터 생성
  const treemapData = holdings.map((holding) => ({
    symbol: holding.symbol,
    name: holding.name,
    weight: holding.weight,
    size: Math.max(holding.weight, 0.5), // 최소 크기 보장
    price: holding.price,
    change: holding.change_1d,
    color: getChangeColor(holding.change_1d),
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
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* 섹터 설명 */}
        {SECTOR_INFO[symbol] && (
          <div className="px-4 py-3 bg-muted/20 border-b">
            <p className="text-sm text-muted-foreground">
              {SECTOR_INFO[symbol].description}
            </p>
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
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle className="h-10 w-10 text-destructive mb-3" />
              <p className="text-destructive font-medium mb-1">오류 발생</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          ) : (
            <div className="space-y-4">
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

              {/* 범례 (메인 화면과 동일) */}
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

              {/* 상위 3개 종목 상세 */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-3 py-2 text-sm font-medium">
                  상위 3개 종목
                </div>
                <div className="divide-y">
                  {holdings.slice(0, 3).map((holding, index) => (
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
                          <div className="font-semibold text-sm">{holding.symbol}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                            {holding.name}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <div className="text-sm font-medium">{holding.weight.toFixed(2)}%</div>
                          <div className="text-xs text-muted-foreground">비중</div>
                        </div>
                        {holding.change_1d !== null && (
                          <div className={cn(
                            'text-sm font-medium min-w-[60px] text-right',
                            holding.change_1d >= 0 ? 'text-green-600' : 'text-red-600'
                          )}>
                            {holding.change_1d >= 0 ? '+' : ''}{holding.change_1d.toFixed(2)}%
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
