"""
인증 서비스 (JWT, 비밀번호 해싱)
"""
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.config import settings
from app.database.connection import get_db
from app.database.user_repository import UserRepository
from app.database.models import UserDB
from app.models.user import TokenData

# 비밀번호 해싱 컨텍스트
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTP Bearer 토큰 스키마
security = HTTPBearer()


class AuthService:
    """인증 서비스"""

    @staticmethod
    def hash_password(password: str) -> str:
        """비밀번호 해싱"""
        return pwd_context.hash(password)

    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """비밀번호 검증"""
        return pwd_context.verify(plain_password, hashed_password)

    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        """JWT 액세스 토큰 생성"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.jwt_access_token_expire_minutes)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)
        return encoded_jwt

    @staticmethod
    def decode_token(token: str) -> TokenData:
        """JWT 토큰 디코딩 및 검증"""
        try:
            payload = jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])
            user_id: int = payload.get("user_id")
            username: str = payload.get("username")
            role: str = payload.get("role")
            if user_id is None or username is None or role is None:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="토큰이 유효하지 않습니다",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            return TokenData(user_id=user_id, username=username, role=role)
        except JWTError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="토큰이 유효하지 않습니다",
                headers={"WWW-Authenticate": "Bearer"},
            )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> UserDB:
    """현재 로그인한 사용자 조회 (의존성)"""
    token = credentials.credentials
    token_data = AuthService.decode_token(token)

    user_repo = UserRepository(db)
    user = user_repo.get_by_id(token_data.user_id)

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="사용자를 찾을 수 없습니다",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="비활성화된 사용자입니다"
        )

    if not user.is_approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="승인되지 않은 사용자입니다"
        )

    return user


def get_current_admin(current_user: UserDB = Depends(get_current_user)) -> UserDB:
    """현재 로그인한 Admin 사용자 조회 (의존성)"""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="관리자 권한이 필요합니다"
        )
    return current_user


# Optional 보안 스키마 (토큰 없어도 OK)
optional_security = HTTPBearer(auto_error=False)


def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(optional_security),
    db: Session = Depends(get_db)
) -> Optional[UserDB]:
    """현재 로그인한 사용자 조회 (선택적 인증)
    
    토큰이 없거나 유효하지 않으면 None 반환.
    토큰이 유효하면 사용자 정보 반환.
    """
    if credentials is None:
        return None
    
    try:
        token = credentials.credentials
        token_data = AuthService.decode_token(token)
        
        user_repo = UserRepository(db)
        user = user_repo.get_by_id(token_data.user_id)
        
        if user is None or not user.is_active or not user.is_approved:
            return None
        
        return user
    except HTTPException:
        return None
