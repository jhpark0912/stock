# 프로젝트 개요

이 프로젝트는 다양한 버전의 주식 정보 조회 및 분석 도구 모음입니다. 주요 기능은 다음과 같습니다.

- **Enhanced Edition (`stock_info.py`):** AI 분석, 기술적 지표, 뉴스 감성 분석 등 고급 기능을 포함한 대화형 CLI 도구입니다.
- **Standalone Edition (`stock_standalone.py`):** Python만 설치되어 있으면 바로 실행 가능한 단일 파일 배포 버전입니다.
- **CLI 버전 (`stock_cli.py`):** n8n의 `Execute Command` 노드와 통합하기 위한 간단한 CLI 도구입니다.
- **JavaScript 버전 (`stock_api.js`):** n8n의 `Code` 노드에서 사용하기 위한 JavaScript 모듈입니다.
- **Backend API (`backend/`):** FastAPI를 사용하여 주식 데이터를 제공하는 백엔드 서버입니다.

## 기술 스택

- **언어:** Python, JavaScript (Node.js)
- **주요 라이브러리 (Python):**
  - `yfinance`: Yahoo Finance로부터 주식 데이터를 가져옵니다.
  - `FastAPI`: 백엔드 API를 구축합니다.
  - `google-generativeai`: Gemini AI를 이용한 분석 기능을 제공합니다.
  - `rich`: 풍부한 형식의 CLI 출력을 제공합니다.
  - `pandas`, `numpy`: 기술적 지표 계산에 사용됩니다.
- **주요 라이브러리 (JavaScript):**
  - `yahoo-finance2`: Node.js 환경에서 주식 데이터를 가져옵니다.

## 설치 및 실행 방법

### 1. Enhanced Edition (대화형 CLI)

**의존성 설치:**
```bash
pip install -r requirements_enhanced.txt
```

**API 키 설정 (AI 기능 사용 시):**
1. `.env.example` 파일을 `.env`로 복사합니다.
2. `.env` 파일에 Gemini API 키를 추가합니다. (`GEMINI_API_KEY=your_api_key`)

**실행:**
```bash
python stock_info.py
```

### 2. Standalone Edition (단일 파일)

**실행 (Windows):**
```bash
run_standalone.bat
```
또는
```bash
python stock_standalone.py
```

### 3. Backend API 서버

**디렉토리 이동:**
```bash
cd backend
```

**의존성 설치:**
```bash
pip install -r requirements.txt
```

**환경 변수 설정:**
1. `.env.example` 파일을 `.env`로 복사합니다.
2. `.env` 파일을 환경에 맞게 수정합니다 (예: `GEMINI_API_KEY`, `ALLOWED_ORIGINS`).

**서버 실행:**
```bash
uvicorn app.main:app --reload
```
서버는 `http://localhost:8000`에서 실행되며, API 문서는 `http://localhost:8000/docs`에서 확인할 수 있습니다.

### 4. JavaScript 버전 (n8n 또는 Node.js)

**의존성 설치:**
```bash
npm install
```

**테스트 실행:**
```bash
npm test
```
또는
```bash
node stock_api.js AAPL
```

## 개발 컨벤션

- **Python:**
  - 백엔드는 FastAPI 프레임워크를 사용하며, 서비스, 모델, 라우트가 분리된 구조를 따릅니다.
  - 환경 변수는 `.env` 파일을 통해 관리됩니다 (`python-dotenv` 사용).
  - 데이터 유효성 검사는 Pydantic 모델을 사용합니다.
- **JavaScript:**
  - `package.json`에 정의된 스크립트를 통해 테스트를 실행할 수 있습니다.
- **n8n 통합:**
  - Python CLI (`stock_cli.py`)는 `Execute Command` 노드와 함께 사용하도록 설계되었습니다.
  - JavaScript 모듈 (`stock_api.js`)은 `Code` 노드에 직접 삽입하여 사용할 수 있습니다.

## 핵심 파일 구조

```
├── stock_info.py              # Enhanced Edition (대화형 CLI)
├── stock_standalone.py        # Standalone Edition (배포용)
├── stock_cli.py               # Python CLI (n8n용)
├── stock_api.js               # JavaScript (n8n용)
├── technical_indicators.py    # 기술적 지표 계산 모듈
├── gemini_analyzer.py         # Gemini AI 분석 모듈
├── requirements_enhanced.txt  # Enhanced Edition 의존성
├── package.json               # JavaScript 의존성
├── backend/
│   ├── app/
│   │   ├── main.py            # FastAPI 앱 진입점
│   │   ├── api/               # API 라우트
│   │   ├── services/          # 비즈니스 로직
│   │   └── models/            # Pydantic 모델
│   └── requirements.txt       # 백엔드 의존성
└── README.md                  # 프로젝트 상세 설명서
```
