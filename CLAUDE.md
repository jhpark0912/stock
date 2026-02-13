# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> **AI 협업 지침**: `.claude/AI_COLLABORATION_GUIDE.md` 참조

## 디자인 시스템 (Design System)

**필수 규칙**:
- 모든 UI 작업 시 `docs/DESIGN_SYSTEM.md`를 참조할 것
- 색상, 스페이싱, 타이포그래피는 디자인 시스템 정의를 따를 것
- 임의로 색상이나 스타일을 변경하지 말 것

**주요 원칙**:
- Primary Color: Indigo (#6366F1) - Linear 앱 스타일의 현대적이고 세련된 디자인
- 아이콘: Lucide React만 사용, 크기 제한 (h-4, h-5, h-6)
- 애니메이션: GPU 가속 속성만 (transform, opacity), duration 200-300ms
- 일관성: 같은 역할은 같은 스타일 유지
- 스페이싱: 4의 배수 (4, 8, 12, 16, 24, 32...)

**상세 문서**: `docs/DESIGN_SYSTEM.md` 참조

---

## 프로젝트 구조

**구조 분석 시 필수 참조**: `.claude/PROJECT_STRUCTURE.md`

이 문서는 프로젝트의 전체 아키텍처, 디렉토리 구조, 기술 스택, 데이터 흐름을 정리한 문서입니다.
- 새로운 기능 개발 전 구조 파악
- API 엔드포인트 확인
- 컴포넌트 위치 찾기
- 데이터베이스 스키마 확인

**주요 내용**:
- Frontend: React + TypeScript + Vite + Radix UI + Tailwind
- Backend: FastAPI + SQLAlchemy + yahooquery + Gemini AI
- 디렉토리 구조 및 주요 파일 위치
- API 엔드포인트 목록
- 데이터 흐름 다이어그램

**📋 자동 업데이트 원칙**:

Claude는 다음 작업 후 **반드시** `.claude/PROJECT_STRUCTURE.md`를 업데이트해야 합니다:
- ✅ 새 디렉토리/파일 생성 (특히 `components/`, `api/routes/`, `models/`, `services/`)
- ✅ API 엔드포인트 추가/수정/삭제
- ✅ 데이터베이스 스키마 변경 (모델 추가/수정)
- ✅ 새로운 의존성 추가 (package.json, requirements.txt)
- ✅ 주요 기능 추가/변경
- ✅ 환경 변수 추가

**업데이트 절차**:
1. 구조 변경 작업 완료 후
2. `.claude/PROJECT_STRUCTURE.md` 읽기
3. 변경 사항 반영 (날짜, 내용 갱신)
4. 사용자에게 "구조 문서 업데이트 완료" 알림

---

## ⚠️ 탐색 규칙

- plan 모드에서 병렬 에이전트 탐색 금지
- 코드 탐색 전 반드시 `.claude/PROJECT_STRUCTURE.md`의 구조 정보를 먼저 활용할 것
- 추가 탐색이 필요하면 최소한의 파일만 열 것

## Git Commit 워크플로우

**필수 참조**: `.claude/COMMIT_CONVENTION.md`

### 커밋 메시지 형식

```
:[emoji]: [type] 메시지
```

**예시**:
```
:sparkles: [feat] 새로운 로그인 기능 추가
:bug: [fix] 인증 토큰 만료 오류 수정
:memo: [docs] README 업데이트
```

### Type 목록

| Type | Emoji | 용도 |
|------|-------|------|
| `feat` | `:sparkles:` | 새 기능 |
| `fix` | `:bug:` | 버그 수정 |
| `docs` | `:memo:` | 문서 |
| `style` | `:art:` | 코드 스타일 |
| `refactor` | `:recycle:` | 리팩토링 |
| `test` | `:white_check_mark:` | 테스트 |
| `chore` | `:wrench:` | 기타 작업 |

### Claude의 커밋 워크플로우

1. 커밋 전 `git status`, `git diff` 확인
2. Convention에 맞는 메시지 작성
3. 커밋 후 push 여부 사용자에게 질문
4. 구조 변경 시 `PROJECT_STRUCTURE.md` 업데이트 포함

### Husky Hooks

- `pre-commit`: main/master 직접 커밋 경고
- `commit-msg`: 메시지 형식 검증

---

## 계획

- 계획 혹은 개발 페이즈를 생성할때는 `.claude/plans` 하위에 생성
- 기존 계획을 문의하면 해당 폴더를 확인한 후 대답

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

---

## 로깅 가이드라인

### 로그 레벨 정책

| 레벨 | 용도 | 예시 |
|------|------|------|
| `ERROR` | 에러/예외 상황 (반드시 유지) | API 키 없음, 예외 발생 |
| `WARNING` | 경고 상황 (유지 권장) | 데이터 없음, 라이브러리 미설치 |
| `INFO` | 서버 시작 등 1회성 이벤트 | DB 초기화, Admin 계정 생성 |
| `DEBUG` | 상세 디버깅 정보 | API 호출 과정, 요청/응답 로그 |

### 운영 환경 설정

- 기본 로그 레벨: `INFO` (환경변수 `LOG_LEVEL`로 설정)
- 디버깅 필요 시: `LOG_LEVEL=DEBUG`로 변경

### Frontend 로깅

- **운영 환경**: `console.log` 사용 금지
- **개발 환경**: 필요 시 조건부 로깅 사용
  ```typescript
  if (import.meta.env.DEV) {
    console.log('디버깅 정보');
  }
  ```

### Backend 로깅

- **상세 과정 로그**: `logger.debug()` 사용
  - API 호출/응답 과정
  - 데이터 조회 과정
  - 분석 단계별 진행 상황
- **에러 로그**: `logger.error()` 유지
- **경고 로그**: `logger.warning()` 유지

### 정리된 파일 목록 (2026-02-07)

**Frontend (console.log 삭제)**:
- `EconomicIndicators.tsx`
- `DetailChart.tsx`

**Backend (info → debug 변경)**:
- `stock.py` - 라우터 초기화, 조회, 분석 과정 로그
- `stock_service.py` - Gemini 분석 과정 로그
- `health.py` - Gemini 테스트 로그
- `main.py` - 404 핸들러 로그
- `fred_service.py` - 병렬 조회 로그
- `economic_service.py` - 병렬 조회 로그

---

## 사용자 경험 및 문서화 가이드라인

### 초보자 친화적 설명 원칙

**필수 규칙**: 전문적인 내용을 추가할 때는 **항상** 초보자도 이해 가능한 설명을 함께 제공할 것

#### 1. 비유(Metaphor) 사용
전문 용어나 복잡한 개념은 일상적인 비유로 설명

**예시**:
```python
# Backend (FRED API 메타데이터)
"CPI": {
    "name": "소비자물가지수",
    "metaphor": "장바구니 물가",  # 일상적 비유
    "description": "실제 구매하는 상품·서비스 가격 변화를 측정",
    "impact": "높으면 금리 인상 → 주식 하락 압력"
}
```

```tsx
// Frontend (Tooltip 설명)
<TooltipContent>
  <p className="font-medium">🛒 소비자물가지수 - "장바구니 물가"</p>
  <p className="text-xs">실제 구매하는 상품·서비스 가격 변화를 측정.</p>
  <p className="text-xs text-muted-foreground">
    2% 목표. 높으면 금리 인상 → 주식 하락 압력
  </p>
</TooltipContent>
```

#### 2. 설명 구조

**3단계 구조**를 따를 것:

| 단계 | 내용 | 예시 |
|------|------|------|
| **1. 비유** | 친숙한 개념으로 비유 | "경제의 체온계", "공포 지수" |
| **2. 정의** | 무엇을 측정하는가 | "공장·광산·전기 생산량 측정" |
| **3. 영향** | 투자자 관점의 실용 정보 | "상승하면 경기 회복 신호" |

**나쁜 예시** ❌:
```
"VIX: S&P 500 옵션의 내재 변동성을 측정하는 지수"
```

**좋은 예시** ✅:
```
VIX - "공포 지수"
투자자들의 불안감을 숫자로 표현한 지표.
20 이하=안정, 30 이상=공포. 높을수록 변동성 크고 안전자산 선호
```

#### 3. 구체적 기준 제시

추상적 표현 대신 **구체적인 숫자 기준**을 제공

| 추상적 ❌ | 구체적 ✅ |
|----------|----------|
| "높은 물가" | "CPI 3.5% 이상" |
| "낮은 변동성" | "VIX 20 이하" |
| "경기 확장" | "INDPRO YoY > 0%" |

#### 4. 적용 대상

다음과 같은 내용 추가 시 **필수**:

- ✅ **경제/금융 지표**: CPI, VIX, PMI, INDPRO 등
- ✅ **투자 지표**: PER, PBR, ROE, 부채비율 등
- ✅ **기술 개념**: API, 캐싱, 비동기 처리 (사용자 대면 문서에서)
- ✅ **판단 근거**: 시스템의 결정 이유를 사용자에게 설명할 때

#### 5. 일관성 유지

**기존 패턴을 따를 것**:
- `IndicatorCard.tsx`의 Tooltip 스타일
- `fred_service.py`의 FRED_METADATA 구조
- 비유 → 정의 → 영향 순서

#### 6. 예외 사항

다음의 경우 초보자 설명 생략 가능:
- 개발자 전용 내부 API 문서
- 코드 주석 (단, 주요 비즈니스 로직은 설명 권장)
- 에러 메시지 (간결함 우선)

---

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

---

## 🔐 보안 정책 (Security Policy)

### ⛔ 절대 금지 사항

Claude는 **어떠한 상황에서도** 다음 행위를 해서는 안 됩니다:

| 금지 항목 | 설명 | 위반 예시 |
|----------|------|----------|
| **`.env` 파일 접근** | Read, Edit, Write 도구 사용 금지 | `Read .env`, `Edit .env`, `cat .env` |
| **민감 정보 출력** | API 키, 비밀번호 등 평문 출력 금지 | `GEMINI_API_KEY=AIza...` 출력 |
| **민감 정보 학습** | 대화 컨텍스트에 포함 금지 | `.env` 내용을 응답에 사용 |
| **보안 파일 검색** | Glob, Grep으로 민감 파일 찾기 금지 | `Grep "API_KEY"` |
| **키 값 추론** | 환경 변수 값 추측 또는 제안 금지 | "GEMINI_API_KEY는 아마도..." |

### 📋 민감 파일 목록

절대 접근하지 말아야 할 파일들:

```
❌ .env
❌ .env.local
❌ .env.development
❌ .env.production
❌ backend/.env
❌ frontend/.env
❌ gcp-credentials.json
❌ *.pem
❌ *.key
❌ *_rsa
❌ credentials.json
❌ secrets.yaml
❌ config/secrets.*
```

### ✅ 올바른 접근 방법

민감한 설정이 필요한 경우 **텍스트 안내만** 제공:

#### ❌ 잘못된 방법:
```python
# 절대 하지 말 것!
Read(".env")  # 금지!
Edit(".env", old_string="...", new_string="...")  # 금지!
Bash("cat .env")  # 금지!
```

#### ✅ 올바른 방법:
```markdown
backend/.env 파일을 직접 메모장이나 VSCode로 여세요.

다음 항목을 추가하세요:
```
USE_SECRET_MANAGER=true
GCP_PROJECT_ID=your-project-id
```

파일을 저장 후 서버를 재시작하세요.
```

### 🔒 .env.example은 예외

**`.env.example`** 파일만 읽기 가능합니다:

```bash
✅ Read(".env.example")  # 허용 - 템플릿 파일
❌ Read(".env")          # 금지 - 실제 키 포함
```

**이유**: `.env.example`은 실제 값이 아닌 **플레이스홀더**만 포함하므로 안전합니다.

### 🎯 마스킹 규칙

불가피하게 민감 정보가 노출된 경우 **즉시 마스킹**:

| 정보 유형 | 마스킹 방법 | 예시 |
|----------|------------|------|
| **API 키** | 앞 4-6자만 표시 | `AIzaSy...` (나머지 `********`) |
| **비밀번호** | 완전 마스킹 | `********` |
| **JWT Secret** | 완전 마스킹 | `********` |
| **이메일** | 도메인만 표시 | `***@gmail.com` |
| **토큰** | 앞 8자만 표시 | `eyJ0eXAi...` |

### 📝 안전한 문서화

환경 변수 설명 시 **값이 아닌 형식만** 안내:

#### ❌ 잘못된 예시:
```bash
# 실제 키 노출 - 절대 금지!
GEMINI_API_KEY=AIzaSyB431S8nQrpJfj8Q7n5lgfQTdcEc6h2lDc
```

#### ✅ 올바른 예시:
```bash
# 형식 안내만
GEMINI_API_KEY=your_api_key_here

# 발급 방법 안내
# 1. https://aistudio.google.com/app/apikey 접속
# 2. Create API Key 클릭
# 3. 생성된 키를 복사하여 이 값에 입력
```

### 🚨 보안 위반 시 대응

실수로 민감 정보를 읽거나 출력한 경우:

1. **즉시 중단**: 추가 작업 중지
2. **사과**: 명확하게 실수 인정
3. **영향 평가**: 어떤 정보가 노출되었는지 설명
4. **키 로테이션 권장**: 영향받은 키 재발급 안내
5. **재발 방지**: 왜 발생했는지 분석 후 개선

### 🔄 API 키 로테이션 가이드

보안 사고 발생 시 즉시 실행:

#### 1. Gemini API 키
```
https://aistudio.google.com/app/apikey
→ 기존 키 삭제 → 새 키 생성
```

#### 2. JWT Secret 재생성
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

#### 3. Encryption Key 재생성
```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

#### 4. KIS API 재발급
```
https://apiportal.koreainvestment.com
→ APP 관리 → APP KEY 재발급
```

#### 5. Secret Manager 업데이트
```bash
# 새 키를 .env에 임시 입력 후
export GCP_PROJECT_ID=your-project-id
./update_secrets.sh

# 즉시 .env에서 제거
```

### 💡 보안 체크리스트

모든 작업 전 확인:

- [ ] `.env` 파일 접근이 필요한가? → **No면 진행, Yes면 텍스트 안내로 대체**
- [ ] 민감 정보가 출력될 가능성이 있는가? → **Yes면 마스킹 처리**
- [ ] 사용자에게 직접 편집을 안내할 수 있는가? → **Yes면 안내, No면 재검토**
- [ ] 보안 파일 목록에 포함되는가? → **Yes면 절대 접근 금지**

### 🛡️ Anthropic 보안 정책

참고: [Anthropic Privacy Policy](https://www.anthropic.com/legal/privacy)

```
✅ 대화 내용은 모델 학습에 사용되지 않음
✅ 사용자 간 완전 격리
✅ 대화 종료 후 일정 기간 후 삭제
⚠️  API 요청 시 Anthropic 서버로 전송됨 (응답 생성용)
```

**중요**: 대화 컨텍스트에 민감 정보가 포함되면 세션 동안 Anthropic 서버에 존재합니다. 따라서 **절대 읽지 말아야** 합니다.

---

## 📌 요약

### Claude가 해야 할 것:
- ✅ `.env.example` 읽기 (템플릿 파일)
- ✅ 환경 변수 **형식** 안내
- ✅ API 키 **발급 방법** 안내
- ✅ 텍스트로 **수동 편집** 안내
- ✅ 보안 위반 시 **즉시 사과 및 로테이션 권장**

### Claude가 하지 말아야 할 것:
- ❌ `.env` 파일 Read/Edit/Write
- ❌ API 키, 비밀번호 평문 출력
- ❌ 민감 파일 Glob/Grep 검색
- ❌ Bash로 민감 파일 접근 (`cat .env` 등)
- ❌ 키 값 추론 또는 제안

---

**마지막 업데이트**: 2026-02-10
**사유**: 보안 정책 위반 사례 발생, 재발 방지를 위한 명확한 규칙 추가
