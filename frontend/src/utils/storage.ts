/**
 * localStorage 저장/로드 유틸리티
 * 사용자 설정을 브라우저에 영구 저장
 */

import type { UserSettings } from '../types/user';
import { DEFAULT_USER_SETTINGS } from '../types/user';

/** localStorage 키 */
const STORAGE_KEY = 'stock_app_user_settings';

/**
 * localStorage에서 사용자 설정 로드
 * @returns 저장된 사용자 설정 또는 기본 설정
 */
export const loadSettings = (): UserSettings => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // 기본 설정과 병합 (새로운 필드 추가 시 호환성 유지)
      return {
        ...DEFAULT_USER_SETTINGS,
        ...parsed,
        sectionVisibility: {
          ...DEFAULT_USER_SETTINGS.sectionVisibility,
          ...(parsed.sectionVisibility || {}),
        },
      };
    }
  } catch (error) {
    console.error('[Storage] Failed to load settings:', error);
  }

  // 기본 설정 반환
  return DEFAULT_USER_SETTINGS;
};

/**
 * localStorage에 사용자 설정 저장
 * @param settings 저장할 사용자 설정
 */
export const saveSettings = (settings: UserSettings): void => {
  try {
    const serialized = JSON.stringify(settings);
    localStorage.setItem(STORAGE_KEY, serialized);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error('[Storage] 저장 공간이 부족합니다. 일부 데이터를 삭제해주세요.');
      alert('저장 공간이 부족합니다. 일부 티커를 삭제해주세요.');
    } else {
      console.error('[Storage] Failed to save settings:', error);
    }
  }
};

/**
 * localStorage의 모든 설정 초기화
 */
export const clearSettings = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('[Storage] Failed to clear settings:', error);
  }
};

/**
 * localStorage에 저장된 데이터 크기 확인 (디버깅용)
 * @returns 저장된 데이터의 크기 (bytes)
 */
export const getStorageSize = (): number => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return new Blob([stored]).size;
    }
  } catch (error) {
    console.error('[Storage] Failed to get storage size:', error);
  }
  return 0;
};
