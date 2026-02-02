# -*- coding: utf-8 -*-
"""
technical_indicators.py
주식 기술적 지표 계산 모듈

지원 지표:
- SMA (Simple Moving Average): 단순이동평균
- EMA (Exponential Moving Average): 지수이동평균
- RSI (Relative Strength Index): 상대강도지수
- MACD (Moving Average Convergence Divergence): 이동평균수렴확산
- Bollinger Bands: 볼린저밴드
"""

import pandas as pd
import numpy as np


def calculate_sma(prices, period=20):
    """
    단순이동평균 (SMA) 계산

    Args:
        prices (pd.Series or list): 가격 데이터
        period (int): 이동평균 기간 (기본값: 20일)

    Returns:
        pd.Series: SMA 값
    """
    if isinstance(prices, list):
        prices = pd.Series(prices)

    return prices.rolling(window=period).mean()


def calculate_ema(prices, period=12):
    """
    지수이동평균 (EMA) 계산

    Args:
        prices (pd.Series or list): 가격 데이터
        period (int): 이동평균 기간 (기본값: 12일)

    Returns:
        pd.Series: EMA 값
    """
    if isinstance(prices, list):
        prices = pd.Series(prices)

    return prices.ewm(span=period, adjust=False).mean()


def calculate_rsi(prices, period=14):
    """
    상대강도지수 (RSI) 계산

    RSI = 100 - (100 / (1 + RS))
    RS = 평균 상승폭 / 평균 하락폭

    Args:
        prices (pd.Series or list): 가격 데이터
        period (int): RSI 기간 (기본값: 14일)

    Returns:
        pd.Series: RSI 값 (0-100)
    """
    if isinstance(prices, list):
        prices = pd.Series(prices)

    # 가격 변화 계산
    delta = prices.diff()

    # 상승폭과 하락폭 분리
    gain = delta.where(delta > 0, 0)
    loss = -delta.where(delta < 0, 0)

    # 평균 상승폭/하락폭 계산 (EMA 방식)
    avg_gain = gain.ewm(span=period, adjust=False).mean()
    avg_loss = loss.ewm(span=period, adjust=False).mean()

    # RS 계산
    rs = avg_gain / avg_loss

    # RSI 계산
    rsi = 100 - (100 / (1 + rs))

    return rsi


def calculate_macd(prices, fast_period=12, slow_period=26, signal_period=9):
    """
    MACD (Moving Average Convergence Divergence) 계산

    MACD Line = EMA(12) - EMA(26)
    Signal Line = EMA(MACD, 9)
    Histogram = MACD Line - Signal Line

    Args:
        prices (pd.Series or list): 가격 데이터
        fast_period (int): 빠른 EMA 기간 (기본값: 12)
        slow_period (int): 느린 EMA 기간 (기본값: 26)
        signal_period (int): 시그널 EMA 기간 (기본값: 9)

    Returns:
        dict: {'macd': MACD Line, 'signal': Signal Line, 'histogram': Histogram}
    """
    if isinstance(prices, list):
        prices = pd.Series(prices)

    # MACD Line 계산
    ema_fast = calculate_ema(prices, fast_period)
    ema_slow = calculate_ema(prices, slow_period)
    macd_line = ema_fast - ema_slow

    # Signal Line 계산
    signal_line = macd_line.ewm(span=signal_period, adjust=False).mean()

    # Histogram 계산
    histogram = macd_line - signal_line

    return {
        'macd': macd_line,
        'signal': signal_line,
        'histogram': histogram
    }


def calculate_bollinger_bands(prices, period=20, std_dev=2):
    """
    볼린저밴드 계산

    Middle Band = SMA(20)
    Upper Band = SMA(20) + (2 × σ)
    Lower Band = SMA(20) - (2 × σ)

    Args:
        prices (pd.Series or list): 가격 데이터
        period (int): 이동평균 기간 (기본값: 20일)
        std_dev (float): 표준편차 배수 (기본값: 2)

    Returns:
        dict: {'upper': 상단밴드, 'middle': 중간밴드, 'lower': 하단밴드}
    """
    if isinstance(prices, list):
        prices = pd.Series(prices)

    # Middle Band (SMA)
    middle_band = calculate_sma(prices, period)

    # 표준편차 계산
    std = prices.rolling(window=period).std()

    # Upper/Lower Bands
    upper_band = middle_band + (std_dev * std)
    lower_band = middle_band - (std_dev * std)

    return {
        'upper': upper_band,
        'middle': middle_band,
        'lower': lower_band
    }


def calculate_all_indicators(prices, ticker_symbol="STOCK"):
    """
    모든 기술적 지표를 한 번에 계산

    Args:
        prices (pd.Series or pd.DataFrame): 가격 데이터
            - pd.Series인 경우: 종가 데이터
            - pd.DataFrame인 경우: 'Close' 컬럼 사용
        ticker_symbol (str): 티커 심볼 (오류 메시지용)

    Returns:
        dict: 모든 기술적 지표 값, 또는 {'error': '...'} (에러 시)
    """
    try:
        # DataFrame인 경우 'Close' 컬럼 추출
        if isinstance(prices, pd.DataFrame):
            if 'Close' in prices.columns:
                prices = prices['Close']
            else:
                return {'error': "가격 데이터에 'Close' 컬럼이 없습니다."}

        # 데이터 충분성 검증
        if len(prices) < 50:
            return {'error': f"기술적 지표 계산을 위해서는 최소 50일의 데이터가 필요합니다. (현재: {len(prices)}일)"}

        # 최신 값 추출 (NaN이 아닌 마지막 값)
        def get_latest_value(series):
            valid_values = series.dropna()
            return valid_values.iloc[-1] if len(valid_values) > 0 else None

        # SMA 계산
        sma_20 = calculate_sma(prices, 20)
        sma_50 = calculate_sma(prices, 50)
        sma_200 = calculate_sma(prices, 200) if len(prices) >= 200 else None

        # EMA 계산
        ema_12 = calculate_ema(prices, 12)
        ema_26 = calculate_ema(prices, 26)

        # RSI 계산
        rsi_14 = calculate_rsi(prices, 14)

        # MACD 계산
        macd_data = calculate_macd(prices)

        # Bollinger Bands 계산
        bb_data = calculate_bollinger_bands(prices)

        # 최신 값들 정리
        result = {
            'sma': {
                'sma20': get_latest_value(sma_20),
                'sma50': get_latest_value(sma_50),
                'sma200': get_latest_value(sma_200) if sma_200 is not None else None
            },
            'ema': {
                'ema12': get_latest_value(ema_12),
                'ema26': get_latest_value(ema_26)
            },
            'rsi': {
                'rsi14': get_latest_value(rsi_14)
            },
            'macd': {
                'macd': get_latest_value(macd_data['macd']),
                'signal': get_latest_value(macd_data['signal']),
                'histogram': get_latest_value(macd_data['histogram'])
            },
            'bollinger_bands': {
                'upper': get_latest_value(bb_data['upper']),
                'middle': get_latest_value(bb_data['middle']),
                'lower': get_latest_value(bb_data['lower'])
            }
        }

        return result

    except Exception as e:
        return {'error': f"기술적 지표 계산 중 오류 발생: {str(e)}"}


# 사용 예시 (테스트용)
if __name__ == "__main__":
    # 샘플 데이터 생성 (실제로는 yfinance에서 가져옴)
    sample_prices = pd.Series(np.random.randn(100).cumsum() + 100)

    print("=== 기술적 지표 테스트 ===\n")

    # 개별 지표 테스트
    print("SMA(20):", calculate_sma(sample_prices, 20).iloc[-1])
    print("EMA(12):", calculate_ema(sample_prices, 12).iloc[-1])
    print("RSI(14):", calculate_rsi(sample_prices, 14).iloc[-1])

    macd = calculate_macd(sample_prices)
    print("\nMACD:")
    print("  MACD Line:", macd['macd'].iloc[-1])
    print("  Signal Line:", macd['signal'].iloc[-1])
    print("  Histogram:", macd['histogram'].iloc[-1])

    bb = calculate_bollinger_bands(sample_prices)
    print("\nBollinger Bands:")
    print("  Upper:", bb['upper'].iloc[-1])
    print("  Middle:", bb['middle'].iloc[-1])
    print("  Lower:", bb['lower'].iloc[-1])

    # 전체 지표 테스트
    print("\n\n=== 전체 지표 계산 ===")
    all_indicators = calculate_all_indicators(sample_prices)

    if 'error' not in all_indicators:
        import json
        print(json.dumps(all_indicators, indent=2, ensure_ascii=False))
    else:
        print(f"오류: {all_indicators['error']}")
