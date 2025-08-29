import { useState } from 'react';
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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSignup } from '../contexts/SignupContext';
import ApiService from '../services/api';

export default function SchoolVerificationScreen({ navigation }) {
  const { signupData, updateSchoolVerificationData, getFullResidentNumber, clearSignupData } = useSignup();
  const [schoolEmail, setSchoolEmail] = useState(signupData.schoolEmail || '');
  const [isLoading, setIsLoading] = useState(false);
  const [showVerificationCode, setShowVerificationCode] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);

  const validateSchoolEmail = () => {
    if (!schoolEmail.trim()) {
      Alert.alert('알림', '학교 이메일을 입력해주세요.');
      return false;
    }

    if (!schoolEmail.includes('@')) {
      Alert.alert('알림', '올바른 이메일 형식을 입력해주세요.');
      return false;
    }

    // 학교 이메일 도메인 체크
    const schoolDomains = ['.ac.kr', '.edu', 'university', 'univ'];
    const isSchoolEmail = schoolDomains.some(domain => 
      schoolEmail.toLowerCase().includes(domain)
    );

    if (!isSchoolEmail) {
      Alert.alert('알림', '학교 이메일 주소를 입력해주세요.\n(예: @university.ac.kr, @univ.edu)');
      return false;
    }

    return true;
  };

  const handleVerifySchool = () => {
    if (!validateSchoolEmail()) return;
    
    setShowVerificationCode(true);
    Alert.alert('인증번호 전송', '학교 이메일로 인증번호가 전송되었습니다.');
  };

  const handleConfirmVerification = () => {
    if (verificationCode === '0000') {
      setIsVerified(true);
      
      // 학교 인증 정보 저장
      updateSchoolVerificationData({
        schoolEmail,
      });
      
      Alert.alert('인증 완료', '학교 인증이 완료되었습니다!');
    } else {
      Alert.alert('인증 실패', '인증번호가 올바르지 않습니다. (0000을 입력해주세요)');
    }
  };

  const handleSignupComplete = async () => {
    setIsLoading(true);
    try {
      // 최종 회원가입 데이터 준비
      const completeSignupData = {
        email: signupData.email,
        password: signupData.password,
        name: signupData.name,
        nationality: signupData.nationality,
        resident_number: getFullResidentNumber(),
        phone_number: signupData.phoneNumber,
        carrier: signupData.carrier,
        school_email: isVerified ? schoolEmail : '',
      };

      console.log('최종 회원가입 데이터:', completeSignupData);
      
      // 필수 필드 검증
      const requiredFields = ['email', 'password', 'name', 'nationality', 'resident_number', 'phone_number', 'carrier'];
      for (const field of requiredFields) {
        if (!completeSignupData[field] || completeSignupData[field].toString().trim() === '') {
          throw new Error(`필수 필드가 누락되었습니다: ${field}`);
        }
      }

      // 모든 정보를 한 번에 전송하여 회원가입 완료
      const response = await ApiService.completeSignup(completeSignupData);

      // 회원가입 데이터 초기화
      await clearSignupData();

      Alert.alert(
        '회원가입 성공', 
        '모든 인증이 완료되었습니다!\n로그인 페이지로 이동합니다.',
        [
          { text: '확인', onPress: () => navigation.navigate('Login') }
        ]
      );
    } catch (error) {
      console.error('회원가입 완료 오류:', error);
      
      // API 에러 상세 정보 로그
      if (error.response && error.response.data) {
        console.error('API error details:', error.response.data);
      }
      
      let errorMessage = '회원가입 완료 중 오류가 발생했습니다.';
      if (error.response && error.response.data && error.response.data.detail) {
        if (Array.isArray(error.response.data.detail)) {
          // Pydantic validation error의 경우
          const errors = error.response.data.detail.map(err => `${err.loc.join('.')}: ${err.msg}`).join('\n');
          errorMessage = `입력 데이터 오류:\n${errors}`;
        } else {
          errorMessage = error.response.data.detail;
        }
      }
      
      Alert.alert('회원가입 실패', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    Alert.alert(
      '학교 인증 건너뛰기',
      '학교 인증을 건너뛰고 회원가입을 완료하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '건너뛰기', 
          onPress: () => {
            // 학교 인증 건너뛰기 처리
            updateSchoolVerificationData({
              schoolEmail: '',
            });
            handleSignupComplete();
          }
        }
      ]
    );
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
            <Image 
              source={require('../../assets/stage3.png')} 
              style={styles.stageImage}
              resizeMode="contain"
            />
          </View>

          {/* 메인 컨텐츠 */}
          <View style={styles.content}>
            {/* 헤더 텍스트 */}
            <View style={styles.headerContainer}>
              <Text style={styles.headerTitle}>학교 인증</Text>
              <Text style={styles.headerSubtitle}>학교로 인증이 필요 메일을 보내드려요!</Text>
            </View>

            {/* 입력 폼 */}
            <View style={styles.formContainer}>
              {/* 학교 이메일 입력 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>학교 Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Example@ac.kr"
                  value={schoolEmail}
                  onChangeText={setSchoolEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* 인증 요청 버튼 */}
              {!showVerificationCode && (
                <TouchableOpacity 
                  style={styles.verifyButton}
                  onPress={handleVerifySchool}
                >
                  <Text style={styles.verifyButtonText}>인증 요청</Text>
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

              {/* 안내 텍스트 */}
              <View style={styles.infoContainer}>
                <Text style={styles.infoText}>
                  • 학교에서 발급받은 이메일 주소를 입력해주세요{'\n'}
                  • 일반적으로 @university.ac.kr, @univ.edu 형태입니다{'\n'}
                  • 인증 메일이 발송되어 확인 후 가입이 완료됩니다
                </Text>
              </View>

              {/* 건너뛰기 / 회원가입 완료 버튼 */}
              <TouchableOpacity 
                style={[
                  styles.nextButton,
                  isVerified && styles.nextButtonVerified,
                  isLoading && styles.nextButtonDisabled
                ]}
                onPress={isVerified ? handleSignupComplete : handleSkip}
                disabled={isLoading}
              >
                <Text style={styles.nextButtonText}>
                  {isLoading ? '처리중...' : (isVerified ? '회원가입 완료하기' : '건너뛰기')}
                </Text>
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
    paddingHorizontal: 16,
  },
  stageImage: {
    width: 165,
    height: 48,
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
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    height: 50,
  },
  infoContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginTop: 10,
  },
  infoText: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 18,
  },
  nextButton: {
    backgroundColor: '#666666',
    borderRadius: 40,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  nextButtonVerified: {
    backgroundColor: '#000',
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
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
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
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    height: 50,
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