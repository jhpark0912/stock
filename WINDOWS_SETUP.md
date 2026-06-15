# 🪟 Windows에서 Secret Manager 설정하기

## 📋 Windows vs Linux 명령어 차이

| Linux/Mac | Windows PowerShell | 설명 |
|-----------|-------------------|------|
| `export VAR=value` | `$env:VAR = "value"` | 환경 변수 설정 |
| `./script.sh` | `.\script.ps1` | 스크립트 실행 |
| `chmod +x script.sh` | (불필요) | 실행 권한 부여 |

---

## 🚀 빠른 시작

### 1️⃣ GCP Project ID 설정

```powershell
# PowerShell에서 환경 변수 설정
$env:GCP_PROJECT_ID = "project-0fccd08a-4e7b-46c3-987..."

# 또는 .env 파일에 직접 추가
notepad .env
```

**⚠️ 중요**: Project ID가 완전한지 확인하세요!
```powershell
# 현재 GCP 프로젝트 확인
gcloud config get-value project
```

### 2️⃣ Secret Manager 초기 설정

```powershell
# PowerShell 스크립트 실행
.\setup_secrets.ps1
```

**만약 실행 정책 에러 발생 시**:
```powershell
# 현재 세션에서만 스크립트 실행 허용
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# 다시 실행
.\setup_secrets.ps1
```

### 3️⃣ 시크릿 값 업로드

```powershell
# .env 파일에서 값을 읽어 Secret Manager에 업로드
.\update_secrets.ps1
```

### 4️⃣ .env 파일 수정

```powershell
notepad .env
```

**추가할 내용**:
```
USE_SECRET_MANAGER=true
GCP_PROJECT_ID=your-project-id
```

### 5️⃣ Docker Compose 재시작

```powershell
docker-compose down
docker-compose up -d
```

---

## 🛠️ 상세 가이드

### 환경 변수 설정 방법

#### Option A: PowerShell 세션용 (임시)
```powershell
$env:GCP_PROJECT_ID = "your-project-id"
```
**단점**: PowerShell 종료 시 사라짐

#### Option B: .env 파일에 추가 (권장)
```powershell
# .env 파일 열기
notepad .env

# 추가
GCP_PROJECT_ID=your-project-id
```

#### Option C: Windows 환경 변수 (영구)
```powershell
# 시스템 환경 변수 설정 (관리자 권한 필요)
[System.Environment]::SetEnvironmentVariable("GCP_PROJECT_ID", "your-project-id", "User")

# 또는 GUI: 시스템 속성 → 환경 변수
```

---

## 🔧 문제 해결

### ❌ "스크립트 실행이 차단되었습니다"

**에러**:
```
.\setup_secrets.ps1 : 이 시스템에서 스크립트를 실행할 수 없으므로...
```

**해결 방법 1** (권장):
```powershell
# 현재 세션에서만 허용
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

**해결 방법 2**:
```powershell
# 현재 사용자에 대해 허용 (영구)
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

**해결 방법 3**:
```powershell
# 파일 단위 실행
PowerShell.exe -ExecutionPolicy Bypass -File .\setup_secrets.ps1
```

---

### ❌ "gcloud 명령을 찾을 수 없습니다"

**원인**: Google Cloud SDK 미설치

**해결**:
1. [Google Cloud SDK 다운로드](https://cloud.google.com/sdk/docs/install)
2. 설치 후 PowerShell 재시작
3. 인증:
   ```powershell
   gcloud auth login
   gcloud config set project your-project-id
   ```

---

### ❌ ".env 파일을 찾을 수 없습니다"

**원인**: 잘못된 디렉토리

**해결**:
```powershell
# 현재 위치 확인
pwd

# 프로젝트 루트로 이동
cd C:\Exception\0.STUDY\stock

# .env 파일 존재 확인
ls .env
```

---

### ❌ "Project ID가 잘못되었습니다"

**확인**:
```powershell
# GCP 프로젝트 목록 조회
gcloud projects list

# 출력 예시:
# PROJECT_ID                    NAME         PROJECT_NUMBER
# project-0fccd08a-4e7b-46c3... My Project   123456789012
```

**수정**:
```powershell
# 올바른 Project ID 설정
$env:GCP_PROJECT_ID = "완전한-project-id"

# 또는 .env 파일 수정
notepad .env
```

---

## 🎯 Windows에서 Docker 사용 시 주의사항

### WSL2 Backend 사용 권장

Docker Desktop 설정:
1. Settings → General
2. "Use the WSL 2 based engine" 체크
3. Docker 재시작

### 파일 경로 주의

```powershell
# ❌ Linux 스타일 (Windows에서 작동 안 함)
./gcp-credentials.json

# ✅ Windows 스타일
.\gcp-credentials.json

# ✅ 절대 경로
C:\Exception\0.STUDY\stock\gcp-credentials.json
```

### docker-compose.yml의 볼륨 마운트

```yaml
# Windows에서 작동하는 경로
volumes:
  - ./gcp-credentials.json:/app/gcp-credentials.json:ro  # ✅ 상대 경로
  - C:/Exception/0.STUDY/stock/data:/app/data            # ✅ 절대 경로 (/ 사용)
```

---

## 📝 전체 워크플로우 (Windows)

```powershell
# 1. 프로젝트 디렉토리로 이동
cd C:\Exception\0.STUDY\stock

# 2. GCP Project ID 확인
gcloud config get-value project

# 3. 환경 변수 설정 (또는 .env 파일에 추가)
$env:GCP_PROJECT_ID = "your-project-id"

# 4. 실행 정책 설정 (최초 1회)
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# 5. Secret Manager 초기 설정
.\setup_secrets.ps1

# 6. 시크릿 값 업로드
.\update_secrets.ps1

# 7. .env 파일 수정
notepad .env
# USE_SECRET_MANAGER=true 추가

# 8. Docker 재시작
docker-compose down
docker-compose up -d

# 9. 로그 확인
docker logs stock-backend -f
```

---

## 🆚 대안: Git Bash 사용

Windows에 Git이 설치되어 있다면 Git Bash에서 Linux 명령어 사용 가능:

```bash
# Git Bash 실행
"C:\Program Files\Git\git-bash.exe"

# Linux 명령어 사용 가능
export GCP_PROJECT_ID=your-project-id
./setup_secrets.sh  # .sh 스크립트 실행
```

---

## 💡 팁

### PowerShell 프로필에 환경 변수 추가 (선택)

```powershell
# 프로필 파일 열기
notepad $PROFILE

# 추가
$env:GCP_PROJECT_ID = "your-project-id"

# 저장 후 PowerShell 재시작 시 자동 로드
```

### 명령어 단축키 (Alias)

```powershell
# 별칭 설정
Set-Alias -Name gcp-setup -Value .\setup_secrets.ps1
Set-Alias -Name gcp-update -Value .\update_secrets.ps1

# 사용
gcp-setup
gcp-update
```

---

## ✅ 체크리스트

설정 완료 확인:

- [ ] Google Cloud SDK 설치 완료
- [ ] `gcloud auth login` 인증 완료
- [ ] GCP Project ID 확인 완료
- [ ] PowerShell 실행 정책 설정 완료
- [ ] `.\setup_secrets.ps1` 실행 성공
- [ ] `gcp-credentials.json` 파일 생성됨
- [ ] `.\update_secrets.ps1` 실행 성공
- [ ] `.env`에 `USE_SECRET_MANAGER=true` 추가
- [ ] Docker Compose 재시작 완료
- [ ] `docker logs stock-backend` 에러 없음

---

**문서 작성**: 2026-02-09
