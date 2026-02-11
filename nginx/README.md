# Nginx + Let's Encrypt SSL 설정 가이드

이 디렉토리는 Docker 기반 프로덕션 환경에서 **무료 SSL 인증서(Let's Encrypt)**를 자동으로 발급하고 관리하는 설정을 포함합니다.

---

## 📋 목차

1. [사전 준비](#사전-준비)
2. [도메인 설정](#도메인-설정)
3. [SSL 인증서 발급](#ssl-인증서-발급)
4. [실행 및 확인](#실행-및-확인)
5. [문제 해결](#문제-해결)
6. [인증서 갱신](#인증서-갱신)

---

## 🎯 사전 준비

### 1. 클라우드 서버 준비

- **방화벽 포트 오픈**: 80 (HTTP), 443 (HTTPS)
- **공인 IP 할당**: 고정 IP 권장
- **Docker 및 Docker Compose 설치**

### 2. 무료 도메인 발급 (선택)

도메인이 없다면 무료 도메인을 발급받으세요:

| 서비스 | 도메인 유형 | URL |
|--------|------------|-----|
| **Freenom** | .tk, .ml, .ga, .cf, .gq | https://www.freenom.com |
| **DuckDNS** | 서브도메인 (예: mystock.duckdns.org) | https://www.duckdns.org |
| **No-IP** | Dynamic DNS | https://www.noip.com |

---

## 🌐 도메인 설정

### 1. DNS A 레코드 설정

도메인의 DNS 설정에서 **A 레코드**를 서버의 공인 IP로 설정하세요.

**예시 (Freenom)**:
```
Type: A
Name: @ (또는 비워둠)
TTL: 14400
Target: 203.0.113.42 (서버 IP)
```

**예시 (DuckDNS)**:
```bash
# DuckDNS 토큰으로 IP 업데이트
curl "https://www.duckdns.org/update?domains=mystock&token=YOUR_TOKEN&ip=203.0.113.42"
```

### 2. DNS 전파 확인 (5분~24시간 소요)

```bash
# DNS 조회
dig +short example.com

# 또는
nslookup example.com
```

서버 IP가 출력되면 DNS 설정 완료!

---

## 🔐 SSL 인증서 발급

### 1. 환경 변수 설정

프로젝트 루트의 `.env` 파일에 도메인 설정:

```bash
# .env.ssl.example을 복사
cp .env.ssl.example .env

# 도메인과 이메일 수정
DOMAIN=example.com
SSL_EMAIL=admin@example.com
```

### 2. 초기 설정 스크립트 실행

```bash
# 실행 권한 부여 (Linux/Mac)
chmod +x nginx/certbot-init.sh

# SSL 인증서 발급
./nginx/certbot-init.sh
```

**Windows (Git Bash):**
```bash
bash nginx/certbot-init.sh
```

**Windows (PowerShell - 수동 실행):**
```powershell
# 1. 환경 변수 로드
$env:DOMAIN = "example.com"
$env:SSL_EMAIL = "admin@example.com"

# 2. Nginx 시작 (HTTP Only)
docker-compose -f docker-compose.yml -f docker-compose.ssl.yml up -d nginx

# 3. 인증서 발급
docker-compose -f docker-compose.yml -f docker-compose.ssl.yml run --rm certbot certonly `
    --webroot `
    --webroot-path=/var/www/certbot `
    --email $env:SSL_EMAIL `
    --agree-tos `
    --no-eff-email `
    -d $env:DOMAIN

# 4. nginx.conf에서 SSL 경로 주석 해제 (수동 편집)
# 5. 전체 스택 재시작
docker-compose -f docker-compose.yml -f docker-compose.ssl.yml down
docker-compose -f docker-compose.yml -f docker-compose.ssl.yml up -d
```

### 3. 발급 과정 확인

스크립트가 자동으로 다음을 수행합니다:

1. ✅ DNS 설정 확인
2. ✅ Nginx 시작 (HTTP Only)
3. ✅ Let's Encrypt 인증서 발급
4. ✅ `nginx.conf`에서 SSL 경로 주석 해제
5. ✅ 전체 스택 재시작 (HTTPS 활성화)

---

## 🚀 실행 및 확인

### 1. 컨테이너 상태 확인

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

### 2. HTTPS 접속 테스트

브라우저에서 접속:
```
https://example.com
```

**보안 자물쇠 아이콘**이 표시되면 성공! 🎉

### 3. SSL 인증서 정보 확인

```bash
# 인증서 유효 기간 확인
docker-compose -f docker-compose.yml -f docker-compose.ssl.yml exec certbot \
    certbot certificates
```

**예상 출력**:
```
Certificate Name: example.com
  Domains: example.com
  Expiry Date: 2026-05-10 (90 days)
  Certificate Path: /etc/letsencrypt/live/example.com/fullchain.pem
  Private Key Path: /etc/letsencrypt/live/example.com/privkey.pem
```

---

## 🛠️ 문제 해결

### 문제 1: 인증서 발급 실패

**증상**:
```
Challenge failed for domain example.com
```

**원인 및 해결**:

| 원인 | 해결 방법 |
|------|----------|
| DNS 설정 오류 | `dig +short example.com`으로 IP 확인 |
| 방화벽 차단 | 80, 443 포트 오픈 확인 |
| 도메인 중복 사용 | 기존 인증서 삭제 후 재발급 |

```bash
# 기존 인증서 삭제
docker-compose -f docker-compose.yml -f docker-compose.ssl.yml run --rm certbot delete

# 재발급
./nginx/certbot-init.sh
```

### 문제 2: HTTPS 접속 시 "연결이 비공개로 설정되지 않음"

**원인**: `nginx.conf`에서 SSL 인증서 경로가 주석 처리되어 있음

**해결**:
```bash
# nginx.conf 확인
grep "ssl_certificate" nginx/nginx.conf

# 주석 처리되어 있으면 수동으로 제거
# ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;

# Nginx 재시작
docker-compose -f docker-compose.yml -f docker-compose.ssl.yml restart nginx
```

### 문제 3: HTTP가 HTTPS로 리디렉션되지 않음

**확인**:
```bash
curl -I http://example.com
```

**예상 응답**:
```
HTTP/1.1 301 Moved Permanently
Location: https://example.com/
```

**해결**:
```bash
# nginx.conf 확인 (HTTP 서버 블록)
# location / { return 301 https://$host$request_uri; }

# Nginx 재시작
docker-compose -f docker-compose.yml -f docker-compose.ssl.yml restart nginx
```

---

## 🔄 인증서 갱신

Let's Encrypt 인증서는 **90일**마다 만료됩니다. Certbot 컨테이너가 **자동 갱신**을 처리합니다.

### 자동 갱신 확인

```bash
# Certbot 로그 확인
docker-compose -f docker-compose.yml -f docker-compose.ssl.yml logs certbot
```

**예상 로그**:
```
Cert not yet due for renewal
```

### 수동 갱신 (테스트)

```bash
# Dry-run 테스트 (실제 갱신 안 함)
docker-compose -f docker-compose.yml -f docker-compose.ssl.yml run --rm certbot renew --dry-run

# 실제 갱신
docker-compose -f docker-compose.yml -f docker-compose.ssl.yml run --rm certbot renew

# Nginx 재로드
docker-compose -f docker-compose.yml -f docker-compose.ssl.yml exec nginx nginx -s reload
```

---

## 📚 추가 자료

- [Let's Encrypt 공식 문서](https://letsencrypt.org/docs/)
- [Certbot 사용자 가이드](https://certbot.eff.org/docs/)
- [Nginx SSL 설정 가이드](https://nginx.org/en/docs/http/configuring_https_servers.html)

---

## 🔒 보안 권장 사항

1. **인증서 파일 보호**: `certbot-etc`, `certbot-var` 볼륨은 절대 공개하지 마세요.
2. **이메일 확인**: SSL_EMAIL로 Let's Encrypt 알림을 받으세요.
3. **정기 업데이트**: Nginx, Certbot 이미지를 최신 버전으로 유지하세요.

```bash
# 이미지 업데이트
docker-compose -f docker-compose.yml -f docker-compose.ssl.yml pull
docker-compose -f docker-compose.yml -f docker-compose.ssl.yml up -d
```

---

**마지막 업데이트**: 2026-02-11
