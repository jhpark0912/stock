"""
한국투자증권 Open API 서비스

ETF 구성종목 조회를 위한 KIS Open API 연동
- 액세스 토큰 발급 및 캐싱 (24시간)
- ETF 구성종목시세 조회 (TR_ID: FHKST121600C0)
"""

import logging
import requests
from typing import Optional, Dict, Any, List, Tuple
from datetime import datetime, timedelta
from dataclasses import dataclass

logger = logging.getLogger(__name__)

# KIS Open API Base URL
KIS_BASE_URL = "https://openapi.koreainvestment.com:9443"

# 액세스 토큰 캐시 (메모리)
_token_cache: Dict[str, Dict[str, Any]] = {}


@dataclass
class KISHolding:
    """ETF 구성종목 정보"""
    symbol: str         # 종목코드
    name: str           # 종목명
    price: float        # 현재가
    change_1d: float    # 전일대비율 (%)
    weight: float       # 구성종목 비중 (%)


class KISAPIError(Exception):
    """KIS API 에러"""
    pass


def _get_cache_key(app_key: str) -> str:
    """캐시 키 생성 (App Key 기반)"""
    return f"token_{app_key[:8]}"


def _get_access_token(app_key: str, app_secret: str) -> str:
    """
    액세스 토큰 발급 (캐싱됨)
    
    우선순위:
    1. 환경변수 KIS_ACCESS_TOKEN (테스트용)
    2. 메모리 캐시
    3. API 발급
    
    캐시 TTL: 23시간 (토큰 만료 24시간 - 1시간 여유)
    
    Args:
        app_key: KIS App Key
        app_secret: KIS App Secret
        
    Returns:
        액세스 토큰
        
    Raises:
        KISAPIError: API 호출 실패 시
    """
    import os
    
    # 1. 환경변수 토큰 확인 (테스트용)
    env_token = os.getenv("KIS_ACCESS_TOKEN")
    if env_token:
        logger.info("[KIS] 환경변수 토큰 사용 (테스트용)")
        return env_token
    
    cache_key = _get_cache_key(app_key)
    
    # 2. 캐시 확인
    if cache_key in _token_cache:
        cached = _token_cache[cache_key]
        if datetime.now() < cached['expires_at']:
            logger.debug(f"[KIS] 캐시된 토큰 사용 (만료: {cached['expires_at']})")
            return cached['token']
    
    # 3. 토큰 발급
    logger.info("[KIS] 액세스 토큰 발급 요청")
    
    url = f"{KIS_BASE_URL}/oauth2/tokenP"
    headers = {
        "content-type": "application/json"
    }
    body = {
        "grant_type": "client_credentials",
        "appkey": app_key,
        "appsecret": app_secret
    }
    
    logger.debug(f"[KIS] 토큰 요청 URL: {url}")
    logger.debug(f"[KIS] App Key 길이: {len(app_key)}")
    logger.debug(f"[KIS] App Secret 길이: {len(app_secret)}")
    
    try:
        response = requests.post(url, json=body, headers=headers, timeout=10)
        
        logger.info(f"[KIS] 토큰 응답 상태: {response.status_code}")
        logger.debug(f"[KIS] 토큰 응답 본문: {response.text[:300]}")
        
        response.raise_for_status()
        
        data = response.json()
        
        if data.get("access_token"):
            token = data["access_token"]
            expires_in = data.get("expires_in", 86400)  # 기본 24시간
            
            # 캐시 저장 (23시간 여유)
            expires_at = datetime.now() + timedelta(seconds=expires_in - 3600)
            _token_cache[cache_key] = {
                'token': token,
                'expires_at': expires_at
            }
            
            logger.info(f"[KIS] 토큰 발급 완료 (만료: {expires_at.strftime('%Y-%m-%d %H:%M:%S')})")
            return token
        else:
            raise KISAPIError(f"토큰 발급 실패: {data}")
            
    except requests.exceptions.RequestException as e:
        logger.error(f"[KIS] 토큰 발급 API 호출 실패: {e}")
        raise KISAPIError(f"토큰 발급 실패: {e}")


async def get_etf_holdings(
    etf_code: str,
    app_key: str,
    app_secret: str
) -> Optional[List[KISHolding]]:
    """
    ETF 구성종목시세 조회
    
    Args:
        etf_code: ETF 종목코드 (예: "091160", 접미사 .KS 제외)
        app_key: KIS App Key
        app_secret: KIS App Secret
        
    Returns:
        구성종목 리스트 또는 None (에러 시)
    """
    try:
        # 액세스 토큰 발급
        access_token = _get_access_token(app_key, app_secret)
        
        # ETF 구성종목 조회 API 호출
        logger.info(f"[KIS] ETF 구성종목 조회: {etf_code}")
        
        # ETF 구성종목 조회 API
        url = f"{KIS_BASE_URL}/uapi/etfetn/v1/quotations/inquire-component-stock-price"
        headers = {
            "content-type": "application/json",
            "authorization": f"Bearer {access_token}",
            "appkey": app_key,
            "appsecret": app_secret,
            "tr_id": "FHKST121600C0",
            "custtype": "P"  # 개인
        }
        params = {
            "FID_COND_MRKT_DIV_CODE": "J",  # 주식
            "FID_INPUT_ISCD": etf_code,
            "FID_COND_SCR_DIV_CODE": "11216"  # ETF 구성종목 화면 (Unique key)
        }
        
        logger.debug(f"[KIS] 요청 URL: {url}")
        logger.debug(f"[KIS] 요청 파라미터: {params}")
        
        response = requests.get(url, headers=headers, params=params, timeout=10)
        
        # HTTP 상태 코드 확인
        logger.info(f"[KIS] HTTP 상태: {response.status_code}")
        logger.debug(f"[KIS] 응답 헤더: {response.headers}")
        
        response.raise_for_status()
        
        # 응답 본문 확인
        response_text = response.text
        logger.debug(f"[KIS] 응답 본문 (raw): {response_text[:500]}")
        
        data = response.json()
        
        # 디버깅: 응답 전체 출력
        logger.info(f"[KIS] API 응답: rt_cd={data.get('rt_cd')}, msg1={data.get('msg1')}")
        logger.info(f"[KIS] 전체 응답 키: {list(data.keys())}")
        
        # 응답 검증
        if data.get("rt_cd") != "0":
            error_msg = data.get("msg1", "알 수 없는 오류")
            logger.error(f"[KIS] API 에러: {error_msg}")
            logger.error(f"[KIS] 전체 응답: {data}")
            raise KISAPIError(f"API 에러: {error_msg}")
        
        # output2: 구성종목 리스트
        output2 = data.get("output2", [])
        
        if not output2:
            logger.warning(f"[KIS] ETF {etf_code}의 구성종목이 없습니다")
            return None
        
        # 파싱
        holdings = []
        for item in output2:
            try:
                # 종목코드 (stck_shrn_iscd)
                symbol = item.get("stck_shrn_iscd", "")
                
                # 종목명 (hts_kor_isnm)
                name = item.get("hts_kor_isnm", "").strip()
                
                # 현재가 (stck_prpr) - 정수 문자열
                price_str = item.get("stck_prpr", "0")
                price = float(price_str) if price_str else 0.0
                
                # 전일대비율 (prdy_ctrt) - 소수점 문자열 (예: "1.23")
                change_str = item.get("prdy_ctrt", "0")
                change_1d = float(change_str) if change_str else 0.0
                
                # 구성종목 비중 (etf_cnfg_issu_rlim) - 소수점 문자열 (예: "10.50")
                weight_str = item.get("etf_cnfg_issu_rlim", "0")
                weight = float(weight_str) if weight_str else 0.0
                
                holdings.append(KISHolding(
                    symbol=symbol,
                    name=name,
                    price=price,
                    change_1d=change_1d,
                    weight=weight
                ))
            except Exception as e:
                logger.warning(f"[KIS] 구성종목 파싱 실패: {e}, item={item}")
                continue
        
        logger.info(f"[KIS] ETF {etf_code} 구성종목 조회 완료: {len(holdings)}개")
        return holdings
        
    except KISAPIError:
        raise
    except requests.exceptions.RequestException as e:
        logger.error(f"[KIS] API 호출 실패: {e}")
        raise KISAPIError(f"API 호출 실패: {e}")
    except Exception as e:
        logger.error(f"[KIS] 예상치 못한 오류: {e}")
        raise KISAPIError(f"예상치 못한 오류: {e}")


@dataclass
class KISRankingStock:
    """등락률 순위 종목 정보"""
    rank: int           # 순위
    symbol: str         # 종목코드
    name: str           # 종목명
    price: float        # 현재가
    change_percent: float  # 전일대비율 (%)
    volume: int         # 거래량


async def get_fluctuation_ranking(
    app_key: str,
    app_secret: str,
    market: str = "ALL",  # "ALL", "KOSPI", "KOSDAQ"
    sort: str = "0",      # "0": 상승률순, "1": 하락률순
    limit: int = 10
) -> Tuple[List[KISRankingStock], List[KISRankingStock]]:
    """
    국내주식 등락률 순위 조회

    Args:
        app_key: KIS App Key
        app_secret: KIS App Secret
        market: 시장 구분 ("ALL", "KOSPI", "KOSDAQ")
        sort: 정렬 ("0": 상승률순, "1": 하락률순)
        limit: 조회 개수

    Returns:
        (급등주 리스트, 급락주 리스트)
    """
    try:
        # 액세스 토큰 발급
        access_token = _get_access_token(app_key, app_secret)

        logger.info(f"[KIS] 등락률 순위 조회: market={market}")

        url = f"{KIS_BASE_URL}/uapi/domestic-stock/v1/ranking/fluctuation"
        headers = {
            "content-type": "application/json; charset=utf-8",
            "authorization": f"Bearer {access_token}",
            "appkey": app_key,
            "appsecret": app_secret,
            "tr_id": "FHPST01700000",
            "custtype": "P"
        }

        # 시장 코드 매핑
        market_code = {
            "ALL": "0000",   # 전체
            "KOSPI": "0001", # 코스피
            "KOSDAQ": "1001" # 코스닥
        }.get(market, "0000")

        gainers = []
        losers = []

        # 상승률 순위 조회
        params_gainers = {
            "fid_cond_mrkt_div_code": "J",
            "fid_cond_scr_div_code": "20170",
            "fid_input_iscd": market_code,
            "fid_rank_sort_cls_code": "0",  # 상승률순
            "fid_input_cnt_1": str(limit),
            "fid_prc_cls_code": "0",        # 현재가 기준
            "fid_input_price_1": "",
            "fid_input_price_2": "",
            "fid_vol_cnt": "",
            "fid_trgt_cls_code": "0",
            "fid_trgt_exls_cls_code": "0",
            "fid_div_cls_code": "0",
            "fid_rsfl_rate1": "",
            "fid_rsfl_rate2": ""
        }

        response = requests.get(url, headers=headers, params=params_gainers, timeout=10)
        logger.debug(f"[KIS] 상승률 순위 응답: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            if data.get("rt_cd") == "0":
                for item in data.get("output", [])[:limit]:
                    try:
                        gainers.append(KISRankingStock(
                            rank=int(item.get("data_rank", 0)),
                            symbol=item.get("stck_shrn_iscd", ""),
                            name=item.get("hts_kor_isnm", "").strip(),
                            price=float(item.get("stck_prpr", 0)),
                            change_percent=float(item.get("prdy_ctrt", 0)),
                            volume=int(item.get("acml_vol", 0))
                        ))
                    except Exception as e:
                        logger.warning(f"[KIS] 상승 종목 파싱 오류: {e}")
            else:
                logger.warning(f"[KIS] 상승률 순위 조회 실패: {data.get('msg1')}")

        # 하락률 순위 조회
        params_losers = params_gainers.copy()
        params_losers["fid_rank_sort_cls_code"] = "1"  # 하락률순

        response = requests.get(url, headers=headers, params=params_losers, timeout=10)
        logger.debug(f"[KIS] 하락률 순위 응답: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            if data.get("rt_cd") == "0":
                for item in data.get("output", [])[:limit]:
                    try:
                        losers.append(KISRankingStock(
                            rank=int(item.get("data_rank", 0)),
                            symbol=item.get("stck_shrn_iscd", ""),
                            name=item.get("hts_kor_isnm", "").strip(),
                            price=float(item.get("stck_prpr", 0)),
                            change_percent=float(item.get("prdy_ctrt", 0)),
                            volume=int(item.get("acml_vol", 0))
                        ))
                    except Exception as e:
                        logger.warning(f"[KIS] 하락 종목 파싱 오류: {e}")
            else:
                logger.warning(f"[KIS] 하락률 순위 조회 실패: {data.get('msg1')}")

        logger.info(f"[KIS] 등락률 순위 조회 완료: 상승 {len(gainers)}개, 하락 {len(losers)}개")
        return gainers, losers

    except KISAPIError:
        raise
    except Exception as e:
        logger.error(f"[KIS] 등락률 순위 조회 오류: {e}")
        raise KISAPIError(f"등락률 순위 조회 실패: {e}")


@dataclass
class KISMarketCapStock:
    """시가총액 순위 종목 정보"""
    rank: int           # 순위
    symbol: str         # 종목코드
    name: str           # 종목명
    price: float        # 현재가
    change_percent: float  # 전일대비율 (%)
    market_cap: float   # 시가총액 (억원)
    volume: int         # 거래량


async def get_market_cap_ranking(
    app_key: str,
    app_secret: str,
    market: str = "KOSPI",  # "KOSPI", "KOSDAQ"
    limit: int = 5
) -> List[KISMarketCapStock]:
    """
    국내주식 시가총액 순위 조회

    Args:
        app_key: KIS App Key
        app_secret: KIS App Secret
        market: 시장 구분 ("KOSPI", "KOSDAQ")
        limit: 조회 개수

    Returns:
        시가총액 순위 종목 리스트
    """
    try:
        # 액세스 토큰 발급
        access_token = _get_access_token(app_key, app_secret)

        logger.info(f"[KIS] 시가총액 순위 조회: market={market}")

        url = f"{KIS_BASE_URL}/uapi/domestic-stock/v1/ranking/market-cap"
        headers = {
            "content-type": "application/json; charset=utf-8",
            "authorization": f"Bearer {access_token}",
            "appkey": app_key,
            "appsecret": app_secret,
            "tr_id": "FHPST01740000",
            "custtype": "P"
        }

        # 시장 코드 매핑
        market_code = {
            "KOSPI": "0001",
            "KOSDAQ": "1001"
        }.get(market, "0001")

        params = {
            "fid_cond_mrkt_div_code": "J",
            "fid_cond_scr_div_code": "20174",
            "fid_input_iscd": market_code,
            "fid_div_cls_code": "0",
            "fid_trgt_cls_code": "0",
            "fid_trgt_exls_cls_code": "0",
            "fid_input_price_1": "",
            "fid_input_price_2": "",
            "fid_vol_cnt": ""
        }

        response = requests.get(url, headers=headers, params=params, timeout=10)
        logger.debug(f"[KIS] 시가총액 순위 응답: {response.status_code}")

        stocks = []
        if response.status_code == 200:
            data = response.json()
            if data.get("rt_cd") == "0":
                for item in data.get("output", [])[:limit]:
                    try:
                        # 시가총액: 억원 단위로 변환
                        market_cap_str = item.get("stck_avls", "0")
                        market_cap = float(market_cap_str) / 100000000 if market_cap_str else 0
                        
                        stocks.append(KISMarketCapStock(
                            rank=int(item.get("data_rank", 0)),
                            symbol=item.get("mksc_shrn_iscd", ""),
                            name=item.get("hts_kor_isnm", "").strip(),
                            price=float(item.get("stck_prpr", 0)),
                            change_percent=float(item.get("prdy_ctrt", 0)),
                            market_cap=market_cap,
                            volume=int(item.get("acml_vol", 0))
                        ))
                    except Exception as e:
                        logger.warning(f"[KIS] 시총 종목 파싱 오류: {e}")
            else:
                logger.warning(f"[KIS] 시가총액 순위 조회 실패: {data.get('msg1')}")

        logger.info(f"[KIS] 시가총액 순위 조회 완료: {market} {len(stocks)}개")
        return stocks

    except KISAPIError:
        raise
    except Exception as e:
        logger.error(f"[KIS] 시가총액 순위 조회 오류: {e}")
        raise KISAPIError(f"시가총액 순위 조회 실패: {e}")


async def test_credentials(app_key: str, app_secret: str) -> Tuple[bool, Optional[str]]:
    """
    KIS API 인증정보 테스트
    
    Args:
        app_key: KIS App Key
        app_secret: KIS App Secret
        
    Returns:
        (성공 여부, 에러 메시지)
    """
    try:
        token = _get_access_token(app_key, app_secret)
        return (True, None)
    except KISAPIError as e:
        return (False, str(e))
    except Exception as e:
        return (False, f"테스트 실패: {e}")
