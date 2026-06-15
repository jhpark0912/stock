# AI 분석 요약 저장 기능 구현 계획

> 작성일: 2026-02-13

## 📋 요구사항 요약

1. **요약 기능**: AI 분석 결과를 3줄 내외로 요약 + 투자 전략(buy, hold, sell) 저장
2. **저장 기능**: 요약된 내용을 DB에 저장하고 이후 확인 가능
3. **티커별 관리**: 티커별로 저장하며, 티커 삭제 시 연관 데이터도 삭제

## ✅ 사용자 결정 사항

| 항목 | 결정 |
|------|-----|
| 요약 생성 방식 | **Gemini 추가 호출** - 버튼 클릭으로 진행 |
| 보고서 저장 | **요약 후 저장 버튼 클릭 시에만 저장** |
| Frontend UI | **함께 구현** |

## 🎯 UX 플로우

```
[AI 분석 탭]
    │
    ▼
[분석 요청] ──────────────────────────────┐
    │                                      │
    ▼                                      │
[전체 보고서 표시] ← 기존 기능             │
    │                                      │
    ▼                                      │
[📝 요약 생성 버튼] ← 클릭 시 Gemini 호출  │
    │                                      │
    ▼                                      │
[3줄 요약 + 전략 표시]                     │
    │                                      │
    ▼                                      │
[💾 저장 버튼] ← 클릭 시 DB 저장           │
    │                                      │
    ▼                                      │
[저장 완료 알림]                           │
                                           │
[📋 분석 이력 보기] ◄─────────────────────┘
    │
    ▼
[이전 분석 목록 표시]
```

## 🔍 현재 상태 분석

### 기존 구조 (`.claude/PROJECT_STRUCTURE.md` 기반)
- **AI 분석**: `stock_service.py`의 `get_comprehensive_analysis()` → 마크다운 보고서 반환
- **DB 테이블**: `users`, `portfolio`, `sector_holdings_cache` (Stock/Analysis 테이블 없음)
- **Portfolio**: `user_id` + `ticker` 기반, `ondelete='CASCADE'` 설정됨
- **API**: `POST /api/stock/{ticker}/analysis` → 메모리에서만 반환, DB 저장 없음

### 필요한 변경
| 항목 | 현 상태 | 필요 작업 |
|------|--------|---------|
| StockAnalysis 테이블 | ❌ 없음 | ✅ 신규 생성 |
| 요약 생성 로직 | ❌ 없음 | ✅ Gemini 추가 호출 또는 파싱 |
| 저장 API | ❌ 없음 | ✅ 분석 저장 엔드포인트 |
| 조회 API | ❌ 없음 | ✅ 기존 분석 조회 엔드포인트 |
| 삭제 연동 | ❌ 없음 | ✅ Portfolio 삭제 시 cascade |

---

## 🏗️ 구현 계획

### Phase 1: 데이터베이스 모델 생성

**파일**: `backend/app/database/models.py`

```python
class StockAnalysisDB(Base):
    """AI 분석 요약 저장 테이블"""
    __tablename__ = "stock_analysis"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    ticker = Column(String(10), nullable=False, index=True)

    # 요약 데이터 (핵심)
    summary = Column(Text, nullable=False)  # 3줄 요약
    strategy = Column(String(20), nullable=False)  # buy, hold, sell

    # 분석 시점 스냅샷
    current_price = Column(Float)
    user_avg_price = Column(Float)  # 평단가 (맞춤형 분석 시)
    profit_loss_ratio = Column(Float)  # 수익률

    # 전체 보고서 (선택적 저장)
    full_report = Column(Text)  # 마크다운 전체 보고서

    # 타임스탬프
    created_at = Column(DateTime, default=datetime.utcnow)

    # 관계
    user = relationship("UserDB", backref="stock_analyses")

    # 인덱스: 사용자별 티커 조회 최적화
    __table_args__ = (
        Index('ix_stock_analysis_user_ticker', 'user_id', 'ticker'),
    )
```

### Phase 2: Pydantic 스키마 추가

**파일**: `backend/app/models/stock.py`

```python
class AnalysisSummary(BaseModel):
    """AI 분석 요약"""
    summary: str  # 3줄 요약
    strategy: str  # buy, hold, sell

class StockAnalysisCreate(BaseModel):
    """분석 저장 요청"""
    ticker: str
    summary: str
    strategy: str
    current_price: Optional[float] = None
    user_avg_price: Optional[float] = None
    profit_loss_ratio: Optional[float] = None
    full_report: Optional[str] = None

class StockAnalysisResponse(BaseModel):
    """분석 조회 응답"""
    id: int
    ticker: str
    summary: str
    strategy: str
    current_price: Optional[float]
    user_avg_price: Optional[float]
    profit_loss_ratio: Optional[float]
    created_at: datetime

    class Config:
        from_attributes = True
```

### Phase 3: Repository 생성

**파일**: `backend/app/database/analysis_repository.py`

```python
class AnalysisRepository:
    """AI 분석 저장소"""

    def __init__(self, db: Session):
        self.db = db

    def create(self, user_id: int, data: StockAnalysisCreate) -> StockAnalysisDB:
        """분석 저장"""

    def get_by_ticker(self, user_id: int, ticker: str) -> List[StockAnalysisDB]:
        """티커별 분석 이력 조회"""

    def get_latest_by_ticker(self, user_id: int, ticker: str) -> Optional[StockAnalysisDB]:
        """티커별 최신 분석 조회"""

    def get_all_by_user(self, user_id: int) -> List[StockAnalysisDB]:
        """사용자의 모든 분석 조회"""

    def delete_by_ticker(self, user_id: int, ticker: str) -> int:
        """티커별 분석 삭제"""
```

### Phase 4: 요약 생성 로직

**파일**: `backend/app/services/stock_service.py`

```python
async def generate_analysis_summary(
    self,
    ticker: str,
    full_report: str,
    user_api_key: str
) -> AnalysisSummary:
    """전체 보고서에서 3줄 요약 + 전략 추출 (Gemini 추가 호출)"""

    prompt = f"""
    다음 {ticker} 주식 분석 보고서를 읽고:
    1. 핵심 내용을 3줄로 요약해주세요. (각 줄은 50자 이내)
    2. 투자 전략을 반드시 buy, hold, sell 중 하나로 선택해주세요.

    보고서:
    {full_report}

    응답 형식 (반드시 JSON만 출력):
    {{"summary": "줄1\\n줄2\\n줄3", "strategy": "buy|hold|sell"}}
    """

    model = genai.GenerativeModel('models/gemini-flash-latest')
    response = await asyncio.to_thread(
        lambda: model.generate_content(prompt)
    )

    # JSON 파싱
    result = json.loads(response.text)
    return AnalysisSummary(
        summary=result['summary'],
        strategy=result['strategy']
    )
```

### Phase 5: API 엔드포인트 추가

**파일**: `backend/app/api/routes/stock.py`

```python
# 1. 기존 분석 API (수정 없음)
@router.post("/stock/{ticker}/analysis", response_model=AnalysisResponse)
async def get_stock_analysis(...):
    """기존 전체 분석 API - 변경 없음"""

# 2. 요약 생성 API (신규) ← 📝 요약 생성 버튼
@router.post("/stock/{ticker}/analysis/summary", response_model=SummaryResponse)
async def generate_summary(
    ticker: str,
    request: SummaryRequest,  # full_report 포함
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """전체 보고서에서 3줄 요약 + 전략 생성 (Gemini 호출)"""

# 3. 분석 저장 API (신규) ← 💾 저장 버튼
@router.post("/stock/{ticker}/analysis/save", response_model=StockAnalysisResponse)
async def save_analysis(
    ticker: str,
    request: StockAnalysisCreate,  # summary, strategy, full_report 등
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """분석 결과 DB 저장"""

# 4. 분석 이력 조회 ← 📋 이력 보기
@router.get("/stock/{ticker}/analysis/history", response_model=List[StockAnalysisResponse])
async def get_analysis_history(ticker: str, current_user: UserDB = Depends(get_current_user)):
    """티커별 분석 이력 조회"""

# 5. 최신 분석 조회
@router.get("/stock/{ticker}/analysis/latest", response_model=Optional[StockAnalysisResponse])
async def get_latest_analysis(ticker: str, current_user: UserDB = Depends(get_current_user)):
    """티커별 최신 분석 조회"""

# 6. 사용자의 모든 분석 조회
@router.get("/stock/analysis/all", response_model=List[StockAnalysisResponse])
async def get_all_analyses(current_user: UserDB = Depends(get_current_user)):
    """사용자의 모든 분석 조회"""

# 7. 분석 삭제 (티커별)
@router.delete("/stock/{ticker}/analysis")
async def delete_analysis(ticker: str, current_user: UserDB = Depends(get_current_user)):
    """티커별 분석 전체 삭제"""

# 8. 단일 분석 삭제
@router.delete("/stock/analysis/{analysis_id}")
async def delete_single_analysis(analysis_id: int, current_user: UserDB = Depends(get_current_user)):
    """단일 분석 삭제"""
```

### Phase 6: Portfolio 삭제 연동

**파일**: `backend/app/database/repository.py`

```python
def delete(self, user_id: int, ticker: str) -> bool:
    """포트폴리오 삭제 시 분석 이력도 삭제"""
    # 1. 분석 이력 삭제
    analysis_repo = AnalysisRepository(self.db)
    analysis_repo.delete_by_ticker(user_id, ticker)

    # 2. 포트폴리오 삭제
    # 기존 로직...
```

### Phase 7: Frontend 연동

**수정 파일**: `frontend/src/components/MainTabs.tsx` (AI 탭)

#### 7-1. 타입 정의 (`frontend/src/types/stock.ts`)

```typescript
interface AnalysisSummary {
  summary: string;  // 3줄 요약
  strategy: 'buy' | 'hold' | 'sell';
}

interface SavedAnalysis {
  id: number;
  ticker: string;
  summary: string;
  strategy: string;
  current_price?: number;
  user_avg_price?: number;
  profit_loss_ratio?: number;
  full_report?: string;
  created_at: string;
}
```

#### 7-2. API 함수 (`frontend/src/lib/stockApi.ts`)

```typescript
// 요약 생성
export const generateSummary = (ticker: string, fullReport: string) =>
  api.post(`/stock/${ticker}/analysis/summary`, { full_report: fullReport });

// 분석 저장
export const saveAnalysis = (ticker: string, data: SaveAnalysisRequest) =>
  api.post(`/stock/${ticker}/analysis/save`, data);

// 이력 조회
export const getAnalysisHistory = (ticker: string) =>
  api.get(`/stock/${ticker}/analysis/history`);

// 분석 삭제
export const deleteAnalysis = (analysisId: number) =>
  api.delete(`/stock/analysis/${analysisId}`);
```

#### 7-3. AI 탭 UI 구조

```
┌─────────────────────────────────────────────────────────┐
│ AI 분석                                    [📋 이력 보기] │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 📝 AI 분석 보고서                                    │ │
│ │                                                     │ │
│ │ (마크다운 렌더링된 전체 보고서)                        │ │
│ │                                                     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 📌 요약                           [📝 요약 생성 버튼] │ │
│ ├─────────────────────────────────────────────────────┤ │
│ │ (요약 생성 전: "요약 생성 버튼을 클릭하세요")         │ │
│ │                                                     │ │
│ │ (요약 생성 후:)                                      │ │
│ │ • 줄1: ...                                          │ │
│ │ • 줄2: ...                                          │ │
│ │ • 줄3: ...                                          │ │
│ │                                                     │ │
│ │ 투자 전략: [🟢 BUY] 또는 [🟡 HOLD] 또는 [🔴 SELL]    │ │
│ │                                                     │ │
│ │                                    [💾 저장 버튼]    │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘

[📋 이력 보기 클릭 시 모달/패널]
┌─────────────────────────────────────────────────────────┐
│ 📋 분석 이력 - AAPL                              [X]    │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 2026-02-13 14:30                      [🟢 BUY] [🗑️] │ │
│ │ • 요약 줄1                                          │ │
│ │ • 요약 줄2                                          │ │
│ │ • 요약 줄3                                          │ │
│ │ 분석 시 가격: $185.50 | 평단가: $170.00 | +9.1%     │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                         │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ 2026-02-10 09:15                      [🟡 HOLD] [🗑️]│ │
│ │ • 요약 줄1                                          │ │
│ │ ...                                                 │ │
│ └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

#### 7-4. 전략 배지 스타일

```tsx
const StrategyBadge = ({ strategy }: { strategy: string }) => {
  const styles = {
    buy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    hold: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    sell: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  };

  const labels = { buy: '매수', hold: '보유', sell: '매도' };

  return (
    <span className={`px-2 py-1 rounded-full text-sm font-medium ${styles[strategy]}`}>
      {labels[strategy]}
    </span>
  );
};
```

---

## 📁 수정 파일 목록

### Backend (7개)

| 파일 | 작업 |
|------|-----|
| `backend/app/database/models.py` | StockAnalysisDB 모델 추가 |
| `backend/app/models/stock.py` | Pydantic 스키마 추가 (AnalysisSummary, StockAnalysisCreate 등) |
| `backend/app/database/analysis_repository.py` | 신규 생성 (CRUD) |
| `backend/app/services/stock_service.py` | `generate_analysis_summary()` 메서드 추가 |
| `backend/app/api/routes/stock.py` | 6개 API 엔드포인트 추가 |
| `backend/app/database/repository.py` | Portfolio 삭제 시 분석 연동 삭제 |
| `backend/app/main.py` | 테이블 자동 생성 확인 |

### Frontend (4개)

| 파일 | 작업 |
|------|-----|
| `frontend/src/types/stock.ts` | AnalysisSummary, SavedAnalysis 타입 추가 |
| `frontend/src/lib/stockApi.ts` | 요약/저장/이력/삭제 API 함수 추가 |
| `frontend/src/components/MainTabs.tsx` | AI 탭 UI 수정 (요약 섹션, 버튼, 이력 모달) |
| `frontend/src/components/stock/AnalysisHistory.tsx` | 신규 - 분석 이력 모달 컴포넌트 |

---

## ✅ 검증 계획

1. **DB 테이블 생성 확인**: SQLite에서 `stock_analysis` 테이블 생성 확인
2. **요약 생성 테스트**: 전체 보고서 → 요약 생성 버튼 → 3줄 요약 + 전략 확인
3. **분석 저장 테스트**: 요약 생성 → 저장 버튼 → DB 저장 → 조회 확인
4. **이력 조회 테스트**: 이력 보기 모달에서 저장된 분석 목록 표시 확인
5. **삭제 연동 테스트**: Portfolio에서 티커 삭제 → 분석 이력도 삭제 확인
6. **권한 테스트**: 다른 사용자의 분석에 접근 불가 확인
7. **Frontend UI 테스트**: 요약 생성/저장/이력 버튼 동작 확인
