# 로그 레벨 관리 가이드

## 개요

백엔드 애플리케이션의 로그 레벨을 환경 변수 또는 API를 통해 동적으로 관리할 수 있습니다.

## 로그 레벨 종류

| 레벨 | 설명 | 포함 내용 |
|------|------|-----------|
| **DEBUG** | 상세한 디버깅 정보 | 모든 요청/응답 상세, Query params, Headers, DB 경로, 라우터 등록 등 |
| **INFO** | 일반 정보 (기본값) | 주요 이벤트 (DB 초기화, Admin 계정 생성 등) |
| **WARNING** | 경고 및 에러 | 경고, 에러 응답 (4xx, 5xx) |
| **ERROR** | 에러만 | 에러 메시지만 |
| **CRITICAL** | 심각한 에러만 | 치명적인 에러만 |

## 설정 방법

### 1. 환경 변수로 설정 (영구적)

**`.env` 파일**:
```env
LOG_LEVEL=INFO
```

**docker-compose.yml**:
```yaml
environment:
  - LOG_LEVEL=INFO
```

**적용**:
```bash
docker-compose down
docker-compose up -d
```

### 2. API로 런타임 변경 (일시적)

**현재 로그 레벨 조회**:
```http
GET /api/admin/system/log-level
Authorization: Bearer {admin_token}
```

**응답**:
```json
{
  "current_level": "INFO",
  "available_levels": ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
}
```

**로그 레벨 변경**:
```http
PUT /api/admin/system/log-level
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "level": "DEBUG"
}
```

**응답**:
```json
{
  "current_level": "DEBUG",
  "available_levels": ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
}
```

## 로그 레벨별 출력 예시

### DEBUG (모든 로그)
```
2026-02-06 10:00:00 - app.main - DEBUG - 🔵 요청 시작: GET /api/stock/AAPL
2026-02-06 10:00:00 - app.main - DEBUG -    📍 Query params: {}
2026-02-06 10:00:00 - app.main - DEBUG -    📍 Headers: {...}
2026-02-06 10:00:00 - app.database.connection - DEBUG - 📂 DB Directory: /app/data
2026-02-06 10:00:00 - app.database.connection - DEBUG - 📄 DB File: /app/data/portfolio.db
2026-02-06 10:00:01 - app.main - DEBUG - 🟢 응답 완료: GET /api/stock/AAPL Status: 200 Time: 0.523s
```

### INFO (중요 이벤트만)
```
2026-02-06 10:00:00 - app.main - INFO - 🗄️ Database initialized
2026-02-06 10:00:01 - app.main - INFO - 👤 Admin 계정 존재함: admin
```

### WARNING (경고 및 에러만)
```
2026-02-06 10:00:05 - app.main - WARNING - 🔴 응답 완료: GET /api/stock/INVALID Status: 404 Time: 0.012s
2026-02-06 10:00:06 - app.main - ERROR - 🚨 404 에러 발생!
```

## 권장 사용 시나리오

| 상황 | 권장 레벨 | 이유 |
|------|----------|------|
| **개발 환경** | DEBUG | 모든 정보 확인 필요 |
| **스테이징** | INFO | 주요 이벤트 모니터링 |
| **프로덕션** | WARNING | 성능 최적화, 에러만 추적 |
| **디버깅** | DEBUG | 문제 원인 파악 |
| **성능 테스트** | ERROR | 로그 오버헤드 최소화 |

## 주의 사항

1. **API로 변경한 로그 레벨은 일시적**
   - 컨테이너 재시작 시 환경 변수 값으로 초기화됨
   - 영구 변경하려면 `.env` 또는 `docker-compose.yml` 수정 필요

2. **프로덕션에서 DEBUG 사용 주의**
   - 성능 저하 가능
   - 민감한 정보(Headers 등) 노출 위험
   - 로그 파일 크기 급증

3. **Admin 권한 필요**
   - 로그 레벨 API는 관리자만 사용 가능
   - Admin 로그인 후 Bearer 토큰 필요

## 로그 필터링 예시

특정 모듈만 DEBUG로 설정하려면 Python 코드에서 직접 조정:

```python
import logging

# 전체는 INFO
logging.getLogger().setLevel(logging.INFO)

# 특정 모듈만 DEBUG
logging.getLogger("app.database").setLevel(logging.DEBUG)
```

## 트러블슈팅

**Q: API로 변경했는데 로그가 안 바뀌어요**
- A: 핸들러 레벨도 함께 변경되는지 확인 (현재 구현은 자동 변경됨)

**Q: 컨테이너 재시작 후 원래대로 돌아가요**
- A: 정상입니다. `.env` 파일을 수정하여 영구 적용하세요.

**Q: DEBUG로 바꿨는데 너무 로그가 많아요**
- A: WARNING으로 올리거나, 특정 엔드포인트만 모니터링하세요.
