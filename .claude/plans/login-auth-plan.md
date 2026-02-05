# 로그인 페이지 및 인증 시스템 구현 계획

> **⚠️ 디자인 시스템 기준**: `.claude/docs/LINEAR_DESIGN_PLAN_V2.md` 준수
> **Primary Color**: Indigo (#6366F1) - Linear 앱 스타일

---

## 📍 현재 상황 분석

### ✅ 이미 완료된 것
1. **백엔드 인증 API** (FastAPI + JWT)
   - `POST /api/auth/login` - 로그인
   - `POST /api/auth/register` - 회원가입 (승인 대기)
   - `GET /api/auth/me` - 현재 사용자 정보
   - JWT 토큰 발급 및 검증 완료
   - 승인 시스템 (is_approved) 구현됨

2. **프론트엔드 준비 작업**
   - React Router DOM 7.13.0 설치됨 (미사용)
   - API 인터셉터 준비됨 (`lib/api.ts`)
   - 토큰 저장 구조 (`localStorage.access_token`)
   - Bearer 토큰 자동 추가 (요청 인터셉터)
   - **Tailwind CSS v4** 적용 (`@theme` directive 사용)
   - **Indigo 색상 시스템** 이미 적용됨 (`index.css`)

### ❌ 미완성/필요한 것
1. 로그인 페이지 없음
2. React Router 미사용 (현재 단일 페이지)
3. 보호된 라우트 미구현
4. 인증 컨텍스트 없음
5. 401 에러 처리 미완성 (TODO 주석)

---

## 🎨 디자인 시스템 (LINEAR_DESIGN_PLAN_V2.md 기준)

### 색상 체계

| 요소 | 라이트 모드 | 다크 모드 | 용도 |
|------|-----------|----------|------|
| **Primary** | **Indigo #6366F1** | **Indigo #818CF8** | **버튼, 링크, 포인트** |
| **Background** | White #FFFFFF | Dark #0A0A0A | 메인 배경 |
| **Card** | White #FFFFFF | Dark Gray #111111 | 카드 배경 |
| **Muted** | Gray #F5F5F5 | Dark Gray #1A1A1A | 보조 배경 |
| **Border** | Gray #E5E5E5 | Gray #2A2A2A | 경계선 |
| **Foreground** | Black #0A0A0A | White #FAFAFA | 메인 텍스트 |
| **Muted Foreground** | Gray #737373 | Gray #A1A1AA | 보조 텍스트 |
| **Destructive** | Red #EF4444 | Red #F87171 | 에러 메시지 |

### 타이포그래피

| 요소 | 크기 | 용도 |
|------|------|------|
| **Hero Number** | text-6xl (60px) | 현재가 (대시보드) |
| **Hero Title** | text-4xl (36px) | 티커 심볼 |
| **Section Title** | text-2xl (24px) | **로그인 제목** |
| **Body** | text-base (16px) | 본문 |
| **Caption** | text-sm (14px) | 설명 텍스트 |
| **Label** | text-sm (14px) | **폼 레이블** |

### 레이아웃 원칙

- **여백**: 일관된 spacing (p-4, p-6, gap-4)
- **애니메이션**: GPU 가속 (transform, opacity), 150-300ms
- **카드 Hover**: shadow-lg + border-primary/30
- **다크 모드**: 라이트보다 밝게 (접근성)

---

## 🎯 구현 목표

1. **로그인 페이지 생성** - LINEAR_DESIGN_PLAN_V2 준수
2. **React Router 통합** - 페이지 라우팅 설정
3. **인증 컨텍스트** - 전역 상태 관리
4. **보호된 라우트** - 미인증 사용자 접근 차단
5. **401 에러 처리** - 자동 로그인 페이지 리다이렉트

---

## 📁 수정/생성 파일 목록

### 신규 생성
1. `frontend/src/pages/LoginPage.tsx` - 로그인 페이지
2. `frontend/src/contexts/AuthContext.tsx` - 인증 컨텍스트
3. `frontend/src/components/PrivateRoute.tsx` - 보호된 라우트 래퍼
4. `frontend/src/types/auth.ts` - 인증 관련 타입

### 수정
1. `frontend/src/main.tsx` - BrowserRouter + AuthProvider 추가
2. `frontend/src/App.tsx` - 라우팅 구조로 변경
3. `frontend/src/lib/api.ts` - 401 에러 처리 완성

---

## 🛠 상세 구현 계획

### 1단계: 인증 타입 정의 (auth.ts)

**파일**: `frontend/src/types/auth.ts`

```typescript
// 로그인 요청
export interface LoginRequest {
  username: string;
  password: string;
}

// 로그인 응답 (백엔드 Token 모델)
export interface LoginResponse {
  access_token: string;
}

// 사용자 정보 (백엔드 UserResponse 모델)
export interface User {
  id: number;
  username: string;
  role: string;
  is_approved: boolean;
  is_active: boolean;
  created_at: string;
}

// 인증 컨텍스트 타입
export interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}
```

---

### 2단계: 인증 컨텍스트 구현 (AuthContext.tsx)

**파일**: `frontend/src/contexts/AuthContext.tsx`

**주요 기능**:
1. 토큰 관리 (localStorage)
2. 사용자 정보 조회 (`GET /api/auth/me`)
3. 로그인/로그아웃 함수 제공
4. 초기 로딩 시 토큰 검증

**핵심 로직**:
```typescript
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 초기화: 토큰이 있으면 사용자 정보 조회
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const response = await api.get('/api/auth/me');
          setUser(response.data.data);
        } catch {
          localStorage.removeItem('access_token');
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  // 로그인
  const login = async (username: string, password: string) => {
    const response = await api.post('/api/auth/login', { username, password });
    const { access_token } = response.data;
    localStorage.setItem('access_token', access_token);

    // 사용자 정보 조회
    const userResponse = await api.get('/api/auth/me');
    setUser(userResponse.data.data);
  };

  // 로그아웃
  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

### 3단계: 로그인 페이지 구현 (LoginPage.tsx)

**파일**: `frontend/src/pages/LoginPage.tsx`

**디자인 요구사항** (LINEAR_DESIGN_PLAN_V2 기준):
- Primary 색상: **Indigo (#6366F1)** ✅
- shadcn/ui 컴포넌트 활용 (Button, Input, Card)
- 에러 메시지: `text-destructive` 사용
- 스페이싱: `space-y-4` (16px 간격)
- 타이포그래피: H2 (`text-2xl font-semibold`)
- 카드 Hover: `shadow-lg + border-primary/30`

**레이아웃**:
```
┌─────────────────────────────────────┐
│                                     │
│          📊 Stock Dashboard          │
│         시장 분석 도구에 오신 것을    │
│              환영합니다              │
│                                     │
│  ┌─────────────────────────────┐   │
│  │  로그인                      │   │
│  │                             │   │
│  │  Username: [_________]      │   │
│  │  Password: [_________] 👁️   │   │
│  │                             │   │
│  │  [로그인 버튼 - Indigo]      │   │
│  │                             │   │
│  │  회원가입이 필요하신가요?     │   │
│  └─────────────────────────────┘   │
│                                     │
│        [다크모드 토글 🌙]            │
│                                     │
└─────────────────────────────────────┘
```

**주요 기능**:
1. 폼 검증 (빈 값 체크)
2. 로그인 API 호출 (AuthContext 사용)
3. 성공 시 대시보드로 리다이렉트
4. 실패 시 에러 메시지 표시
5. 로딩 상태 표시

**에러 처리**:
- 401: "사용자명 또는 비밀번호가 잘못되었습니다"
- 403: "승인 대기 중입니다" 또는 "비활성화된 계정입니다"
- 기타: "로그인 중 오류가 발생했습니다"

---

### 4단계: 보호된 라우트 컴포넌트 (PrivateRoute.tsx)

**파일**: `frontend/src/components/PrivateRoute.tsx`

**기능**:
- 로그인 안 된 사용자 → `/login`으로 리다이렉트
- 로그인된 사용자 → 자식 컴포넌트 렌더링
- 로딩 중 → 스피너 표시

```typescript
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner message="Loading..." />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
```

---

### 5단계: 라우팅 구조 변경

**파일**: `frontend/src/main.tsx`

**변경 전**:
```tsx
<ThemeProvider>
  <App />
</ThemeProvider>
```

**변경 후**:
```tsx
<ThemeProvider>
  <AuthProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </AuthProvider>
</ThemeProvider>
```

---

**파일**: `frontend/src/App.tsx`

**변경 전**: 단일 페이지 (AppLayout + Sidebar + MainTabs)

**변경 후**: 라우팅 구조

```tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { PrivateRoute } from './components/PrivateRoute';
import { DashboardPage } from './pages/DashboardPage'; // 기존 App 컴포넌트 분리

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/"
        element={
          <PrivateRoute>
            <DashboardPage />
          </PrivateRoute>
        }
      />

      {/* 404 처리 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
```

**DashboardPage 분리**:
- 기존 `App.tsx`의 대시보드 로직을 `pages/DashboardPage.tsx`로 이동
- 포트폴리오 데이터, 주식 데이터, 탭 시스템 등 모두 포함

---

### 6단계: API 인터셉터 완성 (api.ts)

**파일**: `frontend/src/lib/api.ts`

**변경 전** (58번째 줄):
```typescript
// TODO: 로그인 페이지로 리다이렉트 (Router 설정 후)
console.error('인증 오류: 로그인이 필요합니다.');
```

**변경 후**:
```typescript
// 로그인 페이지로 리다이렉트
window.location.href = '/login';
```

---

## 🎨 로그인 페이지 디자인 미리보기 (HTML)

**사용 방법**: 아래 코드를 `login-preview.html`로 저장하고 브라우저에서 열어보세요.

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>로그인 - Stock Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: '#6366f1',        // Indigo-500
            'primary-dark': '#4f46e5',  // Indigo-600
            destructive: '#ef4444',
          }
        }
      }
    }
  </script>
</head>
<body class="bg-gray-50 dark:bg-zinc-950">

  <!-- 다크모드 토글 (우측 하단) -->
  <button
    onclick="toggleDarkMode()"
    class="fixed bottom-6 right-6 p-3 rounded-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-lg hover:shadow-xl transition-all"
  >
    <span class="dark:hidden text-xl">🌙</span>
    <span class="hidden dark:inline text-xl">☀️</span>
  </button>

  <!-- 메인 컨테이너 -->
  <div class="min-h-screen flex items-center justify-center p-4">

    <!-- 로그인 카드 -->
    <div class="w-full max-w-md">

      <!-- 헤더 -->
      <div class="text-center mb-8">
        <div class="text-5xl mb-3">📊</div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Stock Dashboard
        </h1>
        <p class="text-sm text-gray-600 dark:text-gray-400">
          시장 분석 도구에 오신 것을 환영합니다
        </p>
      </div>

      <!-- 카드 -->
      <div class="bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-800 p-8 hover:shadow-xl hover:border-primary/30 transition-all duration-200">

        <h2 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
          로그인
        </h2>

        <!-- 에러 메시지 (숨김) -->
        <div id="error-message" class="hidden bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm rounded-md p-3 mb-4">
          ⚠️ 사용자명 또는 비밀번호가 잘못되었습니다
        </div>

        <!-- 폼 -->
        <form onsubmit="handleSubmit(event)" class="space-y-4">

          <!-- Username -->
          <div>
            <label
              for="username"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              placeholder="admin"
              class="w-full h-10 px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
            />
          </div>

          <!-- Password -->
          <div>
            <label
              for="password"
              class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
            >
              Password
            </label>
            <div class="relative">
              <input
                type="password"
                id="password"
                placeholder="••••••••"
                class="w-full h-10 px-3 py-2 pr-10 border border-gray-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
              />
              <button
                type="button"
                onclick="togglePassword()"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <span id="eye-icon">👁️</span>
              </button>
            </div>
          </div>

          <!-- 로그인 버튼 -->
          <button
            type="submit"
            class="w-full h-10 mt-6 bg-primary hover:bg-primary-dark active:scale-95 text-white font-medium rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
          >
            로그인
          </button>

        </form>

        <!-- 구분선 -->
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-200 dark:border-zinc-800"></div>
          </div>
        </div>

        <!-- 회원가입 링크 -->
        <div class="text-center text-sm">
          <span class="text-gray-600 dark:text-gray-400">아직 계정이 없으신가요?</span>
          <a
            href="#"
            onclick="showRegister(event)"
            class="ml-1 text-primary hover:underline font-medium transition-colors"
          >
            회원가입
          </a>
        </div>

      </div>

      <!-- 푸터 -->
      <div class="mt-8 text-center text-xs text-gray-500 dark:text-gray-600">
        <p>© 2026 Stock Dashboard. All rights reserved.</p>
        <p class="mt-1">Design System: Linear-inspired with Indigo accent</p>
      </div>

    </div>

  </div>

  <script>
    // 다크모드 토글
    function toggleDarkMode() {
      document.documentElement.classList.toggle('dark');
    }

    // 비밀번호 표시/숨김
    function togglePassword() {
      const passwordInput = document.getElementById('password');
      const eyeIcon = document.getElementById('eye-icon');

      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.textContent = '🙈';
      } else {
        passwordInput.type = 'password';
        eyeIcon.textContent = '👁️';
      }
    }

    // 폼 제출 (데모)
    function handleSubmit(event) {
      event.preventDefault();

      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      const errorMessage = document.getElementById('error-message');

      // 빈 값 체크
      if (!username || !password) {
        errorMessage.textContent = '⚠️ 사용자명과 비밀번호를 입력해주세요';
        errorMessage.classList.remove('hidden');
        return;
      }

      // 데모 검증
      if (username === 'admin' && password === 'password') {
        alert('✅ 로그인 성공! (데모)\n실제 구현 시 대시보드로 이동합니다.');
        errorMessage.classList.add('hidden');
      } else {
        errorMessage.textContent = '⚠️ 사용자명 또는 비밀번호가 잘못되었습니다';
        errorMessage.classList.remove('hidden');
      }
    }

    // 회원가입 페이지 (데모)
    function showRegister(event) {
      event.preventDefault();
      alert('📝 회원가입 페이지\n(실제 구현 시 /register 라우트로 이동)');
    }

    // 초기 다크모드 설정
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
    }
  </script>

</body>
</html>
```

---

## 🔄 사용자 플로우

### 로그인되지 않은 사용자
```
1. 앱 접속 (/)
   ↓
2. PrivateRoute에서 차단
   ↓
3. /login으로 리다이렉트
   ↓
4. 로그인 폼 입력
   ↓
5. POST /api/auth/login (백엔드)
   ↓
6. 토큰 저장 (localStorage)
   ↓
7. GET /api/auth/me (사용자 정보)
   ↓
8. AuthContext에 사용자 저장
   ↓
9. 대시보드(/)로 리다이렉트
```

### 로그인된 사용자
```
1. 앱 접속 (/)
   ↓
2. AuthProvider 초기화
   ↓
3. localStorage에서 토큰 확인
   ↓
4. GET /api/auth/me (사용자 정보 검증)
   ↓
5. 사용자 정보 로드 완료
   ↓
6. PrivateRoute 통과
   ↓
7. 대시보드 표시
```

### 토큰 만료 시
```
1. API 요청 (/api/stock/AAPL)
   ↓
2. 401 Unauthorized 응답
   ↓
3. 인터셉터에서 토큰 삭제
   ↓
4. /login으로 리다이렉트
```

---

## ✅ 검증 계획

### 1. 로그인 기능 테스트
- [ ] 올바른 사용자명/비밀번호로 로그인 성공
- [ ] 잘못된 사용자명/비밀번호로 로그인 실패 (401 에러)
- [ ] 승인되지 않은 사용자 로그인 차단 (403 에러)
- [ ] 로그인 성공 후 대시보드로 리다이렉트

### 2. 보호된 라우트 테스트
- [ ] 로그인 안 한 상태에서 `/` 접속 시 `/login`으로 리다이렉트
- [ ] 로그인 후 `/` 접속 시 대시보드 정상 표시
- [ ] 로그아웃 후 다시 `/login`으로 리다이렉트

### 3. 토큰 관리 테스트
- [ ] 로그인 시 `localStorage.access_token` 저장
- [ ] 로그아웃 시 토큰 삭제
- [ ] 401 에러 시 토큰 삭제 + 리다이렉트
- [ ] 새로고침 후에도 로그인 상태 유지

### 4. UI/UX 테스트
- [ ] 로그인 페이지 디자인이 LINEAR_DESIGN_PLAN_V2와 일치
- [ ] Primary 색상이 **Indigo (#6366F1)**인지 확인
- [ ] 카드 Hover 효과 (shadow-lg + border-primary/30)
- [ ] 에러 메시지 명확하게 표시
- [ ] 로딩 상태 표시

### 5. 다크모드 테스트
- [ ] 다크모드 토글 정상 작동
- [ ] 다크모드에서 Indigo #818CF8 사용 확인

---

## 🚀 구현 순서 (권장)

```
1️⃣ 타입 정의 (auth.ts)
   └─ 빠른 타입 체크 확보

2️⃣ 인증 컨텍스트 (AuthContext.tsx)
   └─ 핵심 로직 우선 구현

3️⃣ 보호된 라우트 (PrivateRoute.tsx)
   └─ 라우팅 보호 메커니즘

4️⃣ 로그인 페이지 (LoginPage.tsx)
   └─ UI 구현 (Indigo 색상 필수)

5️⃣ 대시보드 분리 (DashboardPage.tsx)
   └─ 기존 App 로직 이동

6️⃣ 라우팅 통합 (main.tsx, App.tsx)
   └─ 전체 연결

7️⃣ API 인터셉터 완성 (api.ts)
   └─ 401 에러 처리

8️⃣ 테스트 및 검증
   └─ 전체 플로우 확인
```

---

## 📝 주의사항

1. **색상 시스템**
   - ✅ Primary: Indigo (#6366F1) 사용 필수
   - ❌ Teal (#14B8A6) 사용 금지
   - 디자인 기준: `.claude/docs/LINEAR_DESIGN_PLAN_V2.md`

2. **Tailwind v4**
   - `tailwind.config.js` 사용 안 함
   - `@theme {}` directive로 색상 정의
   - 이미 `index.css`에 적용되어 있음

3. **민감 정보 보호**
   - 비밀번호 로그 출력 금지
   - 토큰은 localStorage에만 저장

4. **에러 처리**
   - 모든 API 호출에 try-catch 적용
   - 사용자 친화적인 에러 메시지

---

**계획 완료** ✅

이 디자인을 확인하신 후 계획을 승인해주시면 실제 React 컴포넌트로 구현하겠습니다.
