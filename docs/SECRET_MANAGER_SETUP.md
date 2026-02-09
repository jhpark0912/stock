# 🔐 GCP Secret Manager 설정 가이드

## 📋 목차
- [개요](#개요)
- [왜 필요한가?](#왜-필요한가)
- [구조](#구조)
- [초기 설정](#초기-설정)
- [Docker Compose 사용](#docker-compose-사용)
- [캐시 성능](#캐시-성능)
- [문제 해결](#문제-해결)

---

## 개요

GCP Secret Manager를 사용해 민감한 API 키를 안전하게 관리합니다.

### 보안 계층 구분

| 계층 | 저장 위치 | 시크릿 |
|------|----------|--------|
| 🔴 **높은 보안** | Secret Manager | GEMINI_API_KEY, KIS_APP_KEY/SECRET, JWT_SECRET_KEY, ENCRYPTION_KEY, ADMIN_PASSWORD |
| 🟢 **낮은 보안** | .env 파일 | FRED_API_KEY, ECOS_API_KEY (무료 API) |

### 비용

- **무료 티어**: 6개 시크릿, 10,000회 액세스/월
- **초과 시**: 시크릿당 $0.06/월, 추가 10,000회당 $0.03
- **현재 구성**: 6개 시크릿 → **완전 무료** ✅

---

## 왜 필요한가?

### 현재 방식의 문제점

```
VM에 .env 파일 저장
  ↓
🚨 SSH 접근 시 평문 노출
🚨 스냅샷/백업에 포함
🚨 Docker 컨테이너에서 env 조회 가능
```

### Secret Manager 사용 시

```
GCP Secret Manager
  ↓ (암호화된 통신)
애플리케이션
  ↓ (메모리 캐싱)
무한 재사용
```

**장점**:
- ✅ VM 파일 시스템에 키 없음
- ✅ IAM으로 접근 제어
- ✅ 버전 관리 + 감사 로그
- ✅ 키 로테이션 자동화

---

## 구조

### 캐싱 전략

```python
# 컨테이너 시작 시 (1회)
Settings.__init__()
  ↓
get_secret("gemini-api-key")  # API 호출 1회
  ↓
캐시 저장 (TTL: 1시간)
  ↓
이후 모든 요청은 캐시 사용 (API 호출 0회)
```

**예상 API 호출 횟수**:
- 컨테이너 시작: 6회 (6개 시크릿)
- 매일 재시작 1회: 6회/일
- **월 합계: 180회** (무료 한도 10,000회 대비 1.8%)

### 아키텍처

```
┌─────────────────────────────────────────┐
│         GCP Secret Manager              │
│  ┌───────────────────────────────────┐  │
│  │ gemini-api-key                    │  │
│  │ kis-app-key                       │  │
│  │ kis-app-secret                    │  │
│  │ jwt-secret-key                    │  │
│  │ encryption-key                    │  │
│  │ admin-password                    │  │
│  └───────────────────────────────────┘  │
└───────────────┬─────────────────────────┘
                │ (1) 시작 시 1회 조회
                ↓
┌─────────────────────────────────────────┐
│   Docker Container (stock-backend)      │
│  ┌───────────────────────────────────┐  │
│  │   SecretManagerClient             │  │
│  │   ┌─────────────────────────┐     │  │
│  │   │   Cache (TTL: 1시간)    │     │  │
│  │   │   - gemini-api-key      │     │  │
│  │   │   - kis-app-key         │     │  │
│  │   │   - ...                 │     │  │
│  │   └─────────────────────────┘     │  │
│  └───────────────────────────────────┘  │
│                                          │
│  (2) 이후 모든 요청은 캐시 사용          │
└─────────────────────────────────────────┘
```

---

## 초기 설정

### 1️⃣ GCP 프로젝트 준비

```bash
# GCP 프로젝트 ID 확인
gcloud config get-value project

# 출력 예: my-stock-app-123456
```

### 2️⃣ Secret Manager 초기화

```bash
# 스크립트 실행 권한 부여
chmod +x setup_secrets.sh

# GCP 프로젝트 ID 설정
export GCP_PROJECT_ID=your-project-id

# 초기 설정 실행
./setup_secrets.sh
```

**수행 작업**:
- ✅ Secret Manager API 활성화
- ✅ Service Account 생성 (`stock-backend-sa`)
- ✅ 6개 시크릿 생성 (빈 값)
- ✅ Service Account에 읽기 권한 부여
- ✅ `gcp-credentials.json` 생성 (Docker용)

### 3️⃣ 실제 시크릿 값 업로드

```bash
# .env 파일 확인 (기존 키 값 있어야 함)
cat .env | grep -E "GEMINI|KIS|JWT|ENCRYPTION|ADMIN"

# 시크릿 업로드
./update_secrets.sh
```

**출력 예시**:
```
✅ gemini-api-key 업데이트 완료
✅ kis-app-key 업데이트 완료
✅ kis-app-secret 업데이트 완료
✅ jwt-secret-key 업데이트 완료
✅ encryption-key 업데이트 완료
✅ admin-password 업데이트 완료
```

### 4️⃣ .env 파일 수정

```bash
nano .env
```

**추가 내용**:
```bash
# GCP Secret Manager 활성화
USE_SECRET_MANAGER=true
GCP_PROJECT_ID=your-project-id

# (선택) .env에서 민감한 값 제거
# GEMINI_API_KEY=...  ← 주석 처리 또는 삭제 가능
# KIS_APP_KEY=...     ← Secret Manager가 대신 사용
```

---

## Docker Compose 사용

### 시작

```bash
# 빌드 및 시작
docker-compose build
docker-compose up -d

# 로그 확인
docker logs stock-backend -f
```

**성공 시 로그**:
```
🔐 Secret Manager 활성화
✅ Secret Manager 초기화 완료 (Project: my-project)
🔍 Secret Manager API 호출: gemini-api-key
✅ Secret 조회 성공: gemini-api-key
...
```

### 재시작

```bash
# 환경 변수 변경 후 재시작
docker-compose restart backend

# 또는 완전 재시작
docker-compose down
docker-compose up -d
```

### 권한 확인

```bash
# 컨테이너 내부에서 gcloud 테스트
docker exec -it stock-backend bash
gcloud auth list
# 출력: stock-backend-sa@...iam.gserviceaccount.com
```

---

## 캐시 성능

### 캐시 통계 API

```bash
# 캐시 통계 조회
curl http://localhost:8000/api/secret-stats/cache-stats

# 응답 예시
{
  "success": true,
  "data": {
    "hits": 247,           # 캐시 히트
    "misses": 6,           # 캐시 미스
    "hit_rate": "97.63%",  # 히트율
    "api_calls": 6,        # 실제 API 호출
    "cached_secrets": 6    # 캐시된 시크릿 수
  }
}
```

### 캐시 초기화

```bash
# 캐시 강제 초기화 (다음 요청 시 Secret Manager 재조회)
curl -X POST http://localhost:8000/api/secret-stats/clear-cache
```

### 성능 지표

| 지표 | 목표 | 설명 |
|------|------|------|
| **Hit Rate** | 95% 이상 | 캐시 히트율 |
| **API Calls** | 200회 이하/월 | 실제 Secret Manager 호출 |
| **Cache Size** | 6개 | 현재 캐시된 시크릿 |

---

## 문제 해결

### ❌ "Permission denied"

**증상**:
```
google.api_core.exceptions.PermissionDenied: 403 Permission denied
```

**해결**:
```bash
# Service Account 권한 재부여
gcloud secrets add-iam-policy-binding gemini-api-key \
  --member="serviceAccount:stock-backend-sa@PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

### ❌ "Secret not found"

**증상**:
```
google.api_core.exceptions.NotFound: 404 Secret not found
```

**해결**:
```bash
# 시크릿 존재 확인
gcloud secrets list --project=PROJECT_ID

# 없으면 생성
echo -n "your-value" | gcloud secrets create gemini-api-key \
  --data-file=- \
  --project=PROJECT_ID
```

---

### ❌ "GOOGLE_APPLICATION_CREDENTIALS 없음"

**증상**:
```
DefaultCredentialsError: Could not automatically determine credentials
```

**해결**:
```bash
# gcp-credentials.json 존재 확인
ls -la gcp-credentials.json

# 없으면 재생성
gcloud iam service-accounts keys create gcp-credentials.json \
  --iam-account=stock-backend-sa@PROJECT_ID.iam.gserviceaccount.com
```

---

### ❌ "Secret value is PLACEHOLDER"

**증상**:
```
ValueError: 시크릿이 설정되지 않았습니다: gemini-api-key
```

**해결**:
```bash
# 실제 값 업데이트
echo -n "real-api-key-value" | gcloud secrets versions add gemini-api-key \
  --data-file=- \
  --project=PROJECT_ID

# 또는 업데이트 스크립트 재실행
./update_secrets.sh
```

---

### ❌ Docker 컨테이너에서 Secret Manager 접근 불가

**증상**:
```
Secret Manager 초기화 실패: ...
⚠️  Fallback: .env 파일 사용
```

**체크리스트**:
1. `gcp-credentials.json` 파일 존재 확인
   ```bash
   ls -la gcp-credentials.json
   ```

2. `docker-compose.yml` 볼륨 마운트 확인
   ```yaml
   volumes:
     - ./gcp-credentials.json:/app/gcp-credentials.json:ro
   ```

3. 환경 변수 확인
   ```bash
   docker exec stock-backend env | grep -E "GCP|GOOGLE"
   ```

4. Service Account 키 유효성 확인
   ```bash
   gcloud auth activate-service-account --key-file=gcp-credentials.json
   gcloud secrets list  # 접근 가능해야 함
   ```

---

## 시크릿 값 직접 업데이트

### 개별 시크릿 업데이트

```bash
# Gemini API 키 변경
echo -n "new-gemini-api-key" | gcloud secrets versions add gemini-api-key \
  --data-file=- \
  --project=PROJECT_ID

# 컨테이너 재시작 (캐시 갱신)
docker-compose restart backend
```

### 웹 콘솔에서 업데이트

1. GCP Console → Security → Secret Manager
2. 시크릿 선택 (예: `gemini-api-key`)
3. "New Version" 클릭
4. 새 값 입력 후 "Add New Version"
5. Docker 컨테이너 재시작

---

## Fallback 동작

Secret Manager 실패 시 자동으로 `.env` 파일 사용:

```python
# backend/app/config.py
if self.use_secret_manager:
    # Secret Manager 시도
    self.gemini_api_key = get_secret("gemini-api-key", "GEMINI_API_KEY")
    #                                                    ↑ fallback
else:
    # .env 사용
    self.gemini_api_key = os.getenv("GEMINI_API_KEY")
```

**Fallback 시나리오**:
- ✅ Secret Manager API 장애
- ✅ 네트워크 오류
- ✅ 권한 부족
- ✅ `USE_SECRET_MANAGER=false` 설정

---

## 보안 체크리스트

### ✅ 필수 보안 조치

- [ ] `gcp-credentials.json`이 `.gitignore`에 포함됨
- [ ] `.env` 파일이 `.gitignore`에 포함됨
- [ ] Docker 이미지에 `gcp-credentials.json` 포함 안 됨
- [ ] Service Account는 최소 권한만 부여 (`secretAccessor`)
- [ ] Secret Manager API만 활성화 (불필요한 API 비활성화)

### ✅ 추가 보안 권장

- [ ] VM 방화벽으로 IP 화이트리스트 설정
- [ ] HTTPS 설정 (Let's Encrypt)
- [ ] 주기적 키 로테이션 (90일)
- [ ] 감사 로그 모니터링

---

## 요약

### 설정 순서

```bash
1. ./setup_secrets.sh          # GCP 초기 설정
2. ./update_secrets.sh         # 시크릿 값 업로드
3. .env에 USE_SECRET_MANAGER=true 추가
4. docker-compose up -d        # 재시작
5. 캐시 통계 확인 (선택)
```

### 비용

- **6개 시크릿**: $0/월 (무료)
- **예상 API 호출**: 180회/월 (무료 한도 10,000회 대비 1.8%)

### 장점

- 🔐 VM 파일 시스템에 평문 키 없음
- 📊 캐싱으로 API 호출 최소화 (월 200회 이하)
- 🔄 키 로테이션 쉬움
- 📝 감사 로그 자동 기록
- 💰 완전 무료

---

**문의사항**: 문제 발생 시 `docker logs stock-backend` 확인 후 이슈 등록
