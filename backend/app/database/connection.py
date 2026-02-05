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

# Engine 및 Session
engine = create_engine(DATABASE_URL, echo=True)
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
    from app.database.models import Base
    Base.metadata.create_all(bind=engine)
    print(f"✅ Database initialized at {DB_FILE}")
