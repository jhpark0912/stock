"""
FastAPI 애플리케이션 진입점
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.routes import health, stock

# FastAPI 앱 생성
app = FastAPI(
    title="Stock Analysis API",
    description="주식 분석 웹 플랫폼 Backend API",
    version="1.0.0",
    docs_url="/docs" if settings.is_development else None,
    redoc_url="/redoc" if settings.is_development else None,
)

# CORS 미들웨어 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(stock.router, prefix="/api", tags=["Stock"])


@app.get("/")
async def root():
    """루트 엔드포인트"""
    return {
        "message": "Stock Analysis API",
        "version": "1.0.0",
        "docs": "/docs" if settings.is_development else "disabled"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.is_development
    )
