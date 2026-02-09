#!/bin/bash
# GCP Secret Manager 초기 설정 스크립트

set -e

PROJECT_ID="${GCP_PROJECT_ID:-your-project-id}"
echo "🔧 GCP Project: $PROJECT_ID"

# 1. Secret Manager API 활성화
echo "📦 Secret Manager API 활성화..."
gcloud services enable secretmanager.googleapis.com --project=$PROJECT_ID

# 2. Service Account 생성 (Docker용)
SA_NAME="stock-backend-sa"
SA_EMAIL="${SA_NAME}@${PROJECT_ID}.iam.gserviceaccount.com"

echo "👤 Service Account 생성: $SA_EMAIL"
gcloud iam service-accounts create $SA_NAME \
  --display-name="Stock Backend Service Account" \
  --project=$PROJECT_ID || echo "Service Account 이미 존재"

# 3. Secret 생성 (빈 값으로 초기화)
echo "🔐 Secrets 생성..."

secrets=(
  "gemini-api-key"
  "kis-app-key"
  "kis-app-secret"
  "jwt-secret-key"
  "encryption-key"
  "admin-password"
)

for secret in "${secrets[@]}"; do
  echo "  - $secret"
  echo -n "PLACEHOLDER" | gcloud secrets create $secret \
    --data-file=- \
    --replication-policy="automatic" \
    --project=$PROJECT_ID 2>/dev/null || echo "    이미 존재"

  # Service Account에 읽기 권한 부여
  gcloud secrets add-iam-policy-binding $secret \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/secretmanager.secretAccessor" \
    --project=$PROJECT_ID > /dev/null
done

# 4. Service Account 키 생성 (Docker용)
KEY_FILE="./gcp-credentials.json"
echo "🔑 Service Account 키 생성: $KEY_FILE"
gcloud iam service-accounts keys create $KEY_FILE \
  --iam-account=$SA_EMAIL \
  --project=$PROJECT_ID

echo ""
echo "✅ 설정 완료!"
echo ""
echo "📝 다음 단계:"
echo "1. .env 파일에 추가:"
echo "   GCP_PROJECT_ID=$PROJECT_ID"
echo ""
echo "2. 실제 시크릿 값 설정:"
echo "   ./update_secrets.sh"
echo ""
echo "⚠️  중요: gcp-credentials.json은 .gitignore에 이미 추가됨"
