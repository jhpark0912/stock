# 한국 섹터 정보 추가 구현 계획

> **작성일**: 2026-02-09
> **목적**: CountryTab을 섹터 히트맵에 적용하여 한국 섹터 ETF 정보 표시

---

## 1. 요약

미국 섹터와 동일한 패턴으로 한국 KODEX 섹터 ETF 정보를 추가합니다.
- **데이터 소스**: Yahoo Finance (`.KS` 접미사)
- **섹터 분류**: KODEX 섹터 ETF 9개
- **UI 통합**: SectorHeatmap에 CountryTab 추가

---

## 2. 한국 섹터 ETF 목록

| 티커 | 섹터명 | 영문명 | 미국 대응 |
|------|--------|--------|----------|
| 091160.KS | 반도체 | Semiconductors | XLK |
| 091170.KS | 은행 | Banks | XLF |
| 266360.KS | 헬스케어 | Healthcare | XLV |
| 117460.KS | 에너지화학 | Energy & Chemicals | XLE |
| 091220.KS | 기계장비 | Machinery | XLI |
| 091180.KS | 자동차 | Automobiles | XLY |
| 117680.KS | 건설 | Construction | XLI |
| 140710.KS | 운송 | Transportation | XLI |
| 102970.KS | 증권 | Securities | XLF |

---

## 3. 구현 순서

### Phase 1: Backend - 한국 섹터 서비스

#### 3.1 신규 파일: `backend/app/services/korea_sector_service.py`

```python
"""한국 섹터 ETF 데이터 조회 서비스"""

KOREA_SECTOR_ETFS = {
    "091160.KS": {"name": "반도체", "name_en": "Semiconductors", ...},
    "091170.KS": {"name": "은행", "name_en": "Banks", ...},
    # ... 9개 섹터
}

# 상위 보유 종목 (수동 관리, DB 캐시 대신)
KOREA_SECTOR_HOLDINGS = {
    "091160.KS": ["삼성전자", "SK하이닉스", "DB하이텍"],
    "091170.KS": ["KB금융", "신한지주", "하나금융"],
    # ...
}

async def get_korea_sector_data() -> Optional[List[Dict]]:
    """한국 섹터 ETF 전체 조회 (yahooquery)"""

async def get_korea_sector_holdings(symbol: str) -> Optional[Dict]:
    """한국 섹터 보유 종목 조회 (수동 메타데이터)"""
```

#### 3.2 수정 파일: `backend/app/services/sector_service.py`

- `get_sector_data(country: str = 'us')` 파라미터 추가
- country별 분기 처리 (us/kr/all)

```python
async def get_sector_data(country: str = 'us') -> Optional[List[Dict]]:
    if country == 'kr':
        from .korea_sector_service import get_korea_sector_data
        return await get_korea_sector_data()
    elif country == 'all':
        us_data = await _get_us_sector_data()
        kr_data = await get_korea_sector_data()
        return (us_data or []) + (kr_data or [])
    else:
        return await _get_us_sector_data()
```

### Phase 2: Backend - API 라우터

#### 3.3 수정 파일: `backend/app/api/routes/economic.py`

- `/economic/sectors` 엔드포인트에 `country` 쿼리 파라미터 추가
- `/economic/sectors/{symbol}/holdings`에도 country 처리

```python
@router.get("/economic/sectors")
async def get_sector_performance(
    country: str = Query('us', regex='^(us|kr|all)$')
):
    sectors = await get_sector_data(country)
    ...
```

### Phase 3: Frontend - UI 수정

#### 3.4 수정 파일: `frontend/src/components/economic/SectorHeatmap.tsx`

- CountryTab import 및 통합
- country state 추가
- API 호출 시 country 파라미터 전달
- 한국 섹터 SECTOR_DETAIL 추가

```tsx
import { CountryTab } from './CountryTab';
import type { Country } from '@/types/economic';

export function SectorHeatmap() {
  const [country, setCountry] = useState<'us' | 'kr' | 'all'>('us');

  // API 호출
  const response = await api.get<SectorResponse>(
    `/api/economic/sectors?country=${country}`
  );

  // 헤더에 CountryTab 추가
  <CountryTab selected={country} onChange={setCountry} />
}
```

#### 3.5 수정 파일: `frontend/src/components/economic/SectorDetail.tsx`

- SECTOR_INFO에 한국 섹터 메타데이터 추가

```tsx
const SECTOR_INFO = {
  // 기존 미국 섹터...
  XLK: {...},

  // 한국 섹터 추가
  '091160.KS': {
    metaphor: '🇰🇷 "세계 반도체 공장"',
    description: '삼성전자, SK하이닉스 등 메모리 반도체 세계 1위 기업들이에요.',
  },
  // ... 9개 섹터
};
```

---

## 4. 수정 파일 목록

| 파일 | 작업 | 우선순위 |
|------|------|---------|
| `backend/app/services/korea_sector_service.py` | 신규 생성 | 1 |
| `backend/app/services/sector_service.py` | country 파라미터 추가 | 2 |
| `backend/app/api/routes/economic.py` | API country 쿼리 추가 | 3 |
| `frontend/src/components/economic/SectorHeatmap.tsx` | CountryTab 통합 | 4 |
| `frontend/src/components/economic/SectorDetail.tsx` | 한국 섹터 메타데이터 | 5 |

---

## 5. 데이터 흐름

```
[Frontend] SectorHeatmap
    ↓ country state 변경 (us → kr)
[Frontend] API 호출
    ↓ GET /api/economic/sectors?country=kr
[Backend] economic.py 라우터
    ↓ get_sector_data(country='kr')
[Backend] sector_service.py
    ↓ korea_sector_service.get_korea_sector_data()
[Backend] yahooquery
    ↓ 091160.KS, 091170.KS, ... 조회
[Yahoo Finance]
    ↓ 가격, 변화율 반환
[Frontend] 트리맵 렌더링
```

---

## 6. 검증 방법

### 6.1 Backend 테스트

```bash
# 서버 실행
cd backend && python -m uvicorn app.main:app --reload

# API 테스트
curl "http://localhost:8000/api/economic/sectors?country=us"  # 미국 11개
curl "http://localhost:8000/api/economic/sectors?country=kr"  # 한국 9개
curl "http://localhost:8000/api/economic/sectors?country=all" # 전체 20개

# 보유 종목 테스트
curl "http://localhost:8000/api/economic/sectors/091160.KS/holdings"
```

### 6.2 Frontend 테스트

```bash
# 개발 서버 실행
cd frontend && npm run dev

# 브라우저에서 확인
# 1. 경제 지표 페이지 → 섹터 히트맵 탭
# 2. CountryTab에서 한국 선택
# 3. 한국 섹터 트리맵 표시 확인
# 4. 섹터 클릭 → SectorDetail 모달 확인
```

---

## 7. 위험 요소

| 위험 | 대응 |
|------|------|
| Yahoo Finance 한국 ETF 조회 실패 | 에러 처리 + 로그, 필요시 네이버 금융 백업 |
| KODEX ETF 상장폐지/변경 | 분기별 메타데이터 검증 |
| 보유 종목 수동 관리 부담 | 추후 크롤링 자동화 검토 |

---

## 8. 예상 작업량

- Backend 서비스: ~150줄 신규, ~30줄 수정
- Backend API: ~10줄 수정
- Frontend: ~100줄 수정

**총 예상**: 약 300줄 코드 변경
