"""
마이그레이션: portfolio 테이블에 display_name 컬럼 추가
실행: python backend/migrations/add_display_name.py
"""
import sqlite3
from pathlib import Path


def migrate():
    """display_name 컬럼을 portfolio 테이블에 추가"""
    # 프로젝트 루트의 data 폴더에 있는 DB 파일 사용
    db_path = Path(__file__).parent.parent.parent / "data" / "portfolio.db"

    if not db_path.exists():
        print(f"❌ 데이터베이스 파일이 없습니다: {db_path}")
        return False

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    try:
        # 컬럼 존재 여부 확인
        cursor.execute("PRAGMA table_info(portfolio)")
        columns = [col[1] for col in cursor.fetchall()]

        if 'display_name' not in columns:
            cursor.execute("ALTER TABLE portfolio ADD COLUMN display_name VARCHAR(50)")
            conn.commit()
            print("✅ display_name 컬럼 추가 완료")
        else:
            print("ℹ️ display_name 컬럼이 이미 존재합니다")

        return True
    except Exception as e:
        print(f"❌ 마이그레이션 실패: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()


if __name__ == "__main__":
    migrate()
