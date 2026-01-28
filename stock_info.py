import sys
import subprocess
import importlib.util
import requests

def install_and_import(package, import_name=None, version=""):
    """
    Checks if a library is installed, installs it if missing, and then imports it.
    """
    if import_name is None:
        import_name = package
    
    spec = importlib.util.find_spec(import_name)
    if spec is None:
        print(f"'{package}' 라이브러리를 찾을 수 없습니다. 설치를 시작합니다...")
        try:
            # Construct the installation command
            install_command = [sys.executable, "-m", "pip", "install", f"{package}{version}"]
            subprocess.check_call(install_command)
            
            # After installation, try to find the spec again
            spec = importlib.util.find_spec(import_name)
            if spec is None:
                raise ImportError(f"'{package}' 라이브러리를 설치했지만, 찾을 수 없습니다. Python 환경을 확인해주세요: {sys.executable}")
            
            print(f"'{package}' 라이브러리 설치가 완료되었습니다. 프로그램을 계속합니다.")
            # Dynamically import the module
            globals()[import_name] = importlib.import_module(import_name)

        except (subprocess.CalledProcessError, ImportError) as e:
            print(f"오류: {e}")
            print(f"'{package}' 라이브러리를 자동으로 설치하지 못했습니다.")
            print("수동으로 설치해주세요: pip install {package}{version}")
            sys.exit(1)

# Ensure required libraries are installed
install_and_import('yfinance', 'yfinance')
install_and_import('rich')
install_and_import('deep_translator')
install_and_import('pandas')
install_and_import('numpy')
install_and_import('yahooquery')

# Now, we can safely import them
import yfinance as yf
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from datetime import datetime, timedelta
from deep_translator import GoogleTranslator
import pandas as pd
import numpy as np
from yahooquery import Ticker

# 🆕 새로운 모듈 임포트 (옵션)
try:
    from technical_indicators import calculate_all_indicators
    TECHNICAL_AVAILABLE = True
except ImportError:
    TECHNICAL_AVAILABLE = False
    print("⚠️  technical_indicators.py를 찾을 수 없습니다. 기술적 지표 기능이 비활성화됩니다.")

try:
    from gemini_analyzer import GeminiAnalyzer
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    print("⚠️  gemini_analyzer.py를 찾을 수 없거나 Gemini API가 설정되지 않았습니다. AI 분석 기능이 비활성화됩니다.")


def get_stock_data(ticker_symbol, date_str=None, include_technical=True, include_news=True, include_ai_analysis=False):
    """
    Fetches stock data for a given ticker symbol, either current or for a specific date.

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
        # 1. 브라우저처럼 보이도록 헤더 설정
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        # 2. 세션 생성 및 헤더 주입
        session = requests.Session()
        session.headers.update(headers)
        ticker = yf.Ticker(ticker_symbol, session=session)
        
        if date_str:
            # Fetch historical data for the specified date
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
            # Fetch current data
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

                # 기존 재무 지표
                'roe': info.get('returnOnEquity'),
                'opm': info.get('operatingMargins'),
                'peg': info.get('pegRatio'),
                'pbr': info.get('priceToBook'),
                'debtToEquity': info.get('debtToEquity'),
                'fcf': info.get('freeCashflow'),
                'interestCoverage': 'N/A',

                # 🆕 배당 관련 지표
                'dividendYield': info.get('dividendYield'),
                'dividendRate': info.get('dividendRate'),
                'payoutRatio': info.get('payoutRatio'),

                # 🆕 수익성 지표
                'grossMargins': info.get('grossMargins'),
                'profitMargins': info.get('profitMargins'),
                'ebitdaMargins': info.get('ebitdaMargins'),

                # 🆕 밸류에이션 지표
                'trailingPE': info.get('trailingPE'),
                'forwardPE': info.get('forwardPE'),
                'priceToSales': info.get('priceToSalesTrailing12Months'),
                'enterpriseValue': info.get('enterpriseValue'),
                'enterpriseToRevenue': info.get('enterpriseToRevenue'),
                'enterpriseToEbitda': info.get('enterpriseToEbitda'),

                # 🆕 성장성 지표
                'revenueGrowth': info.get('revenueGrowth'),
                'earningsGrowth': info.get('earningsGrowth'),

                # 🆕 재무건전성 지표
                'currentRatio': info.get('currentRatio'),
                'quickRatio': info.get('quickRatio'),
                'totalCash': info.get('totalCash'),
                'totalDebt': info.get('totalDebt'),

                # 🆕 기타 지표
                'beta': info.get('beta'),
                'trailingEps': info.get('trailingEps'),
                'forwardEps': info.get('forwardEps'),
                'targetMeanPrice': info.get('targetMeanPrice'),
                'recommendationKey': info.get('recommendationKey'),

                'longBusinessSummary': info.get('longBusinessSummary'),
            }

            # 🆕 기술적 지표 계산 (실시간 데이터만)
            if include_technical and TECHNICAL_AVAILABLE and not date_str:
                try:
                    # 과거 가격 데이터 가져오기 (최근 200일)
                    hist = ticker.history(period="200d")
                    if not hist.empty:
                        technical_data = calculate_all_indicators(hist, ticker_symbol)
                        data['technical'] = technical_data
                    else:
                        data['technical'] = {'error': '과거 데이터가 없습니다.'}
                except Exception as e:
                    data['technical'] = {'error': f'기술적 지표 계산 실패: {str(e)}'}
            elif include_technical and not TECHNICAL_AVAILABLE:
                data['technical'] = {'error': 'technical_indicators 모듈을 로드할 수 없습니다.'}

            # 🆕 뉴스 수집 (실시간 데이터만)
            if include_news and not date_str:
                try:
                    news = ticker.news
                    if news:
                        # 최대 10개 뉴스만
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

            # 🆕 Gemini AI 분석 (실시간 데이터만, 요청 시에만)
            if include_ai_analysis and GEMINI_AVAILABLE and not date_str:
                try:
                    analyzer = GeminiAnalyzer()

                    # 재무 데이터 준비
                    financial_data = {k: v for k, v in data.items()
                                      if k not in ['ticker', 'longBusinessSummary', 'technical', 'news']}

                    # 가격 데이터 준비
                    price_data = {
                        'currentPrice': data.get('currentPrice'),
                        'marketCap': data.get('marketCap')
                    }

                    # AI 분석 수행
                    ai_analysis = analyzer.analyze_stock(
                        ticker=ticker_symbol,
                        price_data=price_data,
                        financial_data=financial_data,
                        technical_data=data.get('technical')
                    )
                    data['aiAnalysis'] = ai_analysis

                    # 뉴스 감성 분석
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
    

def get_stock_data_yahoo(ticker_symbol, date_str=None, include_technical=True, include_news=True, include_ai_analysis=False):
    """
    yahooquery를 사용하여 주식 데이터를 가져옵니다.
    """
    try:
        # Ticker 객체 생성 (yahooquery는 내부적으로 효율적인 세션을 관리합니다)
        t = Ticker(ticker_symbol)

        if date_str:
            # 1. 과거 특정 날짜 데이터 조회
            try:
                start_date = datetime.strptime(date_str, '%Y-%m-%d')
                end_date = start_date + timedelta(days=1)
                hist = t.history(start=start_date, end=end_date)

                if hist.empty or 'adjclose' not in hist.columns:
                    return {'error': f"'{ticker_symbol}'에 대한 '{date_str}'의 데이터가 없습니다."}

                info = hist.iloc[0]
                data = {
                    'ticker': ticker_symbol.upper(),
                    'date': date_str,
                    'open': info.get('open'),
                    'high': info.get('high'),
                    'low': info.get('low'),
                    'close': info.get('adjclose'),
                    'volume': info.get('volume'),
                }
            except ValueError:
                return {'error': "날짜 형식이 잘못되었습니다. 'YYYY-MM-DD' 형식으로 입력해주세요."}

        else:
            # 2. 실시간 및 상세 재무 데이터 조회 (한 번에 여러 모듈 요청)
            modules = 'financialData quoteType defaultKeyStatistics assetProfile summaryDetail'
            all_data = t.get_modules(modules)

            # yahooquery는 데이터를 못찾으면 티커 키 아래에 문자열 메시지를 반환함
            if ticker_symbol not in all_data or not isinstance(all_data.get(ticker_symbol), dict):
                return {'error': f"'{ticker_symbol}'에 대한 데이터를 찾을 수 없습니다. 유효한 티커인지 확인하세요."}

            info = all_data[ticker_symbol]

            # 데이터 추출용 헬퍼 (중첩 딕셔너리 안전 접근)
            fin_data = info.get('financialData', {})
            stats = info.get('defaultKeyStatistics', {})
            profile = info.get('assetProfile', {})
            summary = info.get('summaryDetail', {})

            data = {
                'ticker': ticker_symbol.upper(),
                'currentPrice': fin_data.get('currentPrice'),
                'open': summary.get('regularMarketOpen') or summary.get('open'),
                'high': summary.get('regularMarketDayHigh') or summary.get('dayHigh'),
                'low': summary.get('regularMarketDayLow') or summary.get('dayLow'),
                'volume': summary.get('regularMarketVolume') or summary.get('volume'),
                'marketCap': summary.get('marketCap'),

                # 기존 재무 지표 - yfinance와 키 맞춤
                'roe': fin_data.get('returnOnEquity'),
                'opm': fin_data.get('operatingMargins'),
                'peg': stats.get('pegRatio'),
                'pbr': stats.get('priceToBook'),
                'debtToEquity': fin_data.get('debtToEquity'),
                'fcf': stats.get('freeCashflow'), # yfinance는 info, yahooquery는 stats
                'interestCoverage': 'N/A', # yahooquery에서 직접 제공하지 않음

                # 배당 관련 지표
                'dividendYield': summary.get('dividendYield'),
                'dividendRate': summary.get('dividendRate'),
                'payoutRatio': stats.get('payoutRatio'), # yfinance는 info, yahooquery는 stats

                # 수익성 지표
                'grossMargins': fin_data.get('grossMargins'),
                'profitMargins': fin_data.get('profitMargins'),
                'ebitdaMargins': fin_data.get('ebitdaMargins'),

                # 밸류에이션 지표 - yfinance와 키 맞춤
                'trailingPE': summary.get('trailingPE'),
                'forwardPE': summary.get('forwardPE'),
                'priceToSales': summary.get('priceToSalesTrailing12Months'),
                'enterpriseValue': stats.get('enterpriseValue'),
                'enterpriseToRevenue': stats.get('enterpriseToRevenue'),
                'enterpriseToEbitda': stats.get('enterpriseToEbitda'),

                # 성장성 지표
                'revenueGrowth': fin_data.get('revenueGrowth'),
                'earningsGrowth': fin_data.get('earningsGrowth'),

                # 재무건전성 지표
                'currentRatio': fin_data.get('currentRatio'),
                'quickRatio': fin_data.get('quickRatio'),
                'totalCash': fin_data.get('totalCash'),
                'totalDebt': fin_data.get('totalDebt'),

                # 기타 지표 - yfinance와 키 맞춤
                'beta': stats.get('beta'),
                'trailingEps': stats.get('trailingEps'),
                'forwardEps': stats.get('forwardEps'),
                'targetMeanPrice': fin_data.get('targetMeanPrice'),
                'recommendationKey': fin_data.get('recommendationKey'),

                'longBusinessSummary': profile.get('longBusinessSummary'),
            }

            # 3. 기술적 지표 (200일 데이터)
            if include_technical and TECHNICAL_AVAILABLE and not date_str:
                try:
                    hist_200 = t.history(period="200d")
                    if not hist_200.empty:
                        # technical_indicators.py가 대문자 'Close'를 기대하므로 컬럼명 변경
                        hist_200.rename(columns={'close': 'Close'}, inplace=True)
                        technical_data = calculate_all_indicators(hist_200, ticker_symbol)
                        data['technical'] = technical_data
                    else:
                        data['technical'] = {'error': '과거 데이터가 없습니다.'}
                except Exception as e:
                    data['technical'] = {'error': f'기술적 지표 계산 실패: {str(e)}'}
            elif include_technical and not TECHNICAL_AVAILABLE:
                data['technical'] = {'error': 'technical_indicators 모듈을 로드할 수 없습니다.'}

            # 4. 뉴스 수집 (yahooquery의 news 메서드 사용)
            if include_news and not date_str:
                try:
                    news_items = t.news(count=10)
                    if news_items:
                        data['news'] = [{
                            'title': item.get('title', '제목 없음'),
                            'link': item.get('link', ''),
                            'publishedAt': item.get('providerPublishTime', ''),
                            'source': item.get('publisher', '알 수 없음')
                        } for item in news_items]
                    else:
                        data['news'] = []
                except Exception:
                    data['news'] = []

            # 5. Gemini AI 분석 (실시간 데이터만, 요청 시에만)
            if include_ai_analysis and GEMINI_AVAILABLE and not date_str:
                try:
                    analyzer = GeminiAnalyzer()
                    # 재무 데이터 준비
                    financial_data = {k: v for k, v in data.items()
                                      if k not in ['ticker', 'longBusinessSummary', 'technical', 'news']}
                    # 가격 데이터 준비
                    price_data = {
                        'currentPrice': data.get('currentPrice'),
                        'marketCap': data.get('marketCap')
                    }
                    # AI 분석 수행
                    ai_analysis = analyzer.analyze_stock(
                        ticker=ticker_symbol,
                        price_data=price_data,
                        financial_data=financial_data,
                        technical_data=data.get('technical')
                    )
                    data['aiAnalysis'] = ai_analysis
                    # 뉴스 감성 분석
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
        return {'error': f"데이터 수집 중 오류: {str(e)}"}

def display_stock_data(data):
    """
    Displays the fetched stock data in a formatted panel using rich.
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

        # 추천 등급 (색상 추가)
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

    if 'longBusinessSummary' in data and data['longBusinessSummary']:
        summary = data['longBusinessSummary']
        try:
            # deep_translator를 사용하여 자동 언어 감지 및 번역
            translator = GoogleTranslator(source='auto', target='ko')
            translated_summary = translator.translate(summary)

            # 번역이 원본과 다르면 번역된 것으로 표시
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

    # 🆕 기술적 지표 표시
    if 'technical' in data and data['technical']:
        tech = data['technical']
        if 'error' not in tech:
            tech_table = Table(show_header=False, box=None, padding=(0, 2))
            tech_table.add_column(style="magenta")
            tech_table.add_column(style="cyan")

            # RSI
            if 'rsi' in tech and tech['rsi'].get('rsi14'):
                rsi_value = tech['rsi']['rsi14']
                rsi_color = "green" if rsi_value < 30 else ("red" if rsi_value > 70 else "yellow")
                tech_table.add_row("RSI(14):", f"[{rsi_color}]{rsi_value:.2f}[/{rsi_color}]")

            # MACD
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

            # SMA
            if 'sma' in tech:
                sma_data = tech['sma']
                if sma_data.get('sma20'):
                    tech_table.add_row("SMA(20):", format_num(sma_data['sma20'], is_currency=True))
                if sma_data.get('sma50'):
                    tech_table.add_row("SMA(50):", format_num(sma_data['sma50'], is_currency=True))
                if sma_data.get('sma200'):
                    tech_table.add_row("SMA(200):", format_num(sma_data['sma200'], is_currency=True))

            # EMA
            if 'ema' in tech:
                ema_data = tech['ema']
                if ema_data.get('ema12'):
                    tech_table.add_row("EMA(12):", format_num(ema_data['ema12'], is_currency=True))
                if ema_data.get('ema26'):
                    tech_table.add_row("EMA(26):", format_num(ema_data['ema26'], is_currency=True))

            # Bollinger Bands
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

    # 🆕 뉴스 표시
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

    # 🆕 AI 분석 결과 표시
    if 'aiAnalysis' in data and data['aiAnalysis']:
        ai = data['aiAnalysis']

        if 'error' not in ai:
            # 종합 평가
            if ai.get('summary'):
                console.print(Panel(
                    ai['summary'],
                    title="[bold green]🤖 AI 종합 평가[/bold green]",
                    border_style="green",
                    expand=False
                ))

            # 강점 & 약점
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

            # 투자 의견
            if ai.get('recommendation'):
                rec = ai['recommendation']
                rec_color = "green" if "매수" in rec else ("red" if "매도" in rec else "yellow")
                console.print(Panel(
                    f"[{rec_color}]{rec}[/{rec_color}]",
                    title="[bold blue]💼 투자 의견[/bold blue]",
                    border_style="blue",
                    expand=False
                ))

            # 리스크 요인
            if ai.get('risks'):
                risk_text = "\n".join([f"• {risk}" for risk in ai['risks']])
                console.print(Panel(
                    risk_text,
                    title="[bold red]⚠️  리스크 요인[/bold red]",
                    border_style="red",
                    expand=False
                ))

            # 뉴스 감성 분석
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



def main():
    """
    Main function to run the stock information program.
    """
    console = Console()
    console.print("[bold green]🚀 실시간 주식 정보 프로그램 (Enhanced Edition)[/bold green]")
    console.print("보고 싶은 주식의 티커를 입력하세요 (예: AAPL, GOOG). '종료'를 입력하면 프로그램을 종료합니다.\n")

    # AI 분석 기능 안내
    if GEMINI_AVAILABLE:
        console.print("✅ [green]Gemini AI 분석 기능이 활성화되었습니다.[/green]")
    else:
        console.print("⚠️  [yellow]Gemini AI 분석 기능이 비활성화되었습니다.[/yellow]")
        console.print("    [dim].env 파일에 GEMINI_API_KEY를 설정하면 AI 분석을 사용할 수 있습니다.[/dim]\n")

    if TECHNICAL_AVAILABLE:
        console.print("✅ [green]기술적 지표 기능이 활성화되었습니다.[/green]\n")
    else:
        console.print("⚠️  [yellow]기술적 지표 기능이 비활성화되었습니다.[/yellow]\n")

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
                data = get_stock_data_yahoo(
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
