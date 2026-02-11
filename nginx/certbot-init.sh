#!/bin/bash
# Let's Encrypt SSL 인증서 초기 발급 스크립트
#
# 사용법:
#   1. 도메인 DNS 설정 완료 (A 레코드가 서버 IP를 가리켜야 함)
#   2. .env 파일에 DOMAIN 설정
#   3. chmod +x nginx/certbot-init.sh
#   4. ./nginx/certbot-init.sh

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 환경 변수 로드
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
else
    echo -e "${RED}❌ .env 파일이 없습니다!${NC}"
    exit 1
fi

# 도메인 확인
if [ -z "$DOMAIN" ]; then
    echo -e "${RED}❌ .env 파일에 DOMAIN 변수가 설정되지 않았습니다!${NC}"
    echo -e "${YELLOW}예시: DOMAIN=example.com${NC}"
    exit 1
fi

# 이메일 확인
if [ -z "$SSL_EMAIL" ]; then
    echo -e "${YELLOW}⚠️  .env 파일에 SSL_EMAIL 변수가 설정되지 않았습니다.${NC}"
    echo -e "${YELLOW}기본값으로 admin@${DOMAIN}을 사용합니다.${NC}"
    SSL_EMAIL="admin@${DOMAIN}"
fi

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Let's Encrypt SSL 인증서 발급 시작${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "도메인: ${YELLOW}${DOMAIN}${NC}"
echo -e "이메일: ${YELLOW}${SSL_EMAIL}${NC}"
echo ""

# DNS 확인
echo -e "${YELLOW}🔍 DNS 설정 확인 중...${NC}"
DOMAIN_IP=$(dig +short ${DOMAIN} | tail -n1)
if [ -z "$DOMAIN_IP" ]; then
    echo -e "${RED}❌ 도메인 ${DOMAIN}의 DNS 레코드를 찾을 수 없습니다!${NC}"
    echo -e "${YELLOW}DNS 설정을 확인하고 A 레코드가 서버 IP를 가리키는지 확인하세요.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ DNS 확인 완료: ${DOMAIN} → ${DOMAIN_IP}${NC}"
echo ""

# 기존 컨테이너 중지
echo -e "${YELLOW}🛑 기존 컨테이너 중지 중...${NC}"
docker-compose -f docker-compose.yml -f docker-compose.ssl.yml down || true
echo ""

# Nginx + Certbot 시작 (SSL 인증서 없이)
echo -e "${YELLOW}🚀 Nginx 시작 중 (HTTP Only)...${NC}"
docker-compose -f docker-compose.yml -f docker-compose.ssl.yml up -d nginx
sleep 5
echo ""

# Let's Encrypt 인증서 발급
echo -e "${YELLOW}🔐 Let's Encrypt 인증서 발급 중...${NC}"
echo -e "${YELLOW}(최초 발급 시 1-2분 소요될 수 있습니다)${NC}"
echo ""

docker-compose -f docker-compose.yml -f docker-compose.ssl.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email ${SSL_EMAIL} \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d ${DOMAIN}

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 인증서 발급 실패!${NC}"
    echo -e "${YELLOW}다음을 확인하세요:${NC}"
    echo -e "${YELLOW}  1. DNS A 레코드가 올바르게 설정되었는지${NC}"
    echo -e "${YELLOW}  2. 방화벽에서 80, 443 포트가 열려있는지${NC}"
    echo -e "${YELLOW}  3. 도메인이 이미 다른 인증서로 등록되어 있지 않은지${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✅ 인증서 발급 완료!${NC}"
echo ""

# Nginx 설정 파일에서 SSL 인증서 경로 주석 해제
echo -e "${YELLOW}🔧 Nginx 설정 업데이트 중...${NC}"

# 백업 생성
cp nginx/nginx.conf nginx/nginx.conf.backup

# SSL 인증서 경로 주석 해제 및 도메인 업데이트
sed -i "s|# ssl_certificate /etc/letsencrypt/live/YOUR_DOMAIN/fullchain.pem;|ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;|g" nginx/nginx.conf
sed -i "s|# ssl_certificate_key /etc/letsencrypt/live/YOUR_DOMAIN/privkey.pem;|ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;|g" nginx/nginx.conf
sed -i "s|# ssl_stapling on;|ssl_stapling on;|g" nginx/nginx.conf
sed -i "s|# ssl_stapling_verify on;|ssl_stapling_verify on;|g" nginx/nginx.conf
sed -i "s|# ssl_trusted_certificate /etc/letsencrypt/live/YOUR_DOMAIN/chain.pem;|ssl_trusted_certificate /etc/letsencrypt/live/${DOMAIN}/chain.pem;|g" nginx/nginx.conf
sed -i "s|server_name _;|server_name ${DOMAIN};|g" nginx/nginx.conf

echo -e "${GREEN}✅ Nginx 설정 업데이트 완료${NC}"
echo ""

# 전체 스택 재시작
echo -e "${YELLOW}🔄 전체 스택 재시작 중...${NC}"
docker-compose -f docker-compose.yml -f docker-compose.ssl.yml down
docker-compose -f docker-compose.yml -f docker-compose.ssl.yml up -d

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ SSL 설정 완료!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${GREEN}이제 다음 URL로 접속 가능합니다:${NC}"
echo -e "${YELLOW}https://${DOMAIN}${NC}"
echo ""
echo -e "${GREEN}인증서는 자동으로 갱신됩니다 (90일마다).${NC}"
echo -e "${GREEN}Certbot 컨테이너가 12시간마다 갱신을 체크합니다.${NC}"
echo ""
