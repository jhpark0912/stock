"""
경제 지표 조회 라우터
- GET /economic
- GET /economic/status
"""

import logging
import time
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from typing import Literal

from fastapi import APIRouter, Query

from app.models.economic import (
    AllEconomicData,
    AllEconomicResponse,
    EconomicData,
    EconomicResponse,
    KoreaEconomicData,
    KoreaEconomicResponse,
    KoreaFxData,
    KoreaMacroData,
    KoreaRatesData,
)
from app.services.economic.economic_service import get_all_yahoo_indicators_parallel
from app.services.economic.fred_service import check_fred_availability, get_macro_data_parallel
from app.services.economic.korea_economic_service import check_ecos_availability, get_all_korea_indicators

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/economic")
async def get_economic_indicators(
    country: Literal["us", "kr", "all"] = Query(
        default="us", description="조회할 국가 (us: 미국, kr: 한국, all: 전체)"
    ),
    include_history: bool = Query(default=False, description="30일 히스토리 데이터 포함 여부"),
):
    """
    경제 지표 조회

    **미국 (country=us)**:
    - 금리: 미국채 10년물, 3개월 T-Bill
    - 변동성: VIX
    - 거시경제: CPI, M2 (FRED API 필요)
    - 원자재: WTI 원유, 금

    **한국 (country=kr)**:
    - 금리: 국고채 10년물, 한국은행 기준금리
    - 변동성: VKOSPI
    - 거시경제: 소비자물가지수, M2 통화량 (ECOS API 필요)
    - 환율: 원/달러 환율

    **전체 (country=all)**:
    - 미국 + 한국 지표 통합 조회

    Parameters:
    - country: 조회할 국가 (기본값: us)
    - include_history: true 시 30일 히스토리 포함 (스파크라인용)

    Returns:
    - 성공 시: 해당 국가의 경제 지표 데이터
    - 실패 시: 에러 메시지
    """
    try:
        logger.debug(f"경제 지표 조회 요청 (country={country}, include_history={include_history})")

        if country == "us":
            return await _get_us_indicators(include_history)
        elif country == "kr":
            return await _get_kr_indicators(include_history)
        else:
            return await _get_all_indicators(include_history)

    except Exception as e:
        logger.error(f"경제 지표 조회 실패: {e}")
        return {"success": False, "error": str(e)}


async def _get_us_indicators(include_history: bool) -> EconomicResponse:
    """미국 경제 지표 조회"""
    start_time = time.time()

    # Yahoo + FRED 병렬 조회
    with ThreadPoolExecutor(max_workers=2) as executor:
        yahoo_future = executor.submit(get_all_yahoo_indicators_parallel, include_history)
        fred_future = executor.submit(get_macro_data_parallel, include_history)

        yahoo_data = yahoo_future.result()
        macro_data = fred_future.result()

    elapsed = time.time() - start_time
    logger.debug(f"미국 경제 지표 조회 완료: {elapsed:.2f}초")

    economic_data = EconomicData(
        rates=yahoo_data["rates"],
        macro=macro_data,
        commodities=yahoo_data["commodities"],
        last_updated=datetime.now().isoformat(),
    )

    total_indicators = sum(
        [
            1
            for ind in [
                economic_data.rates.treasury_10y,
                economic_data.rates.treasury_3m,
                economic_data.rates.vix,
                economic_data.macro.cpi,
                economic_data.macro.m2,
                economic_data.commodities.wti_oil,
                economic_data.commodities.gold,
            ]
            if ind
        ]
    )

    logger.debug(f"미국 경제 지표 조회 완료: {total_indicators}개 지표")

    return EconomicResponse(success=True, data=economic_data)


async def _get_kr_indicators(include_history: bool) -> KoreaEconomicResponse:
    """한국 경제 지표 조회"""
    start_time = time.time()

    kr_data = get_all_korea_indicators(include_history)

    elapsed = time.time() - start_time
    logger.debug(f"한국 경제 지표 조회 완료: {elapsed:.2f}초")

    korea_data = KoreaEconomicData(
        rates=KoreaRatesData(
            bond_10y=kr_data["rates"]["bond_10y"],
            base_rate=kr_data["rates"]["base_rate"],
            credit_spread=kr_data["rates"]["credit_spread"],
        ),
        macro=KoreaMacroData(
            leading_index=kr_data["macro"]["leading_index"],
            ccsi=kr_data["macro"]["ccsi"],
            export=kr_data["macro"]["export"],
        ),
        fx=KoreaFxData(usd_krw=kr_data["fx"]["usd_krw"]),
        last_updated=datetime.now().isoformat(),
    )

    total_indicators = sum(
        [
            1
            for ind in [
                korea_data.rates.bond_10y,
                korea_data.rates.base_rate,
                korea_data.rates.credit_spread,
                korea_data.macro.leading_index,
                korea_data.macro.ccsi,
                korea_data.macro.export,
                korea_data.fx.usd_krw,
            ]
            if ind
        ]
    )

    logger.debug(f"한국 경제 지표 조회 완료: {total_indicators}개 지표")

    return KoreaEconomicResponse(success=True, data=korea_data)


async def _get_all_indicators(include_history: bool) -> AllEconomicResponse:
    """미국 + 한국 경제 지표 통합 조회"""
    start_time = time.time()

    with ThreadPoolExecutor(max_workers=3) as executor:
        yahoo_future = executor.submit(get_all_yahoo_indicators_parallel, include_history)
        fred_future = executor.submit(get_macro_data_parallel, include_history)
        korea_future = executor.submit(get_all_korea_indicators, include_history)

        yahoo_data = yahoo_future.result()
        macro_data = fred_future.result()
        kr_data = korea_future.result()

    elapsed = time.time() - start_time
    logger.debug(f"전체 경제 지표 조회 완료: {elapsed:.2f}초")

    us_data = EconomicData(
        rates=yahoo_data["rates"],
        macro=macro_data,
        commodities=yahoo_data["commodities"],
        last_updated=datetime.now().isoformat(),
    )

    kr_economic_data = KoreaEconomicData(
        rates=KoreaRatesData(
            bond_10y=kr_data["rates"]["bond_10y"],
            base_rate=kr_data["rates"]["base_rate"],
            credit_spread=kr_data["rates"]["credit_spread"],
        ),
        macro=KoreaMacroData(
            leading_index=kr_data["macro"]["leading_index"],
            ccsi=kr_data["macro"]["ccsi"],
            export=kr_data["macro"]["export"],
        ),
        fx=KoreaFxData(usd_krw=kr_data["fx"]["usd_krw"]),
        last_updated=datetime.now().isoformat(),
    )

    all_data = AllEconomicData(us=us_data, kr=kr_economic_data)

    return AllEconomicResponse(success=True, data=all_data)


@router.get("/economic/status")
async def get_economic_status():
    """
    경제 지표 서비스 상태 확인

    Returns:
    - FRED API 상태 (미국 거시경제)
    - Yahoo Finance 상태
    - ECOS API 상태 (한국 경제지표)
    """
    from app.services.economic.economic_service import YAHOOQUERY_AVAILABLE

    fred_status = check_fred_availability()
    ecos_status = check_ecos_availability()

    return {"yahoo": {"available": YAHOOQUERY_AVAILABLE}, "fred": fred_status, "ecos": ecos_status}
