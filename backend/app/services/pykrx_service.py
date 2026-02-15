"""
pykrx 기반 한국 주식 데이터 조회 서비스

KIS Open API의 fallback으로 사용
- 등락률 순위 (급등/급락 Top N)
- 시가총액 순위 (Top N)
- 개별 종목 시세 조회

참고: pykrx는 마감 후 확정 데이터만 제공 (실시간 X)
"""

import logging
import warnings
from typing import Optional, List, Tuple, Dict, Any
from datetime import datetime, timedelta
from dataclasses import dataclass
from zoneinfo import ZoneInfo

logger = logging.getLogger(__name__)

# pykrx 내부 pandas FutureWarning 무시
warnings.filterwarnings("ignore", category=FutureWarning, module="pykrx")

# pykrx 사용 가능 여부 확인
try:
    from pykrx import stock
    PYKRX_AVAILABLE = True
except ImportError:
    PYKRX_AVAILABLE = False
    logger.warning("pykrx가 설치되지 않았습니다. pip install pykrx")

KST = ZoneInfo("Asia/Seoul")

# 캐시 (메모리)
_cache: Dict[str, Dict[str, Any]] = {}
CACHE_TTL = 300  # 5분


@dataclass
class PykrxStock:
    """pykrx 종목 정보"""
    rank: int           # 순위
    symbol: str         # 종목코드
    name: str           # 종목명
    price: float        # 현재가 (종가)
    change_percent: float  # 등락률 (%)
    volume: int         # 거래량
    market_cap: float   # 시가총액 (억원)


def _get_latest_trading_date() -> str:
    """
    최근 거래일 조회 (YYYYMMDD 형식)
    
    주말/공휴일인 경우 직전 거래일 반환
    """
    now = datetime.now(KST)
    date = now
    
    # 장 마감 전이면 전일 데이터 사용
    if now.hour < 16:
        date = now - timedelta(days=1)
    
    # 주말 건너뛰기
    while date.weekday() >= 5:  # 토(5), 일(6)
        date = date - timedelta(days=1)
    
    return date.strftime("%Y%m%d")


def _get_cache_key(prefix: str, market: str, date: str) -> str:
    """캐시 키 생성"""
    return f"{prefix}:{market}:{date}"


def _get_cached(key: str) -> Optional[Any]:
    """캐시 조회"""
    if key not in _cache:
        return None
    
    cached = _cache[key]
    if datetime.now() > cached.get("expires", datetime.min):
        del _cache[key]
        return None
    
    return cached.get("data")


def _set_cache(key: str, data: Any, ttl: int = CACHE_TTL) -> None:
    """캐시 저장"""
    _cache[key] = {
        "data": data,
        "expires": datetime.now() + timedelta(seconds=ttl)
    }


async def get_fluctuation_ranking(
    market: str = "ALL",
    limit: int = 5
) -> Tuple[List[PykrxStock], List[PykrxStock]]:
    """
    등락률 순위 조회 (급등/급락 Top N)
    
    Args:
        market: 시장 구분 ("ALL", "KOSPI", "KOSDAQ")
        limit: 조회 개수
        
    Returns:
        (급등주 리스트, 급락주 리스트)
    """
    if not PYKRX_AVAILABLE:
        logger.error("[pykrx] 라이브러리가 설치되지 않음")
        return [], []
    
    try:
        date = _get_latest_trading_date()
        cache_key = _get_cache_key("fluctuation", market, date)
        
        # 캐시 확인
        cached = _get_cached(cache_key)
        if cached:
            logger.debug(f"[pykrx] 캐시된 등락률 순위 반환: {date}")
            return cached
        
        logger.debug(f"[pykrx] 등락률 순위 조회: market={market}, date={date}")
        
        gainers_all = []
        losers_all = []
        
        # 시장별 조회
        markets_to_query = []
        if market == "ALL":
            markets_to_query = ["KOSPI", "KOSDAQ"]
        else:
            markets_to_query = [market]
        
        for mkt in markets_to_query:
            try:
                # 전종목 OHLCV 조회 (등락률 포함)
                df = stock.get_market_ohlcv(date, market=mkt)
                
                if df.empty:
                    logger.warning(f"[pykrx] {mkt} 데이터 없음: {date}")
                    continue
                
                # 시가총액 데이터 조회
                cap_df = stock.get_market_cap(date, market=mkt)
                
                # 등락률 기준 정렬
                df_sorted_gain = df.sort_values("등락률", ascending=False).head(limit * 2)
                df_sorted_loss = df.sort_values("등락률", ascending=True).head(limit * 2)
                
                # 급등주 파싱
                for idx, (ticker, row) in enumerate(df_sorted_gain.iterrows()):
                    try:
                        name = stock.get_market_ticker_name(ticker)
                        market_cap = 0
                        if ticker in cap_df.index:
                            market_cap = cap_df.loc[ticker, "시가총액"] / 100000000  # 억원
                        
                        gainers_all.append(PykrxStock(
                            rank=idx + 1,
                            symbol=ticker,
                            name=name,
                            price=float(row["종가"]),
                            change_percent=float(row["등락률"]),
                            volume=int(row["거래량"]),
                            market_cap=market_cap
                        ))
                    except Exception as e:
                        logger.warning(f"[pykrx] 급등주 파싱 오류 {ticker}: {e}")
                
                # 급락주 파싱
                for idx, (ticker, row) in enumerate(df_sorted_loss.iterrows()):
                    try:
                        name = stock.get_market_ticker_name(ticker)
                        market_cap = 0
                        if ticker in cap_df.index:
                            market_cap = cap_df.loc[ticker, "시가총액"] / 100000000  # 억원
                        
                        losers_all.append(PykrxStock(
                            rank=idx + 1,
                            symbol=ticker,
                            name=name,
                            price=float(row["종가"]),
                            change_percent=float(row["등락률"]),
                            volume=int(row["거래량"]),
                            market_cap=market_cap
                        ))
                    except Exception as e:
                        logger.warning(f"[pykrx] 급락주 파싱 오류 {ticker}: {e}")
                        
            except Exception as e:
                logger.error(f"[pykrx] {mkt} 등락률 조회 실패: {e}")
        
        # 전체 시장 통합 시 재정렬
        if market == "ALL":
            gainers_all.sort(key=lambda x: x.change_percent, reverse=True)
            losers_all.sort(key=lambda x: x.change_percent, reverse=False)
        
        # 상위 N개 추출 및 순위 재부여
        gainers = gainers_all[:limit]
        losers = losers_all[:limit]
        
        for i, g in enumerate(gainers):
            g.rank = i + 1
        for i, l in enumerate(losers):
            l.rank = i + 1
        
        # 캐시 저장
        result = (gainers, losers)
        _set_cache(cache_key, result)
        
        logger.debug(f"[pykrx] 등락률 순위 조회 완료: 상승 {len(gainers)}개, 하락 {len(losers)}개")
        return result
        
    except Exception as e:
        logger.error(f"[pykrx] 등락률 순위 조회 실패: {e}")
        return [], []


async def get_market_cap_ranking(
    market: str = "KOSPI",
    limit: int = 5
) -> List[PykrxStock]:
    """
    시가총액 순위 조회 (Top N)
    
    Args:
        market: 시장 구분 ("KOSPI", "KOSDAQ")
        limit: 조회 개수
        
    Returns:
        시가총액 상위 종목 리스트
    """
    if not PYKRX_AVAILABLE:
        logger.error("[pykrx] 라이브러리가 설치되지 않음")
        return []
    
    try:
        date = _get_latest_trading_date()
        cache_key = _get_cache_key("marketcap", market, date)
        
        # 캐시 확인
        cached = _get_cached(cache_key)
        if cached:
            logger.debug(f"[pykrx] 캐시된 시가총액 순위 반환: {date}")
            return cached
        
        logger.debug(f"[pykrx] 시가총액 순위 조회: market={market}, date={date}")
        
        # 시가총액 데이터 조회
        cap_df = stock.get_market_cap(date, market=market)
        
        if cap_df.empty:
            logger.warning(f"[pykrx] 시가총액 데이터 없음: {date}")
            return []
        
        # OHLCV (등락률 포함)
        ohlcv_df = stock.get_market_ohlcv(date, market=market)
        
        # 시가총액 기준 정렬
        cap_df_sorted = cap_df.sort_values("시가총액", ascending=False).head(limit)
        
        stocks = []
        for idx, (ticker, row) in enumerate(cap_df_sorted.iterrows()):
            try:
                name = stock.get_market_ticker_name(ticker)
                change_percent = 0.0
                volume = 0
                price = float(row["종가"])
                
                if ticker in ohlcv_df.index:
                    change_percent = float(ohlcv_df.loc[ticker, "등락률"])
                    volume = int(ohlcv_df.loc[ticker, "거래량"])
                
                stocks.append(PykrxStock(
                    rank=idx + 1,
                    symbol=ticker,
                    name=name,
                    price=price,
                    change_percent=change_percent,
                    volume=volume,
                    market_cap=float(row["시가총액"]) / 100000000  # 억원
                ))
            except Exception as e:
                logger.warning(f"[pykrx] 시총 종목 파싱 오류 {ticker}: {e}")
        
        # 캐시 저장
        _set_cache(cache_key, stocks)
        
        logger.debug(f"[pykrx] 시가총액 순위 조회 완료: {market} {len(stocks)}개")
        return stocks
        
    except Exception as e:
        logger.error(f"[pykrx] 시가총액 순위 조회 실패: {e}")
        return []


async def get_stock_info(
    tickers: List[str],
    date: Optional[str] = None
) -> Dict[str, PykrxStock]:
    """
    개별 종목 시세 조회
    
    Args:
        tickers: 종목코드 리스트 (예: ["005930", "000660"])
        date: 조회일 (YYYYMMDD), None이면 최근 거래일
        
    Returns:
        {종목코드: PykrxStock} 딕셔너리
    """
    if not PYKRX_AVAILABLE:
        logger.error("[pykrx] 라이브러리가 설치되지 않음")
        return {}
    
    try:
        if date is None:
            date = _get_latest_trading_date()
        
        logger.debug(f"[pykrx] 개별 종목 조회: {tickers}, date={date}")
        
        result = {}
        
        for ticker in tickers:
            try:
                # OHLCV 조회
                df = stock.get_market_ohlcv(date, date, ticker)
                
                if df.empty:
                    logger.warning(f"[pykrx] {ticker} 데이터 없음")
                    continue
                
                row = df.iloc[-1]
                name = stock.get_market_ticker_name(ticker)
                
                # 시가총액 조회 (개별)
                cap_df = stock.get_market_cap(date)
                market_cap = 0
                if ticker in cap_df.index:
                    market_cap = cap_df.loc[ticker, "시가총액"] / 100000000
                
                result[ticker] = PykrxStock(
                    rank=0,
                    symbol=ticker,
                    name=name,
                    price=float(row["종가"]),
                    change_percent=float(row["등락률"]),
                    volume=int(row["거래량"]),
                    market_cap=market_cap
                )
                
            except Exception as e:
                logger.warning(f"[pykrx] {ticker} 조회 실패: {e}")
        
        return result
        
    except Exception as e:
        logger.error(f"[pykrx] 개별 종목 조회 실패: {e}")
        return {}


async def get_etf_portfolio(
    etf_ticker: str,
    limit: int = 10
) -> List[Dict[str, Any]]:
    """
    ETF 구성종목 조회 (추정)
    
    참고: pykrx는 ETF 구성종목 직접 조회를 지원하지 않음
    대신 정적 메타데이터를 사용하고, 해당 종목들의 시세만 조회
    
    Args:
        etf_ticker: ETF 종목코드 (예: "091160")
        limit: 상위 N개 종목
        
    Returns:
        구성종목 정보 리스트 (시세 포함)
    """
    # ETF별 주요 구성종목 매핑 (정적 메타데이터)
    # 실제 비중은 변동되므로 참고용
    ETF_HOLDINGS_MAP = {
        "091160": ["005930", "000660", "042700"],  # 반도체: 삼성전자, SK하이닉스, 한미반도체
        "091170": ["105560", "055550", "086790"],  # 은행: KB금융, 신한지주, 하나금융지주
        "266420": ["207940", "068270", "000100"],  # 헬스케어: 삼성바이오, 셀트리온, 유한양행
        "117460": ["051910", "096770", "011170"],  # 에너지화학: LG화학, SK이노베이션, 롯데케미칼
        "266370": ["035420", "035720", "006400"],  # IT: NAVER, 카카오, 삼성SDI
        "091180": ["005380", "000270", "012330"],  # 자동차: 현대차, 기아, 현대모비스
        "117700": ["028260", "000720", "375500"],  # 건설: 삼성물산, 현대건설, DL이앤씨
        "140710": ["011200", "003490", "180640"],  # 운송: HMM, 대한항공, 한진칼
        "102970": ["006800", "071050", "016360"],  # 증권: 미래에셋증권, 한국금융지주, 삼성증권
        "266390": ["008770", "069960", "004170"],  # 경기소비재: 호텔신라, 현대백화점, 신세계
    }
    
    if not PYKRX_AVAILABLE:
        logger.error("[pykrx] 라이브러리가 설치되지 않음")
        return []
    
    try:
        # ETF 코드에서 .KS 제거
        etf_code = etf_ticker.replace(".KS", "")
        
        holdings_tickers = ETF_HOLDINGS_MAP.get(etf_code, [])
        
        if not holdings_tickers:
            logger.warning(f"[pykrx] ETF {etf_code} 구성종목 메타데이터 없음")
            return []
        
        logger.debug(f"[pykrx] ETF {etf_code} 구성종목 시세 조회: {holdings_tickers}")
        
        # 종목 시세 조회
        stock_info = await get_stock_info(holdings_tickers[:limit])
        
        # 결과 변환
        result = []
        for ticker in holdings_tickers[:limit]:
            if ticker in stock_info:
                info = stock_info[ticker]
                result.append({
                    "symbol": ticker,
                    "name": info.name,
                    "price": info.price,
                    "change_1d": info.change_percent,
                    "weight": None,  # 비중은 알 수 없음
                })
        
        logger.debug(f"[pykrx] ETF {etf_code} 구성종목 조회 완료: {len(result)}개")
        return result
        
    except Exception as e:
        logger.error(f"[pykrx] ETF 구성종목 조회 실패: {e}")
        return []


def is_pykrx_available() -> bool:
    """pykrx 사용 가능 여부"""
    return PYKRX_AVAILABLE


def get_data_date() -> str:
    """현재 데이터 기준일 반환 (YYYY-MM-DD 형식)"""
    date = _get_latest_trading_date()
    return f"{date[:4]}-{date[4:6]}-{date[6:8]}"
