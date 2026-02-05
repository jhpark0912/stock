# 데이터 초기화 가이드

## localStorage 초기화 방법

기존에 저장된 티커 데이터를 완전히 삭제하고 빈 화면으로 시작하려면 다음 방법 중 하나를 사용하세요.

---

## 방법 1: 브라우저 개발자 도구 (권장)

1. **개발자 도구 열기**
   - Windows/Linux: `F12` 또는 `Ctrl + Shift + I`
   - Mac: `Cmd + Option + I`

2. **Console 탭 선택**

3. **다음 명령어 실행**
   ```javascript
   localStorage.removeItem('stock_app_user_settings')
   ```
   또는 전체 localStorage 삭제:
   ```javascript
   localStorage.clear()
   ```

4. **페이지 새로고침** (`F5` 또는 `Ctrl + R`)

---

## 방법 2: Application 탭에서 수동 삭제

1. **개발자 도구 열기** (F12)

2. **Application 탭 선택**

3. **좌측 메뉴에서 Storage → Local Storage 선택**

4. **현재 사이트 선택** (예: `http://localhost:8081`)

5. **`stock_app_user_settings` 항목 찾아서 우클릭 → Delete**

6. **페이지 새로고침**

---

## 방법 3: 프로그래밍 방식 (개발자용)

### storage.ts 유틸리티 사용

```typescript
import { clearSettings } from './utils/storage';

// 모든 설정 초기화
clearSettings();

// 페이지 리로드
window.location.reload();
```

### React 컴포넌트에서 사용

```tsx
const handleReset = () => {
  if (confirm('Are you sure you want to reset all data?')) {
    localStorage.removeItem('stock_app_user_settings');
    window.location.reload();
  }
};

// 버튼에 연결
<button onClick={handleReset}>Reset All Data</button>
```

---

## 초기 상태 확인

초기화 후 다음과 같은 상태가 되어야 합니다:

- ✅ **Sidebar:** "No tickers added yet" 메시지 표시
- ✅ **HeroSection:** "Click 'Add Ticker' to get started" 메시지
- ✅ **MainTabs:** 모든 탭이 빈 상태 + 안내 메시지
  - Overview: "No tickers added yet. / Add a ticker from the sidebar to get started."
  - AI Analysis: 동일
  - Chart: 동일
  - Technical: 동일
  - News: 동일

**중요:** 초기 자동 로딩이 비활성화되어 있으므로, **사용자가 직접 티커를 클릭해야만** 데이터가 로드됩니다.

---

## 문제 해결

### localStorage가 삭제되지 않는 경우

1. **시크릿 모드(Incognito)에서 테스트**
   - 브라우저 확장 프로그램이 간섭할 수 있음

2. **브라우저 캐시 삭제**
   - `Ctrl + Shift + Delete` → "Cached images and files" 체크 → Clear

3. **브라우저 재시작**
   - 완전히 종료 후 다시 실행

---

## 개발 중 자동 초기화 (Optional)

개발 중 매번 초기화하려면 `App.tsx`에 다음 코드 추가:

```tsx
// 개발 모드에서만 실행
useEffect(() => {
  if (import.meta.env.DEV) {
    // localStorage.removeItem('stock_app_user_settings');
  }
}, []);
```

**주의:** 주석을 풀면 개발 서버 시작 시 매번 초기화됩니다.

---

**최종 업데이트:** 2026-02-04
