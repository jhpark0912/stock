# GCP Cloud Build 빠른 시작 가이드

> **목표**: 5분 안에 GCP Cloud Build로 이미지 빌드 후 VM에 배포

---

## 🚀 빠른 시작 (5분)

### 1️⃣ GCP 초기 설정 (2분)

```bash
# 1. 프로젝트 설정
gcloud config set project YOUR-PROJECT-ID

# 2. API 활성화
gcloud services enable cloudbuild.googleapis.com artifactregistry.googleapis.com

# 3. Artifact Registry 생성
gcloud artifacts repositories create stock-app \
  --repository-format=docker \
  --location=us-central1 \
  --description="Stock App Docker Images"

# 4. 서비스 계정 권한 부여
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")
gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"
```

### 2️⃣ 빌드 실행 (1-2분)

```bash
# 프로젝트 루트에서 실행
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=_REGION=us-central1,_REPOSITORY=stock-app
```

**예상 시간**:
- 최초: 3-5분
- 이후: 1-2분 (캐시 활용)

### 3️⃣ VM 배포 (1분)

#### A. VM 접속

```bash
gcloud compute ssh YOUR-VM-NAME --zone=us-central1-c
```

#### B. 프로젝트 준비 (최초 1회만)

```bash
# Docker 설치 (최초 1회)
sudo apt-get update && sudo apt-get install -y docker.io docker-compose-plugin
sudo usermod -aG docker $USER
exit  # 재로그인

# 재접속
gcloud compute ssh YOUR-VM-NAME --zone=us-central1-c

# Git 클론 (최초 1회)
git clone https://github.com/YOUR-USERNAME/stock.git
cd stock

# 환경 변수 설정 (최초 1회)
cp .env.production.example .env
nano .env  # GCP_PROJECT_ID, SERVER_IP 등 입력
```

#### C. Docker 인증 (최초 1회)

```bash
# Artifact Registry 인증
gcloud auth configure-docker us-central1-docker.pkg.dev
```

#### D. 배포

```bash
# 실행 권한 부여 (최초 1회)
chmod +x deploy.sh

# 배포 실행 (매번)
./deploy.sh
```

---

## 📊 결과 확인

### 빌드 상태

```bash
# 최근 빌드 목록
gcloud builds list --limit=5

# 빌드 로그
gcloud builds log BUILD_ID
```

### 이미지 확인

```bash
# Artifact Registry 이미지
gcloud artifacts docker images list \
  us-central1-docker.pkg.dev/YOUR-PROJECT-ID/stock-app
```

### 서비스 확인

VM에서:
```bash
# 컨테이너 상태
docker compose -f docker-compose.prod.yml ps

# 로그
docker compose -f docker-compose.prod.yml logs -f

# 헬스체크
curl http://localhost:8000/api/health
```

---

## 🔄 이후 배포 워크플로우

### 로컬 개발 → 빌드 → 배포

```bash
# 1. 코드 수정 후 Git Push
git add .
git commit -m "feat: 새 기능 추가"
git push origin main

# 2. Cloud Build 실행 (로컬)
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=_REGION=us-central1,_REPOSITORY=stock-app

# 3. VM에서 배포
# VM SSH 접속
gcloud compute ssh YOUR-VM-NAME --zone=us-central1-c

# 배포 실행
cd stock
./deploy.sh
```

---

## 🤖 자동화 (GitHub 연동)

### GitHub 트리거 설정

```bash
# 트리거 생성
gcloud builds triggers create github \
  --name="stock-app-build" \
  --repo-name=stock \
  --repo-owner=YOUR-GITHUB-USERNAME \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml \
  --substitutions=_REGION=us-central1,_REPOSITORY=stock-app
```

**이후**:
1. `git push origin main` → 자동 빌드 시작
2. VM에서 `./deploy.sh`만 실행

---

## 💰 비용

**무료 tier**:
- Cloud Build: 하루 120분 (한 달 3,600분)
- Artifact Registry: 0.5GB 스토리지

**예상 사용량**:
- 빌드 1회: 1-2분
- 이미지 크기: ~500MB (Frontend + Backend)
- 한 달 빌드 횟수: 30회 → 30-60분
- **비용: $0** ✅

---

## 🛠️ 문제 해결

### 빌드 실패

```bash
# 로그 확인
gcloud builds log $(gcloud builds list --limit=1 --format="value(id)")

# 일반적인 오류
# - Permission denied → IAM 권한 재설정
# - Repository not found → Artifact Registry 생성 확인
# - Timeout → cloudbuild.yaml에서 timeout 증가
```

### 배포 실패

```bash
# 인증 재설정
gcloud auth configure-docker us-central1-docker.pkg.dev

# 수동 pull 테스트
docker pull us-central1-docker.pkg.dev/YOUR-PROJECT-ID/stock-app/stock-frontend:latest

# 로그 확인
docker compose -f docker-compose.prod.yml logs backend
```

---

## 📚 추가 문서

- **상세 가이드**: [docs/GCP_CLOUD_BUILD_SETUP.md](docs/GCP_CLOUD_BUILD_SETUP.md)
- **Cloud Build 설정**: [cloudbuild.yaml](cloudbuild.yaml)
- **배포 스크립트**: [deploy.sh](deploy.sh)

---

**최종 업데이트**: 2026-02-11
