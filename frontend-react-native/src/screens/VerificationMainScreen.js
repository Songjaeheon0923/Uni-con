import React, { useState } from 'react';
import VerificationContainer from '../components/VerificationContainer';
import PhoneVerificationStep from '../components/PhoneVerificationStep';
import IDVerificationStep from '../components/IDVerificationStep';
import SchoolVerificationStep from '../components/SchoolVerificationStep';
import { useSignup } from '../contexts/SignupContext';

export default function VerificationMainScreen({ navigation }) {
  const { signupData } = useSignup();
  
  // 현재 진행 상태에 따라 초기 단계 설정
  const getInitialStep = () => {
    if (!signupData.phoneVerified) return 1;
    if (!signupData.idVerified) return 2;
    return 3;
  };

  const [currentStep, setCurrentStep] = useState(getInitialStep());
  const isAutoProgressRef = React.useRef(true);

  // 인증 완료 상태를 체크해서 자동으로 다음 단계로 이동
  React.useEffect(() => {
    // 자동 진행이 비활성화되어 있으면 실행하지 않음
    if (!isAutoProgressRef.current) return;
    
    if (signupData.phoneVerified && currentStep === 1) {
      setCurrentStep(2);
    } else if (signupData.idVerified && currentStep === 2) {
      setCurrentStep(3);
    }
  }, [signupData.phoneVerified, signupData.idVerified, currentStep]);

  // 진행 표시바 클릭 처리
  const handleStepPress = (stepId) => {
    // 수동 네비게이션 시 자동 진행 비활성화
    isAutoProgressRef.current = false;
    setCurrentStep(stepId);
    
    // 잠깐 후 자동 진행 다시 활성화
    setTimeout(() => {
      isAutoProgressRef.current = true;
    }, 500);
  };

  const handlePhoneNext = () => {
    // 휴대폰 인증이 완료되면 자동으로 다음 단계로 이동 (useEffect에서 처리)
  };

  const handleIDNext = () => {
    // 신분증 인증이 완료되면 다음 단계로 이동
    setCurrentStep(3);
  };

  const handleComplete = () => {
    navigation.navigate('Login');
  };

  return (
    <VerificationContainer
      currentStep={currentStep}
      onStepPress={handleStepPress}
      signupData={signupData}
    >
      <PhoneVerificationStep onNext={handlePhoneNext} />
      <IDVerificationStep onNext={handleIDNext} />
      <SchoolVerificationStep onComplete={handleComplete} />
    </VerificationContainer>
  );
}