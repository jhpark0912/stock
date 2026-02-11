# Frontend Dockerfile - Multi-stage build
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# package.json과 package-lock.json 복사
COPY package*.json ./

# Husky 스킵 (Docker 빌드 시)
ENV HUSKY=0

# 의존성 설치 (BuildKit 캐시 마운트로 npm 패키지 다운로드 재사용)
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# 소스 코드 복사
COPY . .

# 디버깅: 파일 구조 확인
RUN echo "=== Checking directory structure ===" && \
    ls -la src/lib/ && \
    echo "=== vite.config.ts ===" && \
    cat vite.config.ts

# 환경 변수 설정 (빌드 시점)
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL

# 프로덕션 빌드
RUN npm run build

# Stage 2: Production with Nginx
FROM nginx:alpine

# Nginx 설정 파일 복사
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 빌드된 파일을 Nginx HTML 디렉토리로 복사
COPY --from=builder /app/dist /usr/share/nginx/html

# 포트 노출
EXPOSE 80

# Nginx 실행
CMD ["nginx", "-g", "daemon off;"]
