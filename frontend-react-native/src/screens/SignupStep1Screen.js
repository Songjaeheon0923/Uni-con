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
import { useSignup } from '../contexts/SignupContext';

export default function SignupStep1Screen({ navigation }) {
  const { signupData, updateStep1Data } = useSignup();
  const [email, setEmail] = useState(signupData.email || '');
  const [password, setPassword] = useState(signupData.password || '');
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

  const handleNext = () => {
    if (!validateForm()) return;

    // 1단계 데이터를 Context에 저장
    updateStep1Data({ email, password });
    
    // 2단계로 이동 (API 호출 없이)
    navigation.navigate('SignupStep2');
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

          {/* 메인 컨텐츠 */}
          <View style={styles.content}>
            {/* 헤더 텍스트 */}
            <View style={styles.headerContainer}>
              <Text style={styles.headerTitle}>WEROOM에 오신걸 환영합니다.</Text>
              <Text style={styles.headerSubtitle}>서비스이용을 위해 회원가입 해주세요.</Text>
            </View>

            {/* 입력 폼 */}
            <View style={styles.formContainer}>
              {/* 이메일 입력 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={[styles.inputContainer, {paddingHorizontal: 16}]}
                  placeholder="Example@email.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              {/* 비밀번호 입력 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>비밀번호</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="비밀번호 입력(영문, 숫자, 특수문자 포함 8-20자)"
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
              </View>

              {/* 비밀번호 확인 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>비밀번호 확인</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="비밀번호 재입력"
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
              </View>

              {/* 다음 버튼 */}
              <TouchableOpacity 
                style={styles.nextButton}
                onPress={handleNext}
              >
                <Text style={styles.nextButtonText}>본인 인증하기</Text>
              </TouchableOpacity>

              {/* 개발용 건너뛰기 버튼 */}
              <TouchableOpacity 
                style={styles.devSkipButton}
                onPress={() => {
                  updateStep1Data({ 
                    email: 'dev@test.com', 
                    password: 'devpassword123' 
                  });
                  navigation.navigate('SignupStep2');
                }}
              >
                <Text style={styles.devSkipButtonText}>🚀 개발용: 2단계로 건너뛰기</Text>
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
    textAlign: 'left',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'left',
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    height: 50,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    backgroundColor: 'transparent',
    fontSize: 14,
    color: '#333',
    paddingVertical: 16,
  },
  eyeIcon: {
    padding: 8,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    backgroundColor: '#666666',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
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
  devSkipButton: {
    backgroundColor: '#FF9500',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#FF9500',
  },
  devSkipButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});