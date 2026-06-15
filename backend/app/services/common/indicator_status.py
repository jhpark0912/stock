"""
지표별 상태 판단 서비스
각 경제 지표의 수치를 기반으로 시장 상태를 판단
"""

from enum import Enum
from typing import Optional, Tuple


class IndicatorStatus(str, Enum):
    """지표 상태"""

    GOOD = "good"  # 좋음/안정 (Green)
    CAUTION = "caution"  # 주의/불안 (Yellow)
    DANGER = "danger"  # 위험/공포 (Red)
    NONE = "none"  # 측정 안 함


# 상태별 한글 라벨
STATUS_LABELS = {
    # 일반 경제 지표용 (좋음/주의/위험)
    "economic": {
        IndicatorStatus.GOOD: "좋음",
        IndicatorStatus.CAUTION: "주의",
        IndicatorStatus.DANGER: "위험",
        IndicatorStatus.NONE: "-",
    },
    # 공포 지표용 (안정/불안/공포)
    "fear": {
        IndicatorStatus.GOOD: "안정",
        IndicatorStatus.CAUTION: "불안",
        IndicatorStatus.DANGER: "공포",
        IndicatorStatus.NONE: "-",
    },
}


def get_vix_status(value: float) -> Tuple[IndicatorStatus, str]:
    """
    VIX (변동성 지수) 상태 판단
    - 안정: < 20
    - 불안: 20 - 30
    - 공포: > 30
    """
    if value < 20:
        status = IndicatorStatus.GOOD
    elif value <= 30:
        status = IndicatorStatus.CAUTION
    else:
        status = IndicatorStatus.DANGER

    return status, STATUS_LABELS["fear"][status]


def get_treasury_10y_status(value: float) -> Tuple[IndicatorStatus, str]:
    """
    미국채 10년물 금리 (^TNX) 상태 판단
    - 좋음: < 3.5%
    - 주의: 3.5% - 4.5%
    - 위험: > 4.5%
    """
    if value < 3.5:
        status = IndicatorStatus.GOOD
    elif value <= 4.5:
        status = IndicatorStatus.CAUTION
    else:
        status = IndicatorStatus.DANGER

    return status, STATUS_LABELS["economic"][status]


def get_treasury_3m_status(value: float) -> Tuple[IndicatorStatus, str]:
    """
    기준금리 / 3개월 T-Bill (^IRX) 상태 판단
    - 좋음: < 3.0%
    - 주의: 3.0% - 5.0%
    - 위험: > 5.0%
    """
    if value < 3.0:
        status = IndicatorStatus.GOOD
    elif value <= 5.0:
        status = IndicatorStatus.CAUTION
    else:
        status = IndicatorStatus.DANGER

    return status, STATUS_LABELS["economic"][status]


def get_cpi_status(yoy_change: float) -> Tuple[IndicatorStatus, str]:
    """
    CPI (소비자물가지수) YoY 변화율 상태 판단
    - 좋음: 1.5% - 2.5%
    - 주의: 2.5% - 4.0% (또는 0% - 1.5%)
    - 위험: > 4.0% 또는 < 0%
    """
    if yoy_change < 0:
        status = IndicatorStatus.DANGER  # 디플레이션
    elif yoy_change > 4.0:
        status = IndicatorStatus.DANGER  # 고인플레이션
    elif 1.5 <= yoy_change <= 2.5:
        status = IndicatorStatus.GOOD
    else:
        status = IndicatorStatus.CAUTION

    return status, STATUS_LABELS["economic"][status]


def get_m2_status(yoy_change: float) -> Tuple[IndicatorStatus, str]:
    """
    M2 통화량 YoY 변화율 상태 판단
    - 좋음: 4% - 8%
    - 주의: 1% - 4% (또는 8% - 12%)
    - 위험: < 0% (유동성 수축) 또는 > 12%
    """
    if yoy_change < 0:
        status = IndicatorStatus.DANGER  # 유동성 수축
    elif yoy_change > 12:
        status = IndicatorStatus.DANGER  # 과잉 유동성
    elif 4 <= yoy_change <= 8:
        status = IndicatorStatus.GOOD
    elif 1 <= yoy_change < 4 or 8 < yoy_change <= 12:
        status = IndicatorStatus.CAUTION
    else:
        status = IndicatorStatus.CAUTION

    return status, STATUS_LABELS["economic"][status]


def get_wti_status(value: float) -> Tuple[IndicatorStatus, str]:
    """
    WTI 원유 가격 상태 판단
    - 좋음: $60 - $80
    - 주의: $80 - $95 (또는 $40 - $60)
    - 위험: > $95 또는 < $40
    """
    if value < 40:
        status = IndicatorStatus.DANGER  # 수요 급감
    elif value > 95:
        status = IndicatorStatus.DANGER  # 인플레이션 압력
    elif 60 <= value <= 80:
        status = IndicatorStatus.GOOD
    else:
        status = IndicatorStatus.CAUTION

    return status, STATUS_LABELS["economic"][status]


# ============================================
# 한국 경제 지표 상태 판단 함수
# ============================================


def get_kr_bond_10y_status(value: float) -> Tuple[IndicatorStatus, str]:
    """
    한국 국고채 10년물 금리 상태 판단
    - 좋음: < 3.0%
    - 주의: 3.0% - 4.0%
    - 위험: > 4.0%
    """
    if value < 3.0:
        status = IndicatorStatus.GOOD
    elif value <= 4.0:
        status = IndicatorStatus.CAUTION
    else:
        status = IndicatorStatus.DANGER

    return status, STATUS_LABELS["economic"][status]


def get_kr_base_rate_status(value: float) -> Tuple[IndicatorStatus, str]:
    """
    한국은행 기준금리 상태 판단
    - 좋음: < 2.5%
    - 주의: 2.5% - 3.5%
    - 위험: > 3.5%
    """
    if value < 2.5:
        status = IndicatorStatus.GOOD
    elif value <= 3.5:
        status = IndicatorStatus.CAUTION
    else:
        status = IndicatorStatus.DANGER

    return status, STATUS_LABELS["economic"][status]


def get_kr_credit_spread_status(value: float) -> Tuple[IndicatorStatus, str]:
    """
    한국 신용 스프레드 (회사채-국고채 금리 차이) 상태 판단
    - 안정: < 0.5%p (50bp)
    - 주의: 0.5% - 1.0%p (50-100bp)
    - 위험: > 1.0%p (100bp)

    신용 스프레드는 시장 불안도를 측정하는 지표
    스프레드 확대 = 시장 불안 증가
    """
    if value < 0.5:
        status = IndicatorStatus.GOOD
    elif value <= 1.0:
        status = IndicatorStatus.CAUTION
    else:
        status = IndicatorStatus.DANGER

    return status, STATUS_LABELS["fear"][status]  # 불안도 지표이므로 "fear" 라벨 사용


def get_kr_cpi_status(yoy_change: float) -> Tuple[IndicatorStatus, str]:
    """
    한국 CPI (소비자물가지수) YoY 변화율 상태 판단
    - 좋음: 1.5% - 2.5%
    - 주의: 2.5% - 4.0% (또는 0% - 1.5%)
    - 위험: > 4.0% 또는 < 0%
    """
    if yoy_change < 0:
        status = IndicatorStatus.DANGER  # 디플레이션
    elif yoy_change > 4.0:
        status = IndicatorStatus.DANGER  # 고인플레이션
    elif 1.5 <= yoy_change <= 2.5:
        status = IndicatorStatus.GOOD
    else:
        status = IndicatorStatus.CAUTION

    return status, STATUS_LABELS["economic"][status]


def get_usd_krw_status(value: float) -> Tuple[IndicatorStatus, str]:
    """
    원/달러 환율 상태 판단
    - 안정: 1200 - 1300
    - 주의: 1300 - 1400 (또는 1100 - 1200)
    - 위험: > 1400 또는 < 1100
    """
    if value < 1100:
        status = IndicatorStatus.DANGER  # 원화 초강세 (수출 위험)
    elif value > 1400:
        status = IndicatorStatus.DANGER  # 원화 약세 (수입 물가 상승)
    elif 1200 <= value <= 1300:
        status = IndicatorStatus.GOOD
    else:
        status = IndicatorStatus.CAUTION

    return status, STATUS_LABELS["economic"][status]


def get_kr_leading_index_status(value: float) -> Tuple[IndicatorStatus, str]:
    """
    선행지수 순환변동치 상태 판단
    - 확장: > 100
    - 보합: 99.5 ~ 100
    - 수축: < 99.5
    """
    if value > 100:
        status = IndicatorStatus.GOOD
    elif value >= 99.5:
        status = IndicatorStatus.CAUTION
    else:
        status = IndicatorStatus.DANGER

    return status, STATUS_LABELS["economic"][status]


def get_kr_ccsi_status(value: float) -> Tuple[IndicatorStatus, str]:
    """
    소비자심리지수(CCSI) 상태 판단
    - 낙관: > 100
    - 보통: 90 ~ 100
    - 비관: < 90
    """
    if value > 100:
        status = IndicatorStatus.GOOD
    elif value >= 90:
        status = IndicatorStatus.CAUTION
    else:
        status = IndicatorStatus.DANGER

    return status, STATUS_LABELS["economic"][status]


def get_kr_export_status(yoy_change: float) -> Tuple[IndicatorStatus, str]:
    """
    월간 수출액(BOP) YoY 상태 판단
    - 호조: YoY > 5%
    - 보합: -5% ~ 5%
    - 부진: < -5%
    """
    if yoy_change > 5:
        status = IndicatorStatus.GOOD
    elif yoy_change >= -5:
        status = IndicatorStatus.CAUTION
    else:
        status = IndicatorStatus.DANGER

    return status, STATUS_LABELS["economic"][status]


def get_philly_fed_spread_status(value: float) -> Tuple[IndicatorStatus, str]:
    """
    필라델피아 연준 스프레드 (신규주문 - 재고) 상태 판단
    - 확장: > 10
    - 보합: 0 ~ 10
    - 수축: < 0
    """
    if value > 10:
        status = IndicatorStatus.GOOD
    elif value >= 0:
        status = IndicatorStatus.CAUTION
    else:
        status = IndicatorStatus.DANGER

    return status, STATUS_LABELS["economic"][status]


def get_cfnai_status(value: float) -> Tuple[IndicatorStatus, str]:
    """
    CFNAI 3개월 이동평균 상태 판단
    - 확장: > 0
    - 둔화: -0.7 ~ 0
    - 침체: < -0.7
    """
    if value > 0:
        status = IndicatorStatus.GOOD
    elif value >= -0.7:
        status = IndicatorStatus.CAUTION
    else:
        status = IndicatorStatus.DANGER

    return status, STATUS_LABELS["economic"][status]


def get_umcsent_status(value: float) -> Tuple[IndicatorStatus, str]:
    """
    미시간대 소비자심리지수 상태 판단
    - 낙관: > 80
    - 보통: 60 ~ 80
    - 비관: < 60
    """
    if value > 80:
        status = IndicatorStatus.GOOD
    elif value >= 60:
        status = IndicatorStatus.CAUTION
    else:
        status = IndicatorStatus.DANGER

    return status, STATUS_LABELS["economic"][status]


# 지표별 판단 기준 설명
INDICATOR_CRITERIA = {
    # 미국 지표
    "^VIX": "🟢 안정: < 20\n🟡 불안: 20 - 30\n🔴 공포: > 30",
    "^TNX": "🟢 좋음: < 3.5%\n🟡 주의: 3.5% - 4.5%\n🔴 위험: > 4.5%",
    "^IRX": "🟢 좋음: < 3.0%\n🟡 주의: 3.0% - 5.0%\n🔴 위험: > 5.0%",
    "CPIAUCSL": "🟢 좋음: 1.5% - 2.5%\n🟡 주의: 2.5% - 4.0%\n🔴 위험: > 4.0% 또는 < 0%",
    "M2SL": "🟢 좋음: 4% - 8%\n🟡 주의: 1% - 4%\n🔴 위험: < 0% (유동성 수축)",
    "CL=F": "🟢 좋음: $60 - $80\n🟡 주의: $80 - $95\n🔴 위험: > $95 또는 < $40",
    "GC=F": None,  # 측정 안 함
    "PHILLY_FED_SPREAD": "🟢 확장: > 10\n🟡 보합: 0 ~ 10\n🔴 수축: < 0",
    "CFNAIMA3": "🟢 확장: > 0\n🟡 둔화: -0.7 ~ 0\n🔴 침체: < -0.7",
    "UMCSENT": "🟢 낙관: > 80\n🟡 보통: 60 ~ 80\n🔴 비관: < 60",
    # 한국 지표
    "KR_BOND_10Y": "🟢 좋음: < 3.0%\n🟡 주의: 3.0% - 4.0%\n🔴 위험: > 4.0%",
    "KR_BASE_RATE": "🟢 좋음: < 2.5%\n🟡 주의: 2.5% - 3.5%\n🔴 위험: > 3.5%",
    "KR_CREDIT_SPREAD": "🟢 안정: < 0.5%p\n🟡 주의: 0.5% - 1.0%p\n🔴 위험: > 1.0%p",
    "KR_CPI": "🟢 좋음: 1.5% - 2.5%\n🟡 주의: 2.5% - 4.0%\n🔴 위험: > 4.0% 또는 < 0%",
    "KR_M2": "🟢 좋음: 4% - 8%\n🟡 주의: 1% - 4%\n🔴 위험: < 0% (유동성 수축)",
    "KR_LEADING_INDEX": "🟢 확장: > 100\n🟡 보합: 99.5 ~ 100\n🔴 수축: < 99.5",
    "KR_CCSI": "🟢 낙관: > 100\n🟡 보통: 90 ~ 100\n🔴 비관: < 90",
    "KR_EXPORT": "🟢 호조: YoY > 5%\n🟡 보합: -5% ~ 5%\n🔴 부진: < -5%",
    "KRW=X": "🟢 안정: 1200 - 1300원\n🟡 주의: 1300 - 1400원\n🔴 위험: > 1400원",
}


def get_indicator_status(
    symbol: str, value: Optional[float], yoy_change: Optional[float] = None
) -> Tuple[IndicatorStatus, str, Optional[str]]:
    """
    지표 심볼에 따라 적절한 상태 판단 함수 호출

    Args:
        symbol: 지표 심볼 (^TNX, ^IRX, ^VIX, CL=F, GC=F, CPIAUCSL, M2SL)
        value: 현재 값
        yoy_change: YoY 변화율 (FRED 데이터용)

    Returns:
        (status, label, criteria) 튜플
    """
    criteria = INDICATOR_CRITERIA.get(symbol)

    if value is None:
        return IndicatorStatus.NONE, "-", criteria

    # Yahoo Finance 지표
    if symbol == "^VIX":
        status, label = get_vix_status(value)
        return status, label, criteria
    elif symbol == "^TNX":
        status, label = get_treasury_10y_status(value)
        return status, label, criteria
    elif symbol == "^IRX":
        status, label = get_treasury_3m_status(value)
        return status, label, criteria
    elif symbol == "CL=F":
        status, label = get_wti_status(value)
        return status, label, criteria
    elif symbol == "GC=F":
        # 금은 측정하지 않음
        return IndicatorStatus.NONE, "-", None

    # FRED 지표 (YoY 변화율 사용)
    elif symbol == "CPIAUCSL":
        if yoy_change is not None:
            status, label = get_cpi_status(yoy_change)
            return status, label, criteria
        return IndicatorStatus.NONE, "-", criteria
    elif symbol == "M2SL":
        if yoy_change is not None:
            status, label = get_m2_status(yoy_change)
            return status, label, criteria
        return IndicatorStatus.NONE, "-", criteria
    elif symbol == "PHILLY_FED_SPREAD":
        status, label = get_philly_fed_spread_status(value)
        return status, label, criteria
    elif symbol == "CFNAIMA3":
        status, label = get_cfnai_status(value)
        return status, label, criteria
    elif symbol == "UMCSENT":
        status, label = get_umcsent_status(value)
        return status, label, criteria

    # 한국 지표
    elif symbol == "KR_BOND_10Y":
        status, label = get_kr_bond_10y_status(value)
        return status, label, criteria
    elif symbol == "KR_BASE_RATE":
        status, label = get_kr_base_rate_status(value)
        return status, label, criteria
    elif symbol == "KR_CREDIT_SPREAD":
        status, label = get_kr_credit_spread_status(value)
        return status, label, criteria
    elif symbol == "KR_CPI":
        if yoy_change is not None:
            status, label = get_kr_cpi_status(yoy_change)
            return status, label, criteria
        return IndicatorStatus.NONE, "-", criteria
    elif symbol == "KR_M2":
        if yoy_change is not None:
            status, label = get_m2_status(yoy_change)  # 미국과 동일한 기준 사용
            return status, label, criteria
        return IndicatorStatus.NONE, "-", criteria
    elif symbol == "KR_LEADING_INDEX":
        status, label = get_kr_leading_index_status(value)
        return status, label, criteria
    elif symbol == "KR_CCSI":
        status, label = get_kr_ccsi_status(value)
        return status, label, criteria
    elif symbol == "KR_EXPORT":
        if yoy_change is not None:
            status, label = get_kr_export_status(yoy_change)
            return status, label, criteria
        return IndicatorStatus.NONE, "-", criteria
    elif symbol == "KRW=X":
        status, label = get_usd_krw_status(value)
        return status, label, criteria

    # 알 수 없는 지표
    return IndicatorStatus.NONE, "-", None
