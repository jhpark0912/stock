/**
 * stock_api.js
 * n8n Code 노드용 주식 정보 조회 JavaScript 모듈
 *
 * 사용법:
 *   Node.js CLI: node stock_api.js AAPL
 *   n8n Code 노드: 전체 코드를 복사하여 사용
 */

const yahooFinance = require('yahoo-finance2').default;
const translate = require('@vitalets/google-translate-api');

/**
 * 티커 심볼로 주식 데이터를 조회하여 JSON 형식 객체로 반환.
 *
 * @param {string} ticker - 주식 티커 심볼 (예: 'AAPL')
 * @returns {Promise<object>} JSON 스키마를 따르는 객체
 */
async function getStockDataJson(ticker) {
  const response = {
    success: false,
    ticker: ticker.toUpperCase(),
    timestamp: new Date().toISOString(),
    data: null,
    error: null
  };

  try {
    // yfinance의 ticker.info에 해당하는 quote 조회
    const quote = await yahooFinance.quote(ticker);

    // 유효성 검증
    if (!quote || !quote.marketCap) {
      response.error = `티커 '${ticker}'에 대한 데이터를 찾을 수 없습니다. 유효한 티커인지 확인하세요.`;
      return response;
    }

    // 데이터 정규화
    const data = {
      price: {
        current: quote.regularMarketPrice || null,
        open: quote.regularMarketOpen || null,
        high: quote.regularMarketDayHigh || null,
        low: quote.regularMarketDayLow || null
      },
      trading: {
        volume: quote.regularMarketVolume || null,
        marketCap: quote.marketCap || null
      },
      financials: {
        roe: quote.returnOnEquity || null,
        opm: quote.operatingMargins || null,
        peg: quote.pegRatio || null,
        pbr: quote.priceToBook || null,
        debtToEquity: quote.debtToEquity || null,
        fcf: quote.freeCashflow || null
      },
      company: {
        summaryOriginal: null,
        summaryTranslated: null
      }
    };

    // 회사 개요 번역
    if (quote.longBusinessSummary) {
      data.company.summaryOriginal = quote.longBusinessSummary;
      try {
        const translated = await translate(quote.longBusinessSummary, { to: 'ko' });
        if (translated && translated.text && translated.text !== quote.longBusinessSummary) {
          data.company.summaryTranslated = translated.text;
        }
      } catch (e) {
        // 번역 실패 시 원본만 유지 (에러 무시)
      }
    }

    response.success = true;
    response.data = data;

  } catch (error) {
    response.error = `데이터 조회 중 오류 발생: ${error.message}`;
  }

  return response;
}

// n8n Code 노드에서는 module.exports 제거하고 직접 사용
module.exports = { getStockDataJson };

// CLI 실행용 (Node.js로 직접 실행 시)
if (require.main === module) {
  const ticker = process.argv[2];
  const pretty = process.argv.includes('--pretty');

  if (!ticker) {
    console.error('사용법: node stock_api.js <TICKER> [--pretty]');
    console.error('예시: node stock_api.js AAPL');
    process.exit(1);
  }

  getStockDataJson(ticker).then(result => {
    console.log(JSON.stringify(result, null, pretty ? 2 : 0));
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    const errorResponse = {
      success: false,
      ticker: ticker.toUpperCase(),
      timestamp: new Date().toISOString(),
      data: null,
      error: `치명적 오류: ${error.message}`
    };
    console.log(JSON.stringify(errorResponse));
    process.exit(1);
  });
}
