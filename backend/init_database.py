"""
데이터베이스 초기화 스크립트

DB 테이블을 생성하고 Admin 계정을 초기화합니다.
"""
import sys
from pathlib import Path

# 프로젝트 루트 추가
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "backend"))

from app.database.connection import init_db, get_db
from app.database.user_repository import UserRepository
from app.services.auth_service import AuthService
from app.config import settings

if __name__ == "__main__":
    print("="*60)
    print("Database Initialization")
    print("="*60)
    
    # Create tables
    print("\n[1/2] Creating tables...")
    init_db()
    
    # Create Admin account
    print("\n[2/2] Checking admin account...")
    db = next(get_db())
    user_repo = UserRepository(db)
    
    admin_user = user_repo.get_by_username(settings.admin_username)
    if not admin_user:
        password_hash = AuthService.hash_password(settings.admin_password)
        user_repo.create(
            username=settings.admin_username,
            password_hash=password_hash,
            role="admin",
            is_approved=True
        )
        print(f"[OK] Admin account created: {settings.admin_username}")
    else:
        print(f"[INFO] Admin account already exists: {settings.admin_username}")
    
    db.close()
    print("\n[SUCCESS] Database initialized!")
