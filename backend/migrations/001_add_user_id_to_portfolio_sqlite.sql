-- SQLite용 포트폴리오 테이블 마이그레이션
-- 작성일: 2026-02-06
-- 목적: 포트폴리오 데이터를 유저별로 분리 (SQLite 전용)

-- SQLite는 ALTER COLUMN을 지원하지 않으므로 테이블 재생성 필요

-- ==========================================
-- 1단계: 기존 테이블 백업
-- ==========================================
CREATE TABLE portfolio_backup AS SELECT * FROM portfolio;

-- ==========================================
-- 2단계: 새 테이블 생성
-- ==========================================
CREATE TABLE portfolio_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    ticker VARCHAR(10) NOT NULL,
    purchase_price DECIMAL(10, 2),
    quantity INTEGER,
    purchase_date DATE,
    notes TEXT,
    last_price DECIMAL(10, 2),
    profit_percent DECIMAL(10, 2),
    last_updated DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (user_id, ticker)
);

-- ==========================================
-- 3단계: 기존 데이터 복사
-- ==========================================
-- 옵션 A: 기존 데이터를 admin(id=1)에게 할당
INSERT INTO portfolio_new (
    id, user_id, ticker, purchase_price, quantity, purchase_date,
    notes, last_price, profit_percent, last_updated, created_at, updated_at
)
SELECT
    id,
    1 as user_id,  -- admin의 id (실제 환경에 맞게 수정)
    ticker,
    purchase_price,
    quantity,
    purchase_date,
    notes,
    last_price,
    profit_percent,
    last_updated,
    created_at,
    updated_at
FROM portfolio_backup;

-- 옵션 B: 기존 데이터 삭제 (빈 테이블로 시작)
-- (위 INSERT 문을 실행하지 않음)

-- ==========================================
-- 4단계: 기존 테이블 삭제 및 이름 변경
-- ==========================================
DROP TABLE portfolio;
ALTER TABLE portfolio_new RENAME TO portfolio;

-- ==========================================
-- 5단계: 인덱스 생성
-- ==========================================
CREATE INDEX idx_portfolio_user_id ON portfolio(user_id);
CREATE INDEX idx_portfolio_ticker ON portfolio(ticker);

-- ==========================================
-- 6단계: 검증
-- ==========================================
-- 데이터 확인
-- SELECT * FROM portfolio LIMIT 10;

-- 스키마 확인
-- SELECT sql FROM sqlite_master WHERE type='table' AND name='portfolio';

-- ==========================================
-- 롤백 (문제 발생 시)
-- ==========================================
-- DROP TABLE portfolio;
-- ALTER TABLE portfolio_backup RENAME TO portfolio;
