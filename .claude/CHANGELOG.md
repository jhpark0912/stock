# 변경 이력 (Changelog)

> 프로젝트의 주요 변경 사항을 날짜별로 기록합니다.
> 구조 정보는 `.claude/PROJECT_STRUCTURE.md`를 참조하세요.

## 최근 변경 이력

### 2026-02-24: 리팩토링 로드맵 종료 — S3 패스, S4 완료, 최종 정리

- **S3 CI 파이프라인**: 패스 (현 시점 불필요)
- **S4 구조 규칙 성문화**: CLAUDE.md에 이미 반영 완료 확인, 유형별 세분화 불필요로 판단
- **로드맵 최종 정리**: P1~P4 + S0~S1 완료, S2~S3 스킵/패스, S4 완료, P5 보류
- `REFACTORING_ROADMAP.md` 슬림화 (완료 요약 + 성과 + 스킵 사유)

### 2026-02-24: P3 2차 + P4 완료 확인

- **P3 2차**: SectorHeatmap, SectorDetail 훅 추출이 이전 세션에서 이미 완료된 상태 확인
  - `SectorHeatmap.tsx` 391L → 326L (`useSectorHeatmap` 추출됨)
  - `SectorDetail.tsx` 393L → 320L (`useSectorDetail` 추출됨)
  - `AIAnalysisTab.tsx` 426L → ~240L (이전 P3 2차 세션에서 완료)
- **P4 커스텀 훅**: 7개 도메인별 훅 체계 구축 완료
  - `hooks/portfolio/usePortfolio.ts`, `hooks/economic/{useEconomicData, useMarketCycle, useSectorHeatmap, useSectorDetail}.ts`, `hooks/stealth/useStealthHome.ts`, `hooks/common/useAnalysisSummary.ts`
- 로드맵 상태 갱신: P3 2차 ✅, P4 ✅

### 2026-02-24: S2 최소 테스트 인프라 — 스킵 결정

- **결론**: S2 전체 스킵. 현재 시점에서 테스트 인프라 구축 불필요로 판단.
- **사유**:
  - Frontend: `tsc -b && vite build`가 이미 TypeScript 컴파일 + import 검증 수행
  - Backend: smoke test 수준이라면 수동 서버 기동으로 충분
  - 테스트 인프라 구축 대비 실효성이 낮음

### 2026-02-24: P3 2차 - AIAnalysisTab 리팩토링

1. **AIAnalysisTab.tsx 383줄 → ~240줄 (-37%)**
   - 헤더 4회 반복 → `AIAnalysisHeader` 서브컴포넌트로 통합
   - 상태 카드 3회 반복 (no_key, error, initial) → `AIAnalysisStatusCard` 서브컴포넌트로 통합
   - `AnalysisHistory` 모달 4회 → 최하단 1회로 통합
   - 조건 분기를 `renderContent()` 내부 함수로 정리

2. **AIAnalysisComponents.tsx 신규 생성 (~90줄)**
   - `AIAnalysisHeader`: 제목 + 이력 버튼 + 선택적 추가 버튼
   - `AIAnalysisStatusCard`: 아이콘 + 제목 + 설명 + 액션 버튼 (3개 상태 공용)

3. **검증**: TypeScript 컴파일 0 errors, ESLint 통과

### 2026-02-24: ECOS/FRED/Yahoo 캐시 통합 — 중복 API 호출 제거

1. **문제**: 동일 지표를 `include_history=False`와 `True`로 각각 호출 시 캐시 키 불일치로 API 2회 호출
   - 신용스프레드: `/economic` (False) + `/market-cycle` (True) → 2회
   - KR_INDPRO, KR_CPI도 동일 패턴

2. **수정**: 캐시를 항상 히스토리 포함 버전으로 저장, `include_history=False` 시 `model_copy(update={"history": None})`로 히스토리만 제거하여 반환
   - `korea_economic_service.py`: `get_ecos_indicator`, `get_credit_spread`, `get_yahoo_kr_indicator` 3개 함수
   - `fred_service.py`: `get_fred_indicator` 1개 함수
   - `economic_service.py`: `get_yahoo_indicator` 1개 함수 + 미사용 `CACHE_TTL_HISTORY` 제거

3. **효과**: 서버 시작 후 첫 요청만 API 호출, 이후 모든 `include_history` 조합이 캐시 히트

### 2026-02-23: S1-B - components/ 루트 파일 도메인별 재배치

1. **components/ 루트 17개 파일 → 4개 도메인 디렉토리로 재배치**
   - `portfolio/` (신규): AIAnalysisTab, AnalysisHistory, CategoryMetrics, HeroSection, Sidebar, StockChart, MainTabs (7개)
   - `common/` (신규): LoadingSpinner, GaugeBar, MetricCard, MiniSparkline, StrategyBadge (5개)
   - `layout/` (기존): ThemeProvider, ThemeToggle, AppLayout 추가 (3개)
   - `economic/` (기존): EconomicIndicators, IndicatorCard 추가 (2개)

2. **import 경로 수정 (13개 파일)**
   - `App.tsx`, `main.tsx` — 상대 경로 수정
   - `pages/PortfolioPage.tsx` — 8개 import 일괄 수정
   - `layout/TopNav.tsx`, `pages/HomePage.tsx` — 1개씩
   - `admin/AdminPage.tsx`, `economic/SectorHeatmap.tsx`, `economic/MarketReview/MarketReviewSection.tsx`, `stealth/StealthPortfolioPage.tsx` — LoadingSpinner
   - 이동된 파일 내부: `portfolio/CategoryMetrics.tsx`, `portfolio/AIAnalysisTab.tsx`, `economic/IndicatorCard.tsx`

3. **결과**
   - components/ 루트 파일: 17개 → 0개
   - TypeScript 컴파일 0 errors

### 2026-02-23: P3 1차 - Frontend 거대 컴포넌트 분리 완료 (6개 파일)

1. **StealthHomePage.tsx 928L → 176L (-81%)**
   - `hooks/useStealthHome.ts` 생성 (186L): 3탭 데이터 조회 훅 (회의록/사업현황/업무일지)
   - `components/stealth/StealthMemoComponents.tsx` 생성 (140L): 공용 UI + 타입 + 유틸 함수
   - `components/stealth/StealthMemoTab.tsx` 생성 (214L): 회의록 탭
   - `components/stealth/StealthStatusTab.tsx` 생성 (116L): 사업현황 탭
   - `components/stealth/StealthJournalTab.tsx` 생성 (153L): 업무일지 탭
   - StealthHomePage.tsx: 오케스트레이터만 (176L)

2. **StealthPortfolioPage.tsx 584L → 305L (-48%)**
   - `components/stealth/StealthPortfolioComponents.tsx` 생성 (34L): NoteSection, ProjectInfoLine, strategyToLabel
   - `components/stealth/StealthAnalysisSection.tsx` 생성 (139L): 분석 보고서 섹션
   - `components/stealth/StealthAnalysisHistory.tsx` 생성 (104L): 분석 이력 인라인 패널
   - StealthPortfolioPage.tsx: 오케스트레이터 (305L)

3. **이전 P3 1차 완료분** (MarketCycleSection, SettingsPage, StockChart, EconomicIndicators)
   - `hooks/useMarketCycle.ts`, `hooks/useEconomicData.ts`, `hooks/useAnalysisSummary.ts` 추가
   - 4개 컴포넌트 훅/서브컴포넌트 분리 완료

4. **결과**
   - 500L+ 파일: 7개 → 0개
   - 대상 4,052L → 1,379L (-66%)
   - TypeScript 컴파일 0 errors

### 2026-02-23: S1-A - Frontend import 절대 경로 통일

1. **상대 경로 `../` → `@/` 절대 경로 일괄 전환**
   - 대상 19곳 (components/hooks/lib 전반)
   - ESLint `import/no-relative-paths` 규칙 준수

---

### 2026-02-23: S0 - 코드 품질 자동화 인프라 구축

1. **S0-A: Backend ruff 도입**
   - `backend/pyproject.toml` 생성 (ruff 설정: line-length=120, E/F/I/W 규칙)
   - `backend/requirements-dev.txt` 생성 (ruff, pytest, httpx)
   - 현재 715건 탐지 (559건 자동수정 가능, 대부분 공백/import 정렬)

2. **S0-B: Frontend Prettier + ESLint 연동**
   - `frontend/.prettierrc` 생성 (singleQuote, printWidth=100)
   - `prettier`, `eslint-config-prettier` 설치
   - `eslint.config.js`에 eslintConfigPrettier 추가 (ESLint↔Prettier 충돌 방지)
   - `package.json`에 `format`, `format:check` 스크립트 추가
   - 현재 62개 파일에서 포맷 차이 탐지

3. **S0-C: lint-staged + Husky pre-commit 연동**
   - 루트 `package.json`에 lint-staged 설치 + 설정
   - `.husky/pre-commit`에 `npx lint-staged` 실행 추가
   - 커밋 시 staged 파일만 자동 린팅/포맷팅

4. **S0-D: 문서 갱신**
   - `CLAUDE.md`: flake8 → ruff, requirements_enhanced.txt → requirements.txt 수정
   - `MAINTENANCE_STRATEGY.md`: S0 체크리스트 완료 표시

### 2026-02-23: P1+ - services/__init__.py 안전망 제거

1. **구 경로 소비자 수정**
   - `backend/init_database.py`: `from app.services.auth_service` → `from app.services.auth.auth_service`
   - 프로젝트 전체 구 경로 import 0건 확인 후 제거

2. **안전망 제거**
   - `backend/app/services/__init__.py`: 15개 심볼 re-export → 주석 1줄만 남김

3. **P3 사전 분석 + 유지보수 전략 수립**
   - 9개 대상 컴포넌트 구조 분석 완료 → `.claude/plans/P3_COMPONENT_ANALYSIS.md`
   - 크로스 컴포넌트 중복 패턴 4건 식별
   - 품질 인프라 감사 (린팅/테스트/CI 현황) → `.claude/plans/MAINTENANCE_STRATEGY.md`
   - 로드맵 경로 현행화, P3 2차 대상 3개 추가

### 2026-02-23: P2 - economic.py 라우터 4파일 분할 (리팩토링)

1. **경제 지표 라우터 패키지화**
   - 기존 `routes/economic.py` (693줄, 11개 엔드포인트) → `routes/economic/` 패키지 4파일 분할
   - `indicators.py`: GET /economic, GET /economic/status (경제 지표 조회)
   - `sectors.py`: GET /economic/sectors, GET .../holdings (섹터 ETF)
   - `market_cycle.py`: GET /economic/market-cycle, GET .../analysis (시장 사이클)
   - `market_review.py`: GET .../market-review/{country}, POST .../ai (증시 마감 리뷰)
   - `__init__.py`: include_router x4로 router 통합 노출

2. **main.py 무변경**
   - `from app.api.routes import economic` → `economic.router` 경로 동일
   - 패키지 `__init__.py`에서 router를 노출하므로 main.py 수정 불필요

3. **검증 완료**
   - Python syntax 검증 통과 (5개 파일)
   - uvicorn 서버 기동 정상 (Application startup complete)

### 2026-02-20: P1 - services/ 도메인 기반 서브패키지 재편 (리팩토링)

1. **서비스 레이어 구조 개선**
   - 기존 `services/` 평면 구조(15개 파일) → 7개 도메인 서브패키지로 재편
   - `auth/`, `common/`, `economic/`, `market/`, `sector/`, `stock/`, `korea_data/`
   - git mv로 이동 → 파일 변경 이력 보존

2. **import 경로 마이그레이션**
   - 내부 서비스 간 import 15곳 신규 경로로 수정
   - 외부 소비자(main.py, routes 5개) import 수정
   - `services/__init__.py` re-export 안전망 추가 (TODO: 모든 소비자 전환 후 제거)

3. **검증 완료**
   - 핵심 import 7개 항목 검증 통과
   - 서버 기동 (uvicorn) 정상 확인

4. **미완료 (P2 다음 세션 예정)**
   - `routes/economic.py` (693줄) → `economic/` 패키지 4파일 분할

### 2026-02-20: 스텔스 모드 탭 전환 기능 확장 및 모바일 사이드바 수정

1. **StealthHomePage 탭 구조 추가**
   - 3개 탭 도입: 회의록(경제지표) / 사업현황(섹터) / 업무일지(마감리뷰)
   - 기존 경제지표 메모 콘텐츠 → "회의록" 탭으로 이동
   - 섹터 데이터 → "사업현황" 탭 (부서별 실적표 형태, 금일/주간/월간)
   - 마감리뷰 데이터 → "업무일지" 탭 (일일 업무 보고 형태)
   - 스텔스 국가 선택: "해외팀/국내팀" 텍스트 버튼 (국기 아이콘 제거)

2. **StealthPortfolioPage 모바일 사이드바 수정**
   - 사이드바/오버레이 `fixed` → `absolute`로 변경
   - TopNav와의 z-index 충돌 해소 (뷰포트 전체 덮음 → 컨테이너 내부 스코핑)

### 2026-02-20: 스텔스 모드 (몰래보기) 기능 추가

1. **StealthContext 구현**
   - `contexts/StealthContext.tsx` 신규 생성
   - ThemeProvider 패턴 따름 (localStorage 기반 상태 유지)
   - `useStealthMode()` 커스텀 훅 제공
   - 스텔스 ON 시 `document.title` → "내 메모"로 변경

2. **경제지표 위장 (StealthHomePage)**
   - `components/stealth/StealthHomePage.tsx` 신규 생성
   - 경제지표 데이터를 "회의록/업무 메모" 형태로 표시
   - 미국: "주간 회의록" (금리, 거시경제, 원자재)
   - 한국: "업무 체크리스트" (금리, 거시지표, 환율)
   - 시장 사이클: "분기 평가 현황" (해외/국내 사업부)
   - 차트 완전 숨김, 색상 코딩 제거, 이모지 없음
   - 검색 필터 기능 포함

3. **종목 조회 위장 (StealthPortfolioPage)**
   - `components/stealth/StealthPortfolioPage.tsx` 신규 생성
   - 포트폴리오를 "프로젝트 관리 노트" 형태로 표시
   - 사이드바 → "프로젝트 목록", 종목 → "프로젝트 현황 보고"
   - 재무 지표 → "세부 지표", 뉴스 → "관련 보고서"
   - AI 분석 → "분석 보고서" (요약 생성/저장/이력 기능 포함)
   - 투자 전략 위장: buy→확대, hold→유지, sell→축소
   - 이력 조회: 인라인 패널 (모달 대신 메모 스타일)
   - 차트/기술적 지표 완전 숨김, 모노톤 색상
   - `usePortfolio()` 훅 그대로 재사용
   - 모바일: 프로젝트 목록 슬라이드 여닫기 (햄버거 메뉴)

4. **TopNav 수정**
   - Eye/EyeOff lucide 아이콘 토글 버튼 추가
   - 스텔스 ON: 로고 "RD" → "M", 앱명 "Rice Digger" → "Memo"
   - 탭 라벨 변경: "Economic" → "회의록", "Portfolio" → "프로젝트"
   - Settings/Admin 탭 스텔스 시 숨김
   - remote 모바일 반응형 코드(햄버거 메뉴, 드롭다운)와 통합

5. **App.tsx 수정**
   - `StealthProvider`로 `AuthenticatedApp` 래핑
   - 스텔스 ON: 페이지별 위장 컴포넌트로 교체
   - 스텔스에서 숨겨진 페이지(settings/admin)에 있으면 자동 이동

6. **기존 기능 보호**
   - 스텔스 컴포넌트는 `components/stealth/` 디렉토리에 격리
   - 기존 컴포넌트(EconomicIndicators, PortfolioPage 등) 코드 수정 없음
   - 스텔스 OFF 시 기존 페이지가 정확히 동일하게 렌더링

### 2026-02-20: 모바일 탭 터치 개선 및 탭 전환 성능 최적화

- TopNav 모바일 반응형: 햄버거 메뉴, 드롭다운, 반응형 패딩/사이즈
- 모바일 탭 터치 영역 확대 및 전환 성능 최적화

### 2026-02-18: 한국 거시경제 지표 교체 및 미국 거시지표 확장

- 한국 거시경제 3대장 지표 교체
- 미국 거시지표 확장: CFNAI, UMCSENT, Philly Fed Spread 추가
- `fred_service.py`: 확장된 FRED API 지표 조회

### 2026-02-17: 한국 주식 PE/PBR 직접 계산 및 차트 원화 표시

- 한국 주식 PE/PBR 직접 계산 로직 추가
- 차트에서 한국 주식 원화(KRW) 표시

### 2026-02-16: pykrx fallback 및 KIS API 키 안내 기능 추가

- `pykrx_service.py` 신규: pykrx fallback 서비스
- KIS API 키 미설정 시 안내 기능

### 2026-02-15: 티커 한글 이름 저장 기능 및 API 타임아웃 수정

- `PortfolioDB.display_name` 컬럼 추가 (VARCHAR(50), NULL)
- `usePortfolio.ts`: `handleUpdateDisplayName` 핸들러 추가
- `HeroSection.tsx`: 한글 이름 인라인 편집 UI
- `Sidebar.tsx`: 한글 이름 표시
- API 타임아웃 수정

### 2026-02-15: 한국 주식 원화 표기 및 모바일 하단 여백 추가

- 한국 주식 원화 표기
- 모바일 하단 여백 추가

### 2026-02-14: AI 분석 타임아웃 60초로 통일

- AI 분석 API 타임아웃 60초로 통일

### 2026-02-14: 모바일 반응형 디자인 개선 (1차/2차)

- 전체 컴포넌트 모바일 반응형 대응
- TopNav, Sidebar, MainTabs 등 모바일 최적화
- 터치 친화적 UI 개선

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
