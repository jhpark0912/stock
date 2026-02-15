"""
한국 섹터 ETF 데이터 조회 서비스

KODEX 섹터 ETF를 사용하여 한국 시장 섹터별 성과 조회
Yahoo Finance 티커: .KS 접미사 사용
"""

import logging
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import pytz

logger = logging.getLogger(__name__)

# yahooquery 사용 가능 여부 확인
try:
    from yahooquery import Ticker
    YAHOOQUERY_AVAILABLE = True
except ImportError:
    YAHOOQUERY_AVAILABLE = False
    logger.warning("yahooquery가 설치되지 않았습니다. pip install yahooquery")

# 캐시 TTL (초)
CACHE_TTL_SECTORS = 300  # 5분
CACHE_TTL_HOLDINGS = 86400  # 24시간

# 한국 시간대
KST_TIMEZONE = pytz.timezone('Asia/Seoul')

# 메모리 캐시
_korea_sector_cache: Dict[str, Any] = {}


def _get_cache(key: str) -> Optional[Any]:
    """캐시 조회"""
    if key not in _korea_sector_cache:
        return None
    
    cached = _korea_sector_cache[key]
    if datetime.now() > cached['expires']:
        del _korea_sector_cache[key]
        return None
    
    return cached['data']


def _set_cache(key: str, data: Any, ttl: int) -> None:
    """캐시 저장"""
    _korea_sector_cache[key] = {
        'data': data,
        'expires': datetime.now() + timedelta(seconds=ttl)
    }


# 한국 KODEX 섹터 ETF 목록
# Yahoo Finance에서 검증된 정확한 티커 사용
KOREA_SECTOR_ETFS = {
    "091160.KS": {
        "name": "반도체",
        "name_en": "Semiconductors",
        "description": "삼성전자, SK하이닉스 등 메모리 반도체"
    },
    "091170.KS": {
        "name": "은행",
        "name_en": "Banks",
        "description": "KB금융, 신한지주, 하나금융"
    },
    "266420.KS": {
        "name": "헬스케어",
        "name_en": "Healthcare",
        "description": "삼성바이오, 셀트리온, 유한양행"
    },
    "117460.KS": {
        "name": "에너지화학",
        "name_en": "Energy & Chemicals",
        "description": "LG화학, SK이노베이션, 롯데케미칼"
    },
    "266370.KS": {
        "name": "IT",
        "name_en": "Information Technology",
        "description": "네이버, 카카오, 삼성SDI"
    },
    "091180.KS": {
        "name": "자동차",
        "name_en": "Automobiles",
        "description": "현대차, 기아, 현대모비스"
    },
    "117700.KS": {
        "name": "건설",
        "name_en": "Construction",
        "description": "삼성물산, 현대건설, DL이앤씨"
    },
    "140710.KS": {
        "name": "운송",
        "name_en": "Transportation",
        "description": "HMM, 대한항공, 한진칼"
    },
    "102970.KS": {
        "name": "증권",
        "name_en": "Securities",
        "description": "미래에셋증권, 한국금융지주, 삼성증권"
    },
    "266390.KS": {
        "name": "경기소비재",
        "name_en": "Consumer Discretionary",
        "description": "호텔신라, 현대백화점, 신세계"
    },
}

# 한국 섹터별 상위 보유 종목 (수동 메타데이터)
# DB 캐시 대신 정적 데이터 사용 (분기별 업데이트 권장)
KOREA_SECTOR_HOLDINGS = {
    "091160.KS": ["삼성전자", "SK하이닉스", "DB하이텍"],
    "091170.KS": ["KB금융", "신한지주", "하나금융지주"],
    "266420.KS": ["삼성바이오로직스", "셀트리온", "유한양행"],
    "117460.KS": ["LG화학", "SK이노베이션", "롯데케미칼"],
    "266370.KS": ["네이버", "카카오", "삼성SDI"],
    "091180.KS": ["현대차", "기아", "현대모비스"],
    "117700.KS": ["삼성물산", "현대건설", "DL이앤씨"],
    "140710.KS": ["HMM", "대한항공", "한진칼"],
    "102970.KS": ["미래에셋증권", "한국금융지주", "삼성증권"],
    "266390.KS": ["호텔신라", "현대백화점", "신세계"],
}


def _calculate_change_percent(current: float, previous: float) -> float:
    """변화율 계산"""
    if previous == 0:
        return 0.0
    return round(((current - previous) / previous) * 100, 2)


async def get_korea_sector_data() -> Optional[List[Dict[str, Any]]]:
    """
    한국 섹터 ETF 데이터 조회
    
    Returns:
        섹터 데이터 리스트 또는 None
    """
    if not YAHOOQUERY_AVAILABLE:
        logger.error("yahooquery가 설치되지 않았습니다")
        return None
    
    # 캐시 확인
    cache_key = "korea_sectors_all"
    cached = _get_cache(cache_key)
    if cached:
        return cached
    
    try:
        symbols = list(KOREA_SECTOR_ETFS.keys())
        logger.debug(f"한국 섹터 ETF 조회 시작: {symbols}")
        
        # yahooquery로 모든 ETF 동시 조회
        tickers = Ticker(symbols)
        
        # 현재가 조회
        price_data = tickers.price
        
        # AUM(운용자산) 조회 - 트리맵 크기용
        summary_data = tickers.summary_detail
        
        # 히스토리 조회 (1개월)
        history = tickers.history(period="1mo", interval="1d")
        
        sectors = []
        
        for symbol, meta in KOREA_SECTOR_ETFS.items():
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
                
                # 상위 보유 종목 (정적 메타데이터)
                top_holdings = KOREA_SECTOR_HOLDINGS.get(symbol, [])
                
                sectors.append({
                    "symbol": symbol,
                    "name": meta["name"],
                    "name_en": meta["name_en"],
                    "description": meta["description"],
                    "price": round(current_price, 0),  # 원화는 정수로
                    "change_1d": change_1d,
                    "change_1w": change_1w,
                    "change_1m": change_1m,
                    "market_cap": market_cap,
                    "top_holdings": top_holdings,
                    "country": "kr",  # 국가 구분용
                })
                
            except Exception as e:
                logger.error(f"{symbol} 처리 중 오류: {e}")
                continue
        
        if sectors:
            # 캐시 저장
            _set_cache(cache_key, sectors, CACHE_TTL_SECTORS)
            logger.debug(f"한국 섹터 데이터 조회 완료: {len(sectors)}개")
        
        return sectors
        
    except Exception as e:
        logger.error(f"한국 섹터 데이터 조회 실패: {e}")
        return None


async def get_korea_sector_holdings(
    symbol: str,
    kis_credentials: Optional[tuple[str, str]] = None
) -> Optional[Dict[str, Any]]:
    """
    한국 섹터 ETF 보유 종목 조회
    
    우선순위:
    1. KIS Open API (실시간)
    2. pykrx (마감 후 확정 데이터) - fallback
    3. 정적 메타데이터 - fallback
    
    Args:
        symbol: 섹터 ETF 심볼 (예: 091160.KS)
        kis_credentials: (app_key, app_secret) 튜플 (선택)
        
    Returns:
        보유 종목 정보 또는 None
    """
    if symbol not in KOREA_SECTOR_ETFS:
        logger.warning(f"알 수 없는 한국 섹터 ETF: {symbol}")
        return None
    
    meta = KOREA_SECTOR_ETFS[symbol]
    
    # 1. KIS API 사용 가능 시 실시간 조회
    if kis_credentials:
        try:
            from app.services.kis_api_service import get_etf_holdings
            
            app_key, app_secret = kis_credentials
            etf_code = symbol.replace(".KS", "")  # 091160.KS -> 091160
            
            logger.debug(f"[KIS] ETF {symbol} 구성종목 조회 시작")
            
            holdings_data = await get_etf_holdings(etf_code, app_key, app_secret)
            
            if holdings_data:
                # KIS API 응답을 표준 형식으로 변환
                holdings = []
                for h in holdings_data:
                    holdings.append({
                        "symbol": h.symbol,
                        "name": h.name,
                        "weight": h.weight,
                        "price": h.price,
                        "change_1d": h.change_1d,
                    })
                
                return {
                    "sector_symbol": symbol,
                    "sector_name": meta["name"],
                    "holdings": holdings,
                    "last_updated": datetime.now().isoformat(),
                    "note": "한국투자증권 API로 조회된 실시간 데이터입니다."
                }
        except Exception as e:
            logger.warning(f"[KIS] ETF {symbol} 조회 실패, pykrx로 fallback: {e}")
    
    # 2. pykrx fallback - 정적 메타데이터 + 시세 조회
    try:
        from app.services.pykrx_service import get_etf_portfolio, is_pykrx_available, get_data_date
        
        if is_pykrx_available():
            logger.debug(f"[pykrx] ETF {symbol} 구성종목 조회 (fallback)")
            
            etf_code = symbol.replace(".KS", "")
            holdings_data = await get_etf_portfolio(etf_code, limit=10)
            
            if holdings_data:
                data_date = get_data_date()
                return {
                    "sector_symbol": symbol,
                    "sector_name": meta["name"],
                    "holdings": holdings_data,
                    "last_updated": datetime.now().isoformat(),
                    "note": f"{data_date} 기준 마감 데이터입니다. 한국투자증권 API 키를 설정하면 실시간 상세 정보(비중 포함)를 확인할 수 있습니다.",
                    "requires_kis_key": True
                }
    except Exception as e:
        logger.warning(f"[pykrx] ETF {symbol} 조회 실패: {e}")
    
    # 3. Fallback: 정적 메타데이터만 반환
    holdings_names = KOREA_SECTOR_HOLDINGS.get(symbol, [])

    # 정적 메타데이터도 없으면 실패
    if not holdings_names:
        logger.error(f"[Fallback] ETF {symbol} 정적 메타데이터 없음 - 모든 조회 실패")
        return None

    holdings = []
    for i, name in enumerate(holdings_names):
        # 비중은 추정값 (실제 데이터 없이 균등 분배)
        estimated_weight = round(100 / len(holdings_names), 2)
        holdings.append({
            "symbol": f"KR_{i+1}",  # 한국 종목은 별도 심볼 체계
            "name": name,
            "weight": estimated_weight,
            "price": None,
            "change_1d": None,
        })

    logger.warning(f"[Fallback] ETF {symbol} 정적 메타데이터 사용 (pykrx 실패)")

    return {
        "sector_symbol": symbol,
        "sector_name": meta["name"],
        "holdings": holdings,
        "last_updated": datetime.now().isoformat(),
        "note": "정적 데이터입니다. 한국투자증권 API 키를 설정하면 실시간 상세 정보를 확인할 수 있습니다.",
        "requires_kis_key": True
    }
