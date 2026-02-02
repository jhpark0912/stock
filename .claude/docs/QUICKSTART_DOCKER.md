# 🚀 Docker 빠른 시작 가이드

## 3분 안에 시작하기

### 1️⃣ Docker Desktop 설치 (5분)

**Windows/Mac:**
1. https://www.docker.com/products/docker-desktop/ 방문
2. 다운로드 및 설치
3. Docker Desktop 실행

**설치 확인:**
```bash
docker --version
```

### 2️⃣ 환경 설정 (1분)

**Gemini API 키 발급:**
1. https://makersuite.google.com/app/apikey 접속
2. "API 키 만들기" 클릭
3. 키 복사

**환경 파일 설정:**

Windows:
```cmd
copy .env.example .env
notepad .env
```

Mac/Linux:
```bash
cp .env.example .env
nano .env
```

→ `GEMINI_API_KEY=` 뒤에 발급받은 API 키 붙여넣기

### 3️⃣ 실행 (2분)

**Windows:**
```cmd
docker-start.bat
```

**Mac/Linux:**
```bash
chmod +x docker-start.sh
./docker-start.sh
```

### 4️⃣ 접속

웹 브라우저에서:
- **Frontend:** http://localhost
- **API 문서:** http://localhost:8000/docs

---

## 📋 주요 명령어

### 시작/중지

```bash
# 시작
docker compose up -d

# 중지
docker compose stop

# 재시작
docker compose restart

# 삭제
docker compose down
```

### 로그 확인

```bash
# 전체 로그
docker compose logs -f

# Backend만
docker compose logs -f backend

# Frontend만
docker compose logs -f frontend
```

### 상태 확인

```bash
# 컨테이너 상태
docker compose ps

# 리소스 사용량
docker stats
```

---

## 🔧 자주 묻는 질문

### Q1: 포트가 이미 사용 중입니다

**Windows:**
```cmd
netstat -ano | findstr :80
taskkill /PID <PID> /F
```

**Mac/Linux:**
```bash
lsof -i :80
kill -9 <PID>
```

### Q2: API 키 오류

1. `.env` 파일 확인
2. API 키 앞뒤 공백 제거
3. 컨테이너 재시작
   ```bash
   docker compose restart
   ```

### Q3: 컨테이너가 시작되지 않음

```bash
# 로그 확인
docker compose logs

# 재빌드
docker compose down
docker compose build --no-cache
docker compose up -d
```

---

## 📊 시스템 요구사항

- **CPU:** 2 cores 이상
- **RAM:** 4GB 이상
- **Disk:** 20GB 여유 공간
- **OS:** Windows 10/11, macOS 10.15+, Linux (Ubuntu 18.04+)

---

## 📚 추가 문서

- **상세 설치 가이드:** [README_DOCKER.md](README_DOCKER.md)
- **프로젝트 문서:** [README.md](README.md)
- **배포 가이드:** [DISTRIBUTION.md](DISTRIBUTION.md)

---

**문제가 해결되지 않나요?**
→ [README_DOCKER.md](README_DOCKER.md)의 문제 해결 섹션 참고
