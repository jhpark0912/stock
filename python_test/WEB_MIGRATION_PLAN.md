# 📱 Stock Analysis Web Platform - 개발 계획서

> **작성일**: 2026-01-28  
> **목표**: CLI 기반 `stock_info.py`를 현대적인 웹 애플리케이션으로 전환

---

## 📋 목차

1. [프로젝트 개요](#-프로젝트-개요)
2. [아키텍처 설계](#-아키텍처-설계)
3. [기술 스택](#-기술-스택)
4. [프로젝트 구조](#-프로젝트-구조)
5. [API 설계](#-api-설계)
6. [UI/UX 설계](#-uiux-설계)
7. [개발 일정](#-개발-일정)
8. [보안 및 성능](#-보안-및-성능)
9. [배포 계획](#-배포-계획)
10. [비용 및 리소스](#-비용-및-리소스)
11. [리스크 관리](#-리스크-관리)

---

## 🎯 프로젝트 개요

### 현재 상황
- **stock_info.py**: CLI 기반 대화형 주식 정보 조회 도구
- 35개 이상의 재무 지표, 기술적 분석, AI 기반 투자 인사이트 제공
- yfinance API, Gemini AI, deep_translator 사용
- rich 라이브러리로 터미널 UI 구성

### 전환 목표
현대적인 웹 애플리케이션으로 전환하여:
- ✅ 더 나은 사용자 경험 (시각적 차트, 직관적 인터페이스)
- ✅ 접근성 향상 (브라우저만 있으면 사용 가능)
- ✅ 기능 확장 용이성 (포트폴리오 추적, 알림 기능 등)
- ✅ 다중 사용자 지원 가능

### 핵심 기능 유지
- [x] 실시간/과거 주식 데이터 조회
- [x] 35개 이상 재무 지표 (ROE, PER, PBR, 부채비율 등)
- [x] 기술적 지표 (RSI, MACD, SMA, EMA, 볼린저밴드)
- [x] 뉴스 수집 및 감성 분석
- [x] Gemini AI 기반 투자 분석

---

## 🏗️ 아키텍처 설계

### 선택: Full-Stack 분리형 아키텍처

```
┌─────────────┐         HTTPS/REST API          ┌─────────────┐
│   Frontend  │ ◄──────────────────────────────► │   Backend   │
│   (React)   │                                  │  (FastAPI)  │
└─────────────┘                                  └──────┬──────┘
                                                        │
                                          ┌─────────────┴─────────────┐
                                          │                           │
                                     ┌────▼────┐              ┌──────▼──────┐
                                     │ yfinance│              │ Gemini API  │
                                     │   API   │              │             │
                                     └─────────┘              └─────────────┘
```

### 아키텍처 선택 근거

| 기준 | Full-Stack 분리형 | Streamlit | Django |
|------|------------------|-----------|--------|
| **기존 코드 재사용** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **확장성** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **성능** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **개발 속도** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **커스터마이징** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **UI/UX 품질** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |

**결론**: Full-Stack 분리형 선택 (FastAPI + React)

---

## 💻 기술 스택

### Backend

| 항목 | 기술 | 버전 | 용도 |
|------|------|------|------|
| **프레임워크** | FastAPI | 0.109+ | RESTful API 서버 |
| **런타임** | Python | 3.13 | 기존 코드 호환 |
| **데이터 조회** | yfinance | 0.2.36+ | 주식 데이터 API |
| **AI 분석** | google-generativeai | 최신 | Gemini API |
| **번역** | deep-translator | 1.11+ | 자동 번역 |
| **검증** | Pydantic | 2.0+ | 데이터 모델 |
| **ASGI 서버** | uvicorn | 0.27+ | 프로덕션 서버 |

### Frontend

| 항목 | 기술 | 버전 | 용도 |
|------|------|------|------|
| **프레임워크** | React | 18+ | UI 라이브러리 |
| **언어** | TypeScript | 5.0+ | 타입 안전성 |
| **빌드 도구** | Vite | 5.0+ | 빠른 개발 서버 |
| **라우팅** | React Router | 6+ | 페이지 라우팅 |
| **상태 관리** | React Query (TanStack Query) | 5.0+ | 서버 상태 |
| **HTTP 클라이언트** | Axios | 1.6+ | API 통신 |
| **차트** | Recharts | 2.10+ | 데이터 시각화 |
| **UI 라이브러리** | shadcn/ui | 최신 | 컴포넌트 |
| **스타일링** | Tailwind CSS | 3.4+ | 유틸리티 CSS |

### DevOps

| 항목 | 도구 | 용도 |
|------|------|------|
| **Backend 배포** | Railway | Python 앱 호스팅 |
| **Frontend 배포** | Vercel | React 앱 호스팅 |
| **버전 관리** | Git + GitHub | 소스 코드 관리 |
| **환경 변수** | .env 파일 | 시크릿 관리 |

---

## 📂 프로젝트 구조

### 전체 디렉토리 구조

```
stock-analysis-platform/
├── backend/                              # FastAPI 백엔드
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                      # FastAPI 앱 진입점
│   │   ├── config.py                    # 환경 변수 설정
│   │   │
│   │   ├── api/                         # API 라우트
│   │   │   ├── __init__.py
│   │   │   └── routes/
│   │   │       ├── __init__.py
│   │   │       ├── stock.py            # 주식 엔드포인트
│   │   │       └── health.py           # 헬스 체크
│   │   │
│   │   ├── services/                    # 비즈니스 로직
│   │   │   ├── __init__.py
│   │   │   ├── stock_service.py        # 주식 데이터 조회
│   │   │   ├── technical_indicators.py # 기술적 지표 계산
│   │   │   └── gemini_analyzer.py      # AI 분석
│   │   │
│   │   ├── models/                      # 데이터 모델
│   │   │   ├── __init__.py
│   │   │   ├── stock.py                # Pydantic 모델
│   │   │   └── responses.py            # API 응답 모델
│   │   │
│   │   ├── utils/                       # 유틸리티
│   │   │   ├── __init__.py
│   │   │   ├── translator.py           # 번역 유틸
│   │   │   └── cache.py                # 캐싱 유틸
│   │   │
│   │   └── middleware/                  # 미들웨어
│   │       ├── __init__.py
│   │       ├── cors.py                 # CORS 설정
│   │       └── rate_limit.py           # Rate Limiting
│   │
│   ├── tests/                           # 테스트
│   │   ├── __init__.py
│   │   ├── test_stock_service.py
│   │   └── test_api.py
│   │
│   ├── requirements.txt                 # Python 의존성
│   ├── .env.example                     # 환경 변수 템플릿
│   ├── .env                             # 환경 변수 (gitignore)
│   └── README.md                        # Backend 문서
│
├── frontend/                            # React 프론트엔드
│   ├── public/
│   │   ├── favicon.ico
│   │   └── index.html
│   │
│   ├── src/
│   │   ├── components/                  # 컴포넌트
│   │   │   ├── common/                 # 공통 컴포넌트
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   ├── Layout.tsx
│   │   │   │   └── Loading.tsx
│   │   │   │
│   │   │   ├── stock/                  # 주식 관련 컴포넌트
│   │   │   │   ├── SearchBar.tsx
│   │   │   │   ├── PriceCard.tsx
│   │   │   │   ├── FinancialsTable.tsx
│   │   │   │   ├── TechnicalChart.tsx
│   │   │   │   ├── NewsList.tsx
│   │   │   │   ├── Newssentiment.tsx
│   │   │   │   ├── AIAnalysis.tsx
│   │   │   │   └── HistoricalChart.tsx
│   │   │   │
│   │   │   └── ui/                     # shadcn/ui 컴포넌트
│   │   │       ├── button.tsx
│   │   │       ├── card.tsx
│   │   │       ├── tabs.tsx
│   │   │       └── ...
│   │   │
│   │   ├── pages/                       # 페이지
│   │   │   ├── Home.tsx                # 홈 페이지
│   │   │   ├── StockDetail.tsx         # 주식 상세
│   │   │   └── NotFound.tsx            # 404 페이지
│   │   │
│   │   ├── services/                    # API 서비스
│   │   │   ├── api.ts                  # Axios 인스턴스
│   │   │   └── stockApi.ts             # 주식 API 함수
│   │   │
│   │   ├── hooks/                       # Custom Hooks
│   │   │   ├── useStock.ts             # 주식 데이터 훅
│   │   │   ├── useStockHistory.ts      # 과거 데이터 훅
│   │   │   └── useLocalStorage.ts      # LocalStorage 훅
│   │   │
│   │   ├── types/                       # TypeScript 타입
│   │   │   ├── stock.ts
│   │   │   ├── api.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── utils/                       # 유틸리티
│   │   │   ├── format.ts               # 포맷팅 함수
│   │   │   └── constants.ts            # 상수
│   │   │
│   │   ├── App.tsx                      # 앱 루트
│   │   ├── main.tsx                     # 진입점
│   │   └── index.css                    # 글로벌 CSS
│   │
│   ├── package.json                     # npm 의존성
│   ├── tsconfig.json                    # TypeScript 설정
│   ├── tailwind.config.js               # Tailwind 설정
│   ├── vite.config.ts                   # Vite 설정
│   ├── .env.example                     # 환경 변수 템플릿
│   ├── .env                             # 환경 변수 (gitignore)
│   └── README.md                        # Frontend 문서
│
├── docs/                                # 문서
│   ├── API.md                          # API 문서
│   ├── DEPLOYMENT.md                   # 배포 가이드
│   └── DEVELOPMENT.md                  # 개발 가이드
│
├── .gitignore                          # Git 제외 파일
├── README.md                           # 프로젝트 개요
└── WEB_MIGRATION_PLAN.md              # 이 문서
```

---

## 🔌 API 설계

### Base URL
- **개발**: `http://localhost:8000/api`
- **프로덕션**: `https://stock-api.railway.app/api`

### 엔드포인트 목록

#### 1. 실시간 주식 데이터 조회

```http
GET /api/stock/{ticker}
```

**Query Parameters:**
| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| `include_technical` | boolean | `true` | 기술적 지표 포함 여부 |
| `include_news` | boolean | `true` | 뉴스 포함 여부 |
| `include_ai_analysis` | boolean | `false` | AI 분석 포함 여부 |

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "ticker": "AAPL",
    "timestamp": "2026-01-28T10:30:00Z",
    "price": {
      "current": 150.25,
      "open": 149.50,
      "high": 151.00,
      "low": 149.00,
      "volume": 50000000
    },
    "marketCap": 2500000000000,
    "financials": {
      "trailingPE": 25.5,
      "forwardPE": 23.2,
      "pbr": 6.8,
      "roe": 0.45,
      "opm": 0.28,
      "peg": 1.2,
      "debtToEquity": 1.5,
      "currentRatio": 1.2,
      "quickRatio": 1.0,
      "dividendYield": 0.005,
      "payoutRatio": 0.15,
      "revenueGrowth": 0.08,
      "earningsGrowth": 0.12
    },
    "technical": {
      "rsi": {
        "rsi14": 65.3
      },
      "macd": {
        "macd": 2.5,
        "signal": 2.1,
        "histogram": 0.4
      },
      "sma": {
        "sma20": 148.5,
        "sma50": 145.2,
        "sma200": 140.8
      },
      "ema": {
        "ema12": 149.8,
        "ema26": 147.3
      },
      "bollinger_bands": {
        "upper": 152.5,
        "middle": 150.0,
        "lower": 147.5
      }
    },
    "news": [
      {
        "title": "Apple announces new product",
        "link": "https://...",
        "publishedAt": "2026-01-28T09:00:00Z",
        "source": "Bloomberg"
      }
    ],
    "aiAnalysis": {
      "summary": "애플은 강력한 재무 구조와...",
      "strengths": [
        "높은 ROE (45%)",
        "안정적인 현금 흐름"
      ],
      "weaknesses": [
        "높은 PER 배수",
        "성장률 둔화"
      ],
      "recommendation": "보유",
      "risks": [
        "규제 리스크",
        "경쟁 심화"
      ],
      "newsSentiment": {
        "score": 35,
        "sentiment": "positive",
        "market_mood": "시장은 긍정적..."
      }
    }
  },
  "error": null
}
```

#### 2. 과거 데이터 조회

```http
GET /api/stock/{ticker}/historical?date=2026-01-20
```

**Query Parameters:**
| 파라미터 | 타입 | 필수 | 설명 |
|---------|------|------|------|
| `date` | string | Yes | 조회 날짜 (YYYY-MM-DD) |

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "ticker": "AAPL",
    "date": "2026-01-20",
    "open": 148.50,
    "high": 150.00,
    "low": 147.80,
    "close": 149.25,
    "volume": 48500000
  },
  "error": null
}
```

#### 3. 기술적 지표만 조회

```http
GET /api/stock/{ticker}/technical
```

**응답**: `technical` 객체만 반환

#### 4. AI 분석만 조회

```http
GET /api/stock/{ticker}/ai-analysis
```

**응답**: `aiAnalysis` 객체만 반환

#### 5. 뉴스만 조회

```http
GET /api/stock/{ticker}/news
```

**응답**: `news` 배열만 반환

#### 6. 헬스 체크

```http
GET /api/health
```

**응답:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-28T10:30:00Z"
}
```

### 에러 응답 형식

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "INVALID_TICKER",
    "message": "'XYZ'는 유효하지 않은 티커입니다.",
    "details": {}
  }
}
```

### 에러 코드

| 코드 | HTTP 상태 | 설명 |
|------|-----------|------|
| `INVALID_TICKER` | 400 | 유효하지 않은 티커 |
| `DATA_NOT_FOUND` | 404 | 데이터를 찾을 수 없음 |
| `API_ERROR` | 500 | 외부 API 오류 |
| `RATE_LIMIT_EXCEEDED` | 429 | Rate Limit 초과 |
| `INTERNAL_ERROR` | 500 | 서버 내부 오류 |

---

## 🎨 UI/UX 설계

### 페이지 구조

#### 1. 홈페이지 (`/`)

```
┌─────────────────────────────────────────────┐
│  Header: Logo | Search Bar | About          │
├─────────────────────────────────────────────┤
│                                             │
│  [Hero Section]                             │
│  📊 Stock Analysis Platform                 │
│  실시간 주식 데이터 + AI 분석                │
│                                             │
│  ┌─────────────────────────────┐            │
│  │  [Search Bar - 크게]         │            │
│  │  AAPL, TSLA, GOOGL...      │            │
│  └─────────────────────────────┘            │
│                                             │
│  [인기 종목]                                 │
│  ┌────────┬────────┬────────┐              │
│  │  AAPL  │  TSLA  │  MSFT  │              │
│  │ $150.25│ $245.80│ $380.50│              │
│  │  +2.5% │  -1.2% │  +0.8% │              │
│  └────────┴────────┴────────┘              │
│                                             │
│  [최근 검색 기록]                            │
│  AAPL > TSLA > GOOGL                       │
│                                             │
└─────────────────────────────────────────────┘
```

#### 2. 주식 상세 페이지 (`/stock/:ticker`)

```
┌─────────────────────────────────────────────┐
│  Header: Logo | Search Bar | [←] Back      │
├─────────────────────────────────────────────┤
│                                             │
│  [헤더 카드 - 큰 영역]                        │
│  AAPL - Apple Inc.                         │
│  $150.25  +$2.15 (+1.45%)  [초록색]        │
│  시가총액: $2.5T  | 거래량: 50M             │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  [탭 메뉴]                                   │
│  📊 기본정보 | 📈 기술분석 | 📰 뉴스 | 🤖 AI | 📅 과거 │
│  ─────────                                  │
│                                             │
│  [기본정보 탭 - 활성화]                       │
│                                             │
│  ┌─── 가격 정보 ─────────────────────┐      │
│  │ 시가: $149.50  | 고가: $151.00    │      │
│  │ 저가: $149.00  | 종가: $150.25    │      │
│  └────────────────────────────────────┘      │
│                                             │
│  ┌─── 밸류에이션 ───────────────────┐      │
│  │ PER: 25.5  | PBR: 6.8           │      │
│  │ PEG: 1.2   | PSR: 7.5           │      │
│  └────────────────────────────────────┘      │
│                                             │
│  ┌─── 수익성 ──────────────────────┐      │
│  │ ROE: 45%   | OPM: 28%           │      │
│  │ 매출총이익률: 43% | 순이익률: 26%│      │
│  └────────────────────────────────────┘      │
│                                             │
│  ┌─── 재무건전성 ─────────────────┐      │
│  │ 부채비율: 1.5 | 유동비율: 1.2   │      │
│  │ 현금: $50B    | 부채: $120B     │      │
│  └────────────────────────────────────┘      │
│                                             │
│  [회사 개요]                                 │
│  애플은 아이폰, 맥, 아이패드를 생산하는...   │
│                                             │
└─────────────────────────────────────────────┘
```

#### 3. 기술 분석 탭

```
┌─────────────────────────────────────────────┐
│  📈 기술적 지표                              │
│                                             │
│  [차트 영역 - 큰 영역]                        │
│  ┌─────────────────────────────────────┐    │
│  │ [Recharts 캔들스틱 차트]             │    │
│  │  + 볼린저밴드 오버레이                 │    │
│  │  + SMA 20/50/200 오버레이            │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  [지표 카드]                                 │
│  ┌──────┬──────┬──────┬──────┐            │
│  │ RSI  │ MACD │ SMA  │ EMA  │            │
│  │ 65.3 │ +0.4 │ 148.5│ 149.8│            │
│  │ 🟡   │ 🟢   │      │      │            │
│  └──────┴──────┴──────┴──────┘            │
│                                             │
│  [해석]                                      │
│  RSI가 65.3으로 중립 영역입니다...          │
│                                             │
└─────────────────────────────────────────────┘
```

#### 4. 뉴스 탭

```
┌─────────────────────────────────────────────┐
│  📰 최근 뉴스                                │
│                                             │
│  [감성 분석 카드]                            │
│  ┌─────────────────────────────────────┐    │
│  │ 😊 뉴스 감성: 긍정 (점수: +35)      │    │
│  │                                     │    │
│  │ 시장은 신제품 발표에 긍정적으로...  │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  [뉴스 목록]                                 │
│  ┌─────────────────────────────────────┐    │
│  │ 1. Apple announces new iPhone       │    │
│  │    Bloomberg | 2시간 전              │    │
│  │    [링크 →]                          │    │
│  ├─────────────────────────────────────┤    │
│  │ 2. Apple stock hits all-time high   │    │
│  │    CNBC | 5시간 전                   │    │
│  │    [링크 →]                          │    │
│  └─────────────────────────────────────┘    │
│                                             │
└─────────────────────────────────────────────┘
```

#### 5. AI 분석 탭

```
┌─────────────────────────────────────────────┐
│  🤖 AI 투자 분석 (Powered by Gemini)        │
│                                             │
│  [종합 평가]                                 │
│  ┌─────────────────────────────────────┐    │
│  │ 애플은 강력한 재무 구조와 높은 수익성을 │    │
│  │ 바탕으로 안정적인 투자처입니다...    │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  [강점 vs 약점]                              │
│  ┌──────────────┬──────────────┐          │
│  │ 💪 강점       │ ⚠️ 약점       │          │
│  ├──────────────┼──────────────┤          │
│  │ • 높은 ROE   │ • 높은 PER   │          │
│  │ • 안정적 FCF │ • 성장률 둔화│          │
│  └──────────────┴──────────────┘          │
│                                             │
│  [투자 의견]                                 │
│  ┌─────────────────────────────────────┐    │
│  │ 💼 보유 (Hold)                       │    │
│  │                                     │    │
│  │ 현재 밸류에이션을 고려할 때...       │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  [리스크 요인]                               │
│  • 규제 리스크                               │
│  • 경쟁 심화                                 │
│  • 매크로 경제 불확실성                      │
│                                             │
└─────────────────────────────────────────────┘
```

### 디자인 시스템

#### 컬러 팔레트

```css
/* Primary Colors */
--primary: #3B82F6;      /* Blue 500 */
--primary-dark: #2563EB; /* Blue 600 */
--primary-light: #60A5FA;/* Blue 400 */

/* Semantic Colors */
--success: #10B981;      /* Green 500 - 상승 */
--danger: #EF4444;       /* Red 500 - 하락 */
--warning: #F59E0B;      /* Amber 500 - 경고 */
--info: #06B6D4;         /* Cyan 500 - 정보 */

/* Neutral Colors */
--background: #FFFFFF;
--surface: #F9FAFB;      /* Gray 50 */
--border: #E5E7EB;       /* Gray 200 */
--text-primary: #111827; /* Gray 900 */
--text-secondary: #6B7280; /* Gray 500 */
```

#### 타이포그래피

```css
/* Headings */
h1: 2.25rem (36px) - Bold
h2: 1.875rem (30px) - Semibold
h3: 1.5rem (24px) - Semibold
h4: 1.25rem (20px) - Medium

/* Body */
body: 1rem (16px) - Regular
small: 0.875rem (14px) - Regular
```

#### 컴포넌트 스타일

**카드**:
- Border radius: 0.5rem (8px)
- Shadow: 0 1px 3px rgba(0,0,0,0.1)
- Padding: 1.5rem (24px)

**버튼**:
- Primary: Blue background, white text
- Secondary: White background, blue border
- Size: Medium (py-2 px-4), Large (py-3 px-6)

**입력 필드**:
- Border: 1px solid gray-300
- Focus: Blue ring
- Height: 2.5rem (40px)

### 반응형 디자인

#### 브레이크포인트

| 이름 | 너비 | 디바이스 |
|------|------|----------|
| Mobile | < 640px | 스마트폰 |
| Tablet | 640px - 1024px | 태블릿 |
| Desktop | > 1024px | 데스크탑 |

#### 레이아웃 조정

**Mobile**:
- 헤더: 로고 + 햄버거 메뉴
- 검색바: 전체 너비
- 카드: 1열 레이아웃
- 탭: 스크롤 가능

**Tablet**:
- 헤더: 로고 + 검색바
- 카드: 2열 레이아웃
- 탭: 모두 표시

**Desktop**:
- 헤더: 로고 + 검색바 + 메뉴
- 카드: 3-4열 레이아웃
- 사이드바 추가 가능

---

## 📅 개발 일정

### 전체 타임라인

```
Week 1-2: Backend + Frontend 초기 설정
Week 3-4: 핵심 기능 구현
Week 5-6: 고급 기능 + 배포
```

### Phase 1: Backend API 구축 (1주)

#### Sprint 1.1: 프로젝트 초기 설정 (2일)

- [ ] **Day 1**: 프로젝트 구조 생성
  - [ ] 디렉토리 구조 생성 (`backend/`, `frontend/`, `docs/`)
  - [ ] Git 저장소 초기화
  - [ ] `.gitignore` 설정
  - [ ] FastAPI 프로젝트 초기화
  - [ ] `requirements.txt` 작성

- [ ] **Day 2**: 환경 설정
  - [ ] `.env.example` 작성
  - [ ] `config.py` 작성 (환경 변수 로드)
  - [ ] FastAPI 기본 앱 생성 (`main.py`)
  - [ ] CORS 미들웨어 설정
  - [ ] Health check 엔드포인트 구현

#### Sprint 1.2: 코드 리팩토링 (3일)

- [ ] **Day 3**: StockService 클래스 작성
  - [ ] `stock_info.py`의 `get_stock_data()` 함수 분석
  - [ ] `StockService` 클래스로 리팩토링
  - [ ] 의존성 주입 구조 설계

- [ ] **Day 4**: 모듈 복사 및 통합
  - [ ] `technical_indicators.py` 복사 및 테스트
  - [ ] `gemini_analyzer.py` 복사 및 테스트
  - [ ] `translator.py` 유틸리티 작성

- [ ] **Day 5**: Pydantic 모델 정의
  - [ ] `StockResponse` 모델
  - [ ] `TechnicalIndicators` 모델
  - [ ] `AIAnalysis` 모델
  - [ ] `NewsItem` 모델
  - [ ] `ErrorResponse` 모델

#### Sprint 1.3: API 엔드포인트 구현 (2일)

- [ ] **Day 6**: 주요 엔드포인트
  - [ ] `GET /api/stock/{ticker}` 구현
  - [ ] `GET /api/stock/{ticker}/historical` 구현
  - [ ] Query parameters 처리

- [ ] **Day 7**: 추가 엔드포인트 및 테스트
  - [ ] `GET /api/stock/{ticker}/technical` 구현
  - [ ] `GET /api/stock/{ticker}/ai-analysis` 구현
  - [ ] `GET /api/stock/{ticker}/news` 구현
  - [ ] Postman/Thunder Client로 테스트
  - [ ] 에러 핸들링 개선

---

### Phase 2: Frontend 기본 구조 (1주)

#### Sprint 2.1: 프로젝트 초기 설정 (2일)

- [ ] **Day 8**: React 프로젝트 생성
  - [ ] `npm create vite@latest frontend -- --template react-ts`
  - [ ] 디렉토리 구조 생성
  - [ ] Git submodule 또는 monorepo 설정
  - [ ] `.env.example` 작성

- [ ] **Day 9**: 라이브러리 설치 및 설정
  - [ ] Tailwind CSS 설치 및 설정
  - [ ] shadcn/ui 설치
  - [ ] React Router 설치
  - [ ] Axios 설치
  - [ ] React Query 설치
  - [ ] Recharts 설치

#### Sprint 2.2: 기본 컴포넌트 (3일)

- [ ] **Day 10**: 레이아웃 컴포넌트
  - [ ] `Header.tsx` (로고, 검색바)
  - [ ] `Footer.tsx`
  - [ ] `Layout.tsx` (페이지 래퍼)
  - [ ] `Loading.tsx` (로딩 스피너)

- [ ] **Day 11**: API 설정
  - [ ] `api.ts` (Axios 인스턴스)
  - [ ] `stockApi.ts` (주식 API 함수)
  - [ ] React Query 설정
  - [ ] `useStock.ts` 훅 작성

- [ ] **Day 12**: 라우팅 및 기본 페이지
  - [ ] React Router 설정
  - [ ] `Home.tsx` 기본 레이아웃
  - [ ] `StockDetail.tsx` 기본 레이아웃
  - [ ] `NotFound.tsx`

#### Sprint 2.3: UI 라이브러리 설정 (2일)

- [ ] **Day 13**: shadcn/ui 컴포넌트
  - [ ] Button, Card, Tabs 설치
  - [ ] Input, Table 설치
  - [ ] Dialog, Sheet 설치

- [ ] **Day 14**: 스타일링 완성
  - [ ] Tailwind 커스텀 설정
  - [ ] 컬러 팔레트 정의
  - [ ] 타이포그래피 설정
  - [ ] 반응형 유틸리티 클래스

---

### Phase 3: 핵심 기능 구현 (2주)

#### Sprint 3.1: 검색 기능 (2일)

- [ ] **Day 15**: 검색 UI
  - [ ] `SearchBar.tsx` 컴포넌트
  - [ ] 자동완성 기능 (선택사항)
  - [ ] 최근 검색 기록 표시

- [ ] **Day 16**: 검색 로직
  - [ ] 검색 버튼 클릭 → 상세 페이지 이동
  - [ ] Enter 키 지원
  - [ ] LocalStorage에 검색 기록 저장

#### Sprint 3.2: 가격 정보 (3일)

- [ ] **Day 17**: PriceCard 컴포넌트
  - [ ] 현재가, 변동률 표시
  - [ ] 시가총액, 거래량 표시
  - [ ] 색상 처리 (상승/하락)

- [ ] **Day 18**: FinancialsTable 컴포넌트
  - [ ] 밸류에이션 지표 테이블
  - [ ] 수익성 지표 테이블
  - [ ] 재무건전성 지표 테이블
  - [ ] 배당 정보 테이블

- [ ] **Day 19**: 회사 개요
  - [ ] `CompanySummary.tsx` 컴포넌트
  - [ ] 번역된 텍스트 표시
  - [ ] 접기/펼치기 기능

#### Sprint 3.3: 기술적 지표 (4일)

- [ ] **Day 20**: TechnicalChart 기본
  - [ ] Recharts 라인 차트 구현
  - [ ] 가격 데이터 표시

- [ ] **Day 21**: 차트 고급 기능
  - [ ] 볼린저밴드 오버레이
  - [ ] SMA 오버레이
  - [ ] EMA 오버레이
  - [ ] 줌/팬 기능

- [ ] **Day 22**: 지표 카드
  - [ ] RSI 카드 (색상 코딩)
  - [ ] MACD 카드
  - [ ] 이동평균선 카드

- [ ] **Day 23**: 통합 및 테스트
  - [ ] 기술 분석 탭 완성
  - [ ] 반응형 디자인 적용
  - [ ] 버그 수정

#### Sprint 3.4: 뉴스 및 AI 분석 (5일)

- [ ] **Day 24**: NewsList 컴포넌트
  - [ ] 뉴스 목록 표시
  - [ ] 링크 클릭 → 새 탭 열기
  - [ ] 날짜 포맷팅

- [ ] **Day 25**: NewsSentiment 컴포넌트
  - [ ] 감성 점수 표시
  - [ ] 이모지 및 색상 처리
  - [ ] 시장 심리 텍스트

- [ ] **Day 26**: AIAnalysis 컴포넌트 (1)
  - [ ] 종합 평가 카드
  - [ ] 강점/약점 테이블

- [ ] **Day 27**: AIAnalysis 컴포넌트 (2)
  - [ ] 투자 의견 카드
  - [ ] 리스크 요인 리스트
  - [ ] AI 분석 요청 버튼

- [ ] **Day 28**: 통합 및 테스트
  - [ ] 뉴스 탭 완성
  - [ ] AI 분석 탭 완성
  - [ ] 로딩 상태 처리

---

### Phase 4: 고급 기능 (1주)

#### Sprint 4.1: 과거 데이터 (3일)

- [ ] **Day 29**: HistoricalChart 컴포넌트
  - [ ] 날짜 선택 UI (DatePicker)
  - [ ] API 호출 로직
  - [ ] 캔들스틱 차트 구현

- [ ] **Day 30**: 차트 고급 기능
  - [ ] 기간 선택 (1주, 1개월, 3개월, 1년)
  - [ ] 차트 타입 전환 (캔들스틱/라인)
  - [ ] 거래량 차트 추가

- [ ] **Day 31**: 통합 및 테스트
  - [ ] 과거 데이터 탭 완성
  - [ ] 반응형 디자인 적용

#### Sprint 4.2: UX 개선 (2일)

- [ ] **Day 32**: 로딩 및 에러 처리
  - [ ] Skeleton 로딩 UI
  - [ ] 에러 메시지 표시
  - [ ] Retry 버튼
  - [ ] Empty State 디자인

- [ ] **Day 33**: 반응형 디자인
  - [ ] 모바일 레이아웃 최적화
  - [ ] 태블릿 레이아웃 최적화
  - [ ] 터치 제스처 지원

#### Sprint 4.3: 추가 기능 (2일)

- [ ] **Day 34**: LocalStorage 기능
  - [ ] 최근 검색 기록 저장
  - [ ] 즐겨찾기 기능 (선택사항)
  - [ ] 다크 모드 토글 (선택사항)

- [ ] **Day 35**: 성능 최적화
  - [ ] 컴포넌트 memoization
  - [ ] 이미지 lazy loading
  - [ ] 코드 스플리팅

---

### Phase 5: 배포 및 최적화 (3일)

#### Sprint 5.1: Backend 배포 (1일)

- [ ] **Day 36**: Railway 배포
  - [ ] Railway 계정 생성
  - [ ] 프로젝트 생성 및 연결
  - [ ] 환경 변수 설정
  - [ ] 배포 및 테스트
  - [ ] 커스텀 도메인 설정 (선택사항)

#### Sprint 5.2: Frontend 배포 (1일)

- [ ] **Day 37**: Vercel 배포
  - [ ] Vercel 계정 생성
  - [ ] 프로젝트 연결
  - [ ] 환경 변수 설정 (`VITE_API_URL`)
  - [ ] 배포 및 테스트
  - [ ] 커스텀 도메인 설정 (선택사항)

#### Sprint 5.3: 최종 테스트 및 문서화 (1일)

- [ ] **Day 38**: 최종 점검
  - [ ] E2E 테스트 (수동)
  - [ ] 성능 테스트 (Lighthouse)
  - [ ] 보안 점검
  - [ ] API 문서 작성
  - [ ] README 업데이트
  - [ ] 배포 가이드 작성

---

### 일정 요약

| Phase | 기간 | 주요 산출물 |
|-------|------|-----------|
| Phase 1: Backend | 1주 (7일) | FastAPI 서버, API 엔드포인트 |
| Phase 2: Frontend 기본 | 1주 (7일) | React 앱, 레이아웃, API 연동 |
| Phase 3: 핵심 기능 | 2주 (14일) | 검색, 재무 지표, 차트, 뉴스, AI 분석 |
| Phase 4: 고급 기능 | 1주 (7일) | 과거 데이터, UX 개선, 성능 최적화 |
| Phase 5: 배포 | 3일 | 프로덕션 배포, 문서화 |
| **총계** | **약 38일 (5-6주)** | **완전한 웹 애플리케이션** |

---

## 🔒 보안 및 성능

### 보안 체크리스트

#### Backend 보안

- [ ] **환경 변수 관리**
  - [ ] `.env` 파일을 `.gitignore`에 추가
  - [ ] `GEMINI_API_KEY`는 절대 노출하지 않음
  - [ ] 프로덕션 환경 변수는 Railway에서 관리

- [ ] **CORS 설정**
  - [ ] 개발 환경: `localhost:5173` 허용
  - [ ] 프로덕션: 실제 도메인만 허용
  - [ ] Credentials 허용 설정

- [ ] **Rate Limiting**
  - [ ] `slowapi` 또는 `fastapi-limiter` 사용
  - [ ] `/api/stock/{ticker}`: 100 req/hour per IP
  - [ ] `/api/stock/{ticker}/ai-analysis`: 10 req/hour per IP

- [ ] **입력 검증**
  - [ ] Pydantic 모델로 자동 검증
  - [ ] 티커: 대문자 변환, 특수문자 제거
  - [ ] 날짜: YYYY-MM-DD 형식 검증

- [ ] **HTTPS 강제**
  - [ ] Railway는 자동으로 HTTPS 제공
  - [ ] HTTP → HTTPS 리다이렉트 설정 (선택사항)

- [ ] **에러 메시지**
  - [ ] 민감한 정보 노출 금지
  - [ ] 스택 트레이스는 개발 환경에서만
  - [ ] 사용자 친화적인 에러 메시지

#### Frontend 보안

- [ ] **API 키 관리**
  - [ ] API 키는 절대 프론트엔드에 포함하지 않음
  - [ ] 모든 API 호출은 Backend를 통해서만

- [ ] **환경 변수**
  - [ ] `.env` 파일을 `.gitignore`에 추가
  - [ ] `VITE_API_URL`만 노출 (공개 정보)

- [ ] **XSS 방어**
  - [ ] React는 기본적으로 XSS 방어
  - [ ] `dangerouslySetInnerHTML` 사용 금지
  - [ ] 사용자 입력 sanitize

- [ ] **CSRF 방어**
  - [ ] GET 요청만 사용 (읽기 전용 앱)
  - [ ] 추후 POST 추가 시 CSRF 토큰 구현

### 성능 최적화

#### Backend 성능

- [ ] **캐싱**
  ```python
  from functools import lru_cache
  
  @lru_cache(maxsize=128)
  def get_stock_data_cached(ticker: str):
      # yfinance 호출은 느림 → 캐싱 필수
      return ticker_obj.info
  ```
  - [ ] yfinance 응답 캐싱 (5분 TTL)
  - [ ] Gemini AI 응답 캐싱 (1시간 TTL)
  - [ ] Redis 도입 고려 (Phase 2)

- [ ] **비동기 처리**
  ```python
  async def get_stock_data(ticker: str):
      # FastAPI는 async/await 지원
      pass
  ```
  - [ ] 모든 I/O 작업은 async로
  - [ ] 병렬 API 호출 (`asyncio.gather`)

- [ ] **응답 압축**
  - [ ] GZip 미들웨어 활성화
  - [ ] JSON 응답 압축

#### Frontend 성능

- [ ] **코드 스플리팅**
  ```typescript
  const StockDetail = lazy(() => import('./pages/StockDetail'));
  ```
  - [ ] React.lazy로 페이지별 분리
  - [ ] Suspense로 로딩 처리

- [ ] **이미지 최적화**
  - [ ] WebP 포맷 사용
  - [ ] Lazy loading (`loading="lazy"`)
  - [ ] 적절한 크기 설정

- [ ] **React Query 최적화**
  ```typescript
  {
    staleTime: 60000, // 1분간 fresh로 간주
    cacheTime: 300000, // 5분간 캐시 유지
    refetchOnWindowFocus: false,
  }
  ```
  - [ ] staleTime 설정으로 불필요한 요청 방지
  - [ ] Prefetching 활용

- [ ] **번들 크기 최적화**
  - [ ] Tree shaking 활성화
  - [ ] Lodash → Lodash-es
  - [ ] Moment.js → date-fns 또는 dayjs
  - [ ] 번들 분석 (`vite-bundle-visualizer`)

- [ ] **Lighthouse 점수 목표**
  - [ ] Performance: 90+
  - [ ] Accessibility: 95+
  - [ ] Best Practices: 95+
  - [ ] SEO: 90+

### 모니터링 및 로깅

#### Backend

- [ ] **로깅**
  ```python
  import logging
  
  logging.basicConfig(level=logging.INFO)
  logger = logging.getLogger(__name__)
  
  logger.info(f"Stock data requested: {ticker}")
  ```
  - [ ] 모든 API 요청 로그
  - [ ] 에러 로그 (스택 트레이스 포함)
  - [ ] 외부 API 호출 로그

- [ ] **Health Check**
  ```python
  @app.get("/api/health")
  async def health_check():
      return {
          "status": "ok",
          "timestamp": datetime.now().isoformat(),
          "services": {
              "yfinance": "ok",
              "gemini": "ok"
          }
      }
  ```

#### Frontend

- [ ] **에러 추적**
  - [ ] Sentry.io 연동 (선택사항)
  - [ ] Console 에러 자동 캡처
  - [ ] 사용자 피드백 수집

- [ ] **Analytics**
  - [ ] Google Analytics (선택사항)
  - [ ] 페이지 뷰 추적
  - [ ] 검색 키워드 추적

---

## 🚀 배포 계획

### Backend 배포 (Railway)

#### Railway 선택 이유
- Python 3.13 지원
- 자동 HTTPS
- 환경 변수 관리 UI
- GitHub 자동 배포
- 무료 티어: 500시간/월

#### 배포 단계

1. **Railway 프로젝트 생성**
   - [ ] Railway 계정 생성 (https://railway.app)
   - [ ] New Project → Deploy from GitHub repo
   - [ ] `backend/` 디렉토리 선택

2. **환경 변수 설정**
   - [ ] `GEMINI_API_KEY`: Gemini API 키
   - [ ] `ENVIRONMENT`: `production`
   - [ ] `ALLOWED_ORIGINS`: Frontend URL

3. **배포 설정**
   - [ ] Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - [ ] Root Directory: `backend/`
   - [ ] Python Version: 3.13

4. **배포 확인**
   - [ ] 배포 로그 확인
   - [ ] Health check 테스트: `GET /api/health`
   - [ ] 실제 API 테스트: `GET /api/stock/AAPL`

5. **커스텀 도메인 (선택사항)**
   - [ ] 도메인 구매 (Namecheap, GoDaddy 등)
   - [ ] Railway에서 도메인 연결
   - [ ] DNS 레코드 설정

### Frontend 배포 (Vercel)

#### Vercel 선택 이유
- React/Vite 최적화
- 자동 HTTPS
- Edge Network (빠른 로딩)
- GitHub 자동 배포
- 무료 티어: 무제한 대역폭

#### 배포 단계

1. **Vercel 프로젝트 생성**
   - [ ] Vercel 계정 생성 (https://vercel.com)
   - [ ] Import Git Repository
   - [ ] `frontend/` 디렉토리 선택

2. **빌드 설정**
   - [ ] Framework Preset: Vite
   - [ ] Build Command: `npm run build`
   - [ ] Output Directory: `dist`
   - [ ] Install Command: `npm install`

3. **환경 변수 설정**
   - [ ] `VITE_API_URL`: Railway Backend URL (예: `https://stock-api.railway.app`)

4. **배포 확인**
   - [ ] 배포 로그 확인
   - [ ] 웹사이트 접속 테스트
   - [ ] API 연동 테스트

5. **커스텀 도메인 (선택사항)**
   - [ ] 도메인 구매
   - [ ] Vercel에서 도메인 연결
   - [ ] DNS 레코드 자동 설정

### 배포 후 체크리스트

- [ ] **기능 테스트**
  - [ ] 티커 검색 정상 작동
  - [ ] 재무 지표 표시 확인
  - [ ] 기술적 지표 차트 렌더링
  - [ ] 뉴스 목록 표시
  - [ ] AI 분석 요청 및 응답

- [ ] **성능 테스트**
  - [ ] Lighthouse 점수 확인
  - [ ] 페이지 로딩 속도 측정
  - [ ] API 응답 시간 측정

- [ ] **보안 테스트**
  - [ ] HTTPS 강제 확인
  - [ ] CORS 정책 확인
  - [ ] Rate Limiting 테스트
  - [ ] API 키 노출 여부 확인

- [ ] **모니터링 설정**
  - [ ] Railway 로그 확인
  - [ ] Vercel Analytics 활성화
  - [ ] 에러 알림 설정 (이메일/Slack)

---

## 💰 비용 및 리소스

### 개발 단계 비용

| 항목 | 비용 | 비고 |
|------|------|------|
| **개발 도구** | $0 | VS Code, Git (무료) |
| **API 사용** | $0 | yfinance (무료), Gemini (무료 티어) |
| **테스트** | $0 | 로컬 환경 |
| **총계** | **$0** | |

### 프로덕션 비용

#### 무료 티어 사용 시

| 항목 | 서비스 | 무료 티어 제한 | 비용 |
|------|--------|---------------|------|
| **Backend 호스팅** | Railway | 500시간/월, $5 크레딧 | $0 |
| **Frontend 호스팅** | Vercel | 무제한 대역폭, 100GB 대역폭/월 | $0 |
| **Gemini API** | Google | 60 req/min | $0 |
| **yfinance API** | Yahoo | 무제한 (비공식) | $0 |
| **도메인** | - | 선택사항 | $0 (서브도메인 사용) |
| **총계** | | | **$0/월** |

#### 유료 플랜 (확장 시)

| 항목 | 서비스 | 플랜 | 비용 |
|------|--------|------|------|
| **Backend** | Railway | Hobby | $5/월 |
| **Frontend** | Vercel | Pro | $20/월 |
| **Gemini API** | Google | Pay-as-you-go | ~$10/월 (1000 req 가정) |
| **도메인** | Namecheap | .com | ~$10/년 |
| **총계** | | | **$35-40/월** |

### 트래픽 추정

#### 무료 티어 한계

**Railway (Backend)**:
- 500시간/월 = 약 694시간 (충분)
- 1 API 요청 = 100ms 가정
- 최대 요청 수: 500시간 × 3600초 × 10 req/s = **1800만 요청/월**

**Vercel (Frontend)**:
- 무제한 대역폭 (Hobby 플랜)
- 100GB/월 = 충분

**Gemini API**:
- 60 req/min = 3600 req/h = **86,400 req/일**
- 실제 사용은 훨씬 적을 것 (AI 분석은 선택적)

#### 결론
- 초기 단계에서는 **무료 티어로 충분**
- 일일 사용자 100명 기준으로도 여유 있음
- 트래픽 증가 시 유료 플랜으로 업그레이드

### 개발 인력

| 역할 | 시간 | 시급 (가정) | 총 비용 |
|------|------|-----------|--------|
| **풀스택 개발자** | 300시간 (38일 × 8시간) | $50/h | $15,000 |

**또는**
- **개인 프로젝트**: 무료 (자기 시간 투자)
- **팀 프로젝트**: 협업으로 비용 분산

---

## ⚠️ 리스크 관리

### 기술적 리스크

| 리스크 | 확률 | 영향 | 대응 방안 |
|--------|------|------|----------|
| **yfinance API 불안정** | 중 | 높음 | - 대체 API 준비 (Alpha Vantage, IEX Cloud)<br>- 에러 핸들링 강화<br>- 캐싱으로 API 호출 최소화 |
| **Gemini API Rate Limit** | 중 | 중 | - 무료 티어 제한 모니터링<br>- 사용자당 AI 분석 횟수 제한<br>- 캐싱 활용 |
| **Python 3.13 호환성** | 낮 | 중 | - 모든 라이브러리 호환성 사전 테스트<br>- 필요 시 Python 3.11로 다운그레이드 |
| **React/Vite 빌드 오류** | 낮 | 중 | - CI/CD 파이프라인에서 빌드 테스트<br>- 의존성 버전 고정 |

### 비즈니스 리스크

| 리스크 | 확률 | 영향 | 대응 방안 |
|--------|------|------|----------|
| **무료 티어 한계 초과** | 중 | 중 | - 사용량 모니터링<br>- 유료 플랜 전환 준비<br>- Rate Limiting 적극 활용 |
| **법적 문제 (데이터 사용권)** | 낮 | 높음 | - yfinance는 비상업적 용도로만<br>- 이용 약관 명시<br>- 상업화 시 공식 API로 전환 |
| **사용자 부족** | 중 | 중 | - MVP 먼저 출시<br>- 사용자 피드백 수집<br>- 마케팅 전략 수립 |

### 일정 리스크

| 리스크 | 확률 | 영향 | 대응 방안 |
|--------|------|------|----------|
| **개발 지연** | 중 | 중 | - 버퍼 시간 확보 (1주)<br>- MVP 우선 개발<br>- 기능 우선순위 조정 |
| **버그 발생** | 높음 | 낮음 | - 단계별 테스트<br>- E2E 테스트 자동화<br>- 빠른 핫픽스 배포 |

### 보안 리스크

| 리스크 | 확률 | 영향 | 대응 방안 |
|--------|------|------|----------|
| **API 키 노출** | 낮 | 높음 | - `.env` 파일 절대 커밋 금지<br>- GitHub Secret Scanning 활성화<br>- 키 로테이션 계획 |
| **DDoS 공격** | 낮 | 높음 | - Railway/Vercel의 기본 DDoS 방어<br>- Rate Limiting<br>- Cloudflare 추가 (필요 시) |

---

## 📚 참고 자료

### 공식 문서

- **FastAPI**: https://fastapi.tiangolo.com/
- **React**: https://react.dev/
- **Vite**: https://vitejs.dev/
- **Tailwind CSS**: https://tailwindcss.com/
- **shadcn/ui**: https://ui.shadcn.com/
- **React Query**: https://tanstack.com/query/latest
- **Recharts**: https://recharts.org/

### 외부 API

- **yfinance**: https://github.com/ranaroussi/yfinance
- **Gemini API**: https://ai.google.dev/docs
- **deep-translator**: https://github.com/nidhaloff/deep-translator

### 배포 플랫폼

- **Railway**: https://docs.railway.app/
- **Vercel**: https://vercel.com/docs

---

## 🎯 다음 단계

### 즉시 시작 가능한 작업

1. **[우선] 프로젝트 구조 생성**
   ```bash
   mkdir stock-analysis-platform
   cd stock-analysis-platform
   mkdir backend frontend docs
   ```

2. **Backend 초기 설정**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install fastapi uvicorn pydantic
   ```

3. **Frontend 초기 설정**
   ```bash
   cd frontend
   npm create vite@latest . -- --template react-ts
   npm install
   ```

### 의사 결정 필요 사항

| 질문 | 옵션 A | 옵션 B |
|------|--------|--------|
| **개발 방식** | MVP 먼저 (2주) | 전체 기능 (5-6주) |
| **배포 시점** | Phase 3 완료 후 | Phase 5 완료 후 |
| **도메인** | 무료 서브도메인 | 유료 커스텀 도메인 |
| **AI 분석** | Phase 1부터 포함 | Phase 2 이후 추가 |

### 추가 기능 (Phase 2 - 미래)

- [ ] 사용자 인증 (로그인/회원가입)
- [ ] 포트폴리오 추적 기능
- [ ] 가격 알림 기능 (이메일/푸시)
- [ ] 비교 분석 (여러 종목 동시 비교)
- [ ] 백테스팅 도구
- [ ] PDF 리포트 생성
- [ ] 소셜 공유 기능
- [ ] 모바일 앱 (React Native)

---

## 📝 변경 이력

| 날짜 | 버전 | 변경 내용 | 작성자 |
|------|------|----------|--------|
| 2026-01-28 | 1.0.0 | 초안 작성 | Claude |

---

## 📄 라이선스 및 면책사항

### 라이선스
이 프로젝트는 교육 목적으로 작성되었습니다. 상업적 사용 시 yfinance의 이용 약관을 확인하세요.

### 면책사항
> ⚠️ **투자 경고**  
> 이 애플리케이션은 투자 조언을 제공하지 않습니다. 모든 투자 결정은 사용자 본인의 책임입니다. AI 분석 결과는 참고 자료일 뿐이며, 실제 투자에 활용할 경우 발생하는 손실에 대해 개발자는 책임을 지지 않습니다.

---

**작성 완료일**: 2026-01-28  
**문서 버전**: 1.0.0  
**예상 총 개발 기간**: 5-6주 (38일)  
**예상 비용**: $0/월 (무료 티어 사용 시)
