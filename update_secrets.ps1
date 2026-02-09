# Update Secret Manager Values Script for Windows PowerShell
# UTF-8 with BOM encoding

$ErrorActionPreference = "Stop"

# Load .env file
if (-not (Test-Path ".env")) {
    Write-Host "ERROR: .env file not found" -ForegroundColor Red
    exit 1
}

# Parse .env file
$envVars = @{}
Get-Content ".env" | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        # Remove quotes
        $value = $value -replace '^["'']|["'']$', ''
        $envVars[$key] = $value
    }
}

$PROJECT_ID = $envVars["GCP_PROJECT_ID"]
if (-not $PROJECT_ID) {
    Write-Host "ERROR: GCP_PROJECT_ID not set in .env file" -ForegroundColor Red
    exit 1
}

Write-Host "==> Updating Secret Manager Values" -ForegroundColor Cyan
Write-Host "    Project: $PROJECT_ID" -ForegroundColor Gray
Write-Host ""

# Function: Update secret value
function Update-Secret {
    param (
        [string]$SecretName,
        [string]$SecretValue
    )

    if (-not $SecretValue -or $SecretValue -eq "PLACEHOLDER" -or $SecretValue -eq "") {
        Write-Host "SKIP: $SecretName (empty value)" -ForegroundColor Yellow
        return
    }

    try {
        $SecretValue | gcloud secrets versions add $SecretName `
            --data-file=- `
            --project=$PROJECT_ID >$null 2>&1

        Write-Host "OK:   $SecretName" -ForegroundColor Green
    } catch {
        Write-Host "FAIL: $SecretName - $_" -ForegroundColor Red
    }
}

# Update secrets
Write-Host "Uploading secrets..." -ForegroundColor Yellow
Update-Secret "gemini-api-key" $envVars["GEMINI_API_KEY"]
Update-Secret "kis-app-key" $envVars["KIS_APP_KEY"]
Update-Secret "kis-app-secret" $envVars["KIS_APP_SECRET"]
Update-Secret "jwt-secret-key" $envVars["JWT_SECRET_KEY"]
Update-Secret "encryption-key" $envVars["ENCRYPTION_KEY"]
Update-Secret "admin-password" $envVars["ADMIN_PASSWORD"]

Write-Host ""
Write-Host "==> All secrets updated!" -ForegroundColor Green
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. (Optional) Remove sensitive values from .env file"
Write-Host "2. Restart Docker:"
Write-Host "   docker-compose down"
Write-Host "   docker-compose up -d"
