# 📊 Stock Analysis Web Platform with AI

React, FastAPI, and Gemini AI for real-time stock analysis, news, and AI-powered insights.

## Features

- **Real-time Stock Data**: Fetches and displays real-time stock prices, volume, and market cap.
- **In-depth Financials**: Provides over 15 key financial metrics including PE, PBR, ROE, and debt-to-equity.
- **Technical Indicators**: Calculates and visualizes SMA, EMA, RSI, MACD, and Bollinger Bands.
- **Latest News**: Aggregates and displays the latest news for the selected stock.
- **🤖 Gemini AI Analysis**:
  - **Sentiment Analysis**: Analyzes news sentiment and provides a sentiment score and label.
  - **Summarization**: Summarizes key news insights into a concise overview.
- **Mock Data Mode**: Allows frontend development without hitting API rate limits.
- **Interactive UI**: Built with React, TypeScript, and Tailwind CSS for a modern user experience.

## Project Structure

```
stock/
├── backend/
│   ├── app/
│   |   ├── api/
│   |   |   └── routes/
│   |   |       ├── health.py
│   |   |       └── stock.py           # Stock, News, and AI Analysis APIs
│   |   ├── services/
│   |   |   ├── stock_service.py       # Business logic for fetching data and AI analysis
│   |   |   └── ...
│   |   └── models/
│   |       └── stock.py               # Pydantic data models
│   ├── requirements.txt
│   └── ...
├── frontend/
│   ├── src/
│   |   ├── components/
│   |   |   ├── StockSearch.tsx
│   |   |   ├── StockInfo.tsx
│   |   |   ├── StockNews.tsx
│   |   |   └── StockAnalysis.tsx      # Component for displaying AI analysis
│   |   ├── lib/
│   |   |   └── api.ts                 # API fetching logic
│   |   ├── types/
│   |   |   └── stock.ts               # TypeScript types
│   |   └── App.tsx                    # Main application component
│   ├── package.json
│   └── ...
└── README.md
```

## 🚀 빠른 시작 (Quick Start)

> 💡 **추천**: Docker 없이 실행하는 방법을 원하신다면 아래 가이드를 참고하세요!

### 📚 설치 가이드

실행 방법에 따라 적절한 가이드를 선택하세요:

| 방법 | 가이드 문서 | 설명 |
|-----|-----------|------|
| 🎯 **간편 실행** | [빠른 시작 가이드](docs/QUICK_START.md) | 이미 Python/Node.js가 설치된 앙코용 (5분) |
| 📖 **상세 설치** | [앙코도 이해가능한 설치 가이드](docs/INSTALLATION_WITHOUT_DOCKER.md) | 처음부터 모든 것을 설치하는 방법 (앙코용) |
| 🐳 **Docker** | [Docker로 실행하기](#docker로-실행하기) | Docker Compose 사용 (아래 참조) |
| ⚙️ **환경 변수** | [환경 변수 가이드](ENV_GUIDE.md) | 개발/프로덕션 환경별 `.env` 설정 📋 |

---

## 🎯 간편 실행 (Windows)

### 방법 1: 자동 실행 스크립트 (추천! ⭐)

1. **환경 설정** (최초 1회만)
   ```bash
   # backend/.env 파일 생성 후 API 키 입력
   # frontend/.env 파일 생성
   ```

2. **실행**
   - `start_all.bat` 파일 더블클릭!

3. **접속**
   - 브라우저에서 `http://localhost:5173` 접속

> 📝 **참고**: 
> - 처음 실행 시 필요한 패키지를 자동 설치합니다 (약 5-10분)
> - 다음부터는 바로 실행됩니다!

### 방법 2: 수동 실행

#### 1. 의존성 설치

**Backend:**
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
```

#### 2. 환경 변수 설정

**Backend (`backend/.env`):**
```env
GEMINI_API_KEY=your_gemini_api_key_here
ENVIRONMENT=development
ALLOWED_ORIGINS=http://localhost:5173
HOST=127.0.0.1
PORT=8080
```

**Frontend (`frontend/.env`):**
```env
# API URL은 상대 경로(/api)를 사용하므로 별도 설정 불필요
# Vite 프록시가 /api 요청을 백엔드로 전달합니다
```

> 🔑 **Gemini API 키 발급**: https://aistudio.google.com/apikey

#### 3. 실행

**Backend (명령 프롬프트 1번 창):**
```bash
cd backend
venv\Scripts\activate
python -m uvicorn app.main:app --host 127.0.0.1 --port 8080 --reload
```

**Frontend (명령 프롬프트 2번 창):**
```bash
cd frontend
npm run dev
```

#### 4. 접속

- **웹 앱**: [http://localhost:5173](http://localhost:5173)
- **API 문서**: [http://localhost:8080/docs](http://localhost:8080/docs)

---

## 🐳 Docker로 실행하기

Docker Compose를 사용하면 더 간단하게 실행할 수 있습니다.

### 1. 환경 변수 설정

프로젝트 루트에 `.env` 파일 생성:

```env
GEMINI_API_KEY=your_gemini_api_key_here
ENVIRONMENT=development
```

### 2. Docker Compose 실행

```bash
# 빌드 및 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 종료
docker-compose down
```

### 3. 접속

- **웹 앱**: [http://localhost:5348](http://localhost:5348)
- **Backend API**: [http://localhost:8000](http://localhost:8000)

---

## ☁️ 클라우드 배포

Docker를 클라우드 서버에 배포할 때 특정 IP로 접근해도 정상 동작하도록 설계되어 있습니다.

### 아키텍처

```
[브라우저] → [nginx :5348] → /api/* → [backend :8000]
                           → /*     → [정적 파일]
```

프론트엔드는 **상대 경로(`/api`)** 를 사용하여 API를 호출합니다. nginx가 `/api/*` 요청을 백엔드로 프록시하므로, 어떤 IP/도메인으로 접속하든 정상 동작합니다.

### 환경별 동작

| 환경 | 접속 URL | API 요청 경로 | 프록시 |
|-----|---------|-------------|-------|
| 로컬 개발 (npm run dev) | `localhost:8080` | `/api/*` | Vite → localhost:8000 |
| Docker 로컬 | `localhost:5348` | `/api/*` | nginx → backend:8000 |
| 클라우드 (특정 IP) | `서버IP:5348` | `/api/*` | nginx → backend:8000 |

### 클라우드 배포 설정

#### 1. 환경 변수 설정

프로젝트 루트에 `.env` 파일 생성:

```env
# 필수
GEMINI_API_KEY=your_gemini_api_key_here

# 선택 (CORS 보안 강화)
SERVER_IP=123.45.67.89  # 클라우드 서버의 공인 IP
```

> ⚠️ **보안 참고**: `SERVER_IP`를 설정하지 않으면 모든 origin에서 API 접근이 허용됩니다.

#### 2. 빌드 및 실행

```bash
# 이미지 빌드 (최초 또는 코드 변경 시)
docker-compose build

# 백그라운드 실행
docker-compose up -d

# 상태 확인
docker-compose ps

# 로그 확인
docker-compose logs -f
```

#### 3. 접속 확인

```bash
# 헬스체크
curl http://서버IP:8000/api/health

# 웹 접속
http://서버IP:5348
```

### 포트 변경 (선택사항)

기본 포트를 변경하려면 `docker-compose.yml` 수정:

```yaml
services:
  backend:
    ports:
      - "8000:8000"  # 호스트:컨테이너
  frontend:
    ports:
      - "80:80"  # 프로덕션에서 80 포트 사용
```

### 방화벽 설정

클라우드 서버에서 필요한 포트를 열어주세요:

| 포트 | 용도 |
|-----|-----|
| 5348 | 웹 프론트엔드 (또는 변경한 포트) |
| 8000 | 백엔드 API (선택, 직접 접근 필요 시) |

---

## 📦 배포 패키지 생성

배포용 ZIP 파일을 생성하려면:

```bash
python create_deployment_package.py
```

생성된 ZIP 파일에는 다음이 포함됩니다:
- `backend/` - 백엔드 서버 코드
- `frontend/` - 프론트엔드 웹 코드
- `docker-compose.yml` - Docker 실행 설정
- `.env.example` - 환경 변수 템플릿
- `start_*.bat` - Windows 실행 스크립트

---

## 🎮 앙코도 쉽게 사용하는 예시

### 매물(티커) 검색 예시

| 매물 기호 | 회사명 | 카테고리 |
|---------|-------|---------|
| **AAPL** | Apple | 기술 |
| **MSFT** | Microsoft | 기술 |
| **GOOGL** | Google | 기술 |
| **TSLA** | Tesla | 자동차 |
| **NVDA** | NVIDIA | 반도체 |
| **005930.KS** | 삼성전자 | 기술 (한국) |

---

## 📖 문서

- [빠른 시작 가이드](docs/QUICK_START.md) - 5분 만에 시작하기
- [앙코도 이해가능한 설치 가이드](docs/INSTALLATION_WITHOUT_DOCKER.md) - Docker 없이 처음부터 설치
- [디자인 시스템](docs/DESIGN_SYSTEM.md) - UI/UX 가이드라인
- [파일 구조](backend/FILES.md) - 백엔드 파일 구조
- [프로젝트 진행사항](PROGRESS.md) - 개발 히스토리

---

## API Endpoints

| Method | Path                         | Description                               |
|--------|------------------------------|-------------------------------------------|
| GET    | `/api/health`                | Health check                             |
| GET    | `/api/stock/{ticker}`        | Get real-time stock data                  |
| GET    | `/api/stock/{ticker}/news`   | Get latest news for a stock               |
| GET    | `/api/stock/{ticker}/analysis`| Get AI-powered news analysis (Gemini)    |

## License

MIT