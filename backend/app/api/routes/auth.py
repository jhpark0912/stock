"""
인증 API 라우터 (회원가입, 로그인)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database.user_repository import UserRepository
from app.services.auth_service import AuthService, get_current_user
from app.models.user import (
    UserCreate, UserLogin, Token, UserResponse,
    GeminiKeyUpdate, GeminiKeyStatus,
    KISCredentialsUpdate, KISCredentialsStatus
)
from app.database.models import UserDB

router = APIRouter(prefix="/auth", tags=["인증"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    회원가입 신청
    - 승인 대기 상태로 생성됨
    - Admin 승인 후 로그인 가능
    """
    user_repo = UserRepository(db)

    # username 중복 체크
    if user_repo.exists(user_data.username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="이미 사용 중인 사용자명입니다"
        )

    # 비밀번호 해싱
    password_hash = AuthService.hash_password(user_data.password)

    # 사용자 생성 (is_approved=False)
    user_repo.create(
        username=user_data.username,
        password_hash=password_hash,
        role="user",
        is_approved=False
    )

    return {"message": "회원가입 신청이 완료되었습니다. 관리자 승인 후 로그인이 가능합니다."}


@router.post("/login", response_model=Token)
def login(login_data: UserLogin, db: Session = Depends(get_db)):
    """
    로그인
    - 승인된 사용자만 로그인 가능
    """
    user_repo = UserRepository(db)

    # 사용자 조회
    user = user_repo.get_by_username(login_data.username)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="사용자명 또는 비밀번호가 잘못되었습니다"
        )

    # 비밀번호 검증
    if not AuthService.verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="사용자명 또는 비밀번호가 잘못되었습니다"
        )

    # 활성화 상태 확인
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="비활성화된 사용자입니다"
        )

    # 승인 상태 확인
    if not user.is_approved:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="승인 대기 중입니다. 관리자 승인 후 로그인이 가능합니다."
        )

    # JWT 토큰 생성
    access_token = AuthService.create_access_token(
        data={
            "user_id": user.id,
            "username": user.username,
            "role": user.role
        }
    )

    return Token(access_token=access_token)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: UserDB = Depends(get_current_user)):
    """현재 로그인한 사용자 정보 조회"""
    return current_user


@router.put("/gemini-key", response_model=GeminiKeyStatus)
def update_gemini_key(
    key_data: GeminiKeyUpdate,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Gemini API 키 설정"""
    repo = UserRepository(db)
    repo.update_gemini_key(current_user.id, key_data.api_key)
    return GeminiKeyStatus(
        has_key=True,
        key_preview=f"{key_data.api_key[:4]}...{key_data.api_key[-4:]}"
    )


@router.delete("/gemini-key")
def delete_gemini_key(
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Gemini API 키 삭제"""
    repo = UserRepository(db)
    repo.delete_gemini_key(current_user.id)
    return {"message": "Gemini API 키가 삭제되었습니다."}


@router.get("/gemini-key/status", response_model=GeminiKeyStatus)
def get_gemini_key_status(
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Gemini API 키 상태 조회"""
    repo = UserRepository(db)
    key = repo.get_gemini_key(current_user.id)
    if key:
        return GeminiKeyStatus(has_key=True, key_preview=f"{key[:4]}...{key[-4:]}")
    return GeminiKeyStatus(has_key=False)



# ==================== 한국투자증권 API 인증정보 관리 ====================

@router.put("/kis-credentials", response_model=KISCredentialsStatus)
def update_kis_credentials(
    credentials: KISCredentialsUpdate,
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """한국투자증권 API 인증정보 설정"""
    repo = UserRepository(db)
    repo.update_kis_credentials(
        current_user.id,
        credentials.app_key,
        credentials.app_secret
    )
    return KISCredentialsStatus(
        has_credentials=True,
        app_key_preview=f"{credentials.app_key[:4]}...{credentials.app_key[-4:]}",
        app_secret_preview=f"{credentials.app_secret[:4]}...{credentials.app_secret[-4:]}"
    )


@router.delete("/kis-credentials")
def delete_kis_credentials(
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """한국투자증권 API 인증정보 삭제"""
    repo = UserRepository(db)
    repo.delete_kis_credentials(current_user.id)
    return {"message": "한국투자증권 API 인증정보가 삭제되었습니다."}


@router.get("/kis-credentials/status", response_model=KISCredentialsStatus)
def get_kis_credentials_status(
    current_user: UserDB = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """한국투자증권 API 인증정보 상태 조회"""
    repo = UserRepository(db)
    credentials = repo.get_kis_credentials(current_user.id)
    if credentials:
        app_key, app_secret = credentials
        return KISCredentialsStatus(
            has_credentials=True,
            app_key_preview=f"{app_key[:4]}...{app_key[-4:]}",
            app_secret_preview=f"{app_secret[:4]}...{app_secret[-4:]}"
        )
    return KISCredentialsStatus(has_credentials=False)
