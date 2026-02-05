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
