"""
Mock 주식 데이터 (개발/테스트용)
"""
from datetime import datetime
from app.models.stock import StockData, PriceInfo, FinancialsInfo, CompanyInfo


MOCK_STOCKS = {
    "AAPL": {
        "name": "Apple Inc.",
        "sector": "Technology",
        "industry": "Consumer Electronics",
        "market_cap": 2800000000000,
        "current_price": 178.25,
        "open": 177.50,
        "high": 179.00,
        "low": 177.00,
        "volume": 52000000,
        "summary": "애플은 아이폰, 맥, 아이패드, 애플워치 등을 설계하고 제조하는 글로벌 기술 기업입니다.",
        "trailing_pe": 28.5,
        "forward_pe": 26.2,
        "pbr": 42.8,
        "roe": 1.47,
        "opm": 0.30,
        "peg": 2.1,
        "debt_to_equity": 1.8,
        "current_ratio": 0.98,
        "quick_ratio": 0.85,
        "dividend_yield": 0.0045,
        "payout_ratio": 0.15,
        "revenue_growth": 0.08,
        "earnings_growth": 0.11,
    },
    "TSLA": {
        "name": "Tesla, Inc.",
        "sector": "Consumer Cyclical",
        "industry": "Auto Manufacturers",
        "market_cap": 650000000000,
        "current_price": 207.50,
        "open": 205.80,
        "high": 209.20,
        "low": 204.50,
        "volume": 85000000,
        "summary": "테슬라는 전기 자동차와 에너지 저장 시스템을 설계하고 제조하는 회사입니다.",
        "trailing_pe": 65.3,
        "forward_pe": 55.8,
        "pbr": 12.5,
        "roe": 0.28,
        "opm": 0.16,
        "peg": 1.8,
        "debt_to_equity": 0.5,
        "current_ratio": 1.35,
        "quick_ratio": 0.95,
        "dividend_yield": None,
        "payout_ratio": None,
        "revenue_growth": 0.37,
        "earnings_growth": 0.42,
    },
    "GOOGL": {
        "name": "Alphabet Inc.",
        "sector": "Communication Services",
        "industry": "Internet Content & Information",
        "market_cap": 1750000000000,
        "current_price": 140.85,
        "open": 139.50,
        "high": 141.50,
        "low": 139.00,
        "volume": 28000000,
        "summary": "알파벳은 구글의 모회사로, 검색, 광고, 클라우드 컴퓨팅 등의 인터넷 서비스를 제공합니다.",
        "trailing_pe": 24.8,
        "forward_pe": 22.5,
        "pbr": 6.2,
        "roe": 0.29,
        "opm": 0.32,
        "peg": 1.5,
        "debt_to_equity": 0.1,
        "current_ratio": 2.85,
        "quick_ratio": 2.60,
        "dividend_yield": None,
        "payout_ratio": None,
        "revenue_growth": 0.11,
        "earnings_growth": 0.15,
    },
    "MSFT": {
        "name": "Microsoft Corporation",
        "sector": "Technology",
        "industry": "Software—Infrastructure",
        "market_cap": 2900000000000,
        "current_price": 390.50,
        "open": 388.20,
        "high": 392.00,
        "low": 387.50,
        "volume": 25000000,
        "summary": "마이크로소프트는 소프트웨어, 클라우드 서비스, 컴퓨터 제품을 개발하고 판매하는 기술 기업입니다.",
        "trailing_pe": 35.2,
        "forward_pe": 32.8,
        "pbr": 12.5,
        "roe": 0.42,
        "opm": 0.42,
        "peg": 2.3,
        "debt_to_equity": 0.4,
        "current_ratio": 1.78,
        "quick_ratio": 1.65,
        "dividend_yield": 0.0075,
        "payout_ratio": 0.25,
        "revenue_growth": 0.13,
        "earnings_growth": 0.18,
    },
}


def get_mock_stock_data(ticker: str) -> StockData:
    """
    Mock 주식 데이터 반환

    Args:
        ticker: 주식 티커 심볼

    Returns:
        StockData 객체

    Raises:
        ValueError: Mock 데이터가 없는 티커
    """
    ticker_upper = ticker.upper()

    if ticker_upper not in MOCK_STOCKS:
        raise ValueError(
            f"Mock 데이터가 없습니다. "
            f"사용 가능한 티커: {', '.join(MOCK_STOCKS.keys())}"
        )

    mock = MOCK_STOCKS[ticker_upper]

    price = PriceInfo(
        current=mock["current_price"],
        open=mock["open"],
        high=mock["high"],
        low=mock["low"],
        volume=mock["volume"],
    )

    financials = FinancialsInfo(
        trailing_pe=mock["trailing_pe"],
        forward_pe=mock["forward_pe"],
        pbr=mock["pbr"],
        roe=mock["roe"],
        opm=mock["opm"],
        peg=mock["peg"],
        debt_to_equity=mock["debt_to_equity"],
        current_ratio=mock["current_ratio"],
        quick_ratio=mock["quick_ratio"],
        dividend_yield=mock["dividend_yield"],
        payout_ratio=mock["payout_ratio"],
        revenue_growth=mock["revenue_growth"],
        earnings_growth=mock["earnings_growth"],
    )

    company = CompanyInfo(
        name=mock["name"],
        sector=mock["sector"],
        industry=mock["industry"],
        summary_original=mock["summary"],
        summary_translated=mock["summary"],
    )

    return StockData(
        ticker=ticker_upper,
        timestamp=datetime.now(),
        market_cap=mock["market_cap"],
        price=price,
        financials=financials,
        company=company,
    )
