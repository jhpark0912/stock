"""
섹터 ETF 데이터 서비스
GICS 11개 섹터 ETF의 성과 데이터 조회
"""

import logging
import json
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
import time

try:
    from yahooquery import Ticker
    YAHOOQUERY_AVAILABLE = True
except ImportError:
    YAHOOQUERY_AVAILABLE = False

from app.database.connection import SessionLocal
from app.database.models import SectorHoldingsCacheDB

logger = logging.getLogger(__name__)

# 캐시 만료 시간 (초)
CACHE_TTL_SECTORS = 300       # 5분 (섹터 변화율) - 메모리 캐시
CACHE_TTL_HOLDINGS = 86400    # 24시간 (보유 종목 상세) - 메모리 캐시

# 미국 동부 시간대
ET_TIMEZONE = ZoneInfo("America/New_York")

# 캐시 저장소
_sector_cache: Dict[str, Dict[str, Any]] = {}


def _get_cache(key: str) -> Optional[Any]:
    """캐시에서 데이터 조회"""
    if key in _sector_cache:
        cached = _sector_cache[key]
        if time.time() < cached['expires']:
            logger.debug(f"섹터 캐시 히트: {key}")
            return cached['data']
        else:
            logger.debug(f"섹터 캐시 만료: {key}")
            del _sector_cache[key]
    return None


def _set_cache(key: str, data: Any, ttl: int):
    """캐시에 데이터 저장"""
    _sector_cache[key] = {
        'data': data,
        'expires': time.time() + ttl
    }
    logger.debug(f"섹터 캐시 저장: {key} (TTL: {ttl}s)")


# ============================================
# DB 캐시 함수 (보유 종목 - 장 마감 기준 갱신)
# ============================================

def _should_refresh_holdings_cache(last_updated: datetime) -> bool:
    """
    보유 종목 캐시 갱신 필요 여부 확인
    기준: 마지막 갱신 이후 미국 장 마감(ET 16:00)이 있었는지
    
    Args:
        last_updated: UTC timezone-naive datetime (DB 저장 형식)
    
    Returns:
        갱신 필요 시 True
    """
    # 현재 미국 동부 시간
    now_et = datetime.now(ET_TIMEZONE)
    
    # DB의 UTC 시간을 ET로 변환
    last_updated_utc = last_updated.replace(tzinfo=ZoneInfo("UTC"))
    last_updated_et = last_updated_utc.astimezone(ET_TIMEZONE)
    
    # 오늘 장 마감 시간 (ET 16:00)
    today_close = now_et.replace(hour=16, minute=0, second=0, microsecond=0)
    
    # 주말 처리: 토요일(5), 일요일(6)이면 금요일 마감 기준
    weekday = now_et.weekday()
    if weekday == 5:  # 토요일
        today_close = today_close - timedelta(days=1)
    elif weekday == 6:  # 일요일
        today_close = today_close - timedelta(days=2)
    
    # 현재가 장 마감 전이면 이전 거래일 마감 기준
    if now_et < today_close:
        # 월요일이면 금요일 마감 기준
        if weekday == 0:
            market_close = today_close - timedelta(days=3)
        else:
            market_close = today_close - timedelta(days=1)
    else:
        market_close = today_close
    
    should_refresh = last_updated_et < market_close
    
    if should_refresh:
        logger.debug(f"캐시 갱신 필요: last_updated={last_updated_et}, market_close={market_close}")
    
    return should_refresh


def _get_holdings_from_db(symbol: str) -> Optional[List[str]]:
    """
    DB에서 보유 종목 캐시 조회
    
    Returns:
        캐시된 top_holdings 리스트 또는 None (캐시 미스/갱신 필요)
    """
    db = SessionLocal()
    try:
        cache = db.query(SectorHoldingsCacheDB).filter(
            SectorHoldingsCacheDB.symbol == symbol
        ).first()
        
        if not cache:
            logger.debug(f"DB 캐시 미스: {symbol}")
            return None
        
        # 갱신 필요 여부 확인
        if _should_refresh_holdings_cache(cache.updated_at):
            logger.debug(f"DB 캐시 만료: {symbol}")
            return None
        
        # JSON 파싱
        top_holdings = json.loads(cache.top_holdings)
        logger.debug(f"DB 캐시 히트: {symbol} -> {top_holdings}")
        return top_holdings
        
    except Exception as e:
        logger.error(f"DB 캐시 조회 실패 ({symbol}): {e}")
        return None
    finally:
        db.close()


def _save_holdings_to_db(symbol: str, top_holdings: List[str]) -> bool:
    """
    보유 종목을 DB에 저장 (upsert)
    
    Returns:
        성공 시 True
    """
    db = SessionLocal()
    try:
        cache = db.query(SectorHoldingsCacheDB).filter(
            SectorHoldingsCacheDB.symbol == symbol
        ).first()
        
        holdings_json = json.dumps(top_holdings)
        
        if cache:
            # 업데이트
            cache.top_holdings = holdings_json
            cache.updated_at = datetime.utcnow()
        else:
            # 신규 생성
            cache = SectorHoldingsCacheDB(
                symbol=symbol,
                top_holdings=holdings_json
            )
            db.add(cache)
        
        db.commit()
        logger.debug(f"DB 캐시 저장: {symbol} -> {top_holdings}")
        return True
        
    except Exception as e:
        logger.error(f"DB 캐시 저장 실패 ({symbol}): {e}")
        db.rollback()
        return False
    finally:
        db.close()


def _fetch_top_holdings_from_api(symbol: str, count: int = 3) -> Optional[List[str]]:
    """
    Yahoo API에서 상위 보유 종목 조회
    
    Args:
        symbol: 섹터 ETF 심볼
        count: 반환할 종목 수 (기본 3개)
    
    Returns:
        상위 보유 종목 심볼 리스트 또는 None
    """
    try:
        ticker = Ticker(symbol)
        holdings_data = ticker.fund_top_holdings
        
        if isinstance(holdings_data, str):
            logger.warning(f"{symbol}: API 보유 종목 데이터 없음 - {holdings_data}")
            return None
        
        if symbol not in holdings_data.index.get_level_values(0):
            logger.warning(f"{symbol}: API 보유 종목 인덱스 없음")
            return None
        
        holdings_df = holdings_data.loc[symbol]
        
        if holdings_df.empty:
            logger.warning(f"{symbol}: API 보유 종목 데이터 비어있음")
            return None
        
        # 상위 N개 심볼 추출
        top_holdings = holdings_df['symbol'].tolist()[:count]
        logger.debug(f"{symbol} API 조회: {top_holdings}")
        return top_holdings
        
    except Exception as e:
        logger.error(f"{symbol} 보유 종목 API 조회 실패: {e}")
        return None


def _get_top_holdings(symbol: str) -> List[str]:
    """
    섹터의 상위 보유 종목 조회 (DB 캐시 우선)
    
    흐름:
    1. DB 캐시 확인 (장 마감 기준 유효성)
    2. 캐시 미스/만료 시 API 조회 → DB 저장
    
    Returns:
        상위 3개 보유 종목 심볼 리스트 (실패 시 빈 리스트)
    """
    # 1. DB 캐시 확인
    cached = _get_holdings_from_db(symbol)
    if cached:
        return cached
    
    # 2. API 조회
    top_holdings = _fetch_top_holdings_from_api(symbol, count=3)
    
    if top_holdings:
        # 3. DB에 저장
        _save_holdings_to_db(symbol, top_holdings)
        return top_holdings
    
    return []


# GICS 11개 섹터 ETF 메타데이터
SECTOR_ETFS = {
    "XLK": {
        "name": "기술",
        "name_en": "Technology",
        "description": "반도체, 소프트웨어, IT서비스"
    },
    "XLF": {
        "name": "금융",
        "name_en": "Financials",
        "description": "은행, 보험, 자산운용"
    },
    "XLV": {
        "name": "헬스케어",
        "name_en": "Healthcare",
        "description": "제약, 바이오, 의료기기"
    },
    "XLE": {
        "name": "에너지",
        "name_en": "Energy",
        "description": "석유, 가스, 에너지장비"
    },
    "XLI": {
        "name": "산업재",
        "name_en": "Industrials",
        "description": "항공, 건설, 기계"
    },
    "XLB": {
        "name": "소재",
        "name_en": "Materials",
        "description": "화학, 금속, 건축자재"
    },
    "XLY": {
        "name": "경기소비재",
        "name_en": "Consumer Cyclical",
        "description": "자동차, 유통, 호텔"
    },
    "XLP": {
        "name": "필수소비재",
        "name_en": "Consumer Defensive",
        "description": "식음료, 생활용품, 담배"
    },
    "XLRE": {
        "name": "부동산",
        "name_en": "Real Estate",
        "description": "REITs, 부동산개발"
    },
    "XLU": {
        "name": "유틸리티",
        "name_en": "Utilities",
        "description": "전력, 가스, 수도"
    },
    "XLC": {
        "name": "커뮤니케이션",
        "name_en": "Communication Services",
        "description": "미디어, 통신, 소셜미디어"
    },
}


def _calculate_change_percent(current: float, previous: float) -> float:
    """변화율 계산"""
    if previous == 0:
        return 0.0
    return round(((current - previous) / previous) * 100, 2)


async def get_sector_data(country: str = 'us') -> Optional[List[Dict[str, Any]]]:
    """
    섹터 ETF 데이터 조회
    
    Args:
        country: 'us' (미국), 'kr' (한국), 'all' (전체)
    
    Returns:
        섹터 데이터 리스트 또는 None
    """
    if country == 'kr':
        from .korea_sector_service import get_korea_sector_data
        return await get_korea_sector_data()
    elif country == 'all':
        us_data = await _get_us_sector_data()
        from .korea_sector_service import get_korea_sector_data
        kr_data = await get_korea_sector_data()
        return (us_data or []) + (kr_data or [])
    else:
        return await _get_us_sector_data()


async def _get_us_sector_data() -> Optional[List[Dict[str, Any]]]:
    """
    미국 11개 섹터 ETF 데이터 조회
    
    Returns:
        섹터 데이터 리스트 또는 None
    """
    if not YAHOOQUERY_AVAILABLE:
        logger.error("yahooquery가 설치되지 않았습니다")
        return None
    
    # 캐시 확인
    cache_key = "sectors_all"
    cached = _get_cache(cache_key)
    if cached:
        return cached
    
    try:
        symbols = list(SECTOR_ETFS.keys())
        logger.debug(f"섹터 ETF 조회 시작: {symbols}")
        
        # yahooquery로 모든 ETF 동시 조회
        tickers = Ticker(symbols)
        
        # 현재가 조회
        price_data = tickers.price
        
        # AUM(운용자산) 조회 - 트리맵 크기용
        summary_data = tickers.summary_detail
        
        # 히스토리 조회 (1개월)
        history = tickers.history(period="1mo", interval="1d")
        
        sectors = []
        
        for symbol, meta in SECTOR_ETFS.items():
            try:
                # 현재가
                if symbol not in price_data or isinstance(price_data[symbol], str):
                    logger.warning(f"{symbol}: 가격 데이터 없음")
                    continue
                
                current_price = price_data[symbol].get('regularMarketPrice', 0)
                
                # AUM (운용자산) - 트리맵 크기용
                market_cap = 0
                if symbol in summary_data and isinstance(summary_data[symbol], dict):
                    market_cap = summary_data[symbol].get('totalAssets', 0) or 0
                
                # 히스토리에서 변화율 계산
                if symbol in history.index.get_level_values(0):
                    symbol_history = history.loc[symbol]
                    closes = symbol_history['close'].dropna()
                    
                    if len(closes) >= 2:
                        # 1일 변화율 (어제 대비)
                        change_1d = _calculate_change_percent(
                            closes.iloc[-1], 
                            closes.iloc[-2]
                        )
                        
                        # 1주 변화율 (5거래일 전 대비)
                        if len(closes) >= 6:
                            change_1w = _calculate_change_percent(
                                closes.iloc[-1], 
                                closes.iloc[-6]
                            )
                        else:
                            change_1w = change_1d
                        
                        # 1개월 변화율 (첫 데이터 대비)
                        change_1m = _calculate_change_percent(
                            closes.iloc[-1], 
                            closes.iloc[0]
                        )
                    else:
                        change_1d = change_1w = change_1m = 0.0
                else:
                    change_1d = change_1w = change_1m = 0.0
                
                # 상위 보유 종목 조회 (DB 캐시 우선)
                top_holdings = _get_top_holdings(symbol)
                
                sectors.append({
                    "symbol": symbol,
                    "name": meta["name"],
                    "name_en": meta["name_en"],
                    "description": meta["description"],
                    "price": round(current_price, 2),
                    "change_1d": change_1d,
                    "change_1w": change_1w,
                    "change_1m": change_1m,
                    "market_cap": market_cap,
                    "top_holdings": top_holdings,
                    "country": "us",  # 국가 구분용
                })
                
            except Exception as e:
                logger.error(f"{symbol} 처리 중 오류: {e}")
                continue
        
        if sectors:
            # 캐시 저장
            _set_cache(cache_key, sectors, CACHE_TTL_SECTORS)
            logger.debug(f"섹터 데이터 조회 완료: {len(sectors)}개")
        
        return sectors
        
    except Exception as e:
        logger.error(f"섹터 데이터 조회 실패: {e}")
        return None


async def get_sector_holdings(symbol: str) -> Optional[Dict[str, Any]]:
    """
    섹터 ETF의 상위 보유 종목 조회
    
    Args:
        symbol: 섹터 ETF 심볼 (예: XLK)
    
    Returns:
        보유 종목 데이터 또는 None
    """
    if not YAHOOQUERY_AVAILABLE:
        logger.error("yahooquery가 설치되지 않았습니다")
        return None
    
    # 심볼 유효성 검사
    symbol = symbol.upper()
    if symbol not in SECTOR_ETFS:
        logger.warning(f"유효하지 않은 섹터 심볼: {symbol}")
        return None
    
    # 캐시 확인
    cache_key = f"holdings_{symbol}"
    cached = _get_cache(cache_key)
    if cached:
        return cached
    
    try:
        logger.debug(f"섹터 보유 종목 조회 시작: {symbol}")
        
        # yahooquery로 ETF 정보 조회
        ticker = Ticker(symbol)
        
        # fund_top_holdings: 상위 보유 종목 (MultiIndex DataFrame)
        holdings_data = ticker.fund_top_holdings
        
        # DataFrame인지 확인 (에러 시 문자열 반환됨)
        if isinstance(holdings_data, str):
            logger.warning(f"{symbol}: 보유 종목 데이터 없음 - {holdings_data}")
            return None
        
        # MultiIndex에서 해당 심볼 데이터 추출
        if symbol not in holdings_data.index.get_level_values(0):
            logger.warning(f"{symbol}: 보유 종목 데이터 없음")
            return None
        
        holdings_df = holdings_data.loc[symbol]
        
        if holdings_df.empty:
            logger.warning(f"{symbol}: 보유 종목 데이터가 비어있음")
            return None
        
        # 보유 종목 심볼 리스트 추출
        holding_symbols = holdings_df['symbol'].tolist()[:10]  # 상위 10개
        
        # 보유 종목들의 현재가/변화율 조회
        if holding_symbols:
            holdings_ticker = Ticker(holding_symbols)
            price_data = holdings_ticker.price
        else:
            price_data = {}
        
        holdings = []
        for _, row in holdings_df.head(10).iterrows():
            holding_symbol = row.get('symbol', '')
            holding_name = row.get('holdingName', '')
            holding_weight = row.get('holdingPercent', 0) * 100  # 0.12 -> 12.0
            
            # 현재가/변화율 가져오기
            current_price = None
            change_1d = None
            
            if holding_symbol in price_data and not isinstance(price_data[holding_symbol], str):
                price_info = price_data[holding_symbol]
                current_price = price_info.get('regularMarketPrice')
                change_pct = price_info.get('regularMarketChangePercent')
                if change_pct is not None:
                    change_1d = round(change_pct * 100, 2)
            
            holdings.append({
                "symbol": holding_symbol,
                "name": holding_name,
                "weight": round(holding_weight, 2),
                "price": round(current_price, 2) if current_price else None,
                "change_1d": change_1d,
            })
        
        result = {
            "sector_symbol": symbol,
            "sector_name": SECTOR_ETFS[symbol]["name"],
            "holdings": holdings,
        }
        
        # 캐시 저장 (24시간)
        _set_cache(cache_key, result, CACHE_TTL_HOLDINGS)
        logger.debug(f"섹터 보유 종목 조회 완료: {symbol} ({len(holdings)}개)")
        
        return result
        
    except Exception as e:
        logger.error(f"섹터 보유 종목 조회 실패 ({symbol}): {e}")
        return None
