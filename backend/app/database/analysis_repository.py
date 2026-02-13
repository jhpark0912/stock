"""
AI 분석 요약 Repository (CRUD)
"""
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.models import StockAnalysisDB
from app.models.stock import StockAnalysisCreate


class AnalysisRepository:
    """AI 분석 저장소"""

    @staticmethod
    def create(db: Session, user_id: int, ticker: str, data: StockAnalysisCreate) -> StockAnalysisDB:
        """분석 저장"""
        db_analysis = StockAnalysisDB(
            user_id=user_id,
            ticker=ticker.upper(),
            summary=data.summary,
            strategy=data.strategy,
            current_price=data.current_price,
            user_avg_price=data.user_avg_price,
            profit_loss_ratio=data.profit_loss_ratio,
            full_report=data.full_report,
        )
        db.add(db_analysis)
        db.commit()
        db.refresh(db_analysis)
        return db_analysis

    @staticmethod
    def get_by_ticker(db: Session, user_id: int, ticker: str) -> List[StockAnalysisDB]:
        """티커별 분석 이력 조회 (최신순)"""
        return db.query(StockAnalysisDB).filter(
            StockAnalysisDB.user_id == user_id,
            StockAnalysisDB.ticker == ticker.upper()
        ).order_by(StockAnalysisDB.created_at.desc()).all()

    @staticmethod
    def get_latest_by_ticker(db: Session, user_id: int, ticker: str) -> Optional[StockAnalysisDB]:
        """티커별 최신 분석 조회"""
        return db.query(StockAnalysisDB).filter(
            StockAnalysisDB.user_id == user_id,
            StockAnalysisDB.ticker == ticker.upper()
        ).order_by(StockAnalysisDB.created_at.desc()).first()

    @staticmethod
    def get_all_by_user(db: Session, user_id: int) -> List[StockAnalysisDB]:
        """사용자의 모든 분석 조회 (최신순)"""
        return db.query(StockAnalysisDB).filter(
            StockAnalysisDB.user_id == user_id
        ).order_by(StockAnalysisDB.created_at.desc()).all()

    @staticmethod
    def get_by_id(db: Session, user_id: int, analysis_id: int) -> Optional[StockAnalysisDB]:
        """ID로 분석 조회 (권한 확인 포함)"""
        return db.query(StockAnalysisDB).filter(
            StockAnalysisDB.id == analysis_id,
            StockAnalysisDB.user_id == user_id
        ).first()

    @staticmethod
    def delete_by_ticker(db: Session, user_id: int, ticker: str) -> int:
        """티커별 분석 전체 삭제 (삭제된 개수 반환)"""
        count = db.query(StockAnalysisDB).filter(
            StockAnalysisDB.user_id == user_id,
            StockAnalysisDB.ticker == ticker.upper()
        ).delete()
        db.commit()
        return count

    @staticmethod
    def delete_by_id(db: Session, user_id: int, analysis_id: int) -> bool:
        """단일 분석 삭제"""
        db_analysis = AnalysisRepository.get_by_id(db, user_id, analysis_id)
        if not db_analysis:
            return False
        
        db.delete(db_analysis)
        db.commit()
        return True
