"""
FastAPI 애플리케이션 진입점
"""
import logging
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.api.routes import health, stock, portfolio, auth, admin, economic, secret_stats
from app.database.connection import init_db, get_db
from app.database.user_repository import UserRepository
from app.services.auth_service import AuthService
import time

# 로거 설정
logging.basicConfig(
    level=getattr(logging, settings.log_level, logging.INFO),
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

    # 요청 로그 (DEBUG 레벨)
    logger.debug(f"🔵 요청 시작: {request.method} {request.url.path}")
    logger.debug(f"   📍 Query params: {dict(request.query_params)}")
    logger.debug(f"   📍 Headers: {dict(request.headers)}")

    response = await call_next(request)

    # 응답 로그 (에러는 WARNING, 성공은 DEBUG)
    process_time = time.time() - start_time
    log_message = (
        f"{'🟢' if response.status_code < 400 else '🔴'} 응답 완료: "
        f"{request.method} {request.url.path} "
        f"Status: {response.status_code} "
        f"Time: {process_time:.3f}s"
    )

    if response.status_code >= 400:
        logger.warning(log_message)
    else:
        logger.debug(log_message)

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

    # Admin 계정 초기화
    db = next(get_db())
    user_repo = UserRepository(db)

    # Admin 계정이 없으면 생성
    admin_user = user_repo.get_by_username(settings.admin_username)
    if not admin_user:
        password_hash = AuthService.hash_password(settings.admin_password)
        user_repo.create(
            username=settings.admin_username,
            password_hash=password_hash,
            role="admin",
            is_approved=True  # Admin은 자동 승인
        )
        logger.info(f"👤 Admin 계정 생성됨: {settings.admin_username}")
    else:
        logger.info(f"👤 Admin 계정 존재함: {settings.admin_username}")

    db.close()

# 404 에러 핸들러
@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    logger.debug(f"🚨 404 에러: {request.method} {request.url.path}")
    
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
logger.debug("📦 라우터 등록 시작...")
app.include_router(health.router, prefix="/api", tags=["Health"])
logger.debug("   ✅ Health 라우터 등록 완료")
app.include_router(auth.router, prefix="/api", tags=["Auth"])
logger.debug("   ✅ Auth 라우터 등록 완료")
app.include_router(admin.router, prefix="/api", tags=["Admin"])
logger.debug("   ✅ Admin 라우터 등록 완료")
app.include_router(stock.router, prefix="/api", tags=["Stock"])
logger.debug("   ✅ Stock 라우터 등록 완료")
app.include_router(portfolio.router, prefix="/api", tags=["Portfolio"])
logger.debug("   ✅ Portfolio 라우터 등록 완료")
app.include_router(economic.router, prefix="/api", tags=["Economic"])
logger.debug("   ✅ Economic 라우터 등록 완료")
app.include_router(secret_stats.router, prefix="/api", tags=["Secret Manager"])
logger.debug("   ✅ Secret Stats 라우터 등록 완료")

# 등록된 라우트 출력 (DEBUG 레벨)
logger.debug("📋 등록된 전체 라우트:")
for route in app.routes:
    if hasattr(route, 'methods'):
        logger.debug(f"   - {route.path} [{', '.join(route.methods)}]")


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
