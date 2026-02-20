# 리팩토링 로드맵 (P1~P5)

> 작성일: 2026-02-20  
> 상태: P1 완료, P2 다음 세션 시작 예정

---

## ✅ P1 완료 — services/ 도메인 서브패키지 재편

- 커밋: `9ce6909` (dev 브랜치)
- 내용: 15개 서비스 파일 → 7개 도메인 서브패키지 (`git mv` 이력 보존)
- 검증: 서버 기동 + import 통과

```
backend/app/services/
├── __init__.py              # re-export 안전망 (TODO: 소비자 전환 완료 후 제거)
├── auth/auth_service.py
├── common/indicator_status.py
├── economic/{economic_service, fred_service, korea_economic_service}.py
├── market/{market_cycle_service, kr_market_cycle_service, market_review_service}.py
├── sector/{sector_service, korea_sector_service}.py
├── stock/{stock_service, mock_data, technical_indicators}.py
└── korea_data/{kis_api_service, pykrx_service}.py
```

---

## 🔜 P2 — economic.py 라우터 4파일 분할 (다음 세션 시작)

### 배경
- `backend/app/api/routes/economic.py`: 693줄 / 11개 엔드포인트 / 단일 파일
- `main.py`는 `from app.api.routes import economic`으로 `economic.router` 참조
- 파일 → 패키지 전환 시 `economic/__init__.py`에 `router` 노출하면 **main.py 무변경**

### 목표 구조
```
backend/app/api/routes/
├── economic/
│   ├── __init__.py       # router 통합 (include_router x4)
│   ├── indicators.py     # GET /economic, GET /economic/status
│   ├── sectors.py        # GET /economic/sectors, .../holdings
│   ├── market_cycle.py   # GET /economic/market-cycle, .../analysis
│   └── market_review.py  # GET .../market-review/{country}, POST .../ai
└── (기존 파일들 무변경)
```

### `economic/__init__.py` 패턴
```python
from fastapi import APIRouter
from .indicators import router as indicators_router
from .sectors import router as sectors_router
from .market_cycle import router as market_cycle_router
from .market_review import router as market_review_router

router = APIRouter()
router.include_router(indicators_router)
router.include_router(sectors_router)
router.include_router(market_cycle_router)
router.include_router(market_review_router)
```

### 엔드포인트 분배

| 파일 | 엔드포인트 | 헬퍼 함수 | 의존 서비스 (신규 경로) |
|------|-----------|----------|----------------------|
| `indicators.py` | `GET /economic`<br>`GET /economic/status` | `_get_us_indicators`<br>`_get_kr_indicators`<br>`_get_all_indicators` | `economic.economic_service`<br>`economic.fred_service`<br>`economic.korea_economic_service`<br>`auth.auth_service` |
| `sectors.py` | `GET /economic/sectors`<br>`GET /economic/sectors/{symbol}/holdings` | - | `sector.sector_service`<br>`sector.korea_sector_service`<br>`auth.auth_service` |
| `market_cycle.py` | `GET /economic/market-cycle`<br>`GET /economic/market-cycle/analysis` | - | `market.market_cycle_service`<br>`market.kr_market_cycle_service` |
| `market_review.py` | `GET /economic/market-review/{country}`<br>`POST /economic/market-review/{country}/ai` | - | `market.market_review_service`<br>`auth.auth_service` |

### 공통 import (모든 파일에 필요한 것)
```python
import logging
from fastapi import APIRouter, Query, Depends
from datetime import datetime
from typing import Literal, Optional
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.models import UserDB
from app.database.user_repository import UserRepository
```

### 실행 순서
1. `economic/` 디렉토리 생성 (mkdir)
2. 기존 `economic.py` 파일을 참조하여 4개 파일 작성
3. `economic/__init__.py` 작성
4. 기존 `economic.py` 삭제 (`git rm`)
5. `git add` + 커밋
6. 검증: `python -c "from app.api.routes.economic import router; print('OK')"`
7. 서버 기동 + 엔드포인트 호출 테스트

### 검증 명령어
```bash
# pycache 정리
find backend -name __pycache__ -exec rm -rf {} + 2>/dev/null

# import 검증
cd backend && python -c "from app.api.routes.economic import router; print('router OK')"

# 서버 기동
cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000

# 엔드포인트 호출 (별도 터미널)
curl http://localhost:8000/api/economic?country=us
curl http://localhost:8000/api/economic/sectors
curl http://localhost:8000/api/economic/market-cycle

# Lint
flake8 backend/app/api/routes/economic/ --max-line-length=120
```

---

## 📋 P3 — Frontend 거대 컴포넌트 분리 (중기)

> 해당 컴포넌트 수정 작업 시 함께 진행 권장

| 컴포넌트 | 라인 | 분리 전략 |
|----------|------|----------|
| `StealthHomePage.tsx` | 868L | 데이터 변환 → `useStealthHome()` 훅 추출 |
| `MarketCycleSection.tsx` | 666L | 4계절 카드 → `SeasonCard` 서브컴포넌트 분리 |
| `StockChart.tsx` | 652L | 차트 옵션/데이터 → `useChartData()` + `chartConfig.ts` |
| `SettingsPage.tsx` | 610L | 프로필/KIS키/테마 → `settings/ProfileSection.tsx` 등 분리 |
| `EconomicIndicators.tsx` | 606L | 탭 오케스트레이터만 남기고 → `useEconomicData()` 훅 |
| `StealthPortfolioPage.tsx` | 590L | → `useStealthPortfolio()` 훅 |

**선례**: `usePortfolio.ts` (380L)로 PortfolioPage 분리한 패턴 동일 적용

---

## 📋 P4 — 커스텀 훅 확충 (중기, P3와 병행)

> `hooks/` 에 현재 `usePortfolio.ts` 1개만 존재

| 훅 | 역할 | 추출 원본 |
|----|------|----------|
| `useEconomicData(country)` | 경제지표 API 조회 + TanStack Query 캐싱 | `EconomicIndicators.tsx` |
| `useStockData(ticker)` | 주식 데이터 조회 + 로딩 상태 | `PortfolioPage.tsx`, `MainTabs.tsx` |
| `useMarketCycle(country)` | 시장사이클 + AI 분석 요청 | `MarketCycleSection.tsx` |
| `useStealthHome()` | 스텔스 홈 데이터 변환 | `StealthHomePage.tsx` |
| `useStealthPortfolio()` | 스텔스 포트폴리오 데이터 변환 | `StealthPortfolioPage.tsx` |
| `useChartData(ticker, period)` | 차트 데이터 가공 + 기간 필터링 | `StockChart.tsx` |

---

## 📋 P5 — Pydantic 모델 파일 분리 (낮은 우선순위)

> `models/economic.py` 347줄/31개 클래스. 새 모델 추가 필요 시 해당 도메인 파일로 점진 분리.

```
backend/app/models/
├── economic/
│   ├── __init__.py    # re-export (기존 import 호환)
│   ├── us.py          # RatesData, MacroData, CommoditiesData, EconomicData, EconomicResponse
│   ├── kr.py          # KoreaRatesData, KoreaMacroData, KoreaFxData, KoreaEconomicData ...
│   ├── sector.py      # SectorData, SectorResponse, SectorHolding, SectorHoldingsResponse
│   └── market.py      # MarketCycleData, MarketReviewData 등 13개 클래스
└── (stock.py, user.py, portfolio.py 무변경)
```

---

## 우선순위 요약

| 단계 | 작업 | 상태 | 리스크 |
|------|------|------|--------|
| **P1** | services/ 서브패키지화 | ✅ **완료** (커밋 9ce6909) | - |
| **P2** | economic.py 라우터 분할 | 🔜 **다음 세션** | 낮음 |
| **P3** | Frontend 거대 컴포넌트 분리 | ⏳ 해당 컴포넌트 수정 시 | 중간 |
| **P4** | 커스텀 훅 확충 | ⏳ P3와 병행 | 중간 |
| **P5** | Pydantic 모델 분리 | ⏳ 모델 추가 필요 시 | 낮음 |
