# Linear 스타일 극단적 미니멀리즘 주식 대시보드 구현 계획

## 📋 프로젝트 개요

**목표**: 기존 UI를 완전히 폐기하고 Linear app 스타일의 극단적 미니멀리즘 디자인으로 재구축

**핵심 원칙**:
- 기존 UI 코드는 절대 참조 금지 (API 호출 로직만 유지)
- 데이터는 현재 API response 그대로 활용
- shadcn/ui 컴포넌트 구조만 활용 (스타일은 완전히 새로 정의)

---

## 🎨 Linear 스타일 특징

| 요소 | 설계 원칙 |
|------|----------|
| **타이포그래피** | 계층 명확 (60px → 36px → 24px → 16px) |
| **색상** | Teal (#14B8A6) 포인트 + 회색조, 다크 모드 우선 (#0A0A0A 배경) |
| **레이아웃** | 테이블/리스트 중심, 카드 최소화 |
| **여백** | 넓은 여백 (py-8, space-y-8) |
| **정보 밀도** | 낮음 (탭으로 분리) |
| **아이콘** | 최소화 (4-5개만: Menu, Plus, ChevronRight, TrendingUp/Down) |
| **애니메이션** | 부드럽게 (150-300ms, transform/opacity만) |

---

## 📐 화면 구조

```
┌─────────────────────────────────────────────┐
│ [Sidebar]    │  [Main Content]              │
│              │                               │
│ MY TICKERS   │  Hero: AAPL ・ Apple Inc.     │
│ ────────     │  $174.50 (text-6xl)           │
│ [+] Add      │  +$12.50 (+7.2%)              │
│              │                               │
│ ● AAPL +2.5% │  QUICK METRICS (6개 지표)     │
│ ○ TSLA -1.2% │  PER 30.5 ████████░░ 높음     │
│ ○ NVDA +5.0% │  PBR  2.8 ███░░░░░░░ 중립     │
│              │  ROE 15.2% ██████████ 좋음    │
│              │  ...                          │
│              │                               │
│              │  [Overview][AI][Tech][News]   │
│              │  ━━━━━━━━━                     │
│              │  Tab Content (스크롤)         │
└─────────────────────────────────────────────┘
```

---

## 🛠️ 구현 계획

### Phase 1: 기본 구조 (1-2일)

**목표**: Hero + Quick Metrics + Sidebar 동작, Linear 스타일 명확히 보임

| 순서 | 작업 | 파일 | 설명 |
|------|------|------|------|
| 1 | 색상/타이포 시스템 | `frontend/src/index.css` | 다크 모드 색상, Teal 포인트, 폰트 크기 재정의 |
| 2 | 레이아웃 구조 | `frontend/src/components/AppLayout.tsx` (새로) | Sidebar + MainContent |
| 3 | Hero Section | `frontend/src/components/HeroSection.tsx` (새로) | 현재가 (text-6xl), 수익률, 타이포그래피 중심 |
| 4 | Quick Metrics | `frontend/src/components/QuickMetrics.tsx` (새로) | 6개 핵심 지표 리스트 |
| 5 | Gauge Bar | `frontend/src/components/GaugeBar.tsx` (새로) | 프로그레스 바, 색상 코딩 |
| 6 | Sidebar | `frontend/src/components/Sidebar.tsx` (새로) | 티커 목록, 추가 버튼 |
| 7 | App.tsx 재구성 | `frontend/src/App.tsx` | 기존 UI 제거, 새 레이아웃 적용 (API 로직은 유지) |

**세부 작업**:

#### 1. index.css - 색상 시스템 재정의
```css
:root {
  /* 다크 모드 (Primary) */
  --background: 10 10 10;           /* #0A0A0A */
  --card: 17 17 17;                 /* #111111 */
  --muted: 26 26 26;                /* #1A1A1A */
  --border: 42 42 42;               /* #2A2A2A */
  --foreground: 255 255 255;        /* #FFFFFF */
  --muted-foreground: 161 161 170;  /* #A1A1AA */

  /* Teal 포인트 */
  --primary: 20 184 166;            /* #14B8A6 */
  --primary-foreground: 255 255 255;

  /* 시맨틱 */
  --success: 34 197 94;             /* #22C55E */
  --destructive: 239 68 68;         /* #EF4444 */
  --warning: 245 158 11;            /* #F59E0B */
}
```

#### 2. HeroSection.tsx - 타이포그래피 중심
```tsx
<section className="space-y-4 py-8 px-6 border-b border-border">
  {/* 티커 + 회사명 */}
  <div className="flex items-baseline gap-3">
    <h1 className="text-4xl font-bold text-primary">AAPL</h1>
    <span className="text-2xl text-muted-foreground">Apple Inc.</span>
  </div>

  {/* 섹터 + 시가총액 */}
  <p className="text-sm text-muted-foreground">
    Technology ・ $2.5T
  </p>

  {/* 현재가 (크게) */}
  <div className="text-6xl font-bold tracking-tight">
    $174.50
  </div>

  {/* 수익률 (조건부) */}
  {purchasePrice && (
    <div className="text-3xl font-semibold text-success">
      +$12.50 (+7.2%)
    </div>
  )}
</section>
```

#### 3. QuickMetrics.tsx - 6개 핵심 지표
```tsx
<section className="py-6 px-6 border-b border-border">
  <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-4">
    QUICK METRICS
  </h2>

  <div className="space-y-3">
    <MetricRow label="PER" value={30.5} percentage={85} status="높음" color="warning" />
    <MetricRow label="PBR" value={2.8} percentage={40} status="중립" color="neutral" />
    <MetricRow label="ROE" value="15.2%" percentage={75} status="좋음" color="success" />
    <MetricRow label="배당수익률" value="2.1%" percentage={50} status="중립" color="neutral" />
    <MetricRow label="부채비율" value="45.0%" percentage={30} status="좋음" color="success" />
    <MetricRow label="영업이익률" value="22.5%" percentage={90} status="좋음" color="success" />
  </div>
</section>
```

**MetricRow 구조**:
```tsx
<div className="flex items-center justify-between py-3 hover:bg-muted/50 transition-colors">
  <span className="text-xs text-muted-foreground w-24">{label}</span>
  <span className="text-2xl font-semibold w-20 text-right">{value}</span>
  <div className="flex-1 ml-4">
    <GaugeBar percentage={percentage} color={color} />
  </div>
  <span className="text-xs text-muted-foreground ml-2 w-12">{status}</span>
</div>
```

#### 4. GaugeBar.tsx - 프로그레스 바
```tsx
const colorMap = {
  success: 'hsl(var(--success))',
  warning: 'hsl(var(--warning))',
  destructive: 'hsl(var(--destructive))',
  neutral: 'hsl(var(--muted-foreground))',
};

<div className="w-full h-2 bg-muted rounded-full overflow-hidden">
  <div
    className="h-full rounded-full transition-all duration-500"
    style={{
      width: `${percentage}%`,
      backgroundColor: colorMap[color]
    }}
  />
</div>
```

#### 5. Sidebar.tsx - 티커 목록
```tsx
<aside className="w-60 bg-card border-r border-border hidden lg:block">
  {/* 헤더 */}
  <div className="px-4 py-3 border-b border-border">
    <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
      MY TICKERS
    </h2>
  </div>

  {/* 추가 버튼 */}
  <Button variant="ghost" size="sm" className="w-full justify-start mx-4 my-3">
    <Plus className="h-4 w-4 mr-2" />
    Add Ticker
  </Button>

  {/* 티커 리스트 */}
  {tickers.map((ticker) => (
    <button
      onClick={() => onSelectTicker(ticker.symbol)}
      className={cn(
        "w-full px-4 py-3 text-left transition-colors hover:bg-muted",
        ticker.symbol === selectedTicker
          ? "bg-primary/10 text-primary border-l-2 border-primary"
          : "text-muted-foreground"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium">{ticker.symbol}</span>
        <span className={ticker.profitPercent > 0 ? "text-success" : "text-destructive"}>
          {ticker.profitPercent > 0 ? '+' : ''}{ticker.profitPercent.toFixed(2)}%
        </span>
      </div>
    </button>
  ))}
</aside>
```

---

### Phase 2: 탭 시스템 (1-2일)

**목표**: 4개 탭 모두 동작, 데이터 올바르게 표시

| 순서 | 작업 | 파일 | 설명 |
|------|------|------|------|
| 8 | 탭 네비게이션 | `frontend/src/components/TabNavigation.tsx` (새로) | shadcn/ui Tabs 활용 |
| 9 | Overview 탭 | `frontend/src/components/tabs/OverviewTab.tsx` (새로) | 회사 정보 + 재무지표 테이블 |
| 10 | News 탭 | `frontend/src/components/tabs/NewsTab.tsx` (새로) | 뉴스 리스트 |
| 11 | AI Analysis 탭 | `frontend/src/components/tabs/AIAnalysisTab.tsx` (새로) | 마크다운 렌더링 (react-markdown) |
| 12 | Technical 탭 | `frontend/src/components/tabs/TechnicalTab.tsx` (새로) | 기술적 지표 리스트 |

**세부 작업**:

#### Tabs 구조 (shadcn/ui)
```tsx
<Tabs defaultValue="overview" className="py-6">
  <TabsList className="w-full justify-start border-b border-border bg-transparent">
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="ai">AI Analysis</TabsTrigger>
    <TabsTrigger value="technical">Technical</TabsTrigger>
    <TabsTrigger value="news">News</TabsTrigger>
  </TabsList>

  <TabsContent value="overview">
    <OverviewTab data={stockData} />
  </TabsContent>
  {/* ... */}
</Tabs>
```

#### Overview 탭 - 회사 정보 + 재무지표
```tsx
<div className="space-y-8 py-6 px-6">
  {/* 회사 정보 */}
  <section>
    <h3 className="text-lg font-medium mb-3">Company Info</h3>
    <p className="text-base leading-relaxed text-muted-foreground">
      {company.summary_translated || company.summary_original}
    </p>
  </section>

  {/* 재무지표 (13개 전체) */}
  <section>
    <h3 className="text-lg font-medium mb-3">Financial Metrics</h3>
    <div className="space-y-2">
      {allMetrics.map((metric) => (
        <MetricRow key={metric.label} {...metric} />
      ))}
    </div>
  </section>
</div>
```

#### News 탭 - 뉴스 리스트
```tsx
<div className="py-6">
  {news.map((item) => (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block px-6 py-4 hover:bg-muted/50 transition-colors border-b border-border"
    >
      <h4 className="text-base font-medium mb-1 hover:text-primary">
        {item.title}
      </h4>
      <div className="text-sm text-muted-foreground">
        {item.source} ・ {formatDate(item.published_at)}
      </div>
    </a>
  ))}
</div>
```

#### AI Analysis 탭 - 마크다운
```tsx
import ReactMarkdown from 'react-markdown';

<div className="py-6 px-6 prose prose-invert max-w-none">
  <ReactMarkdown
    components={{
      h2: ({...props}) => <h2 className="text-2xl font-semibold mt-8 mb-4" {...props} />,
      h3: ({...props}) => <h3 className="text-lg font-medium mt-6 mb-3" {...props} />,
      p: ({...props}) => <p className="text-base leading-relaxed mb-4" {...props} />,
    }}
  >
    {aiAnalysis.report}
  </ReactMarkdown>
</div>
```

---

### Phase 3: 인터랙션 (1일)

**목표**: 애니메이션 부드럽게 동작, 로딩 상태 표시

| 순서 | 작업 | 파일 | 설명 |
|------|------|------|------|
| 13 | 사이드바 토글 (데스크탑 + 모바일) | `Sidebar.tsx` | 여닫기 버튼, 슬라이드 애니메이션 (300ms) |
| 14 | 페이지 전환 애니메이션 | 전체 | opacity + translateY (300ms) |
| 15 | Hover 효과 | 전체 | bg-muted/50 (150ms) |
| 16 | 게이지 바 애니메이션 | `GaugeBar.tsx` | width 0 → N% (500ms) |
| 17 | 로딩 상태 | 전체 | Skeleton (shadcn/ui) |

**사이드바 토글 구현**:

```tsx
// Sidebar.tsx
const [isOpen, setIsOpen] = useState(true);

<aside className={cn(
  "bg-card border-r border-border transition-all duration-300",
  isOpen ? "w-60" : "w-0 overflow-hidden"
)}>
  {/* 토글 버튼 (우상단) */}
  <button
    onClick={() => setIsOpen(!isOpen)}
    className="absolute -right-3 top-4 w-6 h-6 bg-card border border-border rounded-full flex items-center justify-center hover:bg-muted"
  >
    {isOpen ? <ChevronLeft className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
  </button>

  {/* 내용 */}
  <div className={cn("transition-opacity", isOpen ? "opacity-100" : "opacity-0")}>
    {/* ... */}
  </div>
</aside>
```

**애니메이션 CSS**:
```css
/* 페이지 전환 */
.fade-in {
  animation: fadeIn 300ms ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Hover */
.hover-effect {
  transition: background-color 150ms ease;
}

/* 게이지 바 */
.gauge-bar {
  width: 0;
  animation: gaugeFill 500ms ease-out forwards;
}

@keyframes gaugeFill {
  to {
    width: var(--gauge-width);
  }
}

/* 사이드바 토글 */
.sidebar {
  transition: width 300ms ease-in-out;
}
```

---

### Phase 4: 고급 기능 (선택적, 1-2일)

| 순서 | 작업 | 파일 | 설명 |
|------|------|------|------|
| 18 | 매입가 입력 | `frontend/src/components/PurchasePriceInput.tsx` | 기존 로직 재사용 |
| 19 | 반응형 최적화 | 전체 | 모바일/태블릿/데스크탑 |
| 20 | 접근성 | 전체 | 키보드 네비게이션, ARIA |

---

## 📁 핵심 파일 목록

### 1. 색상/타이포 시스템
- **`frontend/src/index.css`**: 다크 모드 색상, Teal 포인트, 타이포그래피 정의

### 2. 레이아웃
- **`frontend/src/App.tsx`**: 기존 UI 제거, AppLayout 적용 (API 로직 유지)
- **`frontend/src/components/AppLayout.tsx`** (새로): Sidebar + MainContent

### 3. Hero Section
- **`frontend/src/components/HeroSection.tsx`** (새로): 현재가, 수익률 표시

### 4. Quick Metrics
- **`frontend/src/components/QuickMetrics.tsx`** (새로): 6개 핵심 지표
- **`frontend/src/components/GaugeBar.tsx`** (새로): 프로그레스 바

### 5. Sidebar
- **`frontend/src/components/Sidebar.tsx`** (새로): 티커 목록, 추가 버튼, 토글 기능

### 6. Tabs
- **`frontend/src/components/TabNavigation.tsx`** (새로): shadcn/ui Tabs
- **`frontend/src/components/tabs/OverviewTab.tsx`** (새로): 회사 정보 + 재무지표
- **`frontend/src/components/tabs/AIAnalysisTab.tsx`** (새로): 마크다운 렌더링
- **`frontend/src/components/tabs/TechnicalTab.tsx`** (새로): 기술적 지표
- **`frontend/src/components/tabs/NewsTab.tsx`** (새로): 뉴스 리스트

### 7. 타입 (참조만)
- **`frontend/src/types/stock.ts`**: API 응답 타입 (수정 불필요)
- **`frontend/src/types/user.ts`**: 사용자 설정 타입 (수정 불필요)

---

## ✅ 검증 방법

### 1. Visual 검증 (Linear 스타일)
- [ ] 타이포그래피 계층 명확 (60px → 36px → 24px → 16px)
- [ ] 넓은 여백 (py-8, space-y-8)
- [ ] Teal 포인트 색상 (버튼, 링크만)
- [ ] 정보 밀도 낮음 (한 화면에 핵심만)
- [ ] 테이블/리스트 중심 (Quick Metrics, 재무지표)
- [ ] 아이콘 최소화 (4-5개만)
- [ ] 다크 모드 (#0A0A0A 배경)

### 2. 기능 검증
- [ ] 티커 검색 → Hero Section 업데이트
- [ ] Quick Metrics 6개 지표 올바르게 표시
- [ ] 게이지 바 색상 코딩 (좋음/중립/나쁨)
- [ ] 탭 전환 (Overview, AI, Technical, News)
- [ ] 매입가 입력 → 수익률 계산
- [ ] 사이드바 티커 목록 클릭 → 티커 변경

### 3. 애니메이션 검증
- [ ] 페이지 전환 (opacity + translateY, 300ms)
- [ ] Hover 효과 (bg-muted/50, 150ms)
- [ ] 게이지 바 애니메이션 (0 → N%, 500ms)
- [ ] 탭 전환 애니메이션 (opacity, 200ms)

### 4. 반응형 검증
- [ ] 데스크탑 (> 1024px): Sidebar 고정 표시
- [ ] 태블릿 (640px - 1024px): Sidebar 오버레이
- [ ] 모바일 (< 640px): Sidebar 숨김 (햄버거 메뉴)

### 5. 데이터 무결성 검증
- [ ] API 호출 → StockData 정상 수신
- [ ] NewsItem[] 정상 표시
- [ ] AIAnalysis 마크다운 렌더링
- [ ] 기술적 지표 (SMA, EMA, RSI, MACD, Bollinger) 표시

---

## 📊 작업 우선순위

| 우선순위 | 단계 | 예상 시간 | 중요도 |
|---------|------|----------|--------|
| 🔴 필수 | Phase 1 (기본 구조) | 1-2일 | 매우 높음 |
| 🔴 필수 | Phase 2 (탭 시스템) | 1-2일 | 매우 높음 |
| 🟡 권장 | Phase 3 (인터랙션) | 1일 | 높음 |
| 🟢 선택 | Phase 4 (고급 기능) | 1-2일 | 중간 |

**총 예상 시간**: 4-7일

---

## 🚨 주의사항

1. **기존 UI 참조 금지**:
   - StockDashboard.tsx, StockInfo.tsx, StockAnalysis.tsx 등 기존 컴포넌트 완전히 무시
   - 오직 API 호출 로직 (`fetchStockData`, `handleAddTicker` 등)만 App.tsx에서 재사용

2. **색상 규칙 엄수**:
   - Teal (#14B8A6)은 버튼, 링크, 활성 상태만
   - 대부분은 회색조 (#0A0A0A, #111111, #A1A1AA)
   - 시맨틱 색상 (Success, Destructive, Warning)은 명확한 의미가 있을 때만

3. **타이포그래피 계층 유지**:
   - Hero Number: text-6xl (60px)
   - Hero Title: text-4xl (36px)
   - Metric Value: text-2xl (24px)
   - Body: text-base (16px)
   - Caption: text-sm (14px)
   - Micro: text-xs (12px)

4. **애니메이션 원칙**:
   - GPU 가속 속성만 (transform, opacity)
   - 빠르게 (150-300ms)
   - 의미 있는 곳에만 (페이지 전환, Hover, 게이지 바)

5. **아이콘 최소화**:
   - Menu (모바일 햄버거)
   - Plus (티커 추가)
   - ChevronLeft/ChevronRight (사이드바 토글, 뉴스 외부 링크)
   - TrendingUp/Down (수익/손실, 조건부)
   - 총 5-6개만 사용

---

## 📦 의존성

### 필요한 라이브러리

| 라이브러리 | 용도 | 설치 여부 |
|----------|------|----------|
| `react-markdown` | AI Analysis 마크다운 렌더링 | 확인 필요 |
| `lucide-react` | 아이콘 (4-5개만) | 이미 설치됨 |
| `@radix-ui/react-tabs` | shadcn/ui Tabs | 확인 필요 |

**설치 명령**:
```bash
cd frontend
npm install react-markdown remark-gfm
npx shadcn-ui@latest add tabs
```

---

## 🎯 성공 기준

### Phase 1 완료 기준
- Hero Section: 현재가 (text-6xl), 수익률 표시
- Quick Metrics: 6개 지표 + 게이지 바 동작
- Sidebar: 티커 목록 클릭 → 티커 변경
- **Linear 스타일 명확히 보임** (타이포그래피, 여백, Teal 포인트)

### Phase 2 완료 기준
- 4개 탭 모두 동작 (Overview, AI, Technical, News)
- 데이터 올바르게 표시 (회사 정보, 재무지표, 마크다운, 뉴스)

### Phase 3 완료 기준
- 애니메이션 부드럽게 동작 (페이지 전환, Hover, 게이지 바)
- 로딩 상태 Skeleton 표시

### 최종 완료 기준
- ✅ Visual: Linear app과 유사한 느낌 (극단적 미니멀리즘)
- ✅ 기능: 모든 데이터 올바르게 표시
- ✅ 인터랙션: 애니메이션 부드럽고 자연스러움
- ✅ 반응형: 모바일/태블릿/데스크탑 모두 대응

---

## 📝 참고

- **Linear 앱**: https://linear.app (디자인 영감)
- **shadcn/ui**: https://ui.shadcn.com (컴포넌트)
- **Tailwind CSS**: https://tailwindcss.com (유틸리티)

---

**작성일**: 2026-02-03
