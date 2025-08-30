import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSignup } from '../contexts/SignupContext';

export default function PhoneVerificationStep({ onNext }) {
  const { signupData, updateStep2Data } = useSignup();
  const [name, setName] = useState(signupData.name || '');
  const [nationality, setNationality] = useState(signupData.nationality || '내국인');
  const [showNationalityDropdown, setShowNationalityDropdown] = useState(false);
  const [residentNumber1, setResidentNumber1] = useState(signupData.residentNumber1 || '');
  const [residentNumber2, setResidentNumber2] = useState(signupData.residentNumber2 || '');
  const [phoneNumber, setPhoneNumber] = useState(signupData.phoneNumber || '');
  const [carrier, setCarrier] = useState(signupData.carrier || '통신사');
  const [showCarrierDropdown, setShowCarrierDropdown] = useState(false);
  const [showVerificationCode, setShowVerificationCode] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  const residentNumberRef = useRef(null);
  const phoneInputRef = useRef(null);
  const scrollViewRef = useRef(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const nationalities = ['내국인', '외국인'];
  const carriers = ['SKT', 'KT', 'LG U+'];

  // 키보드 이벤트 리스너
  React.useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardVisible(true);
    });

    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // 입력 필드 포커스 시 자동 스크롤
  const scrollToInput = (inputRef) => {
    if (inputRef.current && scrollViewRef.current) {
      setTimeout(() => {
        inputRef.current.measure((fx, fy, width, height, px, py) => {
          const screenHeight = Dimensions.get('window').height;
          const keyboardHeight = Platform.OS === 'ios' ? 290 : 250; // 대략적인 키보드 높이
          const inputBottom = py + height;
          const visibleAreaHeight = screenHeight - keyboardHeight;

          if (inputBottom > visibleAreaHeight - 50) { // 50px 여유 공간
            const scrollOffset = inputBottom - visibleAreaHeight + 100; // 100px 여유 공간
            scrollViewRef.current.scrollTo({
              y: scrollOffset,
              animated: true,
            });
          }
        });
      }, 100);
    }
  };

  // 빈 공간 터치 시 키보드 dismiss
  const handleEmptyAreaPress = () => {
    if (keyboardVisible) {
      Keyboard.dismiss();
    }
  };

  const handleNationalitySelect = (selectedNationality) => {
    setNationality(selectedNationality);
    setShowNationalityDropdown(false);
  };

  const handleCarrierSelect = (selectedCarrier) => {
    setCarrier(selectedCarrier);
    setShowCarrierDropdown(false);
  };

  const formatPhoneNumber = (value) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  const handleVerifyPhone = () => {
    if (!name.trim()) {
      Alert.alert('알림', '이름을 입력해주세요.');
      return;
    }
    if (residentNumber1.length !== 6 || residentNumber2.length !== 1) {
      Alert.alert('알림', '주민등록번호를 정확히 입력해주세요.');
      return;
    }
    if (!phoneNumber.trim()) {
      Alert.alert('알림', '전화번호를 입력해주세요.');
      return;
    }
    if (carrier === '통신사') {
      Alert.alert('알림', '통신사를 선택해주세요.');
      return;
    }

    setShowVerificationCode(true);
    Alert.alert('인증번호 전송', '인증번호가 전송되었습니다.');
  };

  const handleConfirmVerification = () => {
    if (verificationCode === '0000') {
      setIsVerified(true);

      updateStep2Data({
        name,
        nationality,
        residentNumber1,
        residentNumber2,
        phoneNumber,
        carrier,
        phoneVerified: true,
      });

      Alert.alert('인증 완료', '휴대폰 인증이 완료되었습니다!');
    } else {
      Alert.alert('인증 실패', '인증번호가 올바르지 않습니다. (0000을 입력해주세요)');
    }
  };

  const handleNext = () => {
    if (!isVerified) {
      Alert.alert('알림', '휴대폰 인증을 완료해주세요.');
      return;
    }

    updateStep2Data({
      name,
      nationality,
      residentNumber1,
      residentNumber2,
      phoneNumber,
      carrier,
      phoneVerified: true,
    });

    onNext();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardAvoid}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="always"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled={true}
      >
          <View style={styles.content}>
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>휴대폰 인증</Text>
            <Text style={styles.headerSubtitle}>안전한 서비스이용을 위해 본인인증 해주세요.</Text>
          </View>

          <View style={styles.formContainer}>
            {/* 이름 입력 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>이름</Text>
              <View style={styles.nameInputContainer}>
                <TextInput
                  style={[styles.input, styles.nameInput]}
                  placeholder="이름"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
                <View style={styles.nationalityContainer}>
                  <TouchableOpacity
                    style={[
                      styles.nationalityDropdown,
                      showNationalityDropdown && styles.nationalityDropdownActive
                    ]}
                    onPress={() => setShowNationalityDropdown(!showNationalityDropdown)}
                  >
                    <Text style={[
                      styles.nationalityText,
                      showNationalityDropdown && styles.nationalityTextActive
                    ]}>{nationality}</Text>
                    <Ionicons 
                      name="chevron-down" 
                      size={14} 
                      color={showNationalityDropdown ? "#000" : "#999"} 
                    />
                  </TouchableOpacity>

                  {showNationalityDropdown && (
                    <>
                      <TouchableOpacity
                        style={styles.modalOverlay}
                        activeOpacity={1}
                        onPress={() => setShowNationalityDropdown(false)}
                      />
                      <View style={styles.nationalityDropdownMenu}>
                        {nationalities.map((item, index) => (
                          <TouchableOpacity
                            key={index}
                            style={styles.dropdownItem}
                            onPress={() => handleNationalitySelect(item)}
                          >
                            <Text style={styles.dropdownItemText}>{item}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </>
                  )}
                </View>
              </View>
            </View>

            {/* 주민등록번호 입력 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>주민등록번호 앞 7자리</Text>
              <TouchableOpacity
                style={styles.residentNumberContainer}
                onPress={() => {
                  residentNumberRef.current?.focus();
                  scrollToInput(residentNumberRef);
                }}
              >
                <View style={styles.residentNumber1Container}>
                  {[...Array(6)].map((_, index) => (
                    <View key={index} style={[styles.digitInput, residentNumber1.length === index && styles.activeDigit]}>
                      <Text style={styles.digitText}>
                        {residentNumber1[index] || ''}
                      </Text>
                    </View>
                  ))}
                </View>
                <View style={styles.dashContainer}>
                  <Text style={styles.dash}>-</Text>
                </View>
                <View style={styles.residentNumber2Container}>
                  <View style={[styles.digitInput, residentNumber1.length === 6 && residentNumber2.length === 0 && styles.activeDigit]}>
                    <Text style={styles.digitText}>
                      {residentNumber2[0] || ''}
                    </Text>
                  </View>
                  {[...Array(6)].map((_, index) => (
                    <View key={index} style={styles.disabledDigit}>
                      <Text style={styles.disabledDigitText}>●</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
              <TextInput
                ref={residentNumberRef}
                style={styles.hiddenInput}
                value={residentNumber1 + residentNumber2}
                onChangeText={(text) => {
                  const numbers = text.replace(/[^\d]/g, '');
                  if (numbers.length <= 6) {
                    setResidentNumber1(numbers);
                    setResidentNumber2('');
                  } else {
                    setResidentNumber1(numbers.slice(0, 6));
                    setResidentNumber2(numbers.slice(6, 7));
                  }
                }}
                keyboardType="numeric"
                maxLength={7}
              />
            </View>

            {/* 전화번호 입력 */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>전화번호</Text>
              <TouchableOpacity
                style={styles.phoneOutlineContainer}
                onPress={() => {
                  phoneInputRef.current?.focus();
                  scrollToInput(phoneInputRef);
                }}
              >
                <View style={styles.phoneInnerContainer}>
                  <View style={styles.carrierContainer}>
                    <TouchableOpacity
                      style={styles.carrierButton}
                      onPress={() => setShowCarrierDropdown(!showCarrierDropdown)}
                    >
                      <Text style={[
                        styles.carrierText, 
                        carrier === '통신사' && styles.placeholderText,
                        showCarrierDropdown && styles.carrierTextActive
                      ]}>
                        {carrier}
                      </Text>
                      <Ionicons 
                        name="chevron-down" 
                        size={14} 
                        color={showCarrierDropdown ? "#000000" : (carrier === '통신사' ? "#999" : "#3F3F3F")} 
                      />
                    </TouchableOpacity>

                    {showCarrierDropdown && (
                      <>
                        <TouchableOpacity
                          style={styles.modalOverlay}
                          activeOpacity={1}
                          onPress={() => setShowCarrierDropdown(false)}
                        />
                        <View style={styles.carrierDropdownMenu}>
                          {carriers.map((item, index) => (
                            <TouchableOpacity
                              key={index}
                              style={styles.dropdownItem}
                              onPress={() => handleCarrierSelect(item)}
                            >
                              <Text style={styles.dropdownItemText}>{item}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </>
                    )}
                  </View>
                  <TextInput
                    ref={phoneInputRef}
                    style={[styles.phoneInputVisible, phoneNumber && styles.phoneInputText]}
                    value={phoneNumber}
                    onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
                    keyboardType="phone-pad"
                    maxLength={13}
                    placeholder="전화번호를 입력해주세요"
                    placeholderTextColor="#8F8F8F"
                    onFocus={() => scrollToInput(phoneInputRef)}
                  />
                </View>
              </TouchableOpacity>
            </View>

            {/* 인증하기 버튼 */}
            {!showVerificationCode && (
              <TouchableOpacity
                style={styles.verifyButton}
                onPress={handleVerifyPhone}
              >
                <View style={styles.verifyArrowCircle}>
                  <Ionicons name="arrow-forward" size={35} color="#FFFFFF" />
                </View>
                <Text style={styles.verifyButtonText}>인증하기</Text>
              </TouchableOpacity>
            )}

            {/* 인증번호 입력 */}
            {showVerificationCode && (
              <View style={styles.verificationContainer}>
                <Text style={styles.inputLabel}>인증번호</Text>
                <View style={styles.verificationInputContainer}>
                  <TextInput
                    style={styles.verificationInput}
                    placeholder="인증번호 4자리를 입력해주세요"
                    value={verificationCode}
                    onChangeText={setVerificationCode}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={handleConfirmVerification}
                  >
                    <Text style={styles.confirmButtonText}>확인</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* 다음 버튼 */}
            <TouchableOpacity
              style={[
                styles.nextButton,
                !isVerified && styles.nextButtonDisabled
              ]}
              onPress={handleNext}
              disabled={!isVerified}
            >
              <View style={styles.greenArrowCircle}>
                <Ionicons name="arrow-forward" size={35} color="#FFFFFF" />
              </View>
              <Text style={styles.nextButtonText}>다음</Text>
            </TouchableOpacity>
          </View>

          {/* 키보드 dismiss를 위한 빈 공간 */}
          <TouchableWithoutFeedback onPress={handleEmptyAreaPress}>
            <View style={styles.bottomPadding} />
          </TouchableWithoutFeedback>
          </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  headerContainer: {
    alignItems: 'flex-start',
    marginBottom: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#0C1421',
    marginBottom: 16.88,
    fontFamily: 'Pretendard',
    lineHeight: 30,
    letterSpacing: 0.24,
  },
  headerSubtitle: {
    fontSize: 15.79,
    color: '#313957',
    fontFamily: 'Pretendard',
    fontWeight: '400',
    lineHeight: 25.26,
    letterSpacing: 0.16,
  },
  formContainer: {
    gap: 26,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 13.68,
    color: '#0C1421',
    fontWeight: '400',
    marginBottom: 8.42,
    fontFamily: 'Pretendard',
    lineHeight: 13.68,
    letterSpacing: 0.14,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    paddingHorizontal: 16,
    fontSize: 14.73,
    color: '#000000',
    borderWidth: 1.05,
    borderColor: '#000000',
    height: 45,
    fontFamily: 'Pretendard',
    fontWeight: '400',
    lineHeight: 17,
    letterSpacing: 0.15,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  nameInput: {
    flex: 1,
    marginRight: 6,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  nameInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nationalityContainer: {
    position: 'relative',
  },
  nationalityDropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 105,
    height: 45,
    justifyContent: 'center',
    borderWidth: 1.05,
    borderColor: '#D9D9D9',
  },
  nationalityDropdownActive: {
    borderColor: '#000000',
  },
  modalOverlay: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    zIndex: 999,
  },
  nationalityText: {
    fontSize: 14.73,
    color: '#8F8F8F',
    fontWeight: '400',
    fontFamily: 'Pretendard',
    lineHeight: 14.73,
    letterSpacing: 0.15,
  },
  nationalityTextActive: {
    color: '#000000',
  },
  nationalityDropdownMenu: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1000,
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#333',
  },
  residentNumberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 45,
  },
  residentNumber1Container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  residentNumber2Container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  digitInput: {
    width: 21,
    height: 45,
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.05,
    borderColor: '#D9D9D9',
    marginHorizontal: 2,
  },
  activeDigit: {
    borderColor: '#000000',
  },
  digitText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  dashContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 7,
  },
  dash: {
    fontSize: 32,
    color: '#C1C1C1',
    fontWeight: '200',
    fontFamily: 'Pretendard',
    lineHeight: 32,
    letterSpacing: 0.32,
  },
  hiddenInput: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    width: 1,
    height: 1,
    opacity: 0,
  },
  disabledDigit: {
    width: 21,
    height: 45,
    backgroundColor: '#F0F0F0',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
  },
  disabledDigitText: {
    fontSize: 12,
    color: '#CCCCCC',
    fontWeight: '400',
  },
  phoneOutlineContainer: {
    height: 44.16,
    borderRadius: 100,
    borderWidth: 1.05,
    borderColor: '#D9D9D9',
    backgroundColor: '#FFFFFF',
    zIndex: 3000,
  },
  phoneInnerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 5,
    paddingRight: 10,
    height: 44.96,
    borderRadius: 100,
    justifyContent: 'flex-start',
    gap: 10,
    zIndex: 3000,
  },
  carrierContainer: {
    position: 'relative',
    zIndex: 3000,
  },
  carrierButton: {
    backgroundColor: '#EEEEEE',
    borderRadius: 100,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    minWidth: 70,
    height: 32,
    marginTop: -2,
  },
  carrierButtonActive: {
    backgroundColor: '#000000',
  },
  carrierText: {
    fontSize: 14.73,
    color: '#3F3F3F',
    fontWeight: '400',
    fontFamily: 'Pretendard',
    lineHeight: 14.73,
    letterSpacing: 0.15,
  },
  carrierTextActive: {
    color: '#000000',
  },
  placeholderText: {
    color: '#999',
  },
  carrierDropdownMenu: {
    position: 'absolute',
    top: 35,
    left: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 5000,
    minWidth: 90,
  },
  phoneInputPlaceholder: {
    fontSize: 14.73,
    color: '#8F8F8F',
    fontFamily: 'Pretendard',
    fontWeight: '400',
    lineHeight: 14.73,
    letterSpacing: 0.15,
    flex: 1,
  },
  phoneInputText: {
    color: '#000000',
  },
  phoneInputVisible: {
    fontSize: 14.73,
    color: '#000000',
    fontFamily: 'Pretendard',
    fontWeight: '400',
    lineHeight: 16,
    letterSpacing: 0.15,
    flex: 1,
    paddingTop: 1,
    paddingBottom: 0,
    paddingHorizontal: 0,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  nextButton: {
    backgroundColor: '#000',
    borderRadius: 40,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 40,
  },
  greenArrowCircle: {
    position: 'absolute',
    right: 6,
    width: 43,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#10B585',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#ADB5BD',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  verifyButton: {
    backgroundColor: '#000',
    borderRadius: 40,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 0,
  },
  verifyArrowCircle: {
    position: 'absolute',
    right: 6,
    width: 43,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#10B585',
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  verificationContainer: {
    gap: 8,
  },
  verificationInputContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  verificationInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 50,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#000',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    height: 45,
  },
  confirmButton: {
    backgroundColor: '#000',
    borderRadius: 50,
    paddingHorizontal: 20,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomPadding: {
    height: 100,
    width: '100%',
  },
});
