"""
경제 지표 API 라우터 패키지

하위 모듈:
- indicators: 경제 지표 조회 (GET /economic, GET /economic/status)
- sectors: 섹터 ETF (GET /economic/sectors, .../holdings)
- market_cycle: 시장 사이클 (GET /economic/market-cycle, .../analysis)
- market_review: 증시 마감 리뷰 (GET .../market-review/{country}, POST .../ai)
"""
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
