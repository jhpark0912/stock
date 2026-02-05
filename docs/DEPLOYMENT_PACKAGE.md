# 📦 배포 패키지 생성 가이드

## 배포 패키지 구성

이 문서는 Docker 기반 배포를 위한 압축 파일 생성 가이드입니다.

### 포함 파일 목록

#### 🔧 루트 디렉토리
```
docker-compose.yml          # 프로덕션 환경 설정
docker-compose.dev.yml      # 개발 환경 설정
.env.example                # 환경 변수 템플릿
docker-start.bat            # Windows 실행 스크립트
docker-start.sh             # Unix 실행 스크립트
docker-stop.bat             # Windows 중지 스크립트
docker-stop.sh              # Unix 중지 스크립트
QUICKSTART_DOCKER.md        # 빠른 시작 가이드
README_DOCKER.md            # 상세 설치 가이드
README.md                   # 프로젝트 개요
```

#### 🐍 backend/
```
backend/
├── Dockerfile              # Docker 이미지 빌드 설정
├── .dockerignore           # Docker 빌드 제외 파일
├── .env.example            # Backend 환경 변수 템플릿
├── requirements.txt        # Python 의존성
├── README.md               # Backend 문서
└── app/                    # 전체 소스코드
    ├── main.py
    ├── routes/
    ├── services/
    └── models/
```

#### ⚛️ frontend/
```
frontend/
├── Dockerfile              # 프로덕션 Dockerfile
├── Dockerfile.dev          # 개발 Dockerfile
├── .dockerignore           # Docker 빌드 제외 파일
├── .env.example            # Frontend 환경 변수 템플릿
├── nginx.conf              # Nginx 설정
├── package.json            # Node 의존성
├── package-lock.json       # 의존성 잠금 파일
├── tsconfig.json           # TypeScript 설정
├── tsconfig.app.json       # App TypeScript 설정
├── tsconfig.node.json      # Node TypeScript 설정
├── vite.config.ts          # Vite 빌드 설정
├── tailwind.config.js      # Tailwind CSS 설정
├── postcss.config.js       # PostCSS 설정
├── eslint.config.js        # ESLint 설정
├── components.json         # Shadcn UI 설정
├── index.html              # HTML 엔트리포인트
├── public/                 # 정적 파일
│   └── vite.svg
└── src/                    # 전체 소스코드
    ├── main.tsx
    ├── App.tsx
    ├── components/
    ├── hooks/
    ├── types/
    ├── utils/
    └── lib/
```

### 제외 파일 목록

#### 🚫 개발 도구
```
.git/
.github/
.claude/
.gemini/
.serena/
.vscode/
.idea/
```

#### 🚫 빌드 캐시 및 의존성
```
__pycache__/
*.pyc
node_modules/
frontend/dist/
frontend/build/
.pytest_cache/
.coverage
```

#### 🚫 환경 파일 (보안)
```
.env
backend/.env
frontend/.env
```

#### 🚫 개발용 파일 (웹과 무관)
```
stock_info.py
stock_cli.py
stock_api.js
stock_standalone.py
technical_indicators.py
gemini_analyzer.py
requirements_cli.txt
requirements_enhanced.txt
run.bat
run_standalone.bat
start-dev.sh
```

#### 🚫 문서 초안 및 임시 파일
```
docs/
WEB_MIGRATION_PLAN.md
PROGRESS.md
DEPLOYMENT.md
DISTRIBUTION.md
GEMINI.md
CLAUDE.md
.claude/CLAUDE.md
prompt.md
FILES.md
tmpclaude-*
*.zip
*.log
test_output.json
```

---

## 압축 파일 생성 방법

### Windows (PowerShell)

```powershell
# create-deployment-package.ps1 스크립트 실행
.\create-deployment-package.ps1
```

### Mac/Linux (Bash)

```bash
# create-deployment-package.sh 스크립트 실행
chmod +x create-deployment-package.sh
./create-deployment-package.sh
```

---

## 생성된 패키지

### 파일명
```
stock-web-deployment-YYYYMMDD-HHMMSS.zip
```

### 예시
```
stock-web-deployment-20260202-143022.zip
```

---

## 패키지 전달 방법

### 1. 로컬 전달
- USB, 외장 하드, 공유 폴더 등을 통해 전달

### 2. 클라우드 전달
- Google Drive, Dropbox, OneDrive 등에 업로드
- 다운로드 링크 공유

### 3. 이메일 전달
- 파일 크기가 작은 경우 (< 25MB)
- 압축 파일을 이메일에 첨부

---

## 수신자 사용 가이드

### 1. 압축 해제
```bash
# Windows
# 압축 파일 우클릭 → "압축 풀기"

# Mac/Linux
unzip stock-web-deployment-20260202-143022.zip
cd stock-web-deployment
```

### 2. Docker 설치
[README_DOCKER.md](README_DOCKER.md)의 "사전 준비" 섹션 참고

### 3. 환경 설정
```bash
# Windows
copy .env.example .env
notepad .env

# Mac/Linux
cp .env.example .env
nano .env
```

→ `GEMINI_API_KEY=` 뒤에 API 키 입력

### 4. 실행
```bash
# Windows
docker-start.bat

# Mac/Linux
chmod +x docker-start.sh
./docker-start.sh
```

### 5. 접속
- **Frontend:** http://localhost
- **API 문서:** http://localhost:8000/docs

---

## 체크리스트

### 압축 전 확인
- [ ] Backend 소스코드 최신화
- [ ] Frontend 소스코드 최신화
- [ ] docker-compose.yml 설정 검증
- [ ] .env.example 업데이트
- [ ] README 문서 최신화
- [ ] 실행 스크립트 테스트

### 압축 후 확인
- [ ] 압축 파일 크기 확인 (적정 범위: 1-10MB)
- [ ] 압축 파일 무결성 확인
- [ ] 제외 파일 누락 확인 (node_modules, .git 등)
- [ ] 필수 파일 포함 확인 (docker-compose.yml 등)

### 전달 후 확인
- [ ] 수신자 다운로드 완료
- [ ] 수신자 압축 해제 성공
- [ ] 수신자 Docker 설치 완료
- [ ] 수신자 환경 설정 완료
- [ ] 수신자 실행 성공
- [ ] 수신자 접속 확인

---

## 문제 해결

### Q1: 압축 파일이 너무 큼 (> 50MB)
**원인:** node_modules 또는 .git이 포함됨

**해결:**
1. 압축 해제
2. node_modules, .git 폴더 삭제
3. 재압축

### Q2: 압축 파일이 손상됨
**원인:** 전송 중 오류

**해결:**
1. 재압축
2. 다른 전송 방법 사용 (클라우드 등)
3. MD5/SHA256 체크섬 검증

### Q3: 수신자가 실행 실패
**원인:** 환경 설정 오류 또는 Docker 미설치

**해결:**
1. [README_DOCKER.md](README_DOCKER.md)의 "문제 해결" 섹션 공유
2. Docker 설치 확인: `docker --version`
3. .env 파일 설정 확인

---

## 추가 문서

- **빠른 시작:** [QUICKSTART_DOCKER.md](QUICKSTART_DOCKER.md)
- **상세 설치:** [README_DOCKER.md](README_DOCKER.md)
- **프로젝트 개요:** [README.md](README.md)

---

**배포 패키지 생성을 완료했습니다! 🚀**
