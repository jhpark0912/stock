# 프론트엔드 리팩토링 계획서

## 📋 개요

### 목적
- 주식 분석 대시보드 UI/UX 개선
- 컴포넌트 구조 유지하면서 레이아웃만 변경 (유지보수성 확보)
- 영문 → 한글 전환
- AI 분석 및 뉴스 기능 통합

### 주요 요구사항
1. ✅ 검색 UI 개선: 중앙 배치 + 검색 버튼 추가
2. ✅ 한글 UI: 모든 영문 → 한글
3. ✅ 컴팩트 레이아웃: 스크롤 최소화, 공백 제거
4. ✅ AI 분석 통합: StockAnalysis 컴포넌트 활용
5. ✅ 심플한 디자인: 주식 분석 티를 내지 않는 깔끔한 UI

---

## 🎯 현재 상태 분석

### 컴포넌트 구조
```
App.tsx
└── StockDashboard.tsx (메인 레이아웃)
    ├── StockInfo.tsx (회사 정보, 가격, 재무 지표)
    ├── TechnicalChartCard.tsx (기술적 지표)
    ├── StockAnalysis.tsx (AI 분석) ❌ 미통합
    └── StockNews.tsx (뉴스) ❌ 미통합
```

### API 구조
- `GET /api/stock/{ticker}?include_technical=true` - 주식 데이터
- `GET /api/stock/{ticker}/news` - 뉴스 (별도 호출 필요)
- `POST /api/stock/{ticker}/analysis` - AI 분석 (별도 호출 필요)

### 문제점
1. AI 분석, 뉴스가 StockDashboard에 통합되어 있지 않음
2. 검색 버튼 없음 (Enter로만 검색)
3. 영문 UI (Overview, Financials, News 등)
4. 카드 레이아웃이 너무 크게 분배되어 스크롤이 김
5. 불필요한 네비게이션 메뉴

---

## 🔧 솔루션 설계

### 옵션 선택: **옵션 B - 컴포넌트 유지하되 레이아웃만 변경**

**장점:**
- 기존 컴포넌트 구조 유지 → 유지보수성
- 각 컴포넌트의 역할이 명확
- 재사용성 확보

**단점:**
- props 전달이 복잡해질 수 있음 (관리 필요)

---

## 📐 레이아웃 설계

### 1. 데이터 없을 때 (Empty State)

```
┌─────────────────────────────────────────────────┐
│  [로고] 주식 분석                                 │
└─────────────────────────────────────────────────┘

              [🔍 아이콘]
         종목을 검색하세요
   티커 심볼을 입력하여 분석을 시작하세요

   ┌──────────────────────┬─────────┐
   │   예: AAPL, TSLA     │  [검색]  │
   └──────────────────────┴─────────┘
```

### 2. 데이터 있을 때 (Main Layout) - AI 포커스

```
┌─────────────────────────────────────────────────┐
│  [로고] 주식 분석    [검색창] [검색 버튼]         │ ← Sticky Header
└─────────────────────────────────────────────────┘

┌──────────────────────────┬─────────────────────┐
│   회사 정보 (2/3)          │   현재가 (1/3)       │
│   - 회사명, 설명           │   - 가격, 변동률     │
│   - 섹터/산업              │   - 시가총액         │
└──────────────────────────┴─────────────────────┘

┌─────────────────────────────────────────────────┐
│              주요 재무 지표 (4-6 컬럼)             │
│   PER | PBR | ROE | 영업이익률 | 부채비율 | ...   │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│            🤖 AI 투자 분석 (전체 너비)            │ ← 강조
│                                                 │
│  - 종합 평가                                     │
│  - 강점/약점 분석                                │
│  - 투자 추천                                     │
│  - 리스크 요인                                   │
│                                                 │
└─────────────────────────────────────────────────┘

┌──────────────────────────┬─────────────────────┐
│   기술적 지표 (1/2)        │   최신 뉴스 (1/2)    │ ← 컴팩트
│   - RSI, MACD (컴팩트)    │   - 주요 뉴스 3-5개  │
│   - 이동평균, 볼린저밴드   │   - 간략 표시        │
└──────────────────────────┴─────────────────────┘
```

**디자인 철학:**
- **AI 분석이 메인**: 전체 너비 카드로 가장 눈에 띄게 배치
- **뉴스는 보조**: 3-5개만 간략하게 표시, 상세한 내용은 링크 클릭
- **기술적 지표 컴팩트**: 필수 지표만 간략하게 (탭 또는 축약)
- **스크롤 최소화**: AI 분석을 중심으로 정보 집중

---

## 📝 파일별 수정 사항

### 1. App.tsx

**변경 사항:**
- state 추가: `newsData`, `aiAnalysis`
- `fetchStockData` 함수 확장

**구현 계획:**
```typescript
const [stockData, setStockData] = useState<StockData | null>(null);
const [newsData, setNewsData] = useState<NewsItem[] | null>(null);
const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
const [error, setError] = useState<string | null>(null);
const [isLoading, setIsLoading] = useState(false);

const fetchStockData = async (tickerSymbol: string) => {
  setIsLoading(true);
  setError(null);
  setStockData(null);
  setNewsData(null);
  setAiAnalysis(null);

  try {
    // 1. 주식 데이터 조회
    const stockResponse = await api.get<ApiResponse<StockData>>(
      `/api/stock/${tickerSymbol}?include_technical=true`
    );

    if (stockResponse.data.success && stockResponse.data.data) {
      const stock = stockResponse.data.data;
      setStockData(stock);

      // 2. 뉴스 + AI 분석 병렬 조회
      const [newsResponse, analysisResponse] = await Promise.allSettled([
        api.get(`/api/stock/${tickerSymbol}/news`),
        api.post(`/api/stock/${tickerSymbol}/analysis`, stock)
      ]);

      // 뉴스 처리
      if (newsResponse.status === 'fulfilled' && newsResponse.value.data.success) {
        setNewsData(newsResponse.value.data.data);
      }

      // AI 분석 처리
      if (analysisResponse.status === 'fulfilled' && analysisResponse.value.data.success) {
        setAiAnalysis(analysisResponse.value.data.data);
      }
    } else {
      setError(stockResponse.data.error || 'Unknown error');
    }
  } catch (err) {
    // 에러 처리
  } finally {
    setIsLoading(false);
  }
};
```

**장점:**
- `Promise.allSettled` 사용으로 일부 API 실패해도 계속 진행
- 각 데이터를 독립적으로 state 관리

---

### 2. StockInfo.tsx

**변경 사항:**
- 내부 컴포넌트 분리 (한 파일에서 여러 export)
- 한글화
- 컴팩트 스타일링

**구현 계획:**
```typescript
// StockInfo.tsx

// 회사 정보 카드
export const CompanyInfoCard = ({ data }: { data: StockData }) => {
  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-start gap-3">
        <Building2 className="w-6 h-6 text-gray-600" />
        <div className="flex-1">
          <h2 className="text-xl font-semibold">{data.company.name}</h2>
          <p className="text-sm text-gray-500">{data.ticker}</p>
          
          {data.company.sector && (
            <div className="flex gap-2 mt-2">
              <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                {data.company.sector}
              </span>
              {data.company.industry && (
                <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs">
                  {data.company.industry}
                </span>
              )}
            </div>
          )}
          
          {data.company.summary_translated && (
            <p className="text-sm text-gray-700 mt-3 leading-relaxed">
              {data.company.summary_translated}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// 현재가 카드
export const PriceCard = ({ data }: { data: StockData }) => {
  const priceChange = data.price.current - data.price.open;
  const priceChangePercent = data.price.open 
    ? ((priceChange / data.price.open) * 100) 
    : 0;
  const isPositive = priceChangePercent > 0;

  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="text-sm text-gray-500 mb-2">현재가</h3>
      <div className="text-3xl font-bold">
        ${data.price.current.toFixed(2)}
      </div>
      <div className={`flex items-center gap-1 mt-2 ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
        {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
        <span className="text-sm font-medium">
          {isPositive ? '+' : ''}{priceChange.toFixed(2)} ({isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%)
        </span>
      </div>
      <div className="mt-4 pt-4 border-t">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">시가총액</span>
          <span className="font-semibold">{formatMarketCap(data.market_cap)}</span>
        </div>
      </div>
    </div>
  );
};

// 재무 지표 카드
export const FinancialMetricsCard = ({ data }: { data: StockData }) => {
  return (
    <div className="bg-white rounded-lg border p-4">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">주요 재무 지표</h3>
      <div className="grid grid-cols-4 gap-4">
        <MetricItem label="PER" value={data.financials.trailing_pe} />
        <MetricItem label="PBR" value={data.financials.pbr} />
        <MetricItem label="ROE" value={data.financials.roe} format="percent" />
        <MetricItem label="영업이익률" value={data.financials.opm} format="percent" />
        <MetricItem label="부채비율" value={data.financials.debt_to_equity} />
        <MetricItem label="유동비율" value={data.financials.current_ratio} />
      </div>
    </div>
  );
};

// 헬퍼 컴포넌트
const MetricItem = ({ label, value, format }: { label: string; value: number | null; format?: 'number' | 'percent' }) => {
  const formattedValue = value !== null && value !== undefined
    ? format === 'percent' 
      ? `${(value * 100).toFixed(1)}%`
      : value.toFixed(2)
    : 'N/A';
    
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-lg font-semibold">{formattedValue}</p>
    </div>
  );
};

// 기존 StockInfo는 호환성을 위해 유지
export default function StockInfo({ data }: { data: StockData }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <CompanyInfoCard data={data} className="col-span-2" />
        <PriceCard data={data} />
      </div>
      <FinancialMetricsCard data={data} />
    </div>
  );
}
```

---

### 3. TechnicalChartCard.tsx

**변경 사항:**
- 한글화
- 컴팩트 레이아웃 (4개 카드 → 1개 카드 with 탭 또는 2x2 그리드)

**한글 매핑:**
| 영문 | 한글 |
|------|------|
| Moving Averages | 이동평균 |
| Simple and Exponential Moving Averages | 단순/지수 이동평균 |
| RSI (Relative Strength Index) | 상대강도지수 (RSI) |
| 14-day RSI momentum indicator | 14일 RSI 모멘텀 지표 |
| MACD | MACD |
| Moving Average Convergence Divergence | 이동평균 수렴확산 |
| Bollinger Bands | 볼린저 밴드 |
| Volatility and price level indicator | 변동성 및 가격 수준 지표 |
| Oversold | 과매도 |
| Overbought | 과매수 |
| Neutral | 중립 |
| MACD Line | MACD 선 |
| Signal Line | 시그널 선 |
| Histogram | 히스토그램 |
| Upper Band | 상단 밴드 |
| Middle Band | 중간 밴드 |
| Lower Band | 하단 밴드 |
| Loading technical indicators... | 기술적 지표 로딩 중... |
| Loading data... | 데이터 로딩 중... |

**레이아웃 전략:**
- 옵션 A: 탭으로 전환 (이동평균 | RSI | MACD | 볼린저밴드)
- 옵션 B: 2x2 그리드로 컴팩트하게 배치 ✅ 권장

---

### 4. StockAnalysis.tsx

**변경 사항:**
- 에러 메시지 한글화
- AI 포커스를 위한 간결한 스타일 (StockDashboard에서 래핑)

**수정:**
```typescript
// StockAnalysis는 순수하게 컨텐츠만 렌더링 (타이틀 제외)
// StockDashboard에서 AI 강조 스타일 래핑

if (error) {
  return (
    <div className="flex items-center gap-2 text-red-600">
      <AlertCircle className="w-4 h-4" />
      <p className="text-sm">{error}</p>
    </div>
  );
}

if (!analysis) {
  return (
    <div className="text-center py-8 text-gray-500">
      <p className="text-sm">AI 분석을 생성 중입니다...</p>
    </div>
  );
}

return (
  <div className="prose prose-sm max-w-none text-gray-700">
    <ReactMarkdown remarkPlugins={[remarkGfm]}>
      {analysis.report}
    </ReactMarkdown>
  </div>
);
```

**특징:**
- 타이틀과 아이콘은 StockDashboard에서 관리
- AI 분석 컨텐츠에만 집중
- 로딩 상태 추가 (analysis가 null일 때)
- 에러 메시지 간소화

---

### 5. StockDashboard.tsx

**변경 사항:**
- props 추가: `newsData`, `aiAnalysis`
- 검색 UI 개선 (중앙 배치 + 버튼)
- 헤더 간소화 (네비게이션 제거)
- 레이아웃 재구성
- 한글화

**레이아웃 구조:**
```typescript
// StockDashboard.tsx

interface StockDashboardProps {
  data: StockData | null;
  newsData: NewsItem[] | null;
  aiAnalysis: AIAnalysis | null;
  onSearch: (ticker: string) => void;
  isLoading?: boolean;
}

export default function StockDashboard({ 
  data, 
  newsData, 
  aiAnalysis, 
  onSearch, 
  isLoading = false 
}: StockDashboardProps) {
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim().toUpperCase());
    }
  };

  // Empty State
  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <header className="bg-white border-b px-4 py-3">
          <div className="max-w-6xl mx-auto flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-semibold">주식 분석</span>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-xl text-center">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">종목을 검색하세요</h2>
            <p className="text-gray-500 mb-6">티커 심볼을 입력하여 분석을 시작하세요</p>
            
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                placeholder="예: AAPL, TSLA, GOOGL"
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !searchQuery.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isLoading ? '로딩 중...' : '검색'}
              </button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  // Main Layout
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Header */}
      <header className="bg-white border-b px-4 py-3 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <span className="text-lg font-semibold">주식 분석</span>
          </div>
          
          <form onSubmit={handleSearch} className="flex gap-2 flex-1 max-w-md">
            <input
              type="text"
              placeholder="종목 검색..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !searchQuery.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 text-sm font-medium"
            >
              {isLoading ? '로딩 중...' : '검색'}
            </button>
          </form>
        </div>
      </header>

      {/* Loading State */}
      {isLoading && (
        <div className="max-w-6xl mx-auto px-4 py-16">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="ml-4 text-gray-600">데이터를 불러오는 중...</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      {!isLoading && (
        <main className="max-w-6xl mx-auto px-4 py-4 space-y-4">
          {/* Row 1: 회사 정보 + 현재가 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <CompanyInfoCard data={data} />
            </div>
            <PriceCard data={data} />
          </div>

          {/* Row 2: 주요 재무 지표 */}
          <FinancialMetricsCard data={data} />

          {/* Row 3: AI 분석 (전체 너비, 강조) */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 p-6 shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">AI 투자 분석</h3>
            </div>
            <StockAnalysis analysis={aiAnalysis} error={null} />
          </div>

          {/* Row 4: 기술적 지표 + 뉴스 (컴팩트) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <TechnicalChartCard data={data.technical_indicators} compact />
            <StockNews news={newsData?.slice(0, 5) || []} compact />
          </div>
        </main>
      )}
    </div>
  );
}
```

---

### 6. StockNews.tsx

**변경 사항:**
- 레이아웃 확인 (이미 한글화됨)
- 컴팩트 스타일링 (compact prop 추가)
- 뉴스 개수 제한 (3-5개만 표시)

**수정:**
```typescript
// 제목에서 불필요한 아이콘 제거하거나 간소화
<div className="bg-white rounded-lg border p-4">
  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
    <Newspaper className="w-4 h-4" />
    관련 뉴스
  </h3>
  
  {!news || news.length === 0 ? (
    <p className="text-sm text-gray-500">관련 뉴스가 없습니다.</p>
  ) : (
    <div className="space-y-2">
      {news.map((item, index) => (
        <a
          key={index}
          href={item.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block p-3 border rounded-lg hover:border-blue-300 hover:shadow-sm transition-all group"
        >
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm font-medium text-gray-700 group-hover:text-blue-600 flex-1">
              {item.title}
            </h4>
            <ExternalLink className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5" />
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
            <span className="font-medium">{item.source || '출처 없음'}</span>
            <span>·</span>
            <span>{formatDate(item.published_at)}</span>
          </div>
        </a>
      ))}
    </div>
  )}
</div>
```

---

## 🎨 스타일 가이드

### 색상 팔레트
- 메인: `blue-600` (#2563eb)
- 배경: `gray-50` (#f9fafb)
- 카드: `white` (#ffffff)
- **AI 카드 배경**: `from-blue-50 to-indigo-50` (그라데이션)
- **AI 카드 테두리**: `border-blue-200` (강조)
- 텍스트: `gray-700`, `gray-500` (주요/보조)
- 양수: `green-500` (#22c55e)
- 음수: `red-500` (#ef4444)

### 간격 (Spacing)
- 컨테이너 패딩: `px-4 py-4` (16px)
- 카드 패딩: `p-4` (16px)
- 카드 간격: `gap-4` (16px)
- 섹션 간격: `space-y-4` (16px)

### 타이포그래피
- 헤더 타이틀: `text-lg font-semibold`
- 카드 타이틀: `text-xl font-semibold`
- 서브 타이틀: `text-sm font-semibold text-gray-700`
- 본문: `text-sm text-gray-700`
- 라벨: `text-xs text-gray-500`
- 숫자 (강조): `text-lg font-semibold` ~ `text-3xl font-bold`

### 반응형
- 기본: 모바일 우선 (`grid-cols-1`)
- 태블릿 이상: `md:grid-cols-2`, `md:grid-cols-4`
- 데스크탑 이상: `lg:grid-cols-3`, `lg:col-span-2`

---

## ✅ 작업 순서

1. ✅ **docs/frontend-refactoring-plan.md** 작성 - AI 포커스 레이아웃
2. ⏳ **App.tsx** 수정 - 뉴스/AI 분석 API 통합
3. ⏳ **StockInfo.tsx** 수정 - 컴포넌트 분리 및 한글화
4. ⏳ **TechnicalChartCard.tsx** 수정 - 한글화 및 컴팩트 레이아웃 (compact prop)
5. ⏳ **StockAnalysis.tsx** 수정 - 한글화 및 간결한 스타일
6. ⏳ **StockNews.tsx** 수정 - 컴팩트 버전 (compact prop, 3-5개만 표시)
7. ⏳ **StockDashboard.tsx** 수정 - AI 포커스 레이아웃 적용
8. ⏳ **전체 스타일링 최종 조정 및 테스트**

---

## 🔍 검증 체크리스트

### 기능
- [ ] 검색 기능 동작 (Enter + 버튼 클릭)
- [ ] 주식 데이터 조회 및 표시
- [ ] 뉴스 조회 및 표시
- [ ] AI 분석 조회 및 표시
- [ ] 기술적 지표 표시
- [ ] 에러 처리 (잘못된 티커, API 실패 등)
- [ ] 로딩 상태 표시

### UI/UX
- [ ] 검색창 중앙 배치 (Empty State)
- [ ] 검색창 상단 배치 (Main State)
- [ ] 모든 텍스트 한글화
- [ ] **AI 분석 카드 강조** (전체 너비, 그라데이션 배경, 눈에 띄는 스타일)
- [ ] 뉴스 컴팩트 표시 (3-5개만, 간략하게)
- [ ] 기술적 지표 컴팩트 배치
- [ ] 컴팩트한 레이아웃 (스크롤 최소화)
- [ ] 반응형 레이아웃 (모바일, 태블릿, 데스크탑)
- [ ] 심플한 디자인 (불필요한 장식 제거)

### 코드 품질
- [ ] TypeScript 타입 에러 없음
- [ ] ESLint 경고 없음
- [ ] 컴포넌트 재사용성 확보
- [ ] props 인터페이스 명확
- [ ] 에러 바운더리 처리

---

## 📚 참고 사항

### API 응답 타입
```typescript
// StockResponse
interface StockResponse {
  success: boolean;
  data: StockData | null;
  error: string | null;
}

// NewsResponse
interface NewsResponse {
  success: boolean;
  data: NewsItem[] | null;
  error: string | null;
}

// AnalysisResponse
interface AnalysisResponse {
  success: boolean;
  data: AIAnalysis | null;
  error: string | null;
}
```

### Promise.allSettled 사용 이유
- `Promise.all`과 달리 하나라도 실패하면 전체 실패하지 않음
- 각 API 결과를 개별적으로 처리 가능
- 뉴스나 AI 분석 실패해도 주식 데이터는 표시 가능

```typescript
const [newsResponse, analysisResponse] = await Promise.allSettled([
  api.get('/news'),
  api.post('/analysis', data)
]);

// fulfilled: 성공
// rejected: 실패
if (newsResponse.status === 'fulfilled') {
  setNewsData(newsResponse.value.data.data);
}
```

---

## 🚀 다음 단계

계획 문서 작성 완료 후:
1. 사용자 승인 대기
2. 승인 후 순차적으로 구현 시작
3. 각 단계별로 TodoWrite 업데이트
4. 최종 완료 후 테스트 및 문서 업데이트

---

## 📌 주의사항

- **기존 타입 정의 변경 금지**: StockData, NewsItem, AIAnalysis 등
- **백엔드 API 변경 금지**: 프론트엔드만 수정
- **기존 컴포넌트 삭제 금지**: 분리/확장만 수행
- **점진적 리팩토링**: 한 번에 모든 것을 바꾸지 않고 단계별로 진행
- **테스트 필수**: 각 단계 완료 시 동작 확인

---

## 🎯 AI 포커스 디자인 요약

### 레이아웃 우선순위
1. **AI 분석** (최상위) - 전체 너비, 강조 스타일
2. 회사 정보 + 현재가 (중요)
3. 재무 지표 (중요)
4. 기술적 지표 + 뉴스 (보조) - 컴팩트

### AI 카드 강조 방법
- **전체 너비** 배치
- **그라데이션 배경**: `from-blue-50 to-indigo-50`
- **강조 테두리**: `border-2 border-blue-200`
- **그림자 효과**: `shadow-md`
- **아이콘**: `Sparkles` (✨) 사용
- **타이틀 크기**: `text-lg font-semibold`

### 뉴스 축소 방법
- 전체 너비 → 1/2 너비로 축소
- 최신 뉴스 **3-5개만** 표시 (`.slice(0, 5)`)
- `compact` prop으로 간결한 스타일
- 기술적 지표와 동일한 높이로 배치

### 사용자 경험 개선
- AI 분석을 가장 먼저 볼 수 있도록 배치
- 뉴스는 보조 정보로 간략하게
- 전체적으로 스크롤 최소화
- 심플하고 깔끔한 디자인

---

**작성일:** 2026-01-29
**작성자:** Claude Code
**버전:** 1.1 (AI 포커스)
