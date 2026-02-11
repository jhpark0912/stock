#!/bin/bash

# Stock App GCP 배포 스크립트
# Artifact Registry에서 이미지를 pull하여 배포
# docker-compose.override.yml 자동 적용 (GCP VM + SSL)

set -e  # 에러 발생 시 즉시 종료

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로고 출력
echo -e "${BLUE}"
echo "╔════════════════════════════════════════╗"
echo "║                                        ║"
echo "║        🚀 Stock App 배포 시작         ║"
echo "║                                        ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

# ========================================
# 1. 환경 변수 로드
# ========================================
echo -e "${YELLOW}📋 환경 변수 로드 중...${NC}"

if [ ! -f .env ]; then
    echo -e "${RED}❌ .env 파일이 없습니다!${NC}"
    echo -e "${YELLOW}💡 .env.production.example을 복사하여 .env를 생성하세요.${NC}"
    exit 1
fi

# 환경 변수 export
export $(cat .env | grep -v '^#' | xargs)

echo -e "${GREEN}✅ 환경 변수 로드 완료${NC}"
echo "   - GCP_PROJECT_ID: ${GCP_PROJECT_ID}"
echo "   - REGION: ${REGION}"
echo "   - REPOSITORY: ${REPOSITORY:-stock-app}"

# ========================================
# 2. Docker 인증 확인
# ========================================
echo ""
echo -e "${YELLOW}🔐 Docker 인증 확인 중...${NC}"

if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker가 실행되지 않았습니다!${NC}"
    exit 1
fi

# Artifact Registry 인증 확인
REGISTRY_URL="${REGION}-docker.pkg.dev"
if ! docker login ${REGISTRY_URL} > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Artifact Registry 인증이 필요합니다.${NC}"
    echo -e "${BLUE}📌 다음 명령어를 실행하세요:${NC}"
    echo "   gcloud auth configure-docker ${REGISTRY_URL}"
    exit 1
fi

echo -e "${GREEN}✅ Docker 인증 완료${NC}"

# ========================================
# 3. 이미지 Pull
# ========================================
echo ""
echo -e "${YELLOW}📥 이미지 다운로드 중...${NC}"

# docker compose up 시 override.yml 자동 적용
if ! docker compose pull; then
    echo -e "${RED}❌ 이미지 다운로드 실패!${NC}"
    echo -e "${YELLOW}💡 다음 사항을 확인하세요:${NC}"
    echo "   1. Artifact Registry에 이미지가 존재하는지 확인"
    echo "      gcloud artifacts docker images list ${REGISTRY_URL}/${GCP_PROJECT_ID}/${REPOSITORY:-stock-app}"
    echo "   2. Cloud Build가 성공했는지 확인"
    echo "      gcloud builds list --limit=1"
    exit 1
fi

echo -e "${GREEN}✅ 이미지 다운로드 완료${NC}"

# ========================================
# 4. 기존 컨테이너 중지
# ========================================
echo ""
echo -e "${YELLOW}🛑 기존 컨테이너 중지 중...${NC}"

docker compose down || true

echo -e "${GREEN}✅ 기존 컨테이너 중지 완료${NC}"

# ========================================
# 5. 새 컨테이너 시작
# ========================================
echo ""
echo -e "${YELLOW}🔄 새 컨테이너 시작 중...${NC}"

# docker compose up -d (override.yml 자동 적용)
if ! docker compose up -d; then
    echo -e "${RED}❌ 컨테이너 시작 실패!${NC}"
    echo -e "${YELLOW}💡 로그를 확인하세요:${NC}"
    echo "   docker compose logs"
    exit 1
fi

echo -e "${GREEN}✅ 컨테이너 시작 완료${NC}"

# ========================================
# 6. 헬스체크
# ========================================
echo ""
echo -e "${YELLOW}🏥 헬스체크 중...${NC}"

# Backend 헬스체크 (최대 30초 대기)
MAX_RETRY=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRY ]; do
    if curl -sf http://localhost:8000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend 정상${NC}"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT+1))
    echo -n "."
    sleep 1
done

if [ $RETRY_COUNT -eq $MAX_RETRY ]; then
    echo -e "${RED}❌ Backend 헬스체크 실패!${NC}"
    echo -e "${YELLOW}💡 로그를 확인하세요:${NC}"
    echo "   docker compose logs backend"
    exit 1
fi

# Nginx 확인 (SSL 사용 시)
if docker compose ps | grep -q "stock-nginx"; then
    if curl -sf http://localhost > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Nginx 정상${NC}"
    else
        echo -e "${YELLOW}⚠️  Nginx 응답 없음 (설정 확인 필요)${NC}"
    fi
fi

# ========================================
# 7. 배포 완료
# ========================================
echo ""
echo -e "${GREEN}"
echo "╔════════════════════════════════════════╗"
echo "║                                        ║"
echo "║        ✅ 배포 성공!                  ║"
echo "║                                        ║"
echo "╚════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${BLUE}📊 컨테이너 상태:${NC}"
docker compose ps

echo ""
echo -e "${BLUE}🌐 서비스 URL:${NC}"
if [ -n "${DOMAIN}" ]; then
    echo "   - HTTPS: https://${DOMAIN}"
    echo "   - HTTP:  http://${DOMAIN} (HTTPS로 리디렉션)"
else
    echo "   - Frontend: http://${SERVER_IP:-localhost}:80"
    echo "   - Backend:  http://${SERVER_IP:-localhost}:8000"
fi
echo "   - API Docs: http://${SERVER_IP:-localhost}:8000/docs"

echo ""
echo -e "${BLUE}📝 유용한 명령어:${NC}"
echo "   - 로그 확인:      docker compose logs -f"
echo "   - 컨테이너 재시작: docker compose restart"
echo "   - 컨테이너 중지:   docker compose down"

echo ""
echo -e "${GREEN}🎉 배포가 완료되었습니다!${NC}"
