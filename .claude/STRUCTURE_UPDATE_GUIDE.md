# 프로젝트 구조 문서 자동 업데이트 가이드

> 목적: `.claude/PROJECT_STRUCTURE.md`를 최신 상태로 유지하는 방법

## 자동화 수준

### ✅ Level 1: Claude 자동 업데이트 (현재 활성화)

**동작 방식**:
- `CLAUDE.md`에 명시된 원칙에 따라 Claude가 자동으로 구조 문서 업데이트
- 주요 변경 작업 후 Claude가 스스로 업데이트 수행

**트리거 조건** (자동 업데이트):
- 새 파일/디렉토리 생성 (`components/`, `api/routes/`, `models/` 등)
- API 엔드포인트 추가/수정
- 데이터베이스 모델 변경
- 의존성 추가 (package.json, requirements.txt)
- 주요 기능 추가

**장점**: 별도 설정 불필요, Claude가 알아서 처리
**단점**: Claude 세션 외부 변경은 감지 못함

---

### ✅ Level 2: Git Pre-commit Hook (현재 활성화)

**동작 방식**:
- Git commit 전에 구조 관련 파일 변경 감지
- 구조 문서 업데이트 여부 확인 및 경고

**설치 완료**: `.git/hooks/pre-commit`

**테스트 방법**:
```bash
# 1. 구조 파일 변경
echo "test" >> frontend/src/components/TestComponent.tsx

# 2. Git add
git add frontend/src/components/TestComponent.tsx

# 3. Commit 시도 (경고 메시지 확인)
git commit -m "test"

# 4. 구조 문서도 함께 업데이트 후 다시 commit
```

**장점**: Git 워크플로우에 자연스럽게 통합
**단점**: Git 사용 시에만 동작

---

### 🔄 Level 3: 수동 업데이트 (백업 방법)

**언제 사용**:
- Claude 없이 직접 코드 수정한 경우
- 대규모 리팩토링 후
- 새 팀원 온보딩 전

**수동 업데이트 체크리스트**:

```bash
# 1. 변경 사항 확인
git status
git diff

# 2. 구조 관련 변경 사항 체크
□ 새 디렉토리/파일 추가?
□ API 엔드포인트 변경?
□ 데이터베이스 스키마 변경?
□ 의존성 추가?
□ 주요 기능 추가/변경?

# 3. 구조 문서 업데이트
# - .claude/PROJECT_STRUCTURE.md 열기
# - 날짜 갱신 (> 최종 업데이트: YYYY-MM-DD)
# - 변경 사항 반영
# - 저장

# 4. Claude에게 요청
"최근 변경사항을 반영하여 .claude/PROJECT_STRUCTURE.md를 업데이트해줘"
```

---

## 업데이트가 필요한 변경 사항 예시

### Frontend

| 변경 사항 | 업데이트 필요 | 이유 |
|---------|------------|-----|
| `src/components/NewComponent.tsx` 추가 | ✅ 예 | 주요 컴포넌트 추가 |
| `src/utils/helper.ts` 수정 | ❌ 아니오 | 유틸 함수 내부 로직만 변경 |
| `package.json`에 새 라이브러리 추가 | ✅ 예 | 기술 스택 변경 |
| CSS 스타일만 수정 | ❌ 아니오 | 구조 변경 없음 |
| 새 페이지 추가 (`src/pages/`) | ✅ 예 | 라우팅 구조 변경 |

### Backend

| 변경 사항 | 업데이트 필요 | 이유 |
|---------|------------|-----|
| `api/routes/new_route.py` 추가 | ✅ 예 | 새 API 엔드포인트 |
| `models/new_model.py` 추가 | ✅ 예 | 데이터베이스 스키마 변경 |
| `services/` 내부 로직만 수정 | ❌ 아니오 | 비즈니스 로직만 변경 |
| `requirements.txt`에 새 패키지 | ✅ 예 | 기술 스택 변경 |
| 기존 API 응답 형식 변경 | ✅ 예 | API 스키마 변경 |

---

## 빠른 업데이트 명령어 (Claude 사용)

### 패턴 1: 간단한 추가

```
"stock.py API 라우터에 /api/stock/{ticker}/news 엔드포인트를 추가했어.
구조 문서에 반영해줘."
```

### 패턴 2: 여러 변경 사항

```
"다음 변경사항을 구조 문서에 반영해줘:
- frontend/src/components/NewsPanel.tsx 추가
- backend/api/routes/news.py 추가
- NewsService 추가"
```

### 패턴 3: 전체 스캔 요청

```
"최근 git diff를 확인해서 구조 문서 업데이트가 필요한지 확인하고,
필요하면 자동으로 업데이트해줘."
```

---

## 업데이트 자동화 개선 아이디어

### 🚀 Future: GitHub Actions (CI/CD)

```yaml
# .github/workflows/update-structure-doc.yml
name: Update Structure Doc
on:
  push:
    paths:
      - 'frontend/src/components/**'
      - 'backend/app/api/routes/**'
      - 'package.json'
      - 'requirements.txt'

jobs:
  check-structure:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Check if structure doc needs update
        run: |
          echo "⚠️ Structure files changed. Please update .claude/PROJECT_STRUCTURE.md"
          exit 1
        if: |
          !contains(github.event.head_commit.modified, '.claude/PROJECT_STRUCTURE.md')
```

### 🤖 Future: VS Code Extension

- 파일 저장 시 자동으로 구조 변경 감지
- 구조 문서 업데이트 제안 팝업
- 원클릭 자동 업데이트

---

## 트러블슈팅

### Q1: Git hook이 실행 안 됨

**Windows (Git Bash)**:
```bash
chmod +x .git/hooks/pre-commit
```

**Windows (PowerShell)**: Git Bash 사용 권장

### Q2: Claude가 자동 업데이트 안 함

1. `CLAUDE.md` 확인 - 원칙이 명시되어 있는지
2. Claude에게 명시적으로 요청:
   ```
   "방금 작업한 변경사항을 구조 문서에 반영해줘"
   ```

### Q3: 구조 문서가 너무 오래됨

전체 재스캔 요청:
```
"프로젝트 전체를 다시 스캔해서 .claude/PROJECT_STRUCTURE.md를
최신 상태로 업데이트해줘. 날짜도 오늘로 바꿔줘."
```

---

## 권장 워크플로우

### 개발 중

```
1. 코드 작성/수정
2. (자동) Claude가 구조 변경 감지 → 문서 업데이트
3. Git commit → pre-commit hook이 체크
4. 문제 없으면 commit 완료
```

### 대규모 변경 후

```
1. 변경 완료
2. Claude에게 "구조 문서 업데이트 필요한지 확인해줘" 요청
3. Claude가 변경사항 분석 → 자동 업데이트
4. 검토 후 commit
```

### 주기적 유지보수

```
- 월 1회: 구조 문서 전체 검토
- 분기 1회: 프로젝트 전체 재스캔 및 업데이트
```

---

## 결론

**현재 활성화된 자동화**:
- ✅ Level 1: Claude 자동 업데이트 (CLAUDE.md 원칙 기반)
- ✅ Level 2: Git Pre-commit Hook (변경 감지 및 경고)

**권장 사항**:
- Claude와 함께 작업 시 → 별도 작업 불필요 (자동 처리)
- 수동 변경 후 → "구조 문서 업데이트" 명시적 요청
- 대규모 리팩토링 → 완료 후 전체 재스캔 요청

**핵심**:
문서 업데이트를 "작업의 일부"로 생각하고,
구조 변경 시 항상 함께 업데이트하는 습관 유지!
