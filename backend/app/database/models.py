"""
SQLAlchemy ORM 모델
"""
from sqlalchemy import Column, Integer, String, Numeric, Date, Text, DateTime
from sqlalchemy.sql import func
from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()


class PortfolioDB(Base):
    """포트폴리오 DB 모델"""
    __tablename__ = "portfolio"

    id = Column(Integer, primary_key=True, autoincrement=True)
    ticker = Column(String(10), nullable=False, unique=True, index=True)
    purchase_price = Column(Numeric(10, 2), nullable=True)
    quantity = Column(Integer, nullable=True)
    purchase_date = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    last_price = Column(Numeric(10, 2), nullable=True)  # 마지막 조회한 현재가
    profit_percent = Column(Numeric(10, 2), nullable=True)  # 수익률
    last_updated = Column(DateTime, nullable=True)  # 마지막 업데이트 시각
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
