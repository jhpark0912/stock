# GCP Cloud Build 설정 가이드

> **목적**: GCP Free Tier VM에서 Docker 빌드 부담을 제거하고 Cloud Build로 고속 빌드

## 📋 목차

1. [아키텍처](#아키텍처)
2. [GCP 설정](#gcp-설정)
3. [로컬 설정](#로컬-설정)
4. [빌드 및 배포](#빌드-및-배포)
5. [자동화 (GitHub 연동)](#자동화-github-연동)
6. [문제 해결](#문제-해결)

---

## 🏗️ 아키텍처

```
개발자 로컬/GitHub
    ↓
GCP Cloud Build (빌드)
    - E2_HIGHCPU_8 머신 (8 vCPU)
    - 병렬 빌드 (Frontend + Backend)
    - 빌드 캐시 활용
    ↓
Artifact Registry (이미지 저장)
    - stock-frontend:latest, :$SHORT_SHA
    - stock-backend:latest, :$SHORT_SHA
    ↓
GCP VM (배포)
    - 이미지 pull만 수행
    - CPU/메모리 부담 없음
    - docker-compose.prod.yml 사용
```

---

## ⚙️ GCP 설정

### 1. GCP 프로젝트 정보 확인

```bash
# 현재 프로젝트 ID 확인
gcloud config get-value project

# 없으면 새 프로젝트 생성
gcloud projects create stock-app-20260211 --name="Stock App"
gcloud config set project stock-app-20260211
```

### 2. API 활성화

```bash
# Cloud Build API
gcloud services enable cloudbuild.googleapis.com

# Artifact Registry API
gcloud services enable artifactregistry.googleapis.com

# 활성화 확인
gcloud services list --enabled | grep -E "(cloudbuild|artifactregistry)"
```

### 3. Artifact Registry 생성

```bash
# 서울 리전에 Docker 저장소 생성
gcloud artifacts repositories create stock-app \
  --repository-format=docker \
  --location=us-central1 \
  --description="Stock App Docker Images"

# 생성 확인
gcloud artifacts repositories list --location=us-central1
```

### 4. 서비스 계정 권한 설정

Cloud Build는 기본 서비스 계정(`PROJECT_NUMBER@cloudbuild.gserviceaccount.com`)을 사용합니다.

```bash
# 프로젝트 번호 확인
gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)"

# 서비스 계정에 Artifact Registry 권한 부여
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")
gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"
```

---

## 💻 로컬 설정

### 1. gcloud CLI 설치

**Windows**:
```powershell
# Chocolatey 사용 (권장)
choco install gcloudsdk

# 또는 설치 파일 다운로드
# https://cloud.google.com/sdk/docs/install
```

**macOS**:
```bash
# Homebrew 사용
brew install --cask google-cloud-sdk
```

**Linux**:
```bash
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

### 2. gcloud 인증

```bash
# Google 계정 로그인
gcloud auth login

# 프로젝트 설정
gcloud config set project YOUR-PROJECT-ID

# 기본 리전 설정
gcloud config set compute/region us-central1
gcloud config set compute/zone us-central1-c
```

### 3. Docker 인증 설정 (로컬에서 pull 필요 시)

```bash
# Artifact Registry 인증
gcloud auth configure-docker us-central1-docker.pkg.dev
```

---

## 🚀 빌드 및 배포

### 방법 1: 로컬에서 수동 빌드

#### A. Cloud Build 수동 실행

```bash
# 프로젝트 루트에서 실행
cd C:\Exception\0.STUDY\stock

# Cloud Build 실행
gcloud builds submit \
  --config=cloudbuild.yaml \
  --substitutions=_REGION=us-central1,_REPOSITORY=stock-app
```

**예상 시간**:
- 최초 빌드: 3-5분
- 이후 빌드: 1-2분 (캐시 활용)

#### B. 빌드 상태 확인

```bash
# 최근 빌드 목록
gcloud builds list --limit=5

# 특정 빌드 상세 정보
gcloud builds describe BUILD_ID

# 빌드 로그 실시간 확인
gcloud builds log BUILD_ID --stream
```

#### C. 이미지 확인

```bash
# Artifact Registry 이미지 목록
gcloud artifacts docker images list us-central1-docker.pkg.dev/YOUR-PROJECT-ID/stock-app
```

### 방법 2: VM에서 배포

#### A. GCP VM 접속

```bash
# SSH 접속
gcloud compute ssh YOUR-VM-NAME --zone=us-central1-c
```

#### B. Docker 및 Docker Compose 설치

```bash
# Docker 설치
sudo apt-get update
sudo apt-get install -y docker.io docker-compose-plugin

# 현재 사용자를 docker 그룹에 추가
sudo usermod -aG docker $USER

# 재로그인 (또는 newgrp docker)
exit
gcloud compute ssh YOUR-VM-NAME --zone=us-central1-c
```

#### C. 프로젝트 클론

```bash
# Git 설치
sudo apt-get install -y git

# 프로젝트 클론
git clone https://github.com/YOUR-USERNAME/stock.git
cd stock
```

#### D. 환경 변수 설정

```bash
# .env.production.example을 .env로 복사
cp .env.production.example .env

# .env 편집
nano .env
```

**.env** 내용:
```bash
GCP_PROJECT_ID=your-gcp-project-id
REGION=us-central1
REPOSITORY=stock-app
SERVER_IP=YOUR-VM-EXTERNAL-IP
ENVIRONMENT=production
USE_SECRET_MANAGER=true
# FRED_API_KEY, ECOS_API_KEY는 선택
```

#### E. Artifact Registry 인증

```bash
# Docker 인증
gcloud auth configure-docker us-central1-docker.pkg.dev

# 또는 서비스 계정 키 사용 (프로덕션 권장)
# 1. GCP Console에서 서비스 계정 키 생성
# 2. JSON 파일을 VM에 업로드
# 3. 인증
gcloud auth activate-service-account --key-file=/path/to/service-account-key.json
gcloud auth configure-docker us-central1-docker.pkg.dev
```

#### F. 배포 스크립트 실행

```bash
# 실행 권한 부여
chmod +x deploy.sh

# 배포 실행
./deploy.sh
```

**deploy.sh** 내용:
```bash
#!/bin/bash
set -e

echo "🚀 Stock App 배포 시작..."

# 환경 변수 로드
export $(cat .env | grep -v '^#' | xargs)

# 이미지 pull
echo "📥 이미지 다운로드 중..."
docker compose -f docker-compose.prod.yml pull

# 컨테이너 재시작
echo "🔄 컨테이너 재시작 중..."
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d

# 상태 확인
echo "✅ 배포 완료!"
docker compose -f docker-compose.prod.yml ps
```

#### G. 배포 확인

```bash
# 컨테이너 상태 확인
docker compose -f docker-compose.prod.yml ps

# 로그 확인
docker compose -f docker-compose.prod.yml logs -f

# 헬스체크
curl http://localhost:8000/api/health
```

---

## 🤖 자동화 (GitHub 연동)

### 1. GitHub 저장소 연결

#### A. Cloud Build와 GitHub 연동

```bash
# GitHub 연결 (웹 UI에서 진행)
# https://console.cloud.google.com/cloud-build/triggers
# 1. "트리거 만들기" 클릭
# 2. "GitHub (Cloud Build GitHub 앱)" 선택
# 3. 저장소 선택 및 인증
```

#### B. 트리거 생성 (CLI)

```bash
gcloud builds triggers create github \
  --name="stock-app-build" \
  --repo-name=stock \
  --repo-owner=YOUR-GITHUB-USERNAME \
  --branch-pattern="^main$" \
  --build-config=cloudbuild.yaml \
  --substitutions=_REGION=us-central1,_REPOSITORY=stock-app
```

### 2. 트리거 테스트

```bash
# Git push로 자동 빌드 테스트
git add .
git commit -m "Test Cloud Build"
git push origin main

# 빌드 상태 확인
gcloud builds list --limit=1
```

### 3. VM 자동 배포 (선택)

Cloud Build에서 VM에 SSH로 접속하여 자동 배포하려면 추가 설정이 필요합니다.

#### A. cloudbuild.yaml에 배포 단계 추가

```yaml
# cloudbuild.yaml 끝에 추가
steps:
  # ... (기존 빌드 단계)

  # VM 배포 (선택)
  - name: 'gcr.io/cloud-builders/gcloud'
    id: 'deploy-to-vm'
    args:
      - 'compute'
      - 'ssh'
      - 'YOUR-VM-NAME'
      - '--zone=us-central1-c'
      - '--command=cd /home/YOUR-USER/stock && ./deploy.sh'
    waitFor: ['push-frontend', 'push-backend']
```

#### B. Cloud Build 서비스 계정에 VM 접근 권한 부여

```bash
PROJECT_NUMBER=$(gcloud projects describe $(gcloud config get-value project) --format="value(projectNumber)")
gcloud projects add-iam-policy-binding $(gcloud config get-value project) \
  --member="serviceAccount:${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com" \
  --role="roles/compute.instanceAdmin.v1"
```

---

## 🛠️ 문제 해결

### 1. 빌드 실패 시

#### A. 로그 확인

```bash
# 최근 빌드 ID 확인
gcloud builds list --limit=1 --format="value(id)"

# 로그 확인
gcloud builds log BUILD_ID
```

#### B. 일반적인 오류

| 오류 | 원인 | 해결 |
|------|------|------|
| `Permission denied` | 서비스 계정 권한 부족 | IAM 권한 재설정 |
| `Repository not found` | Artifact Registry 없음 | `gcloud artifacts repositories create` 실행 |
| `Timeout` | 빌드 시간 초과 | `cloudbuild.yaml`에서 `timeout` 증가 |
| `Cache error` | 빌드 캐시 문제 | `--no-cache` 플래그 추가 |

### 2. VM 배포 실패 시

#### A. 이미지 pull 실패

```bash
# 인증 확인
gcloud auth list

# 재인증
gcloud auth configure-docker us-central1-docker.pkg.dev

# 수동 pull 테스트
docker pull us-central1-docker.pkg.dev/YOUR-PROJECT-ID/stock-app/stock-frontend:latest
```

#### B. 컨테이너 시작 실패

```bash
# 로그 확인
docker compose -f docker-compose.prod.yml logs backend
docker compose -f docker-compose.prod.yml logs frontend

# 환경 변수 확인
docker compose -f docker-compose.prod.yml config
```

### 3. 비용 확인

```bash
# Cloud Build 사용량 확인
gcloud builds list --limit=10 --format="table(createTime,duration,status)"

# Artifact Registry 스토리지 사용량
gcloud artifacts docker images list us-central1-docker.pkg.dev/YOUR-PROJECT-ID/stock-app \
  --format="table(image,createTime,updateTime)"
```

**무료 tier 한도**:
- Cloud Build: 하루 120분 빌드 시간
- Artifact Registry: 0.5GB 스토리지

---

## 📊 성능 비교

| 방법 | 빌드 시간 | CPU 사용 | 메모리 사용 | 비용 |
|------|----------|----------|------------|------|
| **VM에서 빌드** | 15-20분 | 100% (먹통) | 1GB+ | $0 |
| **Cloud Build** | 1-2분 (캐시 시) | 0% (VM 무관) | 0 (VM 무관) | $0 (무료 tier) |

**개선 효과**:
- ⚡ 빌드 속도: **10배 향상**
- 💻 VM 부담: **100% → 0%**
- 📦 배포 속도: **즉시** (이미지 pull만)

---

## 📝 유용한 명령어

### Cloud Build

```bash
# 최근 빌드 목록
gcloud builds list --limit=10

# 빌드 상세 정보
gcloud builds describe BUILD_ID

# 빌드 로그 실시간
gcloud builds log BUILD_ID --stream

# 빌드 취소
gcloud builds cancel BUILD_ID
```

### Artifact Registry

```bash
# 이미지 목록
gcloud artifacts docker images list us-central1-docker.pkg.dev/YOUR-PROJECT-ID/stock-app

# 이미지 삭제
gcloud artifacts docker images delete us-central1-docker.pkg.dev/YOUR-PROJECT-ID/stock-app/stock-frontend:TAG

# 오래된 이미지 정리 (latest 태그 제외)
gcloud artifacts docker images list us-central1-docker.pkg.dev/YOUR-PROJECT-ID/stock-app \
  --format="value(image)" | grep -v latest | xargs -I {} gcloud artifacts docker images delete {} --quiet
```

### VM 배포

```bash
# 최신 이미지로 업데이트
./deploy.sh

# 로그 확인
docker compose -f docker-compose.prod.yml logs -f

# 컨테이너 재시작
docker compose -f docker-compose.prod.yml restart

# 완전 재배포
docker compose -f docker-compose.prod.yml down
./deploy.sh
```

---

## ✅ 체크리스트

### 초기 설정

- [ ] GCP 프로젝트 생성
- [ ] Cloud Build API 활성화
- [ ] Artifact Registry API 활성화
- [ ] Artifact Registry 저장소 생성
- [ ] 서비스 계정 권한 설정
- [ ] gcloud CLI 설치 및 인증

### 빌드

- [ ] `cloudbuild.yaml` 작성
- [ ] 로컬에서 수동 빌드 테스트
- [ ] Artifact Registry에 이미지 확인
- [ ] (선택) GitHub 트리거 설정

### 배포

- [ ] VM에 Docker 설치
- [ ] `.env` 환경 변수 설정
- [ ] Artifact Registry 인증
- [ ] `deploy.sh` 스크립트 작성
- [ ] 배포 테스트
- [ ] 헬스체크 확인

---

**최종 업데이트**: 2026-02-11
**문서 버전**: 1.0
