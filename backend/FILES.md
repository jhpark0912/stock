# Backend 파일 목록

## 📂 디렉토리 구조

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                    # ⭐ FastAPI 앱 진입점
│   ├── config.py                  # ⭐ 환경 변수 설정
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── health.py          # 헬스 체크 엔드포인트
│   │       └── stock.py           # ⭐ 주식 API 엔드포인트
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── stock_service.py       # ⭐ 주식 데이터 조회 로직
│   │   └── mock_data.py           # Mock 데이터 (4개 티커)
│   │
│   └── models/
│       ├── __init__.py
│       └── stock.py               # ⭐ Pydantic 데이터 모델
│
├── requirements.txt               # ⭐ Python 의존성
├── .env.example                   # 환경 변수 템플릿
├── README.md                      # Backend 사용 가이드
└── FILES.md                       # 이 문서
```

---

## 📄 주요 파일 설명

### ⭐ `app/main.py` - FastAPI 앱 진입점

**역할**:
- FastAPI 앱 생성
- CORS 미들웨어 설정
- 라우터 등록
- 서버 실행

**중요 부분**:
```python
app = FastAPI(title="Stock Analysis API")
app.add_middleware(CORSMiddleware, ...)
app.include_router(stock.router, prefix="/api", tags=["Stock"])
```

---

### ⭐ `app/config.py` - 환경 변수 설정

**역할**:
- `.env` 파일 로드
- 설정 값 관리 (API 키, CORS, Mock 모드 등)

**중요 설정**:
```python
self.gemini_api_key = os.getenv("GEMINI_API_KEY", "")
self.use_mock_data = os.getenv("USE_MOCK_DATA", "false").lower() == "true"
```

---

### ⭐ `app/api/routes/stock.py` - 주식 API 엔드포인트

**역할**:
- `GET /api/stock/{ticker}` 엔드포인트 정의
- 요청 처리 및 응답 반환

**엔드포인트**:
```python
@router.get("/stock/{ticker}", response_model=StockResponse)
async def get_stock(ticker: str) -> StockResponse:
    stock_data = StockService.get_stock_data(ticker)
    return StockResponse(success=True, data=stock_data)
```

---

### ⭐ `app/services/stock_service.py` - 주식 데이터 조회 로직

**역할**:
- yfinance API 호출
- 캐싱 (5분 TTL)
- User-Agent 설정
- Mock 데이터 분기

**주요 기능**:
- `get_stock_data(ticker)`: 주식 데이터 조회
- `_get_session()`: User-Agent 설정된 requests.Session
- `_translate_text(text)`: 영어 → 한국어 번역

**핵심 로직**:
```python
# Mock 데이터 모드 체크
if settings.use_mock_data:
    return get_mock_stock_data(ticker_upper)

# 캐시 확인
if ticker_upper in cls._cache:
    cached_data, cached_time = cls._cache[ticker_upper]
    if datetime.now() - cached_time < cls._cache_ttl:
        return cached_data

# yfinance API 호출
ticker = yf.Ticker(ticker_upper, session=cls._get_session())
info = ticker.info
```

---

### ⭐ `app/services/mock_data.py` - Mock 데이터

**역할**:
- 4개 티커(AAPL, TSLA, GOOGL, MSFT)의 Mock 데이터 제공
- 429 에러 회피용

**사용 티커**:
```python
MOCK_STOCKS = {
    "AAPL": {...},
    "TSLA": {...},
    "GOOGL": {...},
    "MSFT": {...}
}
```

---

### ⭐ `app/models/stock.py` - Pydantic 데이터 모델

**역할**:
- API 요청/응답 데이터 구조 정의
- 자동 검증

**주요 모델**:
```python
class PriceInfo(BaseModel):
    current: Optional[float]
    open: Optional[float]
    high: Optional[float]
    low: Optional[float]
    volume: Optional[int]

class FinancialsInfo(BaseModel):
    trailing_pe: Optional[float]
    forward_pe: Optional[float]
    pbr: Optional[float]
    roe: Optional[float]
    # ... 총 15개 지표

class CompanyInfo(BaseModel):
    name: Optional[str]
    sector: Optional[str]
    industry: Optional[str]
    summary_translated: Optional[str]

class StockData(BaseModel):
    ticker: str
    timestamp: datetime
    market_cap: Optional[float]
    price: PriceInfo
    financials: FinancialsInfo
    company: CompanyInfo

class StockResponse(BaseModel):
    success: bool
    data: Optional[StockData]
    error: Optional[str]
```

---

### ⭐ `requirements.txt` - Python 의존성

**최소 의존성** (컴파일러 불필요):
```txt
fastapi==0.109.0
uvicorn==0.27.0
yfinance==0.2.36
requests==2.31.0
deep-translator==1.11.4
python-dotenv==1.0.0
python-multipart==0.0.6
```

---

## 🔧 설정 파일

### `.env.example` → `.env` (복사 필요)

```env
GEMINI_API_KEY=your_api_key_here
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
HOST=0.0.0.0
PORT=8000
USE_MOCK_DATA=true   # 429 에러 발생 시 true
```

---

## 📊 데이터 흐름

```
사용자 요청
    ↓
GET /api/stock/AAPL
    ↓
stock.py (routes)
    ↓
stock_service.py
    ↓
Mock 모드? → YES → mock_data.py → 즉시 반환
    ↓ NO
캐시 확인? → HIT → 캐시 반환
    ↓ MISS
yfinance API 호출 (User-Agent 설정)
    ↓
번역 (deep-translator)
    ↓
캐시 저장 (5분 TTL)
    ↓
StockData 객체 생성
    ↓
StockResponse 반환
```

---

## 🎯 수정 시 참고사항

### 새로운 재무 지표 추가

1. `models/stock.py` → `FinancialsInfo`에 필드 추가
2. `services/stock_service.py` → `financials` 부분에 `info.get()` 추가
3. `services/mock_data.py` → Mock 데이터에 추가

### 새로운 엔드포인트 추가

1. `api/routes/` 에 새 파일 생성 (예: `portfolio.py`)
2. `main.py`에서 라우터 등록
3. 필요시 `services/`에 비즈니스 로직 추가

### Mock 티커 추가

`services/mock_data.py`의 `MOCK_STOCKS` 딕셔너리에 추가

---

**작성**: 2026-01-28
**용도**: Backend 코드 이해 및 수정 가이드
