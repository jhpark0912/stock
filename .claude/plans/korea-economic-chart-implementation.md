# 한국 경제 지표 차트 구현 계획

> **작성일**: 2026-02-08
> **목적**: 거시경제 한국 탭에서 경제 지표를 차트로 표시하는 기능 구현

---

## 📋 현재 상황 분석

### ✅ 이미 구현된 것
| 항목 | 파일 | 상태 |
|------|------|------|
| 국가 선택 탭 | `frontend/src/components/economic/CountryTab.tsx` | ✅ 완료 |
| 차트 컴포넌트 | `frontend/src/components/economic/DetailChart.tsx` | ✅ 완료 |
| 타입 정의 | `frontend/src/types/economic.ts` | ✅ 완료 |
| 한국 시장 사이클 | Backend + Frontend | ✅ 완료 |

### ❌ 구현 필요한 것
| 항목 | 파일 | 상태 |
|------|------|------|
| ECOS API 서비스 | `backend/app/services/korea_economic_service.py` | ❌ 미구현 |
| 한국 경제 모델 | `backend/app/models/economic.py` | ❌ 부분 구현 (history 필드 없음) |
| API 엔드포인트 | `backend/app/api/routes/economic.py` | ❌ 한국 지표 조회 미지원 |
| 차트 데이터 연동 | Frontend | ❌ 한국 데이터 조회 안 됨 |

### 🎯 핵심 문제
**DetailChart는 FRED(월간)와 Yahoo(일간) 데이터만 지원**하고, **ECOS API(한국 월간 데이터)는 미지원**

---

## 📊 한국 경제 지표 매핑

| 카테고리 | 지표 | ECOS API 코드 | 비고 |
|---------|------|---------------|------|
| 🇰🇷 금리 | 국고채 10년물 | 817Y002 / 010200000 | 월간 |
| 🇰🇷 금리 | 한국은행 기준금리 | 722Y001 / 0101000 | 월간 |
| 🇰🇷 금리 | 신용 스프레드 | 계산 (회사채-국고채) | 월간 |
| 🇰🇷 거시경제 | 소비자물가지수 | 901Y009 / 0 | 월간 |
| 🇰🇷 거시경제 | M2 통화량 | 101Y004 / BBJS00 | 월간 |
| 🇰🇷 환율 | 원/달러 환율 | KRW=X (Yahoo) | 일간 |

---

## 🏗️ 아키텍처

```
사용자: 한국 탭 클릭
    ↓
Frontend: API 호출 (/api/economic?country=kr&include_history=true)
    ↓
Backend: korea_economic_service.py → ECOS API 호출
    ↓
Backend: 히스토리 데이터 포함하여 반환
    ↓
Frontend: DetailChart에 데이터 전달
    ↓
DetailChart: ECOS 데이터 인식 → 월간 데이터로 처리
```

---

## 🚀 구현 계획

### Phase 1: Backend - ECOS API 서비스 구현

**파일**: `backend/app/services/korea_economic_service.py` (신규)

#### 1.1 ECOS API 메타데이터 정의

```python
ECOS_SERIES = {
    "KR_BOND_10Y": {
        "stat_code": "817Y002",
        "item_code": "010200000",
        "cycle": "M",
        "name": "국고채 10년물",
        "metaphor": "한국 경제의 체온계",
        "description": "한국 국채 10년물 수익률",
        "impact": "높으면 금리 부담↑, 주식 하락 압력"
    },
    "KR_BASE_RATE": {
        "stat_code": "722Y001",
        "item_code": "0101000",
        "cycle": "M",
        "name": "한국은행 기준금리",
        "metaphor": "한국 경제의 액셀과 브레이크",
        "description": "한국은행이 결정하는 기준금리",
        "impact": "높으면 대출 금리↑, 소비·투자 위축"
    },
    "KR_CPI": {
        "stat_code": "901Y009",
        "item_code": "0",
        "cycle": "M",
        "name": "소비자물가지수",
        "metaphor": "장바구니 물가",
        "description": "소비자가 구매하는 상품·서비스 가격 변화",
        "impact": "2% 목표. 높으면 금리 인상 → 주식 하락 압력"
    },
    "KR_M2": {
        "stat_code": "101Y004",
        "item_code": "BBJS00",
        "cycle": "M",
        "name": "M2 통화량",
        "metaphor": "경제의 혈액",
        "description": "통화 + 요구불예금 + 저축성예금",
        "impact": "증가하면 유동성 풍부 → 자산 가격 상승 가능"
    }
}

# Yahoo Finance 한국 지표
YAHOO_KR_SYMBOLS = {
    "KRW=X": {
        "name": "원/달러 환율",
        "metaphor": "한국 경제의 온도계",
        "description": "1달러당 원화 가치",
        "impact": "상승(원화 약세)하면 수출 유리, 수입 불리"
    }
}
```

#### 1.2 핵심 함수

```python
async def get_ecos_indicator(
    series_key: str,
    include_history: bool = False,
    history_months: int = 24
) -> Optional[EconomicIndicator]:
    """
    ECOS API에서 단일 지표 조회

    Args:
        series_key: ECOS_SERIES의 키 (예: "KR_BOND_10Y")
        include_history: 히스토리 데이터 포함 여부
        history_months: 히스토리 기간 (개월)

    Returns:
        EconomicIndicator 객체 (history 필드 포함)
    """
    # 1. 메타데이터 가져오기
    # 2. ECOS API 호출
    # 3. 최신 값 + 변화율 계산
    # 4. include_history=True면 히스토리 데이터 구성
    # 5. 상태 판단 (indicator_status.py 활용)
    pass

async def get_all_korea_indicators(
    include_history: bool = False
) -> KoreaEconomicData:
    """
    모든 한국 경제 지표 병렬 조회

    Returns:
        KoreaEconomicData 객체
    """
    # asyncio.gather로 병렬 조회
    pass

def get_credit_spread() -> Optional[EconomicIndicator]:
    """
    신용 스프레드 계산 (회사채 - 국고채)
    """
    pass
```

#### 1.3 캐싱 전략

| 데이터 유형 | 캐시 시간 | 이유 |
|-----------|----------|------|
| ECOS 최신 값 | 24시간 | 월간 데이터, 자주 변경 안 됨 |
| ECOS 히스토리 | 7일 | 과거 데이터는 변경 안 됨 |
| Yahoo 환율 | 5분 | 실시간성 중요 |

---

### Phase 2: Backend - 모델 확장

**파일**: `backend/app/models/economic.py`

#### 2.1 히스토리 필드 추가

```python
class EconomicIndicator(BaseModel):
    symbol: str
    name: str
    value: Optional[float] = None
    change: Optional[float] = None
    change_percent: Optional[float] = None
    metaphor: str
    description: str
    impact: str
    history: Optional[List[HistoryPoint]] = None  # ✅ 이미 있음
    yoy_change: Optional[float] = None
    status: Optional[str] = None
    status_label: Optional[str] = None
    status_criteria: Optional[str] = None
```

#### 2.2 한국 모델 확인

```python
class KoreaEconomicData(BaseModel):
    rates: KoreaRatesData
    macro: KoreaMacroData
    fx: KoreaFxData
    last_updated: str
```

✅ 이미 정의되어 있음 (확인 필요)

---

### Phase 3: Backend - API 엔드포인트 수정

**파일**: `backend/app/api/routes/economic.py`

#### 3.1 기존 엔드포인트 확장

```python
@router.get("/economic")
async def get_economic_indicators(
    country: str = Query(default="us", regex="^(us|kr|all)$"),
    include_history: bool = Query(default=False)
):
    """
    경제 지표 조회 (미국/한국/전체)

    Args:
        country: 국가 선택 (us, kr, all)
        include_history: 히스토리 데이터 포함 여부

    Returns:
        - country=us: EconomicResponse
        - country=kr: KoreaEconomicResponse
        - country=all: AllEconomicResponse
    """
    if country == "us":
        # 기존 미국 지표 로직
        pass
    elif country == "kr":
        data = await get_all_korea_indicators(include_history=include_history)
        return {"success": True, "data": data, "error": None}
    else:  # all
        us_data = await get_all_us_indicators(include_history)
        kr_data = await get_all_korea_indicators(include_history)
        return {
            "success": True,
            "data": {"us": us_data, "kr": kr_data},
            "error": None
        }
```

---

### Phase 4: Frontend - DetailChart 확장

**파일**: `frontend/src/components/economic/DetailChart.tsx`

#### 4.1 ECOS 데이터 인식 로직 추가

현재 코드:
```typescript
// FRED 지표(월간 데이터)와 Yahoo 지표(일간 데이터) 구분
const isFredIndicator = indicator.symbol === 'CPIAUCSL' || indicator.symbol === 'M2SL';
```

수정:
```typescript
// 데이터 유형 판별
const getDataType = (symbol: string): 'FRED' | 'ECOS' | 'YAHOO' => {
  // FRED: 미국 월간 데이터
  if (symbol === 'CPIAUCSL' || symbol === 'M2SL') return 'FRED';

  // ECOS: 한국 월간 데이터
  if (symbol.startsWith('KR_') && symbol !== 'KRW=X') return 'ECOS';

  // Yahoo: 일간 데이터 (미국 금리, 한국 환율 등)
  return 'YAHOO';
};

const dataType = getDataType(indicator.symbol);
const isMonthlyData = dataType === 'FRED' || dataType === 'ECOS';
```

#### 4.2 기간 선택 로직 조정

```typescript
// 월간 데이터(FRED, ECOS): 장기 기간
// 일간 데이터(Yahoo): 단기+중기 기간
const [period, setPeriod] = useState<Period>(isMonthlyData ? '1Y' : '1M');

// 기간 선택 버튼
{(isMonthlyData
  ? (['3M', '6M', '1Y', 'ALL'] as Period[])
  : (['1W', '1M', '3M', '6M'] as Period[])
).map((p) => ...)}
```

#### 4.3 필터링 로직 확장

```typescript
const filterByPeriod = (
  data: { date: string; value: number }[],
  period: Period,
  isMonthly: boolean
) => {
  if (!data || data.length === 0) return [];
  if (period === 'ALL') return data;

  // 월간 데이터: 데이터 포인트 개수 기준
  if (isMonthly) {
    let pointsToShow = 12; // 기본 1년 = 12개월
    switch (period) {
      case '3M': pointsToShow = 3; break;
      case '6M': pointsToShow = 6; break;
      case '1Y': pointsToShow = 12; break;
    }
    return data.slice(-pointsToShow);
  }

  // 일간 데이터: 날짜 기준 (기존 로직 유지)
  // ...
};
```

---

### Phase 5: Frontend - 지표 목록 및 UI 연동

**파일**: `frontend/src/components/economic/IndicatorListPanel.tsx`

#### 5.1 한국 지표 아이콘 추가

```typescript
const getIndicatorIcon = (symbol: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    // 미국
    '^TNX': <TrendingUp className="h-4 w-4" />,
    '^IRX': <Activity className="h-4 w-4" />,
    '^VIX': <AlertCircle className="h-4 w-4" />,
    'CPIAUCSL': <ShoppingCart className="h-4 w-4" />,
    'M2SL': <DollarSign className="h-4 w-4" />,

    // 한국
    'KR_BOND_10Y': <TrendingUp className="h-4 w-4" />,
    'KR_BASE_RATE': <Activity className="h-4 w-4" />,
    'KR_CPI': <ShoppingCart className="h-4 w-4" />,
    'KR_M2': <DollarSign className="h-4 w-4" />,
    'KRW=X': <ArrowRightLeft className="h-4 w-4" />,  // 환율
  };
  return iconMap[symbol] || <HelpCircle className="h-4 w-4" />;
};
```

#### 5.2 한국 카테고리 표시

```typescript
// country="kr"일 때 카테고리 변경
const categories = country === 'kr'
  ? ['🇰🇷 금리', '🇰🇷 거시경제', '🇰🇷 환율']
  : ['💵 금리', '📊 거시경제', '🛢️ 원자재'];
```

---

### Phase 6: Frontend - 전체 Flow 연결

**파일**: `frontend/src/components/economic/EconomicIndicators.tsx` (또는 메인 컴포넌트)

#### 6.1 국가 선택 상태 추가

```typescript
const [country, setCountry] = useState<Country>('us');

// API 호출
const fetchData = async () => {
  const response = await api.get(
    `/api/economic?country=${country}&include_history=true`
  );
  // ...
};
```

#### 6.2 조건부 렌더링

```typescript
<CountryTab selected={country} onChange={setCountry} />

{country === 'us' && <USEconomicIndicators data={usData} />}
{country === 'kr' && <KREconomicIndicators data={krData} />}
{country === 'all' && (
  <>
    <USEconomicIndicators data={allData.us} />
    <KREconomicIndicators data={allData.kr} />
  </>
)}
```

---

## 📝 구현 순서 (추천)

### 우선순위 높음 (필수)

1. **Backend Phase 1**: ECOS API 서비스 구현 (3-4시간)
   - `korea_economic_service.py` 생성
   - ECOS API 연동 및 테스트
   - 캐싱 적용

2. **Backend Phase 3**: API 엔드포인트 수정 (1시간)
   - `/api/economic?country=kr` 지원
   - 히스토리 데이터 포함

3. **Frontend Phase 4**: DetailChart 확장 (2시간)
   - ECOS 데이터 타입 인식
   - 월간 데이터 필터링 로직

4. **Frontend Phase 6**: 전체 Flow 연결 (1-2시간)
   - API 호출 및 데이터 표시
   - 국가 전환 테스트

### 우선순위 중간 (권장)

5. **Frontend Phase 5**: 지표 목록 UI (1시간)
   - 한국 지표 아이콘 추가
   - 카테고리 표시

### 우선순위 낮음 (선택)

6. **Backend Phase 2**: 모델 확장 (필요시)
   - 현재 모델로 충분하면 스킵

---

## 🧪 테스트 방법

### Backend 테스트

```bash
# 1. ECOS API 직접 테스트
curl "https://ecos.bok.or.kr/api/StatisticSearch/{API_KEY}/json/kr/1/1/817Y002/M/202401/202401/010200000"

# 2. Backend API 테스트 (최신 값만)
curl http://localhost:8000/api/economic?country=kr

# 3. Backend API 테스트 (히스토리 포함)
curl http://localhost:8000/api/economic?country=kr&include_history=true

# 4. 전체 데이터
curl http://localhost:8000/api/economic?country=all&include_history=true
```

### Frontend 테스트

1. **국가 탭 전환**
   - 🇺🇸 미국 → 🇰🇷 한국 전환 시 데이터 새로 로드되는지 확인

2. **차트 표시**
   - 한국 지표 클릭 시 DetailChart에 월간 데이터 표시 확인
   - 기간 선택 (3M, 6M, 1Y, ALL) 동작 확인

3. **비교 기능**
   - 여러 한국 지표 선택 → 차트에 동시 표시 확인

4. **데이터 품질**
   - 히스토리 데이터가 시간순으로 정렬되어 있는지
   - 값이 정상적으로 표시되는지 (NaN, Infinity 없음)

---

## ⚠️ 주의사항

### ECOS API 제약

| 항목 | 제약 |
|------|------|
| **호출 제한** | 일일 1,000건 |
| **데이터 주기** | 월간 (일간 데이터 없음) |
| **히스토리** | 최대 200개 데이터 포인트 |
| **응답 지연** | 평균 1-2초 |

→ **해결책**:
- 24시간 캐싱으로 호출 최소화
- 병렬 조회(`asyncio.gather`)로 속도 개선
- 히스토리는 최근 24개월만 조회

### 데이터 구조 차이

| 데이터 소스 | 주기 | 지표 예시 | DetailChart 처리 |
|-----------|------|----------|-----------------|
| FRED | 월간 | CPIAUCSL, M2SL | ✅ 지원 (포인트 개수 기준) |
| ECOS | 월간 | KR_CPI, KR_M2 | ✅ 추가 필요 (동일 로직) |
| Yahoo | 일간 | ^TNX, ^VIX, KRW=X | ✅ 지원 (날짜 기준) |

### 타입 안전성

```typescript
// Bad ❌
const data = response.data;  // any

// Good ✅
const data: KoreaEconomicData = response.data;
```

---

## 📂 파일 변경 요약

| 파일 | 변경 유형 | 설명 |
|------|----------|------|
| `backend/app/services/korea_economic_service.py` | **신규** | ECOS API 서비스 |
| `backend/app/api/routes/economic.py` | 수정 | country 파라미터 추가 |
| `frontend/src/components/economic/DetailChart.tsx` | 수정 | ECOS 데이터 지원 |
| `frontend/src/components/economic/IndicatorListPanel.tsx` | 수정 | 한국 지표 아이콘 |
| `frontend/src/components/economic/EconomicIndicators.tsx` | 수정 | country 상태 관리 |
| `.env.example` | 수정 | ECOS_API_KEY 추가 |

---

## 🎯 완료 기준

- [ ] Backend: `/api/economic?country=kr&include_history=true` 호출 시 24개월 히스토리 반환
- [ ] Frontend: 한국 탭 선택 시 지표 목록 표시
- [ ] Frontend: 한국 지표 클릭 시 DetailChart에 월간 차트 표시
- [ ] Frontend: 기간 선택 (3M, 6M, 1Y, ALL) 동작
- [ ] Frontend: 비교 기능 (여러 지표 동시 표시) 동작
- [ ] 테스트: 모든 한국 지표의 차트가 정상 표시
- [ ] 문서: `.claude/PROJECT_STRUCTURE.md` 업데이트

---

## 📌 다음 단계 (이 계획 완료 후)

1. **한국 시장 사이클 차트**: 수출/CPI/스프레드 시계열 차트 추가
2. **지표 비교 기능 강화**: 미국 vs 한국 동시 비교
3. **알림 기능**: 지표가 기준치 초과 시 알림
4. **모바일 최적화**: 차트 터치 제스처

---

## 🔗 참고 문서

- [기존 계획] `.claude/plans/korea-economic-indicators.md`
- [한국 시장 사이클] `.claude/plans/k-macro-market-cycle.md`
- [ECOS API 문서] https://ecos.bok.or.kr/api/
- [Recharts 문서] https://recharts.org/
