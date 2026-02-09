# PowerShell 스크립트 인코딩 문제 해결

## 🐛 발생한 문제

```powershell
Write-Host "?좑툘  以묒슂: gcp-credentials.json? .gitignore???대? 異붽???
```

**원인**: PowerShell 스크립트의 인코딩 문제 (UTF-8 BOM 필요)

---

## ✅ 해결 방법

### Option 1: 수정된 스크립트 사용 (권장)

한글과 이모지를 제거한 영어 버전 스크립트를 생성했습니다.

```powershell
# 기존 파일 백업
Copy-Item setup_secrets.ps1 setup_secrets_backup.ps1
Copy-Item update_secrets.ps1 update_secrets_backup.ps1

# 수정된 파일로 교체
Copy-Item setup_secrets_fixed.ps1 setup_secrets.ps1 -Force
Copy-Item update_secrets_fixed.ps1 update_secrets.ps1 -Force

# 실행
.\setup_secrets.ps1
```

---

### Option 2: 수동으로 인코딩 변경

#### VS Code 사용 시

1. `setup_secrets.ps1` 파일 열기
2. 우측 하단 "UTF-8" 클릭
3. "Save with Encoding" → "UTF-8 with BOM" 선택
4. 저장

#### PowerShell ISE 사용 시

1. PowerShell ISE로 `setup_secrets.ps1` 열기
2. File → Save As
3. Encoding: "UTF-8 with BOM" 선택
4. 저장

#### Notepad++ 사용 시

1. Notepad++로 파일 열기
2. Encoding → Encode in UTF-8-BOM
3. 저장

---

## 🚀 빠른 실행 (인코딩 문제 무시)

한글 메시지만 깨지고 기능은 정상 작동할 수 있습니다.

### 방법 1: 에러 무시하고 계속 진행

```powershell
# 에러를 무시하고 명령어만 실행
$ErrorActionPreference = "SilentlyContinue"
.\setup_secrets.ps1
$ErrorActionPreference = "Stop"
```

### 방법 2: gcloud 명령어 직접 실행

스크립트 대신 명령어를 직접 실행:

```powershell
# 프로젝트 ID 설정
$PROJECT_ID = "your-project-id"

# 1. Secret Manager API 활성화
gcloud services enable secretmanager.googleapis.com --project=$PROJECT_ID

# 2. Service Account 생성
$SA_NAME = "stock-backend-sa"
gcloud iam service-accounts create $SA_NAME `
    --display-name="Stock Backend Service Account" `
    --project=$PROJECT_ID

# 3. Secret 생성
$secrets = @(
    "gemini-api-key",
    "kis-app-key",
    "kis-app-secret",
    "jwt-secret-key",
    "encryption-key",
    "admin-password"
)

foreach ($secret in $secrets) {
    "PLACEHOLDER" | gcloud secrets create $secret `
        --data-file=- `
        --replication-policy="automatic" `
        --project=$PROJECT_ID

    gcloud secrets add-iam-policy-binding $secret `
        --member="serviceAccount:$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com" `
        --role="roles/secretmanager.secretAccessor" `
        --project=$PROJECT_ID
}

# 4. Service Account 키 생성
gcloud iam service-accounts keys create gcp-credentials.json `
    --iam-account=$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com `
    --project=$PROJECT_ID
```

---

## 📝 수정된 스크립트 차이점

### 기존 (setup_secrets.ps1)

```powershell
Write-Host "🔧 GCP Project: $PROJECT_ID" -ForegroundColor Cyan
Write-Host "📦 Secret Manager API 활성화..." -ForegroundColor Yellow
Write-Host "✅ 설정 완료!" -ForegroundColor Green
```

**문제**: 이모지와 한글이 인코딩 오류 발생

### 수정 (setup_secrets_fixed.ps1)

```powershell
Write-Host "==> GCP Project: $PROJECT_ID" -ForegroundColor Cyan
Write-Host "[1/4] Enabling Secret Manager API..." -ForegroundColor Yellow
Write-Host "==> Setup Complete!" -ForegroundColor Green
```

**해결**: 영어와 ASCII 문자만 사용

---

## 🔍 인코딩 확인 방법

### PowerShell에서 확인

```powershell
# 파일 인코딩 확인
$path = ".\setup_secrets.ps1"
$bytes = [System.IO.File]::ReadAllBytes($path)
if ($bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
    Write-Host "UTF-8 with BOM (OK)" -ForegroundColor Green
} else {
    Write-Host "Not UTF-8 BOM (Need to fix)" -ForegroundColor Red
}
```

### 출력 인코딩 설정

PowerShell 출력 인코딩 문제일 수도 있음:

```powershell
# PowerShell 콘솔 인코딩을 UTF-8로 설정
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
chcp 65001

# 다시 실행
.\setup_secrets.ps1
```

---

## 💡 권장 해결 순서

1. **가장 간단**: 수정된 스크립트 사용
   ```powershell
   Copy-Item setup_secrets_fixed.ps1 setup_secrets.ps1 -Force
   Copy-Item update_secrets_fixed.ps1 update_secrets.ps1 -Force
   .\setup_secrets.ps1
   ```

2. **여전히 에러 발생**: gcloud 명령어 직접 실행 (위 참조)

3. **완벽한 해결**: VS Code로 파일을 UTF-8 BOM으로 재저장

---

## ✅ 확인 방법

스크립트 실행 후 확인:

```powershell
# Secret 목록 확인
gcloud secrets list --project=$PROJECT_ID

# 예상 출력:
# NAME                STATE    CREATED
# gemini-api-key     ENABLED  2026-02-09T...
# kis-app-key        ENABLED  2026-02-09T...
# kis-app-secret     ENABLED  2026-02-09T...
# jwt-secret-key     ENABLED  2026-02-09T...
# encryption-key     ENABLED  2026-02-09T...
# admin-password     ENABLED  2026-02-09T...

# Service Account 확인
gcloud iam service-accounts list --project=$PROJECT_ID

# gcp-credentials.json 파일 확인
Test-Path gcp-credentials.json
# 출력: True
```

---

## 🆘 여전히 안 되면?

**Cloud Shell 사용** (웹 브라우저):

1. https://console.cloud.google.com 접속
2. 우측 상단 Cloud Shell 아이콘 클릭 (터미널)
3. 위의 bash 명령어 복사하여 실행:

```bash
# Cloud Shell에서 (Linux 명령어)
export GCP_PROJECT_ID="your-project-id"

# Secret Manager API 활성화
gcloud services enable secretmanager.googleapis.com

# Service Account 생성
SA_NAME="stock-backend-sa"
gcloud iam service-accounts create $SA_NAME \
    --display-name="Stock Backend Service Account"

# Secret 생성
for secret in gemini-api-key kis-app-key kis-app-secret jwt-secret-key encryption-key admin-password; do
    echo "PLACEHOLDER" | gcloud secrets create $secret \
        --data-file=- \
        --replication-policy="automatic"

    gcloud secrets add-iam-policy-binding $secret \
        --member="serviceAccount:$SA_NAME@$GCP_PROJECT_ID.iam.gserviceaccount.com" \
        --role="roles/secretmanager.secretAccessor"
done

# Service Account 키 생성 후 다운로드
gcloud iam service-accounts keys create gcp-credentials.json \
    --iam-account=$SA_NAME@$GCP_PROJECT_ID.iam.gserviceaccount.com

# 다운로드 (Cloud Shell → 로컬)
# 파일 메뉴 → Download file → gcp-credentials.json
```

---

**문서 작성**: 2026-02-09
