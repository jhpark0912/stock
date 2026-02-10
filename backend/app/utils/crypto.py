"""
API 키 암호화/복호화 유틸리티

Fernet (대칭키 암호화) 사용
- 환경변수 ENCRYPTION_KEY로 암호화 키 관리
- Base64 인코딩된 32바이트 키 필요
"""

import os
import logging
from typing import Optional
from cryptography.fernet import Fernet, InvalidToken

logger = logging.getLogger(__name__)


class CryptoService:
    """API 키 암호화/복호화 서비스"""
    
    _fernet: Optional[Fernet] = None
    
    @classmethod
    def _get_fernet(cls) -> Fernet:
        """Fernet 인스턴스 반환 (싱글톤)"""
        if cls._fernet is None:
            # 🔐 Secret Manager 우선, 실패 시 환경변수 폴백
            encryption_key = None
            
            try:
                from app.utils.secret_manager import get_secret
                encryption_key = get_secret("encryption-key", "ENCRYPTION_KEY")
                logger.info("✅ ENCRYPTION_KEY를 Secret Manager에서 로드")
            except Exception as e:
                logger.warning(f"⚠️  Secret Manager에서 encryption-key 로드 실패: {e}")
                encryption_key = os.getenv("ENCRYPTION_KEY")
                if encryption_key:
                    logger.info("✅ ENCRYPTION_KEY를 환경변수에서 로드 (폴백)")
            
            if not encryption_key:
                raise ValueError(
                    "ENCRYPTION_KEY 환경변수가 설정되지 않았습니다. "
                    ".env 파일에 ENCRYPTION_KEY를 추가하세요. "
                    "생성 방법: python -c 'from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())'"
                )
            
            try:
                cls._fernet = Fernet(encryption_key.encode())
            except Exception as e:
                raise ValueError(f"ENCRYPTION_KEY가 유효하지 않습니다: {e}")
        
        return cls._fernet
    
    @classmethod
    def encrypt(cls, plain_text: str) -> str:
        """
        평문을 암호화
        
        Args:
            plain_text: 암호화할 평문
            
        Returns:
            암호화된 문자열 (Base64)
        """
        if not plain_text:
            return ""
        
        try:
            fernet = cls._get_fernet()
            encrypted_bytes = fernet.encrypt(plain_text.encode())
            return encrypted_bytes.decode()
        except Exception as e:
            logger.error(f"암호화 실패: {e}")
            raise ValueError(f"암호화 중 오류가 발생했습니다: {e}")
    
    @classmethod
    def decrypt(cls, encrypted_text: str) -> str:
        """
        암호문을 복호화
        
        Args:
            encrypted_text: 암호화된 문자열 (Base64)
            
        Returns:
            복호화된 평문
        """
        if not encrypted_text:
            return ""
        
        try:
            fernet = cls._get_fernet()
            decrypted_bytes = fernet.decrypt(encrypted_text.encode())
            return decrypted_bytes.decode()
        except InvalidToken:
            logger.error("복호화 실패: 잘못된 토큰 또는 암호화 키 불일치")
            raise ValueError("복호화에 실패했습니다. 암호화 키가 변경되었을 수 있습니다.")
        except Exception as e:
            logger.error(f"복호화 실패: {e}")
            raise ValueError(f"복호화 중 오류가 발생했습니다: {e}")


# 편의 함수
def encrypt_api_key(api_key: str) -> str:
    """API 키 암호화"""
    return CryptoService.encrypt(api_key)


def decrypt_api_key(encrypted_key: str) -> str:
    """API 키 복호화"""
    return CryptoService.decrypt(encrypted_key)
