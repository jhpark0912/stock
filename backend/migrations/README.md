# 데이터베이스 마이그레이션

## 개요

이 폴더는 데이터베이스 스키마 변경을 위한 마이그레이션 스크립트를 포함합니다.

## 마이그레이션 목록

### 001_add_user_id_to_portfolio

**목적**: 포트폴리오 테이블을 유저별로 분리

**변경사항**:
- `portfolio` 테이블에 `user_id` 컬럼 추가 (외래키)
- `ticker`의 unique 제약 제거
- `(user_id, ticker)` 복합 unique 제약 추가
- 성능을 위한 인덱스 추가

**파일**:
- `001_add_user_id_to_portfolio.sql` - PostgreSQL/MySQL용
- `001_add_user_id_to_portfolio_sqlite.sql` - SQLite용 (개발 환경)

## 실행 방법

### SQLite (개발 환경)

```bash
# 1. 백업 생성
cp backend/stock.db backend/stock.db.backup

# 2. 마이그레이션 실행
sqlite3 backend/stock.db < backend/migrations/001_add_user_id_to_portfolio_sqlite.sql

# 3. 검증
sqlite3 backend/stock.db "SELECT * FROM portfolio LIMIT 5;"
```

### PostgreSQL (운영 환경)

```bash
# 1. 백업 생성
pg_dump -h localhost -U postgres -d stock_db > backup_$(date +%Y%m%d).sql

# 2. 마이그레이션 실행
psql -h localhost -U postgres -d stock_db -f backend/migrations/001_add_user_id_to_portfolio.sql

# 3. 검증
psql -h localhost -U postgres -d stock_db -c "SELECT * FROM portfolio LIMIT 5;"
```

### MySQL (운영 환경)

```bash
# 1. 백업 생성
mysqldump -u root -p stock_db > backup_$(date +%Y%m%d).sql

# 2. 마이그레이션 실행
mysql -u root -p stock_db < backend/migrations/001_add_user_id_to_portfolio.sql

# 3. 검증
mysql -u root -p stock_db -e "SELECT * FROM portfolio LIMIT 5;"
```

## 주의사항

### 기존 데이터 처리

마이그레이션 실행 전에 기존 데이터를 어떻게 처리할지 결정해야 합니다:

**옵션 A**: 기존 데이터를 admin 유저에게 할당
- 스크립트의 `UPDATE portfolio SET user_id = 1` 부분 실행
- admin의 id가 1이 아니면 해당 값으로 수정

**옵션 B**: 기존 데이터 삭제
- 스크립트의 `DELETE FROM portfolio` 부분 실행
- 새로운 시작으로 깨끗한 테이블 유지

### NULL 방지

마이그레이션 스크립트는 다음과 같은 순서로 실행되어 NULL 오류를 방지합니다:

1. `user_id` 컬럼을 `NULL` 허용으로 추가
2. 기존 데이터에 `user_id` 값 할당
3. `user_id`를 `NOT NULL`로 변경
4. 외래키 및 unique 제약 추가

### 롤백

문제 발생 시 각 스크립트 하단의 롤백 섹션을 참조하여 이전 상태로 복원할 수 있습니다.

## 검증 체크리스트

마이그레이션 완료 후 다음 사항을 확인하세요:

- [ ] `portfolio` 테이블에 `user_id` 컬럼 존재
- [ ] `user_id`가 `NOT NULL` 제약 적용
- [ ] `(user_id, ticker)` 복합 unique 제약 존재
- [ ] `user_id` 외래키가 `users.id` 참조
- [ ] 기존 데이터가 올바른 `user_id`로 할당됨
- [ ] 인덱스가 생성됨 (`idx_portfolio_user_id`)
- [ ] 애플리케이션이 정상 작동함

## 추가 정보

### Alembic 사용 (선택사항)

향후 더 복잡한 마이그레이션을 위해 Alembic을 사용할 수 있습니다:

```bash
# Alembic 설치
pip install alembic

# Alembic 초기화
alembic init alembic

# 마이그레이션 생성
alembic revision --autogenerate -m "add user_id to portfolio"

# 마이그레이션 실행
alembic upgrade head
```

### 문의

마이그레이션 관련 문제가 발생하면 백업을 복원하고 개발팀에 문의하세요.
