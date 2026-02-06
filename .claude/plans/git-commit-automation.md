# Git Commit 자동화 계획

> 작성일: 2026-02-06

## 목적
작업 완료 후 일관된 commit 워크플로우 제공 - 사용자 제어권 보장

---

## 확정 사항

| 항목 | 결정 |
|------|------|
| Commit 형식 | `:[emoji]: [type] [message]` (현재 패턴 유지) |
| Push 자동화 | commit 후 push 여부 질문 |
| Hook 도구 | **Husky** (Docker 환경 분리) |

---

## 현재 상태

| 항목 | 상태 |
|------|------|
| pre-commit hook | 있음 (구조 문서 동기화 경고) |
| commit-msg hook | 없음 |
| 루트 package.json | 없음 |
| Husky | 미설치 |

---

## 구현 계획

### Phase 1: 루트 package.json 생성

**파일**: `package.json` (루트)

```json
{
  "name": "stock-project",
  "private": true,
  "scripts": {
    "prepare": "husky"
  },
  "devDependencies": {
    "husky": "^9.0.0"
  }
}
```

**설치 명령**:
```bash
npm init -y
npm install -D husky
npx husky init
```

---

### Phase 2: Husky Hooks 설정

**파일**: `.husky/pre-commit`

```bash
#!/bin/sh

# 브랜치 확인
BRANCH=$(git branch --show-current)
if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
    echo "⚠️  WARNING: $BRANCH 브랜치에 직접 commit 중입니다!"
    echo "feature 브랜치 사용을 권장합니다."
fi

# 구조 문서 동기화 확인 (기존 로직 유지)
STRUCTURE_FILES="package.json requirements.txt frontend/src/components backend/app/api/routes backend/app/models"
CHANGED_FILES=$(git diff --cached --name-only)

for file in $STRUCTURE_FILES; do
    if echo "$CHANGED_FILES" | grep -q "$file"; then
        if ! echo "$CHANGED_FILES" | grep -q ".claude/PROJECT_STRUCTURE.md"; then
            echo "⚠️  구조 관련 파일이 변경되었습니다."
            echo "   .claude/PROJECT_STRUCTURE.md 업데이트를 권장합니다."
        fi
        break
    fi
done
```

**파일**: `.husky/commit-msg`

```bash
#!/bin/sh

# 커밋 메시지 형식 검증 (선택적)
# :[emoji]: [type] [message] 패턴 확인

COMMIT_MSG=$(cat "$1")

# 이모지 패턴 체크 (간단한 검증)
if ! echo "$COMMIT_MSG" | grep -qE "^:[a-z_]+:"; then
    echo "⚠️  커밋 메시지가 Convention과 다릅니다."
    echo "   권장 형식: :[emoji]: [type] [message]"
    echo "   예: :sparkles: [feat] 새 기능 추가"
fi
```

---

### Phase 3: Docker 환경 분리

**파일**: `Dockerfile` (수정)

```dockerfile
# 프로덕션 빌드 시 Husky 비활성화
ENV HUSKY=0

# 또는 devDependencies 제외
RUN npm ci --omit=dev
```

**파일**: `docker-compose.yml` (수정)

```yaml
services:
  app:
    build:
      args:
        - HUSKY=0
    environment:
      - HUSKY=0
```

**파일**: `.dockerignore` (추가)

```
.husky
.git
node_modules
```

---

### Phase 4: Commit Convention 문서 생성

**파일**: `.claude/COMMIT_CONVENTION.md`

```markdown
# Commit Convention

## 형식
:[emoji]: [type] [subject]

## Type 목록
| Type | 설명 | Emoji |
|------|------|-------|
| feat | 새 기능 | :sparkles: |
| fix | 버그 수정 | :bug: |
| docs | 문서 변경 | :memo: |
| style | 코드 스타일 | :art: |
| refactor | 리팩토링 | :recycle: |
| perf | 성능 개선 | :zap: |
| test | 테스트 | :white_check_mark: |
| chore | 빌드/설정 | :wrench: |
| design | UI/UX | :lipstick: |
| construction | 작업 중 | :construction: |

## 규칙
1. subject는 한글 50자 이내
2. 현재형 동사 사용 (추가, 수정, 삭제)
3. 마침표 생략

## 예시
:sparkles: [feat] 로그인 기능 추가
:bug: [fix] 티커 조회 오류 수정
:memo: [docs] README 업데이트
```

---

### Phase 5: CLAUDE.md 업데이트

Commit 섹션 추가:
```markdown
## Commit 워크플로우

**규칙 문서**: `.claude/COMMIT_CONVENTION.md` 참조

**자동화 절차**:
1. 작업 완료 후 Claude에게 commit 요청
2. 브랜치 확인 (main/master 경고)
3. 메시지 제안 → 사용자 수정 가능
4. 최종 확인 후 commit
5. push 여부 확인

**Husky 환경**:
- 로컬: Hooks 자동 실행
- Docker: HUSKY=0으로 비활성화
```

---

## 최종 워크플로우

```
[작업 완료]
     │
     ▼
"commit 할까요?" ────────▶ [아니오] 종료
     │
     ▼ [예]
현재 브랜치: {branch}
     │
     ├─ main/master ──▶ "⚠️ 경고" (Husky)
     │
     ▼
변경 사항 분석 + 메시지 제안
     │
     ▼
":sparkles: [feat] ..." 수정 가능
     │
     ▼
git add + git commit
     │
     ├─ Husky pre-commit ──▶ 구조 문서 확인
     ├─ Husky commit-msg ──▶ 형식 검증
     │
     ▼
"push 할까요?" ────────▶ [아니오] 종료
     │
     ▼ [예]
git push
```

---

## 수정할 파일 목록

| 파일 | 작업 |
|------|------|
| `package.json` (루트) | 새로 생성 |
| `.husky/pre-commit` | 새로 생성 |
| `.husky/commit-msg` | 새로 생성 |
| `.claude/COMMIT_CONVENTION.md` | 새로 생성 |
| `CLAUDE.md` | Commit 섹션 추가 |
| `Dockerfile` | HUSKY=0 추가 |
| `.dockerignore` | .husky 추가 |

---

## 검증 방법

1. `npm install` 후 Husky 자동 설치 확인
2. 테스트 commit으로 hooks 동작 확인
3. Docker 빌드 시 Husky 스킵 확인
4. main 브랜치 경고 메시지 확인

---

## 환경별 동작

| 환경 | HUSKY | Hooks |
|------|-------|-------|
| 로컬 개발 | (기본값) | ✅ 활성화 |
| Docker 빌드 | `HUSKY=0` | ❌ 비활성화 |
| CI/CD | `CI=true` | ❌ 자동 비활성화 |

---

## 다른 PC에서의 자동화

### 자동 적용 원리

```
[다른 PC에서 클론]
     │
     ▼
git clone <repo>
     │
     ▼
npm install
     │
     ▼
package.json의 prepare 스크립트 실행
     │
     ▼
Husky 자동 활성화 (.husky/ 폴더 연결)
     │
     ▼
Hooks 사용 가능!
```

### Git에 포함되는 파일

| 파일/폴더 | 커밋 여부 | 역할 |
|-----------|----------|------|
| `package.json` | ✅ 커밋 | prepare 스크립트 정의 |
| `.husky/` | ✅ 커밋 | hook 스크립트 저장 |
| `.husky/pre-commit` | ✅ 커밋 | pre-commit hook |
| `.husky/commit-msg` | ✅ 커밋 | commit-msg hook |
| `node_modules/` | ❌ 제외 | npm install로 설치 |

### 새 PC 셋업 순서

```bash
# 1. 프로젝트 클론
git clone <repository-url>
cd stock

# 2. 의존성 설치 (Husky 자동 활성화)
npm install

# 3. 끝! hooks 자동 적용됨
```

### 주의사항

1. **npm install 필수**: hooks가 동작하려면 npm install 실행 필요
2. **.husky/ 폴더 커밋**: 이 폴더가 git에 있어야 다른 PC에서도 동작
3. **Node.js 필요**: Husky는 Node.js 기반 (backend만 사용하는 PC도 Node 필요)
