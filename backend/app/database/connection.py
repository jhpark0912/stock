"""
SQLite Database 연결 설정
"""

import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# DB 파일 위치 - 프로젝트 루트의 data/ 폴더
# 환경 변수로 오버라이드 가능 (예: DB_PATH=/custom/path/db.sqlite)
DEFAULT_DB_DIR = Path(__file__).parent.parent.parent.parent / "data"
DB_DIR = Path(os.getenv("DB_DIR", DEFAULT_DB_DIR))
DB_DIR.mkdir(parents=True, exist_ok=True)

DB_FILE = DB_DIR / "portfolio.db"

# SQLite 연결 문자열
DATABASE_URL = f"sqlite:///{DB_FILE}"

# 로그 레벨이 DEBUG일 때만 SQL 쿼리 출력
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
SQL_ECHO = LOG_LEVEL == "DEBUG"

# Engine 및 Session
engine = create_engine(DATABASE_URL, echo=SQL_ECHO)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """DB 세션 의존성 주입"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """DB 초기화 (테이블 생성)"""
    # DB 경로 로그 출력 (DEBUG 레벨)
    import logging

    from app.database.models import Base

    logger = logging.getLogger(__name__)
    logger.debug(f"📂 DB Directory: {DB_DIR}")
    logger.debug(f"📄 DB File: {DB_FILE}")
    logger.debug(f"🔗 Database URL: {DATABASE_URL}")

    Base.metadata.create_all(bind=engine)
    print(f"Database initialized at {DB_FILE}")
