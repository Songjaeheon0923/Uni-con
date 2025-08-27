import { getLocalApiUrl } from '../utils/networkUtils';

// 동적으로 API URL을 설정하는 함수
let API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8080';

// 앱 시작 시 자동으로 로컬 API URL 감지
const initializeApiUrl = async () => {
  try {
    // 환경변수가 설정되어 있지 않으면 자동 감지 시도
    if (!process.env.EXPO_PUBLIC_API_BASE_URL) {
      const detectedUrl = await getLocalApiUrl();
      API_BASE_URL = detectedUrl;
      console.log('Auto-detected API URL:', API_BASE_URL);
    } else {
      console.log('Using configured API URL:', API_BASE_URL);
    }
  } catch (error) {
    console.error('Failed to initialize API URL:', error);
    console.log('Falling back to default URL:', API_BASE_URL);
  }
};

// API URL 초기화 실행
initializeApiUrl();

class ApiService {
  constructor() {
    this.authErrorHandler = null;
    this.authToken = null;
  }

  // API URL을 수동으로 업데이트하는 메서드 (개발 중 필요시 사용)
  updateApiUrl(newUrl) {
    API_BASE_URL = newUrl;
    console.log('API URL updated to:', API_BASE_URL);
  }

  // 현재 API URL을 반환하는 메서드
  getCurrentApiUrl() {
    return API_BASE_URL;
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

      // heartbeat 요청은 로그 제외 (너무 빈번함)
      if (!endpoint.includes('/activity/heartbeat')) {
        console.log(`API Request: ${options.method || 'GET'} ${endpoint}`);
      }
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        // 401, 403 Unauthorized 에러 처리 (조용히 처리)
        if ((response.status === 401 || response.status === 403) && this.authErrorHandler) {
          this.authErrorHandler();
          // 인증 에러는 조용히 처리하고 에러를 던지지 않음
          return null;
        }
        
        // 404, 500 에러도 조용히 처리 (사용자 상태 조회 등에서 발생)
        if (response.status === 404 || response.status === 500) {
          return null;
        }
        
        // 다른 에러들만 로그 출력
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData.detail) {
            errorMessage += ` - ${errorData.detail}`;
          }
          // 에러 로그 제거 - 사용자에게 콘솔 에러 표시 안함
        } catch (parseError) {
          // 파싱 에러도 조용히 처리
        }
        throw new Error(errorMessage);
      }

      return await response.json();
    } catch (error) {
      // 인증 에러와 404, 500 에러는 이미 위에서 처리되었으므로 조용히 넘어감
      if (error.message && (error.message.includes('401') || error.message.includes('403') || error.message.includes('404') || error.message.includes('500'))) {
        return null;
      }
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

  async searchRoomsByText(query, limit = 100) {
    const params = new URLSearchParams({
      query: query,
      limit: limit,
    });
    
    return this.request(`/rooms/search/text?${params}`);
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

  async getRoomMatches(roomId) {
    return this.request(`/favorites/${roomId}/matched`);
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
    try {
      // 로그인 요청 시에는 401 에러 핸들러를 임시로 비활성화
      const originalHandler = this.authErrorHandler;
      this.authErrorHandler = null;
      
      const result = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      
      // 핸들러 복원
      this.authErrorHandler = originalHandler;
      
      return result;
    } catch (error) {
      // 핸들러 복원
      const originalHandler = this.authErrorHandler;
      if (originalHandler) {
        this.authErrorHandler = originalHandler;
      }
      
      // 로그인 실패 시 콘솔 에러 없이 조용히 처리
      throw new Error('로그인에 실패했습니다.');
    }
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

  // 계약서 분석 관련 API
  async analyzeContract(imageFile) {
    const formData = new FormData();
    formData.append('file', {
      uri: imageFile.uri,
      type: imageFile.type || 'image/jpeg',
      name: imageFile.name || 'contract.jpg',
    });

    return this.request('/contract/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` }),
      },
      body: formData,
    });
  }

  // 비동기 계약서 분석 시작
  async startAnalysisAsync(imageFile) {
    const formData = new FormData();
    formData.append('file', {
      uri: imageFile.uri,
      type: imageFile.type || 'image/jpeg',
      name: imageFile.name || 'contract.jpg',
    });

    return this.request('/contract/analyze-async', {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(this.authToken && { 'Authorization': `Bearer ${this.authToken}` }),
      },
      body: formData,
    });
  }

  // 분석 상태 조회
  async getAnalysisStatus(taskId) {
    return this.request(`/contract/status/${taskId}`, {
      method: 'GET',
    });
  }

  async testContractAnalysis() {
    return this.request('/contract/test');
  }

  // API URL 테스트 함수 (디버깅용)
  async testApiConnection() {
    console.log('Current API URL:', API_BASE_URL);
    
    try {
      const response = await fetch(API_BASE_URL, { method: 'GET' });
      console.log('API connection test result:', response.status);
      return { success: true, status: response.status, url: API_BASE_URL };
    } catch (error) {
      console.error('API connection test failed:', error);
      return { success: false, error: error.message, url: API_BASE_URL };
    }
  }

  // 사용자 프로필 정보 조회
  async getUserProfile() {
    return this.request('/profile/me', {
      method: 'GET',
    });
  }

  // 특정 사용자 정보 조회 (다른 사용자의 프로필)
  async getUserById(userId) {
    return this.request(`/users/${userId}`, {
      method: 'GET',
    });
  }

  // 새로운 회원가입 플로우 API들
  async initialSignup(email, password) {
    return this.request('/auth/signup/initial', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async phoneVerification(userId, name, phoneNumber, residentNumber) {
    return this.request('/auth/signup/phone-verification', {
      method: 'POST',
      body: JSON.stringify({ 
        user_id: userId, 
        name: name, 
        phone_number: phoneNumber,
        resident_number: residentNumber
      }),
    });
  }

  async schoolVerification(userId, schoolEmail) {
    return this.request('/auth/signup/school-verification', {
      method: 'POST',
      body: JSON.stringify({ 
        user_id: userId, 
        school_email: schoolEmail 
      }),
    });
  }

  async completeSignup(signupData) {
    return this.request('/auth/signup/complete', {
      method: 'POST',
      body: JSON.stringify(signupData),
    });
  }

  // 기존 단계별 메서드들 (호환성 유지)
  async completeSignupLegacy(userId) {
    return this.request('/auth/signup/complete', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
  }

  // 정책 관련 API
  async getPolicyRecommendations(limit = 10, offset = 0) {
    return this.request(`/policies/recommendations?limit=${limit}&offset=${offset}`);
  }

  async getPopularPolicies(limit = 10, offset = 0) {
    const response = await this.request(`/policies/popular?limit=${limit}&offset=${offset}`);
    // 새로운 형식이면 전체 응답을 반환 (페이지네이션 정보 포함)
    return response;
  }

  async recordPolicyView(policyId) {
    return this.request(`/policies/view/${policyId}`, {
      method: 'POST',
    });
  }

  async getPolicyCategories() {
    return this.request('/policies/categories');
  }

  async getPoliciesByCategory(category, limit = 20) {
    return this.request(`/policies/category/${encodeURIComponent(category)}?limit=${limit}`);
  }

  async searchPolicies(query, limit = 20) {
    return this.request(`/policies/search?q=${encodeURIComponent(query)}&limit=${limit}`);
  }

  // 채팅 관련 API
  async createChatRoom(roomType, participantIds, name = null) {
    return this.request('/chat/rooms', {
      method: 'POST',
      body: JSON.stringify({
        room_type: roomType,
        participant_ids: participantIds,
        name: name
      }),
    });
  }

  async getChatRooms() {
    return this.request('/chat/rooms');
  }

  async sendMessage(roomId, content, messageType = 'text', fileUrl = null, replyToId = null) {
    return this.request(`/chat/rooms/${roomId}/messages`, {
      method: 'POST',
      body: JSON.stringify({
        content: content,
        message_type: messageType,
        file_url: fileUrl,
        reply_to_id: replyToId
      }),
    });
  }

  async getChatMessages(roomId, limit = 50, offset = 0) {
    return this.request(`/chat/rooms/${roomId}/messages?limit=${limit}&offset=${offset}`);
  }

  // 읽음 처리 없이 메시지 조회 (실시간 업데이트용)
  async peekChatMessages(roomId, limit = 50, offset = 0) {
    return this.request(`/chat/rooms/${roomId}/messages/peek?limit=${limit}&offset=${offset}`);
  }

  async markMessagesAsRead(roomId) {
    return this.request(`/chat/rooms/${roomId}/read`, {
      method: 'PUT',
    });
  }

  // 메시지 상태 업데이트
  async updateMessageStatus(messageId, status) {
    return this.request(`/chat/messages/${messageId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
  }

  async deleteChatRoom(roomId) {
    return this.request(`/chat/rooms/${roomId}`, {
      method: 'DELETE',
    });
  }

  // 정책 챗봇 API
  async chatWithPolicyBot({ message, user_context, streaming = false }) {
    const endpoint = streaming ? '/api/policy-chat/chat/stream' : '/api/policy-chat/chat';
    
    if (streaming) {
      // 스트리밍 응답 처리
      return this.requestStream(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          message,
          user_context,
        }),
      });
    } else {
      // 일반 응답 처리
      return this.request(endpoint, {
        method: 'POST',
        body: JSON.stringify({
          message,
          user_context,
        }),
      });
    }
  }

  async getPolicyChatStatus() {
    return this.request('/api/policy-chat/status');
  }

  async getPolicyRecommendations(userContext) {
    return this.request('/api/policy-chat/recommendations', {
      method: 'POST',
      body: JSON.stringify({
        user_context: userContext,
      }),
    });
  }

  // 사용자 활동 관련 API
  async updateUserActivity() {
    return this.request('/activity/heartbeat', {
      method: 'POST',
    });
  }

  async getUserStatus(userId) {
    return this.request(`/activity/status/${userId}`, {
      method: 'GET',
    });
  }

  // 스트리밍 응답 처리를 위한 헬퍼 메소드
  async *requestStream(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/plain',
        ...options.headers,
      },
      ...options,
    };

    if (this.authToken) {
      config.headers.Authorization = `Bearer ${this.authToken}`;
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // React Native에서는 스트리밍을 지원하지 않으므로 전체 텍스트를 받아서 처리
      const text = await response.text();
      const lines = text.split('\n');
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            return;
          }
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              yield parsed.content;
              // 약간의 지연으로 타이핑 효과
              await new Promise(resolve => setTimeout(resolve, 50));
            }
            if (parsed.type === 'done') {
              return;
            }
          } catch (parseError) {
            // JSON 파싱 실패시 원본 데이터 반환
            if (data.trim().length > 0) {
              yield data;
              await new Promise(resolve => setTimeout(resolve, 50));
            }
          }
        }
      }
      
    } catch (error) {
      console.error('Streaming request failed:', error);
      throw error;
    }
  }
}

export default new ApiService();