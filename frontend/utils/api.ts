/**
 * API utility functions for Uni-con app
 */

import { 
  User, 
  UserProfile, 
  LoginRequest, 
  SignupRequest, 
  AuthResponse, 
  MatchResult,
  ApiResponse,
  ApiError 
} from '../types';

// API base URL
const API_BASE_URL = 'http://127.0.0.1:8080';

// API endpoints
const API_ENDPOINTS = {
  AUTH: {
    SIGNUP: '/auth/signup',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
  },
  USERS: {
    ME: '/users/me',
    UPDATE_PROFILE: '/users/profile/me',
  },
  PROFILE: {
    QUESTIONS: '/profile/questions',
    ME: '/profile/me',
    MATCHES: '/profile/matches',
  },
} as const;

// HTTP request wrapper
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies for session-based auth
    ...options,
  };

  try {
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      const error: ApiError = {
        message: `HTTP ${response.status}: ${response.statusText}`,
        status: response.status,
      };
      throw error;
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw {
        message: error.message,
        status: 0,
      } as ApiError;
    }
    throw error;
  }
}

// Auth API functions
export const authApi = {
  signup: async (userData: SignupRequest): Promise<AuthResponse> => {
    return apiRequest<AuthResponse>(API_ENDPOINTS.AUTH.SIGNUP, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    return apiRequest<AuthResponse>(API_ENDPOINTS.AUTH.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  logout: async (): Promise<void> => {
    return apiRequest<void>(API_ENDPOINTS.AUTH.LOGOUT, {
      method: 'POST',
    });
  },
};

// User API functions
export const userApi = {
  getMe: async (): Promise<User> => {
    return apiRequest<User>(API_ENDPOINTS.USERS.ME);
  },

  updateProfile: async (profileData: Partial<UserProfile>): Promise<ApiResponse<UserProfile>> => {
    return apiRequest<ApiResponse<UserProfile>>(API_ENDPOINTS.USERS.UPDATE_PROFILE, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },
};

// Profile API functions
export const profileApi = {
  getQuestions: async (): Promise<any> => {
    return apiRequest<any>(API_ENDPOINTS.PROFILE.QUESTIONS);
  },

  getMyProfile: async (): Promise<UserProfile> => {
    return apiRequest<UserProfile>(API_ENDPOINTS.PROFILE.ME);
  },

  getMatches: async (): Promise<MatchResult[]> => {
    return apiRequest<MatchResult[]>(API_ENDPOINTS.PROFILE.MATCHES);
  },
};

// Error handling utility
export const handleApiError = (error: ApiError): string => {
  switch (error.status) {
    case 400:
      return '잘못된 요청입니다. 입력 정보를 확인해주세요.';
    case 401:
      return '인증이 필요합니다. 다시 로그인해주세요.';
    case 403:
      return '접근 권한이 없습니다.';
    case 404:
      return '요청한 리소스를 찾을 수 없습니다.';
    case 409:
      return '이미 존재하는 데이터입니다.';
    case 422:
      return '입력 데이터가 올바르지 않습니다.';
    case 500:
      return '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
    default:
      return error.message || '알 수 없는 오류가 발생했습니다.';
  }
};

// Network connectivity check
export const checkNetworkConnection = async (): Promise<boolean> => {
  try {
    await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      timeout: 5000,
    } as any);
    return true;
  } catch {
    return false;
  }
};