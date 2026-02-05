/**
 * API 클라이언트 설정
 */
import axios, { type AxiosInstance } from 'axios';

// API 기본 URL (환경변수에서 가져오거나 기본값 사용)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

/**
 * API 응답 공통 타입
 */
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

/**
 * Axios 인스턴스 생성
 */
export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30초
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 요청 인터셉터 (인증 토큰 추가)
 */
api.interceptors.request.use(
  (config) => {
    // localStorage에서 토큰 가져오기
    const token = localStorage.getItem('stock_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * 응답 인터셉터 (에러 처리)
 */
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 401 Unauthorized - 토큰 만료 또는 인증 실패
    if (error.response?.status === 401) {
      // 토큰 삭제
      localStorage.removeItem('stock_access_token');

      // 페이지 리로드하여 AuthContext가 로그아웃 상태 감지
      window.location.reload();
    }

    // 403 Forbidden - 권한 부족
    if (error.response?.status === 403) {
      console.error('권한 오류: 접근 권한이 없습니다.');
    }

    return Promise.reject(error);
  }
);

export default api;
