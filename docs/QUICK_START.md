# 빠른 시작 가이드 (Quick Start)

> 💡 이미 Python과 Node.js가 설치되어 있다면, 이 가이드를 따라 5분 안에 시작할 수 있습니다!

---

## 📋 사전 요구사항

다음 프로그램이 설치되어 있어야 합니다:

- ✅ Python 3.8 이상
- ✅ Node.js 18 이상

확인 방법:
```bash
python --version
node --version
```

> ⚠️ 설치되어 있지 않다면 [앙코도 이해가능한 설치 가이드](INSTALLATION_WITHOUT_DOCKER.md)를 참고하세요.

---

## 🚀 5분 만에 시작하기

### 방법 1: 자동 실행 스크립트 사용 (추천! ⭐)

#### 1단계: 환경 설정 (최초 1회만)

1. **백엔드 환경 변수 설정**
   - `backend` 폴더로 이동
   - `.env.example` 파일을 복사하여 `.env` 파일 생성
   - `.env` 파일을 열어 `GEMINI_API_KEY` 입력
   ```env
   GEMINI_API_KEY=여기에_발급받은_API_키_입력
   ```

2. **프론트엔드 환경 변수 설정**
   - `frontend` 폴더로 이동
   - `.env.example` 파일을 복사하여 `.env` 파일 생성
   ```env
   VITE_API_URL=http://localhost:8080
   ```

#### 2단계: 실행!

**Windows:**

프로젝트 폴더에서 `start_all.bat` 파일을 더블클릭!

또는 명령 프롬프트에서:
```bash
start_all.bat
```

> 📝 **설명**: 
> - 백엔드와 프론트엔드가 각각 별도 창에서 자동 실행됩니다
> - 처음 실행 시 필요한 패키지를 자동으로 설치합니다 (약 5-10분 소요)
> - 다음부터는 바로 실행됩니다!

#### 3단계: 접속

브라우저에서 자동으로 열리거나, 직접 접속:
```
http://localhost:5173
```

---

### 방법 2: 수동 실행

#### 백엔드 실행

**명령 프롬프트 1번 창:**

```bash
# 백엔드 폴더로 이동
cd backend

# 가상환경 생성 (최초 1회만)
python -m venv venv

# 가상환경 활성화
venv\Scripts\activate

# 패키지 설치 (최초 1회만)
pip install -r requirements.txt

# 서버 실행
python -m uvicorn app.main:app --host 127.0.0.1 --port 8080 --reload
```

#### 프론트엔드 실행

**명령 프롬프트 2번 창:**

```bash
# 프론트엔드 폴더로 이동
cd frontend

# 패키지 설치 (최초 1회만)
npm install

# 개발 서버 실행
npm run dev
```

#### 접속

브라우저에서:
```
http://localhost:5173
```

---

## 🎯 매물(티커) 검색 예시

프로그램 실행 후 다음 매물들을 검색해보세요:

| 매물 기호 | 회사명 | 카테고리 |
|---------|-------|---------|
| **AAPL** | Apple | 기술 |
| **MSFT** | Microsoft | 기술 |
| **GOOGL** | Google | 기술 |
| **TSLA** | Tesla | 자동차 |
| **AMZN** | Amazon | 전자상거래 |
| **NVDA** | NVIDIA | 반도체 |
| **005930.KS** | 삼성전자 | 기술 (한국) |

---

## 🛑 프로그램 종료

### 자동 실행 스크립트 사용 시

각 창에서:
1. `Ctrl + C` 키 누르기
2. `작업을 중지하시겠습니까? (Y/N)` → `Y` 입력

### 수동 실행 시

백엔드 창과 프론트엔드 창 각각에서:
1. `Ctrl + C` 키 누르기
2. `Y` 입력

---

## 📁 프로젝트 구조

```
stock/
├── backend/                    # 백엔드 서버
│   ├── app/                   # FastAPI 애플리케이션
│   ├── .env                   # 환경 변수 (직접 생성)
│   ├── .env.example           # 환경 변수 템플릿
│   └── requirements.txt       # Python 패키지 목록
│
├── frontend/                  # 프론트엔드 웹
│   ├── src/                   # 소스 코드
│   ├── .env                   # 환경 변수 (직접 생성)
│   ├── .env.example           # 환경 변수 템플릿
│   └── package.json           # Node.js 패키지 목록
│
├── docs/                      # 문서
│   ├── QUICK_START.md         # 이 파일
│   └── INSTALLATION_WITHOUT_DOCKER.md  # 상세 설치 가이드
│
├── start_all.bat              # 전체 실행 스크립트
├── start_backend.bat          # 백엔드만 실행
└── start_frontend.bat         # 프론트엔드만 실행
```

---

## 🔧 문제 해결

### "python을 찾을 수 없습니다" 오류

**해결 방법**: Python 설치 확인 및 PATH 설정
```bash
python --version
```

### "node를 찾을 수 없습니다" 오류

**해결 방법**: Node.js 설치 확인
```bash
node --version
```

### 포트가 이미 사용 중인 경우

**백엔드 포트 변경** (8080 → 8081):
```bash
python -m uvicorn app.main:app --host 127.0.0.1 --port 8081 --reload
```

그리고 `frontend/.env` 수정:
```env
VITE_API_URL=http://localhost:8081
```

### 데이터가 로딩되지 않는 경우

1. ✅ 백엔드 서버 실행 확인
2. ✅ 프론트엔드 서버 실행 확인
3. ✅ `.env` 파일 설정 확인
4. ✅ GEMINI_API_KEY 설정 확인
5. ✅ 인터넷 연결 확인

---

## 📞 추가 도움이 필요하신가요?

더 자세한 설명이 필요하다면:
- [앙코도 이해가능한 설치 가이드](INSTALLATION_WITHOUT_DOCKER.md) 참조
- [프로젝트 README](../README.md) 참조

---

## ✅ 빠른 체크리스트

- [ ] Python 설치 확인
- [ ] Node.js 설치 확인
- [ ] `backend/.env` 파일 생성 및 API 키 입력
- [ ] `frontend/.env` 파일 생성
- [ ] `start_all.bat` 실행 또는 수동 실행
- [ ] `http://localhost:5173` 접속
- [ ] 매물 검색 테스트

---

**작성일**: 2026-02-04  
**버전**: 1.0.0  
**문서 위치**: `docs/QUICK_START.md`
