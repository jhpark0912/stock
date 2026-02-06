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
    def create(db: Session, user_id: int, portfolio: PortfolioCreate) -> PortfolioDB:
        """생성"""
        db_portfolio = PortfolioDB(
            user_id=user_id,
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
            raise ValueError(f"Ticker {portfolio.ticker} already exists in your portfolio")

    @staticmethod
    def get_all(db: Session, user_id: int) -> List[PortfolioDB]:
        """전체 조회 (유저별)"""
        return db.query(PortfolioDB).filter(
            PortfolioDB.user_id == user_id
        ).order_by(PortfolioDB.created_at.desc()).all()

    @staticmethod
    def get_by_ticker(db: Session, user_id: int, ticker: str) -> Optional[PortfolioDB]:
        """티커로 조회 (유저별)"""
        return db.query(PortfolioDB).filter(
            PortfolioDB.user_id == user_id,
            PortfolioDB.ticker == ticker.upper()
        ).first()

    @staticmethod
    def update(db: Session, user_id: int, ticker: str, portfolio: PortfolioUpdate) -> Optional[PortfolioDB]:
        """수정 (유저별)"""
        db_portfolio = PortfolioRepository.get_by_ticker(db, user_id, ticker)
        if not db_portfolio:
            return None

        update_data = portfolio.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_portfolio, key, value)

        db.commit()
        db.refresh(db_portfolio)
        return db_portfolio

    @staticmethod
    def delete(db: Session, user_id: int, ticker: str) -> bool:
        """삭제 (유저별)"""
        db_portfolio = PortfolioRepository.get_by_ticker(db, user_id, ticker)
        if not db_portfolio:
            return False

        db.delete(db_portfolio)
        db.commit()
        return True
