# 시장 사이클(경기 계절) 기능 구현 계획

> **목표**: 경제 지표 대시보드에 시장 사이클을 봄/여름/가을/겨울로 시각화
> **접근 방식**: 샘플 페이지 먼저 제공 → 피드백 반영 → 실제 구현

---

## 확정된 요구사항

### 판단 기준

**추세 판단 로직 (3개월 기준)**:
```
상승 추세 = (현재값 > 3개월 평균) AND (현재값 > 전월값)
하락 추세 = (현재값 < 3개월 평균) AND (현재값 < 전월값)
```

**계절별 판단 기준**:

| 국면 | PMI | CPI | 보조 (VIX/금리차) |
|------|-----|-----|------------------|
| 🌸 봄 (회복기) | < 50 & 상승 추세 | < 3% | 금리차 > 0 |
| ☀️ 여름 (활황기) | ≥ 50 & 안정/상승 | 2~3.5% | VIX < 20 |
| 🍂 가을 (후퇴기) | ≥ 50 & 하락 추세 | > 3.5% | 금리차 축소 or VIX 상승 |
| ❄️ 겨울 (침체기) | < 50 & 하락 추세 | < 2% (디플레) | VIX > 25 or 금리차 역전 |

**가중치**: `Score = (PMI × 0.5) + (CPI × 0.3) + (Spread/VIX × 0.2)`

### 사용자 구분
- **일반 사용자**: 4계절 표시만
- **Admin**: AI 멘토 코멘트 추가 (Gemini)

---

## 구현 단계

### Phase 0: 샘플 페이지 (UI/UX 검증) ⭐ 우선 진행

> **목적**: Mock 데이터로 UI를 먼저 확인하고 피드백 반영

**0.1 샘플 컴포넌트 생성**

파일: `frontend/src/components/economic/MarketCycleSample.tsx`

- Mock 데이터로 4계절 UI 렌더링
- 현재 계절 강조 표시
- 지표 상태 표시 (PMI, CPI, VIX/금리차)
- Admin 전용 AI 코멘트 영역 (샘플 텍스트)

**0.2 샘플 데이터**
```typescript
const SAMPLE_DATA = {
  season: 'summer',
  season_name: '여름 (활황기)',
  season_emoji: '☀️',
  confidence: 0.78,
  score: 65,
  pmi_status: 'PMI 52.3 - 확장 국면 유지',
  cpi_status: 'CPI 3.1% - 양호한 물가 수준',
  spread_vix_status: 'VIX 18.5 - 낮은 변동성',
  // Admin용 샘플
  ai_comment: '지표상 여름의 끝자락에 와 있습니다. 물가 상승 압력이 커지고 있어 가을(후퇴기)에 대비한 포트폴리오 조정이 필요한 시점입니다.',
  ai_recommendation: '방어적 섹터(유틸리티, 헬스케어) 비중 확대 고려'
};
```

**0.3 UI 디자인 옵션**

**Option A: 계절 카드 (심플)**
```
┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐
│ 🌸  │ │ ☀️  │ │ 🍂  │ │ ❄️  │
│ 봄  │ │ 여름 │ │ 가을 │ │ 겨울 │
│     │ │ ███ │ │     │ │     │
└─────┘ └─────┘ └─────┘ └─────┘
         ↑ 현재
```

**Option B: 원형 다이어그램**
```
       ☀️ 여름
        ↗    ↘
    🌸 봄  ━━━  🍂 가을
        ↖    ↙
       ❄️ 겨울
```

**0.4 EconomicIndicators.tsx에 샘플 탭 추가**
```typescript
type EconomicTab = 'indicators' | 'sectors' | 'cycle';

// 탭에 "시장 사이클" 추가
// activeTab === 'cycle' 시 MarketCycleSample 렌더링
```

**0.5 피드백 수집 포인트**
- [ ] UI 레이아웃 적절한지
- [ ] 정보 표시 충분한지
- [ ] Admin AI 코멘트 위치/디자인
- [ ] 추가 필요한 정보 있는지

---

### Phase 1: Backend - PMI 데이터 추가 (샘플 승인 후)

**1.1 fred_service.py 수정**
```python
"NAPM": {
    "name": "PMI (제조업 구매관리자지수)",
    "metaphor": "경기의 체온계",
    "description": "ISM 제조업 PMI. 50 이상 확장, 50 미만 수축",
    "impact": "50 기준으로 경기 확장/수축 판단"
}
```

**1.2 MacroData 모델 확장**
```python
class MacroData(BaseModel):
    cpi: Optional[EconomicIndicator] = None
    m2: Optional[EconomicIndicator] = None
    pmi: Optional[EconomicIndicator] = None  # 추가
```

---

### Phase 2: Backend - 시장 사이클 서비스 (샘플 승인 후)

**2.1 신규: services/market_cycle_service.py**
- 추세 계산 함수
- 시장 사이클 판단 로직
- 가중치 점수 계산

**2.2 models/economic.py 확장**
```python
class MarketCycleData(BaseModel):
    season: str
    season_name: str
    season_emoji: str
    confidence: float
    score: float
    pmi_status: str
    cpi_status: str
    spread_vix_status: str
```

---

### Phase 3: Backend - API 엔드포인트 (샘플 승인 후)

**3.1 routes/economic.py**
```python
@router.get("/economic/market-cycle")
async def get_market_cycle():
    """시장 사이클 조회 (일반)"""

@router.get("/economic/market-cycle/analysis")
async def get_market_cycle_analysis(
    current_user: UserDB = Depends(get_current_admin)
):
    """시장 사이클 + AI 분석 (Admin 전용)"""
```

---

### Phase 4: Frontend - 실제 API 연동 (샘플 승인 후)

**4.1 MarketCycle.tsx (샘플에서 실제로 전환)**
- Mock 데이터 → API 호출로 변경
- 로딩/에러 상태 처리

**4.2 types/economic.ts**
```typescript
export interface MarketCycleData {
  season: MarketSeason;
  season_name: string;
  season_emoji: string;
  confidence: number;
  score: number;
  pmi_status: string;
  cpi_status: string;
  spread_vix_status: string;
}

export interface MarketCycleResponse {
  success: boolean;
  data: MarketCycleData | null;
  ai_comment?: string;      // Admin 전용
  ai_recommendation?: string;
  error?: string;
}
```

---

## 파일 목록

### Phase 0 (샘플) - 먼저 진행
| 파일 | 작업 | 상태 |
|------|------|------|
| `frontend/src/components/economic/MarketCycleSample.tsx` | 샘플 UI 컴포넌트 | 신규 |
| `frontend/src/components/economic/index.ts` | export 추가 | 수정 |
| `frontend/src/components/EconomicIndicators.tsx` | 시장 사이클 탭 추가 | 수정 |

### Phase 1-4 (샘플 승인 후)
| 파일 | 작업 |
|------|------|
| `backend/app/services/fred_service.py` | PMI 추가 |
| `backend/app/models/economic.py` | 모델 추가 |
| `backend/app/services/market_cycle_service.py` | 계산 로직 (신규) |
| `backend/app/api/routes/economic.py` | 엔드포인트 추가 |
| `frontend/src/types/economic.ts` | 타입 추가 |
| `frontend/src/components/economic/MarketCycle.tsx` | 실제 컴포넌트 |

---

## 진행 순서

```
Phase 0: 샘플 페이지 (⭐ 현재 단계)
├── 0.1 MarketCycleSample.tsx 생성 (Mock 데이터)
├── 0.2 EconomicIndicators.tsx에 탭 추가
├── 0.3 사용자 피드백 수집
└── 0.4 UI/UX 조정

↓ 샘플 승인 후

Phase 1-4: 실제 구현
├── Backend: PMI 데이터 + 사이클 계산
├── Backend: API 엔드포인트
└── Frontend: API 연동
```

---

## 테스트 (Phase 0)

1. 프론트엔드 실행
2. 경제지표 페이지 → "시장 사이클" 탭 클릭
3. 샘플 데이터로 렌더링 확인
4. 각 계절 카드 클릭/호버 동작 확인
5. (임시 Admin 모드) AI 코멘트 표시 확인

---

## 피드백 체크리스트

Phase 0 완료 후 확인할 사항:

- [ ] 4계절 카드 레이아웃 OK?
- [ ] 현재 계절 강조 방식 OK?
- [ ] 지표 상태 표시 정보량 적절?
- [ ] Admin AI 코멘트 위치/디자인 OK?
- [ ] 추가 필요 정보?
- [ ] 색상/아이콘 조정 필요?
