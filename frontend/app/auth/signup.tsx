import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function SignupScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('오류', '모든 필드를 입력해주세요.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('오류', '비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('오류', '비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    setLoading(true);
    try {
      // TODO: API 호출 구현
      // await signupAPI(name, email, password);
      
      Alert.alert(
        '회원가입 완료',
        '계정이 성공적으로 생성되었습니다. 로그인해주세요.',
        [
          {
            text: '확인',
            onPress: () => router.replace('/auth/login'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('회원가입 실패', '다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    router.replace('/auth/login');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* 로고 및 헤더 */}
          <View style={styles.header}>
            <Text style={styles.logo}>Uni-con</Text>
            <Text style={styles.subtitle}>새로운 룸메이트 여정을 시작하세요</Text>
          </View>

          {/* 회원가입 폼 */}
          <View style={styles.formContainer}>
            <View style={styles.form}>
              <Text style={styles.formTitle}>회원가입</Text>
              <Text style={styles.formSubtitle}>새 계정을 만들어보세요</Text>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>이름</Text>
                <TextInput
                  style={styles.input}
                  placeholder="이름을 입력하세요"
                  placeholderTextColor="#9CA3AF"
                  value={name}
                  onChangeText={setName}
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>이메일</Text>
                <TextInput
                  style={styles.input}
                  placeholder="이메일을 입력하세요"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>비밀번호</Text>
                <TextInput
                  style={styles.input}
                  placeholder="비밀번호를 입력하세요 (6자 이상)"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>비밀번호 확인</Text>
                <TextInput
                  style={styles.input}
                  placeholder="비밀번호를 다시 입력하세요"
                  placeholderTextColor="#9CA3AF"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={[styles.signupButton, loading && styles.signupButtonDisabled]}
                onPress={handleSignup}
                disabled={loading}
              >
                <Text style={styles.signupButtonText}>
                  {loading ? '계정 생성 중...' : '회원가입'}
                </Text>
              </TouchableOpacity>

              <View style={styles.authSwitch}>
                <Text style={styles.authSwitchText}>이미 계정이 있으신가요?</Text>
                <TouchableOpacity onPress={goToLogin}>
                  <Text style={styles.authSwitchLink}>로그인</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  formTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  formSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    backgroundColor: '#F9FAFB',
  },
  signupButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  signupButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  signupButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  authSwitch: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authSwitchText: {
    color: '#6B7280',
    fontSize: 16,
    marginRight: 4,
  },
  authSwitchLink: {
    color: '#667eea',
    fontSize: 16,
    fontWeight: '600',
  },
});