# 🍎 macOS에서 Google Cloud SDK 설치하기

## 📥 설치 방법

### Option 1: Homebrew (권장)

가장 간단하고 빠른 방법입니다.

#### 1️⃣ Homebrew 설치 (없는 경우)

```bash
# Terminal에서 실행
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### 2️⃣ Google Cloud SDK 설치

```bash
# gcloud 설치
brew install --cask google-cloud-sdk

# 설치 확인
gcloud version
```

#### 3️⃣ 초기 설정

```bash
# 자동 설정 (권장)
gcloud init

# 또는 수동 설정
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

---

### Option 2: 공식 설치 프로그램

#### 1️⃣ 다운로드

**Apple Silicon (M1/M2/M3)**:
```bash
curl -O https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-cli-darwin-arm.tar.gz
tar -xf google-cloud-cli-darwin-arm.tar.gz
```

**Intel Mac**:
```bash
curl -O https://dl.google.com/dl/cloudsdk/channels/rapid/downloads/google-cloud-cli-darwin-x86_64.tar.gz
tar -xf google-cloud-cli-darwin-x86_64.tar.gz
```

#### 2️⃣ 설치

```bash
# 설치 스크립트 실행
./google-cloud-sdk/install.sh

# Shell 설정 업데이트
source ~/.zshrc  # zsh 사용 시
# 또는
source ~/.bash_profile  # bash 사용 시
```

#### 3️⃣ 초기 설정

```bash
gcloud init
```

---

## 🚀 빠른 시작 가이드

### 1️⃣ 설치 확인

```bash
# 버전 확인
gcloud version

# 예상 출력:
# Google Cloud SDK 459.0.0
# bq 2.0.101
# core 2024.01.19
```

### 2️⃣ 인증

```bash
# Google 계정으로 로그인
gcloud auth login
# → 브라우저가 열리고 Google 계정 선택
```

### 3️⃣ 프로젝트 설정

```bash
# 프로젝트 목록 조회
gcloud projects list

# 프로젝트 설정
gcloud config set project YOUR_PROJECT_ID

# 확인
gcloud config get-value project
```

---

## 🔐 Secret Manager 설정 (Mac)

### 1️⃣ 환경 변수 설정

```bash
# 터미널에서
export GCP_PROJECT_ID="your-project-id"

# 또는 프로젝트 루트의 .env 파일에 추가
echo "GCP_PROJECT_ID=your-project-id" >> .env
```

### 2️⃣ 스크립트 실행 권한 부여

```bash
# 프로젝트 디렉토리로 이동
cd /path/to/stock

# 실행 권한 부여
chmod +x setup_secrets.sh
chmod +x update_secrets.sh
```

### 3️⃣ Secret Manager 초기 설정

```bash
# GCP 설정 (환경 변수 또는 .env 파일에서 자동 로드)
export GCP_PROJECT_ID=$(gcloud config get-value project)

# Secret Manager 초기화
./setup_secrets.sh
```

**예상 출력**:
```
🔧 GCP Project: your-project-id
📦 Secret Manager API 활성화...
👤 Service Account 생성: stock-backend-sa@...
🔐 Secrets 생성...
  - gemini-api-key
  - kis-app-key
  - kis-app-secret
  - jwt-secret-key
  - encryption-key
  - admin-password
🔑 Service Account 키 생성: gcp-credentials.json
✅ 설정 완료!
```

### 4️⃣ 시크릿 값 업로드

```bash
# .env 파일에서 값을 읽어 Secret Manager에 업로드
./update_secrets.sh
```

**예상 출력**:
```
✅ gemini-api-key 업데이트 완료
✅ kis-app-key 업데이트 완료
✅ kis-app-secret 업데이트 완료
✅ jwt-secret-key 업데이트 완료
✅ encryption-key 업데이트 완료
✅ admin-password 업데이트 완료
```

### 5️⃣ .env 파일 수정

```bash
# .env 파일 열기
nano .env
# 또는
vim .env
# 또는
code .env  # VS Code 사용 시
```

**추가할 내용**:
```bash
USE_SECRET_MANAGER=true
GCP_PROJECT_ID=your-project-id
```

### 6️⃣ Docker Compose 재시작

```bash
# 재시작
docker-compose down
docker-compose up -d

# 로그 확인
docker logs stock-backend -f
```

**성공 시 로그**:
```
🔐 Secret Manager 활성화
✅ Secret Manager 초기화 완료 (Project: your-project)
🔍 Secret Manager API 호출: gemini-api-key
✅ Secret 조회 성공: gemini-api-key
```

---

## 🔧 macOS 특화 팁

### Shell 구분

macOS Catalina (10.15) 이후 기본 쉘은 **zsh**입니다.

```bash
# 현재 쉘 확인
echo $SHELL

# 출력:
# /bin/zsh  ← zsh
# /bin/bash ← bash
```

### 환경 변수 영구 설정

#### zsh 사용 시 (기본)

```bash
# ~/.zshrc 파일에 추가
echo 'export GCP_PROJECT_ID="your-project-id"' >> ~/.zshrc

# 적용
source ~/.zshrc
```

#### bash 사용 시

```bash
# ~/.bash_profile 파일에 추가
echo 'export GCP_PROJECT_ID="your-project-id"' >> ~/.bash_profile

# 적용
source ~/.bash_profile
```

### PATH 설정 (Homebrew 설치 시 자동)

Homebrew로 설치한 경우 자동으로 PATH에 추가됩니다.

수동 설치 시:
```bash
# ~/.zshrc 또는 ~/.bash_profile에 추가
export PATH="$HOME/google-cloud-sdk/bin:$PATH"
```

---

## 🚨 문제 해결

### ❌ "gcloud: command not found"

#### 원인: PATH 미설정 또는 쉘 재시작 필요

**해결 방법 1: 쉘 재시작**
```bash
# 터미널 완전히 종료 후 다시 열기
# 또는
source ~/.zshrc  # zsh
source ~/.bash_profile  # bash
```

**해결 방법 2: PATH 확인**
```bash
# gcloud 설치 경로 찾기
which gcloud

# 없으면 수동으로 찾기
find ~ -name gcloud 2>/dev/null

# PATH에 추가
export PATH="/path/to/google-cloud-sdk/bin:$PATH"
```

**해결 방법 3: 재설치**
```bash
# Homebrew로 재설치
brew uninstall --cask google-cloud-sdk
brew install --cask google-cloud-sdk
```

---

### ❌ "Permission denied" (스크립트 실행 시)

```bash
# 실행 권한 부여
chmod +x setup_secrets.sh
chmod +x update_secrets.sh

# 확인
ls -la *.sh
# 출력: -rwxr-xr-x ... setup_secrets.sh
```

---

### ❌ "API has not been enabled"

```bash
# Secret Manager API 활성화
gcloud services enable secretmanager.googleapis.com --project=YOUR_PROJECT_ID
```

---

### ❌ M1/M2/M3 Mac에서 Rosetta 경고

Apple Silicon Mac에서 Intel 버전 설치 시 발생.

**해결**:
```bash
# 기존 삭제
brew uninstall --cask google-cloud-sdk

# ARM 버전 설치
arch -arm64 brew install --cask google-cloud-sdk
```

---

## 📋 전체 설정 체크리스트

### 초기 설정

- [ ] Homebrew 설치 완료
- [ ] `brew install --cask google-cloud-sdk` 실행
- [ ] `gcloud version` 확인
- [ ] `gcloud auth login` 인증 완료
- [ ] `gcloud config set project` 프로젝트 설정
- [ ] `gcloud config get-value project` 확인

### Secret Manager 설정

- [ ] `export GCP_PROJECT_ID` 환경 변수 설정
- [ ] `chmod +x *.sh` 실행 권한 부여
- [ ] `./setup_secrets.sh` 실행 성공
- [ ] `gcp-credentials.json` 파일 생성 확인
- [ ] `./update_secrets.sh` 실행 성공
- [ ] `.env`에 `USE_SECRET_MANAGER=true` 추가
- [ ] `docker-compose up -d` 재시작
- [ ] `docker logs stock-backend` 에러 없음

---

## 🎯 Mac vs Windows 명령어 차이

| 작업 | macOS | Windows PowerShell |
|------|-------|-------------------|
| **환경 변수 설정** | `export VAR=value` | `$env:VAR = "value"` |
| **스크립트 실행** | `./script.sh` | `.\script.ps1` |
| **실행 권한** | `chmod +x script.sh` | (불필요) |
| **PATH 추가** | `~/.zshrc` | 시스템 환경 변수 |
| **파일 편집** | `nano`, `vim`, `code` | `notepad` |

---

## 💡 유용한 macOS 명령어

### 프로젝트 디렉토리로 빠르게 이동

```bash
# 별칭 추가 (~/.zshrc 또는 ~/.bash_profile)
alias stock='cd ~/path/to/stock'

# 사용
stock
```

### gcloud 명령어 단축

```bash
# 별칭 추가
alias gcl='gcloud config list'
alias gcp='gcloud config get-value project'
alias gsa='gcloud secrets list'

# 사용
gcp  # 현재 프로젝트 확인
gsa  # Secret 목록
```

### Docker 명령어 단축

```bash
# 별칭 추가
alias dc='docker-compose'
alias dcup='docker-compose up -d'
alias dcdown='docker-compose down'
alias dclogs='docker logs stock-backend -f'

# 사용
dcup    # 시작
dclogs  # 로그 확인
```

---

## 🔍 macOS 버전별 차이점

### macOS Monterey (12.0) 이상

- 기본 쉘: zsh
- Python 3 기본 탑재
- Rosetta 2 (Intel 앱 호환)

### macOS Big Sur (11.0) 이하

- 기본 쉘: bash
- Python 2.7 탑재 (3.x 별도 설치)

### Apple Silicon (M1/M2/M3)

- ARM64 아키텍처
- Rosetta 2로 Intel 앱 실행 가능
- 네이티브 ARM 버전 권장

---

## 🚀 자동화 스크립트 (선택)

### 전체 설정 자동화

```bash
#!/bin/bash
# setup_all.sh - Mac에서 전체 설정 자동화

set -e

echo "🍎 macOS Secret Manager 설정 시작..."

# 1. Homebrew 설치 확인
if ! command -v brew &> /dev/null; then
    echo "📦 Homebrew 설치 중..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# 2. gcloud 설치
if ! command -v gcloud &> /dev/null; then
    echo "☁️  Google Cloud SDK 설치 중..."
    brew install --cask google-cloud-sdk
fi

# 3. 인증
echo "🔐 Google 계정 인증..."
gcloud auth login

# 4. 프로젝트 설정
echo "📋 프로젝트 선택..."
gcloud projects list
read -p "Project ID 입력: " PROJECT_ID
gcloud config set project $PROJECT_ID

# 5. 환경 변수 설정
export GCP_PROJECT_ID=$PROJECT_ID
echo "GCP_PROJECT_ID=$PROJECT_ID" >> .env

# 6. 스크립트 실행 권한
chmod +x setup_secrets.sh update_secrets.sh

# 7. Secret Manager 설정
./setup_secrets.sh

# 8. 시크릿 업로드
./update_secrets.sh

# 9. Docker Compose
echo "🐳 Docker Compose 재시작..."
docker-compose down
docker-compose up -d

echo "✅ 설정 완료!"
echo "📝 로그 확인: docker logs stock-backend -f"
```

**사용법**:
```bash
chmod +x setup_all.sh
./setup_all.sh
```

---

## 📚 참고 자료

- [Google Cloud SDK 공식 문서](https://cloud.google.com/sdk/docs/install-sdk#mac)
- [Homebrew 공식 사이트](https://brew.sh)
- [macOS 터미널 가이드](https://support.apple.com/guide/terminal/welcome/mac)
- [zsh 설정 가이드](https://github.com/ohmyzsh/ohmyzsh)

---

## 🆘 추가 도움이 필요하면?

1. **gcloud 공식 문서**: https://cloud.google.com/sdk/docs
2. **Stack Overflow**: https://stackoverflow.com/questions/tagged/google-cloud-sdk
3. **GCP Discord**: https://discord.gg/google-cloud

---

**문서 작성**: 2026-02-09
**macOS 지원 버전**: macOS 10.15 (Catalina) 이상
