"""
시장 사이클 라우터
- GET /economic/market-cycle
- GET /economic/market-cycle/analysis
"""

import logging
from typing import Literal

from fastapi import APIRouter, Query

from app.models.economic import KrMarketCycleResponse, MarketCycleResponse

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/economic/market-cycle")
async def get_market_cycle(
    country: Literal["us", "kr"] = Query(default="us", description="조회할 국가 (us: 미국, kr: 한국)"),
):
    """
    시장 사이클 (경기 계절) 조회

    **미국 (country=us)**:
    - INDPRO, CPI, VIX/금리차 기반으로 시장을 4계절로 분류
    - 봄 (회복기): INDPRO 상승, 저물가
    - 여름 (활황기): INDPRO 1.5%+, 양호한 물가
    - 가을 (후퇴기): INDPRO 하락, 고물가
    - 겨울 (침체기): INDPRO 마이너스, 디플레

    **한국 (country=kr)**:
    - 수출, CPI, 신용 스프레드 기반으로 시장을 4계절로 분류
    - 봄 (회복기): 수출 0~10% 상승, 저물가
    - 여름 (활황기): 수출 10%+, 양호한 물가
    - 가을 (후퇴기): 수출 하락세, 고물가
    - 겨울 (침체기): 수출 역성장, 고위험

    Parameters:
    - country: 조회할 국가 (기본값: us)

    Returns:
    - 성공 시: 시장 사이클 데이터 (계절, 지표, 신뢰도)
    - 실패 시: 에러 메시지
    """
    try:
        logger.debug(f"시장 사이클 조회 요청 (country={country})")

        if country == "us":
            from app.services.market.market_cycle_service import get_real_market_cycle

            cycle_data = get_real_market_cycle()
            logger.debug(f"미국 시장 사이클 조회 완료: {cycle_data.season}")
            return MarketCycleResponse(success=True, data=cycle_data)
        else:  # kr
            from app.services.market.kr_market_cycle_service import get_real_kr_market_cycle, get_sample_kr_market_cycle

            try:
                cycle_data = get_real_kr_market_cycle()
                logger.debug(f"한국 시장 사이클 조회 완료: {cycle_data.season}")
            except Exception as kr_error:
                logger.warning(f"한국 시장 사이클 실제 데이터 조회 실패, 샘플 데이터 반환: {kr_error}")
                cycle_data = get_sample_kr_market_cycle()
            return KrMarketCycleResponse(success=True, data=cycle_data)

    except Exception as e:
        logger.error(f"시장 사이클 조회 실패 (country={country}): {e}", exc_info=True)
        if country == "us":
            return MarketCycleResponse(success=False, error=str(e))
        else:
            return KrMarketCycleResponse(success=False, error=str(e))


@router.get("/economic/market-cycle/analysis")
async def get_market_cycle_with_ai(
    country: Literal["us", "kr"] = Query(default="us", description="조회할 국가 (us: 미국, kr: 한국)"),
):
    """
    시장 사이클 + AI 분석 조회 (Admin 전용)

    기본 시장 사이클 데이터에 Gemini AI 기반 멘토 코멘트 추가

    Parameters:
    - country: 조회할 국가 (기본값: us)

    Returns:
    - 성공 시: 시장 사이클 데이터 + AI 코멘트/추천
    - 실패 시: 에러 메시지

    Note:
    - Gemini API 키 필요 (환경 변수 GEMINI_API_KEY)
    - Admin 권한 필요 (향후 추가)
    """
    try:
        from app.config import settings

        logger.debug(f"시장 사이클 AI 분석 조회 요청 (country={country})")

        api_key = settings.gemini_api_key

        if country == "us":
            from app.services.market.market_cycle_service import generate_ai_comment, get_real_market_cycle

            cycle_data = get_real_market_cycle()

            if not api_key:
                logger.warning("GEMINI_API_KEY 없음 - AI 코멘트 생략")
                return MarketCycleResponse(success=True, data=cycle_data)

            try:
                ai_result = generate_ai_comment(cycle_data, api_key)
                cycle_data.ai_comment = ai_result["comment"]
                cycle_data.ai_recommendation = ai_result["recommendation"]
                cycle_data.ai_risk = ai_result.get("risk")
                logger.debug(f"AI 코멘트 생성 완료: {len(ai_result['comment'])}자")
            except Exception as ai_error:
                logger.error(f"AI 코멘트 생성 실패 (무시): {ai_error}")

            return MarketCycleResponse(success=True, data=cycle_data)

        else:  # kr
            from app.services.market.kr_market_cycle_service import (
                generate_kr_ai_comment,
                get_real_kr_market_cycle,
                get_sample_kr_market_cycle,
            )

            try:
                cycle_data = get_real_kr_market_cycle()
            except Exception as kr_error:
                logger.warning(f"한국 시장 사이클 실제 데이터 조회 실패, 샘플 데이터 반환: {kr_error}")
                cycle_data = get_sample_kr_market_cycle()

            if not api_key:
                logger.warning("GEMINI_API_KEY 없음 - AI 코멘트 생략")
                return KrMarketCycleResponse(success=True, data=cycle_data)

            try:
                ai_result = generate_kr_ai_comment(cycle_data, api_key)
                cycle_data.ai_comment = ai_result["comment"]
                cycle_data.ai_recommendation = ai_result["recommendation"]
                cycle_data.ai_risk = ai_result.get("risk")
                logger.debug(f"AI 코멘트 생성 완료: {len(ai_result['comment'])}자")
            except Exception as ai_error:
                logger.error(f"AI 코멘트 생성 실패 (무시): {ai_error}")

            return KrMarketCycleResponse(success=True, data=cycle_data)

    except Exception as e:
        logger.error(f"시장 사이클 AI 분석 조회 실패 (country={country}): {e}", exc_info=True)
        if country == "us":
            return MarketCycleResponse(success=False, error=str(e))
        else:
            return KrMarketCycleResponse(success=False, error=str(e))
