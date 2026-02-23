# 🛡️ SECURITY (CRITICAL)
- NEVER read, edit, grep, or cat `.env` files. No exceptions.
- ONLY READ `.env.example` for environment variable references.
- MASK all API keys, tokens, secrets in output with `********`.
- Never commit secrets to git. Use environment variables only.
- SQL queries must use parameterized statements. No string concatenation.
- 모든 도구 사용은 `.claude/audit.log`에 자동 기록됨.

# 🔧 Initial Setup (Fresh Clone)
```bash
npm install                                    # 루트: husky + lint-staged + prettier
cd frontend && npm install && cd ..            # 프론트엔드: React + 의존성
pip install -r backend/requirements-dev.txt    # 백엔드: FastAPI + ruff + pytest
```
> `npm install` 시 husky가 자동으로 git hooks를 등록합니다.
> 커밋 시 lint-staged가 변경 파일에 대해 ruff(backend) / prettier(frontend) 자동 실행.

# 🚀 Commands
- Run: `run.bat` or `python stock_info.py`
- CLI (n8n): `python stock_cli.py AAPL`
- API (n8n): `node stock_api.js AAPL`
- Test: `pytest tests/ -v`
- Lint (backend): `cd backend && ruff check .`
- Lint (frontend): `cd frontend && npm run lint`
- Format (frontend): `cd frontend && npm run format`
- Dependencies (backend): `pip install -r backend/requirements.txt`
- Dependencies (backend-dev): `pip install -r backend/requirements-dev.txt`
- Dependencies (frontend): `cd frontend && npm install`

# 🏗️ Architecture (반드시 먼저 읽을 것)
- `.claude/PROJECT_STRUCTURE.md` — 디렉토리 구조, 모듈 의존 관계 (구조만)
- `.claude/CHANGELOG.md` — 기능 변경 이력, 마이그레이션 기록
- `docs/ARCHITECTURE.md` — n8n 연동 워크플로우, API 설계
- `docs/DESIGN_SYSTEM.md` — Indigo #6366F1, Lucide React icons
- `docs/UX_GUIDELINES.md` — 초보자용 메타포 작성 규칙

# 📏 Conventions
- Git: `.claude/COMMIT_CONVENTION.md` (예: `:sparkles: [feat]`)
- Logging: `logger.debug()` only. No `print()` or `console.log` in production.
- Error handling: 커스텀 예외 사용. bare `except:` 금지.
- Type hints: 모든 함수 시그니처에 필수.

# 🔄 Documentation Maintenance
- **구조 변경** (파일/폴더 추가·삭제·이동, 엔드포인트 추가, 의존성 변경):
  → `.claude/PROJECT_STRUCTURE.md` 업데이트
- **기능 변경** (새 기능, 버그 수정, 리팩토링, 마이그레이션):
  → `.claude/CHANGELOG.md`에 날짜와 함께 기록
- **DB 스키마 변경**: → `docs/SCHEMA.md` 동기화
- 두 문서의 역할을 혼재하지 말 것. 구조는 구조만, 이력은 이력만.

# 📖 Response Rules
- 한국어로 답변. 시니어 백엔드 엔지니어 수준의 용어 사용.
- 코드 전체 출력 금지. 변경된 부분의 스니펫만 제공.
- 변경 제안 시 이유(why)와 트레이드오프를 먼저 설명.
- OWASP Top 10, 성능(DB 커넥션, 메모리) 관점의 조언 포함.