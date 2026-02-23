# 유지보수성 강화 전략

> 작성일: 2026-02-23
> 목적: P3 리팩토링 효과를 지속시키기 위한 품질 인프라 구축
> 상태: S0 완료, S1~S4 실행 대기

---

## 현재 상태 (Scorecard)

| 영역 | 백엔드 | 프론트엔드 | 판정 |
|------|:------:|:---------:|:----:|
| 린팅/포맷팅 | 도구 0개 | ESLint만 존재, Prettier 없음 | ⚠️ |
| 테스트 | 0건 (pytest 미설치) | 0건 (vitest 미설치) | 🔴 |
| 타입 안전성 | type hint 규칙만, 검증 도구 없음 | strict: true, `any` 16건 | ⚠️ |
| CI/CD | 없음 | 없음 | 🔴 |
| Git Hooks | commit-msg 형식만 검증 | lint-staged 없음 | ⚠️ |
| Import 일관성 | 94.7% 절대경로 (양호) | 84.8% `@/` alias, 상대 19건 | ✅ |
| 디렉토리 구조 | P1 완료, 도메인별 분리 | components/ 루트 16개 파일 평탄 | ⚠️ |
| 문서화 | 55개 .md (풍부) | 타입 6개 파일 (양호) | ✅ |

**핵심 문제**: 자동화된 품질 게이트가 없으면 리팩토링으로 개선한 구조가 다시 무너짐

---

## 전략 S0 — 코드 품질 자동화 (P3 착수 전 권장)

### S0-A. Backend — `ruff` 도입

CLAUDE.md에서 `flake8 --max-line-length=120` 명시하나 flake8 미설치.
ruff는 flake8 + isort + pycodestyle 통합, 실행 속도 빠름.

**작업 목록:**
- [x] `backend/pyproject.toml` 생성 (ruff 설정, line-length=120)
- [x] `backend/requirements-dev.txt` 생성 (ruff, pytest)
- [x] CLAUDE.md의 flake8 명령어 → ruff로 갱신

**pyproject.toml 초안:**
```toml
[tool.ruff]
line-length = 120
target-version = "py311"

[tool.ruff.lint]
select = ["E", "F", "I", "W"]
# E: pycodestyle errors
# F: pyflakes (미사용 import 등)
# I: isort (import 정렬)
# W: pycodestyle warnings
```

**효과:** import 순서 자동 정렬, 미사용 import 탐지, PEP8 위반 검출

### S0-B. Frontend — Prettier 추가

ESLint는 논리적 오류, Prettier는 포맷 일관성 담당. 현재 포맷은 개발자 에디터 의존.

**작업 목록:**
- [x] `.prettierrc` 생성
- [x] `eslint-config-prettier` 추가 (ESLint 충돌 방지)
- [x] `package.json`에 `format`, `format:check` 스크립트 추가

### S0-C. lint-staged + Husky 연동

현재 Husky는 커밋 메시지 형식만 검증. 코드 자체는 미검증.

**작업 목록:**
- [x] lint-staged 설치 + 설정 (`package.json`에 lint-staged 설정 포함)
- [x] `.husky/pre-commit`에 `npx lint-staged` 실행 추가

**lint-staged 설정 초안:**
```json
{
  "*.py": "ruff check --fix",
  "*.{ts,tsx}": "eslint --fix",
  "*.{ts,tsx,css,json}": "prettier --write"
}
```

**효과:** 커밋 시점에 변경 파일만 자동 lint → 품질 저하 원천 차단

---

## 전략 S1 — Import 규칙 및 구조 정리

### S1-A. 상대 import 19건 → `@/` 통일

**대상 파일 (10개):**
- PortfolioPage.tsx (8건, 가장 심각)
- TopNav.tsx, CategoryMetrics.tsx, HeroSection.tsx
- Sidebar.tsx, StockChart.tsx
- analysisApi.ts, storage.ts 등

**ESLint 규칙으로 재발 방지:**
```js
"no-restricted-imports": ["error", {
  patterns: [{ group: ["../*"], message: "Use @/ absolute imports" }]
}]
// 예외: 같은 디렉토리 내 형제 파일 (from './SeasonCard')
```

### S1-B. `components/` 루트 파일 도메인별 재배치

현재 루트에 16개 파일 평탄 배치 → P3 서브컴포넌트 추출 시 더 증가.

**제안 구조:**
```
components/
├── common/          ← 2개+ 도메인에서 공유하는 UI
│   ├── LoadingSpinner.tsx
│   ├── GaugeBar.tsx
│   ├── MetricCard.tsx
│   └── MiniSparkline.tsx
├── economic/        ← 기존 (17파일, 잘 분류됨)
├── portfolio/       ← PortfolioPage 전용 그룹화
│   ├── StockChart.tsx
│   ├── ChartTooltips.tsx    (P3 추출 예정)
│   ├── CategoryMetrics.tsx
│   ├── AIAnalysisTab.tsx
│   └── AnalysisHistory.tsx
├── stealth/         ← 기존
├── settings/        ← 기존 (P3 후 3파일)
├── layout/          ← 기존
├── ui/              ← shadcn/ui
└── pages/           ← 기존
```

---

## 전략 S2 — 최소 테스트 인프라

### S2-A. Backend — API 통합 테스트 (smoke test)

**작업 목록:**
- [ ] requirements-dev.txt에 pytest, httpx 추가
- [ ] backend/tests/conftest.py (TestClient fixture)
- [ ] backend/tests/test_economic_routes.py
  - test_get_economic_us → 200 OK + 응답 스키마
  - test_get_economic_kr → 200 OK
  - test_get_sectors → 200 OK
  - test_get_market_cycle → 200 OK

**목표:** 엔드포인트별 smoke test로 import 깨짐/라우터 미등록 즉시 탐지

### S2-B. Frontend — 훅 단위 테스트

**작업 목록:**
- [ ] vitest + @testing-library/react-hooks 설치
- [ ] vitest.config.ts 생성
- [ ] P3 훅 추출 시마다 대응 테스트 작성

**테스트 예시:**
```typescript
// useMarketCycle.test.ts
describe('useMarketCycle', () => {
  it('초기 로딩 상태', () => { ... })
  it('fetch 성공 시 데이터 반영', () => { ... })
  it('fetch 실패 시 에러 상태', () => { ... })
})
```

---

## 전략 S3 — CI 파이프라인 (중기)

```yaml
# .github/workflows/ci.yml 구상
jobs:
  backend:
    steps:
      - ruff check backend/
      - pytest backend/tests/ -v
  frontend:
    steps:
      - eslint frontend/src/
      - prettier --check frontend/src/
      - vitest run
      - tsc --noEmit
```

---

## 전략 S4 — 구조 규칙 성문화

### 파일 크기 경고 기준 (제안)

| 파일 유형 | 경고 | 리뷰 필수 |
|----------|:----:|:--------:|
| 컴포넌트 (.tsx) | 300줄 | 500줄 |
| 커스텀 훅 (.ts) | 200줄 | - |
| 서비스 (.py) | 400줄 | 700줄 |
| 라우터 (.py) | 250줄 | - |

현재 700줄+ 백엔드 서비스 3개:
- market_review_service.py (774줄)
- kr_market_cycle_service.py (713줄)
- market_cycle_service.py (703줄)

### CLAUDE.md 보정 필요 사항

| 항목 | 현재 | 수정 |
|------|------|------|
| Lint 명령어 | `flake8 . --max-line-length=120` | `ruff check backend/` (S0 완료 후) |
| 의존성 파일명 | `requirements_enhanced.txt` | `requirements.txt` (실제 파일명) |

---

## 실행 우선순위

| 순서 | 작업 | 성격 | P3과의 관계 |
|:----:|------|------|:----------:|
| **S0** | ruff + pyproject.toml 도입 | 백엔드 린팅 기반 | P3 무관, 즉시 가능 |
| **S0** | Prettier + lint-staged 설정 | 프론트엔드 포맷 기반 | P3 전 권장 |
| **S1** | 상대 import 19건 → @/ 통일 | 프론트엔드 정리 | P3 컴포넌트 이동 전 처리 |
| **S1** | components/ 루트 파일 재배치 | 구조 정리 | P3 서브컴포넌트 추출과 동시 가능 |
| **S2** | vitest 설치 + 훅 테스트 골격 | 테스트 기반 | P3 훅 추출 시 병행 |
| **S2** | pytest + API smoke test | 테스트 기반 | P1/P2 보호 |
| **S3** | GitHub Actions CI | 자동화 | 모든 기반 완료 후 |
| **S4** | 파일 크기 기준 + CLAUDE.md 보정 | 규칙 성문화 | 항시 가능 |

---

## 참고: 린팅(Linting) 이란?

코드를 실행하기 전에 **문법 오류, 스타일 위반, 잠재적 버그를 자동으로 검사**하는 것.

| 단계 | 비유 | 역할 |
|------|------|------|
| 린팅 | 맞춤법 검사기 (빨간 밑줄) | 코드의 실수를 저장 즉시 경고 |
| 포맷팅 | 자동 줄바꿈, 들여쓰기 정리 | 코드 스타일 자동 통일 |
| 테스트 | 내용이 논리적으로 맞는지 검증 | 기능이 의도대로 동작하는지 확인 |

**린터가 없으면:** 리팩토링으로 import 경로가 바뀔 때, 깨진 import를 직접 실행해봐야만 발견.
**린터가 있으면:** 저장 즉시 "이 import가 깨졌다" 경고 → 리팩토링의 안전망.
