# 관리자 기능 구현 계획

> **완료 일자**: 2026-02-05
> **상태**: ✅ 완료

---

## 📋 구현 목표

1. **회원가입 승인 기능** - 관리자가 신규 가입자를 승인/거부
2. **사용자 관리 기능** - 사용자 비활성화, 삭제
3. **로그아웃 기능** - 이미 완료되어 있음

---

## 🎯 백엔드 API (이미 완료)

### 엔드포인트

| 메서드 | 경로 | 설명 | 권한 |
|--------|------|------|------|
| GET | `/api/admin/users` | 전체 사용자 목록 | Admin |
| GET | `/api/admin/users/pending` | 승인 대기 사용자 목록 | Admin |
| PUT | `/api/admin/users/{id}/approve` | 사용자 승인 | Admin |
| PUT | `/api/admin/users/{id}/reject` | 사용자 거부(삭제) | Admin |
| PUT | `/api/admin/users/{id}/deactivate` | 사용자 비활성화 | Admin |
| DELETE | `/api/admin/users/{id}` | 사용자 삭제 | Admin |

### 관리자 기본 계정

```
Username: admin
Password: admin123
```

`.env` 파일로 변경 가능:
```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

---

## 🛠 프론트엔드 구현

### 1. 타입 정의

**파일**: `frontend/src/types/admin.ts`

```typescript
export type AdminUserList = UserResponse[]
export interface ApproveUserResponse { message: string }
export interface RejectUserResponse { message: string }
export interface DeleteUserResponse { message: string }
```

### 2. API 클라이언트

**파일**: `frontend/src/lib/adminApi.ts`

**함수**:
- `getAllUsers()` - 전체 사용자 목록
- `getPendingUsers()` - 승인 대기 사용자 목록
- `approveUser(userId)` - 사용자 승인
- `rejectUser(userId)` - 사용자 거부
- `deactivateUser(userId)` - 사용자 비활성화
- `deleteUser(userId)` - 사용자 삭제

### 3. 관리자 페이지

**파일**: `frontend/src/components/admin/AdminPage.tsx`

**기능**:
- ✅ 승인 대기 사용자 목록 표시
- ✅ 승인/거부 버튼
- ✅ 전체 사용자 목록 표시
- ✅ 사용자 비활성화 버튼
- ✅ 사용자 삭제 버튼
- ✅ 관리자 권한 체크 (비관리자 접근 차단)
- ✅ 자기 자신은 수정 불가
- ✅ 확인 다이얼로그 (실수 방지)

**UI 구조**:
```
┌─────────────────────────────────────┐
│  사용자 관리                         │
│  전체 3명 · 승인 대기 1명    [새로고침]│
├─────────────────────────────────────┤
│  승인 대기 (1)                       │
│  ┌─────────────────────────────┐   │
│  │ testuser                     │   │
│  │ 가입일: 2026-02-05          │   │
│  │             [승인] [거부]    │   │
│  └─────────────────────────────┘   │
├─────────────────────────────────────┤
│  전체 사용자 (3)                     │
│  ┌─────────────────────────────┐   │
│  │ admin [관리자]              │   │
│  │ 가입일: 2026-02-05          │   │
│  └─────────────────────────────┘   │
│  ┌─────────────────────────────┐   │
│  │ user1                        │   │
│  │ 가입일: 2026-02-05          │   │
│  │         [비활성화] [삭제]    │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### 4. App 라우팅 수정

**파일**: `frontend/src/App.tsx`

**변경 사항**:
```typescript
// 페이지 상태 추가
const [currentPage, setCurrentPage] = useState<PageType>('dashboard')

// 관리자만 "관리자" 버튼 표시
{user.role === 'admin' && (
  <Button onClick={() => setCurrentPage('admin')}>
    <Shield /> 관리자
  </Button>
)}

// 페이지 전환
{currentPage === 'dashboard' ? <Dashboard /> : <AdminPage />}
```

---

## ✅ 디자인 시스템 준수

### 색상
- Primary: Indigo (#6366F1) ✅
- Success: Green (승인 버튼) ✅
- Destructive: Red (거부/삭제 버튼) ✅

### 아이콘 (Lucide React)
- `Shield` - 관리자 페이지 버튼
- `Check` - 승인 버튼
- `X` - 거부 버튼
- `UserX` - 비활성화 버튼
- `Trash2` - 삭제 버튼
- `RefreshCw` - 새로고침 버튼
- `LayoutDashboard` - 대시보드 전환 버튼

### 스페이싱
- 카드 패딩: `p-6` ✅
- 요소 간격: `space-y-3`, `gap-2` ✅
- 버튼 크기: `size="sm"` ✅

---

## 🔄 사용자 플로우

### 관리자 로그인 → 승인

```
1. admin 계정으로 로그인
   ↓
2. 우측 상단 "관리자" 버튼 클릭
   ↓
3. 승인 대기 사용자 확인
   ↓
4. "승인" 버튼 클릭
   ↓
5. 확인 다이얼로그
   ↓
6. 사용자 승인 완료
   ↓
7. 목록 자동 새로고침
```

### 일반 사용자 회원가입 → 로그인

```
1. 회원가입 폼 작성
   ↓
2. "회원가입" 버튼 클릭
   ↓
3. 성공 메시지: "관리자 승인 후 로그인 가능"
   ↓
4. 관리자 승인 대기
   ↓
5. 관리자가 승인
   ↓
6. 로그인 가능
```

---

## 🧪 테스트 시나리오

### 1. 회원가입 승인 테스트
- [ ] 관리자로 로그인
- [ ] 새 계정 회원가입 (일반 브라우저)
- [ ] 관리자 페이지에서 승인 대기 목록 확인
- [ ] 승인 버튼 클릭
- [ ] 새 계정으로 로그인 성공

### 2. 회원가입 거부 테스트
- [ ] 새 계정 회원가입
- [ ] 관리자 페이지에서 거부 버튼 클릭
- [ ] 해당 계정이 목록에서 제거됨
- [ ] 로그인 시도 시 실패

### 3. 사용자 비활성화 테스트
- [ ] 승인된 사용자 선택
- [ ] 비활성화 버튼 클릭
- [ ] 해당 사용자 로그인 시도 시 차단
- [ ] 다시 활성화 가능

### 4. 사용자 삭제 테스트
- [ ] 사용자 선택
- [ ] 삭제 버튼 클릭
- [ ] 확인 다이얼로그
- [ ] 삭제 후 목록에서 제거

### 5. 권한 테스트
- [ ] 일반 사용자로 로그인
- [ ] 관리자 버튼 미표시 확인
- [ ] URL 직접 접근 시 차단 (API 403 에러)

### 6. 로그아웃 테스트
- [ ] 로그아웃 버튼 클릭
- [ ] localStorage 토큰 삭제 확인
- [ ] 로그인 페이지로 리다이렉트

---

## 🚨 주의사항

### 보안
- ✅ 관리자 API는 모두 `get_current_admin` 의존성 사용
- ✅ 프론트엔드에서도 권한 체크 (UI 숨김)
- ✅ 백엔드 검증이 최종 방어선

### UX
- ✅ 모든 위험한 작업에 확인 다이얼로그
- ✅ 자기 자신은 수정 불가 (UI 버튼 숨김)
- ✅ 에러 메시지 명확하게 표시

### 민감 정보
- ❌ 비밀번호는 절대 표시/로그 금지
- ✅ 사용자명만 표시
- ✅ JWT 토큰은 localStorage에만 저장

---

## 📁 생성/수정 파일 목록

### 신규 생성
1. ✅ `frontend/src/types/admin.ts`
2. ✅ `frontend/src/lib/adminApi.ts`
3. ✅ `frontend/src/components/admin/AdminPage.tsx`
4. ✅ `.claude/plans/admin-feature-plan.md` (이 파일)

### 수정
1. ✅ `frontend/src/App.tsx` - 관리자 페이지 라우팅 추가

---

## 🎉 완료!

관리자 기능이 모두 구현되었습니다.

**다음 단계**:
- 실제 환경에서 테스트
- 필요 시 관리자 대시보드 추가 (통계, 로그 등)
- 역할 기반 권한 확장 (viewer, editor 등)
