"""
지표별 상태 판단 서비스
각 경제 지표의 수치를 기반으로 시장 상태를 판단
"""
from typing import Optional, Tuple
from enum import Enum


class IndicatorStatus(str, Enum):
    """지표 상태"""
    GOOD = "good"       # 좋음/안정 (Green)
    CAUTION = "caution" # 주의/불안 (Yellow)
    DANGER = "danger"   # 위험/공포 (Red)
    NONE = "none"       # 측정 안 함


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
    }
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


# 지표별 판단 기준 설명
INDICATOR_CRITERIA = {
    "^VIX": "🟢 안정: < 20\n🟡 불안: 20 - 30\n🔴 공포: > 30",
    "^TNX": "🟢 좋음: < 3.5%\n🟡 주의: 3.5% - 4.5%\n🔴 위험: > 4.5%",
    "^IRX": "🟢 좋음: < 3.0%\n🟡 주의: 3.0% - 5.0%\n🔴 위험: > 5.0%",
    "CPIAUCSL": "🟢 좋음: 1.5% - 2.5%\n🟡 주의: 2.5% - 4.0%\n🔴 위험: > 4.0% 또는 < 0%",
    "M2SL": "🟢 좋음: 4% - 8%\n🟡 주의: 1% - 4%\n🔴 위험: < 0% (유동성 수축)",
    "CL=F": "🟢 좋음: $60 - $80\n🟡 주의: $80 - $95\n🔴 위험: > $95 또는 < $40",
    "GC=F": None,  # 측정 안 함
}


def get_indicator_status(symbol: str, value: Optional[float], yoy_change: Optional[float] = None) -> Tuple[IndicatorStatus, str, Optional[str]]:
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
    
    # 알 수 없는 지표
    return IndicatorStatus.NONE, "-", None
