# -*- coding: utf-8 -*-
"""
stock_cli.py
n8n Execute Command 노드용 주식 정보 조회 CLI 도구

사용법:
    python stock_cli.py AAPL
    python stock_cli.py AAPL --pretty
"""

import json
import sys
import argparse
from datetime import datetime

try:
    import yfinance as yf
    from deep_translator import GoogleTranslator
except ImportError as e:
    error_response = {
        "success": False,
        "ticker": "",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "data": None,
        "error": f"필수 라이브러리를 찾을 수 없습니다: {str(e)}. 'pip install -r requirements_cli.txt'를 실행하세요."
    }
    print(json.dumps(error_response, ensure_ascii=False))
    sys.exit(1)


def get_stock_data_json(ticker_symbol):
    """
    티커 심볼로 주식 데이터를 조회하여 JSON 형식 딕셔너리로 반환.

    Args:
        ticker_symbol (str): 주식 티커 심볼 (예: 'AAPL')

    Returns:
        dict: JSON 스키마를 따르는 딕셔너리
    """
    response = {
        "success": False,
        "ticker": ticker_symbol.upper(),
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "data": None,
        "error": None
    }

    try:
        ticker = yf.Ticker(ticker_symbol)
        info = ticker.info

        # 유효성 검증
        if not info or not info.get('marketCap'):
            response["error"] = f"티커 '{ticker_symbol}'에 대한 데이터를 찾을 수 없습니다. 유효한 티커인지 확인하세요."
            return response

        # 데이터 정규화
        data = {
            "price": {
                "current": info.get('regularMarketPrice'),
                "open": info.get('regularMarketOpen'),
                "high": info.get('regularMarketDayHigh'),
                "low": info.get('regularMarketDayLow')
            },
            "trading": {
                "volume": info.get('regularMarketVolume'),
                "marketCap": info.get('marketCap')
            },
            "financials": {
                "roe": info.get('returnOnEquity'),
                "opm": info.get('operatingMargins'),
                "peg": info.get('pegRatio'),
                "pbr": info.get('priceToBook'),
                "debtToEquity": info.get('debtToEquity'),
                "fcf": info.get('freeCashflow')
            },
            "company": {
                "summaryOriginal": None,
                "summaryTranslated": None
            }
        }

        # 회사 개요 번역
        summary = info.get('longBusinessSummary')
        if summary:
            data["company"]["summaryOriginal"] = summary
            try:
                translator = GoogleTranslator(source='auto', target='ko')
                translated = translator.translate(summary)
                if translated and translated != summary:
                    data["company"]["summaryTranslated"] = translated
            except Exception:
                # 번역 실패 시 원본만 유지 (에러 무시)
                pass

        response["success"] = True
        response["data"] = data

    except Exception as e:
        response["error"] = f"데이터 조회 중 오류 발생: {str(e)}"

    return response


def main():
    """
    CLI 엔트리포인트. argparse로 티커를 받아 JSON 출력.
    """
    parser = argparse.ArgumentParser(
        description='주식 정보를 JSON 형식으로 조회합니다. n8n Execute Command 노드용.'
    )
    parser.add_argument(
        'ticker',
        type=str,
        help='주식 티커 심볼 (예: AAPL, GOOG)'
    )
    parser.add_argument(
        '--pretty',
        action='store_true',
        help='JSON을 들여쓰기하여 출력 (디버깅용)'
    )

    args = parser.parse_args()

    try:
        result = get_stock_data_json(args.ticker)

        # JSON 출력
        if args.pretty:
            print(json.dumps(result, ensure_ascii=False, indent=2))
        else:
            print(json.dumps(result, ensure_ascii=False))

        # 종료 코드 설정 (성공: 0, 실패: 1)
        sys.exit(0 if result["success"] else 1)

    except Exception as e:
        # 예상치 못한 에러도 JSON으로 출력
        error_response = {
            "success": False,
            "ticker": args.ticker.upper() if hasattr(args, 'ticker') else "",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "data": None,
            "error": f"치명적 오류: {str(e)}"
        }
        print(json.dumps(error_response, ensure_ascii=False))
        sys.exit(1)


if __name__ == "__main__":
    main()
