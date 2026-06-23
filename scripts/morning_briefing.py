"""
아침 시장 브리핑 스크립트
매일 오전 8시(KST) 실행하여 한국 증시 개장 전 시장 현황을 HTML로 생성한다.

사용법:
    python scripts/morning_briefing.py              # stdout 출력
    python scripts/morning_briefing.py --save       # output/ 폴더에 저장
"""

import argparse
import json
import logging
import os
import sys
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

import requests
from dotenv import load_dotenv
from yahooquery import Ticker

# ── 환경 설정 ──────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / "backend" / ".env")

FRED_API_KEY = os.getenv("FRED_API_KEY", "")
ECOS_API_KEY = os.getenv("ECOS_API_KEY", "")

KST = ZoneInfo("Asia/Seoul")
NOW_KST = datetime.now(KST)
TODAY_STR = NOW_KST.strftime("%Y-%m-%d")
TODAY_SHORT = NOW_KST.strftime("%m/%d")

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
log = logging.getLogger("briefing")

# ── 섹터 ETF 정의 (프로젝트 기존 데이터 재활용) ──────────────
US_SECTOR_ETFS = {
    "XLK": "기술", "XLF": "금융", "XLV": "헬스케어", "XLE": "에너지",
    "XLI": "산업재", "XLB": "소재", "XLY": "경기소비재", "XLP": "필수소비재",
    "XLRE": "부동산", "XLU": "유틸리티", "XLC": "커뮤니케이션",
}

KR_SECTOR_ETFS = {
    "091160.KS": "반도체", "091170.KS": "은행", "266420.KS": "헬스케어",
    "117460.KS": "에너지화학", "266370.KS": "IT", "091180.KS": "자동차",
    "117700.KS": "건설", "140710.KS": "운송", "102970.KS": "증권",
    "266390.KS": "경기소비재",
}

# ── 유틸리티 ──────────────────────────────────────────────

def arrow(val):
    """양수면 ▲(빨강), 음수면 ▼(파랑), 색상 포함 HTML 반환"""
    if val is None:
        return "N/A"
    if val > 0:
        return f'<span style="color:#dc2626;font-weight:600;">▲ {abs(val):.2f}%</span>'
    if val < 0:
        return f'<span style="color:#2563eb;font-weight:600;">▼ {abs(val):.2f}%</span>'
    return '<span style="color:#6b7280;">0.00%</span>'


def safe_pct(raw):
    """yahooquery의 등락률(0.01=1%)을 %로 변환"""
    if isinstance(raw, (int, float)):
        return raw * 100
    return None


# ── A. 미국 시장 ─────────────────────────────────────────

def fetch_us_market():
    """미국 주요 지수 + 선물 + VIX"""
    tickers_map = {
        "^GSPC": "S&P 500", "^IXIC": "NASDAQ", "^DJI": "다우",
        "^SOX": "필라델피아 반도체", "^VIX": "VIX",
        "ES=F": "S&P500 선물", "NQ=F": "나스닥 선물",
    }
    t = Ticker(list(tickers_map.keys()))
    prices = t.price
    rows = []
    for sym, name in tickers_map.items():
        p = prices.get(sym, {})
        if isinstance(p, str):
            rows.append({"name": name, "price": "N/A", "change": "N/A"})
            continue
        rows.append({
            "name": name,
            "price": f"{p.get('regularMarketPrice', 0):,.2f}",
            "change": arrow(safe_pct(p.get("regularMarketChangePercent"))),
        })
    return rows


def fetch_us_sectors():
    """미국 GICS 11개 섹터 ETF"""
    symbols = list(US_SECTOR_ETFS.keys())
    t = Ticker(symbols)
    prices = t.price
    rows = []
    for sym in symbols:
        p = prices.get(sym, {})
        if isinstance(p, str):
            continue
        rows.append({
            "symbol": sym,
            "name": US_SECTOR_ETFS[sym],
            "price": f"${p.get('regularMarketPrice', 0):,.2f}",
            "change": arrow(safe_pct(p.get("regularMarketChangePercent"))),
        })
    return rows


# ── B. 미국 금리·채권 ────────────────────────────────────

def fetch_us_rates():
    """미국채 금리 (FRED + yahooquery 이중화)"""
    result = {"10y": None, "2y": None, "ffr": None, "spread": None}

    # FRED API (전일 확정 금리)
    if FRED_API_KEY:
        try:
            from fredapi import Fred
            fred = Fred(api_key=FRED_API_KEY)
            for key, series in [("10y", "DGS10"), ("2y", "DGS2"), ("ffr", "DFF")]:
                data = fred.get_series(series, observation_start=(NOW_KST - timedelta(days=14)).strftime("%Y-%m-%d"))
                val = data.dropna().iloc[-1]
                result[key] = round(float(val), 3)
            if result["10y"] and result["2y"]:
                result["spread"] = round(result["10y"] - result["2y"], 3)
        except Exception as e:
            log.warning(f"FRED 조회 실패: {e}")

    # yahooquery 실시간 보완 (전일 대비 변화)
    rate_changes = {}
    try:
        t = Ticker(["^TNX", "^FVX"])
        prices = t.price
        for sym, label in [("^TNX", "10y_chg"), ("^FVX", "5y_chg")]:
            p = prices.get(sym, {})
            if not isinstance(p, str):
                rate_changes[label] = round(p.get("regularMarketChange", 0) * 100, 1)  # bp
    except Exception as e:
        log.warning(f"금리 실시간 조회 실패: {e}")

    result["rate_changes"] = rate_changes
    return result


def fetch_fomc_info():
    """FOMC 일정 (하드코딩, 연초에 한 번 업데이트)"""
    fomc_2026 = [
        "2026-01-28", "2026-03-18", "2026-05-06", "2026-06-17",
        "2026-07-29", "2026-09-16", "2026-11-04", "2026-12-16",
    ]
    today = NOW_KST.date()
    upcoming = [d for d in fomc_2026 if datetime.strptime(d, "%Y-%m-%d").date() >= today]
    next_fomc = upcoming[0] if upcoming else "N/A"
    days_left = (datetime.strptime(next_fomc, "%Y-%m-%d").date() - today).days if next_fomc != "N/A" else None
    return {"next_fomc": next_fomc, "days_left": days_left}


# ── C. 한국 시장 ─────────────────────────────────────────

def fetch_kr_market():
    """코스피·코스닥 지수"""
    t = Ticker(["^KS11", "^KQ11"])
    prices = t.price
    rows = []
    for sym, name in [("^KS11", "코스피"), ("^KQ11", "코스닥")]:
        p = prices.get(sym, {})
        if isinstance(p, str):
            rows.append({"name": name, "price": "N/A", "change": "N/A"})
            continue
        rows.append({
            "name": name,
            "price": f"{p.get('regularMarketPrice', 0):,.2f}",
            "change": arrow(safe_pct(p.get("regularMarketChangePercent"))),
        })
    return rows


def fetch_kr_sectors():
    """한국 KODEX 10개 섹터 ETF"""
    symbols = list(KR_SECTOR_ETFS.keys())
    t = Ticker(symbols)
    prices = t.price
    rows = []
    for sym in symbols:
        p = prices.get(sym, {})
        if isinstance(p, str):
            continue
        rows.append({
            "symbol": sym.replace(".KS", ""),
            "name": KR_SECTOR_ETFS[sym],
            "price": f"₩{p.get('regularMarketPrice', 0):,.0f}",
            "change": arrow(safe_pct(p.get("regularMarketChangePercent"))),
        })
    return rows


def fetch_bok_rate():
    """한국은행 기준금리 (ECOS API)"""
    if not ECOS_API_KEY:
        return "N/A (ECOS_API_KEY 미설정)"
    try:
        url = (
            f"https://ecos.bok.or.kr/api/StatisticSearch/{ECOS_API_KEY}"
            f"/json/kr/1/5/722Y001/M/202501/202612/0101000"
        )
        resp = requests.get(url, timeout=10)
        data = resp.json()
        rows = data.get("StatisticSearch", {}).get("row", [])
        if rows:
            return f"{rows[-1]['DATA_VALUE']}%"
    except Exception as e:
        log.warning(f"ECOS 조회 실패: {e}")
    return "N/A (조회 실패)"


# ── D. 환율·원자재 ────────────────────────────────────────

def fetch_fx_commodities():
    """환율, 달러인덱스, WTI, 금, 비트코인"""
    items = {
        "KRW=X": ("USD/KRW", "₩"), "JPY=X": ("USD/JPY", "¥"),
        "CNY=X": ("USD/CNY", "¥"), "DX-Y.NYB": ("달러인덱스", ""),
        "CL=F": ("WTI 유가", "$"), "GC=F": ("금", "$"),
        "BTC-USD": ("비트코인", "$"),
    }
    t = Ticker(list(items.keys()))
    prices = t.price
    rows = []
    for sym, (name, prefix) in items.items():
        p = prices.get(sym, {})
        if isinstance(p, str):
            rows.append({"name": name, "price": "N/A", "change": "N/A"})
            continue
        val = p.get("regularMarketPrice", 0)
        fmt = f"{prefix}{val:,.2f}" if val < 100000 else f"{prefix}{val:,.0f}"
        rows.append({
            "name": name,
            "price": fmt,
            "change": arrow(safe_pct(p.get("regularMarketChangePercent"))),
        })
    return rows


# ── 데이터 수집 통합 ──────────────────────────────────────

def collect_all():
    """모든 섹션 데이터를 수집하여 dict로 반환"""
    log.info("데이터 수집 시작...")
    data = {}

    data["us_market"] = fetch_us_market()
    log.info(f"  A. 미국 지수/선물: {len(data['us_market'])}건")

    data["us_sectors"] = fetch_us_sectors()
    log.info(f"  A. 미국 섹터 ETF: {len(data['us_sectors'])}건")

    data["us_rates"] = fetch_us_rates()
    log.info(f"  B. 미국 금리: 10Y={data['us_rates']['10y']}")

    data["fomc"] = fetch_fomc_info()
    log.info(f"  B. 다음 FOMC: {data['fomc']['next_fomc']}")

    data["kr_market"] = fetch_kr_market()
    log.info(f"  C. 한국 지수: {len(data['kr_market'])}건")

    data["kr_sectors"] = fetch_kr_sectors()
    log.info(f"  C. 한국 섹터 ETF: {len(data['kr_sectors'])}건")

    data["bok_rate"] = fetch_bok_rate()
    log.info(f"  C. 한국은행 기준금리: {data['bok_rate']}")

    data["fx_commodities"] = fetch_fx_commodities()
    log.info(f"  D. 환율/원자재: {len(data['fx_commodities'])}건")

    log.info("데이터 수집 완료")
    return data


# ── HTML 생성 ─────────────────────────────────────────────

TABLE_STYLE = (
    "border-collapse:collapse;width:100%;font-size:13px;font-family:"
    "'Pretendard','Apple SD Gothic Neo','Malgun Gothic',sans-serif;"
)
TH_STYLE = "background:#6366F1;color:#fff;padding:6px 10px;text-align:left;font-weight:600;"
TD_STYLE = "padding:5px 10px;border-bottom:1px solid #e5e7eb;"
SECTION_STYLE = "margin:18px 0 8px;font-size:15px;font-weight:700;color:#4338ca;"


def _table(headers, rows, key_map):
    """범용 HTML 테이블 생성"""
    ths = "".join(f'<th style="{TH_STYLE}">{h}</th>' for h in headers)
    trs = ""
    for i, row in enumerate(rows):
        bg = "#f9fafb" if i % 2 == 1 else "#fff"
        tds = "".join(f'<td style="{TD_STYLE}">{row.get(k, "")}</td>' for k in key_map)
        trs += f'<tr style="background:{bg}">{tds}</tr>'
    return f'<table style="{TABLE_STYLE}"><thead><tr>{ths}</tr></thead><tbody>{trs}</tbody></table>'


def build_html(data):
    """수집 데이터를 HTML 이메일로 조립"""
    rates = data["us_rates"]
    fomc = data["fomc"]

    # 금리 요약 텍스트
    spread = rates.get("spread")
    spread_text = "N/A"
    if spread is not None:
        label = "정상" if spread > 0 else "역전 ⚠️"
        spread_text = f"{spread:+.3f}%p ({label})"

    rate_10y_chg = rates.get("rate_changes", {}).get("10y_chg", "N/A")
    if isinstance(rate_10y_chg, (int, float)):
        rate_10y_chg = f"{rate_10y_chg:+.1f}bp"

    fomc_text = fomc["next_fomc"]
    if fomc["days_left"] is not None:
        fomc_text += f" (D-{fomc['days_left']})"

    html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:20px;background:#f3f4f6;font-family:'Pretendard','Malgun Gothic',sans-serif;">
<div style="max-width:680px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

<!-- 헤더 -->
<div style="background:linear-gradient(135deg,#4338ca,#6366F1);padding:20px 24px;color:#fff;">
  <h1 style="margin:0;font-size:20px;">📊 아침 시장 브리핑</h1>
  <p style="margin:4px 0 0;font-size:13px;opacity:0.85;">{TODAY_STR} (KST {NOW_KST.strftime('%H:%M')}) | 한국 증시 개장 전 점검</p>
</div>

<div style="padding:16px 24px;">

<!-- A. 미국 지수/선물 -->
<div style="{SECTION_STYLE}">A. 미국 지수 · 선물</div>
{_table(["지표", "현재가", "등락"], data["us_market"], ["name", "price", "change"])}

<!-- A. 미국 섹터 ETF -->
<div style="{SECTION_STYLE}">A. 미국 GICS 섹터 ETF</div>
{_table(["섹터", "ETF", "현재가", "등락"], data["us_sectors"], ["name", "symbol", "price", "change"])}

<!-- B. 금리·채권 -->
<div style="{SECTION_STYLE}">B. 미국 금리 · 채권</div>
<table style="{TABLE_STYLE}">
<thead><tr>
  <th style="{TH_STYLE}">항목</th><th style="{TH_STYLE}">수치</th>
</tr></thead>
<tbody>
  <tr><td style="{TD_STYLE}">미 국채 10년</td><td style="{TD_STYLE}">{rates.get('10y','N/A')}% ({rate_10y_chg})</td></tr>
  <tr style="background:#f9fafb"><td style="{TD_STYLE}">미 국채 2년</td><td style="{TD_STYLE}">{rates.get('2y','N/A')}%</td></tr>
  <tr><td style="{TD_STYLE}">장단기 금리차 (10Y-2Y)</td><td style="{TD_STYLE}">{spread_text}</td></tr>
  <tr style="background:#f9fafb"><td style="{TD_STYLE}">연방기금금리(실효)</td><td style="{TD_STYLE}">{rates.get('ffr','N/A')}%</td></tr>
  <tr><td style="{TD_STYLE}">다음 FOMC</td><td style="{TD_STYLE}">{fomc_text}</td></tr>
</tbody></table>

<!-- C. 한국 시장 -->
<div style="{SECTION_STYLE}">C. 한국 시장</div>
{_table(["지수", "현재가", "등락"], data["kr_market"], ["name", "price", "change"])}

<div style="{SECTION_STYLE}">C. 한국 KODEX 섹터 ETF</div>
{_table(["섹터", "코드", "현재가", "등락"], data["kr_sectors"], ["name", "symbol", "price", "change"])}

<table style="{TABLE_STYLE};margin-top:8px">
<tbody>
  <tr><td style="{TD_STYLE}">한국은행 기준금리</td><td style="{TD_STYLE}">{data['bok_rate']}</td></tr>
  <tr style="background:#f9fafb"><td style="{TD_STYLE}">외국인/기관 수급</td><td style="{TD_STYLE}">N/A (pykrx 호환 이슈)</td></tr>
</tbody></table>

<!-- D. 환율·원자재 -->
<div style="{SECTION_STYLE}">D. 환율 · 원자재</div>
{_table(["항목", "현재가", "등락"], data["fx_commodities"], ["name", "price", "change"])}

<!-- 하단 안내 -->
<div style="margin-top:20px;padding:12px 16px;background:#fef3c7;border-left:4px solid #f59e0b;border-radius:4px;font-size:12px;color:#92400e;">
  ⚠️ 본 브리핑은 정보 제공 목적이며 매매 추천이 아닙니다. 조회 실패 항목은 "N/A"로 표기됩니다.
</div>

</div></div></body></html>"""
    return html


# ── 메인 ──────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="아침 시장 브리핑 생성")
    parser.add_argument("--save", action="store_true", help="output/ 폴더에 HTML 파일 저장")
    args = parser.parse_args()

    data = collect_all()
    html = build_html(data)

    if args.save:
        out_dir = PROJECT_ROOT / "output" / "briefing"
        out_dir.mkdir(parents=True, exist_ok=True)
        filename = f"briefing_{NOW_KST.strftime('%Y%m%d_%H%M')}.html"
        out_path = out_dir / filename
        out_path.write_text(html, encoding="utf-8")
        log.info(f"저장 완료: {out_path}")
    else:
        sys.stdout.reconfigure(encoding="utf-8")
        print(html)


if __name__ == "__main__":
    main()
