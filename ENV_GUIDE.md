# 환경 변수 파일 사용 가이드

> **목적**: 개발/프로덕션 환경별로 올바른 `.env` 파일을 사용하도록 안내

---

## 📋 파일 구조

```
프로젝트 루트:
  ├── .env.example               (개발 환경 템플릿)
  └── .env.production.example    (프로덕션 환경 템플릿)

앱별 (개발 환경만):
  ├── backend/.env.example       (Backend 개발)
  └── frontend/.env.example      (Frontend 개발)
```

---

## 🎯 사용 시나리오

### 1️⃣ 로컬 개발 환경

**파일**: `.env.example` → `.env`

```bash
# 1. 템플릿 복사
cp .env.example .env

# 2. 필수 항목만 입력
# - GEMINI_API_KEY (필수)
# - JWT_SECRET_KEY (필수)
# - ENCRYPTION_KEY (필수)
# - FRED_API_KEY (선택)
# - ECOS_API_KEY (선택)
nano .env
```

**특징**:
- ✅ `ENVIRONMENT=development`
- ✅ `LOG_LEVEL=DEBUG` (상세 로그)
- ✅ `USE_SECRET_MANAGER=false` (Secret Manager 비활성화)
- ✅ CORS: `localhost:5173` (Vite dev server)

---

### 2️⃣ 프로덕션 배포 (SSL)

**파일**: `.env.production.example` → `.env`

```bash
# 1. 템플릿 복사
cp .env.production.example .env

# 2. SSL 설정 추가 입력
nano .env
```

**필수 설정**:
```bash
# SSL/HTTPS (추가)
DOMAIN=example.com
SSL_EMAIL=admin@example.com

# 서버
SERVER_IP=0.0.0.0
ENVIRONMENT=production

# Secret Manager
USE_SECRET_MANAGER=true  # 권장
```

**배포 명령어**:
```bash
# override.yml이 자동 적용되어 SSL 환경으로 실행됨
docker compose up -d --build
```

---

### 3️⃣ 일반 프로덕션 (SSL 없음)

**파일**: `.env.production.example` → `.env`

```bash
# 1. 템플릿 복사
cp .env.production.example .env

# 2. 기본 설정만 입력 (SSL 섹션 스킵)
nano .env
```

**필수 설정**:
```bash
# 서버
SERVER_IP=YOUR-VM-IP
ENVIRONMENT=production

# Secret Manager (선택)
USE_SECRET_MANAGER=false  # .env에서 키 로드
GEMINI_API_KEY=your_key_here
# ... (다른 API 키들)
```

**배포 명령어**:
```bash
# override.yml을 무시하고 기본 환경만 사용
docker compose -f docker-compose.yml up -d --build
```

---

## 🔐 보안 계층 구분

### 🔴 높은 보안 (Secret Manager 권장)

프로덕션에서는 Secret Manager 사용 권장:

```bash
USE_SECRET_MANAGER=true
```

**Secret Manager에서 가져오는 키**:
- `gemini-api-key` (Gemini AI)
- `kis-app-key`, `kis-app-secret` (한국투자증권)
- `jwt-secret-key` (사용자 인증)
- `encryption-key` (데이터 암호화)
- `admin-password` (Admin 계정)

### 🟢 낮은 보안 (.env 유지 가능)

무료 API는 `.env`에 직접 입력 가능:
- `FRED_API_KEY` (미국 경제지표)
- `ECOS_API_KEY` (한국은행 경제통계)

---

## 📊 환경별 비교

| 항목 | 개발 | 프로덕션 (SSL) | 프로덕션 (일반) |
|------|------|---------------|----------------|
| **파일** | `.env.example` | `.env.production.example` | `.env.production.example` |
| **환경** | `development` | `production` | `production` |
| **로그** | `DEBUG` | `INFO` | `INFO` |
| **Secret Manager** | ❌ | ✅ 권장 | ✅ 권장 |
| **SSL 설정** | ❌ | ✅ 필수 | ❌ |
| **CORS** | `localhost:5173` | `DOMAIN` | `VM IP` |

---

## ✅ 체크리스트

### 개발 환경

- [ ] `.env.example`을 `.env`로 복사
- [ ] `GEMINI_API_KEY` 입력 (필수)
- [ ] `JWT_SECRET_KEY` 생성 및 입력
- [ ] `ENCRYPTION_KEY` 생성 및 입력
- [ ] `ENVIRONMENT=development` 확인
- [ ] `USE_SECRET_MANAGER=false` 확인

### 프로덕션 (SSL)

- [ ] `.env.production.example`을 `.env`로 복사
- [ ] `DOMAIN` 입력 (실제 도메인)
- [ ] `SSL_EMAIL` 입력
- [ ] `SERVER_IP=0.0.0.0` 확인
- [ ] `USE_SECRET_MANAGER=true` 설정
- [ ] `nginx/certbot-init.sh` 실행
- [ ] `docker compose up -d --build` 실행

---

## 🛠️ 유용한 명령어

### 키 생성

```bash
# JWT Secret 생성
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Encryption Key 생성
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

### 환경 변수 확인

```bash
# Docker Compose 설정 확인
docker compose config

# 프로덕션 설정 확인
docker compose -f docker-compose.prod.yml config
```

### Secret Manager

```bash
# 키 등록 (예: Gemini API Key)
echo -n "your_api_key" | gcloud secrets create gemini-api-key --data-file=-

# 키 확인
gcloud secrets versions access latest --secret="gemini-api-key"
```

---

## 📚 참고 문서

- **개발 환경**: [docs/QUICK_START.md](docs/QUICK_START.md)
- **SSL 설정**: [SETUP_SSL.md](SETUP_SSL.md)
- **Secret Manager**: [docs/SECRET_MANAGER_SETUP.md](docs/SECRET_MANAGER_SETUP.md)
- **Docker 구조**: [DOCKER_STRUCTURE.md](DOCKER_STRUCTURE.md)

---

**최종 업데이트**: 2026-02-12
**요약**: 환경별로 올바른 `.env` 템플릿을 사용하세요!
