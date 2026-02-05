/**
 * Step 5-6: CategoryMetrics (동적 데이터 구현)
 * 카테고리별 탭 + 지표 카드 그리드
 * 실제 StockFinancials 데이터 사용
 */

import { useState } from 'react';
import { MetricCard } from './MetricCard';
import type { StockFinancials } from '../types/stock';

interface MetricData {
  name: string;
  value: string | number;
  gaugePercent: number;
  description: string;
  category: string;
  tooltip: string;
}

type Category = '가치평가' | '수익성' | '안정성' | '성장성';
type ColorType = 'primary' | 'success' | 'warning';

interface CategoryMetricsProps {
  financials: StockFinancials;
}

const categories: Category[] = ['가치평가', '수익성', '안정성', '성장성'];

// 카테고리별 색상 타입
const categoryColors: Record<Category, ColorType> = {
  가치평가: 'primary',
  수익성: 'success',
  안정성: 'warning',
  성장성: 'primary',
};

// 지표 평가 함수
const evaluateMetric = (value: number | null, type: string): { percent: number; desc: string } => {
  if (value === null) return { percent: 0, desc: 'N/A' };

  switch (type) {
    case 'PER':
      if (value < 15) return { percent: 30, desc: '저평가' };
      if (value < 25) return { percent: 50, desc: '적정' };
      if (value < 35) return { percent: 70, desc: '다소 높음' };
      return { percent: 90, desc: '고평가' };

    case 'PBR':
      if (value < 1) return { percent: 30, desc: '저평가' };
      if (value < 3) return { percent: 50, desc: '적정' };
      if (value < 5) return { percent: 70, desc: '다소 높음' };
      return { percent: 90, desc: '고평가' };

    case 'PEG':
      if (value < 1) return { percent: 40, desc: '저평가' };
      if (value < 2) return { percent: 60, desc: '적정' };
      return { percent: 80, desc: '고평가' };

    case 'ROE':
      if (value < 5) return { percent: 30, desc: '부진' };
      if (value < 10) return { percent: 50, desc: '보통' };
      if (value < 15) return { percent: 70, desc: '양호' };
      return { percent: 90, desc: '우수' };

    case 'OPM':
      if (value < 5) return { percent: 30, desc: '부진' };
      if (value < 10) return { percent: 50, desc: '보통' };
      if (value < 20) return { percent: 70, desc: '양호' };
      return { percent: 90, desc: '우수' };

    case 'DEBT':
      if (value < 50) return { percent: 90, desc: '매우 안정' };
      if (value < 100) return { percent: 70, desc: '안정' };
      if (value < 200) return { percent: 50, desc: '주의' };
      return { percent: 30, desc: '위험' };

    case 'CURRENT_RATIO':
      if (value < 100) return { percent: 30, desc: '부족' };
      if (value < 150) return { percent: 50, desc: '보통' };
      if (value < 200) return { percent: 70, desc: '양호' };
      return { percent: 90, desc: '우수' };

    case 'GROWTH':
      if (value < 0) return { percent: 20, desc: '마이너스' };
      if (value < 5) return { percent: 40, desc: '저성장' };
      if (value < 10) return { percent: 60, desc: '보통' };
      if (value < 20) return { percent: 80, desc: '높음' };
      return { percent: 95, desc: '매우 높음' };

    default:
      return { percent: 50, desc: '-' };
  }
};

// 실제 데이터를 MetricData로 변환
const convertToMetrics = (financials: StockFinancials): MetricData[] => {
  const metrics: MetricData[] = [];

  // 가치평가
  const per = evaluateMetric(financials.trailing_pe, 'PER');
  metrics.push({
    name: 'PER',
    value: financials.trailing_pe?.toFixed(2) || 'N/A',
    gaugePercent: per.percent,
    description: per.desc,
    category: '가치평가',
    tooltip: '주가수익비율(Price Earning Ratio). 주가를 주당순이익(EPS)으로 나눈 값으로, 낮을수록 저평가된 것으로 판단합니다.',
  });

  const pbr = evaluateMetric(financials.pbr, 'PBR');
  metrics.push({
    name: 'PBR',
    value: financials.pbr?.toFixed(2) || 'N/A',
    gaugePercent: pbr.percent,
    description: pbr.desc,
    category: '가치평가',
    tooltip: '주가순자산비율(Price Book-value Ratio). 주가를 주당순자산(BPS)으로 나눈 값으로, 1 이하면 저평가된 것으로 판단합니다.',
  });

  const peg = evaluateMetric(financials.peg, 'PEG');
  metrics.push({
    name: 'PEG',
    value: financials.peg?.toFixed(2) || 'N/A',
    gaugePercent: peg.percent,
    description: peg.desc,
    category: '가치평가',
    tooltip: 'PER을 EPS 성장률로 나눈 값. 성장성을 고려한 밸류에이션 지표로, 1 이하면 저평가된 것으로 판단합니다.',
  });

  const forwardPe = evaluateMetric(financials.forward_pe, 'PER');
  metrics.push({
    name: 'Forward PER',
    value: financials.forward_pe?.toFixed(2) || 'N/A',
    gaugePercent: forwardPe.percent,
    description: forwardPe.desc,
    category: '가치평가',
    tooltip: '예상 실적 기반 PER. 향후 1년간 예상되는 주당순이익을 기준으로 계산한 PER입니다.',
  });

  // 수익성
  const roe = evaluateMetric(financials.roe ? financials.roe * 100 : null, 'ROE');
  metrics.push({
    name: 'ROE',
    value: financials.roe ? `${(financials.roe * 100).toFixed(1)}%` : 'N/A',
    gaugePercent: roe.percent,
    description: roe.desc,
    category: '수익성',
    tooltip: '자기자본이익률(Return On Equity). 순이익을 자기자본으로 나눈 값으로, 기업이 자본을 얼마나 효율적으로 활용하는지 나타냅니다. 높을수록 좋습니다.',
  });

  const opm = evaluateMetric(financials.opm ? financials.opm * 100 : null, 'OPM');
  metrics.push({
    name: '영업이익률',
    value: financials.opm ? `${(financials.opm * 100).toFixed(1)}%` : 'N/A',
    gaugePercent: opm.percent,
    description: opm.desc,
    category: '수익성',
    tooltip: '영업이익을 매출액으로 나눈 비율. 본업에서 얼마나 효율적으로 이익을 창출하는지 나타냅니다. 높을수록 좋습니다.',
  });

  metrics.push({
    name: '배당수익률',
    value: financials.dividend_yield ? `${(financials.dividend_yield * 100).toFixed(2)}%` : 'N/A',
    gaugePercent: financials.dividend_yield ? Math.min((financials.dividend_yield * 100) * 20, 100) : 0,
    description: financials.dividend_yield ? '배당' : 'N/A',
    category: '수익성',
    tooltip: '주당배당금을 주가로 나눈 비율. 배당 투자자에게 중요한 지표로, 높을수록 배당 수익이 높습니다.',
  });

  metrics.push({
    name: '배당성향',
    value: financials.payout_ratio ? `${(financials.payout_ratio * 100).toFixed(1)}%` : 'N/A',
    gaugePercent: financials.payout_ratio ? Math.min((financials.payout_ratio * 100), 100) : 0,
    description: financials.payout_ratio ? '-' : 'N/A',
    category: '수익성',
    tooltip: '배당금을 순이익으로 나눈 비율. 기업이 이익 중 얼마를 배당으로 지급하는지 나타냅니다. 너무 높으면 재투자 여력이 부족할 수 있습니다.',
  });

  // 안정성
  const debt = evaluateMetric(financials.debt_to_equity, 'DEBT');
  metrics.push({
    name: '부채비율',
    value: financials.debt_to_equity ? `${financials.debt_to_equity.toFixed(1)}%` : 'N/A',
    gaugePercent: debt.percent,
    description: debt.desc,
    category: '안정성',
    tooltip: '부채를 자기자본으로 나눈 비율. 기업의 재무 안정성을 나타내며, 낮을수록 안정적입니다. 100% 이하가 일반적으로 안전합니다.',
  });

  const currentRatio = evaluateMetric(financials.current_ratio, 'CURRENT_RATIO');
  metrics.push({
    name: '유동비율',
    value: financials.current_ratio ? `${financials.current_ratio.toFixed(1)}%` : 'N/A',
    gaugePercent: currentRatio.percent,
    description: currentRatio.desc,
    category: '안정성',
    tooltip: '유동자산을 유동부채로 나눈 비율. 단기 지급능력을 나타냅니다. 100% 이상이면 단기 채무를 상환할 능력이 있다고 판단합니다.',
  });

  const quickRatio = evaluateMetric(financials.quick_ratio, 'CURRENT_RATIO');
  metrics.push({
    name: '당좌비율',
    value: financials.quick_ratio ? `${financials.quick_ratio.toFixed(1)}%` : 'N/A',
    gaugePercent: quickRatio.percent,
    description: quickRatio.desc,
    category: '안정성',
    tooltip: '(유동자산 - 재고자산)을 유동부채로 나눈 비율. 재고를 제외한 즉시 현금화 가능한 자산으로 단기 채무를 갚을 수 있는지 나타냅니다.',
  });

  // 성장성
  const revenueGrowth = evaluateMetric(financials.revenue_growth ? financials.revenue_growth * 100 : null, 'GROWTH');
  metrics.push({
    name: '매출성장률',
    value: financials.revenue_growth ? `${(financials.revenue_growth * 100).toFixed(1)}%` : 'N/A',
    gaugePercent: revenueGrowth.percent,
    description: revenueGrowth.desc,
    category: '성장성',
    tooltip: '전년 대비 매출액 증가율. 기업의 외형 성장을 나타내는 지표로, 높을수록 빠르게 성장하고 있음을 의미합니다.',
  });

  const earningsGrowth = evaluateMetric(financials.earnings_growth ? financials.earnings_growth * 100 : null, 'GROWTH');
  metrics.push({
    name: 'EPS성장률',
    value: financials.earnings_growth ? `${(financials.earnings_growth * 100).toFixed(1)}%` : 'N/A',
    gaugePercent: earningsGrowth.percent,
    description: earningsGrowth.desc,
    category: '성장성',
    tooltip: '전년 대비 주당순이익(EPS) 증가율. 수익성 개선 정도를 나타내며, 높을수록 주주 가치가 빠르게 증가하고 있음을 의미합니다.',
  });

  return metrics;
};

export function CategoryMetrics({ financials }: CategoryMetricsProps) {
  const [selectedCategory, setSelectedCategory] = useState<Category>('가치평가');

  // 실제 데이터를 지표로 변환
  const allMetrics = convertToMetrics(financials);

  const filteredMetrics = allMetrics.filter(
    (metric) => metric.category === selectedCategory
  );

  return (
    <div className="p-6 space-y-3">
      {/* 탭 버튼 */}
      <div className="flex gap-2 border-b border-border pb-1.5">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-all ${
              selectedCategory === category
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* 지표 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {filteredMetrics.map((metric) => (
          <MetricCard
            key={metric.name}
            name={metric.name}
            value={metric.value}
            gaugePercent={metric.gaugePercent}
            description={metric.description}
            category={selectedCategory}
            colorType={categoryColors[selectedCategory]}
            tooltip={metric.tooltip}
          />
        ))}
      </div>
    </div>
  );
}
