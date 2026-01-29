# Shadcn UI 대시보드 구현 가이드

> 작성일: 2026-01-29
> 상태: 진행중 (Phase 1 완료)

## 📋 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [Phase 1: 기본 대시보드 구현 (완료)](#phase-1-기본-대시보드-구현-완료)
3. [Phase 2: 추가 기능 구현 (진행중)](#phase-2-추가-기능-구현-진행중)
4. [파일 구조](#파일-구조)
5. [사용 가이드](#사용-가이드)

---

## 프로젝트 개요

기존의 라이트 모드 주식 정보 조회 시스템을 **Shadcn UI 기반의 다크모드 전문 분석 대시보드**로 전환하는 프로젝트입니다.

### 주요 목표

- ✅ Shadcn UI 컴포넌트 시스템 도입
- ✅ 다크모드 우선 디자인
- ✅ 전문적이고 깔끔한 UI/UX
- ✅ 실제 API 데이터 연동
- ⏳ 뉴스 및 AI 분석 통합
- ⏳ 차트 시각화 개선

### 디자인 철학

> **"주식 분석 정보를 전달하되, 주식 정보를 조회하는 티를 내지 않도록 하는 방향"**

- 화려하지 않고, 정보 전달에 목적
- 정리가 잘 되어 있어야 함
- 몰래 봐도 괜찮은 디자인

---

## Phase 1: 기본 대시보드 구현 (완료)

### 1.1 Shadcn UI 설정

#### 설치된 패키지
```bash
npm install class-variance-authority clsx tailwind-merge tailwindcss-animate @radix-ui/react-slot @radix-ui/react-tabs
```

#### 생성된 설정 파일

**`components.json`**
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/index.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

**TypeScript Path Alias (`tsconfig.app.json`)**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Vite Path Resolver (`vite.config.ts`)**
```typescript
import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

**Tailwind CSS 다크모드 설정 (`tailwind.config.js`)**
```javascript
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        // ... (전체 색상 변수)
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
}
```

**CSS Variables (`src/index.css`)**
- 라이트모드 및 다크모드 색상 변수 정의
- HSL 기반 색상 시스템

### 1.2 생성된 Shadcn UI 컴포넌트

#### `src/components/ui/` 폴더

| 컴포넌트 | 파일명 | 용도 |
|---------|--------|------|
| Card | `card.tsx` | 정보 카드 컨테이너 |
| Badge | `badge.tsx` | 태그 및 라벨 |
| Input | `input.tsx` | 검색창 입력 필드 |
| Button | `button.tsx` | 버튼 (미사용, 향후 사용) |
| Tabs | `tabs.tsx` | 탭 네비게이션 (차트 시간 범위 선택) |

#### `src/lib/utils.ts`
```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```
- Tailwind CSS 클래스 병합 유틸리티

### 1.3 메인 대시보드 컴포넌트

#### `StockDashboard.tsx`

**Props 인터페이스**
```typescript
interface StockDashboardProps {
  data: StockData | null;
  onSearch: (ticker: string) => void;
  isLoading?: boolean;
}
```

**주요 섹션**

1. **Header**
   - 로고 및 브랜드명 (BarChart3 아이콘 + "StockAnalysis")
   - 네비게이션 링크 (Overview, Financials, News)
   - 검색바 (Search 아이콘 + Input 컴포넌트)
   - 프로필 아이콘

2. **Company Profile Card** (2-column)
   - 회사명 및 심볼
   - 섹터 정보
   - 회사 설명 (번역된 텍스트 우선)
   - 산업 태그 (Badge 컴포넌트)
   - RSI 기반 동적 태그 (Overbought/Oversold)

3. **Price Metrics Card** (1-column)
   - 현재 주가 (대형 폰트)
   - 가격 변동 (TrendingUp/Down 아이콘 + 색상)
   - 시가총액 (포맷팅)

4. **Financial Indicators Card** (3-column, 8개 지표)
   | 지표 | 아이콘 | 설명 |
   |-----|--------|------|
   | P/E Ratio | BarChart3 | 주가수익비율 |
   | P/B Ratio | BarChart3 | 주가순자산비율 |
   | ROE | TrendingUp | 자기자본이익률 |
   | Op. Margin | Activity | 영업이익률 |
   | Debt Ratio | PieChart | 부채비율 |
   | Current Ratio | BarChart3 | 유동비율 |
   | Quick Ratio | Activity | 당좌비율 |
   | Dividend Yield | DollarSign | 배당수익률 |

5. **Technical Indicators** (3-column, 통합 컴포넌트)
   - TechnicalChartCard 컴포넌트 사용

**빈 상태 처리**
```typescript
if (!data) {
  return (
    // 검색 안내 화면
    <Search 아이콘 + "Search for a stock" 메시지>
  )
}
```

**로딩 상태 처리**
```typescript
{isLoading && (
  <div className="flex items-center justify-center">
    <div className="animate-spin ..."></div>
    <p>Loading stock data...</p>
  </div>
)}
```

### 1.4 기술적 지표 컴포넌트

#### `TechnicalChartCard.tsx`

기존 `TechnicalChart.tsx`를 다크모드 Shadcn UI 스타일로 재구현한 컴포넌트입니다.

**4개의 Card 섹션**

1. **Moving Averages Card**
   - SMA 20, 50, 200
   - EMA 12, 26
   - 5-column 그리드

2. **RSI Card**
   - RSI 14-day 값
   - 색상 바 (Oversold: 녹색, Neutral: 파랑, Overbought: 빨강)
   - 신호등 레이블

3. **MACD Card**
   - MACD Line
   - Signal Line
   - Histogram (양수: 녹색, 음수: 빨강)

4. **Bollinger Bands Card**
   - Upper Band (빨강)
   - Middle Band (회색)
   - Lower Band (녹색)

**색상 로직**
```typescript
const getRSIColor = (rsi: number | null | undefined) => {
  if (rsi === null || rsi === undefined) return 'bg-muted';
  if (rsi < 30) return 'bg-green-500'; // 과매도
  if (rsi > 70) return 'bg-red-500'; // 과매수
  return 'bg-primary'; // 중립
};
```

### 1.5 App.tsx 간소화

기존 코드에서 대시보드와 무관한 로직을 제거하고 단순화했습니다.

**Before (118줄)**
```typescript
function App() {
  const [ticker, setTicker] = useState<string>('');
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [news, setNews] = useState<NewsItem[] | null>(null);
  const [analysisData, setAnalysisData] = useState<AIAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isNewsLoading, setIsNewsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // 복잡한 핸들러 함수들...
  // JSX with StockSearch, StockInfo, TechnicalChart, StockNews, StockAnalysis...
}
```

**After (30줄)**
```typescript
function App() {
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStockData = async (tickerSymbol: string) => {
    // API 호출만 담당
  };

  return (
    <StockDashboard 
      data={stockData} 
      onSearch={fetchStockData} 
      isLoading={isLoading} 
    />
  );
}
```

### 1.6 다크모드 강제 적용

**`src/main.tsx`**
```typescript
// Enable dark mode
document.documentElement.classList.add('dark')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

---

## Phase 2: 추가 기능 구현 (진행중)

### 2.1 뉴스 섹션 다크모드 재구현 (⏳ 예정)

**목표**
- 기존 `StockNews.tsx`를 Shadcn UI Card로 재구현
- 뉴스 아이템을 다크모드 스타일로 표시
- 날짜 포맷팅 개선

**구현 예정**
```typescript
// NewsCard.tsx (신규)
interface NewsCardProps {
  news: NewsItem[] | null;
  isLoading?: boolean;
}

export default function NewsCard({ news, isLoading }: NewsCardProps) {
  // Card 기반 뉴스 리스트
  // Badge로 출처 표시
  // 외부 링크 아이콘
}
```

### 2.2 AI 분석 섹션 다크모드 재구현 (⏳ 예정)

**목표**
- 기존 `StockAnalysis.tsx`를 Shadcn UI 스타일로 재구현
- AI 분석 리포트를 마크다운 렌더링
- 분석 실행 버튼을 Header 또는 적절한 위치로 이동

**구현 예정**
```typescript
// AnalysisCard.tsx (신규)
interface AnalysisCardProps {
  analysis: AIAnalysis | null;
  onAnalyze: () => void;
  isAnalyzing?: boolean;
  error?: string | null;
}

export default function AnalysisCard({ ... }: AnalysisCardProps) {
  // AI 분석 결과 Card
  // 분석 버튼 통합
  // 마크다운 렌더링 (react-markdown)
}
```

### 2.3 실제 차트 구현 (⏳ 예정)

**목표**
- Recharts를 사용한 가격 차트 추가
- 시간 범위 선택 기능 (5D, 20D, 60D, 120D)
- 이동평균선 오버레이

**구현 예정**
```typescript
// PriceChart.tsx (신규)
interface PriceChartProps {
  data: StockData;
  timeRange: '5D' | '20D' | '60D' | '120D';
}

export default function PriceChart({ data, timeRange }: PriceChartProps) {
  // Recharts LineChart
  // 이동평균선 (SMA20, SMA50, SMA200)
  // 툴팁 및 축 설정
}
```

### 2.4 라이트/다크 모드 토글 (⏳ 예정)

**목표**
- Header에 테마 토글 버튼 추가
- localStorage로 테마 설정 저장
- 시스템 테마 감지 (선택)

**구현 예정**
```typescript
// useTheme.tsx (신규)
export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return { theme, setTheme };
}
```

---

## 파일 구조

```
frontend/
├── components.json                      # Shadcn UI 설정
├── src/
│   ├── components/
│   │   ├── ui/                         # Shadcn UI 컴포넌트
│   │   │   ├── card.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── input.tsx
│   │   │   ├── button.tsx
│   │   │   └── tabs.tsx
│   │   ├── StockDashboard.tsx          # 메인 대시보드
│   │   ├── TechnicalChartCard.tsx      # 기술적 지표 카드
│   │   ├── StockSearch.tsx             # (기존, 미사용)
│   │   ├── StockInfo.tsx               # (기존, 미사용)
│   │   ├── TechnicalChart.tsx          # (기존, 대체됨)
│   │   ├── StockNews.tsx               # (기존, 재구현 예정)
│   │   └── StockAnalysis.tsx           # (기존, 재구현 예정)
│   ├── lib/
│   │   ├── utils.ts                    # cn() 유틸리티
│   │   └── api.ts                      # API 호출 함수
│   ├── types/
│   │   └── stock.ts                    # TypeScript 타입 정의
│   ├── App.tsx                         # 메인 앱 (간소화)
│   ├── main.tsx                        # 진입점 (다크모드 강제)
│   └── index.css                       # 글로벌 스타일 + CSS 변수
├── tailwind.config.js                  # Tailwind 설정
├── tsconfig.app.json                   # TypeScript 설정
├── vite.config.ts                      # Vite 설정
└── package.json                        # 의존성
```

### 주요 파일 설명

| 파일 | 역할 |
|-----|------|
| `StockDashboard.tsx` | 메인 대시보드 레이아웃 및 데이터 표시 |
| `TechnicalChartCard.tsx` | 기술적 지표 4개 카드 |
| `App.tsx` | API 데이터 페칭 및 상태 관리 |
| `lib/utils.ts` | Tailwind 클래스 병합 유틸리티 |
| `components/ui/*` | Shadcn UI 기본 컴포넌트들 |

---

## 사용 가이드

### 개발 서버 실행

```bash
cd frontend
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

### 주식 조회 방법

1. **검색창에 티커 입력** (예: AAPL, MSFT, TSLA, IREN)
2. **Enter 키 또는 검색**
3. **대시보드 확인**:
   - 회사 프로필
   - 가격 정보
   - 재무 지표 (8개)
   - 기술적 지표 (Moving Averages, RSI, MACD, Bollinger Bands)

### API 엔드포인트

```
GET /api/stock/{ticker}?include_technical=true
```

**응답 형식**
```typescript
{
  success: boolean;
  data: StockData | null;
  error: string | null;
}
```

---

## 주요 개선 사항

### Before (기존)
- ❌ 라이트 모드 (회색 배경)
- ❌ 개별 컴포넌트 분산
- ❌ 일관성 없는 스타일
- ❌ 모바일 반응형 부족

### After (신규)
- ✅ 다크 모드 (전문적)
- ✅ 통합 대시보드
- ✅ Shadcn UI 일관성
- ✅ 반응형 3-column 그리드
- ✅ 깔끔한 타이포그래피
- ✅ Lucide 아이콘 활용

---

## 기술 스택

| 카테고리 | 기술 |
|---------|------|
| **프레임워크** | React 19.2.0, Vite 7.2.4 |
| **언어** | TypeScript 5.9.3 |
| **스타일** | Tailwind CSS 4.1.18 |
| **UI 컴포넌트** | Shadcn UI (New York 스타일) |
| **아이콘** | Lucide React 0.563.0 |
| **API** | Axios 1.13.4 |
| **차트** | Recharts 3.7.0 (향후 사용) |

---

## 다음 단계

### 우선순위 1 (필수)
- [ ] 뉴스 섹션 다크모드 재구현
- [ ] AI 분석 섹션 다크모드 재구현

### 우선순위 2 (권장)
- [ ] 실제 차트 구현 (Recharts)
- [ ] 라이트/다크 모드 토글

### 우선순위 3 (선택)
- [ ] 애니메이션 개선
- [ ] 성능 최적화 (React.memo)
- [ ] 접근성 개선 (ARIA)

---

## 트러블슈팅

### 문제: Path alias (@/) 인식 안 됨
**해결**: `tsconfig.app.json`과 `vite.config.ts`에 path alias 설정 확인

### 문제: Tailwind CSS 변수 적용 안 됨
**해결**: `src/index.css`에 CSS 변수 정의 확인, `darkMode: ["class"]` 설정 확인

### 문제: 다크모드 활성화 안 됨
**해결**: `main.tsx`에서 `document.documentElement.classList.add('dark')` 확인

---

## 참고 자료

- [Shadcn UI 공식 문서](https://ui.shadcn.com/)
- [Tailwind CSS 다크모드](https://tailwindcss.com/docs/dark-mode)
- [Lucide React 아이콘](https://lucide.dev/)
- [Radix UI Primitives](https://www.radix-ui.com/)

---

**문서 버전**: 1.0  
**최종 수정**: 2026-01-29  
**작성자**: Claude Code
