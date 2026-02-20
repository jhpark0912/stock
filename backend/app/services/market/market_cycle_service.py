"""
시장 사이클 (경기 계절) 판단 서비스

PMI, CPI, VIX/금리차 기반으로 시장을 4계절로 분류:
- 봄 (회복기): PMI 상승, 저물가
- 여름 (활황기): PMI 50+, 양호한 물가
- 가을 (후퇴기): PMI 하락, 고물가
- 겨울 (침체기): PMI 50-, 디플레
"""

import logging
import json
from typing import Optional, Dict, Any
from datetime import datetime

import google.generativeai as genai

from app.models.economic import MarketCycleData, MarketCycleIndicator

logger = logging.getLogger(__name__)


# ============================================
# 상수
# ============================================

SEASONS = {
    'spring': {'name': '봄 (회복기)', 'emoji': '🌸'},
    'summer': {'name': '여름 (활황기)', 'emoji': '☀️'},
    'autumn': {'name': '가을 (후퇴기)', 'emoji': '🍂'},
    'winter': {'name': '겨울 (침체기)', 'emoji': '❄️'},
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

        if avg_slope > 0.1:  # 월평균 0.1% 이상 증가
            return "상승 추세"
        elif avg_slope < -0.1:  # 월평균 0.1% 이상 감소
            return "하락 추세"
        else:
            return "안정"

    except Exception as e:
        logger.warning(f"모멘텀 계산 실패: {e}")
        return "안정"


def calculate_trend(current: float, avg_3m: float, prev_month: float) -> str:
    """
    추세 판단 (상승/하락/안정) - VIX용

    Args:
        current: 현재 값
        avg_3m: 3개월 평균
        prev_month: 전월 값

    Returns:
        "상승 추세", "하락 추세", "안정"
    """
    if current > avg_3m and current > prev_month:
        return "상승 추세"
    elif current < avg_3m and current < prev_month:
        return "하락 추세"
    else:
        return "안정"


def get_transition_signal(season: str, score: float, confidence: int) -> str:
    """
    다음 계절로의 전환 가능성 판단
    
    Args:
        season: 현재 계절 (spring, summer, autumn, winter)
        score: 가중치 점수
        confidence: 신뢰도 (0-100)
    
    Returns:
        전환 신호 문자열
    """
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


def judge_season_indpro(indpro_yoy: float, indpro_trend: str, cpi: float, vix: float,
                        yield_spread: Optional[float] = None) -> tuple[str, float]:
    """
    시장 사이클 판단 (INDPRO 기반)

    Args:
        indpro_yoy: INDPRO YoY 변화율 (%)
        indpro_trend: INDPRO 모멘텀 ("상승 추세", "하락 추세", "안정")
        cpi: CPI YoY 변화율 (%)
        vix: VIX 값
        yield_spread: 10Y-3M 금리차 (basis points)

    Returns:
        (season, score): 계절과 점수
    """
    # 기본 판단 로직
    indpro_score = 0
    cpi_score = 0
    vix_score = 0

    # INDPRO 판단 (가중치 0.5)
    if indpro_yoy < 0:  # 마이너스 성장
        indpro_score = 0   # 겨울 (침체)
    elif indpro_yoy < 1.0:  # 0~1% 성장
        if indpro_trend == "상승 추세":
            indpro_score = 25  # 봄 (회복)
        else:
            indpro_score = 0   # 겨울 (침체)
    elif indpro_yoy < 1.5:  # 1~1.5% 성장
        if indpro_trend == "하락 추세":
            indpro_score = 75  # 가을 (후퇴)
        else:
            indpro_score = 50  # 여름 (활황)
    else:  # 1.5% 이상 성장
        if indpro_trend == "하락 추세":
            indpro_score = 75  # 가을 (후퇴)
        else:
            indpro_score = 50  # 여름 (활황)
    
    # CPI 판단 (가중치 0.3)
    if cpi < 2:
        cpi_score = 0   # 겨울 (디플레)
    elif cpi < 3:
        cpi_score = 25  # 봄
    elif cpi < 3.5:
        cpi_score = 50  # 여름
    else:
        cpi_score = 75  # 가을 (고물가)
    
    # VIX/금리차 판단 (가중치 0.2)
    if vix < 20:
        vix_score = 50  # 여름 (낮은 변동성)
    elif vix < 25:
        vix_score = 25  # 봄 또는 가을
    else:
        vix_score = 0   # 겨울 (높은 변동성)
    
    # 금리차 보정 (있는 경우)
    if yield_spread is not None:
        if yield_spread < -50:  # 역전
            vix_score = 0   # 겨울
        elif yield_spread > 100:
            vix_score = 25  # 봄
    
    # 최종 점수 (가중 평균)
    score = (indpro_score * 0.5) + (cpi_score * 0.3) + (vix_score * 0.2)
    
    # 계절 판단
    if score < 25:
        season = 'winter'
    elif score < 50:
        season = 'spring'
    elif score < 75:
        season = 'summer'
    else:
        season = 'autumn'
    
    return season, score


def calculate_confidence(season: str, score: float, indpro_trend: str,
                        cpi: float, vix: float) -> int:
    """
    신뢰도 계산 (0-100)

    Args:
        season: 판정된 계절
        score: 가중치 점수
        indpro_trend: INDPRO 모멘텀
        cpi: CPI YoY
        vix: VIX 값

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
    if season == 'spring' and indpro_trend != "상승 추세":
        confidence -= 10
    elif season == 'autumn' and indpro_trend != "하락 추세":
        confidence -= 10
    
    # CPI 범위 보정
    if season == 'summer' and (cpi < 2 or cpi > 3.5):
        confidence -= 15
    
    # VIX 범위 보정
    if season == 'summer' and vix > 25:
        confidence -= 10
    elif season == 'winter' and vix < 20:
        confidence -= 10
    
    return max(0, min(100, int(confidence)))


def generate_reasoning(
    season: str,
    indpro_yoy: float,
    indpro_trend: str,
    cpi: float,
    vix: float
) -> str:
    """
    시장 사이클 판단 근거 생성

    Args:
        season: 판정된 계절
        indpro_yoy: INDPRO YoY 변화율
        indpro_trend: INDPRO 추세
        cpi: CPI 값
        vix: VIX 값

    Returns:
        판단 근거 문자열
    """
    # 지표별 상태 설명
    indpro_desc = ""
    if indpro_yoy >= 1.5:
        indpro_desc = f"산업생산 확장(YoY {indpro_yoy:+.1f}%)"
    elif indpro_yoy >= 1.0:
        indpro_desc = f"산업생산 둔화(YoY {indpro_yoy:+.1f}%)"
    elif indpro_yoy >= 0:
        indpro_desc = f"산업생산 회복(YoY {indpro_yoy:+.1f}%)"
    else:
        indpro_desc = f"산업생산 감소(YoY {indpro_yoy:+.1f}%)"

    cpi_desc = ""
    if cpi > 3.5:
        cpi_desc = "높은 물가"
    elif cpi >= 2.0:
        cpi_desc = "양호한 물가"
    else:
        cpi_desc = "낮은 물가"

    vix_desc = ""
    if vix > 25:
        vix_desc = "높은 변동성"
    elif vix > 20:
        vix_desc = "중간 변동성"
    else:
        vix_desc = "낮은 변동성"

    # 계절별 설명
    season_names = {
        'spring': '봄(회복기)',
        'summer': '여름(활황기)',
        'autumn': '가을(후퇴기)',
        'winter': '겨울(침체기)'
    }

    reasoning = f"{indpro_desc}, {cpi_desc}(CPI {cpi:.1f}%), {vix_desc}(VIX {vix:.1f})로 {season_names[season]}로 판단됩니다."

    return reasoning


# ============================================
# 메인 함수
# ============================================

def analyze_market_cycle(
    indpro_yoy: float,
    indpro_trend: str,
    cpi_current: float,
    cpi_prev_month: float,
    vix_current: float,
    vix_avg_3m: float,
    vix_prev_month: float,
    yield_spread: Optional[float] = None
) -> MarketCycleData:
    """
    시장 사이클 분석 (INDPRO 기반)

    Args:
        indpro_yoy: INDPRO YoY 변화율 (%)
        indpro_trend: INDPRO 모멘텀 ("상승 추세", "하락 추세", "안정")
        cpi_current: 현재 CPI YoY (%)
        cpi_prev_month: 전월 CPI YoY (%)
        vix_current: 현재 VIX
        vix_avg_3m: VIX 3개월 평균
        vix_prev_month: 전월 VIX
        yield_spread: 10Y-3M 금리차 (basis points)

    Returns:
        MarketCycleData 객체

    Raises:
        ValueError: 입력 데이터 오류
    """
    try:
        # 입력 검증
        if cpi_current <= 0 or vix_current <= 0:
            raise ValueError("지표 값은 0보다 커야 합니다")

        # VIX 추세 계산
        vix_trend_value = calculate_trend(vix_current, vix_avg_3m, vix_prev_month)
        
        # VIX 추세 레이블
        if vix_current < 20:
            vix_trend = "낮은 변동성"
        elif vix_current < 25:
            vix_trend = "중간 변동성"
        else:
            vix_trend = "높은 변동성"
        
        # 계절 판단
        season, score = judge_season_indpro(
            indpro_yoy=indpro_yoy,
            indpro_trend=indpro_trend,
            cpi=cpi_current,
            vix=vix_current,
            yield_spread=yield_spread
        )

        # 신뢰도 계산
        confidence = calculate_confidence(
            season=season,
            score=score,
            indpro_trend=indpro_trend,
            cpi=cpi_current,
            vix=vix_current
        )
        
        # 전환 신호
        transition_signal = get_transition_signal(season, score, confidence)

        # 판단 근거 생성
        reasoning = generate_reasoning(
            season=season,
            indpro_yoy=indpro_yoy,
            indpro_trend=indpro_trend,
            cpi=cpi_current,
            vix=vix_current
        )

        # CPI 전월 대비 변화
        cpi_mom = cpi_current - cpi_prev_month
        cpi_mom_str = f"{cpi_mom:+.1f}" if cpi_mom != 0 else "0.0"

        # MarketCycleData 생성
        cycle_data = MarketCycleData(
            season=season,
            season_name=SEASONS[season]['name'],
            season_emoji=SEASONS[season]['emoji'],
            confidence=confidence,
            score=score,
            transition_signal=transition_signal,
            reasoning=reasoning,
            indpro=MarketCycleIndicator(
                value=indpro_yoy,
                trend=indpro_trend,
                label="INDPRO (YoY)"
            ),
            cpi=MarketCycleIndicator(
                value=cpi_current,
                trend=vix_trend_value,
                label="CPI (YoY)",
                mom_change=cpi_mom_str
            ),
            vix=MarketCycleIndicator(
                value=vix_current,
                trend=vix_trend,
                label="VIX"
            ),
            yield_spread=yield_spread
        )
        
        logger.debug(f"시장 사이클 분석 완료: {season} (신뢰도: {confidence}%)")
        return cycle_data
    
    except Exception as e:
        logger.error(f"시장 사이클 분석 오류: {e}", exc_info=True)
        raise


# ============================================
# 실제 데이터 기반 분석
# ============================================

def get_real_market_cycle() -> MarketCycleData:
    """
    실제 데이터 기반 시장 사이클 분석 (Phase 2+)

    Returns:
        MarketCycleData 객체

    Raises:
        Exception: 데이터 조회 실패 또는 계산 오류
    """
    from app.services.economic.fred_service import get_fred_indicator
    from app.services.economic.economic_service import get_yahoo_indicator

    logger.debug("실제 데이터 기반 시장 사이클 분석 시작")

    # 1. 데이터 조회 (히스토리 포함)
    logger.debug("INDPRO 데이터 조회")
    indpro_data = get_fred_indicator("INDPRO", include_history=True)

    logger.debug("CPI 데이터 조회")
    cpi_data = get_fred_indicator("CPIAUCSL", include_history=True)

    logger.debug("VIX 데이터 조회")
    vix_data = get_yahoo_indicator("^VIX", include_history=True)

    # 금리 데이터 조회 (선택적 - 실패해도 계속 진행)
    treasury_10y_data = None
    treasury_3m_data = None

    try:
        logger.debug("10년물 금리 데이터 조회")
        treasury_10y_data = get_yahoo_indicator("^TNX", include_history=True)
    except Exception as e:
        logger.warning(f"10년물 금리 조회 실패 (무시): {e}")

    try:
        logger.debug("3개월 T-Bill 데이터 조회")
        treasury_3m_data = get_yahoo_indicator("^IRX", include_history=True)
    except Exception as e:
        logger.warning(f"3개월 T-Bill 조회 실패 (무시): {e}")

    # 2. 데이터 검증
    if not indpro_data or not indpro_data.yoy_change:
        raise ValueError("INDPRO YoY 데이터를 조회할 수 없습니다")
    if not cpi_data or not cpi_data.yoy_change:
        raise ValueError("CPI YoY 데이터를 조회할 수 없습니다")
    if not vix_data or not vix_data.value:
        raise ValueError("VIX 데이터를 조회할 수 없습니다")

    # YoY 변화율 사용
    indpro_yoy = indpro_data.yoy_change
    cpi_yoy = cpi_data.yoy_change

    # 3. 모멘텀 및 추세 계산
    # INDPRO 모멘텀 계산 (최근 3개월 MoM 기울기)
    indpro_trend = calculate_momentum(indpro_data.history)
    logger.debug(f"INDPRO 모멘텀: {indpro_trend}")

    # VIX 추세 계산 (3개월 평균 기반)
    def calculate_stats(history):
        """히스토리에서 3개월 평균과 전월값 계산"""
        if not history or len(history) < 2:
            return None, None

        recent_values = [h.value for h in history[-3:]]
        avg_3m = sum(recent_values) / len(recent_values)
        prev_month = history[-2].value

        return avg_3m, prev_month

    vix_avg_3m, vix_prev = calculate_stats(vix_data.history)

    # 기본값 설정 (히스토리 없을 경우)
    if vix_avg_3m is None:
        vix_avg_3m = vix_data.value
        vix_prev = vix_data.value

    # CPI는 YoY 변화율만 사용
    cpi_prev = cpi_yoy

    # 4. 금리차 계산 (10Y - 3M, basis points)
    yield_spread = None
    if treasury_10y_data and treasury_10y_data.value and treasury_3m_data and treasury_3m_data.value:
        yield_spread = (treasury_10y_data.value - treasury_3m_data.value) * 100  # bp

    # 5. 시장 사이클 분석
    cycle_data = analyze_market_cycle(
        indpro_yoy=indpro_yoy,  # YoY 변화율 사용
        indpro_trend=indpro_trend,
        cpi_current=cpi_yoy,  # YoY 변화율 사용
        cpi_prev_month=cpi_prev,
        vix_current=vix_data.value,
        vix_avg_3m=vix_avg_3m,
        vix_prev_month=vix_prev,
        yield_spread=yield_spread
    )

    logger.debug(f"실제 데이터 기반 시장 사이클 분석 완료: {cycle_data.season}")
    return cycle_data


# ============================================
# Mock 데이터 생성 (테스트용)
# ============================================

def get_sample_market_cycle() -> MarketCycleData:
    """
    샘플 시장 사이클 데이터 반환 (테스트용)

    Returns:
        MarketCycleData 객체
    """
    return MarketCycleData(
        season='summer',
        season_name='여름 (활황기)',
        season_emoji='☀️',
        confidence=78,
        score=65.0,
        transition_signal='가을로 전환 가능성 있음',
        reasoning='산업생산 확장(YoY +2.5%), 양호한 물가(CPI 3.1%), 낮은 변동성(VIX 18.5)로 여름(활황기)로 판단됩니다.',
        indpro=MarketCycleIndicator(
            value=2.5,
            trend="상승 추세",
            label="INDPRO (YoY)"
        ),
        cpi=MarketCycleIndicator(
            value=3.1,
            trend="상승 추세",
            label="CPI (YoY)",
            mom_change="+0.2"
        ),
        vix=MarketCycleIndicator(
            value=18.5,
            trend="낮은 변동성",
            label="VIX"
        ),
        yield_spread=45.0
    )


# ============================================
# AI 분석 (Gemini)
# ============================================

def generate_ai_comment(
    cycle_data: MarketCycleData,
    api_key: str
) -> Dict[str, str]:
    """
    Gemini를 사용하여 시장 사이클 AI 코멘트 생성
    
    Args:
        cycle_data: 시장 사이클 데이터
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
당신은 20년 경력의 글로벌 거시경제 전략가이자 투자 멘토입니다. 사용자는 주식 대시보드를 통해 현재 경제 국면(봄, 여름, 가을, 겨울)을 확인하고 있습니다. 당신의 임무는 지표 데이터의 '결'을 읽어 사용자에게 딱 한 문장의 날카로운 통찰과 행동 지침을 주는 것입니다.

작성 원칙:
- 현재 계절을 확정 짓되, 다음 계절로의 전환 가능성을 지표 근거로 언급할 것.
- 전문 용어만 나열하지 말고, 투자자의 심리와 행동(섹터 로테이션)을 짚어줄 것.
- 말투는 냉철하면서도 신뢰감 있는 멘토의 어조를 유지할 것.
- 가급적 한 문장(최대 두 문장)으로 짧고 강렬하게 작성할 것.
        """
        
        # 사용자 프롬프트
        yield_spread_str = f"{cycle_data.yield_spread}bp" if cycle_data.yield_spread else "N/A"
        user_prompt = f"""
[상황 데이터]
- 판정된 계절: {cycle_data.season_name} (신뢰도: {cycle_data.confidence}%)
- 경계선 위치: {cycle_data.transition_signal}
- 주요 지표:
  * 산업생산(INDPRO) YoY {cycle_data.indpro.value:+.1f}% ({cycle_data.indpro.trend})
  * CPI {cycle_data.cpi.value}% (전월 대비 {cycle_data.cpi.mom_change or '0.0'})
  * VIX {cycle_data.vix.value} ({cycle_data.vix.trend})
  * 10년물-3개월물 금리차: {yield_spread_str}

[요청 사항]
위 데이터를 바탕으로 멘토 코멘트를 작성하되, **반드시 아래 JSON 형식**으로 응답해 줘.

{{
  "comment": "현재 국면의 특징과 전환 가능성을 포함한 진단 (1-2문장)",
  "recommendation": "지금 주목해야 할 섹터나 투자 전략 (1문장)",
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

        # Gemini 호출 (타임아웃 60초)
        response = model.generate_content(
            user_prompt,
            generation_config=genai.GenerationConfig(
                temperature=0.7,
                max_output_tokens=2000,  # 500 → 2000 증가
            ),
            safety_settings=safety_settings,
            request_options={'timeout': 60}  # 1분 타임아웃
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
            'comment': result.get('comment', '현재 시장 사이클 분석 중입니다.'),
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
