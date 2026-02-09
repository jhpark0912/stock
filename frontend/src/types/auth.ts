/**
 * 인증 관련 타입 정의
 * 백엔드 API (backend/app/models/user.py)와 일치
 */

/**
 * 로그인 요청
 */
export interface UserLogin {
  username: string
  password: string
}

/**
 * 회원가입 요청
 */
export interface UserCreate {
  username: string
  password: string
}

/**
 * JWT 토큰 응답
 */
export interface Token {
  access_token: string
  token_type: string
}

/**
 * 사용자 정보 응답
 */
export interface UserResponse {
  id: number
  username: string
  role: string
  is_active: boolean
  is_approved: boolean
  has_gemini_key: boolean  // Gemini API 키 보유 여부
  created_at: string
  updated_at: string
}

/**
 * Gemini API 키 업데이트 요청
 */
export interface GeminiKeyUpdate {
  api_key: string
}

/**
 * Gemini API 키 상태 응답
 */
export interface GeminiKeyStatus {
  has_key: boolean
  key_preview?: string  // 마스킹된 키 미리보기 (예: AIza...xyz)
}

/**
 * 한국투자증권 API 키 업데이트 요청
 */
export interface KISCredentialsUpdate {
  app_key: string
  app_secret: string
}

/**
 * 한국투자증권 API 키 상태 응답
 */
export interface KISCredentialsStatus {
  has_credentials: boolean
  app_key_preview?: string  // 마스킹된 App Key 미리보기
}

/**
 * 회원가입 응답
 */
export interface RegisterResponse {
  message: string
}

/**
 * FastAPI Pydantic Validation 에러 항목
 */
export interface ValidationErrorItem {
  type: string
  loc: (string | number)[]
  msg: string
  input?: unknown
  ctx?: Record<string, unknown>
  url?: string
}

/**
 * API 에러 응답
 * - 단순 에러: { detail: "string" }
 * - Validation 에러: { detail: ValidationErrorItem[] }
 */
export interface ApiError {
  detail: string | ValidationErrorItem[]
}
