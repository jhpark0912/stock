# 🛡️ SECURITY (CRITICAL)
- NEVER read/edit/grep `.env`. ONLY `.env.example`.
- MASK all credentials with `********`.
- SQL: parameterized statements only. No string concatenation.

# 🚀 Commands
- Run: `run.bat` | Test: `pytest tests/ -v`
- Lint: `cd backend && ruff check .` | `cd frontend && npm run lint`
- Format: `cd frontend && npm run format`

# 🏗️ Architecture
> 상세 구조: `.claude/PROJECT_STRUCTURE.md` / 변경 이력: `.claude/CHANGELOG.md`
- `docs/DESIGN_SYSTEM.md` — Indigo #6366F1, Lucide React
- `docs/UX_GUIDELINES.md` — 초보자용 메타포 규칙

# 🧱 Code Rules
- 파일 300줄 목표. 독립 관심사 2개+ → 분리 / 동일 로직 2회+ → 추출 / JSX 선언적 나열 → 최대 500줄 허용.
- 도메인 기반: `services/{domain}/`, `components/{domain}/`, `hooks/{domain}/`. flat 금지.
  - cross-domain 훅 → `hooks/common/`
- Frontend: `@/` 절대 경로만. Backend: 라우터 1파일 = 1도메인.

# 📏 Conventions
- Git: `.claude/COMMIT_CONVENTION.md` | Logging: `logger.debug()` only | Type hints 필수.
- 구조 변경 → `PROJECT_STRUCTURE.md` 업데이트 (파일 추가·삭제·이동만. 내용 수정은 CHANGELOG만) / 기능 변경 → `CHANGELOG.md` 기록.

# 📖 Response Rules
- 한국어. 코드 전체 출력 금지 (변경 스니펫만). 변경 시 why + 트레이드오프 먼저.
- OWASP Top 10, 성능(DB 커넥션, 메모리) 관점 포함.
