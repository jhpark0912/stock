# GCP Secret Manager Setup Script for Windows PowerShell
# UTF-8 with BOM encoding

$ErrorActionPreference = "Stop"

# Get GCP Project ID
$PROJECT_ID = $env:GCP_PROJECT_ID
if (-not $PROJECT_ID) {
    $PROJECT_ID = Read-Host "Enter GCP Project ID"
}

Write-Host "==> GCP Project: $PROJECT_ID" -ForegroundColor Cyan

# 1. Enable Secret Manager API
Write-Host "[1/4] Enabling Secret Manager API..." -ForegroundColor Yellow
gcloud services enable secretmanager.googleapis.com --project=$PROJECT_ID

# 2. Create Service Account
$SA_NAME = "stock-backend-sa"
$SA_EMAIL = "$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"

Write-Host "[2/4] Creating Service Account: $SA_EMAIL" -ForegroundColor Yellow
gcloud iam service-accounts create $SA_NAME `
    --display-name="Stock Backend Service Account" `
    --project=$PROJECT_ID 2>$null

if ($LASTEXITCODE -ne 0) {
    Write-Host "      Service Account already exists (OK)" -ForegroundColor Gray
}

# 3. Create Secrets
Write-Host "[3/4] Creating Secrets..." -ForegroundColor Yellow

$secrets = @(
    "gemini-api-key",
    "kis-app-key",
    "kis-app-secret",
    "jwt-secret-key",
    "encryption-key",
    "admin-password"
)

foreach ($secret in $secrets) {
    Write-Host "      - $secret" -ForegroundColor Gray

    # Create secret with PLACEHOLDER value
    "PLACEHOLDER" | gcloud secrets create $secret `
        --data-file=- `
        --replication-policy="automatic" `
        --project=$PROJECT_ID 2>$null

    if ($LASTEXITCODE -ne 0) {
        Write-Host "        (already exists)" -ForegroundColor Gray
    }

    # Grant read permission to Service Account
    gcloud secrets add-iam-policy-binding $secret `
        --member="serviceAccount:$SA_EMAIL" `
        --role="roles/secretmanager.secretAccessor" `
        --project=$PROJECT_ID >$null 2>&1
}

# 4. Create Service Account Key
$KEY_FILE = "gcp-credentials.json"
Write-Host "[4/4] Creating Service Account Key: $KEY_FILE" -ForegroundColor Yellow

if (Test-Path $KEY_FILE) {
    $overwrite = Read-Host "$KEY_FILE already exists. Overwrite? (y/N)"
    if ($overwrite -ne "y") {
        Write-Host "      Skipped" -ForegroundColor Gray
    } else {
        gcloud iam service-accounts keys create $KEY_FILE `
            --iam-account=$SA_EMAIL `
            --project=$PROJECT_ID
    }
} else {
    gcloud iam service-accounts keys create $KEY_FILE `
        --iam-account=$SA_EMAIL `
        --project=$PROJECT_ID
}

Write-Host ""
Write-Host "==> Setup Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Add to .env file:"
Write-Host "   GCP_PROJECT_ID=$PROJECT_ID"
Write-Host ""
Write-Host "2. Update secret values:"
Write-Host "   .\update_secrets.ps1"
Write-Host ""
Write-Host "NOTE: gcp-credentials.json is already in .gitignore" -ForegroundColor Yellow
