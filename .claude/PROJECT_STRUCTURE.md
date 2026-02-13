# 프로젝트 구조

> 최종 업데이트: 2026-02-13 (증시 마감 리뷰 버그 수정 및 개선)

## 전체 아키텍처

```
stock/
├── frontend/          # React + TypeScript + Vite
├── backend/           # FastAPI + Python
├── nginx/             # Nginx Reverse Proxy + SSL 설정
├── docs/              # 문서
├── data/              # 데이터 파일
└── .claude/           # Claude 설정 및 문서
```

## 기술 스택

### Frontend
- **프레임워크**: React 19.2, TypeScript 5.9
- **빌드 도구**: Vite 7.2
- **UI 라이브러리**:
  - Radix UI (헤드리스 컴포넌트)
  - Tailwind CSS 4.1 (스타일링)
  - Lucide React (아이콘)
- **상태 관리**: TanStack Query 5.90
- **라우팅**: React Router 7.13
- **차트**: Recharts 2.15
- **기타**:
  - DnD Kit (드래그앤드롭)
  - Zod (스키마 검증)
  - Axios (HTTP 클라이언트)

### Backend
- **프레임워크**: FastAPI 0.109
- **서버**: Uvicorn 0.27
- **데이터베이스**: SQLAlchemy 2.0+
- **인증**:
  - python-jose (JWT)
  - passlib + bcrypt (비밀번호 해싱)
- **주식 데이터**: yahooquery 2.4.1
- **경제 지표**:
  - fredapi 0.5.2 (미국 FRED API)
  - requests (한국 ECOS API, 한국은행 경제통계시스템)
- **AI 분석**: Google Generative AI 0.8.3 (Gemini)
- **번역**: deep-translator 1.11.4
- **기타**:
  - pandas, numpy (데이터 처리)
  - pydantic (데이터 검증)

### 배포 및 SSL
- **컨테이너**: Docker + Docker Compose
- **리버스 프록시**: Nginx Alpine
- **SSL 인증서**: Let's Encrypt (Certbot)
- **자동 갱신**: Certbot 컨테이너 (12시간마다 체크)
- **환경 분리**: 개발(dev), 프로덕션(ssl)

## 디렉토리 구조

### Frontend

```
frontend/
├── src/
│   ├── components/           # React 컴포넌트
│   │   ├── admin/           # 관리자 페이지 컴포넌트
│   │   ├── auth/            # 인증 관련 컴포넌트
│   │   ├── economic/        # 경제 지표 관련 컴포넌트
│   │   │   ├── EconomicChartView.tsx    # Chart 뷰 메인 레이아웃
│   │   │   ├── IndicatorListPanel.tsx   # 좌측 지표 목록
│   │   │   ├── DetailChart.tsx          # 메인 차트 (기간 선택)
│   │   │   ├── StatusGauge.tsx          # 판단 기준 게이지
│   │   │   ├── CompareSelector.tsx      # 비교 지표 선택
│   │   │   ├── SectorHeatmap.tsx        # 섹터 히트맵 (GICS 11개 섹터)
│   │   │   ├── SectorDetail.tsx         # 섹터 상세 모달 (보유종목 트리맵)
│   │   │   └── MarketReview/            # 증시 마감 리뷰 (신규)
│   │   │       ├── MarketReviewSection.tsx  # 메인 컨테이너
│   │   │       ├── IndexSummary.tsx         # 지수 마감 카드
│   │   │       ├── TopMoversCard.tsx        # 급등/급락 종목
│   │   │       ├── MajorStocksCard.tsx      # 시총 Top 5
│   │   │       ├── SectorSummary.tsx        # 섹터 등락 요약
│   │   │       └── AIInsightCard.tsx        # AI 분석 카드
│   │   ├── layout/          # 레이아웃 컴포넌트
│   │   │   ├── TopNav.tsx       # 상단 네비게이션 (ThemeToggle 포함)
│   │   │   ├── PageHeader.tsx   # 공통 페이지 헤더
│   │   │   ├── PageContainer.tsx # 공통 콘텐츠 컨테이너
│   │   │   └── index.ts
│   │   ├── pages/           # 페이지 컴포넌트 (신규)
│   │   │   ├── HomePage.tsx       # Economic 페이지 (기본)
│   │   │   ├── PortfolioPage.tsx  # 포트폴리오 페이지
│   │   │   └── index.ts
│   │   ├── settings/        # 설정 페이지 컴포넌트
│   │   ├── ui/              # 재사용 가능한 UI 컴포넌트 (shadcn/ui)
│   │   ├── AppLayout.tsx    # 앱 레이아웃
│   │   ├── Dashboard.tsx    # 대시보드 (레거시, PortfolioPage로 이동됨)
│   │   ├── MainTabs.tsx     # 주식별 탭 (5개: Overview, AI, Chart, Technical, News)
│   │   ├── StockChart.tsx   # 주식 차트
│   │   ├── Sidebar.tsx      # 티커 목록 사이드바
│   │   └── ...
│   ├── hooks/               # 커스텀 훅
│   │   ├── usePortfolio.ts  # 포트폴리오 데이터 관리 훅
│   │   └── index.ts
│   ├── contexts/            # React Context (테마, 인증 등)
│   ├── lib/                 # 라이브러리 설정
│   ├── types/               # TypeScript 타입 정의
│   ├── utils/               # 유틸리티 함수
│   ├── assets/              # 정적 리소스
│   ├── App.tsx              # 앱 루트 (TopNav + 페이지 라우팅)
│   └── main.tsx             # 엔트리 포인트
├── public/                  # 정적 파일 (favicon 등)
├── index.html               # HTML 템플릿
├── vite.config.ts           # Vite 설정
├── tailwind.config.js       # Tailwind 설정
└── package.json             # npm 의존성
```

**페이지 구조** (TopNav 기반):
```
App.tsx
├── TopNav (상단 네비게이션)
│   ├── Economic (기본 페이지)
│   ├── Portfolio
│   ├── Settings
│   └── Admin (관리자만)
└── Pages
    ├── HomePage (EconomicIndicators)
    ├── PortfolioPage (Sidebar + MainTabs)
    ├── SettingsPage
    └── AdminPage
```

**주요 컴포넌트**:
- **페이지 컴포넌트**:
  - `pages/HomePage.tsx` - Economic 페이지 (기본 페이지, EconomicIndicators 래핑)
  - `pages/PortfolioPage.tsx` - 포트폴리오 페이지 (Sidebar + MainTabs)
- **레이아웃 컴포넌트**:
  - `layout/TopNav.tsx` - 상단 네비게이션 (페이지 전환 + ThemeToggle + 로그아웃)
  - `layout/PageHeader.tsx` - 공통 페이지 헤더 (타이틀, 설명, 액션 버튼)
  - `layout/PageContainer.tsx` - 공통 콘텐츠 컨테이너 (스크롤, 패딩, 중앙 정렬)
- **커스텀 훅**:
  - `hooks/usePortfolio.ts` - 포트폴리오 데이터 관리 (상태 + 액션 분리)
- **경제 지표 컴포넌트**:
  - `EconomicIndicators.tsx` - 경제 지표 대시보드 (서브탭: 경제 지표/섹터 히트맵)
  - `economic/EconomicChartView.tsx` - Chart 뷰 메인 레이아웃
  - `economic/IndicatorListPanel.tsx` - 좌측 지표 목록 (카테고리별 그룹핑)
  - `economic/DetailChart.tsx` - 메인 차트 (기간 선택)
  - `economic/StatusGauge.tsx` - 판단 기준 (기준값 리스트, YoY 변화율 표시)
  - `economic/CompareSelector.tsx` - 비교 지표 선택 (멀티 차트)
  - `economic/SectorHeatmap.tsx` - 섹터 히트맵 (GICS 11개 섹터, 1D/1W/1M)
  - `economic/SectorDetail.tsx` - 섹터 상세 모달 (보유종목 트리맵, 초보자 설명)
- **주식 컴포넌트**:
  - `MainTabs.tsx` - 주식별 탭 (5개: Overview, AI, Chart, Technical, News)
  - `StockChart.tsx` - 주식 차트 (Recharts 사용)
  - `CategoryMetrics.tsx` - 카테고리별 메트릭
  - `Sidebar.tsx` - 티커 목록 사이드바 (Portfolio 페이지에서 사용)

### Backend

```
backend/
├── app/
│   ├── api/
│   │   └── routes/          # API 엔드포인트
│   │       ├── admin.py     # 관리자 API
│   │       ├── auth.py      # 인증 API
│   │       ├── health.py    # 헬스체크
│   │       ├── portfolio.py # 포트폴리오 API
│   │       ├── stock.py     # 주식 데이터 API
│   │       ├── economic.py  # 경제 지표 API
│   │       └── secret_stats.py  # Secret Manager 캐시 통계 API
│   ├── database/            # 데이터베이스 설정
│   ├── models/              # SQLAlchemy 모델
│   │   ├── user.py          # 사용자 모델
│   │   ├── stock.py         # 주식 모델
│   │   ├── portfolio.py     # 포트폴리오 모델
│   │   └── economic.py      # 경제 지표 모델
│   ├── services/            # 비즈니스 로직
│   │   ├── auth_service.py  # 인증 서비스
│   │   ├── stock_service.py # 주식 데이터 서비스
│   │   ├── technical_indicators.py  # 기술적 지표 계산
│   │   ├── mock_data.py     # 목 데이터 생성
│   │   ├── economic_service.py  # 경제 지표 서비스 (yahooquery, 6개월 히스토리)
│   │   ├── fred_service.py  # FRED API 서비스 (CPI, M2, YoY 계산)
│   │   ├── indicator_status.py  # 지표 상태 판단 로직 (YoY 변화율 기반)
│   │   └── sector_service.py    # 섹터 ETF 서비스 (GICS 11개 섹터, 5분 캐싱)
│   ├── utils/               # 유틸리티
│   │   └── secret_manager.py    # GCP Secret Manager 클라이언트 (캐싱 포함)
│   ├── config.py            # 앱 설정
│   ├── main.py              # FastAPI 앱 엔트리
│   └── __init__.py
├── migrations/              # 데이터베이스 마이그레이션
├── requirements.txt         # Python 의존성
└── Dockerfile               # Docker 이미지
```

**주요 모듈**:
- `main.py` - FastAPI 앱 초기화, CORS 설정, 라우터 등록
- `config.py` - 환경 변수, 로깅, 데이터베이스 설정
- `api/routes/stock.py` - 주식 데이터 조회, AI 분석 API
- `api/routes/auth.py` - 회원가입, 로그인, 토큰 발급
- `services/stock_service.py` - yahooquery를 사용한 주식 데이터 조회
- `services/technical_indicators.py` - RSI, MACD 등 기술적 지표 계산

### Nginx

```
nginx/
├── nginx.conf               # Nginx 설정 (리버스 프록시, SSL)
├── certbot-init.sh          # SSL 인증서 초기 발급 스크립트
├── README.md                # SSL 설정 가이드
└── certs/                   # 자체 서명 인증서 (개발용, Git 제외)
    ├── server.crt
    └── server.key
```

**주요 기능**:
- **리버스 프록시**: Frontend(80) + Backend(8000) → 단일 도메인 통합
- **SSL Termination**: HTTPS 복호화를 Nginx에서 처리, 내부는 HTTP 통신
- **HTTP → HTTPS 리디렉션**: 모든 HTTP 요청을 HTTPS로 자동 리디렉션
- **Let's Encrypt 통합**: ACME Challenge 처리 (/.well-known/acme-challenge/)
- **보안 헤더**: HSTS, X-Frame-Options, X-Content-Type-Options 등
- **Rate Limiting**: API 10req/s, 일반 30req/s로 DDoS 방지
- **Gzip 압축**: 텍스트 기반 리소스 압축으로 대역폭 절약

### Docker Compose

프로젝트는 3가지 Docker Compose 파일로 환경을 분리합니다:

```
docker-compose.yml          # 기본 설정
docker-compose.override.yml # 프로덕션 환경 (SSL) - 자동 적용
docker-compose.dev.yml      # 로컬 개발 환경 (Hot Reload)
```

#### 개발 환경 실행

```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

**특징**:
- Hot Reload 활성화 (소스 코드 마운트)
- Frontend: Vite Dev Server (5173 포트)
- Backend: Uvicorn --reload (8000 포트)
- 환경: `ENVIRONMENT=development`

#### 프로덕션 환경 실행

```bash
docker compose up -d --build
```

**특징**:
- `docker-compose.override.yml` 자동 적용 (명시적 지정 불필요)
- 로컬 빌드 사용
- Nginx 리버스 프록시 (80, 443 포트)
- Let's Encrypt SSL 인증서 자동 발급/갱신
- Backend/Frontend 외부 노출 포트 제거 (Nginx 통해서만 접근)
- Certbot 자동 갱신 컨테이너 (12시간마다 체크)
- HTTPS Only (HTTP는 HTTPS로 리디렉션) (HTTP는 HTTPS로 리디렉션)

**컨테이너 목록**:
- `stock-backend`: FastAPI (8000, 내부만)
- `stock-frontend`: Nginx 정적 파일 (80, 내부만)
- `stock-nginx`: 리버스 프록시 (80, 443, 외부 노출)
- `stock-certbot`: SSL 인증서 관리

**Docker 볼륨**:
- `certbot-etc`: Let's Encrypt 인증서
- `certbot-var`: Certbot 데이터
- `certbot-www`: ACME Challenge 응답

## 데이터 흐름

### 주식 데이터 조회 플로우

```
Frontend (Dashboard)
    ↓ (Axios GET /api/stock/{ticker})
Backend (stock.py router)
    ↓
StockService.get_stock_data()
    ↓ (yahooquery API)
Yahoo Finance
    ↓
Technical Indicators 계산
    ↓
Gemini AI 분석 (선택적)
    ↓
JSON 응답
    ↓
Frontend (차트 렌더링)
```

### 인증 플로우

```
Frontend (Login Form)
    ↓ (POST /api/auth/login)
Backend (auth.py router)
    ↓
AuthService.authenticate()
    ↓ (DB 조회)
SQLAlchemy (User model)
    ↓ (비밀번호 검증)
JWT Token 생성
    ↓
Frontend (토큰 저장)
    ↓
이후 요청 시 Authorization 헤더에 포함
```

## 주요 기능

### Frontend
1. **대시보드**
   - 포트폴리오 요약
   - 카테고리별 메트릭
   - 실시간 차트

2. **주식 차트**
   - Recharts를 사용한 인터랙티브 차트
   - 기술적 지표 오버레이

3. **설정**
   - 테마 전환 (다크/라이트)
   - 사용자 프로필 관리

4. **인증**
   - 회원가입/로그인
   - JWT 토큰 기반 인증

### Backend
1. **주식 데이터 API**
   - 실시간 주가 조회
   - 과거 데이터 조회
   - 기술적 지표 계산 (RSI, MACD, SMA, EMA, 볼린저밴드)

2. **AI 분석**
   - Gemini를 사용한 주식 분석
   - 뉴스 감성 분석

3. **포트폴리오 관리**
   - 포트폴리오 CRUD
   - 수익률 계산

4. **사용자 관리**
   - JWT 기반 인증
   - bcrypt 비밀번호 해싱

5. **경제 지표 API**
   - **미국 지표**:
     - 금리: 미국채 10년물 (^TNX), 3개월 T-Bill (^IRX)
     - 변동성: VIX (^VIX)
     - 거시경제: CPI (CPIAUCSL), M2 통화량 (M2SL) - FRED API
     - 원자재: WTI 원유 (CL=F), 금 (GC=F)
   - **한국 지표** (2026-02-08 추가):
     - 금리: 국고채 10년물 (KR_BOND_10Y), 기준금리 (KR_BASE_RATE) - ECOS API (일간)
     - 신용 스프레드: 회사채-국고채 금리 차이 (KR_CREDIT_SPREAD) - ECOS API (일간)
     - 거시경제: CPI (KR_CPI), M2 통화량 (KR_M2) - ECOS API (월간)
     - 환율: 원/달러 환율 (KRW=X) - Yahoo Finance (일간)
   - **히스토리 데이터**:
     - Yahoo: 6개월 (일간 데이터, period="6mo")
     - FRED: 최근 30개 데이터 포인트 (월간)
     - ECOS: 일간 200개 (약 7~8개월), 월간 30개 (약 2.5년)
     - **ECOS API 페이징**: `/1/10000/` (최대 10,000개 조회)
   - **상태 판단**:
     - FRED/ECOS: YoY 변화율 기반 (CPI: 1.5-2.5% 좋음, M2: 4-8% 좋음)
     - Yahoo: 절대값 기반 (금리, VIX, 원자재, 환율)
     - 한국 금리: KR_BOND_10Y(<3%), KR_BASE_RATE(<2.5%), KR_CREDIT_SPREAD(<0.5%p)
   - **Chart 뷰** (2026-02-08 완성):
     - **데이터 주기 구분**:
       - 월간: FRED(CPI, M2), ECOS(KR_CPI, KR_M2, KR_INDPRO, KR_EXPORT)
       - 일간: Yahoo(금리, 원자재, 환율), ECOS(KR_BOND_10Y, KR_BASE_RATE, KR_CREDIT_SPREAD)
     - **기간 필터링**:
       - 월간 데이터: 3M/6M/1Y/ALL (데이터 포인트 개수 기준)
       - 일간 데이터: 1W/1M/3M/6M (날짜 기준)
     - **판단 기준**: 기준값 리스트 + 현재값 표시 게이지
     - **지표 비교**: 멀티 라인 차트 (최대 5개)
   - **국가 선택**: 미국/한국/전체 탭으로 전환

## 환경 변수

### Frontend (.env)
```
VITE_API_URL=http://localhost:8000
```

### Backend (.env)
```
DATABASE_URL=sqlite:///./data/stock.db
SECRET_KEY=your-secret-key
GEMINI_API_KEY=your-gemini-api-key
FRED_API_KEY=your-fred-api-key  # 미국 경제 지표용 (선택)
ECOS_API_KEY=your-ecos-api-key  # 한국 경제 지표용 (선택)
LOG_LEVEL=INFO

# 🔐 GCP Secret Manager (선택적, 보안 강화)
USE_SECRET_MANAGER=false  # true로 설정 시 Secret Manager 사용
GCP_PROJECT_ID=your-gcp-project-id

# 로컬 환경: USE_SECRET_MANAGER=false (기본값)
# GCP Cloud 환경 (GCE/Cloud Run/GKE): USE_SECRET_MANAGER=true
# GCP Cloud 환경에서는 자격증명 파일 불필요 (Workload Identity/Metadata Server 자동 사용)
```

### SSL 프로덕션 환경 (.env)

`.env.production.example` 참조:

```bash
# 도메인 설정 (필수)
DOMAIN=example.com
SSL_EMAIL=admin@example.com

# 서버 설정
SERVER_IP=0.0.0.0
ENVIRONMENT=production

# 무료 도메인 발급:
#   - Freenom: https://www.freenom.com (.tk, .ml, .ga, .cf, .gq)
#   - DuckDNS: https://www.duckdns.org (서브도메인)
#   - No-IP: https://www.noip.com (Dynamic DNS)
```

**보안 계층 구분** (2026-02-09 추가):
- **🔴 높은 보안** (Secret Manager 권장): GEMINI_API_KEY, KIS_APP_KEY, KIS_APP_SECRET, JWT_SECRET_KEY, ENCRYPTION_KEY, ADMIN_PASSWORD
- **🟢 낮은 보안** (.env 유지): FRED_API_KEY, ECOS_API_KEY (무료 API)

**GCP 인증 방식** (2026-02-10 추가):
- **로컬 환경**: `USE_SECRET_MANAGER=false` + `.env` 파일 사용
- **GCP Cloud 환경**: `USE_SECRET_MANAGER=true` + Workload Identity 자동 인증
- **자격증명 파일 불필요**: `docker-compose.yml`에서 `GOOGLE_APPLICATION_CREDENTIALS` 및 `gcp-credentials.json` 마운트 제거됨

## 개발 서버 실행

### Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
# → http://localhost:8000
```

## API 엔드포인트

### 인증
- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `GET /api/auth/me` - 현재 사용자 정보

### 주식
- `GET /api/stock/{ticker}` - 주식 데이터 조회
- `GET /api/stock/{ticker}/analysis` - AI 분석

### 포트폴리오
- `GET /api/portfolio` - 포트폴리오 목록
- `POST /api/portfolio` - 포트폴리오 생성
- `PUT /api/portfolio/{id}` - 포트폴리오 수정
- `DELETE /api/portfolio/{id}` - 포트폴리오 삭제

### 관리자
- `GET /api/admin/users` - 사용자 목록
- `DELETE /api/admin/users/{id}` - 사용자 삭제

### 경제 지표
- `GET /api/economic?country=us` - 미국 경제 지표 조회 (기본값)
- `GET /api/economic?country=kr` - 한국 경제 지표 조회
- `GET /api/economic?country=all` - 미국+한국 통합 조회
- `GET /api/economic?include_history=true` - 히스토리 포함 (Yahoo: 6개월, FRED: 30개월, ECOS: 13개월)
- `GET /api/economic/status` - API 상태 확인 (FRED, Yahoo, ECOS)
- `GET /api/economic/sectors` - 섹터 ETF 성과 (GICS 11개 섹터, 1D/1W/1M 변화율)
- `GET /api/economic/sectors/{symbol}/holdings` - 섹터 보유종목 상세 (상위 10개, DB 캐시)
- `GET /api/economic/market-cycle` - 시장 사이클 조회 (일반 사용자)
- `GET /api/economic/market-cycle/analysis` - 시장 사이클 + AI 분석 (Admin 전용)

### Secret Manager (2026-02-09 추가)
- `GET /api/secret-stats/cache-stats` - Secret Manager 캐시 통계 조회
- `POST /api/secret-stats/clear-cache` - Secret Manager 캐시 초기화

## 데이터베이스 스키마

### User (사용자)
- id (PK, AUTOINCREMENT)
- username (VARCHAR(50), NOT NULL, UNIQUE)
- password_hash (VARCHAR(255), NOT NULL)
- role (VARCHAR(20), NOT NULL, DEFAULT 'user') - 'user' | 'admin'
- is_active (BOOLEAN, DEFAULT TRUE)
- is_approved (BOOLEAN, DEFAULT FALSE) - Admin 승인 여부
- gemini_api_key (VARCHAR(255), NULL) - 유저별 Gemini API 키
- created_at (DATETIME, DEFAULT CURRENT_TIMESTAMP)
- updated_at (DATETIME, DEFAULT CURRENT_TIMESTAMP)

### Stock (주식)
- id (PK)
- ticker (UNIQUE)
- company_name
- sector
- last_price
- date_updated

### Portfolio (포트폴리오)
- id (PK)
- user_id (FK → User, NOT NULL) - 2026-02-06 추가
- ticker (VARCHAR(10), NOT NULL)
- quantity (INTEGER)
- purchase_price (NUMERIC(10, 2))
- purchase_date (DATE)
- notes (TEXT)
- last_price (NUMERIC(10, 2)) - 마지막 조회 현재가
- profit_percent (NUMERIC(10, 2)) - 수익률
- last_updated (DATETIME) - 마지막 업데이트 시각
- created_at (DATETIME, DEFAULT CURRENT_TIMESTAMP)
- updated_at (DATETIME, DEFAULT CURRENT_TIMESTAMP)
- UNIQUE (user_id, ticker) - 사용자당 티커 중복 방지

## 디자인 시스템

모든 UI 작업은 `docs/DESIGN_SYSTEM.md` 참조:
- Primary Color: Indigo (#6366F1)
- 아이콘: Lucide React only
- 스페이싱: 4의 배수
- 애니메이션: GPU 가속 속성 (transform, opacity)

## 참고 문서

- **AI 협업 지침**: `.claude/AI_COLLABORATION_GUIDE.md`
- **디자인 시스템**: `docs/DESIGN_SYSTEM.md`
- **프로젝트 가이드**: `CLAUDE.md`

## 최근 변경 이력

### 2026-02-13: 증시 마감 리뷰 버그 수정 및 개선

1. **pykrx fallback 코드 제거**
   - `services/market_review_service.py` 수정
     - 한국 급등/급락 조회: pykrx fallback 코드 완전 제거
     - KIS Open API만 사용 (자격 증명 없으면 빈 배열 반환)
     - 로그 레벨 변경: WARNING → DEBUG (자격 증명 없음 로그)

2. **Admin Fallback 패턴 적용**
   - `api/routes/economic.py` 수정
     - Admin 사용자: 환경변수 KIS 키 사용 (heatmap 패턴과 동일)
     - 일반 사용자: DB에 저장된 개인 KIS 키 사용
     - Gemini 분석도 Admin 설정 값 사용

3. **미국 급등/급락 데이터 개선**
   - `services/market_review_service.py` 수정
     - 기존: 하드코딩된 16개 심볼에서 정렬 (부정확)
     - 변경: Yahoo Finance Screener API 사용 (`day_gainers`, `day_losers`)
     - 실제 당일 급등/급락 Top 5 조회

4. **Gemini 모델명 수정**
   - `services/market_review_service.py` 수정
     - 기존: `"gemini-1.5-flash"` (404 에러 발생)
     - 변경: `"models/gemini-flash-latest"` (stock_service.py와 통일)

5. **마감 리뷰 탭 UI 통일**
   - `EconomicIndicators.tsx` 수정
     - `reviewCountry` 상태 추가
     - SubTabHeader에 국가 선택 탭 추가 (경제 지표/섹터 히트맵과 동일)
     - 국가 미선택 시 안내 화면 표시
   - `MarketReviewSection.tsx` 수정
     - props로 `country` 받도록 변경 (내부 상태 제거)
     - 새로고침 버튼 헤더로 이동

6. **AI 분석 에러 처리 개선**
   - `AIInsightCard.tsx` 수정
     - AI 분석 실패 시 샘플 데이터 대신 에러 표시
     - API 키 없는 경우: Key 아이콘 + "Gemini API 키가 필요합니다" + 설정 안내
     - 일반 에러: AlertCircle 아이콘 + "AI 분석 실패" + 재시도 버튼
     - PortfolioPage AI 에러 디자인과 통일

### 2026-02-11: Docker Compose 구조 통합 (override.yml 패턴)

1. **Docker Compose 파일 통합**
   - `docker-compose.override.yml` 신규 생성
     - SSL 설정
     - Nginx 리버스 프록시 컨테이너 추가
     - Certbot 자동 갱신 컨테이너 추가
     - Backend/Frontend 외부 포트 제거 (Nginx 통해서만 접근)
     - `docker compose up -d` 실행 시 자동 적용 (명시적 -f 옵션 불필요)
   - `docker-compose.prod.yml` 삭제 → override.yml로 병합
   - `docker-compose.ssl.yml` 삭제 → override.yml로 병합

2. **Nginx 설정 파일 생성**
   - `nginx/nginx.conf` 신규 생성
     - HTTP → HTTPS 리디렉션
     - Let's Encrypt ACME Challenge 처리
     - SSL Termination (TLS 1.2/1.3)
     - 보안 헤더 (HSTS, X-Frame-Options 등)
     - Rate Limiting (API 10req/s, 일반 30req/s)
     - Gzip 압축 활성화
     - Backend(/api), Frontend(/) 프록시 설정

3. **SSL 인증서 자동 발급 스크립트**
   - `nginx/certbot-init.sh` 신규 생성
     - DNS 확인 → Nginx 시작 → 인증서 발급 → 설정 업데이트 → 재시작
     - docker-compose.override.yml 자동 감지 지원
     - 사용자 친화적 컬러 출력 및 에러 처리
     - nginx.conf에서 SSL 경로 자동 주석 해제

4. **환경 변수 템플릿**
   - `.env.production.example` 신규 생성
     - DOMAIN, SSL_EMAIL 설정 (Let's Encrypt 필수)
     - 무료 도메인 발급 사이트 안내 (Freenom, DuckDNS, No-IP)
     - API 키 보안 계층 구분 (Secret Manager vs .env)

5. **문서화**
   - `nginx/README.md` 신규 생성 (25페이지)
   - `SETUP_SSL.md` 신규 생성 (40페이지)
   - `DOCKER_STRUCTURE.md` 신규 생성 (35페이지)
     - 3개 파일 구조 설명 (yml, override.yml, dev.yml)
     - override.yml 자동 적용 메커니즘 설명
     - 시나리오별 사용법 (프로덕션, 로컬 개발, 기본 테스트)

6. **.gitignore 업데이트**
   - SSL 인증서 파일 제외 (*.crt, *.key, *.pem, nginx/certs/)
   - Nginx 백업 파일 제외 (*.backup, *.bak)
   - `docker-compose.override.yml` 추적 (이전 제외 규칙 제거)

7. **아키텍처 특징**
   - **환경 분리**:
     - 로컬 개발: docker-compose.dev.yml (명시적 지정 필요, Hot Reload)
     - 프로덕션: docker-compose.override.yml (자동 적용, SSL)
   - **자동 SSL 갱신**:
     - Certbot 컨테이너가 12시간마다 인증서 만료 체크
     - 만료 30일 이내 시 자동 갱신
     - Nginx 자동 재로드
   - **보안 강화**:
     - TLS 1.2/1.3만 허용
     - 안전한 암호화 스위트 (Mozilla Intermediate 기준)
     - HSTS, OCSP Stapling 지원
   - **클라우드 친화적**:
     - 환경 변수로 도메인 설정 (하드코딩 없음)
     - Docker 볼륨으로 인증서 영속성 보장
     - GCP, AWS, Oracle Cloud 등 다양한 클라우드 지원

8. **무료 도메인 옵션**
   - **Freenom**: .tk, .ml, .ga, .cf, .gq (12개월 무료)
   - **DuckDNS**: 서브도메인 무료 (예: mystock.duckdns.org)
   - **No-IP**: Dynamic DNS 무료

9. **비용 분석**
    - SSL 인증서: $0 (Let's Encrypt 무료)
    - 도메인: $0 (무료 도메인 사용 시)
    - 클라우드: $0 (Oracle Cloud Always Free 또는 크레딧 사용)
    - **총 비용: $0 (완전 무료 운영 가능)** ✅

### 2026-02-10: GCP Cloud 환경 Secret Manager 설정 개선

1. **Docker Compose 설정 수정**
   - `docker-compose.yml` 수정
     - `GOOGLE_APPLICATION_CREDENTIALS` 환경 변수 제거
     - `gcp-credentials.json` 볼륨 마운트 제거
     - GCP Cloud 환경 설명 주석 추가
   - **문제**: Secret Manager 초기화 오류 (`[Errno 21] Is a directory: '/app/gcp-credentials.json'`)
   - **원인**: 로컬에 `gcp-credentials.json` 파일이 없으면 Docker가 빈 디렉토리를 자동 생성, Google Cloud SDK가 이를 파일로 읽으려다 오류 발생
   - **해결**: GCP Cloud 환경에서는 Workload Identity/Metadata Server를 통한 자동 인증 사용, 자격증명 파일 마운트 불필요

2. **.env.example 업데이트**
   - 로컬 vs GCP Cloud 환경 구분 설명 추가
   - Secret Manager 사용법 명시
     - 로컬: `USE_SECRET_MANAGER=false` (기본값)
     - GCP Cloud (GCE/Cloud Run/GKE): `USE_SECRET_MANAGER=true`
   - 자격증명 파일 불필요 안내 추가

3. **GCP 인증 방식**
   - **로컬 환경**: `.env` 파일 사용
   - **GCP Cloud 환경**: Workload Identity (GKE) 또는 Metadata Server (GCE/Cloud Run) 자동 인증
   - **Application Default Credentials (ADC)**: `google-cloud-secret-manager` 라이브러리가 자동으로 ADC 사용

4. **장애 대응력 향상**
   - Secret Manager 실패 시 자동으로 `.env` fallback
   - 자격증명 파일 관련 오류 원천 차단
   - 무중단 서비스 보장

### 2026-02-09: GCP Secret Manager 통합 및 API 키 보안 강화

1. **GCP Secret Manager 클라이언트 구현**
   - `backend/app/utils/secret_manager.py` 신규 생성
     - `SecretCache` 클래스: TTL 기반 메모리 캐싱 (기본 1시간)
     - `SecretManagerClient` 클래스: 싱글톤 패턴, GCP Secret Manager 연동
     - `get_secret()` 함수: 캐시 우선 조회 → Secret Manager → Fallback (.env)
     - 캐시 통계 추적 (hits, misses, hit_rate, api_calls)
   - `backend/app/api/routes/secret_stats.py` 신규 생성
     - `GET /api/secret-stats/cache-stats`: 캐시 성능 모니터링
     - `POST /api/secret-stats/clear-cache`: 캐시 강제 초기화

2. **보안 계층 구분**
   - **🔴 높은 보안** (Secret Manager): 6개 시크릿
     - `gemini-api-key`, `kis-app-key`, `kis-app-secret`
     - `jwt-secret-key`, `encryption-key`, `admin-password`
   - **🟢 낮은 보안** (.env 유지): 2개
     - `FRED_API_KEY`, `ECOS_API_KEY` (무료 API, 탈취 영향 적음)

3. **Backend 통합**
   - `backend/app/config.py` 수정
     - `USE_SECRET_MANAGER` 환경 변수로 조건부 활성화
     - Secret Manager 사용 시: `get_secret()` 호출 (캐싱 적용)
     - 비활성화 시: `os.getenv()` 사용 (기존 방식)
   - `backend/app/main.py` 수정
     - `secret_stats` 라우터 등록
   - `backend/requirements.txt` 수정
     - `google-cloud-secret-manager>=2.16.0` 추가

4. **Docker 통합**
   - `docker-compose.yml` 수정
     - `USE_SECRET_MANAGER`, `GCP_PROJECT_ID` 환경 변수 추가
     - `GOOGLE_APPLICATION_CREDENTIALS` 설정
     - `gcp-credentials.json` 볼륨 마운트 (읽기 전용)
   - `.gitignore` 수정
     - `gcp-credentials.json` 제외 (Service Account 키)

5. **설정 스크립트 (멀티 플랫폼)**
   - **Linux/Mac**:
     - `setup_secrets.sh`: GCP 초기 설정 (API 활성화, Service Account, Secret 생성)
     - `update_secrets.sh`: .env 값을 Secret Manager에 업로드
     - `make_executable.sh`: 실행 권한 부여
   - **Windows**:
     - `setup_secrets.ps1`: PowerShell 버전 (영어 메시지, UTF-8 BOM)
     - `update_secrets.ps1`: PowerShell 업데이트 스크립트

6. **문서화** (총 6개, 75페이지)
   - `docs/SECRET_MANAGER_SETUP.md`: 설정 가이드 (15페이지)
   - `docs/SECRET_MANAGER_IMPLEMENTATION.md`: 구현 보고서 (12페이지)
   - `docs/INSTALL_GCLOUD_WINDOWS.md`: Windows 설치 가이드 (10페이지)
   - `docs/INSTALL_GCLOUD_MAC.md`: macOS 설치 가이드 (10페이지)
   - `WINDOWS_SETUP.md`: Windows 빠른 시작 (8페이지)
   - `POWERSHELL_ENCODING_FIX.md`: 인코딩 문제 해결 (5페이지)
   - `.claude/plans/SECRET_MANAGER_IMPLEMENTATION_PLAN.md`: 구현 계획 (20페이지)

7. **성능 최적화**
   - **캐싱 전략**:
     - 컨테이너 시작 시 6회 API 호출 (6개 시크릿 로드)
     - 이후 모든 요청은 메모리 캐시 사용 (API 호출 0회)
     - 예상 캐시 히트율: 97% 이상
   - **API 호출 감소**:
     - Before: 매 요청마다 조회 (50,000회/월)
     - After: 컨테이너 시작 시만 (180회/월)
     - **99.6% 감소**

8. **비용 분석**
   - GCP Secret Manager 무료 티어:
     - Active Secrets: 6개 (무료 한도 6개)
     - Access Operations: ~180회/월 (무료 한도 10,000회, 1.8% 사용)
   - **월 비용: $0 (완전 무료)** ✅

9. **Fallback 메커니즘**
   - Secret Manager 실패 시 자동으로 .env 사용
   - 로컬 개발 환경에서는 `USE_SECRET_MANAGER=false` 설정
   - 운영 환경에서만 Secret Manager 활성화
   - 장애 대응력 향상 (무중단 서비스)

10. **보안 개선 효과**
    - Before: VM 파일 시스템에 평문 API 키 저장 (SSH 접근 시 노출 가능)
    - After:
      - ✅ VM에 평문 키 없음
      - ✅ IAM 기반 접근 제어
      - ✅ 감사 로그 자동 기록 (누가 언제 접근했는지)
      - ✅ 키 버전 관리 (로테이션 이력)
      - ✅ 키 로테이션 자동화 가능

### 2026-02-09: 한국투자증권 API 통합 및 사용자별 KIS 키 인증 시스템 구현

1. **KIS (Korea Investment & Securities) Open API 통합**
   - `services/kis_api_service.py` 신규 생성
     - OAuth2 토큰 발급 (24시간 유효)
     - ETF 구성종목시세 API (TR_ID: FHKST121600C0)
     - 한국 섹터 ETF 실시간 보유종목 조회
     - 토큰 캐싱 (23시간 TTL, 자동 갱신)
   - `services/crypto.py` 신규 생성
     - Fernet 암호화 (symmetric encryption)
     - API 키 암호화/복호화 함수
     - SECRET_KEY 기반 암호화 키 생성
   - 환경 변수 추가 (`config.py`, `.env.example`)
     - `KIS_APP_KEY`: Admin용 한국투자증권 App Key
     - `KIS_APP_SECRET`: Admin용 한국투자증권 App Secret

2. **사용자별 KIS 인증정보 저장**
   - `models/user.py` 수정
     - `kis_app_key_encrypted` 필드 추가 (TEXT, NULL)
     - `kis_app_secret_encrypted` 필드 추가 (TEXT, NULL)
     - 사용자별 암호화된 KIS 키 저장
   - `api/routes/auth.py` 수정
     - `PUT /api/auth/kis-credentials`: KIS 키 저장 (암호화 후 DB 저장)
     - `GET /api/auth/kis-credentials`: KIS 키 상태 조회 (app_key_preview 마스킹 제공)
     - `DELETE /api/auth/kis-credentials`: KIS 키 삭제
   - 인증 패턴
     - Admin: 환경변수 키 사용 (KIS_APP_KEY, KIS_APP_SECRET)
     - 일반 유저: DB 저장된 암호화 키 사용
     - 키 없는 유저: 설정 페이지로 유도 (샘플 데이터 제거)

3. **한국 섹터 ETF 보유종목 실시간 조회**
   - `api/routes/economic.py` 수정
     - `/api/economic/sectors/{symbol}/holdings` 엔드포인트 개선
     - KIS 인증정보 확인 로직 추가
     - 키 없는 경우 `requires_kis_key=True` 반환 (샘플 데이터 제거)
     - 키 있는 경우 KIS API를 통한 실시간 데이터 조회
   - `models/economic.py` 수정
     - `SectorHoldingsResponse`에 `requires_kis_key` 필드 추가
     - KIS API 필요 여부 클라이언트에 전달

4. **Frontend - KIS 키 관리 UI**
   - `components/settings/SettingsPage.tsx` 수정
     - KIS 인증정보 카드 추가
     - App Key + App Secret 입력 폼
     - 비밀번호 토글 버튼 (Eye/EyeOff 아이콘)
     - 저장/삭제 기능
     - 마스킹된 키 프리뷰 표시 (`*****...abcd` 형식)
     - Admin 안내 메시지 (환경변수 키 사용 가이드)
   - `lib/authApi.ts` 수정
     - `updateKISCredentials()`: KIS 키 저장 API
     - `getKISCredentials()`: KIS 키 상태 조회 API
     - `deleteKISCredentials()`: KIS 키 삭제 API
   - `types/auth.ts` 수정
     - `KISCredentialsUpdate`: 키 업데이트 타입
     - `KISCredentialsStatus`: 키 상태 응답 타입

5. **Frontend - KIS 키 체크 로직**
   - `components/economic/SectorDetail.tsx` 수정
     - 한국 섹터 클릭 시 KIS 키 체크
     - `requires_kis_key=true` 수신 시 안내 UI 표시
     - "한국 섹터 ETF 구성종목을 조회하려면 한국투자증권 API 키가 필요합니다" 메시지
     - "설정에서 키 입력하기" 버튼 (Key 아이콘)
     - 버튼 클릭 시 설정 페이지로 이동 (`window.location.href = '/settings'`)
   - Navigation 버그 수정
     - `useNavigate()` 제거 (router context 에러)
     - `window.location.href` 사용으로 변경 (모달에서 페이지 이동)

6. **UI/UX 개선 - 한국 섹터 표시 패턴**
   - `components/economic/SectorHeatmap.tsx` 수정
     - 한국 섹터: 종목명 (메인) → 심볼 (서브)
     - 미국 섹터: 심볼 (메인) → 종목명 (서브)
     - 예: "반도체" (큰 글씨) + "091160.KS" (작은 글씨)
   - `components/economic/SectorDetail.tsx` 수정
     - 트리맵, 툴팁, 보유종목 리스트에 동일 패턴 적용
     - 보유종목 표시: 상위 10개 → 상위 5개로 변경
     - 제목 변경: "상위 10개 종목" → "상위 5개 보유 종목"

7. **Docker 빌드 수정**
   - `components/economic/DetailChart.tsx` 수정
     - `loading?: boolean` prop 추가 (TypeScript 컴파일 에러 해결)
     - `EconomicChartView`에서 `loading={refreshing}` 전달 가능

8. **보안 및 아키텍처**
   - 암호화: Fernet 대칭키 암호화 (SECRET_KEY 기반)
   - 토큰 관리: 메모리 캐싱 (23시간 TTL)
   - 에러 처리: KIS API 오류 시 명확한 에러 메시지 반환
   - 사용자 격리: 사용자별 독립된 KIS 인증정보

9. **한국 섹터 ETF 목록** (KIS API 지원)
   - 091160.KS: KODEX 반도체
   - 091170.KS: KODEX 은행
   - 266360.KS: KODEX 헬스케어
   - 117460.KS: KODEX 에너지화학
   - 091220.KS: KODEX 기계장비
   - 091180.KS: KODEX 자동차
   - 117680.KS: KODEX 건설
   - 140710.KS: KODEX 운송
   - 102970.KS: KODEX 증권

### 2026-02-08: 샘플 페이지 삭제 및 신용 스프레드 적용
1. **샘플 페이지 삭제**
   - `frontend/src/components/economic/KoreaEconomicSample.tsx` 삭제
   - `frontend/src/components/economic/index.ts`에서 export 제거
   - 실제 ECOS API 연동으로 충분하여 샘플 페이지 불필요

2. **VKOSPI → 신용 스프레드로 대체**
   - Yahoo Finance/ECOS에서 VKOSPI 미제공으로 신용 스프레드 사용
   - 신용 스프레드 = 회사채 금리 - 국고채 금리 (시장 불안 온도계)
   - `backend/app/services/korea_economic_service.py`
     - `get_credit_spread()` 함수 추가
     - 회사채 3년물(AA-) - 국고채 3년물 계산
   - `backend/app/services/indicator_status.py`
     - `get_kr_credit_spread_status()` 추가
     - 안정: < 0.5%p, 주의: 0.5-1.0%p, 위험: > 1.0%p
   - `backend/app/models/economic.py`
     - `KoreaRatesData.vkospi` → `credit_spread`로 변경
   - `frontend/src/types/economic.ts`
     - `KoreaRatesData` 타입 수정

3. **ECOS API 타임아웃 증가**
   - 정부 서버 응답 지연 대응
   - `requests.get()` timeout: 10s → 20s
   - `ThreadPoolExecutor` timeout: 15s → 30s

### 2026-02-08: 한국 경제 지표 추가
1. **Backend**
   - `services/korea_economic_service.py` 신규 생성
     - ECOS API 통합 (한국은행 경제통계시스템)
     - Yahoo Finance 한국 지표 (원/달러 환율)
     - 24시간 캐싱 (ECOS), 5분 캐싱 (Yahoo)
   - `models/economic.py`에 한국 지표 모델 추가
     - `KoreaRatesData`, `KoreaMacroData`, `KoreaFxData`
     - `KoreaEconomicData`, `KoreaEconomicResponse`
     - `AllEconomicData`, `AllEconomicResponse` (통합)
   - `services/indicator_status.py`에 한국 지표 상태 판단 추가
     - `get_kr_bond_10y_status()`: < 3.0% 좋음, 3.0-4.0% 주의, > 4.0% 위험
     - `get_kr_base_rate_status()`: < 2.5% 좋음, 2.5-3.5% 주의, > 3.5% 위험
     - `get_kr_credit_spread_status()`: < 0.5%p 안정, 0.5-1.0%p 주의, > 1.0%p 위험
     - `get_kr_cpi_status()`: 1.5-2.5% 좋음, 2.5-4.0% 주의, > 4.0% 위험
     - `get_usd_krw_status()`: 1200-1300 안정, 1300-1400 주의, > 1400 위험
   - `routes/economic.py` 수정
     - `country` 파라미터 추가 (us/kr/all)
     - 미국/한국/통합 조회 분기 처리
   - `config.py`에 `ECOS_API_KEY` 환경 변수 추가

2. **Frontend**
   - `components/economic/CountryTab.tsx` 신규 생성
     - 🇺🇸 미국 / 🇰🇷 한국 / 🌏 전체 탭 UI
   - `components/EconomicIndicators.tsx` 수정
     - `country` 상태 및 `CountryTab` 추가
     - 국가별 데이터 조회 및 렌더링 분기
     - 한국 지표 섹션 (금리, 신용 스프레드, 거시경제, 환율)
   - `types/economic.ts`에 한국 타입 추가
     - `Country`, `KoreaRatesData`, `KoreaMacroData`, `KoreaFxData`
     - `KoreaEconomicData`, `KoreaEconomicResponse`, `AllEconomicData`
   - `components/economic/IndicatorListPanel.tsx` 수정
     - 한국 카테고리/지표 아이콘 추가

3. **한국 지표 목록**
   - 금리: 국고채 10년물 (KR_BOND_10Y), 한국은행 기준금리 (KR_BASE_RATE)
   - 신용 스프레드: 회사채-국고채 금리 차이 (KR_CREDIT_SPREAD)
   - 거시경제: 소비자물가지수 (KR_CPI), M2 통화량 (KR_M2)
   - 환율: 원/달러 환율 (KRW=X)

4. **ECOS API 사전 준비**
   - 발급: https://ecos.bok.or.kr/api/ 가입 후 자동 발급
   - 환경 변수: `ECOS_API_KEY`

### 2026-02-07: 섹터 상세 트리맵 및 초보자 설명 추가
1. **섹터 상세 모달 트리맵 구조로 변경**
   - `SectorDetail.tsx`: 리스트 → 트리맵 시각화로 변경
   - 셀 크기 = 종목 비중, 셀 색상 = 일일 변화율
   - 섹터 히트맵과 동일한 디자인/색상 기준

2. **초보자 친화 설명 추가 (metaphor 스타일)**
   - 각 섹터별 비유 문구: 💻 "미래를 만드는 기업들의 집합소" (XLK)
   - 쉬운 설명: "금리가 오르면 주가가 빠지는 경향이 있어요"
   - 경제지표 탭의 metaphor 스타일과 일관성 유지

3. **섹터 보유종목 DB 캐싱**
   - `SectorHoldingsCacheDB` 모델 추가 (backend/database/models.py)
   - 미국 장 마감 시간(ET 16:00) 기준 캐시 갱신
   - top_holdings만 DB 캐시, 실시간 가격/변화율은 API 호출

4. **Lazy Loading 적용**
   - 경제지표/섹터히트맵 탭 클릭 시에만 데이터 로드
   - `indicatorsLoaded` 상태 플래그로 중복 로딩 방지

### 2026-02-07: 섹터 히트맵 기능 추가
1. **Backend**
   - `services/sector_service.py` 신규 생성 (GICS 11개 섹터 ETF)
   - `models/economic.py`에 `SectorData`, `SectorResponse` 모델 추가
   - `routes/economic.py`에 `/api/economic/sectors` 엔드포인트 추가
   - 5분 TTL 메모리 캐싱

2. **Frontend**
   - `economic/SectorHeatmap.tsx` 신규 생성
   - `EconomicIndicators.tsx`에 서브탭 구조 추가 (경제 지표/섹터 히트맵)
   - 기간 선택 (1D/1W/1M), 변화율 기반 색상 코딩
   - 툴팁으로 섹터 상세정보 및 대표 종목 표시

3. **섹터 목록 (GICS 11개)**
   - XLK(기술), XLF(금융), XLV(헬스케어), XLE(에너지)
   - XLI(산업재), XLB(소재), XLY(경기소비재), XLP(필수소비재)
   - XLRE(부동산), XLU(유틸리티), XLC(커뮤니케이션)

### 2026-02-08: 시장 사이클 (경기 계절) 기능
1. **Backend**
   - `services/market_cycle_service.py` 신규 생성
     - `calculate_momentum()`: 최근 3개월 MoM 기울기 계산
     - `judge_season_indpro()`: INDPRO YoY 기반 계절 판정
     - `generate_reasoning()`: 판단 근거 자동 생성
     - `analyze_market_cycle()`: 실제 데이터 분석
     - `generate_ai_comment()`: Gemini AI 기반 멘토 코멘트 (Admin 전용)
   - `models/economic.py`에 모델 추가
     - `MarketCycleIndicator`: 지표 상세 (value, trend, label, mom_change)
     - `MarketCycleData`: 계절, 신뢰도, 점수, 전환 신호, **reasoning**, 지표들
     - `MarketCycleResponse`: API 응답 형식
   - `routes/economic.py`에 엔드포인트 추가
     - `/api/economic/market-cycle`: 일반 사용자용
     - `/api/economic/market-cycle/analysis`: Admin 전용 (AI 코멘트 포함)

2. **Frontend**
   - `economic/MarketCycleSection.tsx` 신규 생성
     - 4계절 카드 UI (봄/여름/가을/겨울)
     - 지표 요약 (산업생산, CPI, VIX) with **Tooltip 설명**
     - **판단 근거 박스** (reasoning 표시)
     - 확장/접기 기능 (상세 정보)
     - Admin AI 코멘트 (클릭 시 요청)
   - `types/economic.ts`에 타입 추가
     - `MarketSeason`, `MarketCycleIndicator`, `MarketCycleData`, `MarketCycleResponse`

3. **판단 로직 (INDPRO 기반)**
   - **지표**: 산업생산지수(INDPRO) YoY, CPI, VIX, 금리차(10Y-3M)
   - **추세 계산**: 최근 3개월 MoM 기울기 (상승/하락/안정)
   - **계절 판정**:
     - 🌸 봄(회복기): INDPRO YoY < 1.0% & 상승 추세 & CPI < 3%
     - ☀️ 여름(활황기): INDPRO YoY ≥ 1.5% & 안정/상승 & CPI 2~3.5%
     - 🍂 가을(후퇴기): INDPRO YoY ≥ 1.0% & 하락 추세 & CPI > 3.5%
     - ❄️ 겨울(침체기): INDPRO YoY < 0% & 하락 추세
   - **가중치**: (INDPRO × 0.5) + (CPI × 0.3) + (VIX × 0.2)

4. **사용자 경험 개선**
   - **판단 근거 자동 생성**: 각 지표 상태를 조합한 1-2문장 설명
     - 예: "산업생산 확장(YoY +2.5%), 양호한 물가(CPI 3.1%), 낮은 변동성(VIX 18.5)로 여름(활황기)로 판단됩니다."
   - **지표 설명 툴팁**: shadcn/ui Tooltip 컴포넌트 사용 (기존 경제 지표와 동일 스타일)
     - 산업생산: "경제의 체온계" - 공장·광산·전기 생산량 측정
     - CPI: "장바구니 물가" - 실제 구매 물가 변화
     - VIX: "공포 지수" - 투자자 불안감 수치화

5. **Gemini AI 통합**
   - 모델: `models/gemini-flash-latest`
   - 설정: `max_output_tokens=2000`, safety_settings 완화
   - 멘토 코멘트: 현재 계절 진단 + 전환 가능성 + 투자 전략 제안 + 리스크

### 2026-02-07: 불필요한 로그 정리
1. **Frontend console.log 삭제**
   - `EconomicIndicators.tsx`: API 호출/응답 로그 3개 삭제
   - `DetailChart.tsx`: 디버깅 로그 1개 삭제

2. **Backend logger.info → logger.debug 변경**
   - `stock.py`: 라우터 초기화, 조회, 분석 과정 로그 (11개)
   - `stock_service.py`: Gemini 분석 과정 로그 (11개)
   - `health.py`: Gemini 테스트 로그 (4개)
   - `main.py`: 404 핸들러 로그 간소화
   - `fred_service.py`: 병렬 조회 로그 (2개)
   - `economic_service.py`: 병렬 조회 로그 (2개)

3. **유지된 로그**
   - `ERROR`: 에러/예외 상황 (API 키 없음, 예외 발생)
   - `WARNING`: 경고 상황 (데이터 없음, 라이브러리 미설치)
   - `INFO`: 서버 시작 시 1회성 이벤트 (DB 초기화, Admin 계정 생성)

4. **로깅 가이드라인 문서화**
   - `CLAUDE.md`에 로깅 가이드라인 섹션 추가
   - 로그 레벨 정책, 운영 환경 설정, Frontend/Backend 로깅 가이드

### 2026-02-06: 페이지 레이아웃 구조 개선
1. **공통 레이아웃 컴포넌트 추가**
   - `PageHeader.tsx` - 통일된 페이지 헤더 (타이틀, 설명, 액션 버튼)
   - `PageContainer.tsx` - 통일된 콘텐츠 컨테이너 (스크롤, 패딩, 중앙 정렬)

2. **TopNav 개선**
   - ThemeToggle을 TopNav 우측에 통합 (구분선과 함께)
   - SettingsPage, AdminPage의 자체 헤더 제거 (이중 헤더 해결)

3. **PortfolioPage 리팩토링**
   - 데이터 로직을 `usePortfolio` 훅으로 분리 (745줄 → 448줄)
   - 상태 관리, API 호출, 파생 데이터 계산을 훅으로 추출
   - UI 코드만 PortfolioPage에 유지

4. **SettingsPage/AdminPage 정리**
   - `headerActions` prop 제거
   - 자체 헤더 제거, PageHeader 적용
   - 통일된 레이아웃 구조 적용

### 2026-02-06: TopNav 기반 페이지 아키텍처 적용
1. **페이지 구조 변경**
   - Economic 페이지를 별도 홈 페이지로 분리
   - TopNav 상단 네비게이션 도입 (Economic, Portfolio, Settings, Admin)
   - MainTabs에서 economic 탭 제거 (5개 탭으로 축소)

2. **신규 컴포넌트**
   - `components/layout/TopNav.tsx` - 상단 네비게이션
   - `components/pages/HomePage.tsx` - Economic 페이지 (기본)
   - `components/pages/PortfolioPage.tsx` - 포트폴리오 페이지

3. **수정된 파일**
   - `App.tsx` - TopNav + 페이지 라우팅 구조로 변경
   - `MainTabs.tsx` - economic 탭 제거

4. **기존 기능 보존**
   - 모든 데이터 로직, API 호출, 상태 관리 100% 유지
   - EconomicIndicators, Sidebar, 각 탭 콘텐츠 그대로 유지

5. **브랜딩**
   - 앱 타이틀: "Rice Digger" (로고: RD)

### 2026-02-06 (17:30): 경제 지표 차트 로딩 상태 표시
1. **UX 개선 - 로딩 인디케이터 추가**
   - `DetailChart.tsx`: `loading` prop 추가
   - 히스토리 데이터 로딩 중 Loader2 스피너 아이콘 표시
   - "차트 데이터 불러오는 중..." 메시지로 사용자 피드백 개선
   - 기존 "히스토리 데이터가 없습니다"와 로딩 상태 구분

2. **컴포넌트 연동**
   - `EconomicChartView.tsx`: `refreshing` 상태를 DetailChart의 `loading` prop으로 전달
   - Chart 뷰 전환 시 로딩 상태 시각적 피드백 제공

### 2026-02-06: 경제 지표 차트 개선
1. **히스토리 데이터 로드 문제 해결**
   - `EconomicIndicators.tsx`: 히스토리 로드 상태 추적 (`historyLoaded`)
   - useEffect 의존성 수정으로 Chart 뷰 전환 시 히스토리 자동 로드

2. **차트 기간 필터링 개선**
   - `DetailChart.tsx`: FRED/Yahoo 데이터 타입별 필터링 로직 분리
     - FRED (월간 데이터): 데이터 포인트 개수 기준 (3M=3개월, 6M=6개월, 1Y=12개월)
     - Yahoo (일간 데이터): 날짜 기준 (1W, 1M, 3M, 6M)
   - 지표별 기간 옵션 차별화

3. **백엔드 히스토리 기간 확대**
   - `economic_service.py`: Yahoo Finance 히스토리 1개월 → 6개월로 확대
   - 금리/변동성 지표도 6개월 추세 확인 가능

4. **CPI/M2 판단 기준 수정**
   - `StatusGauge.tsx`: 절대값 대신 YoY 변화율 기준으로 표시
   - FRED 지표: "YoY 변화율: +2.54%" 형식으로 표시
   - 게이지 바 제거, 기준값 리스트와 현재값만 표시
