# 주식 분석 대시보드 디자인 시스템

> **목적**: Linear 앱 스타일의 깔끔하고 미니멀한 디자인 일관성 유지
> **기반**: shadcn/ui + Tailwind CSS
> **업데이트**: 2026-02-03

---

## 🎨 컬러 시스템

### Primary Color: Indigo (남색)

**선택 이유**:
- Linear 앱 스타일의 현대적이고 세련된 색상
- 금융/데이터 앱에 적합한 신뢰감
- 깔끔하고 미니멀한 디자인과 조화

**색상 값**:
```css
/* 라이트 모드 */
--color-primary: #6366f1;         /* Indigo-500 */
--color-primary-foreground: #ffffff;

/* 다크 모드 */
--color-primary: #818cf8;         /* Indigo-400 (밝게) */
--color-primary-foreground: #171717;
```

### Indigo 팔레트 (50-900)

| 단계 | HSL | HEX | 용도 |
|-----|-----|-----|------|
| 50  | 239 100% 97% | #EEF2FF | 배경 (아주 연함) |
| 100 | 239 100% 95% | #E0E7FF | 배경 (연함) |
| 200 | 239 96% 89% | #C7D2FE | 테두리 (연함) |
| 300 | 239 92% 80% | #A5B4FC | 테두리 |
| **400** | **239 84% 75%** | **#818CF8** | **다크 모드 Primary** |
| **500** | **239 84% 67%** | **#6366F1** | **Primary (기본)** |
| 600 | 239 71% 58% | #4F46E5 | Active 상태 |
| 700 | 239 64% 51% | #4338CA | 강조 |
| 800 | 239 61% 42% | #3730A3 | 매우 강조 |
| 900 | 239 65% 33% | #312E81 | 다크 모드 강조 |

### Semantic Colors (의미 기반)

| 색상 | HSL | HEX | 용도 |
|-----|-----|-----|------|
| **Success** | 142 71% 45% | #22C55E | 수익, 긍정 지표, 성공 |
| **Warning** | 38 92% 50% | #F59E0B | 주의, 중립 알림 |
| **Destructive** | 0 72% 51% | #EF4444 | 손실, 위험, 실패 |
| **Info** | 221 83% 53% | #3B82F6| 정보, 중립적 알림 |

### Neutral Colors (회색 계열)

| 색상 | 용도 |
|-----|------|
| `bg-background` | Level 0: 순수 흰색/검은색 |
| `bg-card` | Level 1: 카드 배경 (아주 연한 회색) |
| `bg-muted` | Level 2: Hover, 비활성 영역 |
| `bg-accent` | Level 3: 강조 영역 |
| `text-foreground` | 주 텍스트 (검은색/흰색) |
| `text-muted-foreground` | 보조 텍스트 (회색) |

### 색상 사용 규칙

#### DO ✅
- 재무지표 색상 코딩:
  - **긍정 지표** (ROE 높음, 영업이익률 높음): `text-success` 또는 `bg-success/10`
  - **부정 지표** (부채비율 높음, 손실): `text-warning` 또는 `text-destructive`
  - **중립**: `text-muted-foreground`

- Primary 색상 활용:
  - 버튼, 링크, 강조 요소
  - 선택된 상태 (탭, 사이드바 아이템)

#### DON'T ❌
- 하드코딩된 HEX 값 사용 금지
- 의미 없는 색상 혼용
- 과도한 색상 사용 (한 화면에 4가지 이상)

---

## 📐 스페이싱 시스템

### 기본 단위

| 클래스 | 값 | 용도 |
|-------|-----|------|
| `space-y-2` | 8px | 작은 요소 간격 |
| `space-y-4` | 16px | 기본 간격 |
| `space-y-6` | 24px | 중간 간격 |
| `space-y-8` | 32px | 섹션 간 간격 |
| `space-y-12` | 48px | 큰 섹션 간격 |

### 레이아웃 적용

```
┌─ 컨테이너 ─────────────────────────┐
│ p-6 (24px 패딩)                   │
│                                   │
│ ┌─ 카드 1 ─────────────┐          │
│ │ p-6                 │          │
│ └────────────────────┘          │
│                                   │
│ space-y-8 (32px 간격)             │
│                                   │
│ ┌─ 카드 2 ─────────────┐          │
│ │ p-6                 │          │
│ └────────────────────┘          │
└──────────────────────────────────┘
```

### 여백 원칙
- **호흡감**: 답답하지 않게 충분한 여백
- **일관성**: 같은 레벨의 요소는 같은 여백
- **계층**: 부모-자식 관계가 명확하게

---

## 🔤 타이포그래피

### 폰트 스케일

| 역할 | 클래스 | 크기 | 무게 | 용도 |
|-----|-------|-----|------|------|
| **H1** | `text-4xl font-bold` | 36px | 700 | 페이지 제목 |
| **H2** | `text-2xl font-semibold` | 24px | 600 | 섹션 제목 |
| **H3** | `text-lg font-medium` | 18px | 500 | 카드 제목, 서브 섹션 |
| **Body** | `text-base` | 16px | 400 | 본문 텍스트 |
| **Caption** | `text-sm text-muted-foreground` | 14px | 400 | 보조 설명 |
| **Number (강조)** | `text-3xl font-bold` | 30px | 700 | 주가, 주요 수치 |
| **Label** | `text-sm font-medium` | 14px | 500 | 폼 레이블 |

### 타이포그래피 원칙
- **계층 명확화**: 크기와 무게로 중요도 표현
- **가독성**: 줄 간격 충분히 (leading-relaxed)
- **일관성**: 같은 역할은 같은 스타일

---

## 🎭 컴포넌트 스타일

### Card Variants

#### 1. Default (기본)
```tsx
<Card variant="default">
  // shadow-sm, 기본 카드
</Card>
```

#### 2. Elevated (강조)
```tsx
<Card variant="elevated">
  // shadow-lg, hover:shadow-xl
  // 중요한 정보 (현재가, AI 분석)
</Card>
```

#### 3. Bordered (테두리)
```tsx
<Card variant="bordered">
  // border-2 border-primary/10
  // 구분이 필요한 영역
</Card>
```

#### 4. Gradient (그래디언트)
```tsx
<Card variant="gradient">
  // bg-gradient-to-br from-primary/5 to-primary/10
  // 특별한 섹션 (AI 분석, 프로모션)
</Card>
```

### Button Styles

shadcn/ui 기본 버튼 사용, Variant 활용:
- `default`: Primary 색상 버튼
- `destructive`: 삭제, 위험한 작업
- `outline`: 보조 버튼
- `ghost`: 텍스트 버튼
- `link`: 링크 스타일

### Icon Usage

**라이브러리**: Lucide React만 사용

**크기 제한**:
- `h-4 w-4` (16px): 작은 아이콘
- `h-5 w-5` (20px): 중간 아이콘
- `h-6 w-6` (24px): 큰 아이콘

**원칙**:
- ❌ 크기가 맞지 않으면 사용 금지
- ✅ 의미 있는 곳에만 선택적 사용
- ✅ 색상: `text-muted-foreground` 기본

**예시**:
```tsx
// ✅ Good
<TrendingUp className="h-4 w-4 text-success" />

// ❌ Bad (억지로 모든 지표에 아이콘)
<div>
  <BarChart3 className="h-4 w-4" /> PER
  <PieChart className="h-4 w-4" /> PBR
  <Activity className="h-4 w-4" /> ROE
</div>
```

---

## 💫 인터랙션 & 애니메이션

### Hover 효과

#### Card Hover
```css
.card-hover {
  @apply hover:shadow-lg hover:-translate-y-1 transition-all duration-200;
}
```

#### Button Hover
```css
.btn-hover {
  @apply hover:shadow-md active:scale-95 transition-all duration-150;
}
```

#### List Item Hover
```css
.list-item-hover {
  @apply hover:bg-muted transition-colors duration-150;
}
```

### Focus 상태
```css
.focus-ring {
  @apply focus:ring-2 focus:ring-primary focus:ring-offset-2 outline-none;
}
```

### 애니메이션 원칙
- **부드럽게**: duration-200 ~ 300
- **GPU 가속**: transform, opacity만 사용
- **의미 있게**: 과도한 애니메이션 지양
- **60fps 유지**: 성능 우선

---

## 📱 반응형 디자인

### Breakpoints (Tailwind 기본)

| 크기 | 최소 너비 | 용도 |
|-----|----------|------|
| `sm` | 640px | 태블릿 (세로) |
| `md` | 768px | 태블릿 (가로) |
| `lg` | 1024px | 데스크탑 (작음) |
| `xl` | 1280px | 데스크탑 (중간) |
| `2xl` | 1536px | 데스크탑 (큼) |

### 반응형 원칙
- **Mobile First**: 기본은 작은 화면, 큰 화면으로 확장
- **사이드바**: 1024px 미만에서 자동 접힘 (선택)
- **그리드**: 4열 → 2열 → 1열로 자동 조정

---

## 🧩 레이아웃 패턴

### 탭 구조 (3-Tabs)

```
┌────────────────────────────────────────┐
│ [ 📊 개요 ] [ 🔮 AI 분석 ] [ 📈 차트 ] │
└────────────────────────────────────────┘
```

**탭 스타일**:
- 선택 안 됨: `text-muted-foreground`
- 선택됨: `text-foreground` + 하단 바 (`border-b-2 border-primary`)
- Hover: `text-foreground/80`

### 사이드바 (토글 가능)

**펼침 상태**:
```
┌────────────────┐
│ ☰ 내 카테고리   │
├────────────────┤
│ [+] 매물 추가   │
├────────────────┤
│ AAPL   +2.5%   │
│ TSLA   -1.2%   │
└────────────────┘
```

**접힌 상태**:
```
┌──┐
│☰ │
├──┤
│A │
│T │
└──┘
```

**애니메이션**:
```css
transition: width 300ms ease-in-out
```

### 재무지표 그리드

**4열 그리드** (기본):
```
┌──────┬──────┬──────┬──────┐
│ PER  │ PBR  │ ROE  │ 배당  │
│ 30.0 │ 2.5  │ 15%  │ 2.1% │
│ [바] │ [바] │ [바] │ [바] │
└──────┴──────┴──────┴──────┘
```

**각 지표 카드**:
```tsx
<MetricCard
  icon={TrendingUp}         // 선택적
  label="PER"
  value="30.0"
  status="warning"          // good | neutral | warning | bad
  color="warning"           // success | warning | destructive | primary
/>
```

---

## 🎨 색상 코딩 규칙 (재무지표)

### 밸류에이션 지표

| 지표 | 좋음 (Good) | 중립 (Neutral) | 주의 (Warning) |
|-----|------------|---------------|---------------|
| **PER** | < 15 (저평가) | 15-25 | > 25 (고평가) |
| **PBR** | < 1 (저평가) | 1-3 | > 3 (고평가) |
| **PEG** | < 1 (저평가) | 1-2 | > 2 (고평가) |

### 수익성 지표

| 지표 | 좋음 | 중립 | 나쁨 |
|-----|------|------|------|
| **ROE** | > 15% | 10-15% | < 10% |
| **영업이익률** | > 20% | 10-20% | < 10% |

### 안정성 지표

| 지표 | 좋음 | 중립 | 나쁨 |
|-----|------|------|------|
| **부채비율** | < 50% | 50-100% | > 100% |
| **유동비율** | > 200% | 100-200% | < 100% |

### 배당 지표

| 지표 | 좋음 | 중립 | 낮음 |
|-----|------|------|------|
| **배당수익률** | > 3% | 1-3% | < 1% |

**색상 적용**:
- 좋음: `text-success` / `bg-success/10`
- 중립: `text-muted-foreground` / `bg-muted`
- 주의/나쁨: `text-warning` / `text-destructive`

---

## 🚨 안티패턴 (하지 말아야 할 것)

### ❌ 색상
- 하드코딩된 HEX 값 사용
- 의미 없는 색상 남용
- Primary 색상 무시하고 임의 색상 사용

### ❌ 스페이싱
- 불규칙한 여백 (p-3, p-5 같은 비표준 값)
- 답답한 레이아웃 (공간 부족)

### ❌ 타이포그래피
- 과도한 폰트 크기 (text-5xl 이상 남용)
- 일관성 없는 무게 (같은 역할, 다른 weight)

### ❌ 아이콘
- 크기 안 맞는 아이콘 억지로 사용
- 모든 요소에 아이콘 붙이기
- 의미 없는 아이콘 선택

### ❌ 애니메이션
- 느린 애니메이션 (duration > 500ms)
- 과도한 효과 (회전, 스케일 남용)
- width/height 애니메이션 (성능 저하)

---

## ✅ 체크리스트

새 컴포넌트 작성 시 확인:

- [ ] Primary 색상이 Indigo인가?
- [ ] 하드코딩 색상 없이 CSS 변수 사용했는가?
- [ ] 스페이싱이 4의 배수인가? (4, 8, 12, 16, 24, 32...)
- [ ] 타이포그래피 계층이 명확한가?
- [ ] 아이콘 크기가 h-4/h-5/h-6 중 하나인가?
- [ ] Hover 효과가 GPU 가속 속성만 사용하는가?
- [ ] 애니메이션이 200-300ms 범위인가?
- [ ] 의미 기반 색상 코딩이 적용되었는가?

---

## 📚 참고 자료

- **Linear 앱**: https://linear.app (디자인 영감)
- **shadcn/ui**: https://ui.shadcn.com (컴포넌트 기반)
- **Tailwind CSS**: https://tailwindcss.com (유틸리티)
- **Lucide Icons**: https://lucide.dev (아이콘)

---

**문서 버전**: 2.0 (Indigo 색상 시스템)
**최종 업데이트**: 2026-02-05
**담당자**: Claude AI
**상태**: ✅ 승인됨
