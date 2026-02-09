"""
환경 변수 및 애플리케이션 설정

보안 계층:
- 🔴 높은 보안 (Secret Manager): GEMINI, KIS, JWT, ENCRYPTION, ADMIN_PASSWORD
- 🟢 낮은 보안 (.env): FRED, ECOS (무료 API)
"""
import os
import logging
from typing import List
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

logger = logging.getLogger(__name__)


class Settings:
    """애플리케이션 설정"""

    def __init__(self):
        # GCP Secret Manager 사용 여부
        self.use_secret_manager = os.getenv("USE_SECRET_MANAGER", "false").lower() == "true"

        if self.use_secret_manager:
            logger.info("🔐 Secret Manager 활성화")
            from app.utils.secret_manager import get_secret

            # 🔴 높은 보안: Secret Manager 사용
            self.gemini_api_key = get_secret("gemini-api-key", "GEMINI_API_KEY")
            self.kis_app_key = get_secret("kis-app-key", "KIS_APP_KEY")
            self.kis_app_secret = get_secret("kis-app-secret", "KIS_APP_SECRET")
            self.jwt_secret_key = get_secret("jwt-secret-key", "JWT_SECRET_KEY")
            self.encryption_key = get_secret("encryption-key", "ENCRYPTION_KEY")
            self.admin_password = get_secret("admin-password", "ADMIN_PASSWORD")
        else:
            logger.info("🔧 Secret Manager 비활성화 (.env 사용)")
            # Fallback: .env 파일 사용
            self.gemini_api_key = os.getenv("GEMINI_API_KEY", "")
            self.kis_app_key = os.getenv("KIS_APP_KEY", "")
            self.kis_app_secret = os.getenv("KIS_APP_SECRET", "")
            self.jwt_secret_key = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
            self.encryption_key = os.getenv("ENCRYPTION_KEY", "")
            self.admin_password = os.getenv("ADMIN_PASSWORD", "admin123")

        # 🟢 낮은 보안: .env 계속 사용 (무료 API, 탈취 영향 적음)
        self.fred_api_key = os.getenv("FRED_API_KEY", "")
        self.ecos_api_key = os.getenv("ECOS_API_KEY", "")

        # Environment
        self.environment = os.getenv("ENVIRONMENT", "development")

        # CORS
        self.allowed_origins = os.getenv(
            "ALLOWED_ORIGINS",
            "http://localhost:8080,http://localhost:5173,http://localhost:3000"
        )

        # Server
        self.host = os.getenv("HOST", "0.0.0.0")
        self.port = int(os.getenv("PORT", "8000"))

        # Mock Data (429 에러 회피용)
        self.use_mock_data = os.getenv("USE_MOCK_DATA", "false").lower() == "true"

        # JWT 설정
        self.jwt_algorithm = os.getenv("JWT_ALGORITHM", "HS256")
        self.jwt_access_token_expire_minutes = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

        # Admin 기본 계정
        self.admin_username = os.getenv("ADMIN_USERNAME", "admin")

        # 로그 레벨 설정 (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        self.log_level = os.getenv("LOG_LEVEL", "INFO").upper()

    @property
    def is_development(self) -> bool:
        """개발 환경 여부"""
        return self.environment == "development"

    @property
    def cors_origins(self) -> List[str]:
        """CORS 허용 오리진 목록"""
        return [origin.strip() for origin in self.allowed_origins.split(",")]


# 전역 설정 인스턴스
settings = Settings()
