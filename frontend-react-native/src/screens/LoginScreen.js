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
  Modal,
  FlatList,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Logo from '../components/Logo';
import GoogleIcon from '../components/icons/GoogleIcon';
import KakaoIcon from '../components/icons/KakaoIcon';
import { useAuth } from '../contexts/AuthContext';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState(process.env.EXPO_PUBLIC_EMAIL || '');
  const [password, setPassword] = useState(process.env.EXPO_PUBLIC_PASSWORD || '');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showTestAccountModal, setShowTestAccountModal] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const { login } = useAuth();

  // 테스트 계정 목록
  const testAccounts = [
    { id: 1, email: 'test1@example.com', name: '김민수', password: 'password123' },
    { id: 2, email: 'test2@example.com', name: '박지영', password: 'password123' },
    { id: 3, email: 'test3@example.com', name: '이동욱', password: 'password123' },
  ];

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('알림', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login({ email, password });
      if (result.success) {
        Alert.alert('로그인 성공', `${result.user.name}님 환영합니다!`);
      } else {
        // 모든 로그인 실패는 동일한 메시지로 표시
        Alert.alert('로그인 실패', '이메일 또는 비밀번호가 올바르지 않습니다.');
      }
    } catch (error) {
      // 예외 발생 시에도 콘솔 에러 없이 조용히 처리
      Alert.alert('로그인 실패', '이메일 또는 비밀번호가 올바르지 않습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignupNavigation = () => {
    navigation.navigate('Signup');
  };

  const handleTestAccountSelect = (account) => {
    setEmail(account.email);
    setPassword(account.password);
    setShowTestAccountModal(false);
  };

  const handleGoogleLogin = () => {
    Alert.alert('알림', 'Google 로그인 준비 중입니다.');
  };

  const handleKakaoLogin = () => {
    Alert.alert('알림', '카카오톡 로그인 준비 중입니다.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* 상단 여백 */}
          <View style={styles.backButtonContainer} />

          {/* 메인 컨텐츠 */}
          <View style={styles.content}>
            {/* 헤더 텍스트 */}
            <View style={styles.headerContainer}>
              <View style={styles.logoContainer}>
                <Logo width={112} height={17} />
                <Text style={styles.headerTitle}>에 함께 이루는 공간</Text>
              </View>
              <Text style={styles.headerSubtitle}>
                서비스이용을 위해 로그인 해주세요.
              </Text>
            </View>

            {/* 입력 폼 */}
            <View style={styles.formContainer}>
              {/* 이메일 입력 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={[
                  styles.inputContainer,
                  emailFocused && styles.inputContainerFocused
                ]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Example@email.com"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setEmailFocused(true)}
                    onBlur={() => setEmailFocused(false)}
                  />
                  {email.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setEmail('')}
                      style={styles.clearIcon}
                    >
                      <Ionicons
                        name="close-circle"
                        size={22}
                        color="#999"
                      />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* 비밀번호 입력 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>비밀번호</Text>
                <View style={[
                  styles.inputContainer,
                  passwordFocused && styles.inputContainerFocused
                ]}>
                  <TextInput
                    style={styles.input}
                    placeholder="비밀번호 입력(영문, 숫자, 특수문자 포함 8-20자)"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={22}
                      color="#333"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* 로그인 버튼 */}
              <TouchableOpacity 
                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]} 
                onPress={handleLogin}
                disabled={isLoading}
              >
                <Text style={styles.loginButtonText}>
                  {isLoading ? '로그인 중...' : '로그인'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* 소셜 로그인 */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>다른계정으로 로그인하기</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialContainer}>
              <TouchableOpacity 
                style={styles.socialButton}
                onPress={handleGoogleLogin}
              >
                <GoogleIcon size={20} />
                <Text style={styles.socialButtonText}>Google</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.socialButton, styles.kakaoButton]}
                onPress={handleKakaoLogin}
              >
                <Image 
                  source={require('../../assets/kakao.png')} 
                  style={styles.kakaoIcon}
                />
                <Text style={[styles.socialButtonText, styles.kakaoButtonText]}>카카오톡</Text>
              </TouchableOpacity>
            </View>

            {/* 회원가입 링크 */}
            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>계정이 없으신가요? </Text>
              <TouchableOpacity onPress={handleSignupNavigation}>
                <Text style={styles.signupLink}>회원가입하기</Text>
              </TouchableOpacity>
            </View>

            {/* 개발용 테스트 버튼 */}
            <View style={styles.testContainer}>
              <TouchableOpacity 
                style={styles.testButton}
                onPress={() => setShowTestAccountModal(true)}
              >
                <Text style={styles.testButtonText}>테스트 계정으로 채우기</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 테스트 계정 선택 모달 */}
          <Modal
            visible={showTestAccountModal}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowTestAccountModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>테스트 계정 선택</Text>
                  <TouchableOpacity 
                    onPress={() => setShowTestAccountModal(false)}
                    style={styles.closeButton}
                  >
                    <Ionicons name="close" size={24} color="#666" />
                  </TouchableOpacity>
                </View>
                
                <FlatList
                  data={testAccounts}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={styles.accountItem}
                      onPress={() => handleTestAccountSelect(item)}
                    >
                      <View style={styles.accountInfo}>
                        <Text style={styles.accountName}>{item.name}</Text>
                        <Text style={styles.accountEmail}>{item.email}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </TouchableOpacity>
                  )}
                />
              </View>
            </View>
          </Modal>
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
    paddingTop: 50,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
  logoContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 13,
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: '500',
    color: '#000000',
    textAlign: 'left',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'left',
    lineHeight: 20,
  },
  formContainer: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '300',
    marginBottom: 0,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    height: 45,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    fontSize: 14,
    color: '#333',
    paddingVertical: 0,
    height: 45,
    textAlignVertical: 'center',
  },
  eyeIcon: {
    padding: 8,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearIcon: {
    padding: 8,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButton: {
    backgroundColor: '#000',
    borderRadius: 94,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 21,
  },
  loginButtonDisabled: {
    backgroundColor: '#ADB5BD',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    fontSize: 14,
    color: '#294957',
    marginHorizontal: 16,
  },
  socialContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  socialButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 100,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 6,
    borderWidth: 0.5,
    borderColor: '#000000',
    flexDirection: 'row',
  },
  kakaoButton: {
    backgroundColor: '#FEE500',
    borderColor: '#FEE500',
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  kakaoButtonText: {
    color: '#3C1E1E',
  },
  kakaoIcon: {
    width: 20,
    height: 20,
  },
  inputContainerFocused: {
    backgroundColor: '#FFFFFF',
    borderColor: '#000000',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  signupText: {
    fontSize: 14,
    color: '#666',
  },
  signupLink: {
    fontSize: 14,
    color: '#FC6339',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  testContainer: {
    alignItems: 'center',
  },
  testButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  testButtonText: {
    fontSize: 12,
    color: '#999',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 30,
    maxHeight: 400,
    width: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  accountEmail: {
    fontSize: 14,
    color: '#666',
  },
});