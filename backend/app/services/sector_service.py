"""
섹터 ETF 데이터 서비스
GICS 11개 섹터 ETF의 성과 데이터 조회
"""

import logging
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
import time

try:
    from yahooquery import Ticker
    YAHOOQUERY_AVAILABLE = True
except ImportError:
    YAHOOQUERY_AVAILABLE = False

logger = logging.getLogger(__name__)

# 캐시 만료 시간 (초)
CACHE_TTL_SECTORS = 300  # 5분

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


async def get_sector_data() -> Optional[List[Dict[str, Any]]]:
    """
    11개 섹터 ETF 데이터 조회
    
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
                
                sectors.append({
                    "symbol": symbol,
                    "name": meta["name"],
                    "name_en": meta["name_en"],
                    "description": meta["description"],
                    "price": round(current_price, 2),
                    "change_1d": change_1d,
                    "change_1w": change_1w,
                    "change_1m": change_1m,
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
