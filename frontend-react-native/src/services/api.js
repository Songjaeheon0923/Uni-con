const API_BASE_URL = 'http://localhost:8080';

class ApiService {
  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
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

  async removeFavorite(roomId, userId) {
    return this.request(`/favorites/${userId}/${roomId}`, {
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
    return this.request(`/favorites/${userId}/${roomId}/check`);
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
}

export default new ApiService();