# Docker Compose 구조 가이드

> GCP VM 환경에서의 Docker Compose 파일 구조 및 사용법

---

## 📋 파일 구조

```
프로젝트 루트:
├── docker-compose.yml          (기본 설정)
├── docker-compose.override.yml (GCP VM - 자동 적용) ✅
└── docker-compose.dev.yml      (로컬 개발 - Hot Reload)
```

**3개 파일만 유지** - 명확하고 간단한 구조

---

## 🎯 각 파일의 역할

### 1. `docker-compose.yml` (기본)

**역할**: 프로덕션 기본 설정

**내용**:
- Backend + Frontend 서비스 정의
- 환경 변수 설정
- 네트워크 설정
- 볼륨 마운트 (데이터베이스)
- 로컬 빌드 설정

**사용**: 항상 기본으로 로드됨

---

### 2. `docker-compose.override.yml` ✅ (GCP VM 자동 적용)

**역할**: GCP VM 프로덕션 환경 (Artifact Registry + SSL)

**내용**:
- ✅ Artifact Registry 이미지 오버라이드
  ```yaml
  image: us-central1-docker.pkg.dev/.../stock-backend:latest
  ```
- ✅ SSL/HTTPS 설정
  - Nginx 리버스 프록시 추가
  - Certbot 자동 인증서 발급/갱신
  - HTTP → HTTPS 리디렉션
- ✅ 포트 설정 조정
  - Backend/Frontend 외부 포트 제거
  - Nginx를 통해서만 접근 (80, 443)

**사용**: GCP VM에서 `docker compose up -d` 실행 시 **자동 적용**

**특징**:
- Docker Compose가 자동으로 `override.yml`을 읽어서 적용
- 별도 `-f` 옵션 불필요
- 기본 설정을 **오버라이드**하여 GCP VM 환경으로 변환

---

### 3. `docker-compose.dev.yml` (로컬 개발)

**역할**: 로컬 개발 환경 (Hot Reload)

**내용**:
- 소스 코드 볼륨 마운트
- Hot Reload 활성화
  - Backend: `uvicorn --reload`
  - Frontend: Vite Dev Server (5173)
- 개발 환경 변수
- 로컬 빌드

**사용**:
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

**특징**:
- 코드 수정 시 자동 재시작
- 빠른 개발 사이클
- Dockerfile.dev 사용 (Frontend)

---

## 🚀 사용 방법

### GCP VM 프로덕션 배포 (권장) ✅

**명령어**:
```bash
./deploy.sh
```

또는

```bash
docker compose up -d
```

**자동 적용 파일**:
1. `docker-compose.yml` (기본)
2. `docker-compose.override.yml` (자동 오버라이드)

**결과**:
- ✅ Artifact Registry 이미지 사용
- ✅ SSL/HTTPS 활성화 (Nginx + Certbot)
- ✅ HTTP → HTTPS 리디렉션
- ✅ 포트: 80 (HTTP), 443 (HTTPS)
- ✅ Backend/Frontend는 Nginx 뒤에 숨김

---

### 로컬 개발 환경

**명령어**:
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

**적용 파일**:
1. `docker-compose.yml` (기본)
2. `docker-compose.dev.yml` (개발 - override.yml 무시)

**결과**:
- ✅ 로컬 빌드
- ✅ Hot Reload
- ✅ 소스 코드 마운트
- ✅ Frontend: http://localhost:5173
- ✅ Backend: http://localhost:8000

---

## 📊 Override 동작 방식

### GCP VM에서 자동 적용

```
docker compose up -d
    ↓
1. docker-compose.yml 로드 (기본)
    - services: backend, frontend
    - build: ./backend, ./frontend
    ↓
2. docker-compose.override.yml 자동 병합 (오버라이드)
    - services: backend (image 오버라이드)
    - services: frontend (image 오버라이드)
    - services: nginx (추가)
    - services: certbot (추가)
    ↓
최종 결과:
    - backend: Artifact Registry 이미지 사용
    - frontend: Artifact Registry 이미지 사용
    - nginx: SSL 리버스 프록시
    - certbot: 자동 인증서 갱신
```

### 명시적 파일 지정 시

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

**동작**:
- `docker-compose.override.yml` **무시됨**
- `docker-compose.dev.yml`만 적용됨

---

## 🔧 환경 변수

### 필수 (.env)

```bash
# GCP 설정 (override.yml 사용 시 필수)
GCP_PROJECT_ID=your-project-id
REGION=us-central1
REPOSITORY=stock-app

# 서버 설정
SERVER_IP=YOUR-VM-EXTERNAL-IP
ENVIRONMENT=production

# SSL 설정 (선택 - SSL 사용 시)
DOMAIN=example.com
SSL_EMAIL=admin@example.com

# Secret Manager
USE_SECRET_MANAGER=true
```

---

## 🛠️ 유용한 명령어

### 설정 확인

```bash
# 최종 적용될 설정 확인 (override.yml 포함)
docker compose config

# 개발 환경 설정 확인
docker compose -f docker-compose.yml -f docker-compose.dev.yml config
```

### 로그 확인

```bash
# 전체 로그
docker compose logs -f

# 특정 서비스 로그
docker compose logs -f backend
docker compose logs -f nginx
```

### 컨테이너 관리

```bash
# 시작
docker compose up -d

# 중지
docker compose down

# 재시작
docker compose restart

# 상태 확인
docker compose ps
```

---

## 📋 시나리오별 가이드

### 1. GCP VM 최초 배포 (SSL 포함)

```bash
# 1. 프로젝트 클론
git clone https://github.com/YOUR-USERNAME/stock.git
cd stock

# 2. 환경 변수 설정
cp .env.production.example .env
nano .env  # GCP_PROJECT_ID, REGION, DOMAIN 입력

# 3. Docker 인증
gcloud auth configure-docker us-central1-docker.pkg.dev

# 4. SSL 인증서 발급 (최초 1회)
chmod +x nginx/certbot-init.sh
./nginx/certbot-init.sh

# 5. 배포
chmod +x deploy.sh
./deploy.sh
```

**적용**: `docker-compose.yml` + `docker-compose.override.yml` (자동)

---

### 2. 로컬 개발

```bash
# 1. 환경 변수 설정
cp .env.example .env
nano .env  # GEMINI_API_KEY 등 입력

# 2. 개발 환경 실행
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# 3. 접속
# Frontend: http://localhost:5173
# Backend: http://localhost:8000/docs
```

---

### 3. override.yml 무시하고 테스트

```bash
# override.yml을 명시적으로 제외
docker compose -f docker-compose.yml up -d
```

**결과**: 로컬 빌드 사용, SSL 없음

---

## ✅ 정리

| 시나리오 | 명령어 | 적용 파일 | SSL | 이미지 |
|---------|--------|----------|-----|--------|
| **GCP VM** | `./deploy.sh` | yml + override.yml | ✅ | Artifact Registry |
| **로컬 개발** | `-f yml -f dev.yml` | yml + dev.yml | ❌ | 로컬 빌드 |
| **기본 테스트** | `-f yml` | yml만 | ❌ | 로컬 빌드 |

---

## 💡 핵심 개념

### Override의 의미

`docker-compose.override.yml`은 **자동으로 적용**되는 설정 파일입니다:

- ✅ `docker compose up` 실행 시 **자동 병합**
- ✅ 기본 설정을 **덮어씀** (override)
- ✅ GCP VM 환경을 위한 **표준 설정**
- ✅ `-f` 옵션으로 다른 파일 지정 시 **무시됨**

### 왜 3개 파일만?

1. **`docker-compose.yml`** - 공통 기본 설정
2. **`docker-compose.override.yml`** - GCP VM 자동 적용 (SSL + Artifact Registry)
3. **`docker-compose.dev.yml`** - 로컬 개발 환경

**삭제된 파일**:
- ❌ `docker-compose.prod.yml` - override.yml로 대체
- ❌ `docker-compose.ssl.yml` - override.yml에 통합

**이유**: 명확성과 단순성. override.yml이 GCP VM의 모든 설정을 담당.

---

**최종 업데이트**: 2026-02-11
**권장**: `./deploy.sh` (override.yml 자동 적용)
**구조**: 3개 파일만 유지 (기본 + override + dev)
