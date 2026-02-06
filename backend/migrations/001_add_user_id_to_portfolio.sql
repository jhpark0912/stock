-- 포트폴리오 테이블에 user_id 추가 및 유저별 분리 마이그레이션
-- 작성일: 2026-02-06
-- 목적: 포트폴리오 데이터를 유저별로 분리

-- ==========================================
-- 1단계: 백업 (선택사항)
-- ==========================================
-- CREATE TABLE portfolio_backup AS SELECT * FROM portfolio;

-- ==========================================
-- 2단계: user_id 컬럼 추가 (nullable)
-- ==========================================
ALTER TABLE portfolio
ADD COLUMN user_id INTEGER NULL;

-- ==========================================
-- 3단계: 기존 데이터 처리
-- ==========================================
-- 옵션 A: 기존 데이터를 admin 유저에게 할당
-- (admin의 id를 1로 가정, 실제 환경에 맞게 수정)
UPDATE portfolio
SET user_id = 1
WHERE user_id IS NULL;

-- 옵션 B: 기존 데이터를 모두 삭제 (주의!)
-- DELETE FROM portfolio WHERE user_id IS NULL;

-- ==========================================
-- 4단계: user_id를 NOT NULL로 변경
-- ==========================================
-- SQLite의 경우 (개발 환경)
-- SQLite는 ALTER COLUMN을 지원하지 않으므로 테이블 재생성 필요
-- 아래는 PostgreSQL/MySQL용입니다.

-- PostgreSQL:
ALTER TABLE portfolio
ALTER COLUMN user_id SET NOT NULL;

-- MySQL:
-- ALTER TABLE portfolio
-- MODIFY COLUMN user_id INTEGER NOT NULL;

-- ==========================================
-- 5단계: 외래키 제약 추가
-- ==========================================
-- PostgreSQL/MySQL:
ALTER TABLE portfolio
ADD CONSTRAINT fk_portfolio_user
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- ==========================================
-- 6단계: 기존 unique 제약 제거 및 복합 unique 추가
-- ==========================================
-- PostgreSQL:
-- 기존 unique 제약 이름 확인 필요 (예: portfolio_ticker_key)
-- ALTER TABLE portfolio DROP CONSTRAINT portfolio_ticker_key;

-- MySQL:
-- ALTER TABLE portfolio DROP INDEX ticker;

-- 복합 unique 제약 추가
ALTER TABLE portfolio
ADD CONSTRAINT uq_user_ticker UNIQUE (user_id, ticker);

-- ==========================================
-- 7단계: 인덱스 추가 (성능 최적화)
-- ==========================================
CREATE INDEX idx_portfolio_user_id ON portfolio(user_id);

-- ==========================================
-- 8단계: 검증
-- ==========================================
-- 데이터 확인
-- SELECT * FROM portfolio LIMIT 10;

-- 제약 확인
-- PostgreSQL:
-- SELECT conname, contype FROM pg_constraint WHERE conrelid = 'portfolio'::regclass;

-- MySQL:
-- SHOW CREATE TABLE portfolio;

-- ==========================================
-- 롤백 (문제 발생 시)
-- ==========================================
-- DROP INDEX idx_portfolio_user_id;
-- ALTER TABLE portfolio DROP CONSTRAINT uq_user_ticker;
-- ALTER TABLE portfolio DROP CONSTRAINT fk_portfolio_user;
-- ALTER TABLE portfolio DROP COLUMN user_id;
-- -- 백업에서 복원:
-- DELETE FROM portfolio;
-- INSERT INTO portfolio SELECT * FROM portfolio_backup;
