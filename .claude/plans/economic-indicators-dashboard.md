# 경제 지표 대시보드 구현 계획

> 생성일: 2026-02-06
> 최종 업데이트: 2026-02-06
> 상태: ✅ Phase 3 완료 (Chart 뷰 리디자인 + 이슈 해결)

---

## 📊 진행 상황

### ✅ Phase 1: 기본 구현 (완료)

| 항목 | 상태 | 비고 |
|------|------|------|
| 백엔드 모델 (economic.py) | ✅ 완료 | Pydantic 모델 |
| Yahoo 서비스 (economic_service.py) | ✅ 완료 | 금리, VIX, 원자재 |
| FRED 서비스 (fred_service.py) | ✅ 완료 | CPI, M2 |
| API 라우터 (economic.py) | ✅ 완료 | GET /api/economic |
| TypeScript 타입 | ✅ 완료 | economic.ts |
| IndicatorCard 컴포넌트 | ✅ 완료 | 카드 UI |
| MiniSparkline 컴포넌트 | ✅ 완료 | 30일 스파크라인 |
| EconomicIndicators 컴포넌트 | ✅ 완료 | 메인 대시보드 |
| Dashboard 통합 | ✅ 완료 | 주식 미선택 시 표시 |
| MainTabs에 Economic 탭 추가 | ✅ 완료 | 언제든 접근 가능 |
| 병렬 API 호출 | ✅ 완료 | 7-14초 → 1-2초 개선 |

### 🔧 Phase 1 추가 개선 (완료)
- **병렬 조회**: ThreadPoolExecutor로 Yahoo 5개 + FRED 2개 동시 호출
- **캐싱**: 현재값 5분, 히스토리 1시간, FRED 24시간 TTL

---

## ✅ Phase 2: 지표별 상태 표시 (완료)

### 목표
각 지표의 수치를 기반으로 시장 상태를 직관적으로 표시

### 상태 분류 체계

#### 금리/경제 지표용
| 상태 | 색상 | 의미 |
|------|------|------|
| 🟢 좋음 | green | 시장에 우호적 |
| 🟡 주의 | yellow | 관찰 필요 |
| 🔴 위험 | red | 경고 신호 |

#### VIX/공포 지표용
| 상태 | 색상 | 의미 |
|------|------|------|
| 🟢 안정 | green | 시장 안정 |
| 🟡 불안 | yellow | 변동성 증가 |
| 🔴 공포 | red | 극단적 공포 |

### 지표별 판단 기준 (사용자 제공 예정)

```typescript
// 예시 구조
interface IndicatorThreshold {
  symbol: string;
  thresholds: {
    good: { min?: number; max?: number };    // 좋음/안정
    caution: { min?: number; max?: number }; // 주의/불안
    danger: { min?: number; max?: number };  // 위험/공포
  };
  statusType: 'economic' | 'fear';  // 좋음/주의/위험 vs 안정/불안/공포
}
```

### ✅ 확정된 판단 기준

| 지표 | 🟢 좋음/안정 | 🟡 주의/불안 | 🔴 위험/공포 |
|------|-------------|-------------|-------------|
| VIX | < 20 | 20 - 30 | > 30 |
| 10년물 금리 (^TNX) | < 3.5% | 3.5% - 4.5% | > 4.5% |
| 기준금리 (^IRX) | < 3.0% | 3.0% - 5.0% | > 5.0% |
| CPI YoY | 1.5% - 2.5% | 2.5% - 4.0% | > 4.0% 또는 < 0% |
| M2 YoY | 4% - 8% | 1% - 4% | < 0% (유동성 수축) |
| WTI 원유 | $60 - $80 | $80 - $95 | > $95 또는 < $40 |
| 금 | - | - | 측정 안 함 |

### ✅ 구현 완료

#### 백엔드 수정
1. `backend/app/models/economic.py`
   - `status` 필드 추가 (good/caution/danger)
   - `status_label` 필드 추가 (한글 라벨)

2. `backend/app/services/indicator_status.py` (신규)
   - 지표별 임계값 설정
   - 상태 판단 로직

3. `economic_service.py`, `fred_service.py`
   - 상태 계산 호출 추가

#### 프론트엔드 수정
1. `frontend/src/types/economic.ts`
   - status, status_label 타입 추가

2. `frontend/src/components/IndicatorCard.tsx`
   - 상태 배지 표시
   - 상태별 색상 적용

### UI 목업

```
┌─────────────────────────────────────────┐
│ 🏛️ 미국채 10년물                        │
│ "무위험 수익의 기준"                    │
│                                         │
│ 4.25%              [🟡 주의]           │
│ ▲ +0.05 (+1.19%)                       │
│ ~~~~~~~~ (스파크라인)                   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ 📈 VIX (변동성 지수)                    │
│ "시장의 공포 온도계"                    │
│                                         │
│ 15.32              [🟢 안정]           │
│ ▼ -0.85 (-5.25%)                       │
│ ~~~~~~~~ (스파크라인)                   │
└─────────────────────────────────────────┘
```

### ✅ 완료된 단계

1. ✅ 사용자로부터 지표별 판단 기준 수집
2. ✅ 백엔드에 상태 판단 로직 구현 (`indicator_status.py`)
3. ✅ 프론트엔드 UI 업데이트 (상태 배지 추가)
4. ✅ 상태 배지 호버 시 판단 기준 툴팁 표시
5. ⏳ Chart 뷰 테스트 예정

### 생성/수정된 파일 (Phase 2)

**백엔드:**
- `backend/app/services/indicator_status.py` (신규) - 상태 판단 로직 + 기준 텍스트
- `backend/app/models/economic.py` - status, status_label, status_criteria 필드 추가
- `backend/app/services/economic_service.py` - 상태 계산 통합
- `backend/app/services/fred_service.py` - 상태 계산 통합

**프론트엔드:**
- `frontend/src/types/economic.ts` - IndicatorStatus 타입 + status_criteria 추가
- `frontend/src/components/IndicatorCard.tsx` - 상태 배지 + 툴팁 UI

---

## ✅ Phase 3: Chart 뷰 리디자인 (완료)

### 배경 및 문제점
- 기존 Simple/Chart 토글: 같은 카드 내에서 80px 미니 차트만 추가
- **가시성 부족**: 차트가 너무 작아 추세 파악 어려움
- **정보 밀도 낮음**: 추가 분석 정보 없음
- **MiniSparkline CSS 버그 수정**: `--success` → `--color-success` (완료)

### 설계 결정
- **방식**: 🅱️ 전체 페이지 전환 (Simple ↔ Chart 완전히 다른 레이아웃)
- **추가 기능**: 관련 지표 비교, 판단 기준 상세

### Chart 뷰 레이아웃

```
┌─────────────────────────────────────────────────────────────────────────┐
│ 📊 시장 경제 지표         [◀ Simple] [Chart ●]         [🔄 새로고침]   │
├──────────────┬──────────────────────────────────────────────────────────┤
│              │ 🏛️ 미국채 10년물 (^TNX)                                  │
│  지표 목록    │ ─────────────────────────────────────────────────────── │
│              │ 4.21%   ▲ +0.05 (+1.19%)          🟡 주의               │
│ ┌──────────┐ │                                                         │
│ │🏛️ 10년물 │◀│ ┌─────────────────────────────────────────────────────┐ │
│ │  4.21%   │ │ │                                                     │ │
│ │  🟡 주의  │ │ │              메인 차트 (200px+)                      │ │
│ └──────────┘ │ │         /\           /\                             │ │
│              │ │       /    \       /    \                           │ │
│ ┌──────────┐ │ │     /        \   /        \_____                    │ │
│ │🏛️ 기준금리│ │ │   /           \_/                                   │ │
│ │  5.15%   │ │ │ /                                                   │ │
│ └──────────┘ │ │                                    [1W] [1M●] [3M]  │ │
│              │ └─────────────────────────────────────────────────────┘ │
│ ┌──────────┐ │                                                         │
│ │📈 VIX    │ │ ┌─────────────────────┬─────────────────────────────┐  │
│ │  21.77   │ │ │ 📋 판단 기준        │ 📊 관련 지표 비교            │  │
│ │  🟡 불안  │ │ │                     │                             │  │
│ └──────────┘ │ │ 🟢 좋음: < 3.5%     │ ── 10년물 (4.21%)           │  │
│              │ │ 🟡 주의: 3.5% - 4.5% │ -- 기준금리 (5.15%)         │  │
│ ───────────  │ │ 🔴 위험: > 4.5%     │ ·· VIX (21.77)              │  │
│ 🛢️ 원자재    │ │                     │                             │  │
│ ┌──────────┐ │ │ 현재: 4.21%         │ [비교 지표 선택 ▼]          │  │
│ │🛢️ WTI    │ │ │ ████████░░ (주의)   │                             │  │
│ │  $72.50  │ │ └─────────────────────┴─────────────────────────────┘  │
│ │  🟢 좋음  │ │                                                         │
│ └──────────┘ │ 📝 "무위험 수익의 기준" - 금리 상승 시 주식/채권 가격     │
│              │    하락 압력. 현재 주의 구간으로 시장 변동성 증가 가능.    │
└──────────────┴──────────────────────────────────────────────────────────┘
```

### 주요 기능

| 기능 | 설명 |
|------|------|
| **좌측 지표 목록** | 카테고리별 그룹핑, 클릭 시 우측 상세 변경 |
| **메인 차트** | 높이 200px+, 기간 선택 (1W/1M/3M), Tooltip |
| **판단 기준 상세** | 좋음/주의/위험 기준값 + 현재 위치 게이지 |
| **관련 지표 비교** | 같은 차트에 다른 지표 오버레이 가능 |

### 생성할 파일 (Phase 3)

```
frontend/src/components/economic/
├── EconomicChartView.tsx      # Chart 뷰 메인 레이아웃
├── IndicatorListPanel.tsx     # 좌측 지표 목록
├── DetailChart.tsx            # 큰 메인 차트 (기간 선택)
├── StatusGauge.tsx            # 판단 기준 게이지
└── CompareSelector.tsx        # 비교 지표 선택
```

### 수정할 파일

```
frontend/src/components/EconomicIndicators.tsx  # viewMode에 따라 레이아웃 전환
frontend/src/components/MiniSparkline.tsx       # CSS 변수 버그 수정 (완료)
```

### 구현 순서

| 단계 | 작업 | 상태 |
|------|------|------|
| 1 | MiniSparkline CSS 버그 수정 | ✅ 완료 |
| 2 | EconomicChartView.tsx 생성 | ✅ 완료 |
| 3 | IndicatorListPanel.tsx 생성 | ✅ 완료 |
| 4 | DetailChart.tsx 생성 | ✅ 완료 |
| 5 | StatusGauge.tsx 생성 | ✅ 완료 |
| 6 | CompareSelector.tsx 생성 | ✅ 완료 |
| 7 | EconomicIndicators.tsx 수정 (레이아웃 전환) | ✅ 완료 |
| 8 | 테스트 및 마무리 | ✅ 완료 |

### 🐛 발견된 이슈

#### Issue #1: CPI/M2 차트가 Chart 뷰에서 표시되지 않음

**현상**:
- CPI, M2 지표의 Chart 뷰에서 차트가 표시되지 않음
- Yahoo 지표(금리, VIX, 원자재)는 정상 작동

**백엔드 확인**:
- ✅ FRED API 키 설정됨
- ✅ CPI 히스토리: 22개 데이터 포인트 반환
- ✅ M2 히스토리: 23개 데이터 포인트 반환
- ✅ 심볼: `CPIAUCSL`, `M2SL`

**원인 분석 결과**:
- ✅ StatusGauge.tsx: CPI/M2 임계값(THRESHOLDS) 미정의 → **해결**
- ✅ DetailChart.tsx: FRED 심볼 처리 정상
- ✅ IndicatorListPanel.tsx: FRED 심볼 아이콘 매핑 정상

**수정 완료**:
1. ✅ `StatusGauge.tsx`에 CPI, M2 임계값 추가
   - CPIAUCSL: 좋음 1.5-2.5% | 주의 2.5-4.0% | 위험 >4.0%
   - M2SL: 좋음 4-8% | 주의 1-4% | 위험 <0%

#### Issue #2: 데이터베이스 스키마 불일치

**현상**:
- `sqlalchemy.exc.OperationalError: no such column: portfolio.user_id`

**원인**:
- SQLAlchemy 모델에는 `user_id` 컬럼이 정의되어 있으나, 실제 DB 테이블에는 없음

**해결 방법**:
1. ✅ 기존 포트폴리오 데이터 백업 (1개)
2. ✅ users 테이블 생성 (admin, jhp 계정 존재)
3. ✅ portfolio 테이블 재생성 (새 스키마)
4. ✅ 데이터 복원 (user_id=1, admin 계정으로 할당)
5. ✅ FOREIGN KEY, 인덱스, UNIQUE 제약 추가

**마이그레이션 결과**:
- ✅ portfolio 테이블: `user_id` 컬럼 추가
- ✅ 기존 데이터 보존: QLD (71.29, 49주)

#### Issue #3: FRED API 데이터 미표시

**현상**:
- CPI, M2 데이터가 `null`로 반환됨
- API 키는 설정되어 있음

**원인**:
- `fredapi` 패키지가 설치되지 않음
- `fredapi_installed: false`

**해결 방법**:
1. ✅ `pip install fredapi` (0.5.2)
2. ✅ 백엔드 서버 재시작
3. ✅ API 상태 확인: `fredapi_installed: true`
4. ✅ CPI/M2 데이터 정상 반환 확인

---

## 🔜 향후 확장 가능성

- AI 기반 시장 전망 코멘트
- 지표 임계값 알림 기능
- 추가 지표: 실업률, GDP, 주택가격지수 등
- 지표 간 상관관계 분석

---

## 개요

Dashboard.tsx를 확장하여 주식 검색 전 기본 경제/원자재 지표를 표시하는 기능 추가

## 요구 지표 (총 7개)

### 경제 지표 (5개)
| 지표 | 비유 | 데이터 소스 | 심볼/시리즈 |
|------|------|------------|------------|
| 기준 금리 (Fed Rate) | 자산 가격의 중력 | yahooquery | ^IRX (3개월 T-Bill) |
| 소비자 물가 (CPI) | 연준의 브레이크 페달 | FRED API | CPIAUCSL |
| 미국채 10년물 | 무위험 수익의 기준 | yahooquery | ^TNX |
| M2 통화량 | 바닷물의 양 | FRED API | M2SL |
| VIX (변동성) | 시장의 공포 온도계 | yahooquery | ^VIX |

### 원자재 지표 (2개)
| 지표 | 비유 | 데이터 소스 | 심볼 |
|------|------|------------|------|
| 원유 (WTI) | 물가의 주범 | yahooquery | CL=F |
| 금 (Gold) | 공포 지수 | yahooquery | GC=F |

## 뷰 모드 (탭 전환)

### 기본 뷰 (Simple)
- 현재값 + 일간 변동률
- 초보자용 비유 문구
- 빠른 로딩

### 상세 뷰 (Chart)
- 현재값 + 변동률 + **미니 스파크라인 (30일)**
- 추세 시각화
- 추가 API 호출 필요

```
┌─────────────────────────────────────────┐
│ 시장 경제 지표    [Simple] [Chart]     │
│                    ^^^^^^^ 활성 탭      │
└─────────────────────────────────────────┘
```

## 표시 조건

- **주식 미선택 시**: 경제 지표 화면 표시
- **주식 선택 시**: 기존 MainTabs로 전환
- **경제 지표 탭**: MainTabs에 추가하여 언제든 접근 가능

## 파일 구조

### 새로 생성 (8개)

```
backend/app/models/economic.py           # Pydantic 모델
backend/app/services/economic_service.py # yahooquery 서비스
backend/app/services/fred_service.py     # FRED API 서비스
backend/app/api/routes/economic.py       # API 라우터
frontend/src/types/economic.ts           # TypeScript 타입
frontend/src/components/EconomicIndicators.tsx  # 메인 컴포넌트
frontend/src/components/IndicatorCard.tsx       # 지표 카드
frontend/src/components/MiniSparkline.tsx       # 미니 차트 컴포넌트
```

### 수정 (3개)

```
backend/app/main.py                      # 라우터 등록
backend/app/config.py                    # FRED API 키 설정
frontend/src/components/Dashboard.tsx    # 컴포넌트 통합 + 탭 전환 로직
```

## 백엔드 설계

### API 엔드포인트

```
GET /api/economic                    # 현재값만 (기본 뷰)
GET /api/economic?include_history=true  # 현재값 + 30일 히스토리 (상세 뷰)
```

### 환경 변수 추가 (.env)
```
FRED_API_KEY=your_fred_api_key_here
```

### 응답 구조

**기본 뷰 응답**:
```json
{
  "success": true,
  "data": {
    "rates": {
      "treasury_10y": {
        "symbol": "^TNX",
        "name": "미국채 10년물",
        "value": 4.25,
        "change": 0.05,
        "change_percent": 1.19,
        "metaphor": "무위험 수익의 기준",
        "description": "...",
        "impact": "..."
      }
    },
    "macro": {
      "cpi": { "value": 314.5, "yoy_change": 3.2, ... },
      "m2": { "value": 20850, "yoy_change": 2.1, ... }
    },
    "commodities": {
      "wti_oil": { ... },
      "gold": { ... }
    },
    "last_updated": "2024-01-15T10:30:00Z"
  }
}
```

**상세 뷰 응답 (include_history=true)**:
```json
{
  "success": true,
  "data": {
    "rates": {
      "treasury_10y": {
        "symbol": "^TNX",
        "name": "미국채 10년물",
        "value": 4.25,
        "change": 0.05,
        "change_percent": 1.19,
        "metaphor": "...",
        "history": [
          { "date": "2024-01-01", "value": 4.10 },
          { "date": "2024-01-02", "value": 4.12 },
          ...
        ]
      }
    },
    ...
  }
}
```

### 캐싱 전략
| 데이터 | TTL | 이유 |
|--------|-----|------|
| 현재값 (yahooquery) | 5분 | Rate Limit 고려 |
| 히스토리 (yahooquery) | 1시간 | 과거 데이터는 변하지 않음 |
| FRED (CPI, M2) | 24시간 | 월/주 단위 업데이트 |

## 프론트엔드 설계

### UI 레이아웃

**기본 뷰 (Simple)**:
```
┌─────────────────────────────────────────────────────────────┐
│ 📊 시장 경제 지표          [Simple] [Chart]  [🔄 새로고침] │
├─────────────────────────────────────────────────────────────┤
│ 💹 금리 & 변동성                                            │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│ │ 🏛 10년물    │ │ 🏛 기준금리  │ │ 📈 VIX      │            │
│ │ "무위험..."  │ │ "자산가격..." │ │ "공포온도계" │            │
│ │ 4.25%       │ │ 5.15%       │ │ 15.32       │            │
│ │ ▲ +0.05     │ │ ▼ -0.02     │ │ ▼ -0.85     │            │
│ └─────────────┘ └─────────────┘ └─────────────┘            │
├─────────────────────────────────────────────────────────────┤
│ 📈 거시경제                                                 │
│ ┌───────────────────────┐ ┌───────────────────────┐        │
│ │ 📊 CPI (소비자물가)    │ │ 💵 M2 통화량          │        │
│ │ 314.5 (YoY +3.2%)    │ │ $20.85T (YoY +2.1%)  │        │
│ └───────────────────────┘ └───────────────────────┘        │
├─────────────────────────────────────────────────────────────┤
│ 🛢️ 원자재                                                   │
│ ┌───────────────────────┐ ┌───────────────────────┐        │
│ │ 🔥 WTI 원유           │ │ 💰 금                 │        │
│ │ $75.42 (+1.68%)      │ │ $2,045.30 (-0.41%)   │        │
│ └───────────────────────┘ └───────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

**상세 뷰 (Chart)**:
```
┌─────────────────────────────────────────────────────────────┐
│ 📊 시장 경제 지표          [Simple] [Chart]  [🔄 새로고침] │
│                                     ^^^^^^^ 활성            │
├─────────────────────────────────────────────────────────────┤
│ 💹 금리 & 변동성                                            │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│ │ 🏛 10년물    │ │ 🏛 기준금리  │ │ 📈 VIX      │            │
│ │ 4.25%       │ │ 5.15%       │ │ 15.32       │            │
│ │ ▲ +0.05     │ │ ▼ -0.02     │ │ ▼ -0.85     │            │
│ │ ~~~~~~~~    │ │ ~~~~~~~~    │ │ ~~~~~~~~    │  ← 스파크  │
│ └─────────────┘ └─────────────┘ └─────────────┘            │
├─────────────────────────────────────────────────────────────┤
│ ...                                                         │
└─────────────────────────────────────────────────────────────┘
```

### 컴포넌트 구조

```tsx
<EconomicIndicators>
  ├── <ViewToggle activeView={view} onChange={setView} />
  │     └── [Simple] [Chart] 버튼
  │
  ├── <IndicatorSection title="금리 & 변동성">
  │     ├── <IndicatorCard indicator={treasury_10y} showChart={view === 'chart'} />
  │     ├── <IndicatorCard indicator={treasury_3m} showChart={view === 'chart'} />
  │     └── <IndicatorCard indicator={vix} showChart={view === 'chart'} />
  │
  ├── <IndicatorSection title="거시경제">
  │     ├── <IndicatorCard indicator={cpi} showChart={view === 'chart'} />
  │     └── <IndicatorCard indicator={m2} showChart={view === 'chart'} />
  │
  └── <IndicatorSection title="원자재">
        ├── <IndicatorCard indicator={wti} showChart={view === 'chart'} />
        └── <IndicatorCard indicator={gold} showChart={view === 'chart'} />
</EconomicIndicators>
```

### MiniSparkline 컴포넌트

```tsx
// recharts 기반 미니 라인 차트
<MiniSparkline
  data={history}        // [{ date, value }, ...]
  height={40}
  color="primary"       // 상승: success, 하락: destructive
/>
```

### 반응형
- Desktop (lg+): 3열 (금리), 2열 (거시경제, 원자재)
- Tablet (md): 2열
- Mobile (sm): 1열

## 구현 순서

### 1단계: 백엔드 - 기본 API (현재값)
1. `backend/app/models/economic.py` - 모델 정의
2. `backend/app/services/economic_service.py` - yahooquery 서비스
3. `backend/app/api/routes/economic.py` - 라우터
4. `backend/app/main.py` - 라우터 등록
5. 테스트: `GET /api/economic` 확인

### 2단계: 백엔드 - FRED API 통합
1. FRED API 키 발급
2. `backend/app/config.py` - 환경변수 추가
3. `backend/app/services/fred_service.py` - FRED 서비스
4. `economic_service.py` 통합
5. 테스트: CPI, M2 데이터 확인

### 3단계: 백엔드 - 히스토리 API
1. `economic_service.py`에 `get_history()` 메서드 추가
2. `include_history` 쿼리 파라미터 처리
3. 캐싱 로직 추가
4. 테스트: `GET /api/economic?include_history=true` 확인

### 4단계: 프론트엔드 - 기본 뷰
1. `frontend/src/types/economic.ts` - 타입 정의
2. `frontend/src/components/IndicatorCard.tsx` - 카드 컴포넌트
3. `frontend/src/components/EconomicIndicators.tsx` - 메인 컴포넌트
4. `frontend/src/components/Dashboard.tsx` - 통합

### 5단계: 프론트엔드 - 상세 뷰 (스파크라인)
1. `frontend/src/components/MiniSparkline.tsx` - 차트 컴포넌트
2. `IndicatorCard.tsx` - showChart prop 처리
3. `EconomicIndicators.tsx` - 뷰 토글 로직
4. 테스트: 뷰 전환 동작 확인

### 6단계: 테스트 및 마무리
1. 주식 미선택 → 경제 지표 표시 확인
2. 주식 선택 → 기존 화면 전환 확인
3. Simple ↔ Chart 뷰 전환 확인
4. 반응형 레이아웃 확인

## 검증 방법

1. **백엔드 API 테스트**
   ```bash
   # 기본 뷰
   curl http://localhost:8000/api/economic

   # 상세 뷰 (히스토리 포함)
   curl "http://localhost:8000/api/economic?include_history=true"
   ```

2. **프론트엔드 확인**
   - 앱 로드 시 경제 지표 표시 (Simple 뷰)
   - [Chart] 탭 클릭 시 스파크라인 표시
   - 사이드바에서 주식 선택 시 화면 전환
   - 새로고침 버튼 동작

## FRED API 키 발급 안내

1. https://fred.stlouisfed.org/ 접속
2. 계정 생성 (무료)
3. My Account → API Keys → Request API Key
4. `.env` 파일에 `FRED_API_KEY=발급받은키` 추가

## 의존성 추가

### 백엔드 (requirements.txt)
```
fredapi>=0.5.1  # FRED API 클라이언트
```

### 프론트엔드
- recharts (이미 설치됨) - MiniSparkline용

## 확장 가능성

- AI 기반 시장 전망 코멘트
- 지표 임계값 알림 기능
- 추가 지표: 실업률, GDP, 주택가격지수 등
- 지표 간 상관관계 분석

---

## 📋 최종 요약 (2026-02-06)

### 완료된 작업

#### Phase 1: 기본 구현 ✅
- 백엔드: Yahoo (금리, VIX, 원자재) + FRED (CPI, M2) API 통합
- 프론트엔드: EconomicIndicators 컴포넌트, IndicatorCard, MiniSparkline
- 병렬 조회로 성능 개선 (7-14초 → 1-2초)

#### Phase 2: 지표별 상태 표시 ✅
- 상태 판단 로직: indicator_status.py
- 임계값 기반 상태 분류 (좋음/주의/위험, 안정/불안/공포)
- 프론트엔드: 상태 배지 + 툴팁 표시

#### Phase 3: Chart 뷰 리디자인 ✅
- **새로운 컴포넌트**:
  - `EconomicChartView.tsx` - Chart 뷰 메인 레이아웃
  - `IndicatorListPanel.tsx` - 좌측 지표 목록
  - `DetailChart.tsx` - 메인 차트 (200px+, 기간 선택)
  - `StatusGauge.tsx` - 판단 기준 게이지
  - `CompareSelector.tsx` - 비교 지표 선택
- **수정된 컴포넌트**:
  - `EconomicIndicators.tsx` - Simple/Chart 뷰 전환
  - `MiniSparkline.tsx` - CSS 변수 버그 수정

#### 데이터베이스 마이그레이션 ✅
- `portfolio` 테이블에 `user_id` 컬럼 추가
- FOREIGN KEY, 인덱스, UNIQUE 제약 추가
- 기존 데이터 보존 (1개 포트폴리오)

#### 이슈 해결 ✅
1. **CPI/M2 차트 미표시**: StatusGauge.tsx에 임계값 추가
2. **DB 스키마 불일치**: portfolio 테이블 마이그레이션
3. **FRED API 데이터 null**: fredapi 패키지 설치 (0.5.2)

### 최종 파일 목록

**생성된 파일**:
```
frontend/src/components/economic/
├── EconomicChartView.tsx
├── IndicatorListPanel.tsx
├── DetailChart.tsx
├── StatusGauge.tsx
└── CompareSelector.tsx

backend/app/services/
└── indicator_status.py
```

**수정된 파일**:
```
frontend/src/components/
├── EconomicIndicators.tsx
├── IndicatorCard.tsx
└── MiniSparkline.tsx

frontend/src/types/
└── economic.ts

backend/app/models/
└── economic.py

backend/app/services/
├── economic_service.py
└── fred_service.py

backend/app/database/
└── models.py (portfolio 테이블 스키마)
```

### 주요 기능

1. **Simple 뷰**
   - 카드 형식으로 7개 지표 표시
   - 현재값, 변동률, 상태 배지
   - 미니 스파크라인 (30일)

2. **Chart 뷰**
   - 좌측: 카테고리별 지표 목록
   - 우측: 큰 메인 차트 (200px+)
   - 기간 선택 (1W/1M/3M)
   - 판단 기준 게이지 (임계값 시각화)
   - 비교 지표 선택 (멀티 차트)

3. **지표 상태 판단**
   - VIX: 안정(<20) | 불안(20-30) | 공포(>30)
   - 10년물 금리: 좋음(<3.5%) | 주의(3.5-4.5%) | 위험(>4.5%)
   - CPI: 좋음(1.5-2.5%) | 주의(2.5-4.0%) | 위험(>4.0%)
   - M2: 좋음(4-8%) | 주의(1-4%) | 위험(<0%)

### 기술 스택

**Frontend**:
- React 19 + TypeScript 5
- Recharts 2.15 (차트)
- Tailwind CSS 4.1 (스타일)

**Backend**:
- FastAPI 0.109
- yahooquery 2.4.1 (Yahoo Finance)
- fredapi 0.5.2 (FRED API)
- SQLAlchemy 2.0+ (ORM)

### 다음 단계 (선택)

- [ ] 모바일 반응형 최적화
- [ ] 차트 데이터 다운로드 기능
- [ ] 지표 알림 설정
- [ ] 추가 거시경제 지표 (실업률, GDP 등)
