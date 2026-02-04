"""
포트폴리오 Repository (CRUD)
"""
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Optional
from app.database.models import PortfolioDB
from app.models.portfolio import PortfolioCreate, PortfolioUpdate


class PortfolioRepository:

    @staticmethod
    def create(db: Session, portfolio: PortfolioCreate) -> PortfolioDB:
        """생성"""
        db_portfolio = PortfolioDB(
            ticker=portfolio.ticker.upper(),
            purchase_price=portfolio.purchase_price,
            quantity=portfolio.quantity,
            purchase_date=portfolio.purchase_date,
            notes=portfolio.notes,
        )
        try:
            db.add(db_portfolio)
            db.commit()
            db.refresh(db_portfolio)
            return db_portfolio
        except IntegrityError:
            db.rollback()
            raise ValueError(f"Ticker {portfolio.ticker} already exists")

    @staticmethod
    def get_all(db: Session) -> List[PortfolioDB]:
        """전체 조회"""
        return db.query(PortfolioDB).order_by(PortfolioDB.created_at.desc()).all()

    @staticmethod
    def get_by_ticker(db: Session, ticker: str) -> Optional[PortfolioDB]:
        """티커로 조회"""
        return db.query(PortfolioDB).filter(PortfolioDB.ticker == ticker.upper()).first()

    @staticmethod
    def update(db: Session, ticker: str, portfolio: PortfolioUpdate) -> Optional[PortfolioDB]:
        """수정"""
        db_portfolio = PortfolioRepository.get_by_ticker(db, ticker)
        if not db_portfolio:
            return None

        update_data = portfolio.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_portfolio, key, value)

        db.commit()
        db.refresh(db_portfolio)
        return db_portfolio

    @staticmethod
    def delete(db: Session, ticker: str) -> bool:
        """삭제"""
        db_portfolio = PortfolioRepository.get_by_ticker(db, ticker)
        if not db_portfolio:
            return False

        db.delete(db_portfolio)
        db.commit()
        return True
