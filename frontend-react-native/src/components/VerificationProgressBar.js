import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { SvgXml } from 'react-native-svg';

export default function VerificationProgressBar({ currentStep = 1, onStepPress, signupData }) {
  
  // SVG 아이콘들 정의
  const phoneIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M4.43562 6.08229C4.23227 4.74295 5.17662 3.53989 6.61923 3.09913C6.87523 3.02138 7.15123 3.04391 7.39124 3.16214C7.63125 3.28036 7.81732 3.48544 7.91172 3.73579L8.37484 4.97079C8.4494 5.16947 8.46288 5.38589 8.41355 5.59229C8.36423 5.79868 8.25436 5.98563 8.09803 6.12913L6.72037 7.39075C6.65237 7.453 6.60171 7.53185 6.57335 7.61957C6.54498 7.70728 6.53988 7.80086 6.55854 7.89114L6.57132 7.9465L6.60432 8.08491C6.77608 8.75725 7.03711 9.40356 7.38045 10.0066C7.75534 10.6469 8.21999 11.2302 8.76025 11.7388L8.80283 11.7771C8.87161 11.8382 8.95503 11.8804 9.04496 11.8996C9.1349 11.9188 9.22827 11.9144 9.316 11.8868L11.0972 11.3257C11.2996 11.2622 11.5164 11.2605 11.7197 11.321C11.9231 11.3816 12.1037 11.5015 12.2385 11.6653L13.0817 12.6885C13.433 13.1143 13.3904 13.7404 12.9869 14.1162C11.8829 15.1457 10.3647 15.3565 9.30854 14.508C8.01341 13.4643 6.92197 12.1906 6.08903 10.7508C5.24794 9.31295 4.68763 7.7289 4.43562 6.08229ZM7.6743 7.96141L8.81561 6.91379C9.12844 6.6269 9.3484 6.25306 9.44723 5.84027C9.54607 5.42747 9.51928 4.99455 9.37029 4.5971L8.90823 3.3621C8.71867 2.85827 8.34444 2.44549 7.86155 2.20761C7.37866 1.96972 6.82332 1.92457 6.30835 2.08132C4.51653 2.62961 3.07818 4.23618 3.38267 6.24305C3.5956 7.64414 4.08641 9.42637 5.16916 11.2874C6.06785 12.8398 7.24519 14.2131 8.64207 15.3384C10.2263 16.6107 12.3407 16.1763 13.7141 14.8966C14.1071 14.5307 14.3456 14.0286 14.381 13.4928C14.4164 12.957 14.2461 12.4279 13.9047 12.0135L13.0615 10.9893C12.7917 10.6619 12.4303 10.4225 12.0236 10.3019C11.6169 10.1812 11.1835 10.1848 10.7788 10.3122L9.30003 10.7774C8.91818 10.3838 8.58373 9.94677 8.30351 9.47535C8.0331 8.99861 7.82215 8.49053 7.67536 7.96247" fill="COLOR_PLACEHOLDER"/>
  </svg>`;

  const idIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M7.64514 9.21532C8.51165 9.21532 9.2141 8.51287 9.2141 7.64636C9.2141 6.77984 8.51165 6.07739 7.64514 6.07739C6.77862 6.07739 6.07617 6.77984 6.07617 7.64636C6.07617 8.51287 6.77862 9.21532 7.64514 9.21532Z" stroke="COLOR_PLACEHOLDER" stroke-width="1.17672"/>
    <path d="M10.7837 12.3531C10.7837 13.22 10.7837 13.9221 7.64574 13.9221C4.50781 13.9221 4.50781 13.22 4.50781 12.3531C4.50781 11.4863 5.91204 10.7842 7.64574 10.7842C9.37945 10.7842 10.7837 11.4863 10.7837 12.3531Z" stroke="COLOR_PLACEHOLDER" stroke-width="1.17672"/>
    <path d="M17.844 9.99974C17.844 12.958 17.844 14.4376 16.9245 15.3562C16.0051 16.2748 14.5264 16.2756 11.5681 16.2756H8.43016C5.47187 16.2756 3.99234 16.2756 3.07371 15.3562C2.15508 14.4368 2.1543 12.958 2.1543 9.99974C2.1543 7.04145 2.1543 5.56192 3.07371 4.64329C3.99312 3.72466 5.47187 3.72388 8.43016 3.72388H11.5681C14.5264 3.72388 16.0059 3.72388 16.9245 4.64329C17.2932 5.012 17.5137 5.47014 17.6463 6.07733M15.4905 9.99974H12.3526M15.4905 7.64629H11.5681M15.4905 12.3532H13.1371" stroke="COLOR_PLACEHOLDER" stroke-width="1.17672" stroke-linecap="round"/>
  </svg>`;

  const schoolIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="16" viewBox="0 0 18 16" fill="none">
    <path d="M17.248 5.3103L17.248 10.6896" stroke="COLOR_PLACEHOLDER" stroke-width="1.34483" stroke-linecap="round"/>
    <path d="M8.81672 0.910417L0.943584 4.45333C0.591158 4.61192 0.591158 5.11232 0.943584 5.27091L8.81672 8.81382C8.9337 8.86647 9.06764 8.86647 9.18463 8.81382L17.0578 5.27091C17.4102 5.11232 17.4102 4.61192 17.0578 4.45333L9.18463 0.910417C9.06764 0.857773 8.9337 0.857773 8.81672 0.910417Z" stroke="COLOR_PLACEHOLDER" stroke-width="1.34483"/>
    <path d="M3.17188 6.20679V12.1958C3.17188 12.3707 3.27354 12.5296 3.4323 12.6028L8.81161 15.0856C8.9308 15.1406 9.06812 15.1406 9.18732 15.0856L14.5666 12.6028C14.7254 12.5296 14.827 12.3707 14.827 12.1958V6.20679" stroke="COLOR_PLACEHOLDER" stroke-width="1.34483"/>
  </svg>`;

  // 색상에 따라 SVG 아이콘 반환
  const getSvgIcon = (stepId, color) => {
    let svgString;
    if (stepId === 1) svgString = phoneIconSvg;
    else if (stepId === 2) svgString = idIconSvg;
    else svgString = schoolIconSvg;
    
    return svgString.replace(/COLOR_PLACEHOLDER/g, color);
  };
  
  const getStepStatus = (stepId) => {
    // 실제 인증 완료 상태 확인
    const isPhoneVerified = signupData?.phoneVerified || false;
    const isIdVerified = signupData?.idVerified || false;
    
    if (stepId === 1) {
      return isPhoneVerified ? 'completed' : 'current';
    } else if (stepId === 2) {
      if (isIdVerified) return 'completed';
      // 이전 단계 완료 시 현재 진행 중 (검정 배경)
      return isPhoneVerified ? 'current' : 'blocked';
    } else if (stepId === 3) {
      // 이전 단계 완료 시 현재 진행 중 (검정 배경)
      return isIdVerified ? 'current' : 'blocked';
    }
    
    return 'blocked';
  };

  const steps = [
    { id: 1, status: getStepStatus(1) },
    { id: 2, status: getStepStatus(2) },
    { id: 3, status: getStepStatus(3) },
  ];

  const handleStepPress = (stepId) => {
    const stepStatus = getStepStatus(stepId);
    const canAccess = stepStatus === 'current' || stepStatus === 'completed';
    
    // 현재 단계 또는 완료된 단계로만 이동 가능
    if (canAccess && onStepPress) {
      onStepPress(stepId);
    }
  };

  return (
    <View style={styles.container}>
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <TouchableOpacity
            style={[
              styles.iconContainer,
              step.status === 'completed' && styles.iconContainerCompleted,
              step.status === 'current' && styles.iconContainerCurrent,
              step.status === 'blocked' && styles.iconContainerBlocked,
              (step.status === 'completed' || step.status === 'current') && styles.iconContainerClickable
            ]}
            onPress={() => handleStepPress(step.id)}
            disabled={step.status === 'blocked'}
          >
            <SvgXml 
              xml={getSvgIcon(step.id, 
                step.status === 'completed' ? '#FFFFFF' : 
                step.status === 'current' ? '#FFFFFF' : '#999999'
              )}
              width={step.id === 2 ? 20 : 18}
              height={step.id === 2 ? 20 : (step.id === 3 ? 16 : 18)}
            />
          </TouchableOpacity>
          {index < steps.length - 1 && (
            <View style={styles.connector} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  iconContainerCompleted: {
    backgroundColor: '#FC6339',
    borderColor: '#FC6339',
  },
  iconContainerCurrent: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  iconContainerBlocked: {
    backgroundColor: '#E0E0E0',
    borderColor: '#E0E0E0',
  },
  connector: {
    width: 10,
    height: 2,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 0,
  },
  iconContainerClickable: {
    opacity: 1,
  },
});