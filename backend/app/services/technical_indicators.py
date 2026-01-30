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
            - pd.DataFrame인 경우: 'close' 또는 'Close' 컬럼 사용
        ticker_symbol (str): 티커 심볼 (오류 메시지용)

    Returns:
        dict: 모든 기술적 지표 값, 또는 {'error': '...'} (에러 시)
    """
    try:
        # DataFrame인 경우 'close' 또는 'Close' 컬럼 추출
        # yahooquery는 lowercase 'close' 사용
        if isinstance(prices, pd.DataFrame):
            if 'close' in prices.columns:
                prices = prices['close']
            elif 'Close' in prices.columns:
                prices = prices['Close']
            else:
                return {'error': "가격 데이터에 'close' 또는 'Close' 컬럼이 없습니다."}

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
    # 샘플 데이터 생성 (실제로는 yahooquery에서 가져옴)
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


def calculate_chart_data(history_df: pd.DataFrame):
    """
    차트 표시에 필요한 모든 시계열 기술 지표를 계산합니다.

    Args:
        history_df (pd.DataFrame): yfinance로부터 받은 시계열 데이터. 
                                   'close', 'volume' 컬럼과 인덱스(날짜)가 있어야 함.

    Returns:
        list[dict]: 각 날짜별로 차트에 필요한 모든 데이터 포인트 리스트.
                     예: [{'date': '2023-01-01', 'close': 150.0, 'volume': 10000, ...}, ...]
    """
    try:
        print("🔍 [DEBUG] calculate_chart_data 시작")
        print(f"🔍 [DEBUG] history_df.shape: {history_df.shape}")
        print(f"🔍 [DEBUG] history_df.columns: {history_df.columns.tolist()}")
        print(f"🔍 [DEBUG] history_df.index type: {type(history_df.index)}")
        print(f"🔍 [DEBUG] history_df.index.tz (original): {getattr(history_df.index, 'tz', 'No tz attribute')}")
        
        if 'close' not in history_df.columns:
            raise ValueError("DataFrame에 'close' 컬럼이 필요합니다.")

        # 먼저 history_df의 인덱스를 tz-naive로 변환 (모든 Series가 같은 인덱스를 공유하도록)
        print("🔍 [DEBUG] history_df 복사 중...")
        history_df = history_df.copy()  # 원본 수정 방지
        
        print(f"🔍 [DEBUG] 인덱스 타입 확인: {type(history_df.index)}")
        print(f"🔍 [DEBUG] isinstance DatetimeIndex: {isinstance(history_df.index, pd.DatetimeIndex)}")
        print(f"🔍 [DEBUG] 인덱스 첫 3개 값 샘플 (native):")
        for i, idx_val in enumerate(history_df.index[:3]):
            tz_info = getattr(idx_val, 'tz', 'No tz')
            print(f"  [{i}] {repr(idx_val)} | type: {type(idx_val).__name__} | tz: {tz_info}")
        
        # 🔑 핵심 수정: utc=True로 모든 datetime을 UTC로 통일한 후 timezone 제거
        print("🔍 [DEBUG] 인덱스를 UTC로 통일 중...")
        try:
            # utc=True로 모든 값을 UTC DatetimeIndex로 변환
            history_df.index = pd.to_datetime(history_df.index, utc=True)
            print(f"🔍 [DEBUG] UTC 변환 완료. 타입: {type(history_df.index)}")
            print(f"🔍 [DEBUG] UTC 변환 후 tz: {history_df.index.tz}")
            
            # timezone 제거 (tz-naive로 변환)
            print("🔍 [DEBUG] timezone 제거 중 (tz_localize(None))...")
            history_df.index = history_df.index.tz_localize(None)
            print(f"🔍 [DEBUG] tz-naive 변환 완료. 타입: {type(history_df.index)}")
            print(f"🔍 [DEBUG] isinstance DatetimeIndex: {isinstance(history_df.index, pd.DatetimeIndex)}")
            print(f"🔍 [DEBUG] 최종 index.tz: {getattr(history_df.index, 'tz', 'No tz attribute')}")
            print(f"🔍 [DEBUG] 인덱스 샘플 (첫 3개): {history_df.index[:3].tolist()}")
        except Exception as e:
            print(f"❌ [ERROR] UTC 변환 실패: {e}")
            raise
        
        print("🔍 [DEBUG] prices 추출 중...")
        prices = history_df['close']
        print(f"🔍 [DEBUG] prices type: {type(prices)}")
        print(f"🔍 [DEBUG] prices.index type: {type(prices.index)}")
        print(f"🔍 [DEBUG] prices.index isinstance DatetimeIndex: {isinstance(prices.index, pd.DatetimeIndex)}")
        print(f"🔍 [DEBUG] prices.index.tz: {getattr(prices.index, 'tz', 'No tz attribute')}")
        print(f"🔍 [DEBUG] prices 샘플 (첫 3개): {prices[:3].tolist()}")

        # 모든 지표 계산 (이제 모든 Series가 tz-naive 인덱스를 가짐)
        print("🔍 [DEBUG] SMA 계산 중...")
        sma_20 = calculate_sma(prices, 20)
        print(f"🔍 [DEBUG] sma_20.index.tz: {getattr(sma_20.index, 'tz', 'No tz attribute')}")
        
        sma_50 = calculate_sma(prices, 50)
        sma_200 = calculate_sma(prices, 200)
        
        print("🔍 [DEBUG] RSI 계산 중...")
        rsi_14 = calculate_rsi(prices, 14)
        print(f"🔍 [DEBUG] rsi_14.index.tz: {getattr(rsi_14.index, 'tz', 'No tz attribute')}")
        
        print("🔍 [DEBUG] MACD 계산 중...")
        macd_data = calculate_macd(prices)
        print(f"🔍 [DEBUG] macd['macd'].index.tz: {getattr(macd_data['macd'].index, 'tz', 'No tz attribute')}")
        
        print("🔍 [DEBUG] Bollinger Bands 계산 중...")
        bb_data = calculate_bollinger_bands(prices)
        print(f"🔍 [DEBUG] bb_data['upper'].index.tz: {getattr(bb_data['upper'].index, 'tz', 'No tz attribute')}")

        # 결과를 하나의 DataFrame으로 병합
        print("🔍 [DEBUG] chart_df 생성 중...")
        chart_df = pd.DataFrame(index=history_df.index)
        print(f"🔍 [DEBUG] chart_df.index type: {type(chart_df.index)}")
        print(f"🔍 [DEBUG] chart_df.index isinstance DatetimeIndex: {isinstance(chart_df.index, pd.DatetimeIndex)}")
        print(f"🔍 [DEBUG] chart_df.index.tz: {getattr(chart_df.index, 'tz', 'No tz attribute')}")
        
        # date 컬럼 생성
        print("🔍 [DEBUG] 'date' 컬럼 생성 중...")
        chart_df['date'] = chart_df.index.strftime('%Y-%m-%d')
        
        print("🔍 [DEBUG] 'close' 컬럼 할당 중...")
        chart_df['close'] = prices.values  # .values 사용하여 인덱스 무시
        
        print("🔍 [DEBUG] 'volume' 컬럼 할당 중...")
        volume_series = history_df.get('volume', pd.Series(0, index=history_df.index))
        print(f"🔍 [DEBUG] volume_series.index.tz: {getattr(volume_series.index, 'tz', 'No tz attribute')}")
        chart_df['volume'] = volume_series.values
        
        print("🔍 [DEBUG] SMA 컬럼들 할당 중...")
        chart_df['sma20'] = sma_20.values
        chart_df['sma50'] = sma_50.values
        chart_df['sma200'] = sma_200.values
        
        print("🔍 [DEBUG] 'rsi' 컬럼 할당 중...")
        chart_df['rsi'] = rsi_14.values
        
        print("🔍 [DEBUG] MACD 컬럼들 할당 중...")
        chart_df['macd'] = macd_data['macd'].values
        chart_df['macd_signal'] = macd_data['signal'].values
        chart_df['macd_hist'] = macd_data['histogram'].values
        
        print("🔍 [DEBUG] Bollinger Bands 컬럼들 할당 중...")
        chart_df['bb_upper'] = bb_data['upper'].values
        chart_df['bb_middle'] = bb_data['middle'].values
        chart_df['bb_lower'] = bb_data['lower'].values

        # NaN 값을 None으로 변경하여 JSON 직렬화 문제를 방지
        print("🔍 [DEBUG] NaN 값을 None으로 변환 중...")
        chart_df = chart_df.replace({np.nan: None})
        
        # DataFrame을 dictionary 리스트로 변환
        # 최근 1년치 데이터만 반환 (차트 성능 최적화)
        print("🔍 [DEBUG] DataFrame을 dict 리스트로 변환 중...")
        result = chart_df.tail(252).to_dict('records')
        print(f"🔍 [DEBUG] 변환 완료. 반환할 데이터 포인트 수: {len(result)}")
        print("✅ [DEBUG] calculate_chart_data 성공적으로 완료")
        return result
        
    except Exception as e:
        import traceback
        print("❌ [ERROR] calculate_chart_data에서 예외 발생!")
        print(f"❌ [ERROR] 예외 타입: {type(e).__name__}")
        print(f"❌ [ERROR] 예외 메시지: {str(e)}")
        print("❌ [ERROR] 상세 트레이스백:")
        traceback.print_exc()
        raise
