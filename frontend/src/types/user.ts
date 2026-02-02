/**
 * 사용자 관련 타입 정의
 * localStorage에 저장될 사용자 설정 및 매물 정보
 */

/**
 * 사용자가 등록한 매물 정보
 */
export interface UserTicker {
  /** 매물 심볼 (예: AAPL, TSLA) */
  symbol: string;
  /** 매입가 (null이면 미입력) */
  purchasePrice: number | null;
  /** 매입 날짜 (선택 사항) */
  purchaseDate?: string;
  /** 매물이 등록된 시간 */
  addedAt: string;
}

/**
 * 각 섹션의 표시/숨김 상태
 */
export interface SectionVisibility {
  /** 회사 정보 섹션 */
  companyInfo: boolean;
  /** 재무 지표 섹션 */
  financialMetrics: boolean;
  /** AI 분석 섹션 */
  aiAnalysis: boolean;
  /** 기술적 지표 섹션 */
  technicalIndicators: boolean;
  /** 뉴스 섹션 */
  news: boolean;
  /** 차트 섹션 */
  charts: boolean;
}

/**
 * 사용자 설정 (localStorage 저장용)
 */
export interface UserSettings {
  /** 사용자가 등록한 매물 목록 */
  tickers: UserTicker[];
  /** 각 섹션의 표시/숨김 상태 */
  sectionVisibility: SectionVisibility;
  /** 현재 선택된 매물 (null이면 미선택) */
  selectedTicker: string | null;
}

/**
 * 수익 계산 결과
 */
export interface ProfitInfo {
  /** 매입가 */
  purchasePrice: number;
  /** 현재 시세 */
  currentPrice: number;
  /** 수익 금액 (현재 시세 - 매입가) */
  profitAmount: number;
  /** 수익 (%) */
  profitPercent: number;
  /** 수익 여부 (true: 수익, false: 손실) */
  isProfit: boolean;
}

/**
 * 기본 섹션 표시 설정
 */
export const DEFAULT_SECTION_VISIBILITY: SectionVisibility = {
  companyInfo: true,
  financialMetrics: true,
  aiAnalysis: true,
  technicalIndicators: true,
  news: true,
  charts: true,
};

/**
 * 기본 사용자 설정
 */
export const DEFAULT_USER_SETTINGS: UserSettings = {
  tickers: [],
  sectionVisibility: DEFAULT_SECTION_VISIBILITY,
  selectedTicker: null,
};
