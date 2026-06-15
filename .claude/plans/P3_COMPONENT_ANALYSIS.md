# P3 — Frontend 거대 컴포넌트 구조 분석

> 작성일: 2026-02-23
> 상태: 분석 완료, 실행 대기

---

## 1. 전체 현황 (9개 대상)

| # | 컴포넌트 | 실제 경로 | 줄수 | useState | useEffect | useCallback | 인라인 서브컴포넌트 | API 호출 | 추출 가능량 | 추출 후 예상 |
|---|---------|----------|-----:|:--------:|:---------:|:-----------:|:------------------:|:--------:|:-----------:|:-----------:|
| 1 | **StealthHomePage** | `components/stealth/StealthHomePage.tsx` | 869 | 17 | 3 | 3 | 8개 | 4 | ~170줄 | ~700줄 |
| 2 | **MarketCycleSection** | `components/economic/MarketCycleSection.tsx` | 666 | 8 | 1 | 0 | 0 | 2 | ~270줄 | ~250줄 |
| 3 | **StockChart** | `components/StockChart.tsx` | 652 | 4 | 0 | 0 | 4 (Tooltip) | 0 | ~260줄 | ~384줄 |
| 4 | **SettingsPage** | `components/settings/SettingsPage.tsx` | 610 | 18 | 1 | 0 | 0 | 6 | ~550줄 | ~60줄 |
| 5 | **EconomicIndicators** | `components/EconomicIndicators.tsx` | 606 | 13 | 2 | 1 | 0 | 1 | ~200줄 | ~410줄 |
| 6 | **StealthPortfolioPage** | `components/stealth/StealthPortfolioPage.tsx` | 590 | 12 | 2 | 0 | 4개 | 3 | ~140줄 | ~450줄 |
| 7 | **SectorDetail** | `components/economic/SectorDetail.tsx` | 530 | 4 | 1 | 0 | 2개 | 1 | ~80줄 | ~450줄 |
| 8 | **AIAnalysisTab** | `components/AIAnalysisTab.tsx` | 478 | 6 | 0 | 0 | 1개 | 2 | ~85줄 | ~393줄 |
| 9 | **SectorHeatmap** | `components/economic/SectorHeatmap.tsx` | 465 | 7 | 1 | 1 | 2개 | 1 | ~105줄 | ~360줄 |
| | **합계** | | **5,466** | **89** | **11** | **5** | **21** | **20** | **~1,860줄** | **~3,457줄** |

---

## 2. 컴포넌트별 구조 분석

### ① StealthHomePage (869줄 → ~700줄)

**코드 구성:**
| 구간 | 줄 범위 | 줄수 | 비율 |
|------|---------|------|------|
| Imports & Types | 1-47 | 47 | 5.2% |
| Helper Functions | 50-101 | 52 | 5.8% |
| StealthCountryTab 컴포넌트 | 104-139 | 36 | 4.0% |
| Main 컴포넌트 (StealthHomePage) | 141-400 | 260 | 28.8% |
| → State 선언 | 142-165 | 24 | 2.7% |
| → useCallback fetch 3개 | 168-237 | 70 | 7.8% |
| → useEffect 3개 | 240-257 | 18 | 2.0% |
| → 계산 로직 + 핸들러 | 259-275 | 17 | 1.9% |
| → JSX (헤더 & 탭) | 277-400 | 124 | 13.8% |
| MemoTabContent | 404-556 | 153 | 16.9% |
| StatusTabContent | 560-665 | 106 | 11.7% |
| JournalTabContent | 669-823 | 155 | 17.2% |
| 공유 서브컴포넌트 4개 | 828-869 | 42 | 4.7% |

**추출 전략:**
- `useStealthHome()` 훅 — state 17개 + fetch 3개 + effect 3개 + 계산 로직 → **~170줄 추출**
- 이미 8개 인라인 서브컴포넌트로 UI 분리됨 → 훅 추출만으로 충분
- 서브컴포넌트를 별도 파일로 옮기는 것은 선택적

---

### ② MarketCycleSection (666줄 → ~250줄) ⭐ 최고 ROI

**코드 구성:**
| 구간 | 줄 범위 | 줄수 |
|------|---------|------|
| Imports | 1-23 | 23 |
| Type 정의 | 25-43 | 19 |
| Constants (US_SEASONS, KR_SEASONS) | 49-151 | 102 |
| useState 8개 | 158-177 | 20 |
| useEffect fetch | 180-204 | 25 |
| handleRetry (**useEffect와 중복**) | 209-229 | 21 |
| handleRequestAI | 232-263 | 32 |
| Loading/Error 분기 | 266-312 | 47 |
| 시즌 버튼 (인라인 map) | 350-388 | 39 |
| 상태 요약 | 392-515 | 124 |
| 상세 패널 (확장) | 518-661 | 144 |
| → AI 섹션 (Admin 전용) | 572-659 | 88 |

**추출 전략:**
- `useMarketCycle()` 훅 — state + fetch + retry 중복 제거 → **~100줄**
- `SeasonCard` 컴포넌트 — 시즌 버튼 루프 → **~35줄**
- `AIAnalysisSection` 컴포넌트 — Admin AI 기능 격리 → **~88줄**
- `SeasonDetailPanel` 컴포넌트 — 확장 상세 뷰 → **~49줄**
- **핵심**: handleRetry가 useEffect 내 fetch를 그대로 복제 (20줄 중복)

---

### ③ StockChart (652줄 → ~384줄)

**코드 구성:**
| 구간 | 줄 범위 | 줄수 |
|------|---------|------|
| 유틸 함수 (isKoreanStock, formatPrice, formatChartData) | 29-58 | 30 |
| State 4개 (visibleLines1~4) | 62-92 | 31 |
| 레전드 핸들러 4개 (반복 패턴) | 95-127 | 33 |
| useMemo (데이터 가공) | 140 | 1 |
| 커스텀 Tooltip 4개 | 143-240 | 98 |
| JSX 요약 카드 | 244-278 | 35 |
| 차트 그리드 (2×2, 4개 차트) | 280-648 | 369 |

**추출 전략:**
- `chartConfig.ts` — 색상 상수, 축 설정, 그래디언트 → **~85줄**
- `useChartData()` 훅 — formatChartData + 유틸 함수 → **~65줄**
- `ChartTooltips.tsx` — 4개 커스텀 Tooltip 분리 → **~98줄**
- 레전드 핸들러 4개 → 1개 통합 (60줄 → 25줄)

---

### ④ SettingsPage (610줄 → ~60줄) ⭐ 극적 감소

**코드 구성:**
| 구간 | 줄 범위 | 줄수 |
|------|---------|------|
| Gemini API state 8개 | 23-31 | 9 |
| KIS API state 10개 | 33-43 | 11 |
| fetchKeyStatus / fetchKisCredentialsStatus | 48-79 | 32 |
| useEffect (초기화) | 84-87 | 4 |
| handleSaveKey / handleDeleteKey | 92-167 | 76 |
| handleSaveKisCredentials / handleDeleteKisCredentials | 172-259 | 88 |
| JSX: Gemini Card | 266-416 | 151 |
| JSX: KIS Card | 418-605 | 188 |

**추출 전략:**
- `GeminiKeyCard` 컴포넌트 — state 8개 + 핸들러 3개 + JSX → **~150줄**
- `KISKeyCard` 컴포넌트 — state 10개 + 핸들러 3개 + JSX → **~190줄**
- 또는 `<CredentialCard />` 공통 컴포넌트로 두 섹션 통합 (패턴 거의 동일)
- 메인은 레이아웃만 ~60줄

---

### ⑤ EconomicIndicators (606줄 → ~60줄, 2단계)

**코드 구성:**
| 구간 | 줄 범위 | 줄수 |
|------|---------|------|
| State 13개 | 28-41 | 14 |
| fetchData useCallback | 43-72 | 30 |
| useEffect 2개 (탭/뷰 변경) | 75-104 | 30 |
| SubTabHeader 컴포넌트 | 123-176 | 54 |
| 탭 분기 (Sectors/Review) | 179-222 | 44 |
| Chart 뷰 분기 | 280-309 | 30 |
| Simple 뷰: US 데이터 | 374-490 | 117 |
| Simple 뷰: KR 데이터 | 493-602 | 110 |

**추출 전략:**
- 1단계: `useEconomicData()` 훅 → 606줄 → 410줄
- 2단계: `IndicatorsTab` / `SectorsTab` / `ReviewTab` 분리 → 메인은 탭 라우터 ~60줄
- **주의**: L301에 `as any` 타입 캐스팅 존재 → KR 데이터 타입 정의 보강 필요

---

### ⑥ StealthPortfolioPage (590줄 → ~450줄)

**코드 구성:**
- 메인 컴포넌트: L15-320 (usePortfolio 훅 사용, state 3개, JSX)
- `StealthAnalysisSection` 인라인 컴포넌트: L323-490 (state 6개, 핸들러 2개)
- `StealthAnalysisHistory` 인라인 컴포넌트: L493-590 (state 4개, useEffect 1개)

**추출 전략:**
- `StealthAnalysisSection` → 별도 파일 이동 (168줄, 이미 인라인 컴포넌트)
- `StealthAnalysisHistory` → 별도 파일 이동 (98줄, 이미 인라인 컴포넌트)
- `useAnalysisSummary()` 훅 — AIAnalysisTab과 공유 가능 (요약 생성/저장 중복)

---

### ⑦ SectorDetail (530줄 → ~450줄)

**코드 구성:**
- 유틸 함수 + 색상 매핑: 모듈 레벨
- `CustomTooltip` 인라인 컴포넌트: L141-184
- `CustomTreemapContent` 인라인 컴포넌트: L187-288
- State 4개 + useEffect fetch: L291-324
- treemapData 변환: L336-345
- JSX: L347+

**추출 전략:**
- `useSectorHoldings()` 훅 → **~35줄**
- `CustomTreemapContent` → **SectorHeatmap과 공유 모듈로 통합** (핵심 가치)

---

### ⑧ AIAnalysisTab (478줄 → ~393줄)

**코드 구성:**
- `StrategyBadge` 인라인 컴포넌트: L41-66
- State 6개 (useEffect 없음, 버튼 트리거 방식): L78-87
- handleGenerateSummary / handleSaveAnalysis: L90-126
- 4개 조건부 return 분기: L138-477

**추출 전략:**
- `useAnalysisSummary()` 훅 — StealthPortfolioPage와 공유 → **~50줄**
- `StrategyBadge` → 별도 파일 (26줄)
- 헤더 패턴 4회 반복 → `AIAnalysisHeader` 컴포넌트화

---

### ⑨ SectorHeatmap (465줄 → ~360줄)

**코드 구성:**
- `CustomTooltip` 인라인: L74-100
- `CustomTreemapContent` 인라인: L103-217
- State 7개 + useCallback + useEffect: L224-257
- 변환 로직 (getChange, treemapData): L260-284
- JSX: L305+

**추출 전략:**
- `useSectorData()` 훅 — fetch + useCallback + useEffect → **~35줄**
- `CustomTreemapContent` → SectorDetail과 공유 `SectorTreemap.tsx`

---

## 3. 크로스 컴포넌트 중복 패턴

| 중복 패턴 | 관련 컴포넌트 | 중복 규모 | 통합 전략 |
|----------|-------------|----------|----------|
| Treemap 렌더링 (CustomTooltip + CustomTreemapContent) | SectorDetail + SectorHeatmap | ~250줄 | 공유 `SectorTreemap.tsx` |
| AI 분석 요약 생성/저장 (summary state + generate/save) | StealthPortfolioPage + AIAnalysisTab | ~80줄 | 공유 `useAnalysisSummary()` |
| API 크레덴셜 폼 (input + toggle + save/delete) | SettingsPage 내 Gemini/KIS | ~150줄 | `<CredentialCard />` 공통화 |
| handleRetry vs useEffect fetch 중복 | MarketCycleSection | ~20줄 | 훅 추출 시 자연 해소 |

---

## 4. 권장 실행 순서 (ROI 기준)

| 순서 | 대상 | 작업 | 감소율 | 이유 |
|:----:|------|------|:------:|------|
| 1 | MarketCycleSection | useMarketCycle + SeasonCard + AIAnalysisSection | **62%** | 최고 ROI, 중복 제거 포함 |
| 2 | SettingsPage | GeminiKeyCard + KISKeyCard 분리 | **90%** | 극적 감소, 독립 섹션 |
| 3 | SectorDetail + SectorHeatmap | 공유 SectorTreemap.tsx 통합 | 합산 ~250줄 | 크로스 중복 해소 |
| 4 | StealthPortfolioPage + AIAnalysisTab | 공유 useAnalysisSummary() 훅 | 합산 ~80줄 | 크로스 중복 해소 |
| 5 | EconomicIndicators | useEconomicData + 탭 컴포넌트 분리 | **90%** | 2단계, 타입 이슈 동반 |
| 6 | StockChart | chartConfig.ts + ChartTooltips.tsx | **41%** | 재사용성 높음 |
| 7 | StealthHomePage | useStealthHome() 훅 | **20%** | 이미 서브컴포넌트 분리됨 |

---

## 5. 리스크

| 리스크 | 해당 컴포넌트 | 대응 |
|--------|-------------|------|
| 타입 캐스팅 `as any` | EconomicIndicators (L301) | KR 데이터 타입 정의 보강 |
| API 엔드포인트 하드코딩 | MarketCycleSection, StealthHomePage | 훅 추출 시 상수화 |
| 인라인 서브컴포넌트 → 별도 파일 | StealthHomePage (8개), StealthPortfolioPage (4개) | Props 인터페이스 정의 |
| 공유 Treemap 통합 | SectorDetail + SectorHeatmap | 미세한 렌더 차이 확인 |
