"""
증시 마감 리뷰 서비스

한국/미국 증시 마감 데이터를 조회하여 통합된 리뷰 데이터를 제공합니다.
"""

import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from zoneinfo import ZoneInfo

from yahooquery import Ticker

from app.models.economic import (
    MarketReviewData,
    MarketIndexData,
    StockMoverData,
    MajorStockData,
    SectorPerformanceData,
    MarketReviewAI,
)

logger = logging.getLogger(__name__)

# 시간대 정의
KST = ZoneInfo("Asia/Seoul")
EST = ZoneInfo("America/New_York")
UTC = ZoneInfo("UTC")

# 캐시 저장소 (간단한 메모리 캐시)
_cache: Dict[str, Dict[str, Any]] = {}


def _get_cache_key(country: str, date_str: str) -> str:
    """캐시 키 생성"""
    return f"market_review:{country}:{date_str}"


def _is_cache_valid(cache_key: str) -> bool:
    """캐시 유효성 확인"""
    if cache_key not in _cache:
        return False
    
    cached_data = _cache[cache_key]
    expires_at = cached_data.get("expires_at")
    
    if expires_at is None:
        return False
    
    return datetime.now(UTC) < expires_at


def _get_cached_data(cache_key: str) -> Optional[Dict[str, Any]]:
    """캐시 데이터 조회"""
    if _is_cache_valid(cache_key):
        return _cache[cache_key]
    return None


def _set_cache(cache_key: str, data: Dict[str, Any], ttl_seconds: int):
    """캐시 저장"""
    _cache[cache_key] = {
        "data": data,
        "expires_at": datetime.now(UTC) + timedelta(seconds=ttl_seconds),
        "cached_at": datetime.now(UTC).isoformat(),
    }


def is_kr_market_closed() -> bool:
    """한국 증시 마감 여부 확인 (15:30 KST 이후)"""
    now_kst = datetime.now(KST)
    market_close = now_kst.replace(hour=15, minute=30, second=0, microsecond=0)
    return now_kst >= market_close


def is_us_market_closed() -> bool:
    """미국 증시 마감 여부 확인 (16:00 EST 이후)"""
    now_est = datetime.now(EST)
    market_close = now_est.replace(hour=16, minute=0, second=0, microsecond=0)
    return now_est >= market_close


def get_cache_ttl(country: str) -> int:
    """
    캐시 TTL 계산
    - 장 마감 전: 5분
    - 장 마감 후: 다음 거래일 장 시작까지 (최대 18시간)
    """
    if country == "kr":
        if is_kr_market_closed():
            # 다음 거래일 09:00 KST까지
            now_kst = datetime.now(KST)
            next_open = now_kst.replace(hour=9, minute=0, second=0, microsecond=0)
            if now_kst.hour >= 9:
                next_open += timedelta(days=1)
            # 주말 건너뛰기
            while next_open.weekday() >= 5:  # 토요일(5), 일요일(6)
                next_open += timedelta(days=1)
            ttl = int((next_open - now_kst).total_seconds())
            return min(ttl, 64800)  # 최대 18시간
        else:
            return 300  # 5분
    else:  # us
        if is_us_market_closed():
            # 다음 거래일 09:30 EST까지
            now_est = datetime.now(EST)
            next_open = now_est.replace(hour=9, minute=30, second=0, microsecond=0)
            if now_est.hour >= 9 or (now_est.hour == 9 and now_est.minute >= 30):
                next_open += timedelta(days=1)
            # 주말 건너뛰기
            while next_open.weekday() >= 5:
                next_open += timedelta(days=1)
            ttl = int((next_open - now_est).total_seconds())
            return min(ttl, 64800)  # 최대 18시간
        else:
            return 300  # 5분


async def get_kr_indices() -> List[MarketIndexData]:
    """한국 주요 지수 조회 (KOSPI, KOSDAQ)"""
    try:
        symbols = ["^KS11", "^KQ11"]
        names = {"^KS11": "KOSPI", "^KQ11": "KOSDAQ"}
        
        ticker = Ticker(symbols)
        data = ticker.price
        
        indices = []
        for symbol in symbols:
            if symbol in data and isinstance(data[symbol], dict):
                info = data[symbol]
                indices.append(MarketIndexData(
                    symbol=symbol,
                    name=names.get(symbol, symbol),
                    close=info.get("regularMarketPrice", 0),
                    change=info.get("regularMarketChange", 0),
                    change_percent=info.get("regularMarketChangePercent", 0) * 100,
                    open=info.get("regularMarketOpen"),
                    high=info.get("regularMarketDayHigh"),
                    low=info.get("regularMarketDayLow"),
                    volume=info.get("regularMarketVolume"),
                    prev_close=info.get("regularMarketPreviousClose"),
                ))
        
        return indices
    except Exception as e:
        logger.error(f"한국 지수 조회 실패: {e}")
        return []


async def get_us_indices() -> List[MarketIndexData]:
    """미국 주요 지수 조회 (S&P 500, NASDAQ, DOW)"""
    try:
        symbols = ["^GSPC", "^IXIC", "^DJI"]
        names = {"^GSPC": "S&P 500", "^IXIC": "NASDAQ", "^DJI": "DOW"}
        
        ticker = Ticker(symbols)
        data = ticker.price
        
        indices = []
        for symbol in symbols:
            if symbol in data and isinstance(data[symbol], dict):
                info = data[symbol]
                indices.append(MarketIndexData(
                    symbol=symbol,
                    name=names.get(symbol, symbol),
                    close=info.get("regularMarketPrice", 0),
                    change=info.get("regularMarketChange", 0),
                    change_percent=info.get("regularMarketChangePercent", 0) * 100,
                    open=info.get("regularMarketOpen"),
                    high=info.get("regularMarketDayHigh"),
                    low=info.get("regularMarketDayLow"),
                    volume=info.get("regularMarketVolume"),
                    prev_close=info.get("regularMarketPreviousClose"),
                ))
        
        return indices
    except Exception as e:
        logger.error(f"미국 지수 조회 실패: {e}")
        return []


async def get_kr_top_movers(
    kis_app_key: Optional[str] = None,
    kis_app_secret: Optional[str] = None
) -> tuple[List[StockMoverData], List[StockMoverData]]:
    """
    한국 급등/급락 종목 Top 5 조회 (KIS Open API)
    
    Args:
        kis_app_key: KIS App Key
        kis_app_secret: KIS App Secret
        
    Returns:
        (급등 Top 5, 급락 Top 5)
        KIS 키 없으면 빈 배열 반환
    """
    # KIS API 자격 증명이 없으면 빈 배열 반환
    if not kis_app_key or not kis_app_secret:
        logger.debug("KIS API 자격 증명 없음 - 급등/급락 Top 5 조회 불가")
        return [], []
    
    try:
        from app.services.kis_api_service import get_fluctuation_ranking

        logger.debug("[MarketReview] KIS API로 등락률 순위 조회")
        kis_gainers, kis_losers = await get_fluctuation_ranking(
            app_key=kis_app_key,
            app_secret=kis_app_secret,
            market="ALL",
            limit=5
        )

        # KIS 데이터를 StockMoverData로 변환
        gainers = [
            StockMoverData(
                rank=g.rank if g.rank > 0 else idx + 1,
                symbol=g.symbol,
                name=g.name,
                price=g.price,
                change_percent=g.change_percent,
                volume=g.volume if g.volume > 0 else None,
            )
            for idx, g in enumerate(kis_gainers)
        ]

        losers = [
            StockMoverData(
                rank=l.rank if l.rank > 0 else idx + 1,
                symbol=l.symbol,
                name=l.name,
                price=l.price,
                change_percent=l.change_percent,
                volume=l.volume if l.volume > 0 else None,
            )
            for idx, l in enumerate(kis_losers)
        ]

        logger.debug(f"[MarketReview] KIS API 조회 성공: 상승 {len(gainers)}개, 하락 {len(losers)}개")
        return gainers, losers

    except Exception as e:
        logger.error(f"한국 급등/급락 종목 조회 실패: {e}")
        return [], []

        # 등락률 계산 (이미 포함되어 있지 않은 경우)
        if "등락률" not in df.columns:
            df["등락률"] = ((df["종가"] - df["시가"]) / df["시가"] * 100).round(2)

        # 급등주 Top 5
        gainers_df = df.nlargest(5, "등락률")
        gainers = []
        for rank, (ticker, row) in enumerate(gainers_df.iterrows(), 1):
            try:
                name = stock.get_market_ticker_name(ticker)
            except Exception:
                name = ticker
            gainers.append(StockMoverData(
                rank=rank,
                symbol=ticker,
                name=name,
                price=row["종가"],
                change_percent=row["등락률"],
                volume=int(row["거래량"]) if "거래량" in row else None,
            ))

        # 급락주 Top 5
        losers_df = df.nsmallest(5, "등락률")
        losers = []
        for rank, (ticker, row) in enumerate(losers_df.iterrows(), 1):
            try:
                name = stock.get_market_ticker_name(ticker)
            except Exception:
                name = ticker
            losers.append(StockMoverData(
                rank=rank,
                symbol=ticker,
                name=name,
                price=row["종가"],
                change_percent=row["등락률"],
                volume=int(row["거래량"]) if "거래량" in row else None,
            ))

        return gainers, losers
    except ImportError:
        logger.warning("pykrx 라이브러리가 설치되지 않음")
        return [], []
    except Exception as e:
        logger.error(f"한국 급등/급락 종목 조회 실패: {e}")
        return [], []


async def get_us_top_movers() -> tuple[List[StockMoverData], List[StockMoverData]]:
    """
    미국 급등/급락 종목 Top 5 조회
    Yahoo Finance Screener API 사용
    """
    try:
        from yahooquery import Screener
        
        s = Screener()
        
        # 급등주 조회
        gainers = []
        try:
            gainers_result = s.get_screeners('day_gainers', count=5)
            if 'day_gainers' in gainers_result and 'quotes' in gainers_result['day_gainers']:
                for rank, stock in enumerate(gainers_result['day_gainers']['quotes'][:5], 1):
                    gainers.append(StockMoverData(
                        rank=rank,
                        symbol=stock.get('symbol', ''),
                        name=stock.get('shortName', stock.get('symbol', '')),
                        price=stock.get('regularMarketPrice', 0),
                        change_percent=stock.get('regularMarketChangePercent', 0),
                        volume=stock.get('regularMarketVolume'),
                    ))
        except Exception as e:
            logger.warning(f"미국 급등주 조회 실패: {e}")
        
        # 급락주 조회
        losers = []
        try:
            losers_result = s.get_screeners('day_losers', count=5)
            if 'day_losers' in losers_result and 'quotes' in losers_result['day_losers']:
                for rank, stock in enumerate(losers_result['day_losers']['quotes'][:5], 1):
                    losers.append(StockMoverData(
                        rank=rank,
                        symbol=stock.get('symbol', ''),
                        name=stock.get('shortName', stock.get('symbol', '')),
                        price=stock.get('regularMarketPrice', 0),
                        change_percent=stock.get('regularMarketChangePercent', 0),
                        volume=stock.get('regularMarketVolume'),
                    ))
        except Exception as e:
            logger.warning(f"미국 급락주 조회 실패: {e}")
        
        logger.debug(f"미국 급등/급락 종목 조회 완료: 상승 {len(gainers)}개, 하락 {len(losers)}개")
        return gainers, losers
        
    except Exception as e:
        logger.error(f"미국 급등/급락 종목 조회 실패: {e}")
        return [], []


async def get_kr_major_stocks(
    kis_app_key: Optional[str] = None,
    kis_app_secret: Optional[str] = None
) -> tuple[List[MajorStockData], List[MajorStockData]]:
    """한국 시가총액 Top 5 종목 조회 (KOSPI, KOSDAQ 각각)
    
    KIS Open API 사용
    
    Args:
        kis_app_key: KIS App Key
        kis_app_secret: KIS App Secret
        
    Returns:
        (KOSPI Top 5, KOSDAQ Top 5)
    """
    # KIS API 자격 증명이 없으면 빈 배열 반환
    if not kis_app_key or not kis_app_secret:
        logger.debug("KIS API 자격 증명 없음 - 시총 Top 5 조회 불가")
        return [], []
    
    try:
        from app.services.kis_api_service import get_market_cap_ranking
        
        # KOSPI, KOSDAQ 병렬 조회
        import asyncio
        kospi_task = get_market_cap_ranking(kis_app_key, kis_app_secret, "KOSPI", 5)
        kosdaq_task = get_market_cap_ranking(kis_app_key, kis_app_secret, "KOSDAQ", 5)
        
        kospi_result, kosdaq_result = await asyncio.gather(kospi_task, kosdaq_task)
        
        # KISMarketCapStock -> MajorStockData 변환
        kospi_stocks = [
            MajorStockData(
                rank=stock.rank,
                symbol=stock.symbol,
                name=stock.name,
                price=stock.price,
                change_percent=stock.change_percent,
                market_cap=stock.market_cap,
            )
            for stock in kospi_result
        ]
        
        kosdaq_stocks = [
            MajorStockData(
                rank=stock.rank,
                symbol=stock.symbol,
                name=stock.name,
                price=stock.price,
                change_percent=stock.change_percent,
                market_cap=stock.market_cap,
            )
            for stock in kosdaq_result
        ]
        
        logger.debug(f"한국 시총 Top 5 조회 완료: KOSPI {len(kospi_stocks)}개, KOSDAQ {len(kosdaq_stocks)}개")
        return kospi_stocks, kosdaq_stocks
        
    except Exception as e:
        logger.error(f"한국 시총 상위 종목 조회 실패: {e}")
        return [], []


async def get_us_major_stocks() -> List[MajorStockData]:
    """미국 시가총액 Top 5 종목 조회"""
    try:
        # S&P 500 시총 상위 종목
        symbols = ["AAPL", "MSFT", "GOOGL", "AMZN", "NVDA", "META", "TSLA", "BRK-B", "UNH", "JNJ"]
        
        ticker = Ticker(symbols)
        data = ticker.price
        summary = ticker.summary_detail
        
        stocks = []
        for symbol in symbols:
            if symbol in data and isinstance(data[symbol], dict):
                info = data[symbol]
                market_cap = 0
                if symbol in summary and isinstance(summary[symbol], dict):
                    market_cap = summary[symbol].get("marketCap", 0) / 1_000_000  # 백만달러
                
                stocks.append({
                    "symbol": symbol,
                    "name": info.get("shortName", symbol),
                    "price": info.get("regularMarketPrice", 0),
                    "change_percent": info.get("regularMarketChangePercent", 0) * 100,
                    "market_cap": market_cap,
                })
        
        # 시총 기준 정렬
        stocks.sort(key=lambda x: x["market_cap"], reverse=True)
        
        major_stocks = []
        for rank, stock in enumerate(stocks[:5], 1):
            major_stocks.append(MajorStockData(
                rank=rank,
                symbol=stock["symbol"],
                name=stock["name"],
                price=stock["price"],
                change_percent=round(stock["change_percent"], 2),
                market_cap=stock["market_cap"],
            ))
        
        return major_stocks
    except Exception as e:
        logger.error(f"미국 시총 상위 종목 조회 실패: {e}")
        return []


async def get_kr_sector_performance() -> List[SectorPerformanceData]:
    """한국 섹터 등락률 조회 (섹터 ETF 기반)"""
    try:
        # 한국 섹터 ETF
        sector_etfs = {
            "091160.KS": ("반도체", "SK하이닉스"),
            "091170.KS": ("자동차", "현대차"),
            "091180.KS": ("건설", "대우건설"),
            "091220.KS": ("화학", "LG화학"),
            "091230.KS": ("철강", "포스코"),
            "244580.KS": ("헬스케어", "삼성바이오"),
            "091210.KS": ("금융", "KB금융"),
            "091200.KS": ("에너지", "SK이노베이션"),
        }
        
        symbols = list(sector_etfs.keys())
        ticker = Ticker(symbols)
        data = ticker.price
        
        sectors = []
        for symbol, (sector_name, top_stock) in sector_etfs.items():
            if symbol in data and isinstance(data[symbol], dict):
                info = data[symbol]
                change_pct = info.get("regularMarketChangePercent", 0) * 100
                sectors.append(SectorPerformanceData(
                    sector=sector_name,
                    change_percent=round(change_pct, 2),
                    top_stock=top_stock,
                ))
        
        # 등락률 기준 정렬
        sectors.sort(key=lambda x: x.change_percent, reverse=True)
        return sectors
    except Exception as e:
        logger.error(f"한국 섹터 등락률 조회 실패: {e}")
        return []


async def get_us_sector_performance() -> List[SectorPerformanceData]:
    """미국 섹터 등락률 조회 (섹터 ETF 기반)"""
    try:
        # 미국 섹터 ETF (SPDR)
        sector_etfs = {
            "XLK": ("Technology", "MSFT"),
            "XLV": ("Healthcare", "UNH"),
            "XLF": ("Financials", "JPM"),
            "XLE": ("Energy", "XOM"),
            "XLI": ("Industrials", "BA"),
            "XLY": ("Consumer Discretionary", "TSLA"),
            "XLP": ("Consumer Staples", "PG"),
            "XLU": ("Utilities", "NEE"),
            "XLC": ("Communication", "META"),
            "XLRE": ("Real Estate", "AMT"),
            "XLB": ("Materials", "LIN"),
        }
        
        symbols = list(sector_etfs.keys())
        ticker = Ticker(symbols)
        data = ticker.price
        
        sectors = []
        for symbol, (sector_name, top_stock) in sector_etfs.items():
            if symbol in data and isinstance(data[symbol], dict):
                info = data[symbol]
                change_pct = info.get("regularMarketChangePercent", 0) * 100
                sectors.append(SectorPerformanceData(
                    sector=sector_name,
                    change_percent=round(change_pct, 2),
                    top_stock=top_stock,
                ))
        
        # 등락률 기준 정렬
        sectors.sort(key=lambda x: x.change_percent, reverse=True)
        return sectors
    except Exception as e:
        logger.error(f"미국 섹터 등락률 조회 실패: {e}")
        return []


async def get_kr_market_review(
    kis_app_key: Optional[str] = None,
    kis_app_secret: Optional[str] = None
) -> MarketReviewData:
    """
    한국 증시 마감 리뷰 데이터 통합 조회

    Args:
        kis_app_key: KIS App Key (급등/급락 조회용)
        kis_app_secret: KIS App Secret (급등/급락 조회용)
    """
    now_kst = datetime.now(KST)
    date_str = now_kst.strftime("%Y-%m-%d")
    cache_key = _get_cache_key("kr", date_str)

    # 캐시 확인
    cached = _get_cached_data(cache_key)
    if cached:
        logger.debug(f"캐시된 한국 마감 리뷰 반환: {date_str}")
        return MarketReviewData(**cached["data"])

    logger.debug("한국 증시 마감 리뷰 데이터 조회 시작")

    # 병렬 조회
    indices = await get_kr_indices()
    gainers, losers = await get_kr_top_movers(kis_app_key, kis_app_secret)
    kospi_stocks, kosdaq_stocks = await get_kr_major_stocks(kis_app_key, kis_app_secret)
    sectors = await get_kr_sector_performance()

    review_data = MarketReviewData(
        country="kr",
        date=date_str,
        market_close_time="15:30 KST",
        is_market_closed=is_kr_market_closed(),
        indices=indices,
        top_gainers=gainers,
        top_losers=losers,
        major_stocks_kospi=kospi_stocks,
        major_stocks_kosdaq=kosdaq_stocks,
        sector_performance=sectors,
    )

    # 캐시 저장
    ttl = get_cache_ttl("kr")
    _set_cache(cache_key, review_data.model_dump(), ttl)
    logger.debug(f"한국 마감 리뷰 캐시 저장 (TTL: {ttl}초)")

    return review_data


async def get_us_market_review() -> MarketReviewData:
    """미국 증시 마감 리뷰 데이터 통합 조회"""
    now_est = datetime.now(EST)
    date_str = now_est.strftime("%Y-%m-%d")
    cache_key = _get_cache_key("us", date_str)
    
    # 캐시 확인
    cached = _get_cached_data(cache_key)
    if cached:
        logger.debug(f"캐시된 미국 마감 리뷰 반환: {date_str}")
        return MarketReviewData(**cached["data"])
    
    logger.debug("미국 증시 마감 리뷰 데이터 조회 시작")
    
    # 병렬 조회
    indices = await get_us_indices()
    gainers, losers = await get_us_top_movers()
    major_stocks = await get_us_major_stocks()
    sectors = await get_us_sector_performance()
    
    review_data = MarketReviewData(
        country="us",
        date=date_str,
        market_close_time="16:00 EST",
        is_market_closed=is_us_market_closed(),
        indices=indices,
        top_gainers=gainers,
        top_losers=losers,
        major_stocks=major_stocks,
        sector_performance=sectors,
    )
    
    # 캐시 저장
    ttl = get_cache_ttl("us")
    _set_cache(cache_key, review_data.model_dump(), ttl)
    logger.debug(f"미국 마감 리뷰 캐시 저장 (TTL: {ttl}초)")
    
    return review_data


async def get_market_review(
    country: str,
    kis_app_key: Optional[str] = None,
    kis_app_secret: Optional[str] = None
) -> MarketReviewData:
    """
    증시 마감 리뷰 데이터 조회 (통합 진입점)

    Args:
        country: 국가 코드 ("kr" 또는 "us")
        kis_app_key: KIS App Key (한국 급등/급락 조회용)
        kis_app_secret: KIS App Secret (한국 급등/급락 조회용)
    """
    if country == "kr":
        return await get_kr_market_review(kis_app_key, kis_app_secret)
    elif country == "us":
        return await get_us_market_review()
    else:
        raise ValueError(f"지원하지 않는 국가: {country}")


async def generate_market_review_ai(
    data: MarketReviewData,
    api_key: str,
) -> MarketReviewAI:
    """
    AI 마감 리뷰 분석 생성
    
    Gemini API를 사용하여 시장 데이터를 분석하고
    오늘의 포인트, 섹터 인사이트, 내일 전망을 생성합니다.
    """
    try:
        import google.generativeai as genai
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("models/gemini-flash-latest")
        
        # 프롬프트 구성
        country_name = "한국" if data.country == "kr" else "미국"
        
        indices_text = "\n".join([
            f"- {idx.name}: {idx.close:,.2f} ({'+' if idx.change_percent > 0 else ''}{idx.change_percent:.2f}%)"
            for idx in data.indices
        ])
        
        gainers_text = "\n".join([
            f"- {g.name}: {'+' if g.change_percent > 0 else ''}{g.change_percent:.2f}%"
            for g in data.top_gainers[:3]
        ])
        
        losers_text = "\n".join([
            f"- {l.name}: {l.change_percent:.2f}%"
            for l in data.top_losers[:3]
        ])
        
        sectors_text = "\n".join([
            f"- {s.sector}: {'+' if s.change_percent > 0 else ''}{s.change_percent:.2f}%"
            for s in data.sector_performance[:5]
        ])
        
        prompt = f"""
        당신은 20년 경력의 증권사 리서치센터장입니다. 
        탑다운 분석의 대가이며, 데이터를 단순 나열하지 않고 그 이면의 시장 흐름과 수급의 맥락을 읽어내는 데 탁월합니다. 
        오늘 제공된 {country_name} 증시 마감 데이터를 바탕으로, 개인 투자자가 시장의 핵심을 직관적으로 이해할 수 있도록 브리핑 리포트를 작성해주세요.

        데이터 영역: 지수: {indices_text} 급등주 Top 3: {gainers_text} 급락주 Top 3: {losers_text} 주요 섹터 등락: {sectors_text}

        작성 지침:

        데이터를 그대로 나열하지 마세요.

        지수, 급등락 종목, 섹터 간의 연관성을 찾아 하나의 스토리로 엮어주세요.

        총 300자 내외로, 다음 3가지 항목을 반드시 포함하여 한국어로 작성하세요.

        출력 형식: 
        오늘의 포인트 (지수 흐름과 급등락주의 공통점을 엮어서 오늘 시장의 성격을 1에서 2문장으로 정의)
        섹터 인사이트 (가장 눈에 띄는 섹터의 상승 또는 하락 배경과 이것이 의미하는 바를 1문장으로 요약)
        내일 전망 (오늘의 흐름을 바탕으로 내일 장에서 투자자가 집중해야 할 핵심 변수 1문장 제시)
        """
        
        # 60초 타임아웃 적용
        def _generate():
            return model.generate_content(prompt)

        response = await asyncio.wait_for(
            asyncio.to_thread(_generate),
            timeout=60.0  # 1분 타임아웃
        )
        text = response.text
        
        # 파싱
        summary = ""
        sector_insight = ""
        tomorrow_outlook = ""
        
        if "오늘의 포인트" in text:
            parts = text.split("**오늘의 포인트**")
            if len(parts) > 1:
                summary_part = parts[1].split("**")[0].strip()
                summary = summary_part.replace("\n", " ").strip()
        
        if "섹터 인사이트" in text:
            parts = text.split("**섹터 인사이트**")
            if len(parts) > 1:
                insight_part = parts[1].split("**")[0].strip()
                sector_insight = insight_part.replace("\n", " ").strip()
        
        if "내일 전망" in text:
            parts = text.split("**내일 전망**")
            if len(parts) > 1:
                outlook_part = parts[1].strip()
                tomorrow_outlook = outlook_part.replace("\n", " ").strip()
        
        return MarketReviewAI(
            summary=summary or text[:200],
            sector_insight=sector_insight or None,
            tomorrow_outlook=tomorrow_outlook or None,
            generated_at=datetime.now(UTC).isoformat(),
        )
    except asyncio.TimeoutError:
        logger.error("AI 마감 리뷰 생성 타임아웃: 60초 내에 응답을 받지 못했습니다")
        raise ValueError("AI 마감 리뷰 생성 시간이 초과되었습니다 (60초). 잠시 후 다시 시도해주세요.")
    except Exception as e:
        logger.error(f"AI 마감 리뷰 생성 실패: {e}")
        raise
