# -*- coding: utf-8 -*-
"""
stock_standalone.py - 주식 정보 조회 도구 (독립 실행 버전)
Python만 있으면 동작하는 배포용 단일 파일

버전: Enhanced Edition
포함 기능:
- 실시간 주식 정보 조회 (yfinance)
- 35개 이상의 재무 지표
- 기술적 지표 (RSI, MACD, SMA, EMA, 볼린저밴드)
- 뉴스 수집 및 표시
- Gemini AI 기반 투자 인사이트 (옵션)
- 뉴스 감성 분석 (옵션)

실행 방법:
    python stock_standalone.py

필요 환경:
    - Python 3.7 이상
    - 인터넷 연결
    - (선택) Gemini API 키 (.env 파일에 GEMINI_API_KEY 설정)
"""

import sys
import subprocess
import importlib.util

# ============================================================================
# 1. 자동 의존성 설치 함수
# ============================================================================

def install_and_import(package, import_name=None, version=""):
    """
    라이브러리가 설치되어 있지 않으면 자동으로 설치하고 임포트합니다.

    Args:
        package (str): pip 패키지 이름
        import_name (str, optional): 임포트할 때 사용할 이름 (기본값: package와 동일)
        version (str, optional): 버전 지정 (예: ">=1.0.0")
    """
    if import_name is None:
        import_name = package

    spec = importlib.util.find_spec(import_name)
    if spec is None:
        print(f"'{package}' 라이브러리를 찾을 수 없습니다. 설치를 시작합니다...")
        try:
            install_command = [sys.executable, "-m", "pip", "install", f"{package}{version}"]
            subprocess.check_call(install_command)

            spec = importlib.util.find_spec(import_name)
            if spec is None:
                raise ImportError(f"'{package}' 라이브러리를 설치했지만, 찾을 수 없습니다.")

            print(f"'{package}' 라이브러리 설치가 완료되었습니다. 프로그램을 계속합니다.")
            globals()[import_name] = importlib.import_module(import_name)

        except (subprocess.CalledProcessError, ImportError) as e:
            print(f"오류: {e}")
            print(f"'{package}' 라이브러리를 자동으로 설치하지 못했습니다.")
            print(f"수동으로 설치해주세요: pip install {package}{version}")
            sys.exit(1)


# 필수 라이브러리 자동 설치
print("📦 필수 라이브러리 확인 중...")
install_and_import('yfinance', 'yfinance')
install_and_import('rich')
install_and_import('deep_translator')
install_and_import('pandas')
install_and_import('numpy')
print("✅ 필수 라이브러리 확인 완료\n")

# 이제 안전하게 임포트
import yfinance as yf
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from datetime import datetime, timedelta
from deep_translator import GoogleTranslator
import pandas as pd
import numpy as np
import os

# 선택적 라이브러리 (Gemini API)
try:
    install_and_import('google-generativeai', 'google.generativeai')
    install_and_import('python-dotenv', 'dotenv')
    import google.generativeai as genai
    from dotenv import load_dotenv
    GEMINI_AVAILABLE = True
except Exception:
    GEMINI_AVAILABLE = False

# ============================================================================
# 2. 기술적 지표 계산 모듈 (technical_indicators.py 통합)
# ============================================================================

def calculate_sma(prices, period=20):
    """단순이동평균 (SMA) 계산"""
    if isinstance(prices, list):
        prices = pd.Series(prices)
    return prices.rolling(window=period).mean()


def calculate_ema(prices, period=12):
    """지수이동평균 (EMA) 계산"""
    if isinstance(prices, list):
        prices = pd.Series(prices)
    return prices.ewm(span=period, adjust=False).mean()


def calculate_rsi(prices, period=14):
    """
    상대강도지수 (RSI) 계산
    RSI = 100 - (100 / (1 + RS))
    RS = 평균 상승폭 / 평균 하락폭
    """
    if isinstance(prices, list):
        prices = pd.Series(prices)

    delta = prices.diff()
    gain = delta.where(delta > 0, 0)
    loss = -delta.where(delta < 0, 0)
    avg_gain = gain.ewm(span=period, adjust=False).mean()
    avg_loss = loss.ewm(span=period, adjust=False).mean()
    rs = avg_gain / avg_loss
    rsi = 100 - (100 / (1 + rs))
    return rsi


def calculate_macd(prices, fast_period=12, slow_period=26, signal_period=9):
    """
    MACD (Moving Average Convergence Divergence) 계산
    MACD Line = EMA(12) - EMA(26)
    Signal Line = EMA(MACD, 9)
    Histogram = MACD Line - Signal Line
    """
    if isinstance(prices, list):
        prices = pd.Series(prices)

    ema_fast = calculate_ema(prices, fast_period)
    ema_slow = calculate_ema(prices, slow_period)
    macd_line = ema_fast - ema_slow
    signal_line = macd_line.ewm(span=signal_period, adjust=False).mean()
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
    """
    if isinstance(prices, list):
        prices = pd.Series(prices)

    middle_band = calculate_sma(prices, period)
    std = prices.rolling(window=period).std()
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
        ticker_symbol (str): 티커 심볼 (오류 메시지용)

    Returns:
        dict: 모든 기술적 지표 값, 또는 {'error': '...'} (에러 시)
    """
    try:
        if isinstance(prices, pd.DataFrame):
            if 'Close' in prices.columns:
                prices = prices['Close']
            else:
                return {'error': "가격 데이터에 'Close' 컬럼이 없습니다."}

        if len(prices) < 50:
            return {'error': f"기술적 지표 계산을 위해서는 최소 50일의 데이터가 필요합니다. (현재: {len(prices)}일)"}

        def get_latest_value(series):
            valid_values = series.dropna()
            return valid_values.iloc[-1] if len(valid_values) > 0 else None

        sma_20 = calculate_sma(prices, 20)
        sma_50 = calculate_sma(prices, 50)
        sma_200 = calculate_sma(prices, 200) if len(prices) >= 200 else None
        ema_12 = calculate_ema(prices, 12)
        ema_26 = calculate_ema(prices, 26)
        rsi_14 = calculate_rsi(prices, 14)
        macd_data = calculate_macd(prices)
        bb_data = calculate_bollinger_bands(prices)

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


# ============================================================================
# 3. Gemini AI 분석 모듈 (gemini_analyzer.py 통합)
# ============================================================================

class GeminiAnalyzer:
    """Gemini API를 사용한 주식 분석 클래스"""

    def __init__(self, api_key=None):
        """Gemini Analyzer 초기화"""
        if not GEMINI_AVAILABLE:
            raise ImportError(
                "Gemini API를 사용하려면 다음 라이브러리를 설치하세요:\n"
                "pip install google-generativeai python-dotenv"
            )

        load_dotenv()

        if api_key is None:
            api_key = os.getenv('GEMINI_API_KEY')

        if not api_key:
            raise ValueError(
                "Gemini API 키를 찾을 수 없습니다.\n"
                ".env 파일에 GEMINI_API_KEY=your_api_key를 추가하세요."
            )

        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-flash-latest')

    def analyze_stock(self, ticker, price_data, financial_data, technical_data=None):
        """주식 데이터를 분석하여 투자 인사이트 제공"""
        try:
            prompt = self._build_stock_analysis_prompt(
                ticker, price_data, financial_data, technical_data
            )
            response = self.model.generate_content(prompt)
            result = self._parse_analysis_response(response.text)
            return result
        except Exception as e:
            return {'error': f"AI 분석 중 오류 발생: {str(e)}"}

    def analyze_news_sentiment(self, ticker, news_items):
        """뉴스 헤드라인의 감성 분석"""
        try:
            if not news_items:
                return {
                    'score': 0,
                    'sentiment': 'neutral',
                    'positive_news': [],
                    'negative_news': [],
                    'market_mood': '뉴스 데이터가 없습니다.'
                }

            prompt = self._build_sentiment_analysis_prompt(ticker, news_items)
            response = self.model.generate_content(prompt)
            result = self._parse_sentiment_response(response.text)
            return result
        except Exception as e:
            return {'error': f"감성 분석 중 오류 발생: {str(e)}"}

    def _build_stock_analysis_prompt(self, ticker, price_data, financial_data, technical_data):
        """주식 분석용 프롬프트 생성"""
        import json

        financial_str = "\n".join([
            f"- {key}: {value}" for key, value in financial_data.items()
            if value is not None and value != 'N/A'
        ])

        technical_str = ""
        if technical_data and 'error' not in technical_data:
            technical_str = "\n\n기술적 지표:\n"
            if 'rsi' in technical_data:
                technical_str += f"- RSI(14): {technical_data['rsi'].get('rsi14', 'N/A')}\n"
            if 'macd' in technical_data:
                macd = technical_data['macd']
                technical_str += f"- MACD: {macd.get('macd', 'N/A')}\n"
                technical_str += f"- Signal: {macd.get('signal', 'N/A')}\n"
            if 'sma' in technical_data:
                sma = technical_data['sma']
                technical_str += f"- SMA(20): {sma.get('sma20', 'N/A')}\n"
                technical_str += f"- SMA(50): {sma.get('sma50', 'N/A')}\n"
                if sma.get('sma200'):
                    technical_str += f"- SMA(200): {sma['sma200']}\n"

        prompt = f"""당신은 20년 경력의 전문 주식 애널리스트입니다. 다음 주식 데이터를 분석하여 투자 인사이트를 제공하세요.

티커: {ticker}
현재가: ${price_data.get('currentPrice', 'N/A')}
시가총액: ${price_data.get('marketCap', 'N/A')}

재무 지표:
{financial_str}
{technical_str}

다음 형식으로 답변하세요 (각 항목은 명확히 구분):

## 종합 평가
[1-3문장으로 전반적인 평가]

## 강점
- [강점 1]
- [강점 2]
- [강점 3]

## 약점
- [약점 1]
- [약점 2]

## 투자 의견
[매수|보유|매도] 중 하나를 선택하고 이유를 간략히 설명

## 리스크 요인
- [리스크 1]
- [리스크 2]
- [리스크 3]

## 목표가 (선택사항)
[목표가 및 근거, 없으면 생략]

**중요**: 한국어로 답변하세요. 단, 전문 용어(PER, PBR 등)는 영문 약어 사용 가능.
"""
        return prompt

    def _build_sentiment_analysis_prompt(self, ticker, news_items):
        """뉴스 감성 분석용 프롬프트 생성"""
        news_str = "\n".join([
            f"{i+1}. {item.get('title', '제목 없음')}"
            for i, item in enumerate(news_items[:15])
        ])

        prompt = f"""당신은 금융 뉴스 분석 전문가입니다. 다음은 {ticker} 주식에 관한 최근 뉴스 헤드라인입니다.

뉴스 헤드라인:
{news_str}

각 헤드라인의 감성을 분석하고 다음 형식으로 답변하세요:

## 감성 점수
[전체 감성 점수: -100 (매우 부정) ~ +100 (매우 긍정)]

## 긍정적 뉴스 요약
- [긍정 뉴스 1 요약]
- [긍정 뉴스 2 요약]

## 부정적 뉴스 요약
- [부정 뉴스 1 요약]
- [부정 뉴스 2 요약]

## 시장 심리 평가
[1-2문장으로 전반적인 시장 심리 평가]

**중요**: 한국어로 답변하세요.
"""
        return prompt

    def _parse_analysis_response(self, response_text):
        """AI 분석 응답을 파싱하여 구조화된 딕셔너리로 변환"""
        try:
            result = {
                'summary': '',
                'strengths': [],
                'weaknesses': [],
                'recommendation': '',
                'risks': [],
                'target_price': None
            }

            lines = response_text.strip().split('\n')
            current_section = None

            for line in lines:
                line = line.strip()

                if '종합 평가' in line or '## 종합 평가' in line:
                    current_section = 'summary'
                    continue
                elif '강점' in line or '## 강점' in line:
                    current_section = 'strengths'
                    continue
                elif '약점' in line or '## 약점' in line:
                    current_section = 'weaknesses'
                    continue
                elif '투자 의견' in line or '## 투자 의견' in line:
                    current_section = 'recommendation'
                    continue
                elif '리스크' in line or '## 리스크' in line:
                    current_section = 'risks'
                    continue
                elif '목표가' in line or '## 목표가' in line:
                    current_section = 'target_price'
                    continue

                if not line or line.startswith('#'):
                    continue

                if current_section == 'summary':
                    result['summary'] += line + ' '
                elif current_section in ['strengths', 'weaknesses', 'risks']:
                    if line.startswith('-') or line.startswith('•'):
                        result[current_section].append(line.lstrip('-•').strip())
                elif current_section == 'recommendation':
                    result['recommendation'] += line + ' '
                elif current_section == 'target_price':
                    result['target_price'] = line

            result['summary'] = result['summary'].strip()
            result['recommendation'] = result['recommendation'].strip()

            return result

        except Exception as e:
            return {
                'summary': response_text[:500],
                'strengths': [],
                'weaknesses': [],
                'recommendation': '분석 실패',
                'risks': [],
                'target_price': None,
                'raw_response': response_text
            }

    def _parse_sentiment_response(self, response_text):
        """감성 분석 응답을 파싱하여 구조화된 딕셔너리로 변환"""
        try:
            result = {
                'score': 0,
                'sentiment': 'neutral',
                'positive_news': [],
                'negative_news': [],
                'market_mood': ''
            }

            lines = response_text.strip().split('\n')
            current_section = None

            for line in lines:
                line = line.strip()

                if '감성 점수' in line or '## 감성 점수' in line:
                    current_section = 'score'
                    continue
                elif '긍정적 뉴스' in line or '## 긍정적 뉴스' in line:
                    current_section = 'positive'
                    continue
                elif '부정적 뉴스' in line or '## 부정적 뉴스' in line:
                    current_section = 'negative'
                    continue
                elif '시장 심리' in line or '## 시장 심리' in line:
                    current_section = 'mood'
                    continue

                if not line or line.startswith('#'):
                    continue

                if current_section == 'score':
                    import re
                    numbers = re.findall(r'-?\d+', line)
                    if numbers:
                        score = int(numbers[0])
                        result['score'] = max(-100, min(100, score))

                        if result['score'] > 30:
                            result['sentiment'] = 'positive'
                        elif result['score'] < -30:
                            result['sentiment'] = 'negative'
                        else:
                            result['sentiment'] = 'neutral'

                elif current_section == 'positive':
                    if line.startswith('-') or line.startswith('•'):
                        result['positive_news'].append(line.lstrip('-•').strip())
                elif current_section == 'negative':
                    if line.startswith('-') or line.startswith('•'):
                        result['negative_news'].append(line.lstrip('-•').strip())
                elif current_section == 'mood':
                    result['market_mood'] += line + ' '

            result['market_mood'] = result['market_mood'].strip()

            return result

        except Exception as e:
            return {
                'score': 0,
                'sentiment': 'neutral',
                'positive_news': [],
                'negative_news': [],
                'market_mood': response_text[:200],
                'raw_response': response_text
            }


# ============================================================================
# 4. 주식 데이터 조회 함수
# ============================================================================

def get_stock_data(ticker_symbol, date_str=None, include_technical=True, include_news=True, include_ai_analysis=False):
    """
    주식 데이터를 가져옵니다.

    Args:
        ticker_symbol (str): 주식 티커 심볼
        date_str (str, optional): 조회할 날짜 (YYYY-MM-DD). None이면 실시간 데이터.
        include_technical (bool): 기술적 지표 포함 여부
        include_news (bool): 뉴스 포함 여부
        include_ai_analysis (bool): Gemini AI 분석 포함 여부

    Returns:
        dict: 주식 데이터 딕셔너리
    """
    try:
        ticker = yf.Ticker(ticker_symbol)

        if date_str:
            # 과거 데이터 조회
            try:
                start_date = datetime.strptime(date_str, '%Y-%m-%d')
                end_date = start_date + timedelta(days=1)
                hist = ticker.history(start=start_date.strftime('%Y-%m-%d'), end=end_date.strftime('%Y-%m-%d'))

                if hist.empty:
                    return {'error': f"'{ticker_symbol}'에 대한 '{date_str}'의 데이터가 없습니다. 주말 또는 공휴일일 수 있습니다."}

                info = hist.iloc[0]
                data = {
                    'ticker': ticker_symbol.upper(),
                    'date': date_str,
                    'open': info.get('Open'),
                    'high': info.get('High'),
                    'low': info.get('Low'),
                    'close': info.get('Close'),
                    'volume': info.get('Volume'),
                }
            except ValueError:
                return {'error': "날짜 형식이 잘못되었습니다. 'YYYY-MM-DD' 형식으로 입력해주세요."}
        else:
            # 실시간 데이터 조회
            info = ticker.info
            if not info.get('marketCap'):
                return {'error': f"'{ticker_symbol}'에 대한 데이터를 찾을 수 없습니다. 유효한 티커인지 확인하세요."}

            data = {
                'ticker': ticker_symbol.upper(),
                'currentPrice': info.get('regularMarketPrice'),
                'open': info.get('regularMarketOpen'),
                'high': info.get('regularMarketDayHigh'),
                'low': info.get('regularMarketDayLow'),
                'volume': info.get('regularMarketVolume'),
                'marketCap': info.get('marketCap'),

                # 재무 지표
                'roe': info.get('returnOnEquity'),
                'opm': info.get('operatingMargins'),
                'peg': info.get('pegRatio'),
                'pbr': info.get('priceToBook'),
                'debtToEquity': info.get('debtToEquity'),
                'fcf': info.get('freeCashflow'),
                'interestCoverage': 'N/A',

                # 배당 관련 지표
                'dividendYield': info.get('dividendYield'),
                'dividendRate': info.get('dividendRate'),
                'payoutRatio': info.get('payoutRatio'),

                # 수익성 지표
                'grossMargins': info.get('grossMargins'),
                'profitMargins': info.get('profitMargins'),
                'ebitdaMargins': info.get('ebitdaMargins'),

                # 밸류에이션 지표
                'trailingPE': info.get('trailingPE'),
                'forwardPE': info.get('forwardPE'),
                'priceToSales': info.get('priceToSalesTrailing12Months'),
                'enterpriseValue': info.get('enterpriseValue'),
                'enterpriseToRevenue': info.get('enterpriseToRevenue'),
                'enterpriseToEbitda': info.get('enterpriseToEbitda'),

                # 성장성 지표
                'revenueGrowth': info.get('revenueGrowth'),
                'earningsGrowth': info.get('earningsGrowth'),

                # 재무건전성 지표
                'currentRatio': info.get('currentRatio'),
                'quickRatio': info.get('quickRatio'),
                'totalCash': info.get('totalCash'),
                'totalDebt': info.get('totalDebt'),

                # 기타 지표
                'beta': info.get('beta'),
                'trailingEps': info.get('trailingEps'),
                'forwardEps': info.get('forwardEps'),
                'targetMeanPrice': info.get('targetMeanPrice'),
                'recommendationKey': info.get('recommendationKey'),

                'longBusinessSummary': info.get('longBusinessSummary'),
            }

            # 기술적 지표 계산 (실시간 데이터만)
            if include_technical and not date_str:
                try:
                    hist = ticker.history(period="200d")
                    if not hist.empty:
                        technical_data = calculate_all_indicators(hist, ticker_symbol)
                        data['technical'] = technical_data
                    else:
                        data['technical'] = {'error': '과거 데이터가 없습니다.'}
                except Exception as e:
                    data['technical'] = {'error': f'기술적 지표 계산 실패: {str(e)}'}

            # 뉴스 수집 (실시간 데이터만)
            if include_news and not date_str:
                try:
                    news = ticker.news
                    if news:
                        data['news'] = [{
                            'title': item.get('title', '제목 없음'),
                            'link': item.get('link', ''),
                            'publishedAt': item.get('providerPublishTime', ''),
                            'source': item.get('publisher', '알 수 없음')
                        } for item in news[:10]]
                    else:
                        data['news'] = []
                except Exception as e:
                    data['news'] = []

            # Gemini AI 분석 (실시간 데이터만, 요청 시에만)
            if include_ai_analysis and GEMINI_AVAILABLE and not date_str:
                try:
                    analyzer = GeminiAnalyzer()

                    financial_data = {k: v for k, v in data.items()
                                      if k not in ['ticker', 'longBusinessSummary', 'technical', 'news']}

                    price_data = {
                        'currentPrice': data.get('currentPrice'),
                        'marketCap': data.get('marketCap')
                    }

                    ai_analysis = analyzer.analyze_stock(
                        ticker=ticker_symbol,
                        price_data=price_data,
                        financial_data=financial_data,
                        technical_data=data.get('technical')
                    )
                    data['aiAnalysis'] = ai_analysis

                    if data.get('news'):
                        news_sentiment = analyzer.analyze_news_sentiment(
                            ticker=ticker_symbol,
                            news_items=data['news']
                        )
                        if 'aiAnalysis' in data and 'error' not in data['aiAnalysis']:
                            data['aiAnalysis']['newsSentiment'] = news_sentiment
                        else:
                            data['aiAnalysis'] = {'newsSentiment': news_sentiment}

                except Exception as e:
                    data['aiAnalysis'] = {'error': f'AI 분석 실패: {str(e)}'}
            elif include_ai_analysis and not GEMINI_AVAILABLE:
                data['aiAnalysis'] = {'error': 'Gemini API가 설정되지 않았습니다. .env 파일을 확인하세요.'}

        return data
    except Exception as e:
        return {'error': f"데이터를 가져오는 중 오류 발생: {e}"}


# ============================================================================
# 5. 데이터 표시 함수
# ============================================================================

def display_stock_data(data):
    """
    가져온 주식 데이터를 rich 라이브러리로 포맷팅하여 출력합니다.
    """
    console = Console()

    if 'error' in data:
        console.print(Panel(f"[bold red]{data['error']}[/bold red]", title="오류", border_style="red"))
        return

    def format_num(n, is_currency=False):
        if isinstance(n, (int, float)):
            if is_currency:
                return f"${n:,.2f}"
            return f"{n:,}"
        return n if n is not None else "N/A"

    def format_percent(n):
        if isinstance(n, (int, float)):
            return f"{n:.2%}"
        return n if n is not None else "N/A"

    if 'date' in data:
        title = f"[bold cyan]주식 정보 ({data['date']}): {data['ticker']}[/bold cyan]"
        table = Table(show_header=False, box=None, padding=(0, 2))
        table.add_column(style="magenta")
        table.add_column(style="green")
        table.add_row("시가:", format_num(data['open'], is_currency=True))
        table.add_row("고가:", format_num(data['high'], is_currency=True))
        table.add_row("저가:", format_num(data['low'], is_currency=True))
        table.add_row("종가:", format_num(data['close'], is_currency=True))
        table.add_row("거래량:", format_num(data['volume']))
    else:
        title = f"[bold cyan]실시간 주식 정보 ({datetime.now().strftime('%Y-%m-%d %H:%M:%S')} 기준): {data['ticker']}[/bold cyan]"
        table = Table(show_header=False, box=None, padding=(0, 2))
        table.add_column(style="magenta")
        table.add_column(style="green")

        # 가격 정보
        table.add_row("[bold yellow]━━━ 가격 정보 ━━━[/bold yellow]", "")
        table.add_row("현재가:", format_num(data['currentPrice'], is_currency=True))
        table.add_row("시가:", format_num(data['open'], is_currency=True))
        table.add_row("고가:", format_num(data['high'], is_currency=True))
        table.add_row("저가:", format_num(data['low'], is_currency=True))
        table.add_row("거래량:", format_num(data['volume']))
        table.add_row("시가총액:", format_num(data['marketCap'], is_currency=True))

        # 밸류에이션 지표
        table.add_row("", "")
        table.add_row("[bold yellow]━━━ 밸류에이션 ━━━[/bold yellow]", "")
        table.add_row("PER (과거):", format_num(data.get('trailingPE')))
        table.add_row("PER (예상):", format_num(data.get('forwardPE')))
        table.add_row("PBR (주가순자산비율):", format_num(data['pbr']))
        table.add_row("PEG (주가수익성장비율):", format_num(data['peg']))
        table.add_row("PSR (주가매출비율):", format_num(data.get('priceToSales')))
        table.add_row("기업가치 (EV):", format_num(data.get('enterpriseValue'), is_currency=True))
        table.add_row("EV/매출:", format_num(data.get('enterpriseToRevenue')))
        table.add_row("EV/EBITDA:", format_num(data.get('enterpriseToEbitda')))

        # 수익성 지표
        table.add_row("", "")
        table.add_row("[bold yellow]━━━ 수익성 ━━━[/bold yellow]", "")
        table.add_row("매출총이익률:", format_percent(data.get('grossMargins')))
        table.add_row("영업이익률 (OPM):", format_percent(data['opm']))
        table.add_row("순이익률:", format_percent(data.get('profitMargins')))
        table.add_row("EBITDA 마진:", format_percent(data.get('ebitdaMargins')))
        table.add_row("ROE (자기자본이익률):", format_percent(data['roe']))

        # 성장성 지표
        table.add_row("", "")
        table.add_row("[bold yellow]━━━ 성장성 ━━━[/bold yellow]", "")
        table.add_row("매출 성장률:", format_percent(data.get('revenueGrowth')))
        table.add_row("이익 성장률:", format_percent(data.get('earningsGrowth')))

        # 재무건전성
        table.add_row("", "")
        table.add_row("[bold yellow]━━━ 재무건전성 ━━━[/bold yellow]", "")
        table.add_row("유동비율:", format_num(data.get('currentRatio')))
        table.add_row("당좌비율:", format_num(data.get('quickRatio')))
        table.add_row("부채비율:", format_num(data['debtToEquity']))
        table.add_row("총 현금:", format_num(data.get('totalCash'), is_currency=True))
        table.add_row("총 부채:", format_num(data.get('totalDebt'), is_currency=True))
        table.add_row("FCF (잉여현금흐름):", format_num(data.get('fcf'), is_currency=True))
        table.add_row("이자보상배율:", data.get('interestCoverage'))

        # 배당 정보
        table.add_row("", "")
        table.add_row("[bold yellow]━━━ 배당 정보 ━━━[/bold yellow]", "")
        table.add_row("배당수익률:", format_percent(data.get('dividendYield')))
        table.add_row("배당금 (연간):", format_num(data.get('dividendRate'), is_currency=True))
        table.add_row("배당성향:", format_percent(data.get('payoutRatio')))

        # 기타 지표
        table.add_row("", "")
        table.add_row("[bold yellow]━━━ 기타 지표 ━━━[/bold yellow]", "")
        table.add_row("EPS (과거):", format_num(data.get('trailingEps'), is_currency=True))
        table.add_row("EPS (예상):", format_num(data.get('forwardEps'), is_currency=True))
        table.add_row("베타 (변동성):", format_num(data.get('beta')))
        table.add_row("애널리스트 목표가:", format_num(data.get('targetMeanPrice'), is_currency=True))

        # 추천 등급
        recommendation = data.get('recommendationKey', 'N/A')
        if recommendation:
            rec_display = recommendation.upper()
            if recommendation in ['strong_buy', 'buy']:
                rec_display = f"[bold green]{rec_display}[/bold green]"
            elif recommendation == 'hold':
                rec_display = f"[bold yellow]{rec_display}[/bold yellow]"
            elif recommendation in ['sell', 'strong_sell']:
                rec_display = f"[bold red]{rec_display}[/bold red]"
            table.add_row("애널리스트 추천:", rec_display)
        else:
            table.add_row("애널리스트 추천:", "N/A")

    console.print(Panel(table, title=title, border_style="blue", expand=False))

    # 회사 개요 (번역)
    if 'longBusinessSummary' in data and data['longBusinessSummary']:
        summary = data['longBusinessSummary']
        try:
            translator = GoogleTranslator(source='auto', target='ko')
            translated_summary = translator.translate(summary)

            if translated_summary and translated_summary != summary:
                summary_panel = Panel(
                    translated_summary,
                    title="[bold green]회사 개요 (번역)[/bold green]",
                    border_style="green",
                    expand=False
                )
            else:
                summary_panel = Panel(
                    summary,
                    title="[bold green]회사 개요[/bold green]",
                    border_style="green",
                    expand=False
                )
        except Exception as e:
            console.print(f"번역 중 오류 발생: {e}")
            summary_panel = Panel(
                summary,
                title="[bold green]회사 개요 (원본)[/bold green]",
                border_style="green",
                expand=False
            )
        console.print(summary_panel)

    # 기술적 지표 표시
    if 'technical' in data and data['technical']:
        tech = data['technical']
        if 'error' not in tech:
            tech_table = Table(show_header=False, box=None, padding=(0, 2))
            tech_table.add_column(style="magenta")
            tech_table.add_column(style="cyan")

            if 'rsi' in tech and tech['rsi'].get('rsi14'):
                rsi_value = tech['rsi']['rsi14']
                rsi_color = "green" if rsi_value < 30 else ("red" if rsi_value > 70 else "yellow")
                tech_table.add_row("RSI(14):", f"[{rsi_color}]{rsi_value:.2f}[/{rsi_color}]")

            if 'macd' in tech:
                macd_data = tech['macd']
                if macd_data.get('macd'):
                    tech_table.add_row("MACD:", f"{macd_data['macd']:.2f}")
                if macd_data.get('signal'):
                    tech_table.add_row("Signal:", f"{macd_data['signal']:.2f}")
                if macd_data.get('histogram'):
                    hist = macd_data['histogram']
                    hist_color = "green" if hist > 0 else "red"
                    tech_table.add_row("Histogram:", f"[{hist_color}]{hist:.2f}[/{hist_color}]")

            if 'sma' in tech:
                sma_data = tech['sma']
                if sma_data.get('sma20'):
                    tech_table.add_row("SMA(20):", format_num(sma_data['sma20'], is_currency=True))
                if sma_data.get('sma50'):
                    tech_table.add_row("SMA(50):", format_num(sma_data['sma50'], is_currency=True))
                if sma_data.get('sma200'):
                    tech_table.add_row("SMA(200):", format_num(sma_data['sma200'], is_currency=True))

            if 'ema' in tech:
                ema_data = tech['ema']
                if ema_data.get('ema12'):
                    tech_table.add_row("EMA(12):", format_num(ema_data['ema12'], is_currency=True))
                if ema_data.get('ema26'):
                    tech_table.add_row("EMA(26):", format_num(ema_data['ema26'], is_currency=True))

            if 'bollinger_bands' in tech:
                bb_data = tech['bollinger_bands']
                if bb_data.get('upper'):
                    tech_table.add_row("볼린저 상단:", format_num(bb_data['upper'], is_currency=True))
                if bb_data.get('middle'):
                    tech_table.add_row("볼린저 중간:", format_num(bb_data['middle'], is_currency=True))
                if bb_data.get('lower'):
                    tech_table.add_row("볼린저 하단:", format_num(bb_data['lower'], is_currency=True))

            tech_panel = Panel(
                tech_table,
                title="[bold yellow]📊 기술적 지표[/bold yellow]",
                border_style="yellow",
                expand=False
            )
            console.print(tech_panel)
        elif tech.get('error'):
            console.print(Panel(
                f"[yellow]{tech['error']}[/yellow]",
                title="⚠️  기술적 지표",
                border_style="yellow",
                expand=False
            ))

    # 뉴스 표시
    if 'news' in data and data['news']:
        news_table = Table(show_header=True, box=None, padding=(0, 1))
        news_table.add_column("No.", style="cyan", width=4)
        news_table.add_column("제목", style="white")
        news_table.add_column("출처", style="magenta", width=15)

        for i, news_item in enumerate(data['news'][:10], 1):
            title = news_item['title'][:60] + "..." if len(news_item['title']) > 60 else news_item['title']
            source = news_item['source'][:12] + "..." if len(news_item['source']) > 12 else news_item['source']
            news_table.add_row(str(i), title, source)

        news_panel = Panel(
            news_table,
            title="[bold cyan]📰 최근 뉴스[/bold cyan]",
            border_style="cyan",
            expand=False
        )
        console.print(news_panel)

    # AI 분석 결과 표시
    if 'aiAnalysis' in data and data['aiAnalysis']:
        ai = data['aiAnalysis']

        if 'error' not in ai:
            if ai.get('summary'):
                console.print(Panel(
                    ai['summary'],
                    title="[bold green]🤖 AI 종합 평가[/bold green]",
                    border_style="green",
                    expand=False
                ))

            if ai.get('strengths') or ai.get('weaknesses'):
                sw_table = Table(show_header=True, box=None, padding=(0, 2))
                sw_table.add_column("강점 💪", style="green")
                sw_table.add_column("약점 ⚠️", style="red")

                max_rows = max(len(ai.get('strengths', [])), len(ai.get('weaknesses', [])))
                for i in range(max_rows):
                    strength = ai['strengths'][i] if i < len(ai.get('strengths', [])) else ""
                    weakness = ai['weaknesses'][i] if i < len(ai.get('weaknesses', [])) else ""
                    sw_table.add_row(strength, weakness)

                console.print(Panel(
                    sw_table,
                    title="[bold yellow]분석[/bold yellow]",
                    border_style="yellow",
                    expand=False
                ))

            if ai.get('recommendation'):
                rec = ai['recommendation']
                rec_color = "green" if "매수" in rec else ("red" if "매도" in rec else "yellow")
                console.print(Panel(
                    f"[{rec_color}]{rec}[/{rec_color}]",
                    title="[bold blue]💼 투자 의견[/bold blue]",
                    border_style="blue",
                    expand=False
                ))

            if ai.get('risks'):
                risk_text = "\n".join([f"• {risk}" for risk in ai['risks']])
                console.print(Panel(
                    risk_text,
                    title="[bold red]⚠️  리스크 요인[/bold red]",
                    border_style="red",
                    expand=False
                ))

            if ai.get('newsSentiment') and 'error' not in ai['newsSentiment']:
                ns = ai['newsSentiment']
                score = ns.get('score', 0)
                sentiment = ns.get('sentiment', 'neutral')

                score_color = "green" if score > 30 else ("red" if score < -30 else "yellow")
                sentiment_emoji = "😊" if sentiment == 'positive' else ("😟" if sentiment == 'negative' else "😐")

                sentiment_text = f"{sentiment_emoji} 감성 점수: [{score_color}]{score}[/{score_color}]\n"
                if ns.get('market_mood'):
                    sentiment_text += f"\n{ns['market_mood']}"

                console.print(Panel(
                    sentiment_text,
                    title="[bold magenta]📊 뉴스 감성 분석[/bold magenta]",
                    border_style="magenta",
                    expand=False
                ))

        elif ai.get('error'):
            console.print(Panel(
                f"[yellow]{ai['error']}[/yellow]",
                title="⚠️  AI 분석",
                border_style="yellow",
                expand=False
            ))


# ============================================================================
# 6. 메인 함수
# ============================================================================

def main():
    """메인 함수 - 대화형 CLI 인터페이스"""
    console = Console()
    console.print("[bold green]🚀 주식 정보 프로그램 (Standalone Edition)[/bold green]")
    console.print("보고 싶은 주식의 티커를 입력하세요 (예: AAPL, GOOG). '종료'를 입력하면 프로그램을 종료합니다.\n")

    # AI 분석 기능 안내
    if GEMINI_AVAILABLE:
        console.print("✅ [green]Gemini AI 분석 기능이 활성화되었습니다.[/green]")
    else:
        console.print("⚠️  [yellow]Gemini AI 분석 기능이 비활성화되었습니다.[/yellow]")
        console.print("    [dim].env 파일에 GEMINI_API_KEY를 설정하면 AI 분석을 사용할 수 있습니다.[/dim]\n")

    console.print("✅ [green]기술적 지표 기능이 활성화되었습니다.[/green]\n")

    while True:
        try:
            ticker_input = console.input("\n[bold yellow]티커 입력: [/bold yellow]").strip().upper()
            if not ticker_input:
                continue
            if ticker_input.lower() in ['exit', 'quit', '종료']:
                console.print("\n[bold green]프로그램을 종료합니다.[/bold green]")
                break

            date_input = console.input("[bold yellow]조회할 날짜 (YYYY-MM-DD) [실시간: Enter]: [/bold yellow]").strip()

            # AI 분석 활성화 여부 (실시간 데이터에만 적용)
            include_ai = False
            if not date_input and GEMINI_AVAILABLE:
                ai_input = console.input("[bold cyan]AI 분석을 포함하시겠습니까? (y/N): [/bold cyan]").strip().lower()
                include_ai = ai_input in ['y', 'yes', 'ㅛ']

            with console.status(f"[bold green]{ticker_input}의 데이터를 가져오는 중...[/bold green]"):
                data = get_stock_data(
                    ticker_input,
                    date_input if date_input else None,
                    include_technical=True,
                    include_news=True,
                    include_ai_analysis=include_ai
                )

            display_stock_data(data)

        except (KeyboardInterrupt, EOFError):
            console.print("\n[bold green]프로그램을 종료합니다.[/bold green]")
            sys.exit(0)
        except Exception as e:
            console.print(Panel(f"[bold red]알 수 없는 오류 발생: {e}[/bold red]", title="오류", border_style="red"))


if __name__ == "__main__":
    main()
