# 🪟 Windows에서 Google Cloud SDK 설치하기

## 📥 설치 방법

### Option 1: 공식 설치 프로그램 (권장)

#### 1️⃣ 다운로드

**다운로드 링크**: https://cloud.google.com/sdk/docs/install#windows

또는 직접 다운로드:
- [Google Cloud SDK Installer](https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe)

#### 2️⃣ 설치 실행

1. 다운로드한 `GoogleCloudSDKInstaller.exe` 실행
2. 설치 마법사 진행
3. **중요**: "Start Cloud SDK Shell" 체크 (기본값)
4. 설치 완료 후 "Cloud SDK Shell" 자동 실행됨

#### 3️⃣ 초기 설정

설치 완료 후 Cloud SDK Shell에서:

```bash
# 1. 인증
gcloud auth login
# → 브라우저가 열리고 Google 계정 로그인

# 2. 프로젝트 설정
gcloud config set project YOUR_PROJECT_ID

# 3. 확인
gcloud config get-value project
```

#### 4️⃣ PowerShell에서 사용

**새 PowerShell 창 열기** (중요: 설치 후 재시작 필요):

```powershell
# gcloud 명령어 확인
gcloud version
```

**만약 여전히 안 된다면** → [문제 해결](#문제-해결) 참조

---

### Option 2: Chocolatey (패키지 관리자)

#### 1️⃣ Chocolatey 설치 (없는 경우)

```powershell
# PowerShell 관리자 권한으로 실행
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

#### 2️⃣ Google Cloud SDK 설치

```powershell
# 관리자 권한 PowerShell에서
choco install gcloudsdk -y
```

#### 3️⃣ PowerShell 재시작 후 초기 설정

```powershell
gcloud init
```

---

## 🔧 초기 설정 (gcloud init)

### 자동 설정 (권장)

```powershell
gcloud init
```

**대화형 설정 진행**:
```
1. Log in with a new account (Google 계정 로그인)
2. Pick cloud project to use (프로젝트 선택)
3. Do you want to configure a default region? (선택)
```

### 수동 설정

```powershell
# 1. 인증
gcloud auth login

# 2. 프로젝트 설정
gcloud config set project YOUR_PROJECT_ID

# 3. 기본 리전 설정 (선택)
gcloud config set compute/region asia-northeast3  # 한국 서울
```

---

## ✅ 설치 확인

```powershell
# 버전 확인
gcloud version

# 예상 출력:
# Google Cloud SDK 459.0.0
# bq 2.0.101
# core 2024.01.19
# gcloud-crc32c 1.0.0
# gsutil 5.27

# 현재 설정 확인
gcloud config list

# 예상 출력:
# [core]
# account = your-email@gmail.com
# disable_usage_reporting = True
# project = your-project-id
```

---

## 🚨 문제 해결

### ❌ "gcloud 명령을 찾을 수 없습니다" (설치 후에도)

#### 원인: PATH 환경 변수 미등록

**해결 방법 1: PowerShell 재시작**

가장 간단한 방법. 설치 후 **모든 PowerShell 창을 닫고 새로 열기**.

---

**해결 방법 2: PATH 수동 등록**

1. **gcloud 설치 경로 확인**:
   ```
   기본 경로: C:\Users\{사용자명}\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin
   ```

2. **환경 변수 설정**:

   **Option A - GUI 방식**:
   ```
   1. Win + X → "시스템"
   2. "고급 시스템 설정"
   3. "환경 변수"
   4. "시스템 변수"에서 "Path" 선택 → "편집"
   5. "새로 만들기" → 경로 추가:
      C:\Users\jhpark0912\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin
   6. "확인" 3번 클릭
   7. PowerShell 재시작
   ```

   **Option B - PowerShell 명령어**:
   ```powershell
   # 현재 사용자의 환경 변수에 추가
   $gcloudPath = "$env:LOCALAPPDATA\Google\Cloud SDK\google-cloud-sdk\bin"
   [Environment]::SetEnvironmentVariable(
       "Path",
       [Environment]::GetEnvironmentVariable("Path", "User") + ";$gcloudPath",
       "User"
   )

   # PowerShell 재시작 필수
   ```

3. **확인**:
   ```powershell
   # 새 PowerShell 창에서
   gcloud version
   ```

---

**해결 방법 3: 절대 경로로 실행**

PATH 등록 없이 전체 경로로 실행:

```powershell
# 경로 확인
$gcloudPath = "$env:LOCALAPPDATA\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd"
if (Test-Path $gcloudPath) {
    Write-Host "gcloud 경로: $gcloudPath"
} else {
    Write-Host "gcloud를 찾을 수 없습니다. 설치 확인 필요"
}

# 실행 (전체 경로)
& "$env:LOCALAPPDATA\Google\Cloud SDK\google-cloud-sdk\bin\gcloud.cmd" version
```

---

### ❌ "인증에 실패했습니다"

```powershell
# 기존 인증 정보 삭제
gcloud auth revoke

# 다시 로그인
gcloud auth login
```

---

### ❌ "프로젝트를 찾을 수 없습니다"

#### 1. 프로젝트 목록 확인

```powershell
gcloud projects list
```

**출력 없음** → GCP 콘솔에서 프로젝트 생성 필요:
- https://console.cloud.google.com/projectcreate

#### 2. 프로젝트 ID 정확히 확인

```powershell
# 웹 콘솔에서 확인
# https://console.cloud.google.com/home/dashboard

# Project ID 복사 (Project Name이 아님!)
```

#### 3. 프로젝트 설정

```powershell
gcloud config set project YOUR_EXACT_PROJECT_ID
```

---

## 🎯 프로젝트 ID 확인하는 방법

### 방법 1: GCP 웹 콘솔 (가장 확실함)

1. https://console.cloud.google.com 접속
2. 상단 프로젝트 선택 드롭다운 클릭
3. Project ID 열에 표시된 값 복사

**예시**:
```
Project Name: My Stock App
Project ID: project-0fccd08a-4e7b-46c3-987e23a4  ← 이것!
Project Number: 123456789012
```

### 방법 2: gcloud 명령어

```powershell
gcloud projects list --format="table(projectId,name)"
```

---

## 🔑 Secret Manager 사용을 위한 추가 설정

### 1. Secret Manager API 활성화

```powershell
# 프로젝트 설정 확인
gcloud config get-value project

# Secret Manager API 활성화
gcloud services enable secretmanager.googleapis.com
```

### 2. 권한 확인

```powershell
# 현재 계정 확인
gcloud auth list

# 계정에 필요한 역할:
# - roles/secretmanager.admin (Secret 생성/관리)
# - roles/iam.serviceAccountAdmin (Service Account 생성)
```

---

## 📋 전체 설정 체크리스트

- [ ] Google Cloud SDK 설치 완료
- [ ] PowerShell에서 `gcloud version` 실행 가능
- [ ] `gcloud auth login` 인증 완료
- [ ] `gcloud config get-value project` 프로젝트 ID 확인
- [ ] `gcloud services list` 서비스 목록 조회 가능
- [ ] Secret Manager API 활성화 완료

---

## 🆘 그래도 안 되면?

### 완전 재설치

```powershell
# 1. 기존 설치 제거
# 제어판 → 프로그램 제거 → "Google Cloud SDK" 제거

# 2. 사용자 데이터 삭제
Remove-Item -Recurse -Force "$env:LOCALAPPDATA\Google\Cloud SDK"
Remove-Item -Recurse -Force "$env:APPDATA\gcloud"

# 3. 재설치
# https://cloud.google.com/sdk/docs/install#windows

# 4. PowerShell 완전 재시작 (모든 창 닫기)
```

---

## 💡 대안: Cloud Shell 사용 (임시)

설치 없이 웹 브라우저에서 gcloud 사용:

1. https://console.cloud.google.com 접속
2. 우측 상단 "Activate Cloud Shell" (터미널 아이콘) 클릭
3. 웹 터미널에서 gcloud 명령어 실행

**장점**: 설치 불필요, 즉시 사용 가능
**단점**: 로컬 파일 접근 불가, Secret Manager 스크립트 실행 불가

---

## 🚀 설치 완료 후 다음 단계

```powershell
# 1. gcloud 설정 확인
gcloud config list

# 2. Project ID 확인
gcloud config get-value project

# 3. 환경 변수 설정
$env:GCP_PROJECT_ID = "your-project-id"

# 4. Secret Manager 설정 진행
.\setup_secrets.ps1
```

---

**도움말 링크**:
- [Google Cloud SDK 공식 문서](https://cloud.google.com/sdk/docs/install)
- [gcloud CLI 치트시트](https://cloud.google.com/sdk/docs/cheatsheet)
- [Windows 문제 해결](https://cloud.google.com/sdk/docs/troubleshooting)
