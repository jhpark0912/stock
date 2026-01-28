# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

주식 정보 조회 도구를 세 가지 버전으로 제공합니다:

1. **stock_info.py** - 🆕 **Enhanced Edition** - AI 분석, 기술적 지표, 뉴스 포함 대화형 CLI
   - yfinance API를 사용하여 실시간 및 과거 주식 데이터 가져오기
   - rich 라이브러리로 터미널에 시각적으로 표시
   - 🆕 22개 추가 재무 지표 (총 35개 이상)
   - 🆕 기술적 지표 (RSI, MACD, SMA, EMA, 볼린저밴드)
   - 🆕 뉴스 수집 및 표시
   - 🆕 Gemini AI 기반 투자 인사이트 및 뉴스 감성 분석

2. **stock_cli.py** - n8n Execute Command 노드용 CLI
   - 명령줄 인자로 티커 입력
   - JSON 형식으로 데이터 출력
   - 실시간 데이터만 조회

3. **stock_api.js** - n8n Code 노드용 JavaScript 모듈
   - yahoo-finance2 API 사용
   - JavaScript 함수로 제공
   - JSON 형식으로 데이터 반환

## 실행 방법

### 1. 대화형 CLI (stock_info.py)

**Windows:**
```bash
run.bat
```

**직접 실행:**
```bash
python stock_info.py
```

**의존성 설치:**
```bash
pip install -r requirements.txt
```

### 2. Python CLI for n8n (stock_cli.py)

**의존성 설치:**
```bash
pip install -r requirements_cli.txt
```

**실행:**
```bash
# 기본 사용
python stock_cli.py AAPL

# 디버깅 모드 (JSON 들여쓰기)
python stock_cli.py AAPL --pretty
```

### 3. JavaScript for n8n (stock_api.js)

**의존성 설치:**
```bash
npm install
```

**실행:**
```bash
# 기본 사용
node stock_api.js AAPL

# 디버깅 모드
node stock_api.js AAPL --pretty
```

### 필요한 환경
- **Python:** Python 3.x (현재 환경: Python 3.13)
- **Node.js:** Node.js 14.0.0 이상

## 아키텍처

### 파일 구조

```
C:\Exception\0.STUDY\stock\
├── stock_info.py              # 🆕 Enhanced Edition - 대화형 CLI (AI + 기술적 지표 + 뉴스)
├── stock_cli.py               # n8n Python CLI 버전
├── stock_api.js               # n8n JavaScript 버전
├── technical_indicators.py    # 🆕 기술적 지표 계산 모듈
├── gemini_analyzer.py         # 🆕 Gemini AI 분석 모듈
├── requirements.txt           # stock_info.py 기본 의존성
├── requirements_cli.txt       # stock_cli.py 의존성
├── requirements_enhanced.txt  # 🆕 Enhanced Edition 의존성
├── package.json               # stock_api.js 의존성
├── .env.example               # 🆕 환경 변수 템플릿
├── .gitignore                 # 🆕 Git 제외 파일
├── run.bat                    # stock_info.py 실행 스크립트
├── README.md                  # 사용법 문서
└── CLAUDE.md                  # 이 파일
```

### 핵심 컴포넌트

#### stock_info.py (대화형 CLI)

1. **자동 의존성 관리** (`install_and_import`)
   - 실행 시 필요한 라이브러리 자동 설치
   - yfinance, rich, deep_translator를 동적으로 로드

2. **데이터 조회** (`get_stock_data`)
   - yfinance API를 통해 주식 데이터 조회
   - 두 가지 모드 지원:
     - 실시간 데이터: `ticker.info` 사용, 다양한 재무 지표 포함 (ROE, OPM, PEG, PBR, 부채비율, FCF 등)
     - 과거 데이터: `ticker.history()` 사용, OHLCV 데이터만 제공
   - 에러 처리: 잘못된 티커, 날짜 형식 오류, 데이터 없음 등

3. **출력 포맷팅** (`display_stock_data`)
   - rich 라이브러리로 터미널 UI 구성
   - Panel과 Table 사용하여 구조화된 출력
   - 회사 개요 자동 번역 (영어 → 한국어, deep_translator 사용)

4. **메인 루프** (`main`)
   - 대화형 CLI 인터페이스
   - 티커 입력 → 날짜 선택 → 데이터 표시 반복
   - 종료 명령: 'exit', 'quit', '종료'

#### stock_cli.py (n8n Python CLI)

1. **데이터 조회** (`get_stock_data_json`)
   - yfinance API를 통해 주식 데이터 조회
   - 실시간 데이터만 지원 (과거 데이터 조회 없음)
   - JSON 스키마로 데이터 정규화
   - deep_translator로 회사 개요 번역
   - 에러 발생 시 `{success: false, error: "..."}` 반환

2. **CLI 인터페이스** (`main`)
   - argparse로 명령줄 인자 처리
   - `--pretty` 옵션으로 JSON 들여쓰기
   - stdout으로 JSON 출력
   - 성공 시 exit(0), 실패 시 exit(1)

#### stock_api.js (n8n JavaScript)

1. **데이터 조회** (`getStockDataJson`)
   - yahoo-finance2 API를 통해 주식 데이터 조회
   - 실시간 데이터만 지원
   - JSON 스키마로 데이터 정규화
   - @vitalets/google-translate-api로 번역
   - Promise로 비동기 처리

2. **n8n 통합**
   - module.exports로 함수 내보내기
   - n8n Code 노드에서 직접 사용 가능
   - CLI로도 실행 가능 (`node stock_api.js AAPL`)

#### 🆕 technical_indicators.py (기술적 지표 모듈)

1. **지원 지표**
   - `calculate_sma()`: 단순이동평균 (20, 50, 200일)
   - `calculate_ema()`: 지수이동평균 (12, 26일)
   - `calculate_rsi()`: 상대강도지수 (14일)
   - `calculate_macd()`: MACD + Signal + Histogram
   - `calculate_bollinger_bands()`: 볼린저밴드 (상단/중간/하단)

2. **데이터 처리**
   - pandas와 numpy를 사용한 벡터화 계산
   - 최소 50일 데이터 필요 (권장: 200일)
   - NaN 값 자동 처리
   - 최신 값 추출 및 반환

3. **API**
   - `calculate_all_indicators(prices, ticker)`: 모든 지표를 한 번에 계산
   - 에러 발생 시 `{'error': '메시지'}` 반환
   - 성공 시 구조화된 딕셔너리 반환

#### 🆕 gemini_analyzer.py (AI 분석 모듈)

1. **GeminiAnalyzer 클래스**
   - 환경 변수 `.env`에서 `GEMINI_API_KEY` 로드
   - Gemini 1.5 Flash 모델 사용 (빠르고 저렴)

2. **주식 분석** (`analyze_stock`)
   - 재무 지표 + 기술적 지표 기반 AI 분석
   - 프롬프트 엔지니어링으로 구조화된 응답 생성
   - 반환 데이터:
     - `summary`: 종합 평가 (1-3문장)
     - `strengths`: 강점 리스트
     - `weaknesses`: 약점 리스트
     - `recommendation`: 투자 의견 (매수/보유/매도)
     - `risks`: 리스크 요인 리스트
     - `target_price`: 목표가 (선택)

3. **뉴스 감성 분석** (`analyze_news_sentiment`)
   - 뉴스 헤드라인 기반 감성 분석
   - 반환 데이터:
     - `score`: -100 ~ +100 감성 점수
     - `sentiment`: positive|neutral|negative
     - `positive_news`: 긍정 뉴스 요약 리스트
     - `negative_news`: 부정 뉴스 요약 리스트
     - `market_mood`: 시장 심리 평가

4. **프롬프트 설계**
   - 20년 경력 애널리스트 페르소나
   - 한국어 응답 강제
   - 마크다운 기반 구조화된 출력
   - 파싱 로직으로 딕셔너리 변환

### 데이터 흐름

#### stock_info.py (대화형)
```
사용자 입력 (티커 + 날짜)
    ↓
get_stock_data()
    ↓
yfinance API 호출
    ↓
데이터 정규화 (dict 구조)
    ↓
display_stock_data()
    ↓
rich 포맷팅 + 번역
    ↓
터미널 출력
```

#### stock_cli.py (Python CLI)
```
명령줄 인자 (티커)
    ↓
get_stock_data_json()
    ↓
yfinance API 호출
    ↓
데이터 정규화 (JSON 스키마)
    ↓
번역 (deep_translator)
    ↓
JSON 출력 (stdout)
```

#### stock_api.js (JavaScript)
```
함수 파라미터 (티커)
    ↓
getStockDataJson()
    ↓
yahoo-finance2 API 호출
    ↓
데이터 정규화 (JSON 스키마)
    ↓
번역 (@vitalets/google-translate-api)
    ↓
JSON 반환 (Promise)
```

## 코드 수정 시 주의사항

### 새로운 재무 지표 추가
`get_stock_data` 함수의 `data` 딕셔너리에 `info.get()` 호출 추가:
```python
data = {
    # 기존 필드들...
    'newMetric': info.get('newMetricKey'),
}
```

그 다음 `display_stock_data` 함수의 테이블에 행 추가:
```python
table.add_row("새 지표:", format_num(data['newMetric']))
```

### yfinance 데이터 키 확인
yfinance가 제공하는 정확한 키 이름은 실행 시 `ticker.info` 전체를 출력하여 확인:
```python
import pprint
pprint.pprint(ticker.info)
```

### 번역 기능
`deep_translator`의 `GoogleTranslator` 사용:
```python
translator = GoogleTranslator(source='auto', target='ko')
translated_summary = translator.translate(summary)
```
- `source='auto'`로 자동 언어 감지
- 번역 실패 시 원본 텍스트 표시

### 날짜 범위 조회 확장
현재는 단일 날짜만 조회. 범위 조회를 추가하려면:
1. `main()`에서 start_date와 end_date 입력 받기
2. `get_stock_data()`에 날짜 범위 파라미터 추가
3. `ticker.history(start=..., end=...)` 호출
4. 결과를 DataFrame으로 처리 (현재는 단일 행만 처리)

## 알려진 제약사항

1. **Python 3.13 호환성**:
   - Python 3.13에서 `cgi` 모듈이 제거되어 `googletrans` 라이브러리 사용 불가
   - 현재 `deep_translator` 사용으로 해결됨
   - 과거 버전에서 `googletrans` 관련 오류 발생 시 `deep_translator`로 교체 필요
2. **주말/공휴일 데이터**: 과거 데이터 조회 시 거래가 없는 날은 빈 결과 반환
3. **번역 안정성**: deep_translator는 Google Translate API 사용, 네트워크 오류 가능
4. **yfinance 데이터 정확성**: 무료 데이터 소스로, 지연 또는 누락 가능
5. **FCF와 이자보상배율**: yfinance에서 항상 제공되지 않음 ('N/A' 표시)

## 환경 의존성

### 절대 경로 사용
`run.bat`에 하드코딩된 Python 인터프리터 경로:
```
C:\Users\jhpark0912\AppData\Local\Programs\Python\Python313\python.exe
```

다른 환경에서 실행 시 수정 필요하거나 직접 `python stock_info.py` 실행 권장.

## n8n 통합 가이드

### Python CLI 버전 (stock_cli.py)

#### Execute Command 노드 설정
- **Command:** `python`
- **Arguments:** `C:\Exception\0.STUDY\stock\stock_cli.py {{ $json.ticker }}`

#### 워크플로우 예시
```
Trigger (Manual/Webhook)
  ↓
Set Variables (ticker 설정)
  ↓
Execute Command (stock_cli.py 실행)
  ↓
Code (stdout 파싱)
  ↓
IF (success 체크)
  ├─ True → 데이터 처리
  └─ False → 에러 알림
```

#### stdout 파싱 코드 (Code 노드)
```javascript
const result = JSON.parse($json.stdout);
return [{ json: result }];
```

### JavaScript 버전 (stock_api.js)

#### Code 노드 설정
전체 코드를 n8n Code 노드에 복사하여 사용:

```javascript
const yahooFinance = require('yahoo-finance2').default;
const translate = require('@vitalets/google-translate-api');

async function getStockDataJson(ticker) {
  // ... (stock_api.js의 전체 함수 복사)
}

// 실행
const ticker = $input.item.json.ticker || 'AAPL';
const result = await getStockDataJson(ticker);

if (!result.success) {
  throw new Error(result.error);
}

return [{ json: result }];
```

#### 워크플로우 예시
```
Trigger (Manual/Webhook)
  ↓
Code (stock_api.js 로직 포함)
  ↓
IF (success 체크)
  ├─ True → 데이터 처리
  └─ False → 에러 알림
```

### JSON 출력 스키마

```json
{
  "success": true/false,
  "ticker": "AAPL",
  "timestamp": "2026-01-26T15:30:00.000Z",
  "data": {
    "price": { "current", "open", "high", "low" },
    "trading": { "volume", "marketCap" },
    "financials": { "roe", "opm", "peg", "pbr", "debtToEquity", "fcf" },
    "company": { "summaryOriginal", "summaryTranslated" }
  },
  "error": null
}
```

### 에러 처리

n8n IF 노드에서 success 체크:
```javascript
{{ $json.success === true }}
```

- **True 경로:** 데이터를 다음 노드로 전달
- **False 경로:** 에러 알림 (Send Email, Slack 등)
