"""
헬스 체크 엔드포인트
"""
from fastapi import APIRouter, HTTPException
from datetime import datetime
from typing import Dict
import google.generativeai as genai
from app.config import settings
import asyncio
import logging

router = APIRouter()
logger = logging.getLogger(__name__)


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


@router.get("/health/gemini")
async def gemini_health_check() -> Dict:
    """
    Gemini API 연결 테스트
    
    Returns:
        Gemini API 상태 정보
    """
    if not settings.gemini_api_key:
        return {
            "status": "error",
            "message": "Gemini API 키가 설정되지 않았습니다.",
            "timestamp": datetime.now().isoformat()
        }
    
    try:
        logger.debug("[Health] Gemini 테스트 시작")
        
        # Gemini 초기화
        genai.configure(api_key=settings.gemini_api_key)
        model = genai.GenerativeModel('models/gemini-flash-latest')
        
        # 간단한 테스트 프롬프트
        def _test():
            logger.debug("[Health] Gemini API 호출 중...")
            result = model.generate_content("Say 'Hello' in Korean")
            logger.debug("[Health] Gemini API 응답 받음")
            return result
        
        # 타임아웃 10초
        response = await asyncio.wait_for(
            asyncio.to_thread(_test),
            timeout=10.0
        )
        
        logger.debug("[Health] Gemini 테스트 성공")
        return {
            "status": "ok",
            "message": "Gemini API 연결 성공",
            "response_sample": response.text[:100] if response.text else "",
            "timestamp": datetime.now().isoformat()
        }
        
    except asyncio.TimeoutError:
        logger.error("[Health] Gemini 타임아웃")
        return {
            "status": "error",
            "message": "Gemini API 타임아웃 (10초 초과)",
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"[Health] Gemini 테스트 실패: {type(e).__name__}: {str(e)}")
        return {
            "status": "error",
            "message": f"Gemini API 오류: {str(e)}",
            "error_type": type(e).__name__,
            "timestamp": datetime.now().isoformat()
        }
