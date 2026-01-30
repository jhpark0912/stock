# 주식 웹 애플리케이션 기능 확장 구현 계획

> **작성일**: 2026-01-30  
> **상태**: 계획 단계  
> **예상 기간**: 3-5일

## 📋 요구사항 요약

사용자가 요청한 3가지 핵심 기능:

1. **티커 목록 관리**: 사용자가 여러 티커를 추가하고, 클릭하여 조회
2. **구매가 관리**: 각 티커별 구매가 입력 및 현재가 대비 수익률 표시
3. **정보 표시 토글**: 각 섹션(카드)을 접거나 펼칠 수 있는 기능

## 🎯 구현 전략

**선택**: localStorage 기반 구현 (백엔드 변경 없음)
- 빠른 개발 및 배포 가능
- 사용자별 격리된 데이터 저장
- 향후 백엔드 DB로 확장 가능한 구조

## 📁 주요 변경 파일

### 신규 파일 (7개)

#### 1. `frontend/src/types/user.ts`
사용자 데이터 타입 정의
```typescript
export interface UserTicker {
  symbol: string;
  purchasePrice: number | null;
  purchaseDate?: string;
  addedAt: string;
}

export interface SectionVisibility {
  companyInfo: boolean;
  financialMetrics: boolean;
  aiAnalysis: boolean;
  technicalIndicators: boolean;
  news: boolean;
  charts: boolean;
}

export interface UserSettings {
  tickers: UserTicker[];
  sectionVisibility: SectionVisibility;
  selectedTicker: string | null;
}

export interface ProfitInfo {
  purchasePrice: number;
  currentPrice: number;
  profitAmount: number;
  profitPercent: number;
  isProfit: boolean;
}
```

#### 2. `frontend/src/utils/storage.ts`
localStorage 저장/로드 유틸리티
```typescript
const STORAGE_KEY = 'stock_app_user_settings';

export const loadSettings = (): UserSettings;
export const saveSettings = (settings: UserSettings): void;
```

#### 3. `frontend/src/utils/profit.ts`
수익률 계산 유틸리티
```typescript
export const calculateProfit = (
  purchasePrice: number,
  currentPrice: number
): ProfitInfo;
```

#### 4. `frontend/src/components/TickerListSidebar.tsx`
티커 목록 사이드바 (핵심 UI)
- 티커 추가 입력 필드
- 티커 목록 표시 (스크롤 가능)
- 티커 클릭 시 조회
- 티커 삭제 버튼
- 각 티커별 간단한 수익률 표시

#### 5. `frontend/src/components/PurchasePriceInput.tsx`
구매가 입력 컴포넌트
- PriceCard 내부에 통합
- 입력 시 localStorage 자동 저장

#### 6. `frontend/src/components/ProfitDisplay.tsx`
수익률 표시 컴포넌트
- 구매가 vs 현재가 비교
- 수익 금액 및 수익률 표시 (금액, %)
- 수익/손실 색상 변경 (녹색/빨간색)

#### 7. `frontend/src/components/CollapsibleSection.tsx`
섹션 토글 래퍼 컴포넌트
- 헤더 클릭 시 접기/펼치기
- 애니메이션 효과
- localStorage 상태 저장

### 수정 파일 (3개)

#### 8. `frontend/src/App.tsx`
상태 관리 로직 추가
- `userSettings` 상태 추가
- 티커 관리 함수: `addTicker`, `removeTicker`, `selectTicker`
- 구매가 관리 함수: `updatePurchasePrice`
- 섹션 토글 함수: `toggleSection`
- localStorage 동기화 (useEffect)

#### 9. `frontend/src/components/StockDashboard.tsx`
레이아웃 변경
- Sidebar + Main 레이아웃으로 변경
- TickerListSidebar 추가
- 각 섹션을 CollapsibleSection으로 감싸기
- Props 확장 (userSettings, 관리 함수들)

#### 10. `frontend/src/components/StockInfo.tsx`
PriceCard 수정
- PurchasePriceInput 통합
- ProfitDisplay 통합
- 구매가 입력 시 수익률 표시

## 🔄 구현 단계

### Phase 1: 기본 구조 (2-3시간)
**우선순위: 높음**

**작업 내용:**
1. 타입 정의 생성
   - `frontend/src/types/user.ts` 작성

2. 유틸리티 함수 작성
   - `frontend/src/utils/storage.ts` (localStorage)
   - `frontend/src/utils/profit.ts` (수익률 계산)

3. 테스트
   - 브라우저 콘솔에서 localStorage 동작 확인

**완료 조건:**
- [ ] UserSettings 타입이 정의됨
- [ ] loadSettings/saveSettings 함수가 동작함
- [ ] calculateProfit 함수가 정확한 수익률을 계산함

### Phase 2: 티커 목록 관리 (4-5시간)
**우선순위: 높음**

**작업 내용:**
1. `TickerListSidebar.tsx` 컴포넌트 작성
   - 티커 추가 입력 UI
   - 티커 목록 표시
   - 클릭/삭제 이벤트 처리

2. `App.tsx` 상태 관리 추가
   - `userSettings` 상태
   - 티커 관리 함수 구현
   - localStorage 동기화

3. `StockDashboard.tsx` 레이아웃 변경
   - Sidebar + Main 구조
   - Props 전달

**완료 조건:**
- [ ] 티커를 추가할 수 있음
- [ ] 티커를 클릭하면 해당 주식 정보가 조회됨
- [ ] 티커를 삭제할 수 있음
- [ ] 새로고침 후에도 티커 목록이 유지됨

**테스트 시나리오:**
1. AAPL 티커 추가 → 목록에 표시됨
2. AAPL 클릭 → 주식 정보 조회됨
3. TSLA 추가 → 목록에 2개 표시됨
4. 새로고침 → 2개 티커 유지됨
5. AAPL 삭제 → TSLA만 남음

### Phase 3: 구매가 및 수익률 (3-4시간)
**우선순위: 중간**

**작업 내용:**
1. `PurchasePriceInput.tsx` 작성
   - 입력 필드 UI
   - 저장 로직

2. `ProfitDisplay.tsx` 작성
   - 수익률 계산 및 표시
   - 색상 변경

3. `StockInfo.tsx` 수정
   - PurchasePriceInput 통합
   - ProfitDisplay 통합

4. `TickerListSidebar` 수정
   - 각 티커별 수익률 간략 표시

**완료 조건:**
- [ ] 구매가를 입력할 수 있음
- [ ] 구매가 입력 시 수익률이 자동 계산됨
- [ ] 수익은 녹색, 손실은 빨간색으로 표시됨
- [ ] 사이드바에서 각 티커의 수익률을 한눈에 확인할 수 있음

**테스트 시나리오:**
1. AAPL 조회 → 현재가 $185.64
2. 구매가 $180 입력
3. 수익률 표시: +$5.64 (+3.13%) (녹색)
4. 구매가 $190 입력
5. 수익률 표시: -$4.36 (-2.30%) (빨간색)
6. 사이드바에서 +3.13% 또는 -2.30% 표시

### Phase 4: 섹션 토글 (3-4시간)
**우선순위: 중간**

**작업 내용:**
1. `CollapsibleSection.tsx` 작성
   - 접기/펼치기 UI
   - 애니메이션 (CSS transition)

2. `StockDashboard.tsx` 수정
   - 각 섹션을 CollapsibleSection으로 감싸기

3. `App.tsx` 수정
   - `toggleSection` 함수 구현

**완료 조건:**
- [ ] 각 섹션 헤더를 클릭하면 접히거나 펼쳐짐
- [ ] 애니메이션이 부드럽게 동작함
- [ ] 새로고침 후에도 접힌/펼쳐진 상태가 유지됨
- [ ] 모든 섹션을 독립적으로 토글할 수 있음

**테스트 시나리오:**
1. "AI 분석" 섹션 클릭 → 접힘
2. "차트" 섹션 클릭 → 접힘
3. 새로고침 → AI 분석, 차트가 여전히 접혀있음
4. "AI 분석" 클릭 → 다시 펼쳐짐

### Phase 5: UI/UX 개선 (2-3시간)
**우선순위: 낮음**

**작업 내용:**
1. 반응형 디자인 조정
   - 모바일에서 사이드바 토글
   - 작은 화면 레이아웃

2. 애니메이션 추가
   - 티커 추가/삭제 fade in/out
   - 섹션 토글 smooth collapse

3. 에러 처리
   - 중복 티커 방지
   - 잘못된 티커 입력 알림
   - localStorage 용량 초과 처리

4. 성능 최적화
   - React.memo 적용
   - useMemo/useCallback 활용

**완료 조건:**
- [ ] 모바일에서 정상 동작
- [ ] 에러 메시지가 명확함
- [ ] 100개 티커 추가 시에도 부드럽게 동작

## 🎨 UI/UX 설계

### 전체 레이아웃
```
┌─────────────────────────────────────────────────────────┐
│ Header (검색창 - 고정)                                   │
├──────────┬──────────────────────────────────────────────┤
│          │                                              │
│ Sidebar  │  Main Content                                │
│ (200px)  │                                              │
│          │  [▼] 회사 정보 + 현재가                      │
│ [+입력]  │   - 구매가 입력 필드                         │
│ ───────  │   - 수익률: +$5.20 (+5.2%) ← 녹색           │
│          │                                              │
│ ✓ AAPL   │  [▼] 재무 지표                              │
│  +5.2%   │                                              │
│          │  [▼] AI 분석                                │
│  TSLA    │                                              │
│  -2.1%   │  [▼] 기술적 지표 + 뉴스                     │
│          │                                              │
│  GOOGL   │  [▼] 차트                                   │
│   --     │                                              │
│          │                                              │
└──────────┴──────────────────────────────────────────────┘
```

### 색상 가이드
- **수익**: `text-green-600`, `bg-green-50`
- **손실**: `text-red-600`, `bg-red-50`
- **선택된 티커**: `bg-blue-100`, `border-blue-500`
- **접힌 섹션**: 헤더만 표시, `bg-gray-50`

### 인터랙션
- **티커 클릭**: 해당 주식 정보 조회, 선택 표시
- **[×] 버튼**: 티커 삭제, 확인 없이 즉시 삭제
- **[▼] 헤더**: 섹션 접기/펼치기, 아이콘 회전
- **구매가 입력**: 포커스 아웃 시 자동 저장

## ⚠️ 주요 고려사항

### 1. 데이터 영구성
- **현재**: localStorage (5-10MB 제한)
- **향후**: 백엔드 DB 전환 가능 (사용자 인증 필요)
- **제약**: 브라우저별 격리, 캐시 삭제 시 손실

### 2. 에러 처리
- 중복 티커 추가 방지
  ```typescript
  if (userSettings.tickers.some(t => t.symbol === symbol)) {
    alert('이미 추가된 종목입니다.');
    return;
  }
  ```
- 잘못된 티커 입력 시 에러 메시지
  ```typescript
  if (!stockData) {
    alert(`'${ticker}' 종목을 찾을 수 없습니다.`);
  }
  ```
- localStorage 용량 초과 처리
  ```typescript
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      alert('저장 공간이 부족합니다. 일부 데이터를 삭제해주세요.');
    }
  }
  ```

### 3. 성능 최적화
- React.memo로 불필요한 리렌더링 방지
  ```typescript
  const TickerItem = React.memo(({ ticker, onSelect, onRemove }) => {
    // 티커 아이템 렌더링
  });
  ```
- useMemo/useCallback 활용
  ```typescript
  const profitInfo = useMemo(() => {
    if (!purchasePrice || !currentPrice) return null;
    return calculateProfit(purchasePrice, currentPrice);
  }, [purchasePrice, currentPrice]);
  ```
- 티커 100개 이상 시 virtual scrolling 고려
  - react-window 라이브러리 사용

### 4. 접근성
- 키보드 네비게이션 지원 (Tab, Enter, Escape)
- ARIA 레이블 추가
  ```tsx
  <button aria-label="티커 삭제" onClick={onRemove}>
    <X className="w-4 h-4" />
  </button>
  ```
- 색상 대비 WCAG AA 준수 (최소 4.5:1)
- 포커스 표시 명확히
  ```css
  :focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }
  ```

## ✅ 검증 계획

### 단위 테스트
```typescript
// profit.test.ts
describe('calculateProfit', () => {
  test('수익 계산', () => {
    const result = calculateProfit(100, 110);
    expect(result.profitAmount).toBe(10);
    expect(result.profitPercent).toBe(10);
    expect(result.isProfit).toBe(true);
  });
  
  test('손실 계산', () => {
    const result = calculateProfit(100, 90);
    expect(result.profitAmount).toBe(-10);
    expect(result.profitPercent).toBe(-10);
    expect(result.isProfit).toBe(false);
  });
});

// storage.test.ts
describe('localStorage', () => {
  test('설정 저장 및 로드', () => {
    const settings: UserSettings = {
      tickers: [{ symbol: 'AAPL', purchasePrice: 180, addedAt: '2026-01-30' }],
      sectionVisibility: { /* ... */ },
      selectedTicker: 'AAPL',
    };
    saveSettings(settings);
    const loaded = loadSettings();
    expect(loaded).toEqual(settings);
  });
});
```

### 통합 테스트
**시나리오 1: 티커 추가 → 조회 → 구매가 입력 → 수익률 표시**
1. AAPL 검색 및 티커 추가
2. 티커 클릭하여 정보 조회
3. 구매가 $180 입력
4. 수익률 +$5.64 (+3.13%) 표시 확인

**시나리오 2: 섹션 토글 → 새로고침 → 상태 유지**
1. "AI 분석" 섹션 접기
2. "차트" 섹션 접기
3. 브라우저 새로고침
4. AI 분석, 차트가 여전히 접혀있음 확인

**시나리오 3: 여러 티커 관리**
1. AAPL, TSLA, GOOGL, MSFT, AMZN 추가
2. 각 티커에 구매가 입력 (다른 값)
3. 사이드바에서 수익률 확인
4. 각 티커 클릭하여 상세 정보 확인
5. TSLA 삭제
6. 4개 티커만 남음 확인

### 사용자 시나리오

#### 신규 사용자
```
1. 앱 접속 → 빈 사이드바 표시
2. "AAPL" 검색 → 주식 정보 표시
3. 사이드바에서 "AAPL" 추가 클릭 → 목록에 추가됨
4. 구매가 $180 입력
5. 수익률 +$5.64 (+3.13%) 확인
6. "AI 분석" 섹션 접기
7. 브라우저 종료 후 재접속 → 모든 설정 유지
```

#### 기존 사용자
```
1. 앱 접속 → 저장된 티커 목록 (AAPL, TSLA) 표시
2. TSLA 클릭 → TSLA 정보 조회
3. GOOGL 추가
4. GOOGL 구매가 입력
5. 사이드바에서 3개 티커의 수익률 한눈에 확인
```

#### 복수 티커 관리
```
1. 5개 티커 추가 (AAPL, TSLA, GOOGL, MSFT, AMZN)
2. 각 티커별 구매가 입력
3. 사이드바에서 수익률 비교
   - AAPL: +5.2% (녹색)
   - TSLA: -2.1% (빨간색)
   - GOOGL: +1.8% (녹색)
   - MSFT: -0.5% (빨간색)
   - AMZN: +3.4% (녹색)
4. 손실 종목(TSLA, MSFT) 클릭하여 상세 분석
5. 필요 없는 섹션(뉴스, 차트) 접기
```

## 📊 예상 결과

### 구현 완료 후 사용자 경험
1. **편의성**: 여러 종목을 한 곳에서 관리
2. **가시성**: 수익률을 한눈에 확인
3. **효율성**: 불필요한 정보는 숨겨서 집중
4. **지속성**: 브라우저 새로고침해도 데이터 유지

### 기술적 성과
- 백엔드 변경 없이 기능 확장
- localStorage 활용한 클라이언트 사이드 데이터 관리
- 재사용 가능한 컴포넌트 구조 (CollapsibleSection)
- 향후 백엔드 DB 전환 시 API 레이어만 변경하면 됨

### 성능 지표
- 초기 로드: < 2초
- 티커 추가: < 100ms
- 섹션 토글: < 300ms (애니메이션 포함)
- localStorage 저장: < 50ms

## 🚀 배포 전 체크리스트

### 기능 테스트
- [ ] 모든 Phase 완료
- [ ] 티커 추가/삭제/선택 동작
- [ ] 구매가 입력 및 수익률 계산
- [ ] 섹션 접기/펼치기
- [ ] localStorage 동작 (저장/로드/삭제)
- [ ] 새로고침 후 데이터 유지

### 브라우저 호환성
- [ ] Chrome (최신)
- [ ] Firefox (최신)
- [ ] Safari (최신)
- [ ] Edge (최신)

### 반응형 테스트
- [ ] Desktop (1920×1080)
- [ ] Laptop (1366×768)
- [ ] Tablet (768×1024)
- [ ] Mobile (375×667)

### 에러 처리
- [ ] 중복 티커 추가 방지
- [ ] 잘못된 티커 입력 알림
- [ ] localStorage 용량 초과 처리
- [ ] API 호출 실패 처리

### 성능
- [ ] 100개 티커 추가 시 부드러운 동작
- [ ] 메모리 누수 없음
- [ ] 리렌더링 최소화

### 문서
- [ ] README.md 업데이트
- [ ] CLAUDE.md 업데이트
- [ ] JSDoc 주석 추가
- [ ] 스크린샷 추가

### 빌드
- [ ] `npm run build` 성공
- [ ] 빌드 파일 크기 확인 (< 1MB)
- [ ] 프로덕션 환경 테스트

---

**예상 개발 기간**: 3-5일  
**우선순위**: Phase 1-2 (티커 목록 관리) → Phase 3-4 (구매가 및 섹션 토글) → Phase 5 (UI 개선)  
**다음 단계**: 사용자 승인 후 Phase 1부터 순차 구현
