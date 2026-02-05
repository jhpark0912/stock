"""
FastAPI 애플리케이션 진입점
"""
import logging
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.api.routes import health, stock, portfolio
from app.database.connection import init_db
import time

# 로거 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# FastAPI 앱 생성
app = FastAPI(
    title="Stock Analysis API",
    description="주식 분석 웹 플랫폼 Backend API",
    version="1.0.0",
    docs_url="/docs" if settings.is_development else None,
    redoc_url="/redoc" if settings.is_development else None,
)

# 요청 로깅 미들웨어
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    # 요청 로그
    logger.info(f"🔵 요청 시작: {request.method} {request.url.path}")
    logger.info(f"   📍 Query params: {dict(request.query_params)}")
    logger.info(f"   📍 Headers: {dict(request.headers)}")
    
    response = await call_next(request)
    
    # 응답 로그
    process_time = time.time() - start_time
    logger.info(
        f"{'🟢' if response.status_code < 400 else '🔴'} 응답 완료: "
        f"{request.method} {request.url.path} "
        f"Status: {response.status_code} "
        f"Time: {process_time:.3f}s"
    )
    
    return response

# CORS 미들웨어 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 앱 시작 시 DB 초기화
@app.on_event("startup")
async def startup_event():
    init_db()
    logger.info("🗄️ Database initialized")

# 404 에러 핸들러
@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    logger.error(f"🚨 404 에러 발생!")
    logger.error(f"   ❌ 요청 URL: {request.method} {request.url.path}")
    logger.error(f"   ❌ 등록된 라우트 목록:")
    for route in app.routes:
        logger.error(f"      - {route.path} [{', '.join(route.methods) if hasattr(route, 'methods') else 'N/A'}]")
    
    return JSONResponse(
        status_code=404,
        content={
            "detail": f"경로를 찾을 수 없습니다: {request.method} {request.url.path}",
            "available_routes": [
                {"path": route.path, "methods": list(route.methods) if hasattr(route, 'methods') else []}
                for route in app.routes
            ]
        }
    )

# 라우터 등록
logger.info("📦 라우터 등록 시작...")
app.include_router(health.router, prefix="/api", tags=["Health"])
logger.info("   ✅ Health 라우터 등록 완료")
app.include_router(stock.router, prefix="/api", tags=["Stock"])
logger.info("   ✅ Stock 라우터 등록 완료")
app.include_router(portfolio.router, prefix="/api", tags=["Portfolio"])
logger.info("   ✅ Portfolio 라우터 등록 완료")

# 등록된 라우트 출력
logger.info("📋 등록된 전체 라우트:")
for route in app.routes:
    if hasattr(route, 'methods'):
        logger.info(f"   - {route.path} [{', '.join(route.methods)}]")


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
