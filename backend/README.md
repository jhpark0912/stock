# Stock Analysis Backend API

FastAPI 기반 주식 분석 웹 플랫폼 Backend API

## 📁 프로젝트 구조

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI 앱 진입점
│   ├── config.py            # 환경 변수 설정
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes/
│   │       ├── __init__.py
│   │       ├── health.py    # 헬스 체크
│   │       └── stock.py     # 주식 API
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   └── stock_service.py # 주식 데이터 조회 로직
│   │
│   └── models/
│       ├── __init__.py
│       └── stock.py         # Pydantic 모델
│
├── requirements.txt         # Python 의존성
├── .env.example            # 환경 변수 템플릿
└── README.md               # 이 문서
```

## 🚀 시작하기

### 1. 환경 변수 설정

`.env.example`를 복사하여 `.env` 파일 생성:

```bash
cp .env.example .env
```

`.env` 파일 편집:

```env
GEMINI_API_KEY=your_actual_api_key_here
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
HOST=0.0.0.0
PORT=8000
```

### 2. 의존성 설치

```bash
# 가상 환경 생성 (선택)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt
```

### 3. 서버 실행

#### 방법 1: Python 직접 실행

```bash
python -m app.main
```

#### 방법 2: uvicorn 명령어

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. API 문서 확인

서버 실행 후 브라우저에서 접속:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 📡 API 엔드포인트

### 1. 헬스 체크

```http
GET /api/health
```

**응답 예시:**

```json
{
  "status": "ok",
  "timestamp": "2026-01-28T15:30:00.123456"
}
```

### 2. 주식 데이터 조회

```http
GET /api/stock/{ticker}
```

**파라미터:**

- `ticker` (string, required): 주식 티커 심볼 (예: AAPL, TSLA)

**응답 예시:**

```json
{
  "success": true,
  "data": {
    "ticker": "AAPL",
    "timestamp": "2026-01-28T15:30:00.123456",
    "market_cap": 2500000000000,
    "price": {
      "current": 150.25,
      "open": 149.50,
      "high": 151.00,
      "low": 149.00,
      "volume": 50000000
    },
    "financials": {
      "trailing_pe": 25.5,
      "forward_pe": 23.2,
      "pbr": 6.8,
      "roe": 0.45,
      "opm": 0.28,
      "peg": 1.2,
      "debt_to_equity": 1.5,
      "current_ratio": 1.2,
      "quick_ratio": 1.0,
      "dividend_yield": 0.005,
      "payout_ratio": 0.15,
      "revenue_growth": 0.08,
      "earnings_growth": 0.12
    },
    "company": {
      "name": "Apple Inc.",
      "sector": "Technology",
      "industry": "Consumer Electronics",
      "summary_original": "Apple Inc. designs, manufactures...",
      "summary_translated": "애플은 스마트폰, 컴퓨터 등을..."
    }
  },
  "error": null
}
```

**에러 응답:**

```json
{
  "success": false,
  "data": null,
  "error": "'XYZ'에 대한 데이터를 찾을 수 없습니다. 유효한 티커인지 확인하세요."
}
```

## 🧪 테스트

### cURL로 테스트

```bash
# 헬스 체크
curl http://localhost:8000/api/health

# 주식 데이터 조회 (AAPL)
curl http://localhost:8000/api/stock/AAPL
```

### Python으로 테스트

```python
import requests

# 헬스 체크
response = requests.get("http://localhost:8000/api/health")
print(response.json())

# 주식 데이터 조회
response = requests.get("http://localhost:8000/api/stock/AAPL")
print(response.json())
```

## 🔧 주요 의존성

| 패키지                  | 버전    | 용도                |
| ----------------------- | ------- | ------------------- |
| fastapi                 | 0.109.0 | Web Framework       |
| uvicorn                 | 0.27.0  | ASGI Server         |
| pydantic                | 2.5.3   | Data Validation     |
| pydantic-settings       | 2.1.0   | Settings Management |
| yfinance                | 0.2.36  | Stock Data API      |
| deep-translator         | 1.11.4  | Translation         |
| google-generativeai     | 0.3.2   | Gemini AI (미래 기능) |

## 📝 개발 노트

### MVP 범위

현재 구현된 기능:

- ✅ 실시간 주식 데이터 조회
- ✅ 재무 지표 (15개 이상)
- ✅ 회사 정보 (한글 번역)
- ✅ CORS 설정
- ✅ API 문서 자동 생성

미구현 (향후 추가 예정):

- ⏳ 기술적 지표 (RSI, MACD 등)
- ⏳ 뉴스 수집
- ⏳ AI 분석 (Gemini)
- ⏳ 과거 데이터 조회
- ⏳ Rate Limiting
- ⏳ 캐싱

## ❓ 문제 해결

### ImportError: No module named 'app'

`backend/` 디렉토리에서 실행하고 있는지 확인:

```bash
cd backend/
python -m app.main
```

### CORS 에러

`.env` 파일에서 `ALLOWED_ORIGINS`에 Frontend URL 추가:

```env
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

### yfinance 데이터 없음

유효한 티커 심볼인지 확인. 예시:

- ✅ AAPL (Apple)
- ✅ TSLA (Tesla)
- ✅ GOOGL (Google)
- ❌ INVALID (존재하지 않음)

## 📄 라이선스

교육 목적의 프로젝트
