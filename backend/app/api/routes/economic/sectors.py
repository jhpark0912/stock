"""
섹터 ETF 라우터
- GET /economic/sectors
- GET /economic/sectors/{symbol}/holdings
"""

import logging
from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database.models import UserDB
from app.database.user_repository import UserRepository
from app.models.economic import (
    SectorData,
    SectorHolding,
    SectorHoldingsResponse,
    SectorResponse,
)
from app.services.auth.auth_service import get_current_user
from app.services.sector.sector_service import get_sector_data, get_sector_holdings

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/economic/sectors", response_model=SectorResponse)
async def get_sector_performance(
    country: str = Query("us", regex="^(us|kr|all)$", description="국가 선택: us, kr, all"),
):
    """
    섹터 ETF 성과 데이터 조회

    미국 GICS 11개 섹터 ETF 또는 한국 KODEX 섹터 ETF의 가격 및 변화율 조회

    Parameters:
    - country: 'us' (미국 11개), 'kr' (한국 9개), 'all' (전체 20개)

    Returns:
    - 성공 시: 섹터 ETF 데이터 (현재가, 1D/1W/1M 변화율)
    - 실패 시: 에러 메시지
    """
    try:
        logger.debug(f"섹터 ETF 데이터 조회 요청 (country={country})")

        sectors = await get_sector_data(country)

        if not sectors:
            return SectorResponse(success=False, error="섹터 데이터를 조회할 수 없습니다.")

        sector_data = [SectorData(**s) for s in sectors]

        logger.debug(f"섹터 ETF 조회 완료: {len(sector_data)}개 (country={country})")

        return SectorResponse(success=True, data=sector_data, last_updated=datetime.now().isoformat())

    except Exception as e:
        logger.error(f"섹터 ETF 조회 실패: {e}")
        return SectorResponse(success=False, error=str(e))


@router.get("/economic/sectors/{symbol}/holdings", response_model=SectorHoldingsResponse)
async def get_sector_holdings_api(
    symbol: str, current_user: UserDB = Depends(get_current_user), db: Session = Depends(get_db)
):
    """
    섹터 ETF 보유 종목 조회 (인증 필요)

    특정 섹터 ETF의 상위 보유 종목을 조회합니다.

    Parameters:
    - symbol: 섹터 ETF 심볼
      - 미국: XLK, XLF, XLV 등
      - 한국: 091160.KS, 091170.KS 등 (KIS API 키 필수)

    Returns:
    - 성공 시: 상위 보유 종목 (심볼, 종목명, 비중, 현재가, 변화율)
    - 실패 시: 에러 메시지 (한국 섹터의 경우 requires_kis_key=True 포함)

    Notes:
    - 한국 섹터는 한국투자증권 API 키 필수
    - API 키가 없으면 키 입력 요구 (requires_kis_key=True)
    - Admin은 환경변수 키를 사용할 수 있음
    """
    try:
        logger.debug(f"섹터 보유 종목 조회 요청: {symbol}")

        # 한국 섹터인지 확인 (.KS 접미사)
        if symbol.endswith(".KS"):
            from app.services.sector.korea_sector_service import get_korea_sector_holdings

            kis_credentials = None
            user_repo = UserRepository(db)
            user_kis = user_repo.get_kis_credentials(current_user.id)

            if user_kis:
                logger.debug(f"   사용자 {current_user.username}의 KIS 인증정보 사용")
                kis_credentials = user_kis
            elif current_user.role == "admin":
                from app.config import settings

                if settings.kis_app_key and settings.kis_app_secret:
                    logger.debug("   Admin 사용자 - 환경변수 KIS 키 사용")
                    kis_credentials = (settings.kis_app_key, settings.kis_app_secret)
                else:
                    logger.debug("   KIS 키 없음 - pykrx fallback 사용")
            else:
                logger.debug("   KIS 인증정보 없음 - pykrx fallback 사용")

            result = await get_korea_sector_holdings(symbol, kis_credentials)
        else:
            result = await get_sector_holdings(symbol)

        if not result:
            return SectorHoldingsResponse(success=False, error=f"'{symbol}' 섹터의 보유 종목을 조회할 수 없습니다.")

        holdings = [SectorHolding(**h) for h in result["holdings"]]

        logger.debug(f"섹터 보유 종목 조회 완료: {symbol} ({len(holdings)}개)")

        return SectorHoldingsResponse(
            success=True,
            sector_symbol=result["sector_symbol"],
            sector_name=result["sector_name"],
            holdings=holdings,
            last_updated=datetime.now().isoformat(),
            note=result.get("note"),
            requires_kis_key=result.get("requires_kis_key", False),
        )

    except Exception as e:
        logger.error(f"섹터 보유 종목 조회 실패 ({symbol}): {e}")
        return SectorHoldingsResponse(success=False, error=str(e))
