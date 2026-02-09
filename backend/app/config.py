"""
환경 변수 및 애플리케이션 설정
"""
import os
from typing import List
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()


class Settings:
    """애플리케이션 설정"""

    def __init__(self):
        # Gemini API
        self.gemini_api_key = os.getenv("GEMINI_API_KEY", "")
        
        # FRED API (경제 지표용)
        self.fred_api_key = os.getenv("FRED_API_KEY", "")
        
        # ECOS API (한국은행 경제통계시스템)
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
        self.jwt_secret_key = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
        self.jwt_algorithm = os.getenv("JWT_ALGORITHM", "HS256")
        self.jwt_access_token_expire_minutes = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

        # Admin 기본 계정
        self.admin_username = os.getenv("ADMIN_USERNAME", "admin")
        self.admin_password = os.getenv("ADMIN_PASSWORD", "admin123")

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
