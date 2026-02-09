"""
DB 마이그레이션: 기존 API 키 암호화

⚠️  주의: 이 스크립트는 한 번만 실행해야 합니다!

실행 전 준비:
    1. .env에 ENCRYPTION_KEY 추가
       python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
    2. .env에 생성된 키 추가:
       ENCRYPTION_KEY=생성된_키

실행 방법:
    python backend/migrations/encrypt_existing_keys.py

변경 사항:
    - 평문으로 저장된 gemini_api_key를 암호화하여 재저장
"""

import sys
import os
from pathlib import Path

# 프로젝트 루트를 Python 경로에 추가
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "backend"))

# .env 로드 (프로젝트 루트 기준)
from dotenv import load_dotenv
project_root = Path(__file__).parent.parent.parent
env_file = project_root / ".env"
load_dotenv(env_file)

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database.models import UserDB
from app.utils.crypto import encrypt_api_key
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 데이터베이스 URL (프로젝트 루트 기준)
project_root = Path(__file__).parent.parent.parent
DB_FILE = project_root / "data" / "portfolio.db"
DATABASE_URL = f"sqlite:///{DB_FILE}"


def is_encrypted(text: str) -> bool:
    """
    텍스트가 이미 암호화되었는지 추측
    Fernet 암호화는 Base64 형태이고 "gAAAAA"로 시작하는 경우가 많음
    """
    if not text:
        return False
    # Fernet 암호화된 토큰은 보통 "gAAAAA" 또는 유사한 패턴
    return text.startswith("gAAAAA") or len(text) > 100


def encrypt_existing_keys():
    """Encrypt existing plaintext API keys"""
    engine = create_engine(DATABASE_URL, echo=False)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        logger.info("[START] Encrypting existing API keys...")

        # Check ENCRYPTION_KEY environment variable
        if not os.getenv("ENCRYPTION_KEY"):
            raise ValueError(
                "ENCRYPTION_KEY environment variable is not set.\n"
                "Generate a key with:\n"
                "  python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\"\n"
                "Add the generated key to .env file."
            )

        # Query all users
        users = session.query(UserDB).all()
        encrypted_count = 0
        skipped_count = 0

        for user in users:
            if user.gemini_api_key:
                # Skip if already encrypted
                if is_encrypted(user.gemini_api_key):
                    logger.info(f"   [SKIP] {user.username}: Already encrypted")
                    skipped_count += 1
                    continue

                # Encrypt plaintext key
                try:
                    encrypted_key = encrypt_api_key(user.gemini_api_key)
                    user.gemini_api_key = encrypted_key
                    encrypted_count += 1
                    logger.info(f"   [OK] {user.username}: Gemini key encrypted")
                except Exception as e:
                    logger.error(f"   [ERROR] {user.username}: Encryption failed - {e}")
                    raise

        session.commit()
        logger.info(f"\n[SUCCESS] Encryption completed!")
        logger.info(f"   - Encrypted: {encrypted_count}")
        logger.info(f"   - Skipped: {skipped_count}")
        logger.info(f"   - Total: {len(users)}")

    except Exception as e:
        logger.error(f"[ERROR] Encryption failed: {e}")
        session.rollback()
        raise

    finally:
        session.close()


if __name__ == "__main__":
    print("\n" + "="*60)
    print("[WARNING] DB Migration: Encrypt Existing API Keys")
    print("="*60)
    print("\n[WARNING] Important:")
    print("   1. This script should only be run ONCE!")
    print("   2. ENCRYPTION_KEY must be set in .env")
    print("   3. NEVER change ENCRYPTION_KEY after running this!")
    print("      (Changing it will make existing keys unrecoverable)\n")
    
    confirm = input("[WARNING] Really run this? (yes/no): ")
    if confirm.lower() in ['yes', 'y']:
        encrypt_existing_keys()
    else:
        print("[CANCELLED] Migration cancelled")
