/**
 * 시장 사이클 상수 및 타입 정의
 */

export type MarketSeason = 'spring' | 'summer' | 'autumn' | 'winter';

export interface SeasonInfo {
  key: MarketSeason;
  name: string;
  subName: string;
  emoji: string;
  description: string;
  characteristics: string[];
  color: string;
  bgColor: string;
  borderColor: string;
  sectors: string[];
}

// 미국 시장 사이클
export const US_SEASONS: SeasonInfo[] = [
  {
    key: 'spring',
    name: '봄',
    subName: '회복기',
    emoji: '🌸',
    description: '경기 바닥에서 회복 시작',
    characteristics: ['생산 회복 추세', '저물가', '금리 완화'],
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-50 dark:bg-pink-950/30',
    borderColor: 'border-pink-300 dark:border-pink-700',
    sectors: ['기술주', '소비재', '소형주'],
  },
  {
    key: 'summer',
    name: '여름',
    subName: '활황기',
    emoji: '☀️',
    description: '경기 확장, 기업 실적 호조',
    characteristics: ['생산 확장', '양호한 물가', '낮은 변동성'],
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-300 dark:border-amber-700',
    sectors: ['산업재', '금융', '에너지'],
  },
  {
    key: 'autumn',
    name: '가을',
    subName: '후퇴기',
    emoji: '🍂',
    description: '과열 후 둔화 시작',
    characteristics: ['생산 둔화 추세', '높은 물가', 'VIX 상승'],
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    borderColor: 'border-orange-300 dark:border-orange-700',
    sectors: ['유틸리티', '헬스케어', '필수소비재'],
  },
  {
    key: 'winter',
    name: '겨울',
    subName: '침체기',
    emoji: '❄️',
    description: '경기 수축, 방어적 투자',
    characteristics: ['생산 감소', '디플레 우려', '금리 인하 기대'],
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-300 dark:border-blue-700',
    sectors: ['채권', '현금', '방어주'],
  },
];

// 한국 시장 사이클
export const KR_SEASONS: SeasonInfo[] = [
  {
    key: 'spring',
    name: '봄',
    subName: '회복기',
    emoji: '🌸',
    description: '수출 회복, 경기 반등 시작',
    characteristics: ['수출 증가 전환', '물가 안정', '신용 스프레드 축소'],
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-50 dark:bg-pink-950/30',
    borderColor: 'border-pink-300 dark:border-pink-700',
    sectors: ['반도체', '2차전지', 'IT 서비스'],
  },
  {
    key: 'summer',
    name: '여름',
    subName: '활황기',
    emoji: '☀️',
    description: '수출 호조, 기업 실적 확장',
    characteristics: ['수출 확장', '양호한 물가', '낮은 리스크'],
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 dark:bg-amber-950/30',
    borderColor: 'border-amber-300 dark:border-amber-700',
    sectors: ['자동차', '조선', '철강', '화학'],
  },
  {
    key: 'autumn',
    name: '가을',
    subName: '후퇴기',
    emoji: '🍂',
    description: '수출 둔화, 불확실성 증가',
    characteristics: ['수출 둔화', '물가 상승', '스프레드 확대'],
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    borderColor: 'border-orange-300 dark:border-orange-700',
    sectors: ['유틸리티', '통신', '필수소비재'],
  },
  {
    key: 'winter',
    name: '겨울',
    subName: '침체기',
    emoji: '❄️',
    description: '수출 역성장, 방어적 투자',
    characteristics: ['수출 마이너스', '물가 급변동', '높은 신용 리스크'],
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-300 dark:border-blue-700',
    sectors: ['국채', '현금', '방어주', '헬스케어'],
  },
];
