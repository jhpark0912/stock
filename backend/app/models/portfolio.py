"""
Pydantic 스키마 (API 요청/응답)
"""
from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime


class PortfolioBase(BaseModel):
    ticker: str = Field(..., max_length=10)
    display_name: Optional[str] = Field(None, max_length=50)  # 한글 이름 (예: 애플, 테슬라)
    purchase_price: Optional[float] = Field(None, ge=0)
    quantity: Optional[int] = Field(None, ge=0)
    purchase_date: Optional[date] = None
    notes: Optional[str] = Field(None, max_length=1000)
    last_price: Optional[float] = Field(None, ge=0)  # 마지막 조회한 현재가
    profit_percent: Optional[float] = None  # 수익률
    last_updated: Optional[datetime] = None  # 마지막 업데이트 시각


class PortfolioCreate(PortfolioBase):
    """생성 요청"""
    pass


class PortfolioUpdate(BaseModel):
    """수정 요청 (모든 필드 선택적)"""
    display_name: Optional[str] = Field(None, max_length=50)  # 한글 이름 (예: 애플, 테슬라)
    purchase_price: Optional[float] = Field(None, ge=0)
    quantity: Optional[int] = Field(None, ge=0)
    purchase_date: Optional[date] = None
    notes: Optional[str] = None
    last_price: Optional[float] = Field(None, ge=0)  # 마지막 조회한 현재가
    profit_percent: Optional[float] = None  # 수익률
    last_updated: Optional[datetime] = None  # 마지막 업데이트 시각


class PortfolioResponse(PortfolioBase):
    """응답"""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ApiResponse(BaseModel):
    """공통 응답"""
    success: bool
    data: Optional[list[PortfolioResponse] | PortfolioResponse] = None
    error: Optional[str] = None
