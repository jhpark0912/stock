#!/bin/bash

# DB 마이그레이션 스크립트
# backend/data/portfolio.db → data/portfolio.db로 이동

echo "🔄 DB 파일 마이그레이션 시작..."

# 프로젝트 루트로 이동
cd "$(dirname "$0")"

# 기존 DB 파일 경로
OLD_DB="backend/data/portfolio.db"
# 새 DB 파일 경로
NEW_DIR="data"
NEW_DB="$NEW_DIR/portfolio.db"

# 새 디렉토리 생성
mkdir -p "$NEW_DIR"

# 기존 DB 파일이 있으면 복사
if [ -f "$OLD_DB" ]; then
    echo "📦 기존 DB 파일 발견: $OLD_DB"
    echo "📂 새 위치로 복사: $NEW_DB"
    cp "$OLD_DB" "$NEW_DB"
    echo "✅ 마이그레이션 완료!"
    echo ""
    echo "🗑️  기존 파일 삭제 여부를 선택하세요:"
    echo "   rm $OLD_DB"
    echo ""
else
    echo "ℹ️  기존 DB 파일이 없습니다. 서버 시작 시 자동으로 생성됩니다."
fi

echo "✨ 완료! 서버를 재시작하세요."
