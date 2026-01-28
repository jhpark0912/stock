"""
주식 데이터 조회 서비스
"""
from yahooquery import Ticker
from datetime import datetime, timedelta
from deep_translator import GoogleTranslator
from typing import Dict, Tuple
from app.models.stock import (
    StockData, PriceInfo, FinancialsInfo, CompanyInfo
)
from app.config import settings
from app.services.mock_data import get_mock_stock_data


class StockService:
    """주식 데이터 조회 서비스"""

    # 캐시 저장소: {ticker: (data, timestamp)}
    _cache: Dict[str, Tuple[StockData, datetime]] = {}
    _cache_ttl = timedelta(minutes=5)  # 5분 캐시

    @classmethod
    def get_stock_data(cls, ticker_symbol: str) -> StockData:
        """
        주식 실시간 데이터 조회 (캐싱 적용)

        Args:
            ticker_symbol: 주식 티커 심볼 (예: AAPL, TSLA)

        Returns:
            StockData 객체

        Raises:
            ValueError: 유효하지 않은 티커이거나 데이터를 찾을 수 없는 경우
        """
        ticker_upper = ticker_symbol.upper()

        # Mock 데이터 모드 (429 에러 회피)
        if settings.use_mock_data:
            print(f"🎭 Mock 데이터 사용: {ticker_upper}")
            return get_mock_stock_data(ticker_upper)

        # 캐시 확인
        if ticker_upper in cls._cache:
            cached_data, cached_time = cls._cache[ticker_upper]
            if datetime.now() - cached_time < cls._cache_ttl:
                print(f"✅ 캐시에서 반환: {ticker_upper}")
                return cached_data
            else:
                # 캐시 만료
                del cls._cache[ticker_upper]

        # 새로운 데이터 조회
        try:
            print(f"🔄 API 호출: {ticker_upper}")

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

            # 가격 정보
            price = PriceInfo(
                current=fin_data.get('currentPrice'),
                open=summary.get('regularMarketOpen') or summary.get('open'),
                high=summary.get('regularMarketDayHigh') or summary.get('dayHigh'),
                low=summary.get('regularMarketDayLow') or summary.get('dayLow'),
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
            summary_translated = cls._translate_text(summary_original)

            company = CompanyInfo(
                name=info.get('longName') or info.get('shortName') or ticker_upper,
                sector=profile.get('sector'),
                industry=profile.get('industry'),
                summary_original=summary_original,
                summary_translated=summary_translated,
            )

            # StockData 생성
            stock_data = StockData(
                ticker=ticker_upper,
                timestamp=datetime.now(),
                market_cap=summary.get('marketCap'),
                price=price,
                financials=financials,
                company=company,
            )

            # 캐시 저장
            cls._cache[ticker_upper] = (stock_data, datetime.now())
            print(f"💾 캐시에 저장: {ticker_upper}")

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
            print(f"번역 실패: {e}")
            return text  # 번역 실패 시 원본 반환
