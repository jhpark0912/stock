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
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    """JWT 토큰 응답 스키마"""
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    """JWT 토큰 페이로드 스키마"""
    user_id: int
    username: str
    role: str
