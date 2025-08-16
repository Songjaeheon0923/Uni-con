import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSignup } from '../contexts/SignupContext';

export default function SignupStep2Screen({ navigation }) {
  const { signupData, updateStep2Data } = useSignup();
  const [name, setName] = useState(signupData.name || '');
  const [nationality, setNationality] = useState(signupData.nationality || '내국인');
  const [showNationalityDropdown, setShowNationalityDropdown] = useState(false);
  const [residentNumber1, setResidentNumber1] = useState(signupData.residentNumber1 || '');
  const [residentNumber2, setResidentNumber2] = useState(signupData.residentNumber2 || '');
  const [phoneNumber, setPhoneNumber] = useState(signupData.phoneNumber || '');
  const [carrier, setCarrier] = useState(signupData.carrier || '통신사');
  const [showCarrierDropdown, setShowCarrierDropdown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationCode, setShowVerificationCode] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerified, setIsVerified] = useState(signupData.phoneVerified || false);

  const residentNumberRef = useRef(null);

  const nationalities = ['내국인', '외국인'];
  const carriers = ['SKT', 'KT', 'LG U+'];

  const handleNationalitySelect = (selectedNationality) => {
    setNationality(selectedNationality);
    setShowNationalityDropdown(false);
  };

  const handleCarrierSelect = (selectedCarrier) => {
    setCarrier(selectedCarrier);
    setShowCarrierDropdown(false);
  };

  const formatResidentNumber1 = (value) => {
    const numbers = value.replace(/[^\d]/g, '');
    return numbers.slice(0, 6);
  };

  const formatResidentNumber2 = (value) => {
    const numbers = value.replace(/[^\d]/g, '');
    return numbers.slice(0, 1);
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
      
      // 2단계 데이터를 Context에 저장
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
    
    // 현재 입력된 데이터 저장
    updateStep2Data({
      name,
      nationality,
      residentNumber1,
      residentNumber2,
      phoneNumber,
      carrier,
      phoneVerified: true,
    });
    
    // 신분증 인증으로 이동
    navigation.navigate('IDVerification');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* 뒤로가기 버튼 */}
          <View style={styles.backButtonContainer}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          {/* 진행 상태 표시 */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressDot, styles.progressCompleted]} />
            <View style={styles.progressDot} />
            <View style={styles.progressDot} />
          </View>

          {/* 메인 컨텐츠 */}
          <View style={styles.content}>
            {/* 헤더 텍스트 */}
            <View style={styles.headerContainer}>
              <Text style={styles.headerTitle}>휴대본 인증</Text>
              <Text style={styles.headerSubtitle}>안전한 서비스이용을 위해 본인인증 해주세요.</Text>
            </View>

            {/* 입력 폼 */}
            <View style={styles.formContainer}>
              {/* 이름 입력 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>이름</Text>
                <View style={styles.nameInputContainer}>
                  <TextInput
                    style={[styles.input, styles.nameInput]}
                    placeholder=""
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    autoCorrect={false}
                  />
                  <View style={styles.nationalityContainer}>
                    <TouchableOpacity 
                      style={styles.nationalityDropdown}
                      onPress={() => setShowNationalityDropdown(!showNationalityDropdown)}
                    >
                      <Text style={styles.nationalityText}>{nationality}</Text>
                      <Ionicons name="chevron-down" size={14} color="#999" />
                    </TouchableOpacity>
                    
                    {showNationalityDropdown && (
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
                    )}
                  </View>
                </View>
              </View>

              {/* 주민등록번호 입력 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>주민등록번호 앞 7자리</Text>
                <TouchableOpacity 
                  style={styles.residentNumberContainer}
                  onPress={() => residentNumberRef.current?.focus()}
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
                <View style={styles.phoneContainer}>
                  <View style={styles.carrierContainer}>
                    <TouchableOpacity 
                      style={styles.carrierButton}
                      onPress={() => setShowCarrierDropdown(!showCarrierDropdown)}
                    >
                      <Text style={[styles.carrierText, carrier === '통신사' && styles.placeholderText]}>
                        {carrier}
                      </Text>
                      <Ionicons name="chevron-down" size={14} color="#999" />
                    </TouchableOpacity>
                    
                    {showCarrierDropdown && (
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
                    )}
                  </View>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="전화번호를 입력해주세요"
                    value={phoneNumber}
                    onChangeText={(text) => setPhoneNumber(formatPhoneNumber(text))}
                    keyboardType="phone-pad"
                    maxLength={13}
                  />
                </View>
              </View>

              {/* 인증하기 버튼 */}
              {!showVerificationCode && (
                <TouchableOpacity 
                  style={styles.verifyButton}
                  onPress={handleVerifyPhone}
                >
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
                  (!isVerified || isLoading) && styles.nextButtonDisabled
                ]}
                onPress={handleNext}
                disabled={!isVerified || isLoading}
              >
                <Text style={styles.nextButtonText}>
                  {isLoading ? '처리중...' : '다음'}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
              </TouchableOpacity>

            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  backButtonContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 20,
    gap: 8,
  },
  progressDot: {
    width: 30,
    height: 31,
    borderRadius: 15.5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C6C6C6',
  },
  progressCompleted: {
    backgroundColor: '#A0A0A0',
    borderColor: '#C6C6C6',
  },
  progressActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#C6C6C6',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerContainer: {
    alignItems: 'flex-start',
    marginBottom: 40,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  formContainer: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 9,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#000',
    borderWidth: 1,
    borderColor: '#000000',
    height: 45,
  },
  nameInput: {
    flex: 1,
    marginRight: 6,
  },
  nameInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nationalityContainer: {
    position: 'relative',
  },
  nationalityDropdown: {
    backgroundColor: '#EEEEEE',
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: 105,
    height: 45,
    justifyContent: 'center',
  },
  nationalityText: {
    fontSize: 15,
    color: '#8F8F8F',
    fontWeight: '400',
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
  dropdown: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    height: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 14,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
  },
  dropdownMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginTop: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    width: 32,
    height: 38,
    backgroundColor: '#FFFFFF',
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    marginHorizontal: 1,
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
    marginHorizontal: 12,
  },
  dash: {
    fontSize: 24,
    color: '#999999',
    fontWeight: '300',
  },
  hiddenInput: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    width: 1,
    height: 1,
    opacity: 0,
  },
  phoneContainer: {
    flexDirection: 'row',
    gap: 10,
    height: 45,
  },
  carrierContainer: {
    position: 'relative',
  },
  carrierButton: {
    backgroundColor: '#EEEEEE',
    borderRadius: 9,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    minWidth: 90,
    height: 45,
  },
  carrierText: {
    fontSize: 15,
    color: '#8F8F8F',
    fontWeight: '400',
  },
  carrierDropdownMenu: {
    position: 'absolute',
    top: 50,
    left: 0,
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
    minWidth: 90,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 9,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#000',
    borderWidth: 1,
    borderColor: '#D9D9D9',
  },
  nextButton: {
    backgroundColor: '#666666',
    borderRadius: 8,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 40,
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
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  verifyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  verificationContainer: {
    gap: 8,
    marginTop: 20,
  },
  verificationInputContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  verificationInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 9,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#000',
    borderWidth: 1,
    borderColor: '#D9D9D9',
    height: 45,
  },
  confirmButton: {
    backgroundColor: '#28A745',
    borderRadius: 8,
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
});