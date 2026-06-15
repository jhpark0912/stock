"""
증시 마감 리뷰 라우터
- GET /economic/market-review/{country}
- POST /economic/market-review/{country}/ai
"""

import logging
from typing import Literal, Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database.models import UserDB
from app.database.user_repository import UserRepository
from app.services.auth.auth_service import get_current_user, get_current_user_optional

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/economic/market-review/{country}")
async def get_market_review_api(
    country: Literal["us", "kr"] = "kr",
    current_user: Optional[UserDB] = Depends(get_current_user_optional),
    db: Session = Depends(get_db),
):
    """
    증시 마감 리뷰 조회

    **한국 (country=kr)**:
    - 마감 시간: 15:30 KST
    - 지수: KOSPI, KOSDAQ
    - 급등/급락 종목 Top 5 (KIS API 사용 - 로그인 및 KIS 키 필요)
    - 섹터 등락률
    - 시총 Top 5 (KOSPI/KOSDAQ)

    **미국 (country=us)**:
    - 마감 시간: 16:00 EST
    - 지수: S&P 500, NASDAQ, DOW
    - 급등/급락 종목 Top 5
    - 섹터 등락률
    - 시총 Top 5

    Parameters:
    - country: 조회할 국가 (기본값: kr)

    Returns:
    - 성공 시: 마감 리뷰 데이터
    - 실패 시: 에러 메시지

    Notes:
    - 장 마감 후 데이터는 다음 거래일까지 캐시됩니다
    - 한국 급등/급락 종목은 로그인 후 사용자별 KIS API 키 필요
    - KIS 키가 없으면 급등/급락 데이터는 빈 배열로 반환
    """
    from app.models.economic import MarketReviewResponse
    from app.services.market.market_review_service import get_market_review

    try:
        logger.debug(f"증시 마감 리뷰 조회 요청 (country={country})")

        kis_app_key = None
        kis_app_secret = None

        if country == "kr" and current_user:
            user_repo = UserRepository(db)
            kis_credentials = user_repo.get_kis_credentials(current_user.id)
            if kis_credentials:
                kis_app_key, kis_app_secret = kis_credentials
                logger.debug(f"사용자 KIS 자격 증명 사용 (user_id={current_user.id})")
            else:
                if current_user.role == "admin":
                    from app.config import settings

                    if settings.kis_app_key and settings.kis_app_secret:
                        kis_app_key = settings.kis_app_key
                        kis_app_secret = settings.kis_app_secret
                        logger.debug("Admin 사용자 - 환경변수 KIS 키 사용")
                    else:
                        logger.debug("환경변수에 KIS 키 없음")
                else:
                    logger.debug(f"사용자 KIS 자격 증명 없음 (user_id={current_user.id})")

        review_data = await get_market_review(country, kis_app_key=kis_app_key, kis_app_secret=kis_app_secret)

        logger.debug(f"증시 마감 리뷰 조회 완료 (country={country})")

        return MarketReviewResponse(
            success=True,
            data=review_data,
        )

    except Exception as e:
        logger.error(f"증시 마감 리뷰 조회 실패 (country={country}): {e}", exc_info=True)
        return MarketReviewResponse(
            success=False,
            error=str(e),
        )


@router.post("/economic/market-review/{country}/ai")
async def generate_market_review_ai_api(
    country: Literal["us", "kr"] = "kr",
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    AI 마감 리뷰 분석 생성

    Gemini AI를 사용하여 오늘의 시장을 분석합니다.

    Parameters:
    - country: 분석할 국가 (기본값: kr)

    Returns:
    - 성공 시: AI 분석 결과 (오늘의 포인트, 섹터 인사이트, 내일 전망)
    - 실패 시: 에러 메시지

    Notes:
    - 로그인 필요
    - Gemini API 키 필요 (사용자 API 키 또는 환경변수)
    """
    from app.config import settings
    from app.models.economic import MarketReviewAIResponse
    from app.services.market.market_review_service import generate_market_review_ai, get_market_review

    try:
        logger.debug(f"AI 마감 리뷰 분석 요청 (country={country}, user={current_user.username})")

        user_repo = UserRepository(db)
        api_key = user_repo.get_gemini_key(current_user.id)

        if not api_key:
            if current_user.role == "admin" and settings.gemini_api_key:
                api_key = settings.gemini_api_key
            else:
                return MarketReviewAIResponse(
                    success=False,
                    error="AI 분석을 위해 Gemini API 키가 필요합니다.",
                )

        review_data = await get_market_review(country)

        ai_result = await generate_market_review_ai(review_data, api_key)

        logger.debug(f"AI 마감 리뷰 분석 완료 (country={country})")

        return MarketReviewAIResponse(
            success=True,
            data=ai_result,
        )

    except Exception as e:
        logger.error(f"AI 마감 리뷰 분석 실패 (country={country}): {e}", exc_info=True)
        return MarketReviewAIResponse(
            success=False,
            error=str(e),
        )
