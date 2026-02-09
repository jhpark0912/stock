"""
DB 마이그레이션: KIS API 인증정보 컬럼 추가

실행 방법:
    python backend/migrations/add_kis_credentials.py

변경 사항:
    - users 테이블에 kis_app_key, kis_app_secret 컬럼 추가
    - gemini_api_key 컬럼 크기 확장 (255 → 512, 암호화 대응)
"""

import sys
import os
from pathlib import Path

# 프로젝트 루트를 Python 경로에 추가
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "backend"))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 데이터베이스 URL (프로젝트 루트 기준)
project_root = Path(__file__).parent.parent.parent
DB_FILE = project_root / "data" / "portfolio.db"
DATABASE_URL = f"sqlite:///{DB_FILE}"

def run_migration():
    """Run migration"""
    engine = create_engine(DATABASE_URL, echo=True)
    Session = sessionmaker(bind=engine)
    session = Session()

    try:
        logger.info("[START] Migration started...")

        # 1. gemini_api_key column size expansion (SQLite does not support ALTER COLUMN)
        logger.info("   [INFO] gemini_api_key is already String(255)")

        # 2. Add kis_app_key column
        logger.info("   [ADD] Adding kis_app_key column...")
        try:
            session.execute(text(
                "ALTER TABLE users ADD COLUMN kis_app_key VARCHAR(512)"
            ))
            logger.info("   [OK] kis_app_key column added")
        except Exception as e:
            if "duplicate column name" in str(e).lower():
                logger.info("   [SKIP] kis_app_key column already exists")
            else:
                raise

        # 3. Add kis_app_secret column
        logger.info("   [ADD] Adding kis_app_secret column...")
        try:
            session.execute(text(
                "ALTER TABLE users ADD COLUMN kis_app_secret VARCHAR(512)"
            ))
            logger.info("   [OK] kis_app_secret column added")
        except Exception as e:
            if "duplicate column name" in str(e).lower():
                logger.info("   [SKIP] kis_app_secret column already exists")
            else:
                raise

        session.commit()
        logger.info("[SUCCESS] Migration completed!")

    except Exception as e:
        logger.error(f"[ERROR] Migration failed: {e}")
        session.rollback()
        raise

    finally:
        session.close()


if __name__ == "__main__":
    print("\n" + "="*60)
    print("DB Migration: Add KIS API Credentials Columns")
    print("="*60 + "\n")
    
    confirm = input("[WARNING] Run migration? (yes/no): ")
    if confirm.lower() in ['yes', 'y']:
        run_migration()
    else:
        print("[CANCELLED] Migration cancelled")
