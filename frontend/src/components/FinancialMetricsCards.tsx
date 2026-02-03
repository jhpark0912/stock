import { TrendingUpIcon, Target, ShieldAlert, Coins } from "lucide-react"
import type { StockData } from '../types/stock';
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

// Helper functions from StockInfo
type MetricStatus = 'good' | 'neutral' | 'warning' | 'bad';

const formatValue = (value: number | null, format: 'number' | 'percent' = 'number'): string => {
  if (value === null || value === undefined) return 'N/A';
  return format === 'percent' ? `${(value * 100).toFixed(1)}%` : value.toFixed(2);
};

const getMetricStatus = (
  metricType: string,
  value: number | null
): { status: MetricStatus; percentage: number } => {
  if (value === null || value === undefined) {
    return { status: 'neutral', percentage: 0 };
  }

  let status: MetricStatus = 'neutral';
  let percentage = 50;

  switch (metricType) {
    case 'PER':
    case 'PER_FORWARD':
      if (value < 15) {
        status = 'good';
        percentage = Math.min((15 - value) / 15 * 100, 100);
      } else if (value <= 25) {
        status = 'neutral';
        percentage = ((value - 15) / 10) * 100;
      } else {
        status = 'warning';
        percentage = Math.min(((value - 25) / 25) * 100, 100);
      }
      break;

    case 'PBR':
      if (value < 1) {
        status = 'good';
        percentage = (1 - value) * 100;
      } else if (value <= 3) {
        status = 'neutral';
        percentage = ((value - 1) / 2) * 100;
      } else {
        status = 'warning';
        percentage = Math.min(((value - 3) / 3) * 100, 100);
      }
      break;

    case 'ROE':
      if (value > 0.15) {
        status = 'good';
        percentage = Math.min((value * 100 - 15) / 15 * 100, 100);
      } else if (value >= 0.10) {
        status = 'neutral';
        percentage = ((value - 0.10) / 0.05) * 100;
      } else {
        status = 'bad';
        percentage = Math.max((0.10 - value) / 0.10 * 100, 0);
      }
      break;

    case 'OPM':
      if (value > 0.20) {
        status = 'good';
        percentage = Math.min((value * 100 - 20) / 20 * 100, 100);
      } else if (value >= 0.10) {
        status = 'neutral';
        percentage = ((value - 0.10) / 0.10) * 100;
      } else {
        status = 'bad';
        percentage = Math.max((0.10 - value) / 0.10 * 100, 0);
      }
      break;

    case 'DEBT':
      if (value < 0.50) {
        status = 'good';
        percentage = (0.50 - value) / 0.50 * 100;
      } else if (value <= 1.00) {
        status = 'neutral';
        percentage = ((value - 0.50) / 0.50) * 100;
      } else {
        status = 'bad';
        percentage = Math.min(((value - 1.00) / 1.00) * 100, 100);
      }
      break;

    case 'DIVIDEND':
      if (value > 0.03) {
        status = 'good';
        percentage = Math.min((value * 100 - 3) / 3 * 100, 100);
      } else if (value >= 0.01) {
        status = 'neutral';
        percentage = ((value - 0.01) / 0.02) * 100;
      } else {
        status = 'bad';
        percentage = Math.max((0.01 - value) / 0.01 * 100, 0);
      }
      break;

    default:
      percentage = 50;
      break;
  }

  return { status, percentage: Math.min(Math.max(percentage, 0), 100) };
};

const getStatusBadgeVariant = (status: MetricStatus): "default" | "secondary" | "destructive" | "outline" => {
  if (status === 'good') return 'default';
  if (status === 'bad' || status === 'warning') return 'destructive';
  return 'outline';
};

const getStatusText = (status: MetricStatus): string => {
  const texts = {
    good: '양호',
    neutral: '보통',
    warning: '주의',
    bad: '위험'
  };
  return texts[status] || '보통';
};

interface FinancialMetricsCardsProps {
  data: StockData;
  className?: string;
}

export function FinancialMetricsCards({ data, className }: FinancialMetricsCardsProps) {
  const perStatus = getMetricStatus('PER', data.financials.trailing_pe);
  const perForwardStatus = getMetricStatus('PER_FORWARD', data.financials.forward_pe);
  const pbrStatus = getMetricStatus('PBR', data.financials.pbr);
  const roeStatus = getMetricStatus('ROE', data.financials.roe);
  const opmStatus = getMetricStatus('OPM', data.financials.opm);
  const debtStatus = getMetricStatus('DEBT', data.financials.debt_to_equity);
  const dividendStatus = getMetricStatus('DIVIDEND', data.financials.dividend_yield);

  return (
    <div className={className}>
      <h3 className="text-2xl font-bold mb-6 text-foreground">주요 재무 지표</h3>

      {/* 밸류에이션 */}
      <div className="mb-8">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">밸류에이션</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>PER (현재)</CardDescription>
              <CardTitle className="text-3xl font-bold tabular-nums">
                {formatValue(data.financials.trailing_pe, 'number')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-sm font-medium flex items-center gap-1">
                {perStatus.status === 'good' && '저평가 구간'}
                {perStatus.status === 'neutral' && '적정 구간'}
                {perStatus.status === 'warning' && '고평가 구간'}
                <TrendingUpIcon className="size-4" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                현재 주가 대비 이익 비율
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>PER (미래)</CardDescription>
              <CardTitle className="text-3xl font-bold tabular-nums">
                {formatValue(data.financials.forward_pe, 'number')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-sm font-medium">
                {perForwardStatus.status === 'good' && '긍정적 전망'}
                {perForwardStatus.status === 'neutral' && '중립적 전망'}
                {perForwardStatus.status === 'warning' && '주의 필요'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                예상 이익 기준 비율
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>PBR</CardDescription>
              <CardTitle className="text-3xl font-bold tabular-nums">
                {formatValue(data.financials.pbr, 'number')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-sm font-medium">
                {pbrStatus.status === 'good' && '자산 가치 대비 저평가'}
                {pbrStatus.status === 'neutral' && '적정 수준'}
                {pbrStatus.status === 'warning' && '자산 가치 대비 고평가'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                주가순자산비율
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>PEG 비율</CardDescription>
              <CardTitle className="text-3xl font-bold tabular-nums">
                {formatValue(data.financials.peg, 'number')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-sm font-medium">
                성장성 대비 밸류에이션
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                PER 대비 성장률
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 수익성 */}
      <div className="mb-8">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">수익성</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>ROE</CardDescription>
              <CardTitle className="text-3xl font-bold tabular-nums">
                {formatValue(data.financials.roe, 'percent')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-sm font-medium flex items-center gap-1">
                {roeStatus.status === 'good' && '우수한 수익성'}
                {roeStatus.status === 'neutral' && '양호한 수익성'}
                {roeStatus.status === 'bad' && '개선 필요'}
                <TrendingUpIcon className="size-4" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                자기자본이익률
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>영업이익률</CardDescription>
              <CardTitle className="text-3xl font-bold tabular-nums">
                {formatValue(data.financials.opm, 'percent')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-sm font-medium">
                {opmStatus.status === 'good' && '높은 마진 유지'}
                {opmStatus.status === 'neutral' && '안정적 마진'}
                {opmStatus.status === 'bad' && '마진 개선 필요'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                매출 대비 영업이익
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 안정성 */}
      <div className="mb-8">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">안정성</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>부채비율</CardDescription>
              <CardTitle className="text-3xl font-bold tabular-nums">
                {formatValue(data.financials.debt_to_equity, 'percent')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-sm font-medium flex items-center gap-1">
                {debtStatus.status === 'good' && '안정적 부채 수준'}
                {debtStatus.status === 'neutral' && '적정 부채 수준'}
                {debtStatus.status === 'bad' && '부채 비중 높음'}
                <ShieldAlert className="size-4" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                부채 대비 자본 비율
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>유동비율</CardDescription>
              <CardTitle className="text-3xl font-bold tabular-nums">
                {formatValue(data.financials.current_ratio, 'percent')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-sm font-medium">
                단기 지급능력 지표
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                유동자산/유동부채
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>당좌비율</CardDescription>
              <CardTitle className="text-3xl font-bold tabular-nums">
                {formatValue(data.financials.quick_ratio, 'percent')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-sm font-medium">
                즉시 지급능력 지표
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                당좌자산/유동부채
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 배당 */}
      <div className="mb-8">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">배당</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="relative pb-2">
              <CardDescription>배당수익률</CardDescription>
              <CardTitle className="text-3xl font-bold tabular-nums">
                {formatValue(data.financials.dividend_yield, 'percent')}
              </CardTitle>
              <div className="absolute right-6 top-6">
                <Badge variant={getStatusBadgeVariant(dividendStatus.status)} className="gap-1">
                  <Coins className="size-3" />
                  {getStatusText(dividendStatus.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-1 text-sm font-medium">
                <span>{getStatusText(dividendStatus.status)} 배당</span>
                <Coins className="size-4" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                주가 대비 배당금
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="relative pb-2">
              <CardDescription>배당성향</CardDescription>
              <CardTitle className="text-3xl font-bold tabular-nums">
                {formatValue(data.financials.payout_ratio, 'percent')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-1 text-sm font-medium">
                <span>배당 지속성</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                이익 중 배당 비율
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 성장성 */}
      <div className="mb-8">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">성장성</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="relative pb-2">
              <CardDescription>매출 성장률</CardDescription>
              <CardTitle className="text-3xl font-bold tabular-nums">
                {formatValue(data.financials.revenue_growth, 'percent')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-1 text-sm font-medium">
                <span>매출 성장 추세</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                전년 대비 매출 증가율
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="relative pb-2">
              <CardDescription>이익 성장률</CardDescription>
              <CardTitle className="text-3xl font-bold tabular-nums">
                {formatValue(data.financials.earnings_growth, 'percent')}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-center gap-1 text-sm font-medium">
                <span>이익 성장 추세</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                전년 대비 이익 증가율
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
