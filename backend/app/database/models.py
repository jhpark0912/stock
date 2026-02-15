"""
SQLAlchemy ORM 모델
"""
from sqlalchemy import Column, Integer, String, Numeric, Date, Text, DateTime, Boolean, ForeignKey, UniqueConstraint, Index
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
    
    # API 키 (암호화 저장)
    gemini_api_key = Column(String(512), nullable=True)  # Gemini API 키 (암호화)
    kis_app_key = Column(String(512), nullable=True)     # 한국투자증권 App Key (암호화)
    kis_app_secret = Column(String(512), nullable=True)  # 한국투자증권 App Secret (암호화)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    @property
    def has_gemini_key(self) -> bool:
        """Gemini API 키 보유 여부"""
        return bool(self.gemini_api_key)
    
    @property
    def has_kis_credentials(self) -> bool:
        """한국투자증권 API 인증정보 보유 여부"""
        return bool(self.kis_app_key and self.kis_app_secret)


class PortfolioDB(Base):
    """포트폴리오 DB 모델"""
    __tablename__ = "portfolio"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    ticker = Column(String(10), nullable=False, index=True)
    display_name = Column(String(50), nullable=True)  # 한글 이름 (예: 애플, 테슬라)
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


class StockAnalysisDB(Base):
    """AI 분석 요약 저장 테이블"""
    __tablename__ = "stock_analysis"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    ticker = Column(String(10), nullable=False, index=True)

    # 요약 데이터 (핵심)
    summary = Column(Text, nullable=False)  # 3줄 요약
    strategy = Column(String(20), nullable=False)  # buy, hold, sell

    # 분석 시점 스냅샷
    current_price = Column(Numeric(10, 2), nullable=True)
    user_avg_price = Column(Numeric(10, 2), nullable=True)  # 평단가 (맞춤형 분석 시)
    profit_loss_ratio = Column(Numeric(10, 2), nullable=True)  # 수익률

    # 전체 보고서 (선택적 저장)
    full_report = Column(Text, nullable=True)  # 마크다운 전체 보고서

    # 타임스탬프
    created_at = Column(DateTime, server_default=func.now())

    # 관계
    user = relationship("UserDB", backref="stock_analyses")

    # 인덱스: 사용자별 티커 조회 최적화
    __table_args__ = (
        Index('ix_stock_analysis_user_ticker', 'user_id', 'ticker'),
    )
