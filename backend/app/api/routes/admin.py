"""
Admin API 라우터 (사용자 관리)
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database.user_repository import UserRepository
from app.services.auth_service import get_current_admin
from app.models.user import UserResponse
from app.database.models import UserDB

router = APIRouter(prefix="/admin", tags=["관리자"])


@router.get("/users", response_model=List[UserResponse])
def get_all_users(
    current_admin: UserDB = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """전체 사용자 목록 조회 (Admin 전용)"""
    user_repo = UserRepository(db)
    users = user_repo.get_all()
    return users


@router.get("/users/pending", response_model=List[UserResponse])
def get_pending_users(
    current_admin: UserDB = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """승인 대기 사용자 목록 조회 (Admin 전용)"""
    user_repo = UserRepository(db)
    users = user_repo.get_pending()
    return users


@router.put("/users/{user_id}/approve", response_model=UserResponse)
def approve_user(
    user_id: int,
    current_admin: UserDB = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """사용자 승인 (Admin 전용)"""
    user_repo = UserRepository(db)

    user = user_repo.approve(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="사용자를 찾을 수 없습니다"
        )

    return user


@router.put("/users/{user_id}/reject")
def reject_user(
    user_id: int,
    current_admin: UserDB = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """사용자 거부 (삭제) (Admin 전용)"""
    user_repo = UserRepository(db)

    # Admin 자신은 거부 불가
    if user_id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="자기 자신을 거부할 수 없습니다"
        )

    success = user_repo.reject(user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="사용자를 찾을 수 없거나 이미 승인된 사용자입니다"
        )

    return {"message": "사용자가 거부되었습니다"}


@router.put("/users/{user_id}/deactivate", response_model=UserResponse)
def deactivate_user(
    user_id: int,
    current_admin: UserDB = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """사용자 비활성화 (Admin 전용)"""
    user_repo = UserRepository(db)

    # Admin 자신은 비활성화 불가
    if user_id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="자기 자신을 비활성화할 수 없습니다"
        )

    user = user_repo.deactivate(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="사용자를 찾을 수 없습니다"
        )

    return user


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    current_admin: UserDB = Depends(get_current_admin),
    db: Session = Depends(get_db)
):
    """사용자 삭제 (Admin 전용)"""
    user_repo = UserRepository(db)

    # Admin 자신은 삭제 불가
    if user_id == current_admin.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="자기 자신을 삭제할 수 없습니다"
        )

    success = user_repo.delete(user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="사용자를 찾을 수 없습니다"
        )

    return {"message": "사용자가 삭제되었습니다"}
