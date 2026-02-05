# 유저별 Gemini API Key 기능 구현 계획

## 📋 기능 요구사항

1. **유저별 Gemini API key 저장** - 각 유저가 자신만의 Gemini API key를 등록
2. **Gemini key 입력 페이지** - 설정 페이지에서 key 입력/수정/삭제
3. **key 없으면 AI 분석 불가** - key가 없는 유저는 AI 분석 기능 사용 불가
4. **온디맨드 AI 요청** - 무분별한 요청 방지를 위해 AI 탭 클릭 시에만 분석 요청

---

## ✅ 완료된 작업

### 1. 백엔드 DB 모델 수정 (`backend/app/database/models.py`)

```python
class UserDB(Base):
    # ... 기존 필드들 ...
    gemini_api_key = Column(String(255), nullable=True)  # 추가됨
```

### 2. Pydantic 모델 수정 (`backend/app/models/user.py`)

```python
class UserResponse(BaseModel):
    # ... 기존 필드들 ...
    has_gemini_key: bool = False  # 추가됨 - API 응답에서 key 보유 여부만 노출

class GeminiKeyUpdate(BaseModel):  # 새로 추가
    """Gemini API 키 업데이트 요청 스키마"""
    api_key: str = Field(..., min_length=10, description="Gemini API 키")

class GeminiKeyStatus(BaseModel):  # 새로 추가
    """Gemini API 키 상태 응답 스키마"""
    has_key: bool
    key_preview: Optional[str] = None  # 마스킹된 키 미리보기
```

### 3. User Repository 수정 (`backend/app/database/user_repository.py`)

```python
# 추가된 메서드들
def update_gemini_key(self, user_id: int, api_key: str) -> Optional[UserDB]
def delete_gemini_key(self, user_id: int) -> Optional[UserDB]
def get_gemini_key(self, user_id: int) -> Optional[str]
```

---

## 🔲 남은 작업

### 4. Auth 라우트에 Gemini Key API 추가 (`backend/app/api/routes/auth.py`)

추가할 엔드포인트:
- `PUT /api/auth/gemini-key` - Gemini API key 설정
- `DELETE /api/auth/gemini-key` - Gemini API key 삭제
- `GET /api/auth/gemini-key/status` - key 상태 조회 (마스킹된 미리보기 포함)

```python
@router.put("/gemini-key", response_model=GeminiKeyStatus)
async def update_gemini_key(
    key_data: GeminiKeyUpdate,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Gemini API 키 설정"""
    repo = UserRepository(db)
    repo.update_gemini_key(current_user.id, key_data.api_key)
    return GeminiKeyStatus(
        has_key=True,
        key_preview=f"{key_data.api_key[:4]}...{key_data.api_key[-4:]}"
    )

@router.delete("/gemini-key")
async def delete_gemini_key(
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Gemini API 키 삭제"""
    repo = UserRepository(db)
    repo.delete_gemini_key(current_user.id)
    return {"message": "Gemini API 키가 삭제되었습니다."}

@router.get("/gemini-key/status", response_model=GeminiKeyStatus)
async def get_gemini_key_status(
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Gemini API 키 상태 조회"""
    repo = UserRepository(db)
    key = repo.get_gemini_key(current_user.id)
    if key:
        return GeminiKeyStatus(has_key=True, key_preview=f"{key[:4]}...{key[-4:]}")
    return GeminiKeyStatus(has_key=False)
```

### 5. Auth Service 수정 - UserResponse 변환 시 has_gemini_key 설정

`get_current_user` 또는 UserDB → UserResponse 변환 로직에서:
```python
user_response.has_gemini_key = bool(user_db.gemini_api_key)
```

### 6. StockService 수정 (`backend/app/services/stock_service.py`)

`get_comprehensive_analysis` 메서드 시그니처 변경:
```python
async def get_comprehensive_analysis(
    self, 
    stock_data: StockData,
    user_api_key: Optional[str] = None  # 유저 API 키 추가
) -> AIAnalysis:
    # user_api_key가 있으면 사용, 없으면 에러
    if not user_api_key:
        raise ValueError("Gemini API 키가 필요합니다. 설정에서 API 키를 등록해주세요.")
    
    genai.configure(api_key=user_api_key)  # 유저 키 사용
    # ... 나머지 로직
```

### 7. Stock 라우트 수정 (`backend/app/api/routes/stock.py`)

AI 분석 엔드포인트에서 유저 key 사용:
```python
@router.get("/{ticker}/analysis")
async def get_stock_analysis(
    ticker: str,
    current_user: UserDB = Depends(get_current_user),  # 인증 필수
    db: Session = Depends(get_db)
):
    # 유저의 Gemini key 조회
    user_repo = UserRepository(db)
    gemini_key = user_repo.get_gemini_key(current_user.id)
    
    if not gemini_key:
        raise HTTPException(
            status_code=400,
            detail="Gemini API 키가 등록되지 않았습니다. 설정에서 API 키를 등록해주세요."
        )
    
    # AI 분석 수행
    analysis = await stock_service.get_comprehensive_analysis(stock_data, user_api_key=gemini_key)
```

### 8. 프론트엔드 타입 수정 (`frontend/src/types/auth.ts`)

```typescript
export interface UserResponse {
  // ... 기존 필드들 ...
  has_gemini_key: boolean  // 추가
}
```

### 9. 프론트엔드 API 함수 추가 (`frontend/src/lib/authApi.ts`)

```typescript
export async function updateGeminiKey(token: string, apiKey: string): Promise<GeminiKeyStatus>
export async function deleteGeminiKey(token: string): Promise<void>
export async function getGeminiKeyStatus(token: string): Promise<GeminiKeyStatus>
```

### 10. 설정 페이지 생성 (`frontend/src/components/settings/SettingsPage.tsx`)

- Gemini API key 입력 폼
- 현재 key 상태 표시 (마스킹)
- key 삭제 버튼
- 저장 버튼

### 11. AI 분석 컴포넌트 수정

- `has_gemini_key`가 false면 "API 키를 등록해주세요" 안내
- AI 분석 탭 클릭 시에만 분석 API 호출 (온디맨드)

### 12. 라우팅 추가 (`frontend/src/App.tsx`)

- `/settings` 경로 추가

### 13. 사이드바/네비게이션 수정

- 설정 메뉴 추가

---

## 🗄️ DB 마이그레이션

SQLite 사용 중이므로 테이블 재생성 또는 ALTER TABLE 필요:
```sql
ALTER TABLE users ADD COLUMN gemini_api_key VARCHAR(255);
```

또는 앱 재시작 시 자동으로 컬럼 추가되도록 설정 확인.

---

## 📁 관련 파일 목록

| 파일 | 상태 | 설명 |
|------|------|------|
| `backend/app/database/models.py` | ✅ 완료 | UserDB에 gemini_api_key 추가 |
| `backend/app/models/user.py` | ✅ 완료 | UserResponse, GeminiKeyUpdate, GeminiKeyStatus 추가 |
| `backend/app/database/user_repository.py` | ✅ 완료 | Gemini key CRUD 메서드 추가 |
| `backend/app/api/routes/auth.py` | 🔲 미완료 | Gemini key API 엔드포인트 추가 |
| `backend/app/services/auth_service.py` | 🔲 미완료 | has_gemini_key 설정 로직 |
| `backend/app/services/stock_service.py` | 🔲 미완료 | 유저 API key로 AI 분석 |
| `backend/app/api/routes/stock.py` | 🔲 미완료 | AI 분석에 인증 필수 + 유저 key 사용 |
| `frontend/src/types/auth.ts` | 🔲 미완료 | has_gemini_key 타입 추가 |
| `frontend/src/lib/authApi.ts` | 🔲 미완료 | Gemini key API 함수 |
| `frontend/src/components/settings/SettingsPage.tsx` | 🔲 미완료 | 새로 생성 |
| `frontend/src/App.tsx` | 🔲 미완료 | /settings 라우트 추가 |

---

## 🔐 보안 고려사항

1. **API 키 저장**: 평문 저장 (암호화 옵션 고려 가능)
2. **API 응답**: key 값 자체는 노출하지 않고 `has_gemini_key` boolean만 반환
3. **마스킹**: 상태 조회 시 `AIza...xyz` 형태로 마스킹된 미리보기만 제공
4. **인증 필수**: AI 분석 API는 로그인 필수

---

## 📅 작성일: 2026-02-05
