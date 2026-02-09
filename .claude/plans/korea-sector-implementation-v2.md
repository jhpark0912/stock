# 한국 섹터 정보 구현 계획 v2

> **작성일**: 2026-02-09
> **변경사항**: 한국투자증권 API 통합, 사용자별 API 키 인증 추가

---

## 1. 요약

한국 섹터 ETF **구성종목 상세정보**를 **한국투자증권 Open API**를 통해 제공합니다.
- **데이터 소스**: 한국투자증권 API (`inquire-component-stock-price`)
- **인증 방식**: Gemini Key와 동일한 패턴 (사용자별 API 키 입력)
- **Admin**: 서버 환경변수 키 사용 (기존 방식)
- **일반 사용자**: 설정 페이지에서 한국투자증권 API 키 입력 필요

---

## 2. 변경 범위 (중요)

### 2.1 기존 유지 (변경 없음)

| 기능 | 데이터 소스 | 인증 | 비고 |
|------|------------|------|------|
| **섹터 히트맵 (트리맵)** | yahooquery | ❌ 불필요 | 미국/한국 모두 기존 방식 유지 |
| **미국 섹터 상세 (구성종목)** | yahooquery `fund_top_holdings` | ❌ 불필요 | 기존 방식 유지 |

### 2.2 변경 대상 (이번 구현)

| 기능 | 데이터 소스 | 인증 | 비고 |
|------|------------|------|------|
| **한국 섹터 상세 (구성종목)** | 한국투자증권 API | ✅ **KIS 키 필요** | 클릭 시에만 해당 |

### 2.3 데이터 흐름 다이어그램

```
┌─────────────────────────────────────────────────────────────────────┐
│                    섹터 히트맵 (SectorHeatmap)                       │
│                                                                     │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│   │   미국 섹터  │  │   한국 섹터  │  │   전체 섹터  │                │
│   │  (XLK 등)   │  │ (091160 등) │  │  (미국+한국) │                │
│   └─────────────┘  └─────────────┘  └─────────────┘                │
│         │                │                │                        │
│         └────────────────┴────────────────┘                        │
│                          │                                         │
│                    yahooquery                                      │
│                  (인증 불필요) ✅                                    │
│                                                                     │
│   → 기존 방식 그대로 유지, 모든 사용자 접근 가능                      │
└─────────────────────────────────────────────────────────────────────┘
                           │
                           │ 섹터 클릭
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   섹터 상세 (SectorDetail)                          │
│                                                                     │
│   ┌─────────────────────────┐  ┌─────────────────────────┐         │
│   │      미국 섹터 클릭      │  │      한국 섹터 클릭      │         │
│   │                         │  │                         │         │
│   │  yahooquery             │  │  한국투자증권 API        │         │
│   │  fund_top_holdings      │  │  inquire-component-     │         │
│   │                         │  │  stock-price            │         │
│   │  인증 불필요 ✅          │  │  KIS 키 필요 ⚠️          │         │
│   │                         │  │                         │         │
│   │  → 기존 방식 유지        │  │  → 이번 구현 대상        │         │
│   └─────────────────────────┘  └─────────────────────────┘         │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.4 사용자 시나리오별 동작

| 시나리오 | 섹터 히트맵 | 미국 섹터 클릭 | 한국 섹터 클릭 |
|----------|-----------|--------------|--------------|
| **비로그인 사용자** | ✅ 조회 가능 | ✅ 조회 가능 | ⚠️ 키 입력 안내 |
| **일반 사용자 (KIS 키 없음)** | ✅ 조회 가능 | ✅ 조회 가능 | ⚠️ 키 입력 안내 |
| **일반 사용자 (KIS 키 있음)** | ✅ 조회 가능 | ✅ 조회 가능 | ✅ 조회 가능 |
| **Admin** | ✅ 조회 가능 | ✅ 조회 가능 | ✅ 환경변수 키 사용 |

---

## 4. 한국투자증권 API 정보

### 4.1 ETF 구성종목시세 API

| 항목 | 값 |
|------|-----|
| **TR_ID** | `FHKST121600C0` |
| **Endpoint** | `/uapi/etfetn/v1/quotations/inquire-component-stock-price` |
| **인증** | App Key + App Secret → Access Token |

### 4.2 응답 데이터 (output2)

| 필드 | 설명 | 매핑 |
|------|------|------|
| `stck_shrn_iscd` | 종목코드 | → `symbol` |
| `hts_kor_isnm` | 종목명 | → `name` |
| `stck_prpr` | 현재가 | → `price` |
| `prdy_ctrt` | 전일대비율 | → `change_1d` |
| `etf_cnfg_issu_rlim` | **구성종목 비중** | → `weight` |

---

## 5. 구현 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend                                 │
├─────────────────────────────────────────────────────────────────┤
│  SettingsPage                    SectorHeatmap                  │
│  ├─ Gemini API Key              ├─ CountryTab (us/kr/all)      │
│  └─ 한국투자증권 API Key (NEW)   └─ SectorDetail (클릭 시)      │
│      ├─ App Key                       └─ 한국: KIS API 필요 체크│
│      └─ App Secret                                              │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Backend                                  │
├─────────────────────────────────────────────────────────────────┤
│  auth.py                         economic.py                    │
│  ├─ PUT /kis-credentials        ├─ GET /sectors/{symbol}/holdings│
│  ├─ DELETE /kis-credentials     │   └─ 한국 섹터: KIS API 호출  │
│  └─ GET /kis-credentials/status │       ├─ Admin: 환경변수 키    │
│                                  │       └─ User: DB 저장 키     │
│  UserDB                          │                              │
│  ├─ kis_app_key                 korea_sector_service.py         │
│  └─ kis_app_secret              └─ get_korea_sector_holdings()  │
│                                      └─ 한국투자증권 API 호출    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. 수정 파일 목록

### Phase 1: Backend - 인증 시스템

| 파일 | 작업 | 설명 |
|------|------|------|
| `backend/app/database/models.py` | 수정 | UserDB에 `kis_app_key`, `kis_app_secret` 컬럼 추가 |
| `backend/app/database/user_repository.py` | 수정 | KIS 키 CRUD 메서드 추가 |
| `backend/app/models/user.py` | 수정 | KIS 키 Pydantic 모델 추가 |
| `backend/app/api/routes/auth.py` | 수정 | KIS 키 엔드포인트 추가 |
| `backend/app/config.py` | 수정 | KIS 환경변수 추가 (Admin용) |
| `backend/.env.example` | 수정 | KIS 키 예시 추가 |

### Phase 2: Backend - 한국투자증권 API 서비스

| 파일 | 작업 | 설명 |
|------|------|------|
| `backend/app/services/kis_api_service.py` | **신규** | 한국투자증권 API 클라이언트 |
| `backend/app/services/korea_sector_service.py` | 수정 | KIS API 연동으로 변경 |
| `backend/app/api/routes/economic.py` | 수정 | holdings API에 사용자 키 검증 추가 |

### Phase 3: Frontend - 설정 페이지

| 파일 | 작업 | 설명 |
|------|------|------|
| `frontend/src/lib/authApi.ts` | 수정 | KIS 키 API 함수 추가 |
| `frontend/src/types/auth.ts` | 수정 | KIS 키 타입 추가 |
| `frontend/src/components/settings/SettingsPage.tsx` | 수정 | KIS 키 입력 UI 추가 |

### Phase 4: Frontend - 섹터 히트맵

| 파일 | 작업 | 설명 |
|------|------|------|
| `frontend/src/components/economic/SectorDetail.tsx` | 수정 | 한국 섹터 클릭 시 키 체크 |

---

## 7. 상세 구현

### 7.1 UserDB 모델 수정

```python
# backend/app/database/models.py

class UserDB(Base):
    # 기존 필드...
    gemini_api_key = Column(String(255), nullable=True)

    # 신규 필드
    kis_app_key = Column(String(255), nullable=True)      # 한국투자증권 App Key
    kis_app_secret = Column(String(255), nullable=True)   # 한국투자증권 App Secret

    @property
    def has_kis_credentials(self) -> bool:
        """한국투자증권 API 키 보유 여부"""
        return bool(self.kis_app_key and self.kis_app_secret)
```

### 7.2 KIS API 서비스

```python
# backend/app/services/kis_api_service.py

class KISApiClient:
    """한국투자증권 Open API 클라이언트"""

    BASE_URL = "https://openapi.koreainvestment.com:9443"

    def __init__(self, app_key: str, app_secret: str):
        self.app_key = app_key
        self.app_secret = app_secret
        self._access_token = None
        self._token_expires_at = None

    async def get_access_token(self) -> str:
        """접근 토큰 발급/갱신"""
        # POST /oauth2/tokenP
        ...

    async def get_etf_component_stocks(self, etf_code: str) -> Dict:
        """ETF 구성종목시세 조회"""
        # GET /uapi/etfetn/v1/quotations/inquire-component-stock-price
        # TR_ID: FHKST121600C0
        ...
```

### 7.3 holdings API 수정

```python
# backend/app/api/routes/economic.py

@router.get("/economic/sectors/{symbol}/holdings")
async def get_sector_holdings_api(
    symbol: str,
    current_user: Optional[UserDB] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    # 한국 섹터인 경우
    if symbol.endswith('.KS') or is_korean_sector(symbol):
        # 1. Admin: 환경변수 키 사용
        if current_user and current_user.role == 'admin':
            app_key = settings.KIS_APP_KEY
            app_secret = settings.KIS_APP_SECRET
        # 2. 일반 사용자: DB 저장 키 사용
        elif current_user and current_user.has_kis_credentials:
            app_key = current_user.kis_app_key
            app_secret = current_user.kis_app_secret
        # 3. 키 없음: 에러
        else:
            return SectorHoldingsResponse(
                success=False,
                error="한국 섹터 상세정보를 보려면 한국투자증권 API 키가 필요합니다.",
                requires_kis_key=True  # 프론트엔드에서 키 입력 유도
            )

        # KIS API 호출
        result = await get_korea_sector_holdings_kis(symbol, app_key, app_secret)
        ...
    else:
        # 미국 섹터: 기존 로직
        result = await get_sector_holdings(symbol)
        ...
```

### 7.4 SettingsPage 확장

```tsx
// frontend/src/components/settings/SettingsPage.tsx

export function SettingsPage() {
  // 기존 Gemini 키 상태...

  // 한국투자증권 키 상태 (신규)
  const [kisAppKey, setKisAppKey] = useState('')
  const [kisAppSecret, setKisAppSecret] = useState('')
  const [hasKisKey, setHasKisKey] = useState(false)

  return (
    <PageContainer>
      {/* 기존 Gemini API 키 카드 */}
      <Card>...</Card>

      {/* 한국투자증권 API 키 카드 (신규) */}
      <Card>
        <CardHeader>
          <CardTitle>한국투자증권 API 키</CardTitle>
          <CardDescription>
            한국 섹터 ETF 구성종목 정보를 조회하려면 필요합니다.
            <a href="https://apiportal.koreainvestment.com" target="_blank">
              키 발급받기
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Input placeholder="App Key" value={kisAppKey} ... />
          <Input placeholder="App Secret" type="password" value={kisAppSecret} ... />
          <Button onClick={handleSaveKisKey}>저장</Button>
        </CardContent>
      </Card>
    </PageContainer>
  )
}
```

### 7.5 SectorDetail 키 체크

```tsx
// frontend/src/components/economic/SectorDetail.tsx

// 한국 섹터인데 키가 없는 경우 안내 표시
if (isKoreanSector && response.data.requires_kis_key) {
  return (
    <div className="text-center p-8">
      <Key className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
      <h3 className="font-semibold mb-2">한국투자증권 API 키 필요</h3>
      <p className="text-sm text-muted-foreground mb-4">
        한국 섹터 구성종목을 보려면 API 키가 필요합니다.
      </p>
      <Button onClick={() => navigate('/settings')}>
        설정에서 키 입력하기
      </Button>
    </div>
  )
}
```

---

## 8. 환경변수

```bash
# backend/.env.example

# 한국투자증권 API (Admin용)
KIS_APP_KEY=your_app_key_here
KIS_APP_SECRET=your_app_secret_here

# 실전/모의 투자 구분
KIS_IS_VIRTUAL=false  # true: 모의투자, false: 실전
```

---

## 9. 데이터 흐름

### 9.1 일반 사용자 (키 없음)

```
1. SectorHeatmap에서 한국 섹터 클릭
2. SectorDetail 모달 열림
3. API 호출: GET /sectors/091160.KS/holdings
4. 백엔드: 사용자 키 없음 → requires_kis_key: true 반환
5. 프론트엔드: "API 키 필요" 안내 표시
6. 사용자: 설정 페이지로 이동 → 키 입력
7. 다시 클릭 → 정상 조회
```

### 9.2 Admin

```
1. SectorHeatmap에서 한국 섹터 클릭
2. SectorDetail 모달 열림
3. API 호출: GET /sectors/091160.KS/holdings
4. 백엔드: Admin 확인 → 환경변수 키 사용
5. 한국투자증권 API 호출
6. 구성종목 데이터 반환
```

---

## 10. 마이그레이션

### 10.1 DB 마이그레이션

```sql
-- users 테이블에 컬럼 추가
ALTER TABLE users ADD COLUMN kis_app_key VARCHAR(255) NULL;
ALTER TABLE users ADD COLUMN kis_app_secret VARCHAR(255) NULL;
```

### 10.2 기존 한국 섹터 서비스

- `korea_sector_service.py`의 `get_korea_sector_holdings()` 함수를 KIS API 사용으로 변경
- 기존 수동 메타데이터(`KOREA_SECTOR_HOLDINGS`)는 fallback으로 유지 가능

---

## 11. 보안 고려사항

| 항목 | 처리 방법 |
|------|----------|
| API 키 저장 | DB에 평문 저장 (Gemini 키와 동일) |
| API 키 표시 | 마스킹 처리 (`ABCD...WXYZ`) |
| 전송 보안 | HTTPS 필수 |
| 접근 제어 | 본인 키만 조회/수정 가능 |

---

## 12. 작업 우선순위

| 순서 | 작업 | 예상 변경량 |
|------|------|------------|
| 1 | DB 모델 + 마이그레이션 | ~20줄 |
| 2 | UserRepository 수정 | ~30줄 |
| 3 | auth.py 엔드포인트 추가 | ~50줄 |
| 4 | KIS API 서비스 신규 | ~150줄 |
| 5 | korea_sector_service.py 수정 | ~50줄 |
| 6 | economic.py holdings API 수정 | ~30줄 |
| 7 | Frontend authApi.ts 수정 | ~30줄 |
| 8 | Frontend SettingsPage 수정 | ~100줄 |
| 9 | Frontend SectorDetail 수정 | ~30줄 |

**총 예상**: ~500줄 변경

---

## 13. 테스트 계획

### 13.1 Backend 테스트

```bash
# 1. KIS 키 저장 테스트
curl -X PUT /api/auth/kis-credentials \
  -H "Authorization: Bearer {token}" \
  -d '{"app_key": "...", "app_secret": "..."}'

# 2. 한국 섹터 holdings 조회 (키 없는 사용자)
curl /api/economic/sectors/091160.KS/holdings
# → requires_kis_key: true

# 3. 한국 섹터 holdings 조회 (키 있는 사용자)
curl /api/economic/sectors/091160.KS/holdings \
  -H "Authorization: Bearer {token}"
# → 구성종목 데이터 반환
```

### 13.2 Frontend 테스트

1. 설정 페이지에서 한국투자증권 키 입력/저장/삭제
2. 한국 섹터 클릭 시 키 없으면 안내 표시
3. 키 입력 후 정상 조회 확인

---

## 14. 기존 계획과의 차이점

| 항목 | v1 (기존) | v2 (수정) |
|------|----------|----------|
| 데이터 소스 | Yahoo Finance + 수동 메타데이터 | **한국투자증권 API** |
| 인증 | 없음 (모두 접근 가능) | **사용자별 API 키 필요** |
| 비중 데이터 | 수동 입력 | **API 자동 조회** |
| 현재가/변동률 | yahooquery | **KIS API 통합** |
| Admin 처리 | - | **환경변수 키 사용** |
