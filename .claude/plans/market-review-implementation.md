# 증시 마감 리뷰 기능 구현 계획

## 📊 진행 현황 (2026-02-12 업데이트)

| Phase | 기능 | 상태 | 비고 |
|-------|------|------|------|
| **Phase 1** | Frontend 샘플 UI | ✅ 완료 | Mock 데이터 + 실제 API 연동 |
| **Phase 2** | 한국 증시 Backend | ✅ 완료 | KIS API 연동 (pykrx 제거) |
| **Phase 3** | 미국 증시 Backend | ✅ 완료 | yahooquery 사용 |
| **Phase 4** | AI 분석 | ✅ 완료 | Gemini API |

### 주요 변경사항

1. **pykrx → KIS API 전환** (Python 3.13 호환성 문제)
   - 급등/급락 Top 5: `FHPST01700000` (등락률 순위)
   - 시총 Top 5: `FHPST01740000` (시가총액 순위)

2. **KIS API 인증**
   - 사용자별 DB에 저장된 KIS 자격 증명 사용
   - `get_current_user_optional()` - 선택적 인증 추가
   - KIS 키 없으면 급등/급락, 시총 데이터 빈 배열 반환

3. **API 엔드포인트**
   - `GET /api/economic/market-review/kr` - 한국 증시 마감 리뷰
   - `GET /api/economic/market-review/us` - 미국 증시 마감 리뷰
   - `POST /api/economic/market-review/{country}/ai` - AI 분석 (로그인 필요)

### 테스트 체크리스트

- [x] KOSPI/KOSDAQ 지수 표시
- [x] 섹터 등락률 표시 (4x2 히트맵)
- [ ] 급등/급락 Top 5 (KIS 키 필요)
- [ ] 시총 Top 5 (KIS 키 필요)
- [ ] AI 분석 버튼 동작 (Gemini 키 필요)
- [ ] 미국 데이터 표시

---

## 개요

Economic 탭에 "증시 마감 리뷰" 기능 추가
- **한국 증시 마감 리뷰** (오후 3:30 KST 기준) - 우선 구현
- **미국 증시 리뷰** (마감시간 기준) - 후속 구현
- AI 분석: 선택적 (버튼 클릭 시)
- 수급 데이터(외국인/기관): 제외 (추후 확장 가능)

---

## 샘플 UI 레이아웃

### 한국 증시 마감 리뷰 (Desktop)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📊 경제 지표  |  🗺️ 섹터 히트맵  |  📈 마감 리뷰 (active)                   │
│  ───────────────────────────────────────────────────────────────────────── │
│  [ 🇺🇸 미국 ]  [ 🇰🇷 한국 (active) ]                                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  📈 2026년 2월 12일 (수) 한국 증시 마감 리뷰                                  │
│  ───────────────────────────────────────────────────────────────────────── │
│  마감 시간: 15:30 KST  |  🟢 장 마감  |  🔄 새로고침 (비활성화)               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  📊 주요 지수                                                                │
│  ┌──────────────────────────────┐  ┌──────────────────────────────┐        │
│  │  🇰🇷 KOSPI                    │  │  🇰🇷 KOSDAQ                   │        │
│  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━  │  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━  │        │
│  │  2,650.32                    │  │  850.25                      │        │
│  │  ▲ +32.15 (+1.23%)           │  │  ▼ -5.80 (-0.68%)            │        │
│  │  ═══════════════ (미니차트)  │  │  ═══════════════ (미니차트)  │        │
│  └──────────────────────────────┘  └──────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────┐  ┌────────────────────────────────┐
│  🚀 급등주 TOP 5               │  │  📉 급락주 TOP 5               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │  │  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  #  종목명        현재가  등락률│  │  #  종목명        현재가  등락률│
│  ─────────────────────────────│  │  ─────────────────────────────│
│  1  OO전자       52,300  +29.9%│  │  1  XX제약       12,450  -15.2%│
│  2  OO바이오     18,500  +25.3%│  │  2  XX건설        8,900  -12.8%│
│  3  OO소재       34,200  +22.1%│  │  3  XX금융       22,100  -10.5%│
│  4  OO반도체     87,400  +18.7%│  │  4  XX화학       45,600   -8.9%│
│  5  OO에너지     15,800  +15.4%│  │  5  XX통신       31,200   -7.2%│
└────────────────────────────────┘  └────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  📊 섹터별 등락률                                                            │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ ████ 반도체 +2.5% │ ███ 헬스케어 +1.8% │ ██ 금융 +0.9% │ █ IT +0.3% │   │
│  │ 자동차 -0.5% │ 건설 -1.2% │ 에너지 -1.8% │ 운송 -2.1% │               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│  🏆 주요 종목 (시가총액 TOP 5)                                               │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│  ┌────────────────────────────────┐  ┌────────────────────────────────┐   │
│  │  📊 KOSPI TOP 5                │  │  📊 KOSDAQ TOP 5               │   │
│  │  ─────────────────────────────│  │  ─────────────────────────────│   │
│  │  1  삼성전자    72,500  +1.2% │  │  1  에코프로비엠 258,000  -2.1%│   │
│  │  2  SK하이닉스  142,000  +2.8%│  │  2  셀트리온헬스  68,500  +0.5%│   │
│  │  3  LG에너지    405,000  -0.5%│  │  3  엘앤에프     108,500  +1.8%│   │
│  │  4  삼성바이오  820,000  +0.8%│  │  4  HLB          52,300  -1.2% │   │
│  │  5  현대차      198,500  +1.5%│  │  5  알테오젠     86,200  +3.2% │   │
│  └────────────────────────────────┘  └────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  🤖 AI 오늘의 포인트                                                         │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  [ 🤖 AI 분석 생성 ]  ← 클릭 시 Gemini 호출                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  (AI 분석 결과 - 버튼 클릭 후 표시)                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ **오늘의 포인트**                                                    │   │
│  │ 반도체 섹터 강세 속에 KOSPI가 1% 이상 상승 마감했습니다.               │   │
│  │ 외국인 자금 유입이 지속되며 대형주 중심의 상승세가 나타났습니다.        │   │
│  │                                                                      │   │
│  │ **섹터 인사이트**                                                    │   │
│  │ 반도체/헬스케어 강세, 건설/운송 약세. AI 관련 종목 관심 지속.          │   │
│  │                                                                      │   │
│  │ **내일 전망**                                                        │   │
│  │ 미국 증시 영향과 원/달러 환율 흐름 주시 필요.                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 미국 증시 리뷰 (동일한 레이아웃)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📈 2026년 2월 11일 (화) 미국 증시 마감 리뷰                                  │
│  마감 시간: 16:00 EST (한국시간 06:00)  |  🟢 장 마감                        │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
│  🇺🇸 S&P 500          │ │  🇺🇸 NASDAQ           │ │  🇺🇸 DOW              │
│  5,125.42            │ │  16,245.80           │ │  38,654.20           │
│  ▲ +0.85%            │ │  ▲ +1.23%            │ │  ▲ +0.45%            │
└──────────────────────┘ └──────────────────────┘ └──────────────────────┘

(급등/급락/섹터/AI 분석 - 한국과 동일한 구조)
```

---

## 캐싱 전략 (핵심)

### 원칙: 마감 후 데이터는 다음 거래일까지 캐시 유지

```python
# 캐싱 로직 설계

1. **캐시 키 설계**
   - 한국: `market_review:kr:{YYYY-MM-DD}`
   - 미국: `market_review:us:{YYYY-MM-DD}`

2. **캐시 만료 정책**
   - 장 마감 전: 5분 TTL (실시간 갱신)
   - 장 마감 후: 다음 거래일 장 시작까지 유지 (무기한)

3. **마감 시간 판단**
   - 한국: 15:30 KST 이후 = 마감
   - 미국: 16:00 EST 이후 = 마감

4. **구현 방식**
   ```python
   def get_cache_ttl(country: str) -> int:
       if is_market_closed(country):
           # 마감 후: 다음 거래일 09:00까지 (최대 18시간)
           return calculate_seconds_until_next_open(country)
       else:
           # 장중: 5분
           return 300
   ```

5. **Frontend 캐싱**
   - React Query 또는 useState + sessionStorage
   - 페이지 전환 시 재호출 방지
   - 같은 날짜 데이터는 한 번만 호출
```

### 캐시 흐름도

```
[사용자 요청]
     │
     ▼
[캐시 확인] ─── 캐시 HIT ──→ [캐시된 데이터 반환]
     │
     │ 캐시 MISS
     ▼
[외부 API 호출]
     │
     ▼
[마감 여부 확인]
     │
     ├─ 마감 전 ──→ TTL: 5분
     │
     └─ 마감 후 ──→ TTL: 다음 거래일까지
     │
     ▼
[캐시 저장 후 반환]
```

---

## Phase 1: 샘플 UI 작업 (Mock 데이터)

> **목적**: 실제 API 연동 전에 UI 레이아웃과 컴포넌트를 먼저 구현하여 확인

### 1.1 Frontend 컴포넌트 생성

**새 파일들: `frontend/src/components/economic/MarketReview/`**

| 파일 | 역할 |
|------|------|
| `index.ts` | 배럴 파일 (export) |
| `MarketReviewSection.tsx` | 메인 컨테이너 (한국/미국 탭 전환) |
| `IndexSummary.tsx` | 지수 마감 카드 (KOSPI/KOSDAQ 또는 S&P/Nasdaq/Dow) |
| `TopMoversCard.tsx` | 급등/급락 종목 테이블 |
| `MajorStocksCard.tsx` | 주요 종목 (시총 TOP 5) 카드 |
| `SectorSummary.tsx` | 섹터 등락 요약 바 차트 |
| `AIInsightCard.tsx` | AI 분석 카드 (버튼 클릭 시 로딩) |

### 1.2 Mock 데이터 정의

**새 파일: `frontend/src/mocks/marketReviewMock.ts`**

```typescript
// 샘플 데이터로 UI 테스트
export const mockKrMarketReview: MarketReviewData = {
  country: 'kr',
  date: '2026-02-12',
  market_close_time: '15:30 KST',
  is_market_closed: true,
  indices: [
    { symbol: '^KS11', name: 'KOSPI', close: 2650.32, change: 32.15, change_percent: 1.23 },
    { symbol: '^KQ11', name: 'KOSDAQ', close: 850.25, change: -5.80, change_percent: -0.68 },
  ],
  top_gainers: [...], // 5개 샘플
  top_losers: [...],  // 5개 샘플
  major_stocks_kospi: [...], // 시총 Top 5
  major_stocks_kosdaq: [...], // 시총 Top 5
  sector_performance: [...], // 섹터 데이터
  ai_analysis: null, // 버튼 클릭 시 생성
};
```

### 1.3 타입 정의

**새 파일: `frontend/src/types/marketReview.ts`**

```typescript
export interface MarketReviewData {
  country: string;
  date: string;
  market_close_time: string;
  is_market_closed: boolean;
  indices: IndexData[];
  top_gainers: StockMoverData[];
  top_losers: StockMoverData[];
  major_stocks_kospi?: MajorStockData[];
  major_stocks_kosdaq?: MajorStockData[];
  major_stocks?: MajorStockData[];  // 미국
  sector_performance: SectorData[];
  ai_analysis?: MarketReviewAI;
}

export interface IndexData { ... }
export interface StockMoverData { ... }
export interface MajorStockData { ... }
export interface MarketReviewAI { ... }
```

### 1.4 Economic 탭에 통합

**수정 파일: `frontend/src/components/EconomicIndicators.tsx`**

- 탭 추가: `경제 지표` | `섹터 히트맵` | `마감 리뷰`
- `activeTab === 'review'` 일 때 `MarketReviewSection` 렌더링

### 1.5 검증

```bash
# 개발 서버 시작
cd frontend && npm run dev

# 브라우저에서 확인
# - Economic 탭 → "마감 리뷰" 탭 클릭
# - Mock 데이터로 UI 확인
# - 한국/미국 탭 전환 확인
```

---

## Phase 2: 한국 증시 마감 리뷰 (Backend)

### 2.1 Backend - 데이터 서비스

**새 파일: `backend/app/services/market_review_service.py`**

```python
# 구현할 기능:
# - get_kr_market_review(): 한국 증시 마감 데이터 통합 조회
# - get_kr_indices(): KOSPI, KOSDAQ 지수 (yahooquery: ^KS11, ^KQ11)
# - get_kr_top_movers(): 급등/급락 종목 Top 5 (pykrx 사용)
# - get_kr_major_stocks(): 시가총액 Top 5 (KOSPI/KOSDAQ 각각)
# - get_kr_sector_performance(): 섹터 ETF 등락률 (기존 서비스 재사용)
```

**의존성 추가: `requirements.txt`**
```
pykrx>=1.0.35
```

### 2.2 Backend - Pydantic 모델

**수정 파일: `backend/app/models/economic.py`**

```python
class MarketReviewData(BaseModel):
    country: str  # "kr" | "us"
    date: str  # YYYY-MM-DD
    market_close_time: str  # "15:30 KST"
    is_market_closed: bool

    indices: List[IndexData]
    top_gainers: List[StockMoverData]  # 급등주 Top 5
    top_losers: List[StockMoverData]   # 급락주 Top 5
    sector_performance: List[SectorData]

    # 주요 종목 (시가총액 Top 5)
    major_stocks_kospi: Optional[List[MajorStockData]] = None  # 한국만
    major_stocks_kosdaq: Optional[List[MajorStockData]] = None  # 한국만
    major_stocks: Optional[List[MajorStockData]] = None  # 미국 (S&P 500 기준)

    ai_analysis: Optional[MarketReviewAI] = None

class MajorStockData(BaseModel):
    rank: int  # 시가총액 순위
    symbol: str
    name: str
    price: float
    change_percent: float
    market_cap: float  # 시가총액

class IndexData(BaseModel):
    symbol: str
    name: str
    close: float
    change: float
    change_percent: float

class StockMoverData(BaseModel):
    rank: int
    symbol: str
    name: str
    price: float
    change_percent: float
    volume: Optional[int] = None
```

### 2.3 Backend - API 엔드포인트

**수정 파일: `backend/app/api/routes/economic.py`**

```python
@router.get("/market-review/{country}")
async def get_market_review(
    country: str,  # "kr" | "us"
    include_ai: bool = False,
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """증시 마감 리뷰 조회"""
```

---

## Phase 3: 미국 증시 리뷰

### 3.1 Backend 확장

**의존성 추가: `requirements.txt`**
```
yahoo-fin>=0.8.9
```

**market_review_service.py 확장:**
- `get_us_market_review()`: 미국 증시 마감 데이터
- `get_us_indices()`: S&P 500, Nasdaq, Dow (yahooquery: ^GSPC, ^IXIC, ^DJI)
- `get_us_top_movers()`: Day Gainers/Losers (yahoo_fin)
- `get_us_major_stocks()`: 시가총액 Top 5 (S&P 500 기준)

### 3.2 Frontend 확장

- 동일한 컴포넌트 재사용 (국가별 분기)
- 미국 마감시간: 16:00 EST (한국시간 익일 06:00)

---

## Phase 4: AI 분석 (선택적)

### 4.1 프롬프트 설계

**market_review_service.py에 추가:**

```python
async def generate_market_review_ai(data: MarketReviewData, user_api_key: str):
    """
    프롬프트 구조:
    - 시스템: 20년 경력 증권사 리서치센터장
    - 입력: 지수, 급등/급락, 섹터 데이터
    - 출력: 오늘의 포인트, 섹터 인사이트, 내일 전망 (300자 내외)
    """
```

### 4.2 Frontend AI 버튼

- "AI 분석 생성" 버튼 클릭 시 API 호출
- 로딩 상태 표시
- 마크다운 렌더링 (ReactMarkdown)

---

## 수정할 파일 목록

### Backend
| 파일 | 작업 |
|------|------|
| `backend/app/services/market_review_service.py` | **신규** - 마감 리뷰 서비스 |
| `backend/app/models/economic.py` | 수정 - Pydantic 모델 추가 |
| `backend/app/api/routes/economic.py` | 수정 - 엔드포인트 추가 |
| `backend/requirements.txt` | 수정 - pykrx, yahoo-fin 추가 |

### Frontend
| 파일 | 작업 |
|------|------|
| `frontend/src/types/marketReview.ts` | **신규** - TypeScript 타입 |
| `frontend/src/components/economic/MarketReview/` | **신규** - 컴포넌트 폴더 |
| `frontend/src/components/EconomicIndicators.tsx` | 수정 - 탭 추가 |
| `frontend/src/types/economic.ts` | 수정 - 탭 타입 확장 |

---

## 검증 방법

### Backend 테스트
```bash
# 1. 의존성 설치
pip install pykrx yahoo-fin

# 2. 서버 시작
cd backend && uvicorn app.main:app --reload

# 3. API 테스트
curl http://localhost:8000/api/economic/market-review/kr
curl http://localhost:8000/api/economic/market-review/us
curl "http://localhost:8000/api/economic/market-review/kr?include_ai=true"
```

### Frontend 테스트
```bash
# 1. 개발 서버 시작
cd frontend && npm run dev

# 2. 브라우저에서 확인
# - Economic 탭 → "마감 리뷰" 탭 클릭
# - 한국/미국 선택 시 데이터 표시
# - "AI 분석" 버튼 클릭 시 분석 생성
```

### 체크리스트
- [ ] KOSPI/KOSDAQ 지수 정상 표시
- [ ] 급등/급락 Top 5 종목 표시
- [ ] 섹터 등락률 표시
- [ ] AI 분석 버튼 동작
- [ ] 미국 데이터 표시 (Phase 2)
- [ ] 반응형 UI 확인

---

## 제약사항 및 주의사항

1. **pykrx 호출 제한**: KRX 크롤링 기반이므로 캐싱 필수 (5분 TTL)
2. **장 마감 시간**:
   - 한국: 15:30 KST, 데이터 조회는 15:40 이후 권장
   - 미국: 16:00 EST (한국시간 익일 06:00)
3. **AI API 비용**: 버튼 클릭 시에만 호출하여 비용 절감

---

## 사전 작업: CLAUDE.md 수정

> Plan Mode에서 계획 파일을 프로젝트 폴더(`.claude/plans`)에 저장하도록 설정

**수정 파일: `CLAUDE.md`**

```markdown
## 계획

- 계획 혹은 개발 페이즈를 생성할때는 `.claude/plans` 하위에 생성
- 기존 계획을 문의하면 해당 폴더를 확인한 후 대답
- **Plan Mode 시 계획 파일 저장 위치**: `{프로젝트 루트}/.claude/plans/`
```

---

## 향후 확장 가능

- 외국인/기관 수급 데이터 (pykrx 또는 KRX API)
- 일별 리뷰 히스토리 저장
- Push 알림 (마감 리뷰 자동 전송)
