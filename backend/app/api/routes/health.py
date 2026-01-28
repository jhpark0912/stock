"""
헬스 체크 엔드포인트
"""
from fastapi import APIRouter
from datetime import datetime
from typing import Dict

router = APIRouter()


@router.get("/health")
async def health_check() -> Dict[str, str]:
    """
    API 서버 상태 확인

    Returns:
        서버 상태 정보
    """
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat()
    }
