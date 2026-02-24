# 프로젝트 구조

> 최종 업데이트: 2026-02-24

## 전체 구조

```
stock/
├── frontend/          # React + TypeScript + Vite
├── backend/           # FastAPI + Python
├── nginx/             # Nginx Reverse Proxy + SSL
├── docs/              # 문서 (DESIGN_SYSTEM, UX_GUIDELINES 등)
├── data/              # SQLite DB 파일
└── .claude/           # Claude 설정 (CHANGELOG, COMMIT_CONVENTION 등)
```

## 기술 스택

| 레이어 | 기술 | 비고 |
|--------|------|------|
| Frontend | React 19.2 + TypeScript 5.9 + Vite 7.2 | |
| UI | Radix UI + Tailwind CSS 4.1 + Lucide React | `docs/DESIGN_SYSTEM.md` 참조 |
| 상태/데이터 | TanStack Query 5.90 + React Router 7.13 | |
| 차트 | Recharts 2.15 | |
| HTTP | Axios (인터셉터로 JWT 자동 첨부) | |
| Backend | FastAPI 0.109 + Uvicorn 0.27 | |
| DB | SQLite + SQLAlchemy 2.0+ | `data/stock.db` |
| 인증 | python-jose (JWT) + bcrypt | |
| AI | Google Generative AI (Gemini) | 사용자별 API 키 |
| 배포 | Docker Compose + Nginx + Let's Encrypt | |

## 데이터 흐름 (아키텍처)

### 전체 요청 흐름

```
Browser → Nginx (SSL termination, rate limit)
  → /api/*  → FastAPI (8000)
  → /*      → Frontend 정적 파일 (80)
```

### 외부 서비스 연동

| 서비스 | 용도 | 캐싱 | Backend 위치 |
|--------|------|------|-------------|
| Yahoo Finance | 주가, VIX, 원자재, 금리, 환율 | 5분 | `services/economic/economic_service.py` |
| FRED API | 미국 거시지표 (CPI, M2, CFNAI 등) | 요청 시 | `services/economic/fred_service.py` |
| ECOS API (한국은행) | 한국 거시지표 (기준금리, CPI, M2) | 24시간 | `services/economic/korea_economic_service.py` |
| KIS API (한국투자증권) | 한국 섹터 ETF 보유종목 | 토큰 23시간 | `services/korea_data/kis_api_service.py` |
| Gemini AI | 주식 분석, 시장 사이클 코멘트, 마감 리뷰 | 없음 | `services/stock/stock_service.py` |
| GCP Secret Manager | API 키 보안 저장 (선택) | 1시간 TTL | `utils/secret_manager.py` |

### 인증 흐름

```
Login (POST /api/auth/login) → bcrypt 검증 → JWT 발급 → localStorage 저장
→ 이후 모든 요청: Authorization: Bearer {token} → get_current_user 의존성 주입
```

### AI 분석 흐름

```
Frontend → POST /api/stock/{ticker}/analysis/summary
→ StockService (yahooquery로 주가 조회) → Gemini AI (요약 생성) → 응답
→ 사용자 저장 시 → POST /api/stock/{ticker}/analysis/save → StockAnalysisDB
```

### 경제 지표 상태 판단

- **YoY 기반**: CPI (1.5-2.5% 좋음), M2 (4-8% 좋음)
- **절대값 기반**: VIX, 금리, Philly Fed, CFNAI, UMCSENT
- **한국**: KR_BOND_10Y(<3%), KR_BASE_RATE(<2.5%), KR_CREDIT_SPREAD(<0.5%p)

### 배포 구조

```
docker-compose.yml              # 기본 (Backend + Frontend)
docker-compose.override.yml     # 프로덕션 자동 적용 (Nginx + SSL + Certbot)
docker-compose.dev.yml          # 개발 환경 (Hot Reload, 명시적 -f 필요)
```

| 컨테이너 | 역할 | 포트 |
|----------|------|------|
| stock-backend | FastAPI | 8000 (내부) |
| stock-frontend | 정적 파일 | 80 (내부) |
| stock-nginx | Reverse Proxy + SSL | 80, 443 (외부) |
| stock-certbot | SSL 인증서 자동 갱신 | - |

## Frontend 디렉토리

```
frontend/src/
├── components/           # 도메인별 서브패키지 (루트 파일 없음)
│   ├── admin/            # 관리자
│   ├── auth/             # 로그인
│   ├── charts/           # 차트 서브컴포넌트 (PriceVolume, SMA, Bollinger, Comprehensive)
│   ├── common/           # 공유 UI (LoadingSpinner, GaugeBar, MetricCard, MiniSparkline, StrategyBadge)
│   ├── economic/         # 경제 지표 (EconomicIndicators, SectorHeatmap, MarketReview/ 등)
│   ├── layout/           # TopNav, PageHeader, PageContainer, ThemeProvider, AppLayout
│   ├── pages/            # HomePage (Economic), PortfolioPage
│   ├── portfolio/        # AIAnalysisTab, AnalysisHistory, CategoryMetrics, HeroSection, MainTabs, Sidebar, StockChart
│   ├── settings/         # Gemini/KIS 키 관리
│   ├── stealth/          # 스텔스 모드 위장 (StealthHomePage, StealthPortfolioPage 등)
│   └── ui/               # shadcn/ui 컴포넌트
├── hooks/                # 도메인별 커스텀 훅
│   ├── economic/         # useEconomicData, useMarketCycle, useSectorHeatmap, useSectorDetail
│   ├── portfolio/        # usePortfolio
│   ├── stealth/          # useStealthHome
│   └── common/           # useAnalysisSummary (cross-domain)
├── contexts/             # AuthContext (JWT), StealthContext (localStorage)
├── lib/                  # API 클라이언트 (api.ts, authApi.ts, portfolioApi.ts, analysisApi.ts, adminApi.ts)
├── types/                # TypeScript 타입 (economic, stock, auth, user, admin, marketReview)
├── utils/                # storage.ts
├── App.tsx               # TopNav + 페이지 라우팅
└── main.tsx              # 엔트리 포인트
```

**페이지 구조**:
```
App.tsx → TopNav (Economic | Portfolio | Settings | Admin)
├── HomePage → EconomicIndicators (경제지표 / 섹터히트맵 / 시장사이클 / 마감리뷰)
│   └── [스텔스] StealthHomePage (회의록/업무 메모 위장)
├── PortfolioPage → Sidebar + MainTabs (Overview, AI, Chart, Technical, News)
│   └── [스텔스] StealthPortfolioPage (프로젝트 관리 위장)
├── SettingsPage (스텔스 시 숨김)
└── AdminPage (관리자만, 스텔스 시 숨김)
```

**스텔스 모드**: `StealthContext.tsx` (localStorage 기반)
- ON: 로고 "RD"→"M", 앱명→"Memo", 차트 숨김, 모노톤, Settings/Admin 자동 숨김

## Backend 디렉토리

```
backend/app/
├── api/routes/             # API 엔드포인트
│   ├── auth.py             # 인증 (register, login, Gemini/KIS 키 관리)
│   ├── stock.py            # 주식 데이터 + AI 분석
│   ├── portfolio.py        # 포트폴리오 CRUD
│   ├── admin.py            # 사용자 관리 (승인/거부/비활성화)
│   ├── health.py           # 헬스체크
│   ├── secret_stats.py     # Secret Manager 캐시 통계
│   └── economic/           # 경제 지표 (4파일 분할)
│       ├── indicators.py   # GET /economic, /economic/status
│       ├── sectors.py      # GET /economic/sectors, .../holdings
│       ├── market_cycle.py # GET /economic/market-cycle, .../analysis
│       └── market_review.py # GET .../market-review/{country}, POST .../ai
├── database/               # DB 레이어
│   ├── models.py           # ORM (UserDB, PortfolioDB, StockAnalysisDB)
│   ├── repository.py       # 포트폴리오 Repository
│   ├── analysis_repository.py # AI 분석 저장소
│   └── connection.py       # DB 연결
├── models/                 # Pydantic 스키마 (user, stock, portfolio, economic)
├── services/               # 비즈니스 로직 (도메인 서브패키지)
│   ├── auth/               # JWT, 비밀번호 해싱
│   ├── common/             # indicator_status (YoY 판단)
│   ├── economic/           # Yahoo/FRED/ECOS 서비스
│   ├── market/             # 시장 사이클 (US/KR), 마감 리뷰
│   ├── sector/             # 섹터 ETF (US: GICS 11개, KR: KODEX)
│   ├── stock/              # 주식 데이터 + 기술적 지표 + AI 분석
│   └── korea_data/         # KIS API (OAuth2), pykrx (fallback)
├── utils/                  # secret_manager.py (GCP)
├── config.py               # 환경 변수, 로깅
└── main.py                 # FastAPI 앱 엔트리
```

## API 엔드포인트

### 인증 (`/api/auth`)
- `POST /register` - 회원가입 (승인 대기)
- `POST /login` - 로그인 (JWT 발급)
- `GET /me` - 현재 사용자 정보
- `PUT /gemini-key`, `DELETE /gemini-key`, `GET /gemini-key/status` - Gemini 키 관리
- `PUT /kis-credentials`, `DELETE /kis-credentials`, `GET /kis-credentials/status` - KIS 키 관리

### 주식 (`/api/stock`)
- `GET /{ticker}` - 주식 데이터 (include_technical, include_chart 옵션)
- `GET /{ticker}/news` - 뉴스
- `POST /{ticker}/analysis/summary` - AI 요약 생성 (Gemini)
- `POST /{ticker}/analysis/save` - 분석 저장
- `GET /{ticker}/analysis/latest`, `GET /{ticker}/analysis/history` - 분석 조회
- `GET /analysis/all` - 전체 분석 조회
- `DELETE /{ticker}/analysis`, `DELETE /analysis/{id}` - 분석 삭제

### 포트폴리오 (`/api/portfolio`)
- `GET /`, `POST /`, `PUT /{ticker}`, `DELETE /{ticker}` - CRUD

### 경제 지표 (`/api/economic`)
- `GET /?country=us|kr|all` - 경제 지표 (include_history 옵션)
- `GET /status` - 지표 상태/판단
- `GET /sectors` - 섹터 ETF (GICS 11개, 1D/1W/1M)
- `GET /sectors/{symbol}/holdings` - 섹터 보유종목 (KIS 키 필요)
- `GET /market-cycle` - 시장 사이클 (4계절)
- `GET /market-cycle/analysis` - 시장 사이클 + AI (Admin)
- `GET /market-review/{country}` - 마감 리뷰 (KR/US)
- `POST /market-review/ai` - AI 마감 인사이트

### 관리자 (`/api/admin`)
- `GET /users`, `GET /users/pending` - 사용자 목록/대기
- `PUT /users/{id}/approve`, `PUT /users/{id}/reject`, `PUT /users/{id}/deactivate` - 상태 변경
- `DELETE /users/{id}` - 삭제
- `GET /system/log-level`, `PUT /system/log-level` - 로그 레벨 관리

## DB 스키마

### UserDB
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | PK | |
| username | VARCHAR(50), UNIQUE | |
| password_hash | VARCHAR(255) | bcrypt |
| role | VARCHAR(20) | 'user' \| 'admin' |
| is_approved | BOOLEAN | Admin 승인 여부 |
| gemini_api_key | VARCHAR(255), NULL | 유저별 Gemini 키 |
| kis_app_key_encrypted | TEXT, NULL | Fernet 암호화 |
| kis_app_secret_encrypted | TEXT, NULL | Fernet 암호화 |

### PortfolioDB
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | PK | |
| user_id | FK → User | |
| ticker | VARCHAR(10) | UNIQUE(user_id, ticker) |
| display_name | VARCHAR(50), NULL | 한글 이름 |
| purchase_price | NUMERIC(10,2) | |
| quantity | INTEGER | |
| profit_percent | NUMERIC(10,2) | 수익률 |

### StockAnalysisDB
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | PK | |
| user_id | FK → User | INDEX(user_id, ticker) |
| ticker | VARCHAR(10) | |
| summary | TEXT | 3줄 요약 |
| strategy | VARCHAR(20) | 'buy' \| 'hold' \| 'sell' |
| full_report | TEXT, NULL | 전체 마크다운 보고서 |

## 참고 문서

- **디자인 시스템**: `docs/DESIGN_SYSTEM.md` — Indigo #6366F1, Lucide React, 4배수 스페이싱
- **UX 가이드**: `docs/UX_GUIDELINES.md` — 초보자용 메타포 규칙
- **변경 이력**: `.claude/CHANGELOG.md`
