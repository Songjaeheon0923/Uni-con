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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Logo from '../components/Logo';
import ApiService from '../services/api';

export default function SignupScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    if (!email.trim()) {
      Alert.alert('알림', '이메일을 입력해주세요.');
      return false;
    }

    if (!email.includes('@')) {
      Alert.alert('알림', '올바른 이메일 형식을 입력해주세요.');
      return false;
    }

    if (!password.trim()) {
      Alert.alert('알림', '비밀번호를 입력해주세요.');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('알림', '비밀번호는 6자 이상이어야 합니다.');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('알림', '비밀번호가 일치하지 않습니다.');
      return false;
    }

    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const response = await ApiService.initialSignup(email, password);
      // 휴대폰 인증 화면으로 이동하며 user_id와 초기 정보 전달
      navigation.navigate('SignupStep2', {
        userId: response.user_id,
        email: email,
        password: password
      });
    } catch (error) {
      if (error.message.includes('400') || error.message.includes('already registered')) {
        Alert.alert('회원가입 실패', '이미 등록된 이메일입니다.');
      } else {
        Alert.alert('회원가입 실패', '회원가입 중 오류가 발생했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* 헤더 */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.title}>회원가입</Text>
            <View style={styles.placeholder} />
          </View>

          {/* 안내 텍스트 */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>WEROOM 가입하기</Text>
            <Text style={styles.infoSubtitle}>나만의 룸메이트를 찾아보세요</Text>
          </View>

          {/* 회원가입 폼 */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="이메일"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="비밀번호 (6자 이상)"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
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

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="비밀번호 확인"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons
                  name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                  size={22}
                  color="#333"
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.signupButton, isLoading && styles.signupButtonDisabled]}
              onPress={handleSignup}
              disabled={isLoading}
            >
              <Text style={styles.signupButtonText}>
                {isLoading ? '처리 중...' : '본인 인증하기'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 로그인 링크 */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>이미 계정이 있으신가요? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>로그인</Text>
            </TouchableOpacity>
          </View>

          {/* 개발용 테스트 버튼 */}
          <View style={styles.testContainer}>
            <TouchableOpacity
              style={styles.testButton}
              onPress={() => {
                setEmail('test@example.com');
                setPassword('password123');
                setConfirmPassword('password123');
              }}
            >
              <Text style={styles.testButtonText}>테스트 데이터로 채우기</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingVertical: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingTop: 10,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40, // backButton과 같은 크기
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  infoTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6600',
    marginBottom: 8,
  },
  infoSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 16,
  },
  eyeIcon: {
    padding: 8,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
    minHeight: 40,
  },
  signupButton: {
    backgroundColor: '#FF6600',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#FF6600',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  signupButtonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0.1,
  },
  signupButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 14,
    color: '#666',
  },
  loginLink: {
    fontSize: 14,
    color: '#FF6600',
    fontWeight: '600',
  },
  testContainer: {
    marginTop: 30,
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
});
