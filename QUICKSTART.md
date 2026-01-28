# 🚀 빠른 시작 가이드

> Backend MVP 완료 → Frontend 개발 시작

---

## ✅ 현재 상태

- **Backend**: ✅ 완료 (FastAPI + Mock 데이터)
- **Frontend**: ⏸️ 대기

---

## 🏃 1분 안에 시작하기

### Backend 실행

```bash
# 1. 디렉토리 이동
cd backend

# 2. 환경 변수 확인 (.env 파일이 없으면 생성)
# .env.example을 복사하여 .env 생성 후 아래 설정:

# .env 파일 내용:
USE_MOCK_DATA=true
ENVIRONMENT=development

# 3. 서버 실행
python -m app.main
```

### 테스트

브라우저에서 접속:
- **API 문서**: http://localhost:8000/docs
- **주식 조회**: http://localhost:8000/api/stock/AAPL

또는 터미널에서:
```bash
curl http://localhost:8000/api/stock/AAPL
```

---

## 📊 사용 가능한 Mock 티커

- `AAPL` - Apple
- `TSLA` - Tesla
- `GOOGL` - Google
- `MSFT` - Microsoft

---

## 🔧 문제 해결

### "Module not found" 에러
```bash
pip install -r requirements.txt
```

### "429 Too Many Requests" 에러
`.env` 파일에서:
```env
USE_MOCK_DATA=true
```

---

## 📝 다음 단계

1. **Frontend 생성**
   ```bash
   cd ..  # stock/ 디렉토리로
   npm create vite@latest frontend -- --template react-ts
   cd frontend
   npm install
   npm run dev
   ```

2. **상세 가이드 참조**
   - `PROGRESS.md`: 전체 진행 상황
   - `backend/README.md`: Backend 상세 가이드
   - `WEB_MIGRATION_PLAN.md`: 전체 계획

---

**현재 위치**: Backend MVP 완료 ✅
**다음 목표**: Frontend React 앱 생성 🎯
