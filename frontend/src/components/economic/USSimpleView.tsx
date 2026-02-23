/**
 * 미국 경제 지표 Simple 뷰 (금리·변동성, 거시경제, 원자재)
 */

import { TrendingUp, BarChart3, DollarSign } from 'lucide-react';
import { IndicatorCard } from '@/components/IndicatorCard';
import type { EconomicData } from '@/types/economic';

interface USSimpleViewProps {
  data: EconomicData;
}

export function USSimpleView({ data }: USSimpleViewProps) {
  return (
    <>
      {/* 금리 & 변동성 */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium text-foreground">🇺🇸 금리 & 변동성</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <IndicatorCard
            indicator={data.rates.treasury_10y || null}
            showChart={false}
            formatType="percent"
            icon="🏛️"
          />
          <IndicatorCard
            indicator={data.rates.treasury_3m || null}
            showChart={false}
            formatType="percent"
            icon="🏛️"
          />
          <IndicatorCard
            indicator={data.rates.vix || null}
            showChart={false}
            formatType="number"
            icon="📈"
          />
        </div>
      </section>

      {/* 거시경제 */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium text-foreground">🇺🇸 거시경제</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <IndicatorCard
            indicator={data.macro.philly_fed || null}
            showChart={false}
            formatType="number"
            icon="🏭"
          />
          <IndicatorCard
            indicator={data.macro.cfnai || null}
            showChart={false}
            formatType="number"
            icon="📋"
          />
          <IndicatorCard
            indicator={data.macro.umcsent || null}
            showChart={false}
            formatType="number"
            icon="👛"
          />
          <IndicatorCard
            indicator={data.macro.cpi || null}
            showChart={false}
            formatType="number"
            icon="📊"
          />
          <IndicatorCard
            indicator={data.macro.m2 || null}
            showChart={false}
            formatType="trillion"
            icon="💵"
          />
        </div>
        {!data.macro.cpi && !data.macro.m2 && (
          <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
            <p>
              💡 CPI와 M2 데이터를 보려면 FRED API 키가 필요합니다.
              <a
                href="https://fred.stlouisfed.org/docs/api/api_key.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline ml-1"
              >
                API 키 발급 →
              </a>
            </p>
          </div>
        )}
      </section>

      {/* 원자재 */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium text-foreground">🇺🇸 원자재</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <IndicatorCard
            indicator={data.commodities.wti_oil || null}
            showChart={false}
            formatType="currency"
            icon="🛢️"
          />
          <IndicatorCard
            indicator={data.commodities.gold || null}
            showChart={false}
            formatType="currency"
            icon="💰"
          />
        </div>
      </section>

      {data.last_updated && (
        <div className="text-center text-xs text-muted-foreground">
          마지막 업데이트: {new Date(data.last_updated).toLocaleString('ko-KR')}
        </div>
      )}
    </>
  );
}
