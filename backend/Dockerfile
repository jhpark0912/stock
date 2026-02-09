# Backend Dockerfile
FROM python:3.11-slim

# 작업 디렉토리 설정
WORKDIR /app

# 시스템 패키지 업데이트 및 필수 패키지 설치
RUN apt-get update && apt-get install -y \
    gcc \
    curl \
    && rm -rf /var/lib/apt/lists/*

# requirements.txt 복사 및 의존성 설치
COPY requirements.txt .
# BuildKit 캐시 마운트로 pip 패키지 다운로드 재사용 (빌드 속도 향상)
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt

# 애플리케이션 코드 복사
COPY . .

# 포트 노출
EXPOSE 8000

# 환경 변수 설정
ENV PYTHONUNBUFFERED=1 \
    HOST=0.0.0.0 \
    PORT=8000

# Uvicorn으로 FastAPI 실행
# --timeout-keep-alive: 연결 유지 타임아웃 (초) - 길게 설정
# --timeout-graceful-shutdown: 우아한 종료 타임아웃 (초) - 길게 설정
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--timeout-keep-alive", "300", "--timeout-graceful-shutdown", "60"]
