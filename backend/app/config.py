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
