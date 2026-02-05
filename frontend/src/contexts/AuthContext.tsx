/**
 * 인증 컨텍스트
 * JWT 토큰 관리 및 전역 인증 상태 제공
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { UserResponse, UserLogin, UserCreate } from '@/types/auth'
import * as authApi from '@/lib/authApi'

/**
 * 인증 상태 타입
 */
interface AuthState {
  /** 현재 로그인한 사용자 정보 (null이면 미인증) */
  user: UserResponse | null
  /** 로딩 상태 */
  isLoading: boolean
  /** JWT 토큰 */
  token: string | null
}

/**
 * 인증 컨텍스트 값 타입
 */
interface AuthContextValue extends AuthState {
  /** 로그인 함수 */
  login: (credentials: UserLogin) => Promise<void>
  /** 회원가입 함수 */
  register: (userData: UserCreate) => Promise<void>
  /** 로그아웃 함수 */
  logout: () => void
}

/**
 * localStorage 키
 */
const TOKEN_KEY = 'stock_access_token'

/**
 * 인증 컨텍스트
 */
const AuthContext = createContext<AuthContextValue | undefined>(undefined)

/**
 * 인증 컨텍스트 Provider
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    token: null,
  })

  /**
   * 초기 로드 시 localStorage에서 토큰 복원
   */
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem(TOKEN_KEY)

      if (!savedToken) {
        setState({ user: null, isLoading: false, token: null })
        return
      }

      try {
        // 토큰으로 사용자 정보 조회
        const user = await authApi.getCurrentUser(savedToken)
        setState({ user, isLoading: false, token: savedToken })
      } catch (error) {
        // 토큰이 유효하지 않으면 제거
        localStorage.removeItem(TOKEN_KEY)
        setState({ user: null, isLoading: false, token: null })
      }
    }

    initAuth()
  }, [])

  /**
   * 로그인
   */
  const login = async (credentials: UserLogin) => {
    const tokenData = await authApi.login(credentials)
    const token = tokenData.access_token

    // 토큰 저장
    localStorage.setItem(TOKEN_KEY, token)

    // 사용자 정보 조회
    const user = await authApi.getCurrentUser(token)

    setState({ user, isLoading: false, token })
  }

  /**
   * 회원가입
   */
  const register = async (userData: UserCreate) => {
    await authApi.register(userData)
    // 회원가입 후 자동 로그인하지 않음 (승인 대기)
  }

  /**
   * 로그아웃
   */
  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setState({ user: null, isLoading: false, token: null })
  }

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * 인증 컨텍스트 훅
 * @throws AuthContext가 제공되지 않은 경우
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
