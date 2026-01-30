# 차트 데이터 가져오기 가이드

> **작성일**: 2026-01-30
> **목적**: 주식 차트 데이터를 API를 통해 가져오는 방법에 대한 상세 가이드

---

## 목차

1. [개요](#개요)
2. [데이터 흐름](#데이터-흐름)
3. [API 엔드포인트](#api-엔드포인트)
4. [요청 방법](#요청-방법)
5. [응답 데이터 구조](#응답-데이터-구조)
6. [예시 코드](#예시-코드)
7. [기술적 고려사항](#기술적-고려사항)

---

## 개요

주식 차트 데이터는 두 가지 방법으로 가져올 수 있습니다:

### 방법 1: 주식 데이터와 함께 가져오기 (권장)
- **엔드포인트**: `GET /api/stock/{ticker}?include_chart=true`
- **장점**: 한 번의 API 호출로 주식 기본 정보 + 차트 데이터를 모두 조회
- **사용 사례**: 초기 페이지 로드 시 모든 데이터를 한 번에 가져와야 할 때

### 방법 2: 차트 데이터만 별도로 가져오기
- **엔드포인트**: `GET /api/stock/{ticker}/chart-data?period=1y`
- **장점**: 차트만 업데이트하거나 기간을 변경할 때 효율적
- **사용 사례**: 사용자가 차트 기간을 변경할 때 (1년 → 2년 등)

---

## 데이터 흐름

```
┌─────────────┐
│  Frontend   │  사용자가 티커 입력 (예: AAPL)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  API Route  │  GET /api/stock/{ticker}?include_chart=true
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│  Stock Service  │  get_stock_data() → include_chart=True인 경우
└────────┬────────┘  get_chart_data() 호출
         │
         ▼
┌──────────────────┐
│ Yahoo Finance    │  ticker.history(period='1y')
│ API (yahooquery) │  과거 1년간의 OHLCV 데이터 조회
└────────┬─────────┘
         │
         ▼
┌────────────────────┐
│ Technical          │  calculate_chart_data()
│ Indicators Module  │  - SMA (20, 50, 200일)
└────────┬───────────┘  - RSI (14일)
         │              - MACD
         │              - Bollinger Bands
         │              - DataFrame → dict 리스트 변환
         ▼
┌─────────────┐
│  Response   │  ChartDataPoint[] 형식으로 반환
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Frontend   │  DataCharts.tsx 컴포넌트가 차트 렌더링
└─────────────┘
```

---

## API 엔드포인트

### 1. 주식 데이터와 함께 차트 데이터 조회

```http
GET /api/stock/{ticker}?include_chart=true
```

#### 쿼리 파라미터

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `include_technical` | boolean | 아니오 | `false` | 기술적 지표 포함 여부 (최신 값만) |
| `include_chart` | boolean | 아니오 | `false` | 차트 데이터 포함 여부 (시계열 전체) |

#### 예시 요청

```bash
# 차트 데이터만
GET https://api.example.com/api/stock/AAPL?include_chart=true

# 차트 데이터 + 기술적 지표
GET https://api.example.com/api/stock/AAPL?include_technical=true&include_chart=true
```

---

### 2. 차트 데이터만 별도로 조회

```http
GET /api/stock/{ticker}/chart-data?period={period}
```

#### 쿼리 파라미터

| 파라미터 | 타입 | 필수 | 기본값 | 설명 |
|----------|------|------|--------|------|
| `period` | string | 아니오 | `"1y"` | 조회 기간 (`1y`, `2y`, `5y`, `max`) |

#### 예시 요청

```bash
# 1년 데이터 (기본값)
GET https://api.example.com/api/stock/AAPL/chart-data

# 2년 데이터
GET https://api.example.com/api/stock/AAPL/chart-data?period=2y

# 최대 기간
GET https://api.example.com/api/stock/AAPL/chart-data?period=max
```

---

## 응답 데이터 구조

### 방법 1: 주식 데이터와 함께 (include_chart=true)

```json
{
  "success": true,
  "data": {
    "ticker": "AAPL",
    "timestamp": "2026-01-30T12:00:00",
    "price": { ... },
    "financials": { ... },
    "company": { ... },
    "technical_indicators": { ... },
    "chart_data": [
      {
        "date": "2025-01-30",
        "close": 150.25,
        "volume": 75000000,
        "sma20": 148.50,
        "sma50": 145.30,
        "sma200": 140.00,
        "rsi": 55.23,
        "macd": 2.34,
        "macd_signal": 1.89,
        "macd_hist": 0.45,
        "bb_upper": 155.00,
        "bb_middle": 148.50,
        "bb_lower": 142.00
      },
      ...
    ]
  },
  "error": null
}
```

### 방법 2: 차트 데이터만

```json
{
  "success": true,
  "data": [
    {
      "date": "2025-01-30",
      "close": 150.25,
      "volume": 75000000,
      "sma20": 148.50,
      "sma50": 145.30,
      "sma200": 140.00,
      "rsi": 55.23,
      "macd": 2.34,
      "macd_signal": 1.89,
      "macd_hist": 0.45,
      "bb_upper": 155.00,
      "bb_middle": 148.50,
      "bb_lower": 142.00
    },
    ...
  ],
  "error": null
}
```

### ChartDataPoint 타입 정의 (TypeScript)

```typescript
export interface ChartDataPoint {
  date: string;                // YYYY-MM-DD 형식
  close: number | null;        // 종가
  volume: number | null;       // 거래량

  // 이동평균선
  sma20: number | null;        // 20일 단순이동평균
  sma50: number | null;        // 50일 단순이동평균
  sma200: number | null;       // 200일 단순이동평균

  // 상대강도지수
  rsi: number | null;          // 14일 RSI (0-100)

  // MACD
  macd: number | null;         // MACD 라인
  macd_signal: number | null;  // 시그널 라인
  macd_hist: number | null;    // 히스토그램

  // 볼린저밴드
  bb_upper: number | null;     // 상단 밴드
  bb_middle: number | null;    // 중간 밴드 (SMA 20)
  bb_lower: number | null;     // 하단 밴드
}
```

---

## 예시 코드

### Frontend (React/TypeScript)

#### 1. 주식 데이터와 함께 차트 데이터 가져오기

```typescript
const fetchStockDataWithChart = async (ticker: string) => {
  try {
    const response = await fetch(
      `/api/stock/${ticker}?include_technical=true&include_chart=true`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error);
    }

    // 차트 데이터 사용
    const chartData = result.data.chart_data;
    console.log(`차트 데이터 포인트 수: ${chartData.length}`);

    return result.data;
  } catch (error) {
    console.error('데이터 조회 실패:', error);
    throw error;
  }
};
```

#### 2. 차트 데이터만 별도로 가져오기

```typescript
const fetchChartData = async (ticker: string, period: string = '1y') => {
  try {
    const response = await fetch(
      `/api/stock/${ticker}/chart-data?period=${period}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error);
    }

    return result.data; // ChartDataPoint[]
  } catch (error) {
    console.error('차트 데이터 조회 실패:', error);
    throw error;
  }
};

// 사용 예시
const chartData1y = await fetchChartData('AAPL', '1y');
const chartData2y = await fetchChartData('AAPL', '2y');
```

#### 3. 기간 변경 기능 구현

```typescript
import { useState } from 'react';
import type { ChartDataPoint } from '@/types/stock';

function StockChart({ ticker }: { ticker: string }) {
  const [period, setPeriod] = useState<string>('1y');
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(false);

  const handlePeriodChange = async (newPeriod: string) => {
    setLoading(true);
    try {
      const data = await fetchChartData(ticker, newPeriod);
      setChartData(data);
      setPeriod(newPeriod);
    } catch (error) {
      console.error('차트 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="period-selector">
        {['1y', '2y', '5y', 'max'].map(p => (
          <button
            key={p}
            onClick={() => handlePeriodChange(p)}
            disabled={loading}
            className={period === p ? 'active' : ''}
          >
            {p}
          </button>
        ))}
      </div>

      {loading ? (
        <div>로딩 중...</div>
      ) : (
        <DataCharts chartData={chartData} ticker={ticker} />
      )}
    </div>
  );
}
```

### Backend (Python/FastAPI)

#### API Route (`backend/app/api/routes/stock.py`)

```python
@router.get("/stock/{ticker}/chart-data", response_model=ChartResponse)
async def get_chart_data(
    ticker: str,
    period: str = Query("1y", description="차트 데이터 기간 (예: 1y, 2y, 5y, max)")
) -> ChartResponse:
    """
    차트용 시계열 데이터 조회 (기술적 지표 포함)

    Args:
        ticker: 주식 티커 심볼
        period: 조회 기간

    Returns:
        ChartResponse: 차트 데이터 또는 에러 정보
    """
    try:
        chart_data = stock_service.get_chart_data(ticker, period)
        return ChartResponse(
            success=True,
            data=chart_data,
            error=None
        )
    except ValueError as e:
        if "429" in str(e) or "요청 제한 초과" in str(e):
            raise HTTPException(status_code=429, detail=str(e))
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        print(f"Unhandled error in get_chart_data: {e}")
        raise HTTPException(status_code=500, detail=f"서버 내부 오류: {str(e)}")
```

---

## 기술적 고려사항

### 1. 성능 최적화

#### 캐싱 (Backend)
```python
# Stock Service에서 5분 캐시 사용
self._cache_ttl = timedelta(minutes=5)
```

- 같은 티커를 5분 내에 다시 조회하면 Yahoo Finance API 호출 없이 캐시에서 반환
- API 호출 제한(429 에러) 방지

#### 데이터 양 제한 (Backend)
```python
# 최근 252개 데이터 포인트만 반환 (약 1년치 거래일)
result = chart_df.tail(252).to_dict('records')
```

- 차트 렌더링 성능 최적화
- 네트워크 전송 용량 절감

### 2. 에러 처리

#### 429 에러 (요청 제한 초과)

Yahoo Finance API는 요청 제한이 있습니다. 429 에러 발생 시:

```typescript
try {
  const data = await fetchChartData('AAPL');
} catch (error) {
  if (error.message.includes('429')) {
    // 사용자에게 재시도 안내
    alert('잠시 후 다시 시도해주세요.');
  }
}
```

**대응 방법:**
- 백엔드 캐싱 활용 (5분)
- 프론트엔드에서 불필요한 재조회 방지
- Mock 데이터 모드 활성화 (`USE_MOCK_DATA=true`)

#### 데이터 없음 (404)

잘못된 티커 또는 데이터가 없는 경우:

```typescript
if (!response.ok) {
  if (response.status === 404) {
    alert('유효하지 않은 티커이거나 데이터를 찾을 수 없습니다.');
  }
}
```

### 3. Null 값 처리

기술적 지표는 계산에 필요한 데이터가 부족하면 `null`이 될 수 있습니다:

```typescript
// 예: SMA200은 200일 데이터가 필요하므로 초기에는 null
{
  "date": "2025-01-30",
  "sma200": null  // 데이터 부족으로 계산 불가
}
```

**차트 라이브러리 대응:**
```typescript
// Recharts는 null 값을 자동으로 처리하지만, 명시적으로 필터링할 수도 있음
const validData = chartData.filter(d => d.sma200 !== null);
```

### 4. Timezone 처리

차트 데이터의 날짜는 **timezone-naive** 형식으로 반환됩니다:

```python
# technical_indicators.py에서 timezone 제거
history_df.index = pd.to_datetime(history_df.index, utc=True)
history_df.index = history_df.index.tz_localize(None)
```

- 이유: JSON 직렬화 문제 방지 및 클라이언트 측 timezone 처리 일관성
- 날짜 형식: `"YYYY-MM-DD"` (예: `"2025-01-30"`)

---

## 추가 리소스

- [차트 세부사항 문서](./chart-details.md) - 차트 컴포넌트 및 시각화 상세 설명
- [기술적 지표 가이드](./technical-indicators-guide.md) - 각 지표의 의미와 해석 방법
- [API 레퍼런스](../README.md) - 전체 API 엔드포인트 문서

---

## 요약

| 항목 | 내용 |
|------|------|
| **추천 방법** | `GET /api/stock/{ticker}?include_chart=true` |
| **조회 기간** | 기본 1년 (1y), 최대 max 지원 |
| **데이터 포인트** | 최대 252개 (약 1년치 거래일) |
| **포함 지표** | SMA, RSI, MACD, Bollinger Bands, 거래량 |
| **캐시 TTL** | 5분 |
| **주의사항** | 429 에러 가능성, null 값 처리 필요 |

---

**작성자**: Claude Code
**버전**: 1.0
**최종 수정**: 2026-01-30
