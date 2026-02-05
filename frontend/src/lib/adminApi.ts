/**
 * 관리자 API 클라이언트
 * 관리자 전용 기능 (사용자 관리)
 */

import { api } from './api'
import type { UserResponse } from '@/types/auth'
import type { RejectUserResponse, DeleteUserResponse } from '@/types/admin'

const ADMIN_BASE = '/api/admin'

/**
 * 전체 사용자 목록 조회 (관리자 전용)
 */
export async function getAllUsers(): Promise<UserResponse[]> {
  const response = await api.get<UserResponse[]>(`${ADMIN_BASE}/users`)
  return response.data
}

/**
 * 승인 대기 사용자 목록 조회 (관리자 전용)
 */
export async function getPendingUsers(): Promise<UserResponse[]> {
  const response = await api.get<UserResponse[]>(`${ADMIN_BASE}/users/pending`)
  return response.data
}

/**
 * 사용자 승인 (관리자 전용)
 */
export async function approveUser(userId: number): Promise<UserResponse> {
  const response = await api.put<UserResponse>(`${ADMIN_BASE}/users/${userId}/approve`)
  return response.data
}

/**
 * 사용자 거부 (관리자 전용)
 */
export async function rejectUser(userId: number): Promise<RejectUserResponse> {
  const response = await api.put<RejectUserResponse>(`${ADMIN_BASE}/users/${userId}/reject`)
  return response.data
}

/**
 * 사용자 비활성화 (관리자 전용)
 */
export async function deactivateUser(userId: number): Promise<UserResponse> {
  const response = await api.put<UserResponse>(`${ADMIN_BASE}/users/${userId}/deactivate`)
  return response.data
}

/**
 * 사용자 삭제 (관리자 전용)
 */
export async function deleteUser(userId: number): Promise<DeleteUserResponse> {
  const response = await api.delete<DeleteUserResponse>(`${ADMIN_BASE}/users/${userId}`)
  return response.data
}
