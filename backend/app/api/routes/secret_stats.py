"""
Secret Manager 캐시 통계 API

캐시 성능 모니터링용 엔드포인트
"""
import logging
from fastapi import APIRouter, HTTPException
from app.config import settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/secret-stats", tags=["Secret Manager"])


@router.get("/cache-stats")
async def get_cache_stats():
    """
    Secret Manager 캐시 통계 조회

    Returns:
        - hits: 캐시 히트 횟수
        - misses: 캐시 미스 횟수
        - hit_rate: 캐시 히트율 (%)
        - api_calls: Secret Manager API 호출 횟수
        - cached_secrets: 현재 캐시된 시크릿 수
    """
    if not settings.use_secret_manager:
        raise HTTPException(
            status_code=400,
            detail="Secret Manager가 비활성화되어 있습니다 (USE_SECRET_MANAGER=false)"
        )

    try:
        from app.utils.secret_manager import get_cache_stats

        stats = get_cache_stats()
        return {
            "success": True,
            "data": stats,
            "message": "캐시 통계 조회 성공"
        }

    except Exception as e:
        logger.error(f"캐시 통계 조회 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/clear-cache")
async def clear_cache():
    """
    Secret Manager 캐시 초기화

    주의: 캐시 초기화 후 다음 요청 시 Secret Manager API를 다시 호출합니다.
    """
    if not settings.use_secret_manager:
        raise HTTPException(
            status_code=400,
            detail="Secret Manager가 비활성화되어 있습니다 (USE_SECRET_MANAGER=false)"
        )

    try:
        from app.utils.secret_manager import clear_cache

        clear_cache()
        logger.info("캐시 초기화 완료")

        return {
            "success": True,
            "message": "캐시 초기화 완료"
        }

    except Exception as e:
        logger.error(f"캐시 초기화 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))
