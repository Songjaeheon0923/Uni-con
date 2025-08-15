import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SignupContext = createContext();

export const useSignup = () => {
  const context = useContext(SignupContext);
  if (!context) {
    throw new Error('useSignup must be used within a SignupProvider');
  }
  return context;
};

export const SignupProvider = ({ children }) => {
  const [signupData, setSignupData] = useState({
    // Step 1: 이메일, 비밀번호
    email: '',
    password: '',
    
    // Step 2: 휴대폰 인증
    name: '',
    nationality: '내국인',
    residentNumber1: '',
    residentNumber2: '',
    phoneNumber: '',
    carrier: '통신사',
    phoneVerified: false,
    
    // ID 인증
    idVerified: false,
    
    // 학교 인증
    schoolEmail: '',
    schoolVerified: false,
    schoolSkipped: false,
  });

  // AsyncStorage에서 데이터 로드
  const loadSignupData = async () => {
    try {
      const savedData = await AsyncStorage.getItem('@signup_data');
      if (savedData) {
        setSignupData(JSON.parse(savedData));
      }
    } catch (error) {
      console.error('회원가입 데이터 로드 실패:', error);
    }
  };

  // AsyncStorage에 데이터 저장
  const saveSignupData = async (newData) => {
    try {
      const updatedData = { ...signupData, ...newData };
      setSignupData(updatedData);
      await AsyncStorage.setItem('@signup_data', JSON.stringify(updatedData));
      console.log('회원가입 데이터 저장:', updatedData);
    } catch (error) {
      console.error('회원가입 데이터 저장 실패:', error);
    }
  };

  // 회원가입 데이터 초기화
  const clearSignupData = async () => {
    try {
      setSignupData({
        email: '',
        password: '',
        name: '',
        nationality: '내국인',
        residentNumber1: '',
        residentNumber2: '',
        phoneNumber: '',
        carrier: '통신사',
        phoneVerified: false,
        idVerified: false,
        schoolEmail: '',
        schoolVerified: false,
        schoolSkipped: false,
      });
      await AsyncStorage.removeItem('@signup_data');
      console.log('회원가입 데이터 초기화 완료');
    } catch (error) {
      console.error('회원가입 데이터 초기화 실패:', error);
    }
  };

  // 특정 단계 데이터 업데이트
  const updateStep1Data = (data) => {
    saveSignupData({
      email: data.email,
      password: data.password,
    });
  };

  const updateStep2Data = (data) => {
    saveSignupData({
      name: data.name,
      nationality: data.nationality,
      residentNumber1: data.residentNumber1,
      residentNumber2: data.residentNumber2,
      phoneNumber: data.phoneNumber,
      carrier: data.carrier,
      phoneVerified: data.phoneVerified,
    });
  };

  const updateIDVerificationData = (data) => {
    saveSignupData({
      idVerified: data.idVerified,
    });
  };

  const updateSchoolVerificationData = (data) => {
    saveSignupData({
      schoolEmail: data.schoolEmail,
      schoolVerified: data.schoolVerified,
      schoolSkipped: data.schoolSkipped,
    });
  };

  // 완전한 주민등록번호 반환
  const getFullResidentNumber = () => {
    return `${signupData.residentNumber1}-${signupData.residentNumber2}`;
  };

  // 주민등록번호에서 성별 추출
  const getGenderFromResidentNumber = () => {
    const fullResidentNumber = getFullResidentNumber();
    if (fullResidentNumber.length < 7 || !fullResidentNumber.includes('-')) {
      return null;
    }
    
    try {
      const genderDigit = parseInt(fullResidentNumber.split('-')[1][0]);
      if ([1, 3].includes(genderDigit)) return 'male';
      if ([2, 4].includes(genderDigit)) return 'female';
      return null;
    } catch (error) {
      return null;
    }
  };

  // 회원가입 완료 여부 확인
  const isSignupComplete = () => {
    return (
      signupData.email &&
      signupData.password &&
      signupData.name &&
      signupData.residentNumber1 &&
      signupData.residentNumber2 &&
      signupData.phoneNumber &&
      signupData.phoneVerified &&
      signupData.idVerified &&
      (signupData.schoolVerified || signupData.schoolSkipped)
    );
  };

  // 앱 시작 시 데이터 로드
  useEffect(() => {
    loadSignupData();
  }, []);

  const value = {
    signupData,
    updateStep1Data,
    updateStep2Data,
    updateIDVerificationData,
    updateSchoolVerificationData,
    clearSignupData,
    getFullResidentNumber,
    getGenderFromResidentNumber,
    isSignupComplete,
  };

  return (
    <SignupContext.Provider value={value}>
      {children}
    </SignupContext.Provider>
  );
};