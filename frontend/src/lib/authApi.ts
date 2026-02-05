/**
 * 인증 API 클라이언트
 * 백엔드 FastAPI와 통신
 */

import type {
  UserLogin,
  UserCreate,
  Token,
  UserResponse,
  RegisterResponse,
  ApiError,
  ValidationErrorItem,
  GeminiKeyUpdate,
  GeminiKeyStatus,
} from '@/types/auth'

/**
 * API 기본 URL
 * Vite 프록시 설정에 따라 /api 경로 사용
 */
const API_BASE = '/api/auth'

/**
 * Pydantic validation 에러를 한글 메시지로 변환
 */
function formatValidationError(error: ValidationErrorItem): string {
  const field = error.loc[error.loc.length - 1] as string
  const fieldNameMap: Record<string, string> = {
    username: '사용자명',
    password: '비밀번호',
  }
  const fieldName = fieldNameMap[field] || field

  switch (error.type) {
    case 'string_too_short':
      const minLength = (error.ctx?.min_length as number) || 0
      return `${fieldName}은 최소 ${minLength}자 이상이어야 합니다`
    case 'string_too_long':
      const maxLength = (error.ctx?.max_length as number) || 0
      return `${fieldName}은 최대 ${maxLength}자 이하여야 합니다`
    case 'missing':
      return `${fieldName}을 입력해주세요`
    case 'value_error':
      return error.msg || `${fieldName} 값이 올바르지 않습니다`
    default:
      return error.msg || '입력 값이 올바르지 않습니다'
  }
}

/**
 * API 에러 처리 헬퍼
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData: ApiError = await response.json().catch(() => ({
      detail: '서버와 통신 중 오류가 발생했습니다',
    }))

    // Validation 에러 배열인 경우
    if (Array.isArray(errorData.detail)) {
      const messages = errorData.detail.map(formatValidationError)
      throw new Error(messages.join('\n'))
    }

    // 단순 문자열 에러인 경우
    throw new Error(errorData.detail)
  }
  return response.json()
}

/**
 * 로그인
 * @param credentials 로그인 정보 (username, password)
 * @returns JWT 토큰
 * @throws 인증 실패, 승인 대기, 비활성화 등의 오류
 */
export async function login(credentials: UserLogin): Promise<Token> {
  const response = await fetch(`${API_BASE}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  })

  return handleResponse<Token>(response)
}

/**
 * 회원가입
 * @param userData 회원가입 정보 (username, password)
 * @returns 성공 메시지
 * @throws 중복 사용자명 등의 오류
 */
export async function register(userData: UserCreate): Promise<RegisterResponse> {
  const response = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  })

  return handleResponse<RegisterResponse>(response)
}

/**
 * 현재 사용자 정보 조회
 * @param token JWT 액세스 토큰
 * @returns 사용자 정보
 * @throws 인증 실패 등의 오류
 */
export async function getCurrentUser(token: string): Promise<UserResponse> {
  const response = await fetch(`${API_BASE}/me`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  return handleResponse<UserResponse>(response)
}

/**
 * Gemini API 키 설정
 * @param token JWT 액세스 토큰
 * @param apiKey Gemini API 키
 * @returns API 키 상태 (has_key, key_preview)
 * @throws 인증 실패 등의 오류
 */
export async function updateGeminiKey(
  token: string,
  apiKey: string
): Promise<GeminiKeyStatus> {
  const response = await fetch(`${API_BASE}/gemini-key`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ api_key: apiKey } as GeminiKeyUpdate),
  })

  return handleResponse<GeminiKeyStatus>(response)
}

/**
 * Gemini API 키 삭제
 * @param token JWT 액세스 토큰
 * @returns 성공 메시지
 * @throws 인증 실패 등의 오류
 */
export async function deleteGeminiKey(token: string): Promise<{ message: string }> {
  const response = await fetch(`${API_BASE}/gemini-key`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  return handleResponse<{ message: string }>(response)
}

/**
 * Gemini API 키 상태 조회
 * @param token JWT 액세스 토큰
 * @returns API 키 상태 (has_key, key_preview)
 * @throws 인증 실패 등의 오류
 */
export async function getGeminiKeyStatus(token: string): Promise<GeminiKeyStatus> {
  const response = await fetch(`${API_BASE}/gemini-key/status`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })

  return handleResponse<GeminiKeyStatus>(response)
}
