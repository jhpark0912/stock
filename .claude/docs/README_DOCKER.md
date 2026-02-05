# 🐳 Docker로 주식 분석 플랫폼 설치하기

비개발자도 쉽게 설치하고 사용할 수 있는 Docker 기반 배포 가이드입니다.

## 📋 목차
1. [사전 준비](#사전-준비)
2. [빠른 시작](#빠른-시작)
3. [상세 설치 가이드](#상세-설치-가이드)
4. [사용 방법](#사용-방법)
5. [문제 해결](#문제-해결)

---

## 📦 사전 준비

### 1. Docker Desktop 설치

#### Windows 사용자
1. [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/) 다운로드
2. 설치 파일 실행 및 설치
3. 설치 완료 후 재부팅
4. Docker Desktop 실행 (작업 표시줄에 Docker 아이콘 확인)

#### Mac 사용자
1. [Docker Desktop for Mac](https://www.docker.com/products/docker-desktop/) 다운로드
   - Apple Silicon (M1/M2/M3): Apple Chip 버전
   - Intel Mac: Intel Chip 버전
2. DMG 파일 실행 및 Applications 폴더로 드래그
3. Docker Desktop 실행
4. 상단 메뉴바에 Docker 아이콘 확인

#### Linux 사용자
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
# 로그아웃 후 재로그인
```

### 2. Docker 설치 확인
터미널/명령 프롬프트에서 다음 명령어 실행:
```bash
docker --version
docker compose version
```

정상 출력 예시:
```
Docker version 24.0.0, build ...
Docker Compose version v2.20.0
```

**참고:** Docker Compose V2부터 명령어가 `docker-compose` (하이픈 포함)에서 `docker compose` (하이픈 없음)로 변경되었습니다.
- Docker Desktop을 설치하면 자동으로 Docker Compose V2가 포함됩니다.
- 이 가이드는 최신 버전인 `docker compose` 명령어를 사용합니다.

### 3. Gemini API 키 발급

1. [Google AI Studio](https://makersuite.google.com/app/apikey) 접속
2. Google 계정으로 로그인
3. "API 키 만들기" 클릭
4. 발급된 API 키 복사 (예: `AIzaSyC...`)

---

## 🚀 빠른 시작

### Windows 사용자

1. **프로젝트 다운로드**
   ```cmd
   git clone <repository-url>
   cd trusting-lewin
   ```

2. **환경 설정**
   ```cmd
   copy .env.example .env
   notepad .env
   ```
   → `GEMINI_API_KEY=` 뒤에 발급받은 API 키 입력 후 저장

3. **실행**
   ```cmd
   docker-start.bat
   ```

4. **접속**
   - 웹 브라우저에서 http://localhost 접속

### Mac/Linux 사용자

1. **프로젝트 다운로드**
   ```bash
   git clone <repository-url>
   cd trusting-lewin
   ```

2. **환경 설정**
   ```bash
   cp .env.example .env
   nano .env  # 또는 vim, code 등 편집기 사용
   ```
   → `GEMINI_API_KEY=` 뒤에 발급받은 API 키 입력 후 저장

3. **실행**
   ```bash
   chmod +x docker-start.sh
   ./docker-start.sh
   ```

4. **접속**
   - 웹 브라우저에서 http://localhost 접속

---

## 📘 상세 설치 가이드

### 1단계: 프로젝트 다운로드

#### Git이 설치된 경우
```bash
git clone <repository-url>
cd trusting-lewin
```

#### Git이 없는 경우
1. GitHub 프로젝트 페이지에서 "Code" → "Download ZIP" 클릭
2. 다운로드한 ZIP 파일 압축 해제
3. 터미널/명령 프롬프트에서 압축 해제한 폴더로 이동
   ```bash
   cd 다운로드폴더/trusting-lewin
   ```

### 2단계: 환경 변수 설정

`.env` 파일을 생성하고 아래 내용 입력:

```env
# Gemini API Key (필수)
GEMINI_API_KEY=여기에_발급받은_API_키_입력

# Environment
ENVIRONMENT=production

# Backend Server
HOST=0.0.0.0
PORT=8000

# CORS Origins
ALLOWED_ORIGINS=http://localhost,http://localhost:80,http://frontend

# Mock Data (429 에러 회피용, true/false)
USE_MOCK_DATA=false
```

**중요:** `GEMINI_API_KEY`는 반드시 입력해야 합니다!

### 3단계: Docker 컨테이너 빌드 및 실행

#### 프로덕션 모드 (권장)
```bash
# 빌드 및 실행
docker compose up -d --build

# 실행 확인
docker compose ps
```

#### 개발 모드 (Hot Reload)
```bash
# 빌드 및 실행
docker compose -f docker compose.dev.yml up -d --build

# 실행 확인
docker compose -f docker compose.dev.yml ps
```

### 4단계: 접속 확인

1. **Frontend (웹 UI)**
   - 프로덕션: http://localhost
   - 개발: http://localhost:5173

2. **Backend API**
   - http://localhost:8000
   - API 문서: http://localhost:8000/docs

3. **Health Check**
   ```bash
   curl http://localhost:8000/api/health
   ```

---

## 🎯 사용 방법

### 기본 사용

1. 웹 브라우저에서 http://localhost 접속
2. 티커 입력 (예: AAPL, TSLA, MSFT)
3. 주식 정보 조회

### 컨테이너 관리

#### 컨테이너 시작
```bash
docker compose start
```

#### 컨테이너 중지
```bash
docker compose stop
```

#### 컨테이너 재시작
```bash
docker compose restart
```

#### 로그 확인
```bash
# 전체 로그
docker compose logs -f

# Backend 로그만
docker compose logs -f backend

# Frontend 로그만
docker compose logs -f frontend
```

#### 컨테이너 삭제
```bash
# 컨테이너만 삭제 (데이터는 유지)
docker compose down

# 컨테이너 + 이미지 삭제
docker compose down --rmi all
```

### 환경 변수 변경 후 재시작

```bash
# .env 파일 수정 후
docker compose down
docker compose up -d --build
```

---

## 🔧 문제 해결

### 1. 포트 충돌 오류

**증상:**
```
Error: bind: address already in use
```

**해결 방법:**

#### Windows
```cmd
# 포트 사용 중인 프로세스 확인
netstat -ano | findstr :80
netstat -ano | findstr :8000

# 프로세스 종료 (PID는 위 명령어 결과에서 확인)
taskkill /PID <PID> /F
```

#### Mac/Linux
```bash
# 포트 사용 중인 프로세스 확인
lsof -i :80
lsof -i :8000

# 프로세스 종료 (PID는 위 명령어 결과에서 확인)
kill -9 <PID>
```

**또는 포트 변경:**
`docker compose.yml` 파일 수정
```yaml
services:
  frontend:
    ports:
      - "8080:80"  # 80 대신 8080 사용
  backend:
    ports:
      - "9000:8000"  # 8000 대신 9000 사용
```

### 2. Gemini API 키 오류

**증상:**
```
401 Unauthorized: Invalid API key
```

**해결 방법:**
1. `.env` 파일에서 `GEMINI_API_KEY` 확인
2. API 키 앞뒤 공백 제거
3. [Google AI Studio](https://makersuite.google.com/app/apikey)에서 키 유효성 확인
4. 컨테이너 재시작
   ```bash
   docker compose down
   docker compose up -d
   ```

### 3. 컨테이너가 시작되지 않음

**해결 방법:**
```bash
# 로그 확인
docker compose logs backend
docker compose logs frontend

# 컨테이너 상태 확인
docker compose ps

# 재빌드
docker compose down
docker compose build --no-cache
docker compose up -d
```

### 4. 네트워크 연결 오류

**증상:**
Frontend에서 Backend API 호출 실패

**해결 방법:**
1. Backend 상태 확인
   ```bash
   curl http://localhost:8000/api/health
   ```

2. CORS 설정 확인 (`.env`)
   ```env
   ALLOWED_ORIGINS=http://localhost,http://localhost:80
   ```

3. 네트워크 재생성
   ```bash
   docker compose down
   docker network prune
   docker compose up -d
   ```

### 5. Docker Desktop이 시작되지 않음 (Windows)

**해결 방법:**
1. WSL2 업데이트
   ```cmd
   wsl --update
   ```

2. Windows 기능 활성화
   - "제어판" → "프로그램" → "Windows 기능 켜기/끄기"
   - "Linux용 Windows 하위 시스템" 체크
   - "가상 머신 플랫폼" 체크
   - 재부팅

### 6. 이미지 빌드 실패

**해결 방법:**
```bash
# Docker 캐시 완전 삭제
docker system prune -a --volumes

# 재빌드
docker compose build --no-cache
docker compose up -d
```

### 7. 메모리 부족 오류

**해결 방법:**
1. Docker Desktop 설정 → Resources → Memory 증가 (최소 4GB 권장)
2. 사용하지 않는 컨테이너/이미지 정리
   ```bash
   docker system prune -a
   ```

---

## 📊 성능 최적화

### Docker Desktop 리소스 설정

#### Windows/Mac
1. Docker Desktop 실행
2. 설정 → Resources
3. 권장 설정:
   - CPU: 2 cores 이상
   - Memory: 4GB 이상
   - Swap: 1GB
   - Disk: 20GB 이상

### 프로덕션 환경 최적화

```yaml
# docker compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

---

## 🔒 보안 권장사항

1. **API 키 관리**
   - `.env` 파일을 Git에 커밋하지 마세요
   - `.gitignore`에 `.env` 추가 확인

2. **방화벽 설정**
   - 외부 접근이 필요 없다면 localhost만 허용

3. **정기 업데이트**
   ```bash
   # Docker 이미지 업데이트
   docker compose pull
   docker compose up -d
   ```

---

## 📞 지원

문제가 해결되지 않는 경우:
1. 로그 파일 수집
   ```bash
   docker compose logs > logs.txt
   ```
2. GitHub Issues에 로그 첨부하여 문의

---

## 📝 체크리스트

설치 전 확인 사항:
- [ ] Docker Desktop 설치 완료
- [ ] Docker 실행 확인 (`docker --version`)
- [ ] Gemini API 키 발급
- [ ] 프로젝트 다운로드 완료
- [ ] `.env` 파일 생성 및 API 키 입력
- [ ] 포트 80, 8000 사용 가능 여부 확인

실행 확인:
- [ ] `docker compose up -d` 성공
- [ ] `docker compose ps` 모든 컨테이너 "Up" 상태
- [ ] http://localhost 접속 가능
- [ ] http://localhost:8000/api/health 응답 확인
- [ ] 티커 조회 테스트 (예: AAPL)

---

**즐거운 주식 분석 되세요! 📈**
