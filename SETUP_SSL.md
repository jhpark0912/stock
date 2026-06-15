# Docker + SSL 프로덕션 환경 설정 가이드

클라우드 서버에서 무료 도메인과 Let's Encrypt SSL 인증서를 사용하여 프로덕션 환경을 구축하는 단계별 가이드입니다.

---

## 📋 목차

1. [환경 준비](#1-환경-준비)
2. [도메인 발급 및 설정](#2-도메인-발급-및-설정)
3. [프로젝트 배포](#3-프로젝트-배포)
4. [SSL 인증서 발급](#4-ssl-인증서-발급)
5. [서비스 실행](#5-서비스-실행)
6. [확인 및 모니터링](#6-확인-및-모니터링)

---

## 1. 환경 준비

### 1.1 클라우드 서버 선택

무료 또는 저렴한 클라우드 서비스:

| 서비스 | 무료/저렴 플랜 | 특징 |
|--------|---------------|------|
| **Oracle Cloud** | Always Free (1-2 VM) | 24GB RAM + 200GB 스토리지 |
| **Google Cloud** | $300 크레딧 (90일) | 강력한 인프라 |
| **AWS** | 12개월 무료 (EC2 t2.micro) | 널리 사용됨 |
| **Azure** | $200 크레딧 (30일) | MS 통합 |
| **DigitalOcean** | $200 크레딧 (60일) | 간단한 설정 |
| **Vultr** | $100 크레딧 (30일) | 빠른 속도 |

**권장 스펙** (최소):
- CPU: 2 vCPU
- RAM: 2GB
- 스토리지: 20GB
- OS: Ubuntu 22.04 LTS

### 1.2 방화벽 설정

클라우드 콘솔에서 다음 포트를 오픈하세요:

| 포트 | 용도 | 필수 |
|------|------|------|
| **22** | SSH | ✅ (관리용) |
| **80** | HTTP | ✅ (SSL 인증) |
| **443** | HTTPS | ✅ (서비스) |

**예시 (Oracle Cloud)**:
```
Networking → Virtual Cloud Networks → Security Lists
→ Ingress Rules → Add Ingress Rule
  - Source CIDR: 0.0.0.0/0
  - Destination Port Range: 80,443
  - Protocol: TCP
```

### 1.3 Docker 설치

서버에 SSH 접속 후:

```bash
# Docker 설치 스크립트 (Ubuntu)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 현재 사용자를 docker 그룹에 추가
sudo usermod -aG docker $USER

# 재로그인 (또는 재부팅)
exit

# Docker Compose 설치 (최신 버전)
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 설치 확인
docker --version
docker-compose --version
```

---

## 2. 도메인 발급 및 설정

### 2.1 무료 도메인 발급

#### 옵션 1: Freenom (추천)

1. **https://www.freenom.com** 접속
2. 원하는 도메인 검색 (예: `mystock.tk`)
3. **Get it now!** → **Checkout**
4. **Period: 12 Months @ FREE** 선택
5. 이메일로 가입 후 결제 (무료)

**사용 가능한 무료 도메인**:
- `.tk` (토켈라우)
- `.ml` (말리)
- `.ga` (가봉)
- `.cf` (중앙아프리카 공화국)
- `.gq` (적도 기니)

#### 옵션 2: DuckDNS (간단함)

1. **https://www.duckdns.org** 접속
2. GitHub/Google 계정으로 로그인
3. 서브도메인 입력 (예: `mystock.duckdns.org`)
4. 서버 IP 입력 → **Add Domain**

#### 옵션 3: No-IP (Dynamic DNS)

1. **https://www.noip.com** 접속
2. 무료 계정 가입
3. **Dynamic DNS** → **No-IP Hostnames** → **Create Hostname**
4. 서브도메인 선택 (예: `mystock.ddns.net`)

### 2.2 DNS A 레코드 설정

#### Freenom 설정

1. **My Domains** → **Manage Domain** → **Manage Freenom DNS**
2. 다음 레코드 추가:

| Name | Type | TTL | Target |
|------|------|-----|--------|
| (비워둠) | A | 14400 | YOUR_SERVER_IP |
| www | A | 14400 | YOUR_SERVER_IP |

#### DuckDNS 설정

자동으로 설정됨 (웹 UI에서 IP 입력 시)

#### No-IP 설정

1. **Dynamic DNS** → **No-IP Hostnames** → **Modify**
2. **IP Address** 입력 → **Update Hostname**

### 2.3 DNS 전파 확인 (5분~24시간 소요)

로컬 PC에서 확인:

```bash
# Windows (PowerShell)
nslookup mystock.tk

# Linux/Mac
dig +short mystock.tk
```

**예상 출력**:
```
203.0.113.42  # 서버 IP가 표시되어야 함
```

---

## 3. 프로젝트 배포

### 3.1 프로젝트 Clone

서버에 SSH 접속 후:

```bash
# 프로젝트 Clone
git clone https://github.com/YOUR_USERNAME/stock.git
cd stock
```

또는 **로컬에서 직접 업로드** (SCP):

```bash
# Windows (PowerShell)
scp -r C:\Exception\0.STUDY\stock ubuntu@YOUR_SERVER_IP:/home/ubuntu/

# Linux/Mac
scp -r /path/to/stock ubuntu@YOUR_SERVER_IP:/home/ubuntu/
```

### 3.2 환경 변수 설정

```bash
# .env 파일 생성
cp .env.production.example .env

# 편집 (nano/vi 사용)
nano .env
```

**필수 수정 항목**:

```bash
# 도메인 설정 (발급받은 도메인으로 변경)
DOMAIN=mystock.tk
SSL_EMAIL=your-email@gmail.com

# 서버 IP
SERVER_IP=203.0.113.42

# API 키 (선택 - 있으면 추가)
FRED_API_KEY=your_fred_api_key
ECOS_API_KEY=your_ecos_api_key
GEMINI_API_KEY=your_gemini_api_key
```

**저장**: `Ctrl+X` → `Y` → `Enter`

---

## 4. SSL 인증서 발급

### 4.1 초기 설정 스크립트 실행

```bash
# 실행 권한 부여
chmod +x nginx/certbot-init.sh

# SSL 인증서 발급
./nginx/certbot-init.sh
```

**실행 과정** (1-2분 소요):

```
✅ DNS 확인 완료: mystock.tk → 203.0.113.42
🚀 Nginx 시작 중 (HTTP Only)...
🔐 Let's Encrypt 인증서 발급 중...

Requesting a certificate for mystock.tk
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/mystock.tk/fullchain.pem

✅ 인증서 발급 완료!
🔄 전체 스택 재시작 중...

✅ SSL 설정 완료!
이제 다음 URL로 접속 가능합니다:
https://mystock.tk
```

### 4.2 문제 발생 시

**DNS 전파 대기**:
```bash
# DNS 확인 반복 (전파 완료 시까지)
watch -n 5 dig +short mystock.tk
```

**방화벽 확인**:
```bash
# 포트 리스닝 확인
sudo netstat -tuln | grep -E ':(80|443)'
```

**수동 인증서 발급**:
```bash
# Nginx 시작
docker-compose -f docker-compose.yml -f docker-compose.ssl.yml up -d nginx

# 인증서 발급
docker-compose -f docker-compose.yml -f docker-compose.ssl.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email your-email@gmail.com \
    --agree-tos \
    -d mystock.tk

# nginx.conf에서 SSL 경로 주석 해제 (수동)
nano nginx/nginx.conf
# ssl_certificate, ssl_certificate_key 앞의 # 제거

# 재시작
docker-compose -f docker-compose.yml -f docker-compose.ssl.yml down
docker-compose -f docker-compose.yml -f docker-compose.ssl.yml up -d
```

---

## 5. 서비스 실행

### 5.1 Docker Compose 실행

```bash
# 전체 스택 시작
docker-compose -f docker-compose.yml -f docker-compose.ssl.yml up -d

# 로그 확인
docker-compose -f docker-compose.yml -f docker-compose.ssl.yml logs -f
```

### 5.2 컨테이너 상태 확인

```bash
docker-compose -f docker-compose.yml -f docker-compose.ssl.yml ps
```

**예상 출력**:
```
NAME                   STATUS    PORTS
stock-backend          Up        8000/tcp
stock-frontend         Up        80/tcp
stock-nginx            Up        0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
stock-certbot          Up
```

---

## 6. 확인 및 모니터링

### 6.1 HTTPS 접속 테스트

브라우저에서 접속:
```
https://mystock.tk
```

**보안 자물쇠 아이콘** 🔒이 표시되면 성공!

### 6.2 SSL 등급 확인

**SSL Labs 테스트**:
```
https://www.ssllabs.com/ssltest/analyze.html?d=mystock.tk
```

**예상 등급**: A 또는 A+

### 6.3 로그 모니터링

```bash
# 전체 로그
docker-compose -f docker-compose.yml -f docker-compose.ssl.yml logs -f

# 특정 서비스 로그
docker-compose -f docker-compose.yml -f docker-compose.ssl.yml logs -f nginx
docker-compose -f docker-compose.yml -f docker-compose.ssl.yml logs -f backend
```

### 6.4 자동 갱신 확인

```bash
# Certbot 로그
docker-compose -f docker-compose.yml -f docker-compose.ssl.yml logs certbot
```

인증서는 **90일**마다 자동 갱신됩니다.

---

## 🔧 유용한 명령어

### 서비스 관리

```bash
# 시작
docker-compose -f docker-compose.yml -f docker-compose.ssl.yml up -d

# 중지
docker-compose -f docker-compose.yml -f docker-compose.ssl.yml down

# 재시작
docker-compose -f docker-compose.yml -f docker-compose.ssl.yml restart

# 특정 서비스 재시작
docker-compose -f docker-compose.yml -f docker-compose.ssl.yml restart nginx
```

### 업데이트

```bash
# Git Pull
git pull origin main

# 이미지 재빌드
docker-compose -f docker-compose.yml -f docker-compose.ssl.yml build --no-cache

# 재시작
docker-compose -f docker-compose.yml -f docker-compose.ssl.yml down
docker-compose -f docker-compose.yml -f docker-compose.ssl.yml up -d
```

### 인증서 갱신

```bash
# 수동 갱신 테스트
docker-compose -f docker-compose.yml -f docker-compose.ssl.yml run --rm certbot renew --dry-run

# 실제 갱신
docker-compose -f docker-compose.yml -f docker-compose.ssl.yml run --rm certbot renew

# Nginx 재로드
docker-compose -f docker-compose.yml -f docker-compose.ssl.yml exec nginx nginx -s reload
```

---

## 🛠️ 문제 해결

### 문제 1: "502 Bad Gateway"

**원인**: Backend 컨테이너 미실행 또는 크래시

**해결**:
```bash
# Backend 로그 확인
docker-compose -f docker-compose.yml -f docker-compose.ssl.yml logs backend

# Backend 재시작
docker-compose -f docker-compose.yml -f docker-compose.ssl.yml restart backend
```

### 문제 2: "연결이 비공개로 설정되지 않음"

**원인**: SSL 인증서 경로 설정 오류

**해결**:
```bash
# nginx.conf 확인
grep "ssl_certificate" nginx/nginx.conf

# 주석 제거 확인
# ssl_certificate /etc/letsencrypt/live/mystock.tk/fullchain.pem;  # ✅
# # ssl_certificate /etc/letsencrypt/live/mystock.tk/fullchain.pem;  # ❌
```

### 문제 3: HTTP가 HTTPS로 리디렉션되지 않음

**해결**:
```bash
# HTTP 접속 테스트
curl -I http://mystock.tk

# 301 리디렉션 확인
# HTTP/1.1 301 Moved Permanently
# Location: https://mystock.tk/
```

---

## 📚 추가 자료

- [Docker Compose 공식 문서](https://docs.docker.com/compose/)
- [Let's Encrypt 가이드](https://letsencrypt.org/getting-started/)
- [Nginx SSL 설정](https://nginx.org/en/docs/http/configuring_https_servers.html)
- [Oracle Cloud 무료 티어](https://www.oracle.com/cloud/free/)

---

## 🎉 완료!

축하합니다! 이제 무료 도메인과 SSL 인증서로 보안된 프로덕션 환경이 구축되었습니다.

**접속 URL**: https://mystock.tk

**다음 단계**:
1. 모니터링 설정 (Prometheus, Grafana)
2. 백업 자동화 (데이터베이스)
3. CI/CD 파이프라인 구축 (GitHub Actions)

---

**마지막 업데이트**: 2026-02-11
