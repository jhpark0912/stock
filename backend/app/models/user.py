"""
사용자 관련 Pydantic 스키마
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    """회원가입 요청 스키마"""
    username: str = Field(..., min_length=3, max_length=50, description="사용자명")
    password: str = Field(..., min_length=6, description="비밀번호")


class UserLogin(BaseModel):
    """로그인 요청 스키마"""
    username: str = Field(..., description="사용자명")
    password: str = Field(..., description="비밀번호")


class UserResponse(BaseModel):
    """사용자 응답 스키마"""
    id: int
    username: str
    role: str
    is_active: bool
    is_approved: bool
    has_gemini_key: bool = False  # Gemini API 키 보유 여부
    has_kis_credentials: bool = False  # 한국투자증권 API 인증정보 보유 여부
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class GeminiKeyUpdate(BaseModel):
    """Gemini API 키 업데이트 요청 스키마"""
    api_key: str = Field(..., min_length=10, description="Gemini API 키")


class GeminiKeyStatus(BaseModel):
    """Gemini API 키 상태 응답 스키마"""
    has_key: bool
    key_preview: Optional[str] = None  # 마스킹된 키 미리보기 (예: AIza...xyz)


class KISCredentialsUpdate(BaseModel):
    """한국투자증권 API 인증정보 업데이트 요청 스키마"""
    app_key: str = Field(..., min_length=10, description="한국투자증권 App Key")
    app_secret: str = Field(..., min_length=10, description="한국투자증권 App Secret")


class KISCredentialsStatus(BaseModel):
    """한국투자증권 API 인증정보 상태 응답 스키마"""
    has_credentials: bool
    app_key_preview: Optional[str] = None  # 마스킹된 App Key (예: PS0n...xyz)
    app_secret_preview: Optional[str] = None  # 마스킹된 App Secret (예: 1a2b...xyz)


class Token(BaseModel):
    """JWT 토큰 응답 스키마"""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """JWT 토큰 페이로드 스키마"""
    user_id: int
    username: str
    role: str
