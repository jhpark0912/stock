# 데이터베이스 마이그레이션

## 📋 마이그레이션 목록

### 1. `add_kis_credentials.py` - KIS API 인증정보 컬럼 추가
- **목적**: 한국투자증권 API 인증정보 저장을 위한 컬럼 추가
- **변경사항**:
  - `kis_app_key` VARCHAR(512) 추가
  - `kis_app_secret` VARCHAR(512) 추가

### 2. `encrypt_existing_keys.py` - 기존 API 키 암호화
- **목적**: 평문으로 저장된 Gemini API 키를 암호화
- **⚠️ 주의**: 한 번만 실행해야 함!

---

## 🚀 마이그레이션 실행 순서

### Step 1: 암호화 키 생성

```bash
# Fernet 암호화 키 생성
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

출력 예시:
```
kQw8VxY3Z5a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6A=
```

### Step 2: .env 파일에 암호화 키 추가

`.env` 파일 또는 환경변수에 추가:
```env
ENCRYPTION_KEY=생성된_키_여기_붙여넣기
```

**⚠️ 중요**: 
- 이 키는 **절대 변경하지 마세요**!
- 키를 잃어버리면 기존에 암호화된 API 키를 복구할 수 없습니다.
- `.gitignore`에 `.env`가 포함되어 있는지 확인하세요.

### Step 3: KIS 컬럼 추가 마이그레이션

```bash
python backend/migrations/add_kis_credentials.py
```

### Step 4: 기존 키 암호화 (선택적)

**기존 사용자가 있고, Gemini API 키가 평문으로 저장된 경우**에만 실행:

```bash
python backend/migrations/encrypt_existing_keys.py
```

**⚠️ 주의**:
- 이 스크립트는 **한 번만** 실행해야 합니다.
- 이미 암호화된 키는 자동으로 스킵됩니다.

---

## 🔄 롤백 (필요 시)

### KIS 컬럼 제거 (롤백)

SQLite는 컬럼 삭제를 직접 지원하지 않으므로, 수동 작업 필요:

```sql
-- 1. 백업 테이블 생성
CREATE TABLE users_backup AS SELECT * FROM users;

-- 2. 기존 테이블 삭제
DROP TABLE users;

-- 3. 새 테이블 생성 (kis 컬럼 제외)
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    is_active BOOLEAN DEFAULT 1,
    is_approved BOOLEAN DEFAULT 0,
    gemini_api_key VARCHAR(512),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 4. 데이터 복원
INSERT INTO users (id, username, password_hash, role, is_active, is_approved, gemini_api_key, created_at, updated_at)
SELECT id, username, password_hash, role, is_active, is_approved, gemini_api_key, created_at, updated_at
FROM users_backup;

-- 5. 백업 삭제
DROP TABLE users_backup;
```

---

## 📝 마이그레이션 이력

| 날짜 | 스크립트 | 설명 |
|------|----------|------|
| 2026-02-09 | `add_kis_credentials.py` | KIS API 인증정보 컬럼 추가 |
| 2026-02-09 | `encrypt_existing_keys.py` | 기존 API 키 암호화 |

---

## 🔒 보안 주의사항

1. **ENCRYPTION_KEY 관리**:
   - 절대 Git에 커밋하지 마세요 (`.env` 파일)
   - 프로덕션과 개발 환경에서 **다른 키** 사용 권장
   - 키를 안전한 곳에 백업하세요

2. **암호화 키 분실 시**:
   - 모든 사용자의 API 키를 재등록해야 함
   - 복구 불가능!

3. **프로덕션 배포 시**:
   - `.env` 파일을 서버에 직접 업로드하지 말고, 환경변수로 설정
   - Docker 사용 시 `.env` 파일을 `.dockerignore`에 추가

---

## 🧪 테스트

마이그레이션 후 다음 사항을 확인하세요:

```bash
# 1. 서버 시작
cd backend
uvicorn app.main:app --reload

# 2. API 테스트
# - 회원가입 / 로그인
# - Gemini 키 등록 / 조회 / 삭제
# - KIS 키 등록 / 조회 / 삭제

# 3. 데이터베이스 확인
sqlite3 stock.db
> SELECT id, username, 
>        LENGTH(gemini_api_key) as gemini_len,
>        LENGTH(kis_app_key) as kis_len
> FROM users;
```

암호화된 키는 원본보다 훨씬 길어야 합니다 (예: 원본 40자 → 암호화 100자+).
