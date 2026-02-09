"""
사용자 데이터베이스 Repository
"""
from typing import Optional, List
from sqlalchemy.orm import Session
from app.database.models import UserDB
from app.utils.crypto import encrypt_api_key, decrypt_api_key


class UserRepository:
    """사용자 CRUD Repository"""

    def __init__(self, db: Session):
        self.db = db

    def create(self, username: str, password_hash: str, role: str = "user", is_approved: bool = False) -> UserDB:
        """사용자 생성"""
        user = UserDB(
            username=username,
            password_hash=password_hash,
            role=role,
            is_approved=is_approved
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def get_by_username(self, username: str) -> Optional[UserDB]:
        """username으로 사용자 조회"""
        return self.db.query(UserDB).filter(UserDB.username == username).first()

    def get_by_id(self, user_id: int) -> Optional[UserDB]:
        """ID로 사용자 조회"""
        return self.db.query(UserDB).filter(UserDB.id == user_id).first()

    def get_all(self) -> List[UserDB]:
        """전체 사용자 목록 조회"""
        return self.db.query(UserDB).order_by(UserDB.created_at.desc()).all()

    def get_pending(self) -> List[UserDB]:
        """승인 대기 사용자 목록 조회"""
        return self.db.query(UserDB).filter(
            UserDB.is_approved == False,
            UserDB.is_active == True
        ).order_by(UserDB.created_at.desc()).all()

    def approve(self, user_id: int) -> Optional[UserDB]:
        """사용자 승인"""
        user = self.get_by_id(user_id)
        if user:
            user.is_approved = True
            self.db.commit()
            self.db.refresh(user)
        return user

    def reject(self, user_id: int) -> bool:
        """사용자 거부 (삭제)"""
        user = self.get_by_id(user_id)
        if user and not user.is_approved:
            self.db.delete(user)
            self.db.commit()
            return True
        return False

    def deactivate(self, user_id: int) -> Optional[UserDB]:
        """사용자 비활성화"""
        user = self.get_by_id(user_id)
        if user:
            user.is_active = False
            self.db.commit()
            self.db.refresh(user)
        return user

    def delete(self, user_id: int) -> bool:
        """사용자 삭제"""
        user = self.get_by_id(user_id)
        if user:
            self.db.delete(user)
            self.db.commit()
            return True
        return False

    def exists(self, username: str) -> bool:
        """username 중복 체크"""
        return self.db.query(UserDB).filter(UserDB.username == username).first() is not None


    # ==================== Gemini API 키 관리 ====================

    def update_gemini_key(self, user_id: int, api_key: str) -> Optional[UserDB]:
        """사용자의 Gemini API 키 업데이트 (암호화 저장)"""
        user = self.get_by_id(user_id)
        if user:
            user.gemini_api_key = encrypt_api_key(api_key)
            self.db.commit()
            self.db.refresh(user)
        return user

    def delete_gemini_key(self, user_id: int) -> Optional[UserDB]:
        """사용자의 Gemini API 키 삭제"""
        user = self.get_by_id(user_id)
        if user:
            user.gemini_api_key = None
            self.db.commit()
            self.db.refresh(user)
        return user

    def get_gemini_key(self, user_id: int) -> Optional[str]:
        """사용자의 Gemini API 키 조회 (복호화 반환)"""
        user = self.get_by_id(user_id)
        if user and user.gemini_api_key:
            try:
                return decrypt_api_key(user.gemini_api_key)
            except Exception:
                # 복호화 실패 시 None 반환 (키가 손상됨)
                return None
        return None

    # ==================== 한국투자증권 API 키 관리 ====================

    def update_kis_credentials(
        self,
        user_id: int,
        app_key: str,
        app_secret: str
    ) -> Optional[UserDB]:
        """한국투자증권 API 인증정보 업데이트 (암호화 저장)"""
        user = self.get_by_id(user_id)
        if user:
            user.kis_app_key = encrypt_api_key(app_key)
            user.kis_app_secret = encrypt_api_key(app_secret)
            self.db.commit()
            self.db.refresh(user)
        return user

    def delete_kis_credentials(self, user_id: int) -> Optional[UserDB]:
        """한국투자증권 API 인증정보 삭제"""
        user = self.get_by_id(user_id)
        if user:
            user.kis_app_key = None
            user.kis_app_secret = None
            self.db.commit()
            self.db.refresh(user)
        return user

    def get_kis_credentials(self, user_id: int) -> Optional[tuple[str, str]]:
        """
        한국투자증권 API 인증정보 조회 (복호화 반환)

        Returns:
            (app_key, app_secret) 튜플 또는 None
        """
        user = self.get_by_id(user_id)
        if user and user.kis_app_key and user.kis_app_secret:
            try:
                app_key = decrypt_api_key(user.kis_app_key)
                app_secret = decrypt_api_key(user.kis_app_secret)
                return (app_key, app_secret)
            except Exception:
                # 복호화 실패 시 None 반환 (키가 손상됨)
                return None
        return None
