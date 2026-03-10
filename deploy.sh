#!/bin/bash

# 배포 스크립트
# 작성일: 2026-02-12

set -e  # 에러 발생 시 즉시 중단

# ========================================
# 설정
# ========================================
COMPOSE_FILES="-f docker-compose.yml -f docker-compose.override.yml"
REQUIRED_ENV_VARS=("SERVER_IP" "DOMAIN")
HEALTH_CHECK_URL="http://localhost:8000/api/health"
HEALTH_CHECK_TIMEOUT=30

# ========================================
# 색상 코드
# ========================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ========================================
# 유틸리티 함수
# ========================================
log_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
  echo -e "${RED}❌ $1${NC}"
}

# .env 파일 체크
check_env_file() {
  if [ ! -f .env ]; then
    log_error ".env 파일이 존재하지 않습니다."
    log_info ".env.example을 참고하여 .env 파일을 생성하세요."
    exit 1
  fi

  log_success ".env 파일 존재 확인"

  # 필수 환경 변수 체크
  source .env
  for var in "${REQUIRED_ENV_VARS[@]}"; do
    if [ -z "${!var}" ]; then
      log_error "필수 환경 변수 '$var'가 설정되지 않았습니다."
      exit 1
    fi
  done

  log_success "필수 환경 변수 확인 완료"
}

# 브랜치 확인
check_branch() {
  local current_branch=$(git branch --show-current)
  if [ "$current_branch" != "dev" ]; then
    log_warning "현재 브랜치: $current_branch (dev가 아님)"
    read -p "계속 진행하시겠습니까? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      log_info "배포 취소됨"
      exit 0
    fi
  else
    log_success "현재 브랜치: dev"
  fi
}

# 헬스체크
health_check() {
  log_info "헬스체크 시작..."

  local elapsed=0
  while [ $elapsed -lt $HEALTH_CHECK_TIMEOUT ]; do
    if curl -f -s $HEALTH_CHECK_URL > /dev/null 2>&1; then
      log_success "헬스체크 성공!"
      return 0
    fi

    sleep 2
    elapsed=$((elapsed + 2))
    echo -n "."
  done

  echo ""
  log_error "헬스체크 실패 (타임아웃: ${HEALTH_CHECK_TIMEOUT}초)"
  log_info "로그를 확인하세요: ./deploy.sh logs"
  return 1
}

# 배포 확인 프롬프트
confirm_deploy() {
  echo ""
  log_warning "=========================================="
  log_warning "  ⚠️  프로덕션 배포 확인"
  log_warning "=========================================="
  echo ""
  echo "  현재 브랜치: $(git branch --show-current)"
  echo "  최신 커밋: $(git log -1 --oneline)"
  echo ""
  read -p "배포를 진행하시겠습니까? (y/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_info "배포 취소됨"
    exit 0
  fi
}

# 도움말
show_help() {
  echo "=========================================="
  echo "  Stock 프로젝트 배포 스크립트"
  echo "=========================================="
  echo ""
  echo "사용법: ./deploy.sh [command]"
  echo ""
  echo "Commands:"
  echo "  help      - 도움말 표시"
  echo "  pull      - Git pull origin dev"
  echo "  build     - Docker 이미지 빌드 (캐시 없이)"
  echo "  up        - Docker 컨테이너 시작"
  echo "  down      - Docker 컨테이너 중지 및 삭제"
  echo "  restart   - Docker 컨테이너 재시작"
  echo "  logs      - Docker 로그 확인"
  echo "              예: ./deploy.sh logs"
  echo "              예: ./deploy.sh logs nginx"
  echo "  ps        - Docker 컨테이너 상태 확인"
  echo "  health    - 헬스체크 실행"
  echo "  deploy    - 전체 배포 (pull + build + up + health)"
  echo "  ssl-init  - SSL 인증서 초기 발급 (Certbot)"
  echo ""
  echo "Examples:"
  echo "  ./deploy.sh deploy        # 전체 배포"
  echo "  ./deploy.sh logs nginx    # nginx 로그만 확인"
  echo "  ./deploy.sh ssl-init      # SSL 인증서 초기 발급"
  echo ""
}

# ========================================
# 메인 스크립트
# ========================================

case "$1" in
help|--help|-h|"")
  show_help
  ;;

pull)
  log_info "Git Pull..."
  check_branch
  git pull origin dev
  log_success "Pull 완료"
  ;;

build)
  log_info "Docker Build..."
  check_env_file
  docker compose $COMPOSE_FILES build --no-cache
  log_success "Build 완료"
  ;;

up)
  log_info "Docker Up..."
  check_env_file
  docker compose $COMPOSE_FILES up -d
  log_success "컨테이너 시작 완료"
  ;;

down)
  log_info "Docker Down..."
  docker compose $COMPOSE_FILES down
  log_success "컨테이너 중지 완료"
  ;;

restart)
  log_info "Docker Restart..."
  docker compose $COMPOSE_FILES restart
  log_success "재시작 완료"
  ;;

logs)
  docker compose $COMPOSE_FILES logs -f ${2:-}
  ;;

ps)
  docker compose $COMPOSE_FILES ps
  ;;

health)
  health_check
  ;;

deploy)
  echo "=========================================="
  echo "  🚀 전체 배포 시작"
  echo "=========================================="
  echo ""

  # 배포 확인
  confirm_deploy

  # 1단계: 환경 체크
  log_info "1/6 환경 체크..."
  check_env_file
  check_branch
  echo ""

  # 2단계: Git Pull
  log_info "2/6 Git Pull..."
  git pull origin dev
  log_success "Pull 완료"
  echo ""

  # 3단계: 기존 컨테이너 중지
  log_info "3/6 기존 컨테이너 중지..."
  docker compose $COMPOSE_FILES down
  log_success "중지 완료"
  echo ""

  # 4단계: Docker Build
  log_info "4/6 Docker Build..."
  docker compose $COMPOSE_FILES build --no-cache
  log_success "Build 완료"
  echo ""

  # 5단계: Docker Up
  log_info "5/6 Docker Up..."
  docker compose $COMPOSE_FILES up -d
  log_success "시작 완료"
  echo ""

  # 6단계: 헬스체크
  log_info "6/6 헬스체크..."
  if health_check; then
    echo ""
    echo "=========================================="
    log_success "  ✅ 배포 완료!"
    echo "=========================================="
    echo ""
    docker compose $COMPOSE_FILES ps
  else
    echo ""
    log_error "배포 실패. 로그를 확인하세요."
    echo ""
    docker compose $COMPOSE_FILES ps
    exit 1
  fi
  ;;

ssl-init)
  echo "=========================================="
  echo "  🔐 SSL 인증서 설정"
  echo "=========================================="
  echo ""

  # 사전 체크
  if [ ! -f .env ]; then
    log_error ".env 파일이 없습니다."
    exit 1
  fi
  source .env

  if [ -z "$DOMAIN" ]; then
    log_error ".env에 DOMAIN이 설정되지 않았습니다. (예: DOMAIN=example.com)"
    exit 1
  fi

  if [ ! -f "nginx/nginx.ssl.conf.template" ]; then
    log_error "nginx/nginx.ssl.conf.template 파일이 없습니다."
    exit 1
  fi

  log_info "도메인: $DOMAIN"
  echo ""

  # 1단계: 스택 기동 확인 (HTTP 모드 nginx로 시작)
  log_info "1/4 컨테이너 기동 확인 (HTTP 모드)..."
  docker compose $COMPOSE_FILES up -d
  echo -n "nginx 준비 대기 중"
  for i in $(seq 1 15); do
    if curl -f -s "http://localhost/health" > /dev/null 2>&1; then
      echo ""
      log_success "nginx HTTP 응답 확인"
      break
    fi
    echo -n "."
    sleep 2
  done
  echo ""

  # 2단계: 인증서 발급 (기존 인증서가 있으면 스킵)
  log_info "2/4 SSL 인증서 확인..."
  CERT_EXISTS=$(docker compose $COMPOSE_FILES run --rm certbot \
    sh -c "test -f /etc/letsencrypt/live/${DOMAIN}/fullchain.pem && echo yes || echo no" 2>/dev/null || echo "no")

  if [ "$CERT_EXISTS" = "yes" ]; then
    log_success "기존 인증서 발견 → 인증서 발급 스킵"
  else
    read -p "이메일 주소를 입력하세요 (Let's Encrypt 알림용): " email
    if [ -z "$email" ]; then
      log_error "이메일 주소가 필요합니다."
      exit 1
    fi

    log_info "Certbot 인증서 발급 중..."
    docker compose $COMPOSE_FILES run --rm certbot certbot certonly \
      --webroot -w /var/www/certbot \
      --email "$email" \
      -d "$DOMAIN" \
      --agree-tos \
      --non-interactive

    if [ $? -ne 0 ]; then
      log_error "인증서 발급 실패!"
      echo ""
      log_warning "확인사항:"
      echo "  1. DNS A레코드가 이 서버 IP(${SERVER_IP:-?})를 가리키는지 확인"
      echo "  2. GCP 방화벽에서 80, 443 포트가 열려있는지 확인"
      echo "  3. 도메인: $DOMAIN"
      exit 1
    fi
    log_success "인증서 발급 완료!"
  fi
  echo ""

  # 3단계: nginx.conf를 SSL 버전으로 교체
  log_info "3/4 nginx.conf SSL 버전으로 업데이트..."
  DOMAIN="$DOMAIN" envsubst '${DOMAIN}' < nginx/nginx.ssl.conf.template > nginx/nginx.conf
  log_success "nginx/nginx.conf → SSL 모드 적용"
  echo ""

  # 4단계: nginx 재시작
  log_info "4/4 nginx 재시작..."
  docker compose $COMPOSE_FILES restart nginx
  sleep 3

  if curl -f -s -k "https://localhost/health" > /dev/null 2>&1 || \
     curl -f -s "https://$DOMAIN/health" > /dev/null 2>&1; then
    log_success "HTTPS 응답 확인!"
  else
    log_warning "nginx 재시작 완료. 브라우저에서 확인하세요."
  fi

  echo ""
  echo "=========================================="
  log_success "  SSL 설정 완료!"
  echo "  URL: https://$DOMAIN"
  echo "  인증서 자동갱신: certbot 컨테이너가 12h마다 체크"
  echo "=========================================="
  echo ""
  log_warning "git pull 후 nginx.conf가 HTTP 모드로 되돌아오면:"
  echo "         ./deploy.sh ssl-init 재실행 (인증서 발급 자동 스킵)"
  echo ""
  ;;

*)
  log_error "알 수 없는 명령어: $1"
  echo ""
  show_help
  exit 1
  ;;
esac
