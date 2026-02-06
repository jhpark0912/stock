# 프로젝트 구조

> 최종 업데이트: 2026-02-06 (경제 지표 차트 필터링 및 판단 기준 개선)

## 전체 아키텍처

```
stock/
├── frontend/          # React + TypeScript + Vite
├── backend/           # FastAPI + Python
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
- **경제 지표**: fredapi 0.5.2 (FRED API)
- **AI 분석**: Google Generative AI 0.8.3 (Gemini)
- **번역**: deep-translator 1.11.4
- **기타**:
  - pandas, numpy (데이터 처리)
  - pydantic (데이터 검증)

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
│   │   │   └── CompareSelector.tsx      # 비교 지표 선택
│   │   ├── settings/        # 설정 페이지 컴포넌트
│   │   ├── ui/              # 재사용 가능한 UI 컴포넌트 (shadcn/ui)
│   │   ├── AppLayout.tsx    # 앱 레이아웃
│   │   ├── Dashboard.tsx    # 대시보드
│   │   ├── StockChart.tsx   # 주식 차트
│   │   ├── Sidebar.tsx      # 사이드바
│   │   └── ...
│   ├── contexts/            # React Context (테마, 인증 등)
│   ├── lib/                 # 라이브러리 설정
│   ├── types/               # TypeScript 타입 정의
│   ├── utils/               # 유틸리티 함수
│   ├── assets/              # 정적 리소스
│   ├── App.tsx              # 앱 루트
│   └── main.tsx             # 엔트리 포인트
├── public/                  # 정적 파일 (favicon 등)
├── index.html               # HTML 템플릿
├── vite.config.ts           # Vite 설정
├── tailwind.config.js       # Tailwind 설정
└── package.json             # npm 의존성
```

**주요 컴포넌트**:
- `Dashboard.tsx` - 메인 대시보드 (포트폴리오 개요 + 경제 지표)
- `EconomicIndicators.tsx` - 경제 지표 대시보드 (Simple/Chart 뷰 전환)
- `IndicatorCard.tsx` - 경제 지표 카드 컴포넌트 (Simple 뷰)
- `MiniSparkline.tsx` - 미니 스파크라인 차트 (Simple 뷰)
- **경제 지표 Chart 뷰** (Phase 3):
  - `EconomicChartView.tsx` - Chart 뷰 메인 레이아웃
  - `IndicatorListPanel.tsx` - 좌측 지표 목록 (카테고리별 그룹핑)
  - `DetailChart.tsx` - 메인 차트 (기간 선택: FRED=3M/6M/1Y/ALL, Yahoo=1W/1M/3M/6M)
  - `StatusGauge.tsx` - 판단 기준 (기준값 리스트, YoY 변화율 표시)
  - `CompareSelector.tsx` - 비교 지표 선택 (멀티 차트)
- `StockChart.tsx` - 주식 차트 (Recharts 사용)
- `CategoryMetrics.tsx` - 카테고리별 메트릭
- `MetricCard.tsx` - 메트릭 카드
- `Sidebar.tsx` - 사이드바 네비게이션
- `AppLayout.tsx` - 전체 레이아웃 컨테이너

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
│   │       └── economic.py  # 경제 지표 API
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
│   │   └── indicator_status.py  # 지표 상태 판단 로직 (YoY 변화율 기반)
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
   - 금리: 미국채 10년물 (^TNX), 3개월 T-Bill (^IRX)
   - 변동성: VIX (^VIX)
   - 거시경제: CPI (CPIAUCSL), M2 통화량 (M2SL) - FRED API
   - 원자재: WTI 원유 (CL=F), 금 (GC=F)
   - **히스토리**: Yahoo(6개월), FRED(최근 30개 데이터 포인트)
   - **상태 판단**:
     - FRED: YoY 변화율 기반 (CPI: 1.5-2.5% 좋음, M2: 4-8% 좋음)
     - Yahoo: 절대값 기반 (금리, VIX, 원자재)
   - **Chart 뷰**:
     - 기간 필터링: FRED(데이터 포인트 개수), Yahoo(날짜 기준)
     - 판단 기준: 기준값 리스트 + 현재값 표시
     - 지표 비교: 멀티 라인 차트

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
FRED_API_KEY=your-fred-api-key  # 경제 지표용 (선택)
LOG_LEVEL=INFO
```

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
- `GET /api/economic` - 경제 지표 조회 (현재값만)
- `GET /api/economic?include_history=true` - 히스토리 포함 (Yahoo: 6개월, FRED: 30개월)
- `GET /api/economic/status` - API 상태 확인 (FRED, Yahoo)

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
