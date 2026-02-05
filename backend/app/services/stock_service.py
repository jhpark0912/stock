"""
주식 데이터 조회 서비스
"""
from yahooquery import Ticker
from datetime import datetime, timedelta
from deep_translator import GoogleTranslator
from typing import Dict, Tuple, List
import pandas as pd
import asyncio
from app.models.stock import (
    StockData, PriceInfo, FinancialsInfo, CompanyInfo, TechnicalIndicators,
    SMAInfo, EMAInfo, RSIInfo, MACDInfo, BollingerBandsInfo,
    NewsItem, AIAnalysis
)
import google.generativeai as genai
from app.config import settings
from app.services.mock_data import get_mock_stock_data
from app.services.technical_indicators import calculate_all_indicators, calculate_chart_data


class StockService:
    """주식 데이터 조회 서비스"""

    def __init__(self):
        """서비스 초기화 및 캐시 설정"""
        # 캐시 저장소: {ticker: (data, timestamp)}
        self._cache: Dict[str, Tuple[StockData, datetime]] = {}
        self._cache_ttl = timedelta(minutes=5)  # 5분 캐시
        
        # Gemini 초기화 (한 번만)
        self._gemini_initialized = False
        if settings.gemini_api_key:
            try:
                genai.configure(api_key=settings.gemini_api_key)
                self._gemini_initialized = True
            except Exception:
                pass  # 초기화 실패 시 사용 시점에 에러 발생  # 5분 캐시

    def get_stock_data(self, ticker_symbol: str, include_technical: bool = False, include_chart: bool = False) -> StockData:
        """
        주식 실시간 데이터 조회 (캐싱 적용)

        Args:
            ticker_symbol: 주식 티커 심볼 (예: AAPL, TSLA)
            include_technical: 기술적 지표 포함 여부 (기본값: False)
            include_chart: 차트 데이터 포함 여부 (기본값: False)

        Returns:
            StockData 객체

        Raises:
            ValueError: 유효하지 않은 티커이거나 데이터를 찾을 수 없는 경우
        """
        ticker_upper = ticker_symbol.upper()

        # Mock 데이터 모드 (429 에러 회피)
        if settings.use_mock_data:
            return get_mock_stock_data(ticker_upper)

        # 캐시 확인
        if ticker_upper in self._cache:
            cached_data, cached_time = self._cache[ticker_upper]
            if datetime.now() - cached_time < self._cache_ttl:
                return cached_data
            else:
                # 캐시 만료
                del self._cache[ticker_upper]

        # 새로운 데이터 조회
        try:

            # yahooquery Ticker 생성
            ticker = Ticker(ticker_upper)
            
            # 여러 모듈 한 번에 요청
            modules = 'financialData quoteType defaultKeyStatistics assetProfile summaryDetail'
            all_data = ticker.get_modules(modules)
            
            # yahooquery는 데이터를 못찾으면 티커 키 아래에 문자열 메시지를 반환함
            if ticker_upper not in all_data or not isinstance(all_data.get(ticker_upper), dict):
                raise ValueError(f"'{ticker_symbol}'에 대한 데이터를 찾을 수 없습니다. 유효한 티커인지 확인하세요.")
            
            info = all_data[ticker_upper]
            
            # 데이터 추출용 헬퍼 (중첩 딕셔너리 안전 접근)
            fin_data = info.get('financialData', {})
            stats = info.get('defaultKeyStatistics', {})
            profile = info.get('assetProfile', {})
            summary = info.get('summaryDetail', {})

            # 가격 정보 - current와 close 조회
            current_price = fin_data.get('currentPrice') or summary.get('regularMarketPrice')
            close_price = summary.get('regularMarketPreviousClose') or summary.get('previousClose')
            
            # current가 없으면 history에서 가장 최근 종가 조회
            if current_price is None:
                try:
                    history_df = ticker.history(period='5d')  # 최근 5일
                    if history_df is not None and not history_df.empty:
                        # 멀티인덱스 처리
                        if isinstance(history_df.index, pd.MultiIndex):
                            history_df = history_df.reset_index(level='symbol', drop=True)
                        # 가장 최근 종가
                        latest_close = history_df['close'].iloc[-1]
                        if pd.notna(latest_close):
                            current_price = float(latest_close)
                            if close_price is None:
                                close_price = current_price
                except Exception:
                    pass  # history 조회 실패 시 None 유지

            price = PriceInfo(
                current=current_price,
                open=summary.get('regularMarketOpen') or summary.get('open'),
                high=summary.get('regularMarketDayHigh') or summary.get('dayHigh'),
                low=summary.get('regularMarketDayLow') or summary.get('dayLow'),
                close=close_price,
                volume=summary.get('regularMarketVolume') or summary.get('volume'),
            )

            # 재무 지표
            financials = FinancialsInfo(
                # 밸류에이션
                trailing_pe=summary.get('trailingPE'),
                forward_pe=summary.get('forwardPE'),
                pbr=stats.get('priceToBook'),
                roe=fin_data.get('returnOnEquity'),
                opm=fin_data.get('operatingMargins'),
                peg=stats.get('pegRatio'),
                # 재무 건전성
                debt_to_equity=fin_data.get('debtToEquity'),
                current_ratio=fin_data.get('currentRatio'),
                quick_ratio=fin_data.get('quickRatio'),
                # 배당
                dividend_yield=summary.get('dividendYield'),
                payout_ratio=stats.get('payoutRatio'),
                # 성장성
                revenue_growth=fin_data.get('revenueGrowth'),
                earnings_growth=fin_data.get('earningsGrowth'),
            )

            # 회사 정보
            summary_original = profile.get('longBusinessSummary', '')
            summary_translated = self._translate_text(summary_original)

            company = CompanyInfo(
                name=info.get('longName') or info.get('shortName') or ticker_upper,
                sector=profile.get('sector'),
                industry=profile.get('industry'),
                summary_original=summary_original,
                summary_translated=summary_translated,
            )

            # 기술적 지표 계산 (옵션)
            technical_indicators = None
            if include_technical:
                try:
                    # 과거 1년 데이터 조회
                    history_df = ticker.history(period='1y')

                    if history_df is not None and not history_df.empty:
                        # calculate_all_indicators 호출
                        indicators_result = calculate_all_indicators(history_df, ticker_upper)

                        if 'error' not in indicators_result:
                            # Pydantic 모델로 변환
                            technical_indicators = TechnicalIndicators(
                                sma=SMAInfo(**indicators_result['sma']),
                                ema=EMAInfo(**indicators_result['ema']),
                                rsi=RSIInfo(**indicators_result['rsi']),
                                macd=MACDInfo(**indicators_result['macd']),
                                bollinger_bands=BollingerBandsInfo(**indicators_result['bollinger_bands'])
                            )
                except Exception as e:
                    pass

            # 차트 데이터 조회 (옵션)
            chart_data_list = None
            if include_chart:
                try:
                    chart_data_list = self.get_chart_data(ticker_upper, period="1y")
                except Exception as e:
                    pass

            # StockData 생성
            stock_data = StockData(
                ticker=ticker_upper,
                timestamp=datetime.now(),
                market_cap=summary.get('marketCap'),
                price=price,
                financials=financials,
                company=company,
                technical_indicators=technical_indicators,
                chart_data=chart_data_list,
            )

            # 캐시 저장
            self._cache[ticker_upper] = (stock_data, datetime.now())

            return stock_data

        except Exception as e:
            error_msg = str(e)

            # 429 에러 특별 처리
            if "429" in error_msg or "Too Many Requests" in error_msg:
                raise ValueError(
                    f"Yahoo Finance API 요청 제한 초과. "
                    f"잠시 후 다시 시도하거나 다른 티커를 조회해주세요."
                )

            raise ValueError(f"주식 데이터 조회 실패: {error_msg}")

    def get_chart_data(self, ticker_symbol: str, period: str = "2y") -> List[Dict]:
        """
        차트용 시계열 데이터 조회 (기술적 지표 포함)

        Args:
            ticker_symbol: 주식 티커 심볼
            period: 조회 기간 (예: "1y", "2y", "max")

        Returns:
            차트 데이터 리스트
        """
        ticker_upper = ticker_symbol.upper()
        try:
            ticker = Ticker(ticker_upper)
            history_df = ticker.history(period=period)

            if history_df.empty:
                raise ValueError(f"'{ticker_upper}'에 대한 과거 데이터를 찾을 수 없습니다.")

            # 멀티인덱스 DataFrame인 경우 인덱스 리셋
            if isinstance(history_df.index, pd.MultiIndex):
                history_df = history_df.reset_index(level='symbol', drop=True)

            chart_data = calculate_chart_data(history_df)

            return chart_data

        except Exception as e:
            error_msg = str(e)
            
            if "429" in error_msg or "Too Many Requests" in error_msg:
                raise ValueError(
                    f"Yahoo Finance API 요청 제한 초과. "
                    f"잠시 후 다시 시도하거나 다른 티커를 조회해주세요."
                )
            raise ValueError(f"차트 데이터 조회 실패: {error_msg}")

    def get_news(self, ticker_symbol: str) -> List[NewsItem]:
        """
        주식 뉴스 데이터 조회

        Args:
            ticker_symbol: 주식 티커 심볼 (예: AAPL, TSLA)

        Returns:
            NewsItem 객체 리스트
        """
        ticker_upper = ticker_symbol.upper()

        if settings.use_mock_data:
            # TODO: Add mock news data
            return []

        try:
            ticker = Ticker(ticker_upper)
            news_items_raw = ticker.news(count=10)

            if not news_items_raw or isinstance(news_items_raw, str):
                return []

            news_list = []
            for item in news_items_raw:
                if not isinstance(item, dict):
                    continue
                    
                published_at = None
                if item.get('providerPublishTime'):
                    try:
                        published_at = datetime.fromtimestamp(item['providerPublishTime'])
                    except (TypeError, ValueError):
                        pass # 날짜 변환 실패 시 None

                news_list.append(NewsItem(
                    title=item.get('title', '제목 없음'),
                    link=item.get('link', ''),
                    published_at=published_at,
                    source=item.get('publisher', '알 수 없음')
                ))
            return news_list

        except Exception as e:
            return []
            
    @staticmethod
    def _translate_text(text: str) -> str:
        """
        영어 텍스트를 한국어로 번역

        Args:
            text: 번역할 텍스트

        Returns:
            번역된 한국어 텍스트
        """
        if not text:
            return ""

        try:
            translator = GoogleTranslator(source='auto', target='ko')
            translated = translator.translate(text)
            return translated
        except Exception as e:
            return text  # 번역 실패 시 원본 반환

    async def get_comprehensive_analysis(self, stock_data: StockData) -> AIAnalysis:
        """
        Gemini AI를 사용하여 종합 주식 분석 보고서 생성
        
        타임아웃: 없음 (완료될 때까지 대기)
        """
        import logging
        import traceback
        logger = logging.getLogger(__name__)
        
        logger.info(f"[Gemini] 분석 시작: {stock_data.ticker}")
        
        if not settings.gemini_api_key:
            logger.error("[Gemini] API 키 없음")
            raise ValueError("Gemini API 키가 설정되지 않았습니다.")

        try:
            # Gemini 초기화 확인
            if not self._gemini_initialized:
                logger.info("[Gemini] 초기화 시도...")
                genai.configure(api_key=settings.gemini_api_key)
                self._gemini_initialized = True
                logger.info("[Gemini] 초기화 완료")
            
            logger.info("[Gemini] 모델 생성 중...")
            model = genai.GenerativeModel('models/gemini-flash-latest')
            logger.info("[Gemini] 모델 생성 완료")

            # 프롬프트에 필요한 데이터 포맷팅
            logger.info("[Gemini] 프롬프트 생성 중...")
            price_data_str = f"현재가: {stock_data.price.current}, 시가총액: {stock_data.market_cap}"
            financial_data_str = ", ".join([f"{k}: {v}" for k, v in stock_data.financials.dict().items() if v is not None])
            tech_data_str = "N/A"
            if stock_data.technical_indicators:
                tech_data_str = ", ".join([f"{k}: {v}" for k, v in stock_data.technical_indicators.dict(exclude_none=True).items()])

            prompt = f"""
### [System Role]
너는 20년 경력의 베테랑 주식 분석가이자 퀀트 투자 전문가야. 
제공된 데이터를 바탕으로 해당 종목에 대해 다각도의 심층 분석을 수행하고, 투자자가 의사결정을 내릴 수 있도록 객관적이고 통찰력 있는 보고서를 작성해줘.

### [Input Data]
- Ticker: {stock_data.ticker}
- 가격 및 시가총액: {price_data_str}
- 주요 재무 지표: {financial_data_str}
- 기술적 지표: {tech_data_str}

### [Task Guidelines]
다음 4가지 핵심 영역을 분석해줘:

1. **내재 가치 및 밸류에이션**: 현재 PER, PBR, PEG를 업종 평균과 비교했을 때 저평가/고평가 여부를 판단해줘. 특히 ROE와 이익 성장성 대비 현재 가격이 합리적인지 분석해.
2. **재무 건전성 및 수익성**: OPM(영업이익률)의 질과 부채비율, 당좌비율을 통해 위기 상황에서의 방어력을 평가해줘.
3. **기술적 차트 분석**: 제공된 기술적 지표를 바탕으로 현재가 매수 적기인지, 과매수 상태인지, 혹은 하락 추세인지 기술적 관점에서 조언해줘.
4. **종합 투자의견 및 리스크**: 위 데이터들을 종합하여 '매수/보유/관찰' 의견을 제시하고, 투자 시 반드시 주의해야 할 핵심 리스크 요인을 꼽아줘.

### [Output Format]
반드시 한국어로 작성하고, 가독성을 위해 마크다운(Markdown) 형식을 사용해줘. 전문 용어를 사용하되 초보자도 이해할 수 있게 쉬운 비유를 곁들여줘.
"""
            logger.info(f"[Gemini] 프롬프트 길이: {len(prompt)} 문자")
            
            # 블로킹 호출을 비동기로 감싸기
            def _generate():
                logger.info("[Gemini] API 호출 시작")
                try:
                    result = model.generate_content(prompt)
                    logger.info("[Gemini] API 호출 성공")
                    return result
                except Exception as e:
                    logger.error(f"[Gemini] API 호출 실패: {type(e).__name__}: {str(e)}")
                    logger.error(f"[Gemini] Traceback: {traceback.format_exc()}")
                    raise
            
            # 타임아웃 없이 완료될 때까지 대기
            logger.info("[Gemini] asyncio.to_thread 시작 (타임아웃: 없음)")
            try:
                response = await asyncio.to_thread(_generate)
                logger.info(f"[Gemini] 응답 받음, 길이: {len(response.text) if response.text else 0}")
                return AIAnalysis(report=response.text)
            except Exception as e:
                logger.error(f"[Gemini] asyncio 에러: {type(e).__name__}: {str(e)}")
                logger.error(f"[Gemini] Traceback: {traceback.format_exc()}")
                raise

        except ValueError as e:
            # ValueError는 그대로 전파
            logger.error(f"[Gemini] ValueError: {str(e)}")
            raise
        except Exception as e:
            error_msg = str(e)
            logger.error(f"[Gemini] 예상치 못한 에러: {type(e).__name__}: {error_msg}")
            logger.error(f"[Gemini] Full traceback: {traceback.format_exc()}")
            
            if "429" in error_msg or "quota" in error_msg.lower():
                raise ValueError(f"Gemini API 요청 제한 초과: {error_msg}")
            if "403" in error_msg or "permission" in error_msg.lower():
                raise ValueError(f"Gemini API 권한 오류: API 키를 확인해주세요. {error_msg}")
            if "401" in error_msg or "unauthorized" in error_msg.lower():
                raise ValueError(f"Gemini API 인증 오류: API 키가 유효하지 않습니다. {error_msg}")
            
            raise ValueError(f"Gemini AI 분석 중 오류 발생: {error_msg}")