import React, { createContext, useState, useContext, useEffect } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [accessToken, setAccessToken] = useState(null);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('user');
      const savedToken = await AsyncStorage.getItem('accessToken');
      
      if (savedUser && savedToken) {
        // 토큰을 API 서비스에 설정
        api.setAuthToken(savedToken);
        
        // 저장된 사용자 정보가 있으면 서버에 유효성 검증
        try {
          const userData = await api.getMe();
          const parsedUser = JSON.parse(savedUser);
          setUser({ ...parsedUser, ...userData });
          setAccessToken(savedToken);
          setIsAuthenticated(true);
        } catch (error) {
          // 서버에서 인증 실패 시 로컬 저장소 초기화
          console.log('세션이 만료되었습니다. 다시 로그인해주세요.');
          await AsyncStorage.multiRemove(['user', 'accessToken']);
          setUser(null);
          setAccessToken(null);
          setIsAuthenticated(false);
          api.setAuthToken(null);
        }
      }
    } catch (error) {
      console.error('인증 상태 확인 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const response = await api.login(credentials);
      console.log('로그인 응답:', response); // 디버깅용
      
      // 응답 형식 확인
      if (!response.access_token) {
        console.error('토큰이 없는 로그인 응답:', response);
        return { 
          success: false, 
          error: '서버에서 토큰을 받지 못했습니다.' 
        };
      }
      
      const userData = {
        id: response.user_id,
        email: response.email,
        name: response.name,
      };
      
      // 토큰과 사용자 정보 저장
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('accessToken', response.access_token);
      
      // API 서비스에 토큰 설정
      api.setAuthToken(response.access_token);
      
      setUser(userData);
      setAccessToken(response.access_token);
      setIsAuthenticated(true);
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('로그인 실패:', error);
      return { 
        success: false, 
        error: error.message || '로그인에 실패했습니다.' 
      };
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (error) {
      console.error('서버 로그아웃 실패:', error);
    } finally {
      await AsyncStorage.multiRemove(['user', 'accessToken']);
      api.setAuthToken(null);
      setUser(null);
      setAccessToken(null);
      setIsAuthenticated(false);
    }
  };

  const handleUnauthorized = async () => {
    // 401 에러 발생 시 호출되는 함수
    console.log('인증이 만료되었습니다. 다시 로그인해주세요.');
    await AsyncStorage.multiRemove(['user', 'accessToken']);
    api.setAuthToken(null);
    setUser(null);
    setAccessToken(null);
    setIsAuthenticated(false);
    
    // 사용자에게 알림
    Alert.alert(
      '세션 만료',
      '로그인 세션이 만료되었습니다. 다시 로그인해주세요.',
      [{ text: '확인' }]
    );
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    checkAuthState,
    handleUnauthorized,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};