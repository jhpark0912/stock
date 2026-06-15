# 리팩토링 로드맵 (P1~P5, S0~S4)

> 작성일: 2026-02-20
> 최종 갱신: 2026-02-24
> 상태: **로드맵 종료** — P1~P4, S0~S1 완료 / S2~S4, P5 스킵 또는 보류

---

## 완료 요약

| 단계 | 작업 | 완료일 | 비고 |
|------|------|--------|------|
| **P1** | services/ 도메인 서브패키지 재편 (15개 → 7 도메인) | 2026-02-20 | 커밋 9ce6909 |
| **P1+** | services/__init__.py 안전망 제거 | 2026-02-23 | |
| **P2** | economic.py 라우터 4파일 분할 (693줄 → 4 파일) | 2026-02-23 | main.py 무변경 |
| **S0** | 코드 품질 자동화 (ruff + Prettier + lint-staged) | 2026-02-23 | |
| **S1-A** | Frontend import `@/` 절대 경로 통일 | 2026-02-23 | 상대 19건 → 0건 |
| **S1-B** | components/ 루트 파일 도메인별 재배치 | 2026-02-23 | 17개 → 0개 |
| **P3 1차** | Frontend 거대 컴포넌트 분리 (6개) | 2026-02-23 | 500L+ 7개 → 0개, -66% |
| **P3 2차** | SectorHeatmap, SectorDetail, AIAnalysisTab 훅/서브컴포넌트 추출 | 2026-02-24 | |
| **P4** | 커스텀 훅 확충 (1개 → 7개 도메인별) | 2026-02-24 | |

### 스킵/보류

| 단계 | 작업 | 결정 | 사유 |
|------|------|------|------|
| **S2** | 최소 테스트 인프라 | ⏭️ 스킵 | `tsc -b && vite build`로 FE 검증 충분, BE는 수동 기동 |
| **S3** | CI 파이프라인 (GitHub Actions) | ⏭️ 패스 | 현 시점 불필요 |
| **S4** | 구조 규칙 성문화 | ✅ 이미 반영 | CLAUDE.md에 핵심 규칙 반영 완료, 유형별 세분화 불필요 |
| **P5** | Pydantic 모델 분리 | 🔒 보류 | 모델 추가 필요 시 점진 분리 |

---

## 성과

### Backend
- `services/` 평면 15파일 → 7개 도메인 서브패키지
- `routes/economic.py` 693줄 단일 → 4파일 패키지
- ruff 린터 + pre-commit hook 도입

### Frontend
- 500L+ 거대 컴포넌트 7개 → 0개 (총 -66% 감소)
- `components/` 루트 17파일 → 0개 (도메인별 재배치)
- `hooks/` 1개 → 7개 도메인별 훅 체계
- import 절대 경로 통일, Prettier 포맷 자동화

### 현행 훅 목록

| 훅 | 경로 |
|----|------|
| `usePortfolio` | `hooks/portfolio/usePortfolio.ts` |
| `useEconomicData` | `hooks/economic/useEconomicData.ts` |
| `useMarketCycle` | `hooks/economic/useMarketCycle.ts` |
| `useSectorHeatmap` | `hooks/economic/useSectorHeatmap.ts` |
| `useSectorDetail` | `hooks/economic/useSectorDetail.ts` |
| `useStealthHome` | `hooks/stealth/useStealthHome.ts` |
| `useAnalysisSummary` | `hooks/common/useAnalysisSummary.ts` |
