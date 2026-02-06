# 페이지 레이아웃 구조 변경 플랜 (v2)

> 작성일: 2026-02-06
> 상태: ✅ 완료
> 샘플 확인: ✅ 완료
> 구현 완료: 2026-02-06

---

## 1. 핵심 원칙

### 1.1 변경하지 않는 것 (100% 보존)
| 카테고리 | 항목 | 파일 |
|----------|------|------|
| **데이터 로직** | API 호출, 상태 관리, useEffect | 모든 페이지 |
| **비즈니스 로직** | 티커 CRUD, AI 분석, 인증 | PortfolioPage, etc |
| **UI 콘텐츠** | Card 내용, Form 필드, 테이블 | 모든 페이지 |
| **컴포넌트 구조** | MainTabs 탭 콘텐츠, Sidebar 기능 | MainTabs, Sidebar |
| **스타일링** | 기존 Tailwind 클래스 (레이아웃 제외) | 모든 컴포넌트 |

### 1.2 변경하는 것 (레이아웃만)
| 항목 | 변경 내용 |
|------|----------|
| TopNav | ThemeToggle 추가 |
| SettingsPage | 자체 헤더 제거 → PageHeader 적용 |
| AdminPage | headerActions prop 제거 → PageHeader 적용 |
| HomePage | PageHeader 패턴 적용 (선택) |
| PortfolioPage | 커스텀 훅 분리 (구조 리팩토링) |

---

## 2. 구현 단계

### Phase 1: 공통 컴포넌트 생성

#### 1-1. PageHeader.tsx 생성
```
위치: frontend/src/components/layout/PageHeader.tsx
```

**코드:**
```tsx
interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex-none px-6 py-4 border-b border-border bg-card">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
```

#### 1-2. PageContainer.tsx 생성
```
위치: frontend/src/components/layout/PageContainer.tsx
```

**코드:**
```tsx
interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  centered?: boolean;
  padded?: boolean;
}

export function PageContainer({ 
  children, 
  className,
  centered = false,
  padded = true 
}: PageContainerProps) {
  return (
    <div className={cn(
      "flex-1 overflow-auto",
      padded && "p-6",
      className
    )}>
      <div className={cn(centered && "max-w-2xl mx-auto")}>
        {children}
      </div>
    </div>
  );
}
```

#### 1-3. layout/index.ts 업데이트
```tsx
export { TopNav, type PageType } from './TopNav';
export { PageHeader } from './PageHeader';
export { PageContainer } from './PageContainer';
```

---

### Phase 2: TopNav에 ThemeToggle 추가

#### 변경 파일: `frontend/src/components/layout/TopNav.tsx`

**변경 전:**
```tsx
{/* 우측: 사용자 정보 + 로그아웃 */}
<div className="flex items-center gap-3">
  <div className="flex items-center gap-2 text-sm text-muted-foreground">
    <User className="h-4 w-4" />
    <span>{username}</span>
  </div>
  <Button variant="outline" size="sm" className="gap-2" onClick={onLogout}>
    <LogOut className="h-4 w-4" />
    로그아웃
  </Button>
</div>
```

**변경 후:**
```tsx
import { ThemeToggle } from '../ThemeToggle';

{/* 우측: 테마 토글 + 사용자 정보 + 로그아웃 */}
<div className="flex items-center gap-3">
  {/* 테마 토글 */}
  <ThemeToggle />
  
  {/* 구분선 */}
  <div className="h-6 w-px bg-border" />
  
  <div className="flex items-center gap-2 text-sm text-muted-foreground">
    <User className="h-4 w-4" />
    <span>{username}</span>
  </div>
  <Button variant="outline" size="sm" className="gap-2" onClick={onLogout}>
    <LogOut className="h-4 w-4" />
    로그아웃
  </Button>
</div>
```

**ThemeToggle 스타일 조정 (선택):**
TopNav 높이(h-14)에 맞게 버튼 크기 조정
```tsx
// ThemeToggle.tsx - 크기 조정 (h-10 → h-9)
className="relative h-9 w-9 rounded-lg ..."
```

---

### Phase 3: SettingsPage 리팩토링

#### 변경 파일: `frontend/src/components/settings/SettingsPage.tsx`

**제거할 코드 (자체 헤더):**
```tsx
// 삭제 대상: 144-155 라인 영역
<header className="flex-none z-50 w-full border-b border-border bg-background/95 ...">
  <div className="flex h-14 items-center justify-between px-6">
    <h1 className="text-lg font-semibold text-foreground">Stock Dashboard</h1>
    <div className="flex items-center gap-2">
      {headerActions}
      <ThemeToggle />
    </div>
  </div>
</header>
```

**제거할 Props:**
```tsx
// 삭제 대상
interface SettingsPageProps {
  headerActions?: React.ReactNode  // 삭제
}
```

**변경 후 구조:**
```tsx
import { PageHeader, PageContainer } from '@/components/layout';

export function SettingsPage() {
  // ... 기존 상태 및 로직 100% 유지 ...

  return (
    <div className="h-full flex flex-col">
      <PageHeader 
        title="설정" 
        description="AI 분석 기능을 사용하기 위한 API 키를 관리합니다"
      />
      <PageContainer centered padded>
        <div className="space-y-6">
          {/* 기존 Card 컴포넌트 100% 유지 */}
          <Card className="border-border shadow-lg">
            {/* ... 내부 코드 그대로 ... */}
          </Card>
        </div>
      </PageContainer>
    </div>
  );
}
```

**보존되는 코드:**
- `fetchKeyStatus()` 함수
- `handleSaveKey()` 함수
- `handleDeleteKey()` 함수
- 모든 상태 (apiKey, hasKey, keyPreview, showApiKey, isLoading, isFetching, error, success)
- Card 내부의 모든 JSX (폼, 버튼, 안내사항 등)

---

### Phase 4: AdminPage 리팩토링

#### 변경 파일: `frontend/src/components/admin/AdminPage.tsx`

**제거할 Props:**
```tsx
// 삭제 대상
interface AdminPageProps {
  headerActions?: React.ReactNode;  // 삭제
}
```

**변경 후 구조:**
```tsx
import { PageHeader, PageContainer } from '@/components/layout';

export function AdminPage() {
  // ... 기존 상태 및 로직 100% 유지 ...

  return (
    <div className="h-full flex flex-col">
      <PageHeader 
        title="관리자" 
        description="사용자 및 시스템 설정을 관리합니다"
        actions={
          <Button variant="outline" size="sm" onClick={loadData} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            새로고침
          </Button>
        }
      />
      <PageContainer padded>
        {/* 기존 Tabs 및 콘텐츠 100% 유지 */}
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <Tabs ...>
            {/* ... 내부 코드 그대로 ... */}
          </Tabs>
        )}
      </PageContainer>
    </div>
  );
}
```

**보존되는 코드:**
- `loadData()` 함수
- `handleApprove()`, `handleReject()`, `handleDelete()` 등 모든 핸들러
- 모든 상태 (allUsers, pendingUsers, isLoading, error, logLevel 등)
- Tabs 내부의 모든 JSX

---

### Phase 5: HomePage 조정 (선택적)

#### 변경 파일: `frontend/src/components/pages/HomePage.tsx`

**현재:**
```tsx
<div className="h-full flex flex-col">
  <div className="flex-none px-6 py-4 border-b border-border bg-card">
    <h1 className="text-xl font-semibold">Economic Overview</h1>
    <p className="text-sm text-muted-foreground">거시경제 지표 현황</p>
  </div>
  <div className="flex-1 overflow-hidden">
    <EconomicIndicators className="h-full" />
  </div>
</div>
```

**변경 후 (PageHeader 적용):**
```tsx
import { PageHeader } from '@/components/layout';

export function HomePage() {
  return (
    <div className="h-full flex flex-col">
      <PageHeader 
        title="Economic Overview" 
        description="거시경제 지표 현황"
      />
      <div className="flex-1 overflow-hidden">
        <EconomicIndicators className="h-full" />
      </div>
    </div>
  );
}
```

**보존:** EconomicIndicators 컴포넌트 100% 유지

---

### Phase 6: PortfolioPage 리팩토링 (커스텀 훅 분리)

#### 목표
- 500+ lines → 200 lines 이하로 분리
- 데이터 로직을 커스텀 훅으로 추출
- UI 코드만 PortfolioPage에 유지

#### 6-1. usePortfolio 훅 생성
```
위치: frontend/src/hooks/usePortfolio.ts
```

**추출할 코드:**
```tsx
// 상태
const [stockData, setStockData] = useState<StockData | null>(null);
const [newsData, setNewsData] = useState<NewsItem[] | null>(null);
const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
const [aiError, setAiError] = useState<...>(null);
const [loadingStates, setLoadingStates] = useState({...});
const [userSettings, setUserSettings] = useState<UserSettings>({...});

// 함수
const fetchStockData = async (tickerSymbol: string) => {...};
const handleAddTicker = async (symbol: string) => {...};
const handleRemoveTicker = async (symbol: string) => {...};
const handleSelectTicker = (symbol: string) => {...};
const handleUpdatePurchasePrice = async (...) => {...};
const handleAnalyzeAI = async () => {...};

// useEffect
useEffect(() => { loadPortfoliosFromDB(); }, []);
```

**훅 인터페이스:**
```tsx
export function usePortfolio() {
  // ... 모든 상태 및 로직 ...

  return {
    // 상태
    stockData,
    newsData,
    aiAnalysis,
    aiError,
    loadingStates,
    userSettings,
    
    // 액션
    fetchStockData,
    handleAddTicker,
    handleRemoveTicker,
    handleSelectTicker,
    handleUpdatePurchasePrice,
    handleAnalyzeAI,
    
    // 파생 데이터
    displayData,
    sidebarTickers,
  };
}
```

#### 6-2. PortfolioPage 변경 후
```tsx
import { usePortfolio } from '@/hooks/usePortfolio';

export function PortfolioPage({ onNavigateToSettings }: PortfolioPageProps) {
  const { user } = useAuth();
  const {
    stockData,
    newsData,
    aiAnalysis,
    aiError,
    loadingStates,
    userSettings,
    handleAddTicker,
    handleRemoveTicker,
    handleSelectTicker,
    handleUpdatePurchasePrice,
    handleAnalyzeAI,
    displayData,
    sidebarTickers,
  } = usePortfolio();

  return (
    <div className="h-full flex">
      <Sidebar ... />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 기존 JSX 구조 100% 유지 */}
      </div>
    </div>
  );
}
```

**보존:**
- JSX 구조 100% 유지
- 모든 비즈니스 로직 (훅으로 이동만, 변경 없음)
- MainTabs 콘텐츠 렌더링 로직

---

### Phase 7: 정리 및 검증

#### 7-1. 샘플 파일 삭제
```
삭제: frontend/src/components/pages/SampleLayoutDemo.tsx
```

#### 7-2. App.tsx DEMO_MODE 제거
```tsx
// 삭제
const DEMO_MODE = true;
import { SampleLayoutDemo } from './components/pages/SampleLayoutDemo';

// 원복
function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  )
}
```

#### 7-3. pages/index.ts 업데이트
```tsx
export { HomePage } from './HomePage';
export { PortfolioPage } from './PortfolioPage';
// SampleLayoutDemo 제거
```

---

## 3. 파일 변경 요약

### 신규 생성
| 파일 | 설명 |
|------|------|
| `layout/PageHeader.tsx` | 공통 페이지 헤더 |
| `layout/PageContainer.tsx` | 공통 콘텐츠 컨테이너 |
| `hooks/usePortfolio.ts` | 포트폴리오 데이터 훅 |

### 수정
| 파일 | 변경 내용 | 변경 규모 |
|------|----------|----------|
| `layout/TopNav.tsx` | ThemeToggle 추가 | 🟢 소 |
| `layout/index.ts` | export 추가 | 🟢 소 |
| `settings/SettingsPage.tsx` | 자체 헤더 제거, PageHeader 적용 | 🟡 중 |
| `admin/AdminPage.tsx` | headerActions 제거, PageHeader 적용 | 🟡 중 |
| `pages/HomePage.tsx` | PageHeader 적용 | 🟢 소 |
| `pages/PortfolioPage.tsx` | usePortfolio 훅 사용 | 🟡 중 |
| `App.tsx` | DEMO_MODE 제거 | 🟢 소 |

### 삭제
| 파일 | 사유 |
|------|------|
| `pages/SampleLayoutDemo.tsx` | 데모 용도 완료 |

---

## 4. 검증 체크리스트

### 기능 검증
- [ ] 로그인/로그아웃 동작
- [ ] 페이지 전환 (Economic → Portfolio → Settings → Admin)
- [ ] **ThemeToggle 동작** (TopNav에서)
- [ ] **Settings: API 키 저장/삭제** (기존 기능 유지)
- [ ] **Admin: 사용자 승인/거부/삭제** (기존 기능 유지)
- [ ] **Portfolio: 티커 CRUD** (기존 기능 유지)
- [ ] **Portfolio: 주식 데이터 로드** (기존 기능 유지)
- [ ] **Portfolio: AI 분석** (기존 기능 유지)
- [ ] **Economic: 지표 로드/새로고침** (기존 기능 유지)

### UI 검증
- [ ] SettingsPage 이중 헤더 해결
- [ ] 페이지별 레이아웃 일관성
- [ ] 스크롤 동작 정상
- [ ] 반응형 동작

---

## 5. 구현 순서 (권장)

```
1. Phase 1: 공통 컴포넌트 생성 (PageHeader, PageContainer)
2. Phase 2: TopNav ThemeToggle 추가
3. Phase 3: SettingsPage 리팩토링
4. Phase 4: AdminPage 리팩토링
5. Phase 5: HomePage 조정
6. Phase 6: PortfolioPage + usePortfolio 훅
7. Phase 7: 샘플 삭제 및 정리
```

각 Phase 완료 후 검증 → 문제 없으면 다음 Phase 진행

---

## 6. 롤백 계획

문제 발생 시:
1. Git에서 해당 Phase 이전 커밋으로 롤백
2. 또는 개별 파일 원복

각 Phase별로 커밋하여 세밀한 롤백 가능하도록 함
