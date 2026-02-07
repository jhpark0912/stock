"""
SQLAlchemy ORM 모델
"""
from sqlalchemy import Column, Integer, String, Numeric, Date, Text, DateTime, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship

Base = declarative_base()


class UserDB(Base):
    """사용자 DB 모델"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    username = Column(String(50), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="user")  # user, admin
    is_active = Column(Boolean, default=True)
    is_approved = Column(Boolean, default=False)  # Admin 승인 여부
    gemini_api_key = Column(String(255), nullable=True)  # 유저별 Gemini API 키
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    @property
    def has_gemini_key(self) -> bool:
        """Gemini API 키 보유 여부"""
        return bool(self.gemini_api_key)


class PortfolioDB(Base):
    """포트폴리오 DB 모델"""
    __tablename__ = "portfolio"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    ticker = Column(String(10), nullable=False, index=True)
    purchase_price = Column(Numeric(10, 2), nullable=True)
    quantity = Column(Integer, nullable=True)
    purchase_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    last_price = Column(Numeric(10, 2), nullable=True)  # 마지막 조회한 현재가
    profit_percent = Column(Numeric(10, 2), nullable=True)  # 수익률
    last_updated = Column(DateTime, nullable=True)  # 마지막 업데이트 시각
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # 복합 유니크 제약: 한 사용자가 동일 티커를 중복 등록할 수 없음
    __table_args__ = (
        UniqueConstraint('user_id', 'ticker', name='uq_user_ticker'),
    )

    # Relationship
    user = relationship("UserDB", backref="portfolios")


class SectorHoldingsCacheDB(Base):
    """섹터 ETF 보유 종목 캐시 (하루 1회 갱신)"""
    __tablename__ = "sector_holdings_cache"

    id = Column(Integer, primary_key=True, autoincrement=True)
    symbol = Column(String(10), nullable=False, unique=True, index=True)  # XLK, XLF 등
    top_holdings = Column(Text, nullable=False)  # JSON: ["AAPL", "MSFT", "NVDA"]
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
