"""
GCP Secret Manager 클라이언트 (캐싱 포함)

특징:
- 메모리 캐싱으로 API 호출 최소화
- TTL 기반 캐시 (기본 3600초 = 1시간)
- 컨테이너 시작 시 한 번만 로드
- 캐시 통계 추적
"""

import logging
import os
from datetime import datetime, timedelta
from typing import Dict, Optional

from google.api_core import exceptions
from google.cloud import secretmanager

logger = logging.getLogger(__name__)


class SecretCache:
    """시크릿 캐시 관리"""

    def __init__(self, ttl_seconds: int = 3600):
        self.cache: Dict[str, tuple[str, datetime]] = {}
        self.ttl_seconds = ttl_seconds
        self.stats = {"hits": 0, "misses": 0, "api_calls": 0}

    def get(self, key: str) -> Optional[str]:
        """캐시에서 값 가져오기"""
        if key not in self.cache:
            self.stats["misses"] += 1
            return None

        value, expire_time = self.cache[key]

        # TTL 체크
        if datetime.now() > expire_time:
            logger.debug(f"캐시 만료: {key}")
            del self.cache[key]
            self.stats["misses"] += 1
            return None

        self.stats["hits"] += 1
        logger.debug(f"캐시 히트: {key}")
        return value

    def set(self, key: str, value: str):
        """캐시에 값 저장"""
        expire_time = datetime.now() + timedelta(seconds=self.ttl_seconds)
        self.cache[key] = (value, expire_time)
        logger.debug(f"캐시 저장: {key} (만료: {expire_time})")

    def clear(self):
        """캐시 초기화"""
        self.cache.clear()
        logger.info("캐시 초기화 완료")

    def get_stats(self) -> dict:
        """캐시 통계"""
        total = self.stats["hits"] + self.stats["misses"]
        hit_rate = (self.stats["hits"] / total * 100) if total > 0 else 0

        return {
            "hits": self.stats["hits"],
            "misses": self.stats["misses"],
            "hit_rate": f"{hit_rate:.2f}%",
            "api_calls": self.stats["api_calls"],
            "cached_secrets": len(self.cache),
        }


class SecretManagerClient:
    """GCP Secret Manager 클라이언트 (싱글톤 패턴)"""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self.project_id = os.getenv("GCP_PROJECT_ID")
        self.use_secret_manager = os.getenv("USE_SECRET_MANAGER", "false").lower() == "true"
        self.client: Optional[secretmanager.SecretManagerServiceClient] = None
        self.cache = SecretCache(ttl_seconds=3600)  # 1시간 캐시

        if self.use_secret_manager:
            self._init_client()
        else:
            logger.info("🔧 Secret Manager 비활성화 (.env 사용)")

        self._initialized = True

    def _init_client(self):
        """Secret Manager 클라이언트 초기화"""
        try:
            if not self.project_id:
                raise ValueError("GCP_PROJECT_ID 환경 변수가 설정되지 않았습니다")

            # GCP 인증 (Docker 환경: GOOGLE_APPLICATION_CREDENTIALS 자동 인식)
            self.client = secretmanager.SecretManagerServiceClient()
            logger.info(f"✅ Secret Manager 초기화 완료 (Project: {self.project_id})")

        except Exception as e:
            logger.error(f"❌ Secret Manager 초기화 실패: {e}")
            logger.warning("⚠️  Fallback: .env 파일 사용")
            self.use_secret_manager = False

    def get_secret(self, secret_id: str, fallback_env_var: Optional[str] = None) -> str:
        """
        시크릿 가져오기 (캐싱 적용)

        Args:
            secret_id: 환경 변수 이름 (예: GEMINI_API_KEY)
            fallback_env_var: Secret Manager 실패 시 사용할 환경 변수명

        Returns:
            시크릿 값

        Note:
            환경 변수 이름을 자동으로 Secret Manager 형식으로 변환:
            GEMINI_API_KEY → gemini-api-key
        """
        # 환경 변수 이름 → Secret Manager 이름 변환
        # GEMINI_API_KEY → gemini-api-key
        sm_secret_id = secret_id.lower().replace("_", "-")
        # Secret Manager 비활성화 시 즉시 .env 사용
        if not self.use_secret_manager:
            return self._get_from_env(fallback_env_var or secret_id)

        # 1. 캐시 확인 (변환된 이름으로)
        cached_value = self.cache.get(sm_secret_id)
        if cached_value is not None:
            return cached_value

        # 2. Secret Manager 조회 (변환된 이름으로)
        try:
            value = self._fetch_from_secret_manager(sm_secret_id)

            # 3. 캐시 저장 (변환된 이름으로)
            self.cache.set(sm_secret_id, value)
            return value

        except Exception as e:
            logger.error(f"Secret Manager 조회 실패 ({sm_secret_id}): {e}")

            # Fallback: .env 사용
            if fallback_env_var:
                logger.warning(f"Fallback: {fallback_env_var} 환경 변수 사용")
                return self._get_from_env(fallback_env_var)

            raise

    def _fetch_from_secret_manager(self, secret_id: str) -> str:
        """
        Secret Manager에서 실제 값 조회 (API 호출)

        Args:
            secret_id: Secret Manager의 시크릿 ID (소문자-하이픈 형식, 예: gemini-api-key)
        """
        if not self.client:
            raise RuntimeError("Secret Manager 클라이언트가 초기화되지 않았습니다")

        name = f"projects/{self.project_id}/secrets/{secret_id}/versions/latest"

        try:
            logger.debug(f"🔍 Secret Manager API 호출: {secret_id}")
            response = self.client.access_secret_version(request={"name": name})
            self.cache.stats["api_calls"] += 1

            value = response.payload.data.decode("UTF-8")

            if not value or value == "PLACEHOLDER":
                raise ValueError(f"시크릿이 설정되지 않았습니다: {secret_id}")

            logger.debug(f"✅ Secret 조회 성공: {secret_id}")
            return value

        except exceptions.NotFound:
            raise ValueError(f"시크릿을 찾을 수 없습니다: {secret_id}")
        except exceptions.PermissionDenied:
            raise PermissionError(f"시크릿 접근 권한이 없습니다: {secret_id}")

    def _get_from_env(self, env_var: str) -> str:
        """환경 변수에서 값 가져오기"""
        value = os.getenv(env_var, "")
        if not value:
            logger.warning(f"⚠️  환경 변수 없음: {env_var}")
        return value

    def get_cache_stats(self) -> dict:
        """캐시 통계 반환"""
        return self.cache.get_stats()

    def clear_cache(self):
        """캐시 초기화"""
        self.cache.clear()


# 싱글톤 인스턴스 생성
_secret_client = SecretManagerClient()


def get_secret(secret_id: str, fallback_env_var: Optional[str] = None) -> str:
    """
    시크릿 가져오기 (편의 함수)

    Usage:
        api_key = get_secret("gemini-api-key", "GEMINI_API_KEY")
    """
    return _secret_client.get_secret(secret_id, fallback_env_var)


def get_cache_stats() -> dict:
    """캐시 통계 조회"""
    return _secret_client.get_cache_stats()


def clear_cache():
    """캐시 초기화"""
    _secret_client.clear_cache()
