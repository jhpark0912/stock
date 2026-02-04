# 데이터베이스 설정

## 위치

데이터베이스 파일은 **프로젝트 루트의 `data/` 폴더**에 저장됩니다:

```
stock/
├── data/
│   └── portfolio.db  ← SQLite DB 파일
├── backend/
├── frontend/
└── ...
```

## 자동 생성

서버 시작 시 자동으로 다음 작업이 수행됩니다:

1. `data/` 폴더가 없으면 생성
2. `portfolio.db` 파일이 없으면 생성
3. 테이블이 없으면 생성

## 환경 변수 설정 (선택)

기본 경로를 변경하려면 `.env` 파일에 다음을 추가하세요:

```bash
# 커스텀 DB 디렉토리 경로
DB_DIR=/your/custom/path/data
```

## DB 리셋

데이터를 초기화하려면:

```bash
# 1. 서버 중지
# 2. DB 파일 삭제
rm data/portfolio.db

# 3. 서버 재시작 (자동으로 새 DB 생성)
cd backend
python -m uvicorn app.main:app --reload
```

## Git 관리

- `data/` 폴더는 `.gitignore`에 포함되어 **Git에 추적되지 않습니다**
- 이는 보안상 올바른 설정입니다 (DB에 민감한 정보가 포함될 수 있음)
- 각 환경에서 독립적으로 DB가 생성/관리됩니다

## 백업

중요한 데이터는 주기적으로 백업하세요:

```bash
# 백업 생성
cp data/portfolio.db data/portfolio.db.backup-$(date +%Y%m%d)

# 백업 복원
cp data/portfolio.db.backup-YYYYMMDD data/portfolio.db
```
