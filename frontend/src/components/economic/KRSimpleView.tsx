/**
 * 한국 경제 지표 Simple 뷰 (금리, 신용 스프레드, 거시경제, 환율)
 */

import { TrendingUp, BarChart3, DollarSign } from 'lucide-react';
import { IndicatorCard } from '@/components/IndicatorCard';
import type { KoreaEconomicData } from '@/types/economic';

interface KRSimpleViewProps {
  data: KoreaEconomicData;
}

export function KRSimpleView({ data }: KRSimpleViewProps) {
  return (
    <>
      {/* 금리 */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium text-foreground">🇰🇷 금리</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <IndicatorCard
            indicator={data.rates.bond_10y || null}
            showChart={false}
            formatType="percent"
            icon="🏛️"
          />
          <IndicatorCard
            indicator={data.rates.base_rate || null}
            showChart={false}
            formatType="percent"
            icon="🏛️"
          />
        </div>
      </section>

      {/* 신용 스프레드 */}
      {data.rates.credit_spread && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-medium text-foreground">🇰🇷 신용 스프레드</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <IndicatorCard
              indicator={data.rates.credit_spread}
              showChart={false}
              formatType="percent"
              icon="📊"
            />
          </div>
        </section>
      )}

      {/* 거시경제 */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium text-foreground">🇰🇷 거시경제</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <IndicatorCard
            indicator={data.macro.leading_index || null}
            showChart={false}
            formatType="number"
            icon="🧭"
          />
          <IndicatorCard
            indicator={data.macro.ccsi || null}
            showChart={false}
            formatType="number"
            icon="😊"
          />
          <IndicatorCard
            indicator={data.macro.export || null}
            showChart={false}
            formatType="number"
            icon="🚢"
          />
        </div>
        {!data.macro.leading_index && !data.macro.ccsi && !data.macro.export && (
          <div className="mt-3 p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
            <p>
              💡 한국 거시경제 지표를 보려면 ECOS API 키가 필요합니다.
              <a
                href="https://ecos.bok.or.kr/api/"
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

      {/* 환율 */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium text-foreground">🇰🇷 환율</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <IndicatorCard
            indicator={data.fx.usd_krw || null}
            showChart={false}
            formatType="currency"
            icon="💱"
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
