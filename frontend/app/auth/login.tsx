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

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('오류', '이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      // TODO: API 호출 구현
      // await loginAPI(email, password);
      
      // 임시로 홈 화면으로 이동
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('로그인 실패', '아이디 또는 비밀번호를 확인해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const goToSignup = () => {
    router.push('/auth/signup');
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
            <Text style={styles.subtitle}>완벽한 룸메이트를 찾아보세요</Text>
          </View>

          {/* 로그인 폼 */}
          <View style={styles.formContainer}>
            <View style={styles.form}>
              <Text style={styles.formTitle}>로그인</Text>
              <Text style={styles.formSubtitle}>계정에 로그인하세요</Text>

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
                  placeholder="비밀번호를 입력하세요"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={loading}
              >
                <Text style={styles.loginButtonText}>
                  {loading ? '로그인 중...' : '로그인'}
                </Text>
              </TouchableOpacity>

              <View style={styles.authSwitch}>
                <Text style={styles.authSwitchText}>계정이 없으신가요?</Text>
                <TouchableOpacity onPress={goToSignup}>
                  <Text style={styles.authSwitchLink}>회원가입</Text>
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
    marginBottom: 60,
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
    marginBottom: 24,
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
  loginButton: {
    backgroundColor: '#667eea',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  loginButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  loginButtonText: {
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