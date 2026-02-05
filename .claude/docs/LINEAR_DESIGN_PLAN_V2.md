# Linear 스타일 세련된 주식 대시보드 구현 계획 (V2)

> **⚠️ Tailwind CSS v4 사용**
> - 이 프로젝트는 **Tailwind CSS v4.x**를 사용합니다
> - `tailwind.config.js` 파일을 사용하지 않습니다
> - CSS에서 `@import "tailwindcss"`와 `@theme {}` directive로 색상 정의
> - PostCSS: `@tailwindcss/postcss` 플러그인 사용

## 📋 프로젝트 개요

**목표**: 기존 UI를 완전히 폐기하고 Linear app 스타일의 세련된 디자인으로 재구축

**핵심 원칙**:
- 기존 UI 코드는 절대 참조 금지 (API 호출 로직만 유지)
- 데이터는 현재 API response 그대로 활용
- shadcn/ui 컴포넌트 구조만 활용 (스타일은 완전히 새로 정의)
- **라이트 모드 우선** (다크 모드 토글 기능)
- **카테고리 기반 카드 레이아웃**으로 지표 시각화

---

## 🎨 디자인 시스템

### 색상 체계

| 요소 | 라이트 모드 | 다크 모드 | 용도 |
|------|-----------|----------|------|
| **Primary** | Indigo #6366F1 (239 84% 67%) | Indigo #818CF8 (239 84% 75%) | 포인트 색상, 버튼, 링크, 활성 상태 |
| **Background** | White #FFFFFF (0 0% 100%) | Dark #0A0A0A (0 0% 4%) | 메인 배경 |
| **Card** | White #FFFFFF (0 0% 100%) | Dark Gray #111111 (0 0% 7%) | 카드 배경 |
| **Muted** | Gray #F5F5F5 (0 0% 96%) | Dark Gray #1A1A1A (0 0% 10%) | 보조 배경 |
| **Border** | Gray #E5E5E5 (0 0% 90%) | Gray #2A2A2A (0 0% 16%) | 경계선 |
| **Foreground** | Black #0A0A0A (0 0% 4%) | White #FFFFFF (0 0% 100%) | 메인 텍스트 |
| **Muted Foreground** | Gray #737373 (0 0% 45%) | Gray #A1A1AA (0 0% 65%) | 보조 텍스트 |
| **Success** | Green #22C55E (142 71% 45%) | Green #4ADE80 (142 71% 55%) | 긍정 지표 |
| **Warning** | Orange #F59E0B (38 92% 50%) | Orange #FBBF24 (38 92% 60%) | 주의 지표 |
| **Destructive** | Red #EF4444 (0 84% 60%) | Red #F87171 (0 84% 70%) | 부정 지표 |

### 타이포그래피

| 요소 | 크기 | 용도 |
|------|------|------|
| **Hero Number** | text-6xl (60px) | 현재가 |
| **Hero Title** | text-4xl (36px) | 티커 심볼 |
| **Section Title** | text-2xl (24px) | 섹션 제목 |
| **Card Value** | text-3xl (30px) | 카드 내 큰 숫자 |
| **Body** | text-base (16px) | 본문 |
| **Caption** | text-sm (14px) | 설명 텍스트 |
| **Micro** | text-xs (12px) | 레이블, 상태 |

### 레이아웃 원칙

| 요소 | 설계 원칙 |
|------|----------|
| **구조** | Sidebar + MainContent |
| **카드 시스템** | 그리드 기반 (2-3 컬럼) |
| **여백** | 일관된 spacing (p-4, p-6, gap-4) |
| **정보 밀도** | 카테고리별 탭으로 분리 |
| **아이콘** | 최소화 (8-10개: Menu, Plus, ChevronRight, TrendingUp/Down, Moon/Sun, 카테고리별 아이콘) |
| **애니메이션** | 부드럽게 (150-300ms, transform/opacity) |

---

## 📐 화면 구조

```
┌─────────────────────────────────────────────────────────────┐
│ [Header]                                    [Dark Mode Toggle]│
│─────────────────────────────────────────────────────────────│
│ [Sidebar]       │  [Main Content]                            │
│                 │                                             │
│ MY TICKERS      │  Hero: AAPL ・ Apple Inc.                   │
│ ──────────      │  $174.50 (text-6xl)                        │
│ [+] Add         │  +$12.50 (+7.2%)                           │
│                 │                                             │
│ ● AAPL +2.5%    │  ┌─────────────────────────────────────┐  │
│ ○ TSLA -1.2%    │  │ [가치평가][수익성][안정성]          │  │
│ ○ NVDA +5.0%    │  │ ────────                             │  │
│                 │  │ ┌────┐ ┌────┐ ┌────┐                │  │
│                 │  │ │PER │ │PBR │ │PEG │                │  │
│                 │  │ │30.5│ │2.8 │ │1.2 │                │  │
│                 │  │ │████│ │███ │ │███ │                │  │
│                 │  │ │높음│ │중립│ │양호│                │  │
│                 │  │ └────┘ └────┘ └────┘                │  │
│                 │  └─────────────────────────────────────┘  │
│                 │                                             │
│                 │  [Overview][AI][Tech][News]                │
│                 │  ━━━━━━━━━                                  │
│                 │  Tab Content (스크롤)                       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔌 API 스펙 (필수 확인)

> **⚠️ 중요**: 모든 컴포넌트 개발 시 반드시 실제 API response 구조를 확인하고 타입 정의를 따를 것

### API 엔드포인트

| 엔드포인트 | 메서드 | Query Params | Request Body | Response Type |
|----------|-------|-------------|--------------|--------------|
| `/api/stock/{ticker}` | GET | `include_technical=true`<br>`include_chart=true` | - | `ApiResponse<StockData>` |
| `/api/stock/{ticker}/news` | GET | - | - | `ApiResponse<NewsItem[]>` |
| `/api/stock/{ticker}/analysis` | POST | - | `StockData` | `ApiResponse<AIAnalysis>` |

### 주요 타입 정의 (frontend/src/types/stock.ts)

#### StockData (메인 응답)
```typescript
interface StockData {
  ticker: string
  timestamp: string
  market_cap: number | null
  price: StockPrice
  financials: StockFinancials
  company: StockCompany
  technical_indicators?: TechnicalIndicators | null
  chart_data?: ChartDataPoint[] | null
  news?: NewsItem[] | null
}
```

#### StockPrice (현재가 정보)
```typescript
interface StockPrice {
  current: number    // Hero Section에서 사용
  open: number
  high: number
  low: number
  volume: number
}
```

#### StockFinancials (재무 지표)
```typescript
interface StockFinancials {
  // 가치평가 지표
  trailing_pe: number | null     // PER (CategoryMetrics 가치평가 탭)
  forward_pe: number | null
  pbr: number | null             // PBR (CategoryMetrics 가치평가 탭)
  peg: number | null             // PEG (CategoryMetrics 가치평가 탭)

  // 수익성 지표
  roe: number | null             // ROE (CategoryMetrics 수익성 탭)
  opm: number | null             // 영업이익률 (CategoryMetrics 수익성 탭)
  revenue_growth: number | null
  earnings_growth: number | null

  // 안정성 지표
  debt_to_equity: number | null  // 부채비율 (CategoryMetrics 안정성 탭)
  current_ratio: number | null   // 유동비율 (CategoryMetrics 안정성 탭)
  quick_ratio: number | null     // 당좌비율 (CategoryMetrics 안정성 탭)

  // 배당 지표
  dividend_yield: number | null
  payout_ratio: number | null
}
```

#### StockCompany (회사 정보)
```typescript
interface StockCompany {
  name: string               // Hero Section 회사명
  sector: string | null      // Hero Section 섹터
  industry: string | null
  summary_original: string | null
  summary_translated: string | null  // Overview 탭에서 사용
}
```

#### TechnicalIndicators (기술적 지표)
```typescript
interface TechnicalIndicators {
  sma: SMAInfo | null        // 단순이동평균
  ema: EMAInfo | null        // 지수이동평균
  rsi: RSIInfo | null        // 상대강도지수
  macd: MACDInfo | null      // MACD
  bollinger_bands: BollingerBandsInfo | null  // 볼린저밴드
}

interface SMAInfo {
  sma20: number | null
  sma50: number | null
  sma200: number | null
}

interface EMAInfo {
  ema12: number | null
  ema26: number | null
}

interface RSIInfo {
  rsi14: number | null
}

interface MACDInfo {
  macd: number | null
  signal: number | null
  histogram: number | null
}

interface BollingerBandsInfo {
  upper: number | null
  middle: number | null
  lower: number | null
}
```

#### NewsItem (뉴스)
```typescript
interface NewsItem {
  title: string              // News 탭에서 사용
  link: string
  published_at: string | null
  source: string | null
}
```

#### AIAnalysis (AI 분석)
```typescript
interface AIAnalysis {
  report: string  // 마크다운 형식 (AI Analysis 탭에서 렌더링)
}
```

### 사용자 설정 타입 (frontend/src/types/user.ts)

#### UserTicker (사용자가 등록한 티커)
```typescript
interface UserTicker {
  symbol: string           // 티커 심볼
  purchasePrice: number | null  // 매입가 (수익률 계산용)
  purchaseDate?: string
  addedAt: string
}
```

#### ProfitInfo (수익 계산 결과)
```typescript
interface ProfitInfo {
  purchasePrice: number
  currentPrice: number
  profitAmount: number     // Hero Section에서 표시
  profitPercent: number    // Hero Section, Sidebar에서 표시
  isProfit: boolean
}
```

### 컴포넌트별 사용 데이터 매핑

| 컴포넌트 | 사용 데이터 | 타입 경로 |
|---------|-----------|----------|
| **HeroSection** | `ticker`, `company.name`, `company.sector`, `market_cap`, `price.current` | `StockData` |
| **HeroSection (수익률)** | `profitAmount`, `profitPercent` | `ProfitInfo` (계산됨) |
| **CategoryMetrics (가치평가)** | `financials.trailing_pe`, `financials.pbr`, `financials.peg` | `StockData.financials` |
| **CategoryMetrics (수익성)** | `financials.roe`, `financials.opm` | `StockData.financials` |
| **CategoryMetrics (안정성)** | `financials.debt_to_equity`, `financials.current_ratio`, `financials.quick_ratio` | `StockData.financials` |
| **Sidebar** | `userSettings.tickers`, `profitPercent` (계산됨) | `UserSettings` |
| **OverviewTab** | `company.summary_translated`, `financials` (전체) | `StockData` |
| **NewsTab** | `news[]` | `NewsItem[]` (별도 API) |
| **AIAnalysisTab** | `report` | `AIAnalysis` (별도 API) |
| **TechnicalTab** | `technical_indicators` | `StockData.technical_indicators` |

### API 호출 예시 (App.tsx 참조)

```typescript
// 1. 주식 데이터 조회 (기술적 지표 + 차트 데이터 포함)
const stockResponse = await api.get<ApiResponse<StockData>>(
  `/api/stock/${tickerSymbol}?include_technical=true&include_chart=true`
)

// 2. 뉴스 조회 (병렬)
const newsResponse = await api.get<ApiResponse<NewsItem[]>>(
  `/api/stock/${tickerSymbol}/news`
)

// 3. AI 분석 조회 (병렬, stockData를 body로 전송)
const analysisResponse = await api.post<ApiResponse<AIAnalysis>>(
  `/api/stock/${tickerSymbol}/analysis`,
  stockData  // StockData 전체를 body로 전송
)
```

### 중요 체크사항

1. **Null 처리**: 모든 재무 지표는 `number | null` 타입이므로 반드시 체크 필요
   ```typescript
   {metrics.per !== undefined && metrics.per !== null && (
     <MetricCard label="PER" value={metrics.per.toFixed(2)} ... />
   )}
   ```

2. **조건부 렌더링**: 데이터가 없을 수 있으므로 항상 조건부 렌더링
   ```typescript
   {stockData?.technical_indicators && (
     <TechnicalTab data={stockData.technical_indicators} />
   )}
   ```

3. **시장가 포맷팅**: 시가총액은 T(조), B(억) 단위로 포맷팅 필요
   ```typescript
   const formatMarketCap = (cap: number | null) => {
     if (!cap) return 'N/A'
     if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`
     if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`
     return `$${cap.toLocaleString()}`
   }
   ```

4. **수익률 계산**: `purchasePrice`가 있을 때만 계산
   ```typescript
   const calculateProfit = (currentPrice: number, purchasePrice: number | null): ProfitInfo | null => {
     if (!purchasePrice) return null
     const profitAmount = currentPrice - purchasePrice
     const profitPercent = (profitAmount / purchasePrice) * 100
     return {
       purchasePrice,
       currentPrice,
       profitAmount,
       profitPercent,
       isProfit: profitAmount >= 0
     }
   }
   ```

---

## 🛠️ 구현 계획

### Phase 1: 기본 구조 + 색상 시스템 (1-2일)

**목표**: Hero + 카테고리 탭 카드 + Sidebar + 다크 모드 토글 동작

| 순서 | 작업 | 파일 | 설명 |
|------|------|------|------|
| 1 | 색상/타이포 시스템 | `frontend/src/index.css` | 라이트/다크 모드, Indigo 포인트, 폰트 크기 정의 |
| 2 | 다크 모드 Provider | `frontend/src/components/ThemeProvider.tsx` (새로) | 테마 전환 로직 |
| 3 | 다크 모드 토글 | `frontend/src/components/ThemeToggle.tsx` (새로) | Sun/Moon 아이콘 토글 버튼 |
| 4 | 레이아웃 구조 | `frontend/src/components/AppLayout.tsx` (새로) | Header + Sidebar + MainContent |
| 5 | Hero Section | `frontend/src/components/HeroSection.tsx` (새로) | 현재가 (text-6xl), 수익률, 타이포그래피 중심 |
| 6 | 카테고리 탭 Metrics | `frontend/src/components/CategoryMetrics.tsx` (새로) | 탭 기반 지표 카드 그리드 |
| 7 | Metric Card | `frontend/src/components/MetricCard.tsx` (새로) | 개별 지표 카드 (아이콘 + 값 + 게이지) |
| 8 | Gauge Bar | `frontend/src/components/GaugeBar.tsx` (새로) | 프로그레스 바, 색상 코딩 |
| 9 | Sidebar | `frontend/src/components/Sidebar.tsx` (새로) | 티커 목록, 추가 버튼 |
| 10 | App.tsx 재구성 | `frontend/src/App.tsx` | 기존 UI 제거, 새 레이아웃 적용 (API 로직 유지) |

---

### 세부 작업

#### 1. index.css - 색상 시스템 (Tailwind v4 방식)

**⚠️ 중요**: Tailwind CSS v4 사용 - `tailwind.config.js` 파일 사용 안 함!

```css
@import "tailwindcss";

@theme {
  /* 라이트 모드 색상 (기본) */
  --color-background: #ffffff;
  --color-foreground: #0a0a0a;
  
  --color-card: #ffffff;
  --color-card-foreground: #0a0a0a;
  
  --color-popover: #ffffff;
  --color-popover-foreground: #0a0a0a;
  
  --color-primary: #6366f1;        /* Indigo-500 */
  --color-primary-foreground: #ffffff;
  
  --color-secondary: #f5f5f5;
  --color-secondary-foreground: #171717;
  
  --color-muted: #f5f5f5;
  --color-muted-foreground: #737373;
  
  --color-accent: #f5f5f5;
  --color-accent-foreground: #171717;
  
  --color-destructive: #ef4444;    /* Red-500 */
  --color-destructive-foreground: #fafafa;
  
  --color-success: #22c55e;        /* Green-500 */
  --color-success-foreground: #ffffff;
  
  --color-warning: #f59e0b;        /* Orange-500 */
  --color-warning-foreground: #ffffff;
  
  --color-border: #e5e5e5;
  --color-input: #e5e5e5;
  --color-ring: #6366f1;           /* Indigo */
  
  --radius: 0.5rem;
}

@media (prefers-color-scheme: dark) {
  @theme {
    /* 다크 모드 색상 */
    --color-background: #0a0a0a;
    --color-foreground: #fafafa;
    
    --color-card: #111111;
    --color-card-foreground: #fafafa;
    
    --color-popover: #0a0a0a;
    --color-popover-foreground: #fafafa;
    
    --color-primary: #818cf8;      /* Indigo-400 (밝게) */
    --color-primary-foreground: #171717;
    
    --color-secondary: #262626;
    --color-secondary-foreground: #fafafa;
    
    --color-muted: #1a1a1a;
    --color-muted-foreground: #a1a1aa;
    
    --color-accent: #262626;
    --color-accent-foreground: #fafafa;
    
    --color-destructive: #f87171;  /* Red-400 (밝게) */
    --color-destructive-foreground: #fafafa;
    
    --color-success: #4ade80;      /* Green-400 (밝게) */
    --color-success-foreground: #171717;
    
    --color-warning: #fbbf24;      /* Orange-400 (밝게) */
    --color-warning-foreground: #171717;
    
    --color-border: #2a2a2a;
    --color-input: #262626;
    --color-ring: #818cf8;
  }
}

* {
  border-color: theme(colors.border);
}

body {
  background-color: theme(colors.background);
  color: theme(colors.foreground);
  font-feature-settings: "rlig" 1, "calt" 1;
}

/* 애니메이션 */
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes gauge-fill {
  from {
    width: 0;
  }
  to {
    width: var(--gauge-width);
  }
}

.fade-in {
  animation: fade-in 300ms ease-out;
}

.gauge-fill {
  animation: gauge-fill 500ms ease-out forwards;
}
```

---

#### 2. ThemeProvider.tsx - 다크 모드 Context

```tsx
import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark' | 'system'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined)

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'stock-dashboard-theme',
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  )

  useEffect(() => {
    const root = window.document.documentElement
    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
```

---

#### 3. ThemeToggle.tsx - 다크 모드 토글 버튼

```tsx
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTheme } from '@/components/ThemeProvider'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="rounded-full"
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
```

---

#### 4. HeroSection.tsx - 현재가 Hero

```tsx
import { TrendingUp, TrendingDown } from 'lucide-react'

interface HeroSectionProps {
  ticker: string
  companyName: string
  sector: string
  marketCap: string
  currentPrice: number
  purchasePrice?: number
  profitAmount?: number
  profitPercent?: number
}

export function HeroSection({
  ticker,
  companyName,
  sector,
  marketCap,
  currentPrice,
  purchasePrice,
  profitAmount,
  profitPercent,
}: HeroSectionProps) {
  const isProfit = profitAmount && profitAmount > 0

  return (
    <section className="space-y-4 py-8 px-6 border-b border-border fade-in">
      {/* 티커 + 회사명 */}
      <div className="flex items-baseline gap-3">
        <h1 className="text-4xl font-bold text-primary">{ticker}</h1>
        <span className="text-2xl text-muted-foreground">{companyName}</span>
      </div>

      {/* 섹터 + 시가총액 */}
      <p className="text-sm text-muted-foreground">
        {sector} ・ {marketCap}
      </p>

      {/* 현재가 (크게) */}
      <div className="text-6xl font-bold tracking-tight text-foreground">
        ${currentPrice.toFixed(2)}
      </div>

      {/* 수익률 (조건부) */}
      {purchasePrice && profitAmount !== undefined && profitPercent !== undefined && (
        <div className={`flex items-center gap-2 text-3xl font-semibold ${isProfit ? 'text-success' : 'text-destructive'}`}>
          {isProfit ? (
            <TrendingUp className="h-8 w-8" />
          ) : (
            <TrendingDown className="h-8 w-8" />
          )}
          <span>
            {isProfit ? '+' : ''}${profitAmount.toFixed(2)} ({isProfit ? '+' : ''}{profitPercent.toFixed(2)}%)
          </span>
        </div>
      )}
    </section>
  )
}
```

---

#### 5. CategoryMetrics.tsx - 카테고리별 탭 + 카드 그리드

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MetricCard } from './MetricCard'
import { BarChart3, TrendingUp, Shield } from 'lucide-react'

interface CategoryMetricsProps {
  metrics: {
    // 가치평가
    per?: number
    pbr?: number
    peg?: number
    // 수익성
    roe?: number
    opm?: number
    netProfitMargin?: number
    // 안정성
    debtToEquity?: number
    currentRatio?: number
    quickRatio?: number
  }
}

export function CategoryMetrics({ metrics }: CategoryMetricsProps) {
  // 게이지 퍼센트 계산 함수 (예시)
  const calculateGauge = (value: number | undefined, type: 'per' | 'pbr' | 'roe' | 'debt') => {
    if (value === undefined) return 0

    switch (type) {
      case 'per':
        return Math.min((value / 50) * 100, 100)
      case 'pbr':
        return Math.min((value / 5) * 100, 100)
      case 'roe':
        return Math.min((value / 20) * 100, 100)
      case 'debt':
        return Math.min((value / 200) * 100, 100)
      default:
        return 50
    }
  }

  const getStatus = (value: number, type: 'per' | 'pbr' | 'roe' | 'debt') => {
    if (type === 'per') {
      if (value < 15) return { label: '저평가', color: 'success' as const }
      if (value < 25) return { label: '적정', color: 'neutral' as const }
      return { label: '고평가', color: 'warning' as const }
    }
    if (type === 'roe') {
      if (value > 15) return { label: '우수', color: 'success' as const }
      if (value > 10) return { label: '양호', color: 'neutral' as const }
      return { label: '부족', color: 'warning' as const }
    }
    return { label: '중립', color: 'neutral' as const }
  }

  return (
    <section className="py-6 px-6 border-b border-border">
      <Tabs defaultValue="valuation" className="w-full">
        <TabsList className="w-full justify-start border-b border-border bg-transparent rounded-none h-auto p-0 mb-6">
          <TabsTrigger
            value="valuation"
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            가치평가
          </TabsTrigger>
          <TabsTrigger
            value="profitability"
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            수익성
          </TabsTrigger>
          <TabsTrigger
            value="stability"
            className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3"
          >
            <Shield className="h-4 w-4 mr-2" />
            안정성
          </TabsTrigger>
        </TabsList>

        {/* 가치평가 */}
        <TabsContent value="valuation" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.per !== undefined && (
              <MetricCard
                label="PER"
                value={metrics.per.toFixed(2)}
                percentage={calculateGauge(metrics.per, 'per')}
                status={getStatus(metrics.per, 'per').label}
                color={getStatus(metrics.per, 'per').color}
              />
            )}
            {metrics.pbr !== undefined && (
              <MetricCard
                label="PBR"
                value={metrics.pbr.toFixed(2)}
                percentage={calculateGauge(metrics.pbr, 'pbr')}
                status="중립"
                color="neutral"
              />
            )}
            {metrics.peg !== undefined && (
              <MetricCard
                label="PEG Ratio"
                value={metrics.peg.toFixed(2)}
                percentage={50}
                status="양호"
                color="success"
              />
            )}
          </div>
        </TabsContent>

        {/* 수익성 */}
        <TabsContent value="profitability" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.roe !== undefined && (
              <MetricCard
                label="ROE"
                value={`${metrics.roe.toFixed(2)}%`}
                percentage={calculateGauge(metrics.roe, 'roe')}
                status={getStatus(metrics.roe, 'roe').label}
                color={getStatus(metrics.roe, 'roe').color}
              />
            )}
            {metrics.opm !== undefined && (
              <MetricCard
                label="영업이익률"
                value={`${metrics.opm.toFixed(2)}%`}
                percentage={70}
                status="우수"
                color="success"
              />
            )}
            {metrics.netProfitMargin !== undefined && (
              <MetricCard
                label="순이익률"
                value={`${metrics.netProfitMargin.toFixed(2)}%`}
                percentage={65}
                status="양호"
                color="success"
              />
            )}
          </div>
        </TabsContent>

        {/* 안정성 */}
        <TabsContent value="stability" className="mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.debtToEquity !== undefined && (
              <MetricCard
                label="부채비율"
                value={`${metrics.debtToEquity.toFixed(2)}%`}
                percentage={calculateGauge(metrics.debtToEquity, 'debt')}
                status="양호"
                color="success"
              />
            )}
            {metrics.currentRatio !== undefined && (
              <MetricCard
                label="유동비율"
                value={metrics.currentRatio.toFixed(2)}
                percentage={60}
                status="양호"
                color="success"
              />
            )}
            {metrics.quickRatio !== undefined && (
              <MetricCard
                label="당좌비율"
                value={metrics.quickRatio.toFixed(2)}
                percentage={55}
                status="중립"
                color="neutral"
              />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </section>
  )
}
```

---

#### 6. MetricCard.tsx - 개별 지표 카드

```tsx
import { Card } from '@/components/ui/card'
import { GaugeBar } from './GaugeBar'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface MetricCardProps {
  label: string
  value: string | number
  percentage: number
  status: string
  color: 'success' | 'warning' | 'destructive' | 'neutral'
  trend?: 'up' | 'down' | 'neutral'
}

export function MetricCard({
  label,
  value,
  percentage,
  status,
  color,
  trend = 'neutral',
}: MetricCardProps) {
  return (
    <Card className="p-5 border border-border bg-card hover:shadow-lg hover:border-primary/30 transition-all duration-200 group">
      {/* 헤더: 라벨 + 트렌드 아이콘 */}
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        {trend === 'up' && <TrendingUp className="h-4 w-4 text-success" />}
        {trend === 'down' && <TrendingDown className="h-4 w-4 text-destructive" />}
      </div>

      {/* 큰 숫자 */}
      <div className="text-3xl font-bold mb-4 text-foreground group-hover:text-primary transition-colors">
        {value}
      </div>

      {/* 게이지 바 */}
      <GaugeBar percentage={percentage} color={color} className="mb-3" />

      {/* 하단: 상태 + 퍼센티지 */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">{status}</span>
        <span className="text-xs font-medium text-primary">{percentage.toFixed(0)}%</span>
      </div>
    </Card>
  )
}
```

---

#### 7. GaugeBar.tsx - 프로그레스 바

```tsx
import { cn } from '@/lib/utils'

interface GaugeBarProps {
  percentage: number
  color: 'success' | 'warning' | 'destructive' | 'neutral'
  className?: string
}

const colorMap = {
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  neutral: 'bg-muted-foreground',
}

export function GaugeBar({ percentage, color, className }: GaugeBarProps) {
  return (
    <div className={cn("w-full h-2 bg-muted rounded-full overflow-hidden", className)}>
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500 gauge-fill",
          colorMap[color]
        )}
        style={{ '--gauge-width': `${percentage}%` } as React.CSSProperties}
      />
    </div>
  )
}
```

---

#### 8. Sidebar.tsx - 티커 목록

```tsx
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Ticker {
  symbol: string
  profitPercent: number
}

interface SidebarProps {
  tickers: Ticker[]
  selectedTicker: string
  onSelectTicker: (symbol: string) => void
  onAddTicker: () => void
}

export function Sidebar({
  tickers,
  selectedTicker,
  onSelectTicker,
  onAddTicker,
}: SidebarProps) {
  return (
    <aside className="w-60 bg-card border-r border-border hidden lg:block">
      {/* 헤더 */}
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          MY TICKERS
        </h2>
      </div>

      {/* 추가 버튼 */}
      <div className="p-3">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start border-dashed hover:bg-primary/10 hover:border-primary"
          onClick={onAddTicker}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Ticker
        </Button>
      </div>

      {/* 티커 리스트 */}
      <div className="overflow-y-auto">
        {tickers.map((ticker) => (
          <button
            key={ticker.symbol}
            onClick={() => onSelectTicker(ticker.symbol)}
            className={cn(
              "w-full px-4 py-3 text-left transition-all duration-200",
              ticker.symbol === selectedTicker
                ? "bg-primary/10 text-primary border-l-2 border-primary"
                : "text-foreground hover:bg-muted"
            )}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{ticker.symbol}</span>
              <span
                className={cn(
                  "text-sm font-semibold",
                  ticker.profitPercent > 0 ? "text-success" : "text-destructive"
                )}
              >
                {ticker.profitPercent > 0 ? '+' : ''}
                {ticker.profitPercent.toFixed(2)}%
              </span>
            </div>
          </button>
        ))}
      </div>
    </aside>
  )
}
```

---

#### 9. AppLayout.tsx - 전체 레이아웃

```tsx
import { ThemeToggle } from './ThemeToggle'

interface AppLayoutProps {
  sidebar: React.ReactNode
  children: React.ReactNode
}

export function AppLayout({ sidebar, children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-foreground">Stock Dashboard</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex">
        {sidebar}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
```

---

### Phase 2: 탭 시스템 (1-2일)

**목표**: 4개 탭 모두 동작, 데이터 올바르게 표시

| 순서 | 작업 | 파일 | 설명 |
|------|------|------|------|
| 11 | Overview 탭 | `frontend/src/components/tabs/OverviewTab.tsx` (새로) | 회사 정보 + 재무지표 테이블 |
| 12 | News 탭 | `frontend/src/components/tabs/NewsTab.tsx` (새로) | 뉴스 리스트 (카드 형식) |
| 13 | AI Analysis 탭 | `frontend/src/components/tabs/AIAnalysisTab.tsx` (새로) | 마크다운 렌더링 |
| 14 | Technical 탭 | `frontend/src/components/tabs/TechnicalTab.tsx` (새로) | 기술적 지표 리스트 |
| 15 | 탭 네비게이션 통합 | `frontend/src/components/MainTabs.tsx` (새로) | shadcn/ui Tabs 활용 |

**세부 작업**:

#### Overview 탭 - 회사 정보 + 재무지표

```tsx
<div className="space-y-8 py-6 px-6">
  {/* 회사 정보 카드 */}
  <Card className="p-6">
    <h3 className="text-lg font-semibold mb-4 text-foreground">Company Info</h3>
    <p className="text-base leading-relaxed text-muted-foreground">
      {company.summary_translated || company.summary_original}
    </p>
  </Card>

  {/* 재무지표 카드 */}
  <Card className="p-6">
    <h3 className="text-lg font-semibold mb-4 text-foreground">Financial Metrics</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {allMetrics.map((metric) => (
        <div key={metric.label} className="flex justify-between py-2 border-b border-border">
          <span className="text-sm text-muted-foreground">{metric.label}</span>
          <span className="text-sm font-semibold text-foreground">{metric.value}</span>
        </div>
      ))}
    </div>
  </Card>
</div>
```

#### News 탭 - 뉴스 카드 리스트

```tsx
<div className="py-6 px-6 space-y-4">
  {news.map((item) => (
    <Card
      key={item.id}
      className="p-4 hover:shadow-lg hover:border-primary/30 transition-all duration-200"
    >
      <a
        href={item.link}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <h4 className="text-base font-semibold mb-2 text-foreground hover:text-primary transition-colors">
          {item.title}
        </h4>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{item.source}</span>
          <span>・</span>
          <span>{formatDate(item.published_at)}</span>
        </div>
      </a>
    </Card>
  ))}
</div>
```

---

### Phase 3: 인터랙션 (1일)

**목표**: 애니메이션 부드럽게 동작, 로딩 상태 표시

| 순서 | 작업 | 파일 | 설명 |
|------|------|------|------|
| 16 | 사이드바 토글 (모바일) | `Sidebar.tsx` | 햄버거 메뉴, 슬라이드 애니메이션 |
| 17 | 페이지 전환 애니메이션 | 전체 | opacity + translateY |
| 18 | 로딩 상태 | 전체 | Skeleton (shadcn/ui) |
| 19 | Hover 효과 강화 | 전체 | 카드/버튼 hover 효과 |

---

## 📁 핵심 파일 목록

### 1. 색상/타이포 시스템
- **`frontend/src/index.css`**: 라이트/다크 모드, Indigo 포인트, 애니메이션

### 2. 테마 관리
- **`frontend/src/components/ThemeProvider.tsx`** (새로): 테마 Context
- **`frontend/src/components/ThemeToggle.tsx`** (새로): Sun/Moon 토글

### 3. 레이아웃
- **`frontend/src/App.tsx`**: 기존 UI 제거, AppLayout 적용
- **`frontend/src/components/AppLayout.tsx`** (새로): Header + Sidebar + MainContent

### 4. Hero Section
- **`frontend/src/components/HeroSection.tsx`** (새로): 현재가, 수익률

### 5. Metrics (카테고리 탭 + 카드)
- **`frontend/src/components/CategoryMetrics.tsx`** (새로): 탭 기반 카드 그리드
- **`frontend/src/components/MetricCard.tsx`** (새로): 개별 지표 카드
- **`frontend/src/components/GaugeBar.tsx`** (새로): 프로그레스 바

### 6. Sidebar
- **`frontend/src/components/Sidebar.tsx`** (새로): 티커 목록, 추가 버튼

### 7. Tabs
- **`frontend/src/components/MainTabs.tsx`** (새로): 메인 탭 네비게이션
- **`frontend/src/components/tabs/OverviewTab.tsx`** (새로): 회사 정보 + 재무지표
- **`frontend/src/components/tabs/AIAnalysisTab.tsx`** (새로): AI 분석
- **`frontend/src/components/tabs/TechnicalTab.tsx`** (새로): 기술적 지표
- **`frontend/src/components/tabs/NewsTab.tsx`** (새로): 뉴스 카드

### 8. 타입 (참조만)
- **`frontend/src/types/stock.ts`**: API 응답 타입 (수정 불필요)

---

## ✅ 검증 방법

### 1. Visual 검증

**라이트 모드**:
- [ ] 흰 배경 (#FFFFFF), 검은 텍스트 (#0A0A0A)
- [ ] Indigo 포인트 (#6366F1) 버튼, 링크, 활성 상태
- [ ] 카드 그림자와 경계선 명확
- [ ] 타이포그래피 계층 명확 (60px → 30px → 16px → 12px)

**다크 모드**:
- [ ] 검은 배경 (#0A0A0A), 흰 텍스트 (#FAFAFA)
- [ ] Indigo 밝은 버전 (#818CF8) 포인트
- [ ] 카드 배경 (#111111) 구분 명확
- [ ] 눈의 피로 최소화

**카드 레이아웃**:
- [ ] 그리드 레이아웃 (2-3 컬럼)
- [ ] 카드 hover 시 그림자 + 경계선 강조
- [ ] 게이지 바 애니메이션 (0 → N%)
- [ ] 탭 전환 부드러움

### 2. 기능 검증
- [ ] 다크 모드 토글 동작
- [ ] 티커 검색 → Hero Section 업데이트
- [ ] 카테고리 탭 전환 (가치평가, 수익성, 안정성)
- [ ] 각 지표 카드 정상 표시
- [ ] 메인 탭 전환 (Overview, AI, Technical, News)

### 3. 애니메이션 검증
- [ ] 페이지 전환 (fadeIn 300ms)
- [ ] 카드 hover 효과 (shadow + border)
- [ ] 게이지 바 애니메이션 (gaugeFill 500ms)
- [ ] 탭 전환 애니메이션

### 4. 반응형 검증
- [ ] 데스크탑 (> 1024px): Sidebar 고정, 3 컬럼 그리드
- [ ] 태블릿 (768px - 1024px): 2 컬럼 그리드
- [ ] 모바일 (< 768px): 1 컬럼 그리드, Sidebar 숨김

---

## 📊 작업 우선순위

| 우선순위 | 단계 | 예상 시간 | 중요도 |
|---------|------|----------|--------|
| 🔴 필수 | Phase 1 (기본 구조 + 색상) | 1-2일 | 매우 높음 |
| 🔴 필수 | Phase 2 (탭 시스템) | 1-2일 | 매우 높음 |
| 🟡 권장 | Phase 3 (인터랙션) | 1일 | 높음 |

**총 예상 시간**: 3-5일

---

## 🚨 주의사항

1. **기존 UI 참조 금지**: 오직 API 로직만 재사용
2. **색상 규칙**: Indigo는 포인트만, 대부분 회색조
3. **타이포그래피 계층 유지**: text-6xl → text-3xl → text-base → text-xs
4. **애니메이션 원칙**: GPU 가속 (transform, opacity), 150-300ms
5. **카드 hover 효과**: shadow-lg + border-primary/30
6. **다크 모드 색상**: 라이트보다 밝게 (접근성)

---

## 📦 의존성

| 라이브러리 | 용도 | 설치 명령 |
|----------|------|----------|
| **`tailwindcss@4.x`** | **CSS 프레임워크 (v4)** | **이미 설치됨** |
| **`@tailwindcss/postcss`** | **PostCSS 플러그인 (v4 전용)** | **이미 설치됨** |
| `react-markdown` | AI Analysis 마크다운 | `npm install react-markdown remark-gfm` |
| `lucide-react` | 아이콘 | 이미 설치됨 |
| `@radix-ui/react-tabs` | Tabs 컴포넌트 | `npx shadcn-ui@latest add tabs` |

**⚠️ Tailwind v4 주의사항**: 
- `tailwind.config.js` 파일을 사용하지 않습니다
- `index.css`에서 `@theme {}` directive로 색상을 정의합니다
- PostCSS 설정: `postcss.config.js`에 `@tailwindcss/postcss` 필수

---

## 🎯 성공 기준

### Phase 1 완료 기준
- ✅ 라이트/다크 모드 토글 동작
- ✅ Hero Section: 현재가 (text-6xl), 수익률 표시
- ✅ CategoryMetrics: 3개 탭 (가치평가, 수익성, 안정성) + 카드 그리드
- ✅ Sidebar: 티커 목록 클릭 → 티커 변경
- ✅ **세련된 카드 디자인** (hover 효과, 그림자, 경계선)

### Phase 2 완료 기준
- ✅ 4개 메인 탭 동작 (Overview, AI, Technical, News)
- ✅ 데이터 올바르게 표시
- ✅ 카드 기반 레이아웃

### Phase 3 완료 기준
- ✅ 애니메이션 부드럽게 동작
- ✅ 로딩 상태 Skeleton 표시

### 최종 완료 기준
- ✅ Visual: Linear 느낌 + 세련된 카드 디자인
- ✅ 기능: 모든 데이터 올바르게 표시
- ✅ 인터랙션: 애니메이션 부드럽고 자연스러움
- ✅ 다크 모드: 완벽하게 동작
- ✅ 반응형: 모바일/태블릿/데스크탑 모두 대응

---

**작성일**: 2026-02-04
**버전**: 2.0 (카테고리 탭 + 카드 레이아웃 + 다크 모드)
