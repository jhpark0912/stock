# Stock Info - Enhanced Edition with AI Analysis 🚀

주식 정보 조회를 n8n 워크플로우에서 사용할 수 있도록 제공하며, **Gemini AI 분석**, **기술적 지표**, **뉴스 감성 분석** 등 고급 기능을 포함하는 도구입니다.

## 프로젝트 개요

이 프로젝트는 네 가지 버전의 주식 정보 조회 도구를 제공합니다:

1. **stock_info.py** - 🆕 **Enhanced Edition** - AI 분석, 기술적 지표, 뉴스 포함 대화형 CLI
2. **stock_standalone.py** - 🚀 **Standalone Edition** - Python만 있으면 동작하는 단일 파일 배포 버전
3. **stock_cli.py** - n8n Execute Command 노드용 CLI
4. **stock_api.js** - n8n Code 노드용 JavaScript 모듈

## 🆕 Enhanced Edition 주요 기능

### 1. 확장된 재무 지표 (총 35개 이상)

**기존 지표:**
- ROE, OPM, PEG, PBR, 부채비율, FCF

**🆕 추가 지표:**
- **배당 정보**: 배당수익률, 배당금, 배당성향
- **수익성**: 매출총이익률, 순이익률, EBITDA 마진
- **밸류에이션**: PER (과거/예상), PSR, EV/매출, EV/EBITDA
- **성장성**: 매출 성장률, 이익 성장률
- **재무건전성**: 유동비율, 당좌비율, 총 현금, 총 부채
- **기타**: 베타, EPS (과거/예상), 애널리스트 목표가, 추천 등급

### 2. 기술적 지표 분석

- **이동평균**: SMA(20, 50, 200), EMA(12, 26)
- **RSI**: 상대강도지수 (14일)
- **MACD**: 이동평균수렴확산 + Signal + Histogram
- **볼린저밴드**: 상단/중간/하단 밴드

### 3. 뉴스 수집

- 최근 뉴스 헤드라인 (최대 10개)
- 출처 및 발행 시간 포함

### 4. 🤖 Gemini AI 분석 (선택 기능)

- **종합 평가**: AI 기반 투자 인사이트
- **강점 & 약점** 분석
- **투자 의견**: 매수/보유/매도 추천
- **리스크 요인** 분석
- **뉴스 감성 분석**: 긍정/부정 뉴스 요약 및 감성 점수 (-100 ~ +100)

## 🚀 Standalone Edition - 배포용 단일 파일

**stock_standalone.py**는 Python만 설치되어 있으면 즉시 실행 가능한 독립 실행형 버전입니다.

### 주요 특징

- ✅ **단일 파일 배포**: 모든 코드가 하나의 Python 파일에 통합
- ✅ **자동 의존성 설치**: 필요한 라이브러리를 자동으로 설치
- ✅ **크로스 플랫폼**: Windows, macOS, Linux 모두 지원
- ✅ **Python만 필요**: 복잡한 설정 불필요
- ✅ **Enhanced Edition의 모든 기능 포함**

### 빠른 시작

```bash
# Windows
run_standalone.bat

# 또는 직접 실행
python stock_standalone.py

# macOS / Linux
python3 stock_standalone.py
```

### 배포 방법

**필요한 파일:**
- `stock_standalone.py` (필수)
- `run_standalone.bat` (Windows용, 선택)
- `.env` (AI 기능 사용 시, 선택)

**배포 절차:**
1. 위 파일들을 압축 (ZIP)
2. 사용자에게 전달
3. 압축 해제 후 실행

자세한 배포 가이드는 [DISTRIBUTION.md](DISTRIBUTION.md)를 참고하세요.

## 설치 방법

### 🆕 Enhanced Edition (stock_info.py)

```bash
# 의존성 설치
pip install -r requirements_enhanced.txt

# Gemini API 키 설정 (AI 분석 기능 사용 시)
# 1. .env.example 파일을 .env로 복사
copy .env.example .env

# 2. .env 파일을 열고 API 키 입력
# GEMINI_API_KEY=your_api_key_here

# 3. Gemini API 키 발급 (무료):
# https://aistudio.google.com/app/apikey

# 실행
python stock_info.py
```

**참고**: Gemini API 키 없이도 사용 가능합니다 (AI 분석 기능만 비활성화됨).

### Python CLI 버전 (stock_cli.py)

```bash
# 의존성 설치
pip install -r requirements_cli.txt
```

### JavaScript 버전 (stock_api.js)

```bash
# 의존성 설치
npm install
```

## 사용 방법

### 0. 🆕 Enhanced Edition (stock_info.py)

```bash
python stock_info.py
```

**실행 화면:**
```
🚀 실시간 주식 정보 프로그램 (Enhanced Edition)
보고 싶은 주식의 티커를 입력하세요 (예: AAPL, GOOG). '종료'를 입력하면 프로그램을 종료합니다.

✅ Gemini AI 분석 기능이 활성화되었습니다.
✅ 기술적 지표 기능이 활성화되었습니다.

티커 입력: AAPL
조회할 날짜 (YYYY-MM-DD) [실시간: Enter]: (Enter 입력)
AI 분석을 포함하시겠습니까? (y/N): y
```

**출력 예시:**
- 📊 **가격 정보**: 현재가, 시가, 고가, 저가, 거래량, 시가총액
- 💰 **밸류에이션**: PER, PBR, PEG, PSR, EV/매출, EV/EBITDA 등
- 📈 **수익성**: 매출총이익률, 영업이익률, 순이익률, ROE 등
- 🌱 **성장성**: 매출 성장률, 이익 성장률
- 🏦 **재무건전성**: 유동비율, 부채비율, 총 현금, FCF 등
- 💵 **배당 정보**: 배당수익률, 배당금, 배당성향
- 📊 **기술적 지표**: RSI, MACD, SMA, EMA, 볼린저밴드
- 📰 **최근 뉴스**: 뉴스 헤드라인 및 출처
- 🤖 **AI 분석** (선택 시):
  - 종합 평가
  - 강점 & 약점
  - 투자 의견
  - 리스크 요인
  - 뉴스 감성 분석

### 1. Python CLI 버전 (stock_cli.py)

#### 기본 사용
```bash
# 주식 정보 조회 (JSON 출력)
python stock_cli.py AAPL

# 디버깅 모드 (들여쓰기 포함)
python stock_cli.py AAPL --pretty
```

#### 출력 예시
```json
{
  "success": true,
  "ticker": "AAPL",
  "timestamp": "2026-01-26T15:30:00.000Z",
  "data": {
    "price": {
      "current": 150.25,
      "open": 149.80,
      "high": 151.00,
      "low": 149.50
    },
    "trading": {
      "volume": 50000000,
      "marketCap": 2500000000000
    },
    "financials": {
      "roe": 0.35,
      "opm": 0.25,
      "peg": 2.5,
      "pbr": 35.0,
      "debtToEquity": 1.5,
      "fcf": 100000000000
    },
    "company": {
      "summaryOriginal": "Apple Inc. designs, manufactures...",
      "summaryTranslated": "애플 Inc.는 설계하고 제조합니다..."
    }
  },
  "error": null
}
```

#### n8n 통합

**워크플로우 구조:**
```
Trigger (Manual/Webhook)
  ↓
Execute Command (stock_cli.py 실행)
  ↓
Code (stdout 파싱)
  ↓
IF (success 체크)
  ├─ True → 데이터 처리
  └─ False → 에러 알림
```

**Execute Command 노드 설정:**
- **Command:** `python`
- **Arguments:** `C:\Exception\0.STUDY\stock\stock_cli.py {{ $json.ticker }}`

**Code 노드 (stdout 파싱):**
```javascript
const result = JSON.parse($json.stdout);
return [{ json: result }];
```

### 2. JavaScript 버전 (stock_api.js)

#### 기본 사용 (Node.js CLI)
```bash
# 주식 정보 조회
node stock_api.js AAPL

# 디버깅 모드
node stock_api.js AAPL --pretty
```

#### n8n 통합

**워크플로우 구조:**
```
Trigger (Manual/Webhook)
  ↓
Code (stock_api.js 로직 포함)
  ↓
IF (success 체크)
  ├─ True → 데이터 처리
  └─ False → 에러 알림
```

**Code 노드 설정:**

아래 전체 코드를 n8n Code 노드에 복사하여 사용합니다:

```javascript
const yahooFinance = require('yahoo-finance2').default;
const translate = require('@vitalets/google-translate-api');

async function getStockDataJson(ticker) {
  const response = {
    success: false,
    ticker: ticker.toUpperCase(),
    timestamp: new Date().toISOString(),
    data: null,
    error: null
  };

  try {
    const quote = await yahooFinance.quote(ticker);

    if (!quote || !quote.marketCap) {
      response.error = `티커 '${ticker}'에 대한 데이터를 찾을 수 없습니다.`;
      return response;
    }

    const data = {
      price: {
        current: quote.regularMarketPrice || null,
        open: quote.regularMarketOpen || null,
        high: quote.regularMarketDayHigh || null,
        low: quote.regularMarketDayLow || null
      },
      trading: {
        volume: quote.regularMarketVolume || null,
        marketCap: quote.marketCap || null
      },
      financials: {
        roe: quote.returnOnEquity || null,
        opm: quote.operatingMargins || null,
        peg: quote.pegRatio || null,
        pbr: quote.priceToBook || null,
        debtToEquity: quote.debtToEquity || null,
        fcf: quote.freeCashflow || null
      },
      company: {
        summaryOriginal: null,
        summaryTranslated: null
      }
    };

    if (quote.longBusinessSummary) {
      data.company.summaryOriginal = quote.longBusinessSummary;
      try {
        const translated = await translate(quote.longBusinessSummary, { to: 'ko' });
        if (translated && translated.text) {
          data.company.summaryTranslated = translated.text;
        }
      } catch (e) {
        // 번역 실패 시 원본만 유지
      }
    }

    response.success = true;
    response.data = data;

  } catch (error) {
    response.error = `데이터 조회 중 오류 발생: ${error.message}`;
  }

  return response;
}

// 실행
const ticker = $input.item.json.ticker || 'AAPL';
const result = await getStockDataJson(ticker);

if (!result.success) {
  throw new Error(result.error);
}

return [{ json: result }];
```

## JSON 출력 스키마

### 성공 응답
```json
{
  "success": true,
  "ticker": "AAPL",
  "timestamp": "2026-01-26T15:30:00.000Z",
  "data": {
    "price": {
      "current": number,
      "open": number,
      "high": number,
      "low": number
    },
    "trading": {
      "volume": number,
      "marketCap": number
    },
    "financials": {
      "roe": number,
      "opm": number,
      "peg": number,
      "pbr": number,
      "debtToEquity": number,
      "fcf": number
    },
    "company": {
      "summaryOriginal": string,
      "summaryTranslated": string
    }
  },
  "error": null
}
```

### 에러 응답
```json
{
  "success": false,
  "ticker": "INVALID",
  "timestamp": "2026-01-26T15:30:00.000Z",
  "data": null,
  "error": "티커 'INVALID'에 대한 데이터를 찾을 수 없습니다."
}
```

## 에러 처리

### Python CLI 버전
- 성공 시: `exit code 0`
- 실패 시: `exit code 1`
- 에러 정보는 JSON의 `error` 필드에 포함

### JavaScript 버전
- 성공 시: `{success: true}`
- 실패 시: `{success: false, error: "..."}`

### n8n에서의 에러 처리

**IF 노드를 사용한 분기:**
```javascript
// 조건식
{{ $json.success === true }}
```

- **True 경로:** 데이터를 다음 노드로 전달
- **False 경로:** 에러 알림 (Send Email, Slack 등)

## 테스트

### Python CLI 버전
```bash
# 정상 케이스
python stock_cli.py AAPL
# 기대: success=true, data 포함

# 잘못된 티커
python stock_cli.py INVALID
# 기대: success=false, error 포함

# 종료 코드 확인 (Windows)
python stock_cli.py AAPL
echo %ERRORLEVEL%  # 0 (성공)

python stock_cli.py INVALID
echo %ERRORLEVEL%  # 1 (실패)
```

### JavaScript 버전
```bash
# 정상 케이스
node stock_api.js AAPL
# 기대: success=true, data 포함

# 잘못된 티커
node stock_api.js INVALID
# 기대: success=false, error 포함
```

## 주의사항

### Python 버전
- n8n 서버에 Python 3.x 및 pip 필요
- `requirements_cli.txt` 사전 설치 필요
- Execute Command 노드에서 절대 경로 사용 권장
- Windows 환경에서 UTF-8 출력 설정 필요

### JavaScript 버전
- n8n 서버에 Node.js 및 npm 필요
- `yahoo-finance2`, `@vitalets/google-translate-api` 사전 설치 필요
- yahoo-finance2가 yfinance와 100% 동일하지 않음 (일부 필드 누락 가능)
- n8n Code 노드에서 외부 모듈 require 제한이 있을 수 있음

### 공통
- yfinance/yahoo-finance2는 무료 데이터 소스로 지연/누락 가능
- 실시간이 아닌 15분 지연 데이터일 수 있음
- 번역 API는 무료 서비스로 rate limiting 가능
- 모든 API 호출이 외부 네트워크 필요

## 파일 구조

```
C:\Exception\0.STUDY\stock\
├── stock_info.py              # 🆕 Enhanced Edition - 대화형 CLI (AI 분석 + 기술적 지표 + 뉴스)
├── stock_standalone.py        # 🚀 Standalone Edition - 배포용 단일 파일
├── stock_cli.py               # Python CLI 버전 (n8n용)
├── stock_api.js               # JavaScript 버전 (n8n용)
├── technical_indicators.py    # 🆕 기술적 지표 계산 모듈
├── gemini_analyzer.py         # 🆕 Gemini AI 분석 모듈
├── requirements.txt           # 기존 의존성 (stock_info.py 기본 버전)
├── requirements_cli.txt       # Python CLI 의존성
├── requirements_enhanced.txt  # 🆕 Enhanced Edition 의존성
├── package.json               # JavaScript 의존성
├── .env.example               # 🆕 환경 변수 템플릿
├── .gitignore                 # 🆕 Git 제외 파일 (.env 포함)
├── run.bat                    # 실행 스크립트
├── run_standalone.bat         # 🚀 Standalone Edition 실행 스크립트
├── README.md                  # 사용법 문서 (이 파일)
├── DISTRIBUTION.md            # 🚀 배포 가이드
└── CLAUDE.md                  # 프로젝트 문서
```

## 라이선스

MIT

## 문의

프로젝트에 대한 문의는 이슈를 등록해주세요.
