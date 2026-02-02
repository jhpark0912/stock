# 🐳 Docker 배포 구성 완료 요약

## 📋 생성된 파일 목록

### 1. Docker 설정 파일

| 파일명 | 경로 | 설명 |
|--------|------|------|
| `Dockerfile` | `backend/` | Backend FastAPI 컨테이너 이미지 |
| `Dockerfile` | `frontend/` | Frontend React 프로덕션 이미지 (Nginx) |
| `Dockerfile.dev` | `frontend/` | Frontend 개발 모드 이미지 (Vite) |
| `.dockerignore` | `backend/` | Backend Docker 빌드 제외 파일 |
| `.dockerignore` | `frontend/` | Frontend Docker 빌드 제외 파일 |
| `nginx.conf` | `frontend/` | Nginx 웹서버 설정 (프로덕션) |

### 2. Docker Compose 파일

| 파일명 | 설명 | 사용 명령어 |
|--------|------|-------------|
| `docker compose.yml` | 프로덕션 환경 구성 | `docker compose up -d` |
| `docker compose.dev.yml` | 개발 환경 구성 (Hot Reload) | `docker compose -f docker compose.dev.yml up -d` |

### 3. 실행 스크립트

| 파일명 | 플랫폼 | 기능 |
|--------|--------|------|
| `docker-start.bat` | Windows | Docker 컨테이너 빌드 및 시작 |
| `docker-stop.bat` | Windows | Docker 컨테이너 중지 |
| `docker-start.sh` | Mac/Linux | Docker 컨테이너 빌드 및 시작 |
| `docker-stop.sh` | Mac/Linux | Docker 컨테이너 중지 |

### 4. 환경 설정 파일

| 파일명 | 설명 |
|--------|------|
| `.env.example` | 환경 변수 템플릿 (API 키 예시) |

### 5. 문서 파일

| 파일명 | 대상 | 내용 |
|--------|------|------|
| `README_DOCKER.md` | 모든 사용자 | Docker 상세 설치 및 사용 가이드 |
| `QUICKSTART_DOCKER.md` | 비개발자 | 3분 빠른 시작 가이드 |
| `DOCKER_DEPLOYMENT_SUMMARY.md` | 개발자 | 배포 구성 요약 (이 파일) |

### 6. 업데이트된 파일

| 파일명 | 변경 내용 |
|--------|----------|
| `.gitignore` | Docker 관련 파일 제외 규칙 추가 |
| `README.md` | Docker 설치 옵션 섹션 추가 |

---

## 🏗️ 아키텍처

### 프로덕션 환경 (docker compose.yml)

```
┌─────────────────────────────────────────┐
│         사용자 (웹 브라우저)            │
└──────────────┬──────────────────────────┘
               │
               │ http://localhost
               ↓
┌─────────────────────────────────────────┐
│   Frontend Container (Port 80)          │
│   ┌───────────────────────────────┐     │
│   │   Nginx Web Server            │     │
│   │   - React 빌드 파일 서빙       │     │
│   │   - API 요청 프록시            │     │
│   └───────────┬───────────────────┘     │
└───────────────┼─────────────────────────┘
                │
                │ /api/* → Backend
                ↓
┌─────────────────────────────────────────┐
│   Backend Container (Port 8000)         │
│   ┌───────────────────────────────┐     │
│   │   FastAPI + Uvicorn           │     │
│   │   - Stock Data API            │     │
│   │   - Gemini AI Analysis        │     │
│   └───────────────────────────────┘     │
└─────────────────────────────────────────┘
                │
                ↓
      External APIs (Yahoo Finance, Gemini)
```

### 개발 환경 (docker compose.dev.yml)

```
Frontend Container (Port 5173)          Backend Container (Port 8000)
    Vite Dev Server                         FastAPI with Hot Reload
    + Hot Module Replacement                + Auto-reload on code change
           ↓                                         ↓
    Source Code Mount                        Source Code Mount
    (./frontend → /app)                      (./backend → /app)
```

---

## ⚙️ 주요 기능

### 1. Multi-stage Build (Frontend)

**Stage 1 (Builder):**
- Node.js 20 Alpine
- npm ci로 의존성 설치
- Vite 프로덕션 빌드

**Stage 2 (Production):**
- Nginx Alpine (경량)
- 빌드된 정적 파일만 복사
- 최종 이미지 크기 최소화

### 2. Health Check (Backend)

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/api/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

### 3. Hot Reload (개발 모드)

- **Frontend:** Vite Dev Server로 실시간 코드 변경 반영
- **Backend:** Uvicorn --reload로 자동 재시작
- Volume mount로 소스 코드 동기화

### 4. API Proxy (Nginx)

```nginx
location /api/ {
    proxy_pass http://backend:8000/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

### 5. Security Headers

```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
```

### 6. Static File Caching

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

## 🚀 사용 방법

### 프로덕션 배포

```bash
# 1. 환경 설정
cp .env.example .env
# .env 파일 편집하여 GEMINI_API_KEY 입력

# 2. 빌드 및 실행
docker compose up -d --build

# 3. 상태 확인
docker compose ps
docker compose logs -f

# 4. 접속
# http://localhost
```

### 개발 환경

```bash
# 개발 모드 실행 (Hot Reload)
docker compose -f docker compose.dev.yml up -d --build

# 로그 확인
docker compose -f docker compose.dev.yml logs -f

# 접속
# Frontend: http://localhost:5173
# Backend: http://localhost:8000
```

### 스크립트 실행

**Windows:**
```cmd
docker-start.bat  # 시작
docker-stop.bat   # 중지
```

**Mac/Linux:**
```bash
chmod +x docker-start.sh docker-stop.sh
./docker-start.sh  # 시작
./docker-stop.sh   # 중지
```

---

## 📊 리소스 요구사항

### 최소 사양
- **CPU:** 2 cores
- **RAM:** 4GB
- **Disk:** 20GB 여유 공간

### 권장 사양
- **CPU:** 4 cores
- **RAM:** 8GB
- **Disk:** 50GB 여유 공간

### Docker Desktop 설정

```
Resources:
  - CPUs: 2
  - Memory: 4GB
  - Swap: 1GB
  - Disk image size: 20GB
```

---

## 🔒 보안 고려사항

### 1. 환경 변수 관리
- `.env` 파일은 Git에 커밋하지 않음
- `.env.example`만 버전 관리
- API 키는 절대 하드코딩하지 않음

### 2. 네트워크 격리
- Backend와 Frontend는 별도 네트워크 (`stock-network`)
- 외부에서는 Frontend(80)만 접근 가능
- Backend(8000)는 Frontend에서만 접근

### 3. CORS 설정
```env
ALLOWED_ORIGINS=http://localhost,http://localhost:80
```

### 4. Production 환경
```yaml
environment:
  - ENVIRONMENT=production  # API 문서 비활성화
```

---

## 🧪 테스트

### Health Check

```bash
# Backend
curl http://localhost:8000/api/health

# Frontend
curl http://localhost
```

### API 테스트

```bash
# 주식 정보 조회
curl http://localhost:8000/api/stock/AAPL

# 뉴스 조회
curl http://localhost:8000/api/stock/AAPL/news

# AI 분석
curl http://localhost:8000/api/stock/AAPL/analysis
```

---

## 🛠️ 문제 해결

### 로그 확인

```bash
# 전체 로그
docker compose logs

# 특정 서비스
docker compose logs backend
docker compose logs frontend

# 실시간 로그
docker compose logs -f
```

### 컨테이너 재시작

```bash
docker compose restart
```

### 완전 재빌드

```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

### 볼륨/네트워크 초기화

```bash
docker compose down -v
docker network prune
docker compose up -d
```

---

## 📈 성능 최적화

### 1. 이미지 크기 최적화
- Multi-stage build 사용
- Alpine Linux 베이스 이미지
- .dockerignore로 불필요한 파일 제외

### 2. 빌드 캐시 활용
```bash
# 캐시 활용 빌드
docker compose build

# 캐시 무시 빌드
docker compose build --no-cache
```

### 3. 리소스 제한
```yaml
deploy:
  resources:
    limits:
      cpus: '1'
      memory: 1G
```

---

## 🔄 CI/CD 통합

### GitHub Actions 예시

```yaml
name: Build and Push Docker Images

on:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Build images
        run: docker compose build
      - name: Run tests
        run: docker compose up -d && sleep 10 && curl http://localhost/api/health
```

---

## 📚 관련 문서

- [README.md](README.md) - 프로젝트 전체 개요
- [README_DOCKER.md](README_DOCKER.md) - Docker 상세 가이드
- [QUICKSTART_DOCKER.md](QUICKSTART_DOCKER.md) - 빠른 시작 가이드
- [DISTRIBUTION.md](DISTRIBUTION.md) - 배포 가이드

---

## ✅ 배포 체크리스트

### 배포 전
- [ ] `.env` 파일 생성 및 API 키 입력
- [ ] Docker Desktop 설치 및 실행
- [ ] 포트 80, 8000 사용 가능 확인
- [ ] 디스크 여유 공간 20GB 이상 확인

### 배포
- [ ] `docker compose build` 성공
- [ ] `docker compose up -d` 성공
- [ ] `docker compose ps` 모든 컨테이너 "Up" 상태

### 배포 후
- [ ] http://localhost 접속 확인
- [ ] http://localhost:8000/api/health 응답 확인
- [ ] 티커 조회 테스트 (AAPL 등)
- [ ] AI 분석 기능 테스트

---

## 🎉 완료!

이제 Docker를 사용하여 주식 분석 플랫폼을 쉽게 배포하고 실행할 수 있습니다.

**질문이나 문제가 있으면 GitHub Issues에 문의해주세요!**
