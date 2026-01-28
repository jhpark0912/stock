# 📦 주식 정보 조회 도구 - 배포 가이드 (Standalone Edition)

## 🎯 개요

**stock_standalone.py**는 Python만 설치되어 있으면 즉시 실행 가능한 독립 실행형 주식 정보 조회 도구입니다.

### 주요 특징

- ✅ **단일 파일 배포**: 모든 코드가 하나의 Python 파일에 통합
- ✅ **자동 의존성 설치**: 필요한 라이브러리를 자동으로 설치
- ✅ **크로스 플랫폼**: Windows, macOS, Linux 모두 지원
- ✅ **Python만 필요**: 복잡한 설정 불필요
- ✅ **35개 이상의 재무 지표**: 실시간 주식 정보 조회
- ✅ **기술적 지표**: RSI, MACD, SMA, EMA, 볼린저밴드
- ✅ **뉴스 수집**: 최근 뉴스 헤드라인 표시
- ✅ **Gemini AI 분석** (선택): 투자 인사이트 및 뉴스 감성 분석

---

## 📋 시스템 요구사항

### 필수 사항

1. **Python 3.7 이상**
   - 다운로드: https://www.python.org/downloads/
   - 설치 시 "Add Python to PATH" 체크 필수

2. **인터넷 연결**
   - 주식 데이터 조회 및 라이브러리 설치에 필요

### 선택 사항

3. **Gemini API 키** (AI 분석 기능 사용 시)
   - 무료 API 키 발급: https://aistudio.google.com/app/apikey
   - `.env` 파일에 `GEMINI_API_KEY=your_api_key` 추가

---

## 🚀 빠른 시작

### Windows

#### 방법 1: 배치 파일 실행 (권장)

1. `run_standalone.bat` 더블클릭
2. 프로그램이 자동으로 실행됩니다

#### 방법 2: 직접 실행

```bash
python stock_standalone.py
```

### macOS / Linux

```bash
python3 stock_standalone.py
```

또는 실행 권한 부여 후:

```bash
chmod +x stock_standalone.py
./stock_standalone.py
```

---

## 📦 배포 방법

### 옵션 1: 단일 파일 배포 (현재 방식)

**필요한 파일:**
- `stock_standalone.py` (필수)
- `run_standalone.bat` (Windows용, 선택)
- `.env` (AI 기능 사용 시, 선택)

**배포 절차:**
1. 위 파일들을 압축 (ZIP)
2. 사용자에게 전달
3. 압축 해제 후 실행

**장점:**
- ✅ 간단한 배포
- ✅ 파일 크기 작음 (~50KB)
- ✅ Python 환경 수정 없음

**단점:**
- ⚠️ Python 사전 설치 필요
- ⚠️ 첫 실행 시 라이브러리 자동 설치 (1-2분 소요)

---

### 옵션 2: PyInstaller로 실행 파일 생성

Python이 없는 환경에서도 실행 가능한 `.exe` 파일을 만듭니다.

#### 설치

```bash
pip install pyinstaller
```

#### 실행 파일 생성

```bash
pyinstaller --onefile --name stock_tool stock_standalone.py
```

생성된 파일: `dist/stock_tool.exe`

**장점:**
- ✅ Python 불필요
- ✅ 사용자가 바로 실행 가능

**단점:**
- ⚠️ 파일 크기 큼 (50-100MB)
- ⚠️ 바이러스 백신 오탐지 가능
- ⚠️ 업데이트 시 재빌드 필요

---

### 옵션 3: zipapp으로 패키징

Python 표준 라이브러리를 사용한 패키징 방법입니다.

#### 패키징

```bash
python -m zipapp . -o stock_tool.pyz -p "/usr/bin/env python3"
```

#### 실행

```bash
python stock_tool.pyz
```

**장점:**
- ✅ Python 표준 방식
- ✅ 파일 크기 작음

**단점:**
- ⚠️ Python 필요
- ⚠️ 외부 라이브러리 별도 설치 필요

---

## 🛠️ 의존성 라이브러리

프로그램이 자동으로 설치하는 라이브러리:

| 라이브러리 | 용도 | 자동 설치 |
|-----------|------|----------|
| **yfinance** | 주식 데이터 조회 | ✅ |
| **rich** | 터미널 UI | ✅ |
| **deep_translator** | 번역 | ✅ |
| **pandas** | 데이터 처리 | ✅ |
| **numpy** | 수치 계산 | ✅ |
| **google-generativeai** | Gemini AI (선택) | ✅ |
| **python-dotenv** | 환경 변수 (선택) | ✅ |

첫 실행 시 자동으로 설치되므로 별도 조치 불필요합니다.

---

## 🔧 고급 설정

### Gemini AI 분석 활성화

1. `.env` 파일 생성 (프로그램과 같은 폴더)
2. 다음 내용 추가:

```env
GEMINI_API_KEY=your_api_key_here
```

3. API 키 발급: https://aistudio.google.com/app/apikey

### 프록시 환경에서 실행

```bash
set HTTP_PROXY=http://proxy.example.com:8080
set HTTPS_PROXY=http://proxy.example.com:8080
python stock_standalone.py
```

---

## 📝 사용 예시

### 1. 실시간 주식 정보 조회

```
티커 입력: AAPL
조회할 날짜 (YYYY-MM-DD) [실시간: Enter]: [Enter]
AI 분석을 포함하시겠습니까? (y/N): n
```

### 2. 과거 데이터 조회

```
티커 입력: GOOG
조회할 날짜 (YYYY-MM-DD) [실시간: Enter]: 2024-01-15
```

### 3. AI 분석 포함

```
티커 입력: TSLA
조회할 날짜 (YYYY-MM-DD) [실시간: Enter]: [Enter]
AI 분석을 포함하시겠습니까? (y/N): y
```

---

## 🐛 문제 해결

### Python을 찾을 수 없습니다

**원인:** Python이 설치되지 않았거나 PATH에 등록되지 않음

**해결:**
1. Python 설치: https://www.python.org/downloads/
2. 설치 시 "Add Python to PATH" 체크
3. 또는 환경 변수에 수동으로 Python 경로 추가

### 라이브러리 설치 실패

**원인:** pip 업그레이드 필요 또는 네트워크 문제

**해결:**
```bash
python -m pip install --upgrade pip
python -m pip install yfinance rich deep_translator pandas numpy
```

### 티커 데이터를 찾을 수 없습니다

**원인:** 잘못된 티커 심볼 또는 yfinance API 문제

**해결:**
- 올바른 티커 심볼 확인 (예: AAPL, GOOG, TSLA)
- 인터넷 연결 확인
- 잠시 후 재시도

### Gemini API 오류

**원인:** API 키가 없거나 잘못됨

**해결:**
- `.env` 파일의 `GEMINI_API_KEY` 확인
- API 키 재발급: https://aistudio.google.com/app/apikey
- API 키 형식: `AIza...` (28-39자)

---

## 📊 파일 크기 비교

| 배포 방식 | 파일 크기 | Python 필요 | 설치 시간 |
|----------|----------|------------|----------|
| **Standalone .py** | ~50KB | ✅ 필요 | 0초 (첫 실행 시 1-2분) |
| **PyInstaller .exe** | 50-100MB | ❌ 불필요 | 0초 |
| **zipapp .pyz** | ~50KB | ✅ 필요 | 수동 설치 필요 |

---

## 🔐 보안 고려사항

### .env 파일 보호

- `.env` 파일을 Git에 커밋하지 마세요
- API 키를 공개 저장소에 업로드하지 마세요
- 배포 시 `.env.example` 템플릿만 제공

### 예시 .env.example

```env
# Gemini API 키 (선택 사항)
# https://aistudio.google.com/app/apikey 에서 발급
GEMINI_API_KEY=your_api_key_here
```

---

## 📚 추가 자료

- **프로젝트 문서:** `README.md`
- **기술 문서:** `CLAUDE.md`
- **소스 코드:** `stock_standalone.py`

---

## 🆘 지원

### 이슈 리포팅

문제가 발생하면 다음 정보와 함께 리포트해주세요:

1. Python 버전: `python --version`
2. 운영체제: Windows/macOS/Linux
3. 오류 메시지 전문
4. 실행 명령어

### 라이선스

이 프로그램은 교육 및 개인 사용 목적으로 제공됩니다.

---

## 📌 버전 정보

**버전:** Standalone Edition v1.0
**업데이트:** 2026-01-27
**포함 기능:**
- ✅ 실시간 주식 정보
- ✅ 35개 이상의 재무 지표
- ✅ 기술적 지표 (RSI, MACD, SMA, EMA, 볼린저밴드)
- ✅ 뉴스 수집
- ✅ Gemini AI 분석 (선택)
- ✅ 자동 의존성 설치

---

**Happy Trading! 🚀📈**
