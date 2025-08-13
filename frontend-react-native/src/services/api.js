// 환경변수에서 API URL을 가져오되, 없으면 기본값 사용
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8080';

// 디버그: 실제 사용되는 API URL 확인
console.log('🌐 API_BASE_URL:', API_BASE_URL);

class ApiService {
  constructor() {
    this.authErrorHandler = null;
    this.authToken = null;
  }

  setAuthErrorHandler(handler) {
    this.authErrorHandler = handler;
  }

  setAuthToken(token) {
    this.authToken = token;
  }

  async request(endpoint, options = {}) {
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      // 토큰이 있으면 Authorization 헤더 추가
      if (this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        // 401 Unauthorized 에러 처리
        if (response.status === 401 && this.authErrorHandler) {
          console.log('401 에러 감지 - 세션 만료');
          this.authErrorHandler();
        }
        
        // 에러 응답의 본문을 읽어서 상세 정보 확인
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.detail) {
            errorMessage += ` - ${errorData.detail}`;
          }
          console.error('API error details:', errorData);
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // 방 관련 API
  async searchRooms(bounds) {
    const params = new URLSearchParams({
      lat_min: bounds.latMin,
      lat_max: bounds.latMax,
      lng_min: bounds.lngMin,
      lng_max: bounds.lngMax,
    });
    
    return this.request(`/rooms/search?${params}`);
  }

  async getRoomDetail(roomId) {
    return this.request(`/rooms/${roomId}`);
  }

  async getMarketPrice(roomId) {
    return this.request(`/rooms/${roomId}/market-price`);
  }

  async createRoom(roomData) {
    return this.request('/rooms/', {
      method: 'POST',
      body: JSON.stringify(roomData),
    });
  }

  // 찜 관련 API
  async addFavorite(roomId, userId) {
    return this.request('/favorites/', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, room_id: roomId }),
    });
  }

  async removeFavorite(roomId) {
    return this.request(`/favorites/${roomId}`, {
      method: 'DELETE',
    });
  }

  async getUserFavorites(userId) {
    return this.request(`/favorites/user/${userId}`);
  }

  async getRoomFavorites(roomId) {
    return this.request(`/favorites/${roomId}/users`);
  }

  async checkFavoriteStatus(roomId, userId) {
    return this.request(`/favorites/${roomId}/check`);
  }

  async getMatchedRoommates(roomId) {
    return this.request(`/favorites/${roomId}/matched`);
  }

  // 프로필/매칭 관련 API
  async getProfileQuestions() {
    return this.request('/profile/questions');
  }

  async getMyProfile() {
    return this.request('/profile/me');
  }

  async updateProfile(profileData) {
    return this.request('/profile/me', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  async getMatches() {
    return this.request('/profile/matches');
  }

  async updateUserProfile(profileData) {
    return this.request('/users/profile/me', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  }

  // 사용자 관련 API
  async getMe() {
    return this.request('/users/me');
  }

  async signup(userData) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async logout() {
    return this.request('/auth/logout', {
      method: 'POST',
    });
  }

  // 사용자 정보 관련 API
  async getUserInfo() {
    return this.request('/users/info/me');
  }

  async updateUserInfo(infoData) {
    return this.request('/users/info/me', {
      method: 'PUT',
      body: JSON.stringify(infoData),
    });
  }

  // 한줄 소개만 업데이트
  async updateUserBio(bio) {
    return this.request('/users/bio/me', {
      method: 'PUT',
      body: JSON.stringify({ bio: bio }),
    });
  }
}

export default new ApiService();