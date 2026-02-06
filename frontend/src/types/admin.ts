/**
 * 관리자 관련 타입 정의
 */

import type { UserResponse } from './auth'

/**
 * 사용자 목록 응답 (관리자용)
 */
export type AdminUserList = UserResponse[]

/**
 * 사용자 승인 응답
 */
export interface ApproveUserResponse {
  message: string
}

/**
 * 사용자 거부 응답
 */
export interface RejectUserResponse {
  message: string
}

/**
 * 사용자 삭제 응답
 */
export interface DeleteUserResponse {
  message: string
}

/**
 * 로그 레벨 타입
 */
export type LogLevel = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL'

/**
 * 로그 레벨 응답
 */
export interface LogLevelResponse {
  current_level: LogLevel
  available_levels: LogLevel[]
}

/**
 * 로그 레벨 업데이트 요청
 */
export interface LogLevelUpdateRequest {
  level: LogLevel
}
