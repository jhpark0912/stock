# shadcn dashboard-01 통합 계획서

## 📋 확인한 shadcn 컴포넌트

### 1. SectionCards
**위치**: `@/components/section-cards.tsx`

**구조**:
- 4개의 Card로 구성된 그리드
- 각 카드: CardHeader (제목 + 숫자) + Badge (트렌드) + CardFooter (설명)
- 반응형: 1열 → 2열 → 4열

**적용 대상**:
- ✅ **재무지표 (FinancialMetricsCard)**: PER, PBR, ROE 등 각 지표를 독립된 카드로 표시
- ✅ **회사 정보 (CompanyInfoCard)**: 현재가, 시가총액 등 주요 정보

### 2. ChartAreaInteractive
**위치**: `@/components/chart-area-interactive.tsx`

**구조**:
- Card + CardHeader + CardContent
- recharts 사용 (AreaChart)
- 시간 범위 선택 UI (ToggleGroup/Select)
- 반응형 차트

**적용 대상**:
- ✅ **TechnicalChartCard**: 기술적 지표 차트
- ✅ **가격 차트**: 주가 히스토리 차트

### 3. AppSidebar
**위치**: `@/components/app-sidebar.tsx`

**구조**:
- Sidebar 컴포넌트 기반
- SidebarHeader + SidebarContent + SidebarFooter
- NavMain, NavDocuments, NavSecondary, NavUser 서브 컴포넌트

**적용 대상**:
- ✅ **TickerListSidebar**: 티커 목록을 AppSidebar 스타일로 변환

---

## 🎯 구현 계획

### Phase 1: 재무지표 카드화 ✅ 완료 (2026-02-03)

**현재 문제**:
```tsx
// 현재: 그리드 안에 MetricCard들이 있지만 카드처럼 안 보임
<div className="grid grid-cols-4 gap-4">
  <MetricCard label="PER" value="30.0" />
  ...
</div>
```

**shadcn 적용**:
```tsx
// SectionCards 스타일 사용
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown } from "lucide-react"

// 각 지표를 Card로 변환
<div className="grid grid-cols-1 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 gap-4">
  <Card className="@container/card">
    <CardHeader className="relative">
      <CardDescription>PER (현재)</CardDescription>
      <CardTitle className="text-3xl font-semibold tabular-nums">
        {data.financials.trailing_pe?.toFixed(2)}
      </CardTitle>
      <div className="absolute right-4 top-4">
        <Badge variant="outline" className="flex gap-1 rounded-lg text-xs">
          {/* status에 따라 색상 변경 */}
        </Badge>
      </div>
    </CardHeader>
    <CardFooter className="flex-col items-start gap-1 text-sm">
      <div className="flex gap-2 font-medium">
        평가: 적정 <TrendingUp className="size-4" />
      </div>
      <div className="text-muted-foreground">
        업계 평균 대비
      </div>
    </CardFooter>
  </Card>
  {/* 다른 지표들도 동일 패턴 */}
</div>
```

**수정할 파일**: `frontend/src/components/StockInfo.tsx`
- ❌ 기존 MetricCard 컴포넌트 **제거**
- ✅ shadcn Card 사용
- ✅ SectionCards 구조 참고하여 재구성

---

### Phase 2: 기술적 지표 차트

**현재 구조**:
```tsx
// TechnicalChartCard.tsx - 각 지표가 별도 섹션
<div className="space-y-8">
  <div className="bg-card/50 rounded-2xl p-8">
    {/* 이동평균 */}
  </div>
  <div className="bg-card/50 rounded-2xl p-8">
    {/* RSI */}
  </div>
  ...
</div>
```

**shadcn 적용**:
```tsx
// ChartAreaInteractive 스타일 사용
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"

<Card className="@container/card">
  <CardHeader>
    <CardTitle>RSI (14일)</CardTitle>
    <CardDescription>상대강도지수</CardDescription>
  </CardHeader>
  <CardContent>
    {/* RSI 차트/표시 */}
  </CardContent>
</Card>
```

**수정할 파일**: `frontend/src/components/TechnicalChartCard.tsx`
- ✅ 각 지표 섹션을 Card로 변환
- ✅ bg-card/50 등 직접 스타일 **제거**
- ✅ shadcn Card 기본 스타일 사용

---

### Phase 3: 사이드바 통합

**현재 구조**:
```tsx
// TickerListSidebar.tsx
<div className="bg-card border-r ...">
  <div className="p-4 border-b ...">
    {/* 헤더 */}
  </div>
  <ul>
    {tickers.map(...)}
  </ul>
</div>
```

**shadcn 적용**:
```tsx
// AppSidebar 기반으로 재작성
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, ... } from "@/components/ui/sidebar"

<Sidebar collapsible="offcanvas">
  <SidebarHeader>
    <SidebarMenu>
      {/* 매물 추가 입력 */}
    </SidebarMenu>
  </SidebarHeader>
  <SidebarContent>
    {/* 티커 목록 */}
  </SidebarContent>
  <SidebarFooter>
    {/* 통계 또는 설정 */}
  </SidebarFooter>
</Sidebar>
```

**수정할 파일**: `frontend/src/components/TickerListSidebar.tsx`
- ✅ 기존 div 기반 구조 → Sidebar 컴포넌트로 변환
- ✅ 토글 기능은 Sidebar의 `collapsible` prop 사용

---

## 📐 작업 원칙

### ✅ DO (해야 할 것)

1. **shadcn 컴포넌트만 사용**
   ```tsx
   // ✅ Good
   import { Card, CardHeader } from "@/components/ui/card"
   <Card>...</Card>
   ```

2. **내용만 수정**
   ```tsx
   // ✅ Good - SectionCards의 내용만 변경
   <CardDescription>PER</CardDescription>
   <CardTitle>{data.financials.trailing_pe}</CardTitle>
   ```

3. **필요한 shadcn 컴포넌트 추가 설치**
   ```bash
   npx shadcn@latest add [component-name]
   ```

### ❌ DON'T (하지 말아야 할 것)

1. **Tailwind 클래스 직접 조합 금지**
   ```tsx
   // ❌ Bad
   <div className="p-6 rounded-xl bg-card border shadow-sm">

   // ✅ Good
   <Card>...</Card>
   ```

2. **새로운 컴포넌트 직접 만들기 금지**
   ```tsx
   // ❌ Bad
   const MetricCard = ({ ... }) => {
     return <div className="p-6 ...">...</div>
   }

   // ✅ Good
   import { Card } from "@/components/ui/card"
   ```

3. **기존 스타일 재사용 금지**
   ```tsx
   // ❌ Bad
   className="bg-card/50 rounded-2xl p-8"

   // ✅ Good
   <Card>...</Card> // shadcn의 기본 스타일 사용
   ```

---

## 🔄 마이그레이션 단계

### Step 1: StockInfo.tsx 재작성 ✅ 완료
1. ✅ SectionCards 패턴 적용
2. ✅ 내용을 재무지표로 변경 (PER, PBR, ROE 등 13개 지표)
3. ✅ Badge에 status 색상 매핑 (getStatusBadgeVariant 함수 사용)
4. ✅ 기존 MetricCard 제거하고 shadcn Card로 완전 대체

**변경 파일**: `frontend/src/components/StockInfo.tsx`
- Import 추가: Card, CardHeader, CardTitle, CardDescription, CardFooter, Badge
- FinancialMetricsCard 함수 완전 재작성 (260-375라인)
- 13개 지표 모두 shadcn Card 컴포넌트로 변환

### Step 2: TechnicalChartCard.tsx 재작성
1. 각 지표 섹션을 Card로 감싸기
2. CardHeader + CardContent 구조 적용
3. 기존 bg-card/50 등 스타일 제거

### Step 3: TickerListSidebar.tsx 재작성
1. AppSidebar 구조 참고
2. Sidebar 컴포넌트로 변환
3. 티커 목록을 SidebarMenu로 구성

### Step 4: 검증 ✅ 완료
- [x] 빌드 성공 (TypeScript + Vite)
- [x] 각 카드가 독립적으로 표시 (13개 재무지표 Card)
- [x] hover 효과 작동 (shadcn Card 기본 스타일)
- [x] 반응형 레이아웃 작동 (grid-cols-1 @xl/main:grid-cols-2 @5xl/main:grid-cols-4)

**해결한 빌드 이슈**:
1. StockData 중복 import 제거
2. 사용하지 않는 import 정리 (TrendDown, DollarSign, TrendingUp)
3. getStatusText 파라미터 수정 (metricType 제거)
4. StockNews.tsx, TechnicalChartCard.tsx의 사용하지 않는 Card import 제거
5. index.css 수정 (tw-animate-css, border-border 제거)

---

## 📚 참고 파일

- `@/components/section-cards.tsx` - 카드 그리드 예시
- `@/components/chart-area-interactive.tsx` - 차트 카드 예시
- `@/components/app-sidebar.tsx` - 사이드바 예시
- `@/components/ui/card.tsx` - Card 컴포넌트
- `@/components/ui/sidebar.tsx` - Sidebar 컴포넌트
- `@/components/ui/badge.tsx` - Badge 컴포넌트

---

**최종 목표**: 모든 UI를 shadcn 컴포넌트 조합으로만 구현
