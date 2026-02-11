# GCP Cloud Build 설정 (US Central 리전)

> **리전**: us-central1 (Iowa, USA)
> **Zone**: us-central1-c
> **Artifact Registry**: us-central1-docker.pkg.dev

---

## 🌎 리전 정보

```
Region: us-central1
Zone:   us-central1-c
Location: Iowa, USA
```

**참고**: Artifact Registry는 **Region** 레벨 리소스입니다 (zone이 아님).

---

## 🚀 빠른 시작 (5분)

### 1️⃣ GCP 초기 설정 (2분)

```bash
# 1. 프로젝트 설정
gcloud config set project YOUR-PROJECT-ID

# 2. 리전 및 Zone 설정
gcloud config set compute/region us-central1
gcloud config set compute/zone us-central1-c

# 3. API 활성화
gcloud services enable cloudbuild.googleapis.com artifactregistry.googleapis.com

# 4. Artifact Registry 생성
gcloud artifacts repositories create stock-app \
  --repository-format=docker \
  --location=us-central1 \
  --description="Stock App Docker Images"

# 5. 서비스 계정 권한 부여
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
nano .env
```

#### C. 환경 변수 (.env) 설정

```bash
# GCP 프로젝트 설정
GCP_PROJECT_ID=your-gcp-project-id
REGION=us-central1
REPOSITORY=stock-app

# 서버 설정
SERVER_IP=YOUR-VM-EXTERNAL-IP
ENVIRONMENT=production
USE_SECRET_MANAGER=true
```

#### D. Docker 인증 (최초 1회)

```bash
# Artifact Registry 인증
gcloud auth configure-docker us-central1-docker.pkg.dev
```

#### E. 배포

```bash
# 실행 권한 부여 (최초 1회)
chmod +x deploy.sh

# 배포 실행 (매번)
./deploy.sh
```

---

## 📊 이미지 확인

### Artifact Registry 이미지 목록

```bash
# 이미지 목록
gcloud artifacts docker images list us-central1-docker.pkg.dev/YOUR-PROJECT-ID/stock-app

# 이미지 상세 정보
gcloud artifacts docker images describe \
  us-central1-docker.pkg.dev/YOUR-PROJECT-ID/stock-app/stock-frontend:latest
```

### Docker에서 이미지 확인

```bash
# VM에서 실행
docker images | grep us-central1-docker.pkg.dev
```

---

## 🔄 배포 워크플로우

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
gcloud compute ssh YOUR-VM-NAME --zone=us-central1-c
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

## 🛠️ 문제 해결

### 빌드 실패

```bash
# 로그 확인
gcloud builds log $(gcloud builds list --limit=1 --format="value(id)")

# Artifact Registry 확인
gcloud artifacts repositories list --location=us-central1

# 서비스 계정 권한 확인
gcloud projects get-iam-policy $(gcloud config get-value project) \
  --flatten="bindings[].members" \
  --filter="bindings.members:*@cloudbuild.gserviceaccount.com"
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

### VM 인스턴스 생성 (참고)

```bash
# us-central1-c zone에 VM 생성
gcloud compute instances create stock-app-vm \
  --zone=us-central1-c \
  --machine-type=e2-micro \
  --boot-disk-size=30GB \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --tags=http-server,https-server

# 방화벽 규칙 생성
gcloud compute firewall-rules create allow-http \
  --allow=tcp:80 \
  --target-tags=http-server

gcloud compute firewall-rules create allow-https \
  --allow=tcp:443 \
  --target-tags=https-server
```

---

## 📍 리전별 차이점

| 항목 | US Central (us-central1) | Asia Northeast (asia-northeast3) |
|------|--------------------------|----------------------------------|
| **위치** | Iowa, USA | Seoul, South Korea |
| **레이턴시** | 미국 동부/서부: 낮음 | 한국/일본: 낮음 |
| **비용** | 낮음 | 약간 높음 |
| **가용성** | 높음 (3개 zone) | 높음 (3개 zone) |
| **Artifact Registry** | `us-central1-docker.pkg.dev` | `asia-northeast3-docker.pkg.dev` |

**선택 기준**:
- **미국 기반 서비스**: us-central1 권장
- **한국/일본 기반 서비스**: asia-northeast3 권장

---

## 💰 비용 (동일)

**무료 tier**:
- Cloud Build: 하루 120분
- Artifact Registry: 0.5GB 스토리지

**예상 사용량**:
- 빌드 1회: 1-2분
- 한 달 30회: 30-60분
- **월 비용: $0** ✅

---

## ✅ 체크리스트

### 초기 설정

- [ ] 리전 설정: `gcloud config set compute/region us-central1`
- [ ] Zone 설정: `gcloud config set compute/zone us-central1-c`
- [ ] API 활성화 (Cloud Build, Artifact Registry)
- [ ] Artifact Registry 생성 (location=us-central1)
- [ ] 서비스 계정 권한 부여

### 빌드

- [ ] `cloudbuild.yaml` 확인 (_REGION=us-central1)
- [ ] 로컬에서 수동 빌드 테스트
- [ ] Artifact Registry에 이미지 확인

### 배포

- [ ] VM Zone 확인 (us-central1-c)
- [ ] `.env` 설정 (REGION=us-central1)
- [ ] Docker 인증 (us-central1-docker.pkg.dev)
- [ ] 배포 실행 (`./deploy.sh`)
- [ ] 서비스 확인

---

## 📚 참고 문서

- **빠른 시작**: [QUICKSTART_GCP_BUILD.md](QUICKSTART_GCP_BUILD.md)
- **상세 가이드**: [docs/GCP_CLOUD_BUILD_SETUP.md](docs/GCP_CLOUD_BUILD_SETUP.md)
- **환경 변수**: [ENV_GUIDE.md](ENV_GUIDE.md)

---

**최종 업데이트**: 2026-02-11
**리전**: us-central1 (Iowa, USA)
**Zone**: us-central1-c
