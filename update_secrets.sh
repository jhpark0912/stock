#!/bin/bash
# Secret Manager에 실제 값 업데이트 스크립트

set -e

PROJECT_ID="${GCP_PROJECT_ID}"

if [ -z "$PROJECT_ID" ]; then
  echo "❌ GCP_PROJECT_ID 환경 변수를 설정하세요"
  exit 1
fi

echo "🔐 Secret Manager 값 업데이트"
echo "Project: $PROJECT_ID"
echo ""

# 함수: 시크릿 값 업데이트
update_secret() {
  local secret_name=$1
  local secret_value=$2

  if [ -z "$secret_value" ] || [ "$secret_value" == "PLACEHOLDER" ]; then
    echo "⚠️  $secret_name: 값이 비어있음 - 건너뜀"
    return
  fi

  echo -n "$secret_value" | gcloud secrets versions add $secret_name \
    --data-file=- \
    --project=$PROJECT_ID > /dev/null

  echo "✅ $secret_name 업데이트 완료"
}

# .env 파일에서 값 읽기
if [ -f .env ]; then
  source .env
else
  echo "❌ .env 파일을 찾을 수 없습니다"
  exit 1
fi

# 시크릿 업데이트
echo "📤 시크릿 업로드 중..."
update_secret "gemini-api-key" "$GEMINI_API_KEY"
update_secret "kis-app-key" "$KIS_APP_KEY"
update_secret "kis-app-secret" "$KIS_APP_SECRET"
update_secret "jwt-secret-key" "$JWT_SECRET_KEY"
update_secret "encryption-key" "$ENCRYPTION_KEY"
update_secret "admin-password" "$ADMIN_PASSWORD"

echo ""
echo "✅ 모든 시크릿 업데이트 완료!"
echo ""
echo "📝 다음 단계:"
echo "1. .env 파일에서 민감한 값들 제거 (선택)"
echo "2. Docker Compose 재시작:"
echo "   docker-compose down"
echo "   docker-compose up -d"
