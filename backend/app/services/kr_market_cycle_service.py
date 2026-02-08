"""
한국 시장 사이클 (K-Macro) 판단 서비스

수출, CPI, 신용 스프레드 기반으로 한국 시장을 4계절로 분류:
- 봄 (회복기): 수출 0~10% 상승, 저물가
- 여름 (활황기): 수출 10%+, 양호한 물가
- 가을 (후퇴기): 수출 하락세, 고물가
- 겨울 (침체기): 수출 역성장, 고위험
"""

import logging
import json
from typing import Optional, Dict, Any, List
from datetime import datetime

import google.generativeai as genai

from app.models.economic import KrMarketCycleData, KrMarketCycleIndicator

logger = logging.getLogger(__name__)


# ============================================
# 상수
# ============================================

KR_SEASONS = {
    'spring': {'name': '봄 (회복기)', 'emoji': '🌸'},
    'summer': {'name': '여름 (활황기)', 'emoji': '☀️'},
    'autumn': {'name': '가을 (후퇴기)', 'emoji': '🍂'},
    'winter': {'name': '겨울 (침체기)', 'emoji': '❄️'},
}

# 한국 특화 섹터
KR_SECTOR_RECOMMENDATIONS = {
    'spring': ['반도체', '2차전지', 'IT 서비스'],
    'summer': ['자동차', '조선', '철강', '화학'],
    'autumn': ['유틸리티', '통신', '필수소비재'],
    'winter': ['국채', '현금', '방어주', '헬스케어'],
}


# ============================================
# 헬퍼 함수
# ============================================

def calculate_momentum(history: Optional[list]) -> str:
    """
    모멘텀 계산 (최근 3개월 MoM 변화율의 기울기)

    Args:
        history: 히스토리 데이터 (최소 4개월 필요)

    Returns:
        "상승 추세", "하락 추세", "안정"
    """
    if not history or len(history) < 4:
        return "안정"

    try:
        # 최근 4개월 데이터 (MoM 계산용)
        recent_4 = [h.value for h in history[-4:]]

        # MoM 변화율 계산 (3개)
        mom_changes = [
            ((recent_4[i] - recent_4[i-1]) / recent_4[i-1]) * 100
            for i in range(1, 4)
        ]

        # 평균 기울기 계산
        avg_slope = sum(mom_changes) / len(mom_changes)

        if avg_slope > 0.5:  # 월평균 0.5% 이상 증가
            return "상승 추세"
        elif avg_slope < -0.5:  # 월평균 0.5% 이상 감소
            return "하락 추세"
        else:
            return "안정"

    except Exception as e:
        logger.warning(f"모멘텀 계산 실패: {e}")
        return "안정"


def get_transition_signal(season: str, score: float, confidence: int) -> str:
    """
    다음 계절로의 전환 가능성 판단 (피크 아웃 감지 포함)

    Args:
        season: 현재 계절 (spring, summer, autumn, winter)
        score: 가중치 점수
        confidence: 신뢰도 (0-100)

    Returns:
        전환 신호 문자열
    """
    # 피크 아웃 구간 감지 (여름 끝자락 → 가을 전환)
    if 70 <= score <= 80:
        if season == 'summer':
            return "⚠️ 피크 아웃 구간 - 과열 경계, 수익 실현 고려 시점"
        elif season == 'autumn':
            return "⚠️ 고점 통과 - 방어적 포지셔닝 필요"

    # 일반 전환 신호
    if confidence < 60:
        return "경계 구간 - 다음 계절로 전환 가능성 높음"
    elif confidence < 75:
        if season == 'spring':
            return "여름(활황기)로 전환 가능성 있음"
        elif season == 'summer':
            return "가을(후퇴기)로 전환 가능성 있음"
        elif season == 'autumn':
            return "겨울(침체기)로 전환 가능성 있음"
        elif season == 'winter':
            return "봄(회복기)로 전환 가능성 있음"

    return "안정적 유지"


def judge_kr_season(
    export_yoy: float,
    export_trend: str,
    cpi_yoy: float,
    credit_spread: float
) -> tuple[str, float]:
    """
    한국 시장 사이클 판단 (K-사계절 기준)

    계절 범위:
    - 겨울 (0-25): 수출 역성장, 디플레/급변동, 높은 리스크
    - 봄 (25-50): 수출 0-10% 상승, 물가 2.0-2.5%, 안정적 스프레드
    - 여름 (50-75): 수출 10%+, 물가 2.5-3.0%, 낮은 리스크
    - 가을 (75-100): 수출 하락세, 고물가 3.0%+, 중간 리스크

    Args:
        export_yoy: 수출액 YoY 변화율 (%)
        export_trend: 수출 모멘텀 ("상승 추세", "하락 추세", "안정")
        cpi_yoy: CPI YoY 변화율 (%)
        credit_spread: 신용 스프레드 (basis points)

    Returns:
        (season, score): 계절과 점수
    """
    # ============================================
    # 1. 수출 판단 (가중치 50%)
    # ============================================
    if export_yoy < 0:
        # 역성장 → 겨울 (일관된 중심값)
        export_score = 12.5
    elif export_yoy < 10:
        # 0~10% → 봄 범위 (25-50)
        # 선형 보간으로 부드러운 전환
        base_score = 25 + (export_yoy / 10) * 25  # 0%=25, 10%=50

        if export_trend == "상승 추세":
            # 상승 추세: 기본 점수 유지
            export_score = base_score
        elif export_trend == "하락 추세":
            # 하락 추세: 겨울로 가중 (기본 점수의 50%)
            export_score = max(12.5, base_score * 0.5)
        else:  # 안정
            # 안정: 기본 점수의 80%
            export_score = base_score * 0.8
    else:
        # 10% 이상 → 여름 or 가을
        # 선형 보간: 10%=50, 20%=75
        if export_yoy < 20:
            base_score = 50 + ((export_yoy - 10) / 10) * 25
        else:
            base_score = 75  # 20% 이상은 75 고정

        if export_trend == "하락 추세":
            # 하락 추세: 가을로 이동 (75-100 범위)
            export_score = 75 + (base_score - 50) * 0.5
        else:
            # 상승/안정: 여름 유지 (50-75 범위)
            export_score = base_score

    # ============================================
    # 2. CPI 판단 (가중치 30%)
    # ============================================
    if cpi_yoy < 2.0:
        # 디플레 우려 → 겨울
        cpi_score = 12.5
    elif cpi_yoy <= 2.5:
        # 2.0~2.5% → 봄 범위 (25-50)
        # 선형 보간: 2.0에서 25, 2.5에서 50
        cpi_score = 25 + ((cpi_yoy - 2.0) / 0.5) * 25
    elif cpi_yoy <= 3.0:
        # 2.5~3.0% → 여름 범위 (50-75)
        # 선형 보간: 2.5에서 50, 3.0에서 75
        cpi_score = 50 + ((cpi_yoy - 2.5) / 0.5) * 25
    else:
        # 3.0% 초과 → 가을 범위 (75-100)
        cpi_score = 87.5

    # ============================================
    # 3. 신용 스프레드 판단 (가중치 20%)
    # ============================================
    if credit_spread > 80:
        # 높은 리스크 → 겨울
        spread_score = 12.5
    elif credit_spread > 60:
        # 60~80bp → 가을 범위 (75-100)
        # 선형 보간: 60에서 100, 80에서 75
        spread_score = 100 - ((credit_spread - 60) / 20) * 25
    elif credit_spread > 55:
        # 55~60bp → 봄 범위 (25-50)
        # 선형 보간: 55에서 50, 60에서 25
        spread_score = 50 - ((credit_spread - 55) / 5) * 25
    else:
        # ≤ 55bp → 여름 범위 (50-75)
        spread_score = 62.5

    # ============================================
    # 4. 최종 점수 계산 (가중 평균)
    # ============================================
    score = (export_score * 0.5) + (cpi_score * 0.3) + (spread_score * 0.2)

    # ============================================
    # 5. 계절 판단
    # ============================================
    if score < 25:
        season = 'winter'
    elif score < 50:
        season = 'spring'
    elif score < 75:
        season = 'summer'
    else:
        season = 'autumn'

    return season, score


def calculate_kr_confidence(
    season: str,
    score: float,
    export_trend: str,
    cpi_yoy: float,
    credit_spread: float
) -> int:
    """
    신뢰도 계산 (0-100)

    Args:
        season: 판정된 계절
        score: 가중치 점수
        export_trend: 수출 모멘텀
        cpi_yoy: CPI YoY
        credit_spread: 신용 스프레드

    Returns:
        신뢰도 (0-100)
    """
    # 계절별 중심 점수
    season_centers = {
        'winter': 12.5,
        'spring': 37.5,
        'summer': 62.5,
        'autumn': 87.5,
    }

    # 점수가 중심에서 멀수록 신뢰도 감소
    center = season_centers[season]
    distance = abs(score - center)
    confidence = max(0, 100 - (distance * 4))

    # 추세 일관성 보정
    if season == 'spring' and export_trend != "상승 추세":
        confidence -= 10
    elif season == 'autumn' and export_trend != "하락 추세":
        confidence -= 10

    # CPI 범위 보정
    if season == 'summer' and (cpi_yoy < 2 or cpi_yoy > 3):
        confidence -= 15

    # 신용 스프레드 범위 보정
    if season == 'summer' and credit_spread > 60:
        confidence -= 10
    elif season == 'winter' and credit_spread < 60:
        confidence -= 10

    return max(0, min(100, int(confidence)))


def generate_kr_reasoning(
    season: str,
    export_yoy: float,
    export_trend: str,
    cpi_yoy: float,
    credit_spread: float
) -> str:
    """
    한국 시장 사이클 판단 근거 생성

    Args:
        season: 판정된 계절
        export_yoy: 수출 YoY 변화율
        export_trend: 수출 추세
        cpi_yoy: CPI YoY
        credit_spread: 신용 스프레드

    Returns:
        판단 근거 문자열
    """
    # 지표별 상태 설명
    export_desc = ""
    if export_yoy >= 10:
        export_desc = f"수출 강세(YoY {export_yoy:+.1f}%)"
    elif export_yoy >= 5:
        export_desc = f"수출 확장(YoY {export_yoy:+.1f}%)"
    elif export_yoy >= 0:
        export_desc = f"수출 회복(YoY {export_yoy:+.1f}%)"
    else:
        export_desc = f"수출 역성장(YoY {export_yoy:+.1f}%)"

    cpi_desc = ""
    if cpi_yoy > 3:
        cpi_desc = "높은 물가"
    elif cpi_yoy >= 2:
        cpi_desc = "양호한 물가"
    else:
        cpi_desc = "낮은 물가"

    spread_desc = ""
    if credit_spread > 80:
        spread_desc = "높은 시장 리스크"
    elif credit_spread > 60:
        spread_desc = "중간 시장 리스크"
    else:
        spread_desc = "낮은 시장 리스크"

    # 계절별 설명
    season_names = {
        'spring': '봄(회복기)',
        'summer': '여름(활황기)',
        'autumn': '가을(후퇴기)',
        'winter': '겨울(침체기)'
    }

    reasoning = f"{export_desc}, {cpi_desc}(CPI {cpi_yoy:.1f}%), {spread_desc}(스프레드 {credit_spread:.0f}bp)로 {season_names[season]}로 판단됩니다."

    return reasoning


# ============================================
# 메인 함수
# ============================================

def analyze_kr_market_cycle(
    export_yoy: float,
    export_trend: str,
    cpi_yoy: float,
    cpi_prev_month: float,
    credit_spread: float
) -> KrMarketCycleData:
    """
    한국 시장 사이클 분석 (수출 기반)

    Args:
        export_yoy: 수출액 YoY 변화율 (%)
        export_trend: 수출 모멘텀 ("상승 추세", "하락 추세", "안정")
        cpi_yoy: 현재 CPI YoY (%)
        cpi_prev_month: 전월 CPI YoY (%)
        credit_spread: 신용 스프레드 (basis points)

    Returns:
        KrMarketCycleData 객체

    Raises:
        ValueError: 입력 데이터 오류
    """
    try:
        # 입력 검증
        if cpi_yoy <= 0 or credit_spread < 0:
            raise ValueError("지표 값은 0 이상이어야 합니다")

        # 계절 판단
        season, score = judge_kr_season(
            export_yoy=export_yoy,
            export_trend=export_trend,
            cpi_yoy=cpi_yoy,
            credit_spread=credit_spread
        )

        # 신뢰도 계산
        confidence = calculate_kr_confidence(
            season=season,
            score=score,
            export_trend=export_trend,
            cpi_yoy=cpi_yoy,
            credit_spread=credit_spread
        )

        # 전환 신호
        transition_signal = get_transition_signal(season, score, confidence)

        # 판단 근거 생성
        reasoning = generate_kr_reasoning(
            season=season,
            export_yoy=export_yoy,
            export_trend=export_trend,
            cpi_yoy=cpi_yoy,
            credit_spread=credit_spread
        )

        # CPI 전월 대비 변화
        cpi_mom = cpi_yoy - cpi_prev_month
        cpi_mom_str = f"{cpi_mom:+.1f}" if cpi_mom != 0 else "0.0"

        # 신용 스프레드 추세 판단
        spread_trend = ""
        if credit_spread <= 60:
            spread_trend = "낮은 리스크"
        elif credit_spread <= 80:
            spread_trend = "중간 리스크"
        else:
            spread_trend = "높은 리스크"

        # 한국 특화 섹터
        sectors = KR_SECTOR_RECOMMENDATIONS.get(season, [])

        # KrMarketCycleData 생성
        cycle_data = KrMarketCycleData(
            season=season,
            season_name=KR_SEASONS[season]['name'],
            season_emoji=KR_SEASONS[season]['emoji'],
            confidence=confidence,
            score=score,
            transition_signal=transition_signal,
            reasoning=reasoning,
            export=KrMarketCycleIndicator(
                value=export_yoy,
                trend=export_trend,
                label="수출액 (YoY)"
            ),
            cpi=KrMarketCycleIndicator(
                value=cpi_yoy,
                trend="안정",  # CPI는 추세 계산 안 함
                label="CPI (YoY)",
                mom_change=cpi_mom_str
            ),
            credit_spread=KrMarketCycleIndicator(
                value=credit_spread,
                trend=spread_trend,
                label="신용 스프레드 (bp)"
            ),
            sectors=sectors
        )

        logger.debug(f"한국 시장 사이클 분석 완료: {season} (신뢰도: {confidence}%)")
        return cycle_data

    except Exception as e:
        logger.error(f"한국 시장 사이클 분석 오류: {e}", exc_info=True)
        raise


# ============================================
# 실제 데이터 기반 분석
# ============================================

def get_real_kr_market_cycle() -> KrMarketCycleData:
    """
    실제 데이터 기반 한국 시장 사이클 분석

    Returns:
        KrMarketCycleData 객체

    Raises:
        Exception: 데이터 조회 실패 또는 계산 오류
    """
    from app.services.korea_economic_service import get_ecos_indicator, get_credit_spread

    logger.debug("실제 데이터 기반 한국 시장 사이클 분석 시작")

    # 1. 데이터 조회 (히스토리 포함)
    # 산업생산지수 사용 (수출액 대신 - ECOS API 문제로 인해 임시 변경)
    logger.debug("산업생산지수 데이터 조회")
    export_data = get_ecos_indicator("KR_INDPRO", include_history=True)

    logger.debug("CPI 데이터 조회")
    cpi_data = get_ecos_indicator("KR_CPI", include_history=True)

    logger.debug("신용 스프레드 데이터 조회")
    credit_spread_data = get_credit_spread(include_history=True)

    # 2. 데이터 검증
    if not export_data:
        raise ValueError("산업생산지수 데이터를 조회할 수 없습니다")
    if not cpi_data:
        raise ValueError("CPI 데이터를 조회할 수 없습니다")
    if not credit_spread_data or not credit_spread_data.value:
        raise ValueError("신용 스프레드 데이터를 조회할 수 없습니다")

    # YoY 변화율 사용 (없으면 change_percent 사용)
    export_yoy = export_data.yoy_change
    if export_yoy is None:
        # YoY가 없으면 전월 대비 변화율 사용 (대략적인 추정)
        export_yoy = export_data.change_percent or 0.0
        logger.warning(f"산업생산지수 YoY 없음, change_percent 사용: {export_yoy}%")

    cpi_yoy = cpi_data.yoy_change
    if cpi_yoy is None:
        # CPI도 YoY가 없으면 change_percent 사용
        cpi_yoy = cpi_data.change_percent or 2.0  # 기본값 2%
        logger.warning(f"CPI YoY 없음, change_percent 사용: {cpi_yoy}%")

    # 3. 모멘텀 계산
    # 산업생산지수 모멘텀 계산 (최근 3개월 MoM 기울기)
    export_trend = calculate_momentum(export_data.history)
    logger.debug(f"산업생산지수 모멘텀: {export_trend}")

    # CPI는 YoY 변화율만 사용
    cpi_prev = cpi_yoy

    # 신용 스프레드 (bp 단위)
    credit_spread = credit_spread_data.value * 100  # % → bp 변환

    # 4. 시장 사이클 분석
    cycle_data = analyze_kr_market_cycle(
        export_yoy=export_yoy,
        export_trend=export_trend,
        cpi_yoy=cpi_yoy,
        cpi_prev_month=cpi_prev,
        credit_spread=credit_spread
    )

    logger.debug(f"실제 데이터 기반 한국 시장 사이클 분석 완료: {cycle_data.season}")
    return cycle_data


# ============================================
# Mock 데이터 생성 (테스트용)
# ============================================

def get_sample_kr_market_cycle() -> KrMarketCycleData:
    """
    샘플 한국 시장 사이클 데이터 반환 (테스트용)

    Returns:
        KrMarketCycleData 객체
    """
    return KrMarketCycleData(
        season='summer',
        season_name='여름 (활황기)',
        season_emoji='☀️',
        confidence=82,
        score=60.0,
        transition_signal='안정적 유지',
        reasoning='수출 확장(YoY +8.5%), 양호한 물가(CPI 2.8%), 낮은 시장 리스크(스프레드 58bp)로 여름(활황기)로 판단됩니다.',
        export=KrMarketCycleIndicator(
            value=8.5,
            trend="상승 추세",
            label="수출액 (YoY)"
        ),
        cpi=KrMarketCycleIndicator(
            value=2.8,
            trend="안정",
            label="CPI (YoY)",
            mom_change="+0.1"
        ),
        credit_spread=KrMarketCycleIndicator(
            value=58.0,
            trend="낮은 리스크",
            label="신용 스프레드 (bp)"
        ),
        sectors=['자동차', '조선', '철강', '화학']
    )


# ============================================
# AI 분석 (Gemini)
# ============================================

def generate_kr_ai_comment(
    cycle_data: KrMarketCycleData,
    api_key: str
) -> Dict[str, str]:
    """
    Gemini를 사용하여 한국 시장 사이클 AI 코멘트 생성

    Args:
        cycle_data: 한국 시장 사이클 데이터
        api_key: Gemini API 키

    Returns:
        {
            'comment': 국면 진단 (1-2문장),
            'recommendation': 추천 전략 (1문장),
            'risk': 리스크 요인 (선택, 1문장)
        }

    Raises:
        Exception: Gemini API 오류 또는 JSON 파싱 오류
    """
    try:
        # Gemini 설정
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('models/gemini-flash-latest')

        # 시스템 프롬프트
        system_instruction = """
당신은 20년 경력의 한국 경제 전문 애널리스트이자 투자 멘토입니다. 사용자는 주식 대시보드를 통해 현재 한국 경제 국면(봄, 여름, 가을, 겨울)을 확인하고 있습니다. 당신의 임무는 한국 경제 지표의 '결'을 읽어 사용자에게 딱 한 문장의 날카로운 통찰과 행동 지침을 주는 것입니다.

작성 원칙:
- 현재 계절을 확정 짓되, 다음 계절로의 전환 가능성을 지표 근거로 언급할 것.
- 전문 용어만 나열하지 말고, 투자자의 심리와 행동(섹터 로테이션)을 짚어줄 것.
- 한국 특화 섹터(반도체, 2차전지, 자동차, 조선 등)를 언급할 것.
- 말투는 냉철하면서도 신뢰감 있는 멘토의 어조를 유지할 것.
- 가급적 한 문장(최대 두 문장)으로 짧고 강렬하게 작성할 것.
        """

        # 피크 아웃 구간 감지 (70-80점)
        is_peak_out = 70 <= cycle_data.score <= 80
        peak_out_notice = ""
        if is_peak_out:
            peak_out_notice = """
⚠️ **주의**: 현재 점수가 70-80 구간으로, 여름의 끝자락에서 가을로 전환되는 "피크 아웃 구간"입니다.
이 시기는 시장 과열 경계 및 수익 실현을 고려해야 하는 중요한 시점입니다.
recommendation에 반드시 "과열 경계" 또는 "수익 실현" 관련 멘트를 포함하세요.
"""

        # 사용자 프롬프트
        user_prompt = f"""
[상황 데이터]
- 판정된 계절: {cycle_data.season_name} (신뢰도: {cycle_data.confidence}%)
- 종합 점수: {cycle_data.score:.1f}/100 (0-25=겨울, 25-50=봄, 50-75=여름, 75-100=가을)
- 경계선 위치: {cycle_data.transition_signal}
- 주요 지표:
  * 수출액 YoY {cycle_data.export.value:+.1f}% ({cycle_data.export.trend})
  * CPI {cycle_data.cpi.value}% (전월 대비 {cycle_data.cpi.mom_change or '0.0'})
  * 신용 스프레드: {cycle_data.credit_spread.value:.0f}bp ({cycle_data.credit_spread.trend})
- 추천 섹터: {', '.join(cycle_data.sectors or [])}
{peak_out_notice}
[요청 사항]
위 데이터를 바탕으로 멘토 코멘트를 작성하되, **반드시 아래 JSON 형식**으로 응답해 줘.

{{
  "comment": "현재 국면의 특징과 전환 가능성을 포함한 진단 (1-2문장)",
  "recommendation": "지금 주목해야 할 한국 특화 섹터나 투자 전략 (1문장)",
  "risk": "주의해야 할 리스크 요인 (선택, 있으면 1문장)"
}}
        """

        logger.debug(f"Gemini AI 코멘트 생성 시작: {cycle_data.season}")

        # 안전 설정 (필터 완화)
        safety_settings = {
            'HARM_CATEGORY_HARASSMENT': 'BLOCK_NONE',
            'HARM_CATEGORY_HATE_SPEECH': 'BLOCK_NONE',
            'HARM_CATEGORY_SEXUALLY_EXPLICIT': 'BLOCK_NONE',
            'HARM_CATEGORY_DANGEROUS_CONTENT': 'BLOCK_NONE',
        }

        # Gemini 호출
        response = model.generate_content(
            user_prompt,
            generation_config=genai.GenerationConfig(
                temperature=0.7,
                max_output_tokens=2000,
            ),
            safety_settings=safety_settings
        )

        # 응답 확인
        if not response.candidates or not response.candidates[0].content.parts:
            finish_reason = response.candidates[0].finish_reason if response.candidates else "UNKNOWN"
            raise ValueError(f"Gemini 응답 없음 (finish_reason: {finish_reason})")

        # 응답 텍스트 추출
        response_text = response.text.strip()
        logger.debug(f"Gemini 응답: {response_text[:200]}...")

        # JSON 추출 (마크다운 코드 블록 제거)
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0].strip()
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0].strip()

        # JSON 파싱
        result = json.loads(response_text)

        # 필수 필드 검증 및 기본값 설정
        ai_comment = {
            'comment': result.get('comment', '현재 한국 시장 사이클 분석 중입니다.'),
            'recommendation': result.get('recommendation', '균형잡힌 포트폴리오를 유지하세요.'),
            'risk': result.get('risk', None)  # 선택 필드
        }

        logger.debug(f"AI 코멘트 생성 완료: {len(ai_comment['comment'])}자")
        return ai_comment

    except json.JSONDecodeError as e:
        logger.error(f"Gemini 응답 JSON 파싱 오류: {e}", exc_info=True)
        logger.error(f"응답 텍스트: {response_text}")
        # Fallback: 기본 메시지 반환
        return {
            'comment': f"{cycle_data.season_name} 국면입니다. {cycle_data.transition_signal}",
            'recommendation': "포트폴리오를 재점검하고 리스크 관리를 강화하세요.",
            'risk': None
        }

    except Exception as e:
        logger.error(f"Gemini AI 코멘트 생성 오류: {e}", exc_info=True)
        # Fallback: 기본 메시지 반환
        return {
            'comment': f"{cycle_data.season_name} 국면입니다. {cycle_data.transition_signal}",
            'recommendation': "포트폴리오를 재점검하고 리스크 관리를 강화하세요.",
            'risk': None
        }
