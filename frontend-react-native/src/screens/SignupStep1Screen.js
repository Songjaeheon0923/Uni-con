import { useState } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Logo from "../components/Logo";
import { useSignup } from "../contexts/SignupContext";

export default function SignupStep1Screen({ navigation }) {
  const { signupData, updateStep1Data } = useSignup();
  const [email, setEmail] = useState(signupData.email || "");
  const [password, setPassword] = useState(signupData.password || "");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  const validateForm = () => {
    if (!email.trim()) {
      Alert.alert("알림", "이메일을 입력해주세요.");
      return false;
    }

    if (!email.includes("@")) {
      Alert.alert("알림", "올바른 이메일 형식을 입력해주세요.");
      return false;
    }

    if (!password.trim()) {
      Alert.alert("알림", "비밀번호를 입력해주세요.");
      return false;
    }

    if (password.length < 6) {
      Alert.alert("알림", "비밀번호는 6자 이상이어야 합니다.");
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert("알림", "비밀번호가 일치하지 않습니다.");
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (!validateForm()) return;

    // 1단계 데이터를 Context에 저장
    updateStep1Data({ email, password });

    // 2단계로 이동 (API 호출 없이)
    navigation.navigate("SignupStep2");
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
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
                <Text style={styles.headerTitle}>에 오신걸 환영합니다.</Text>
              </View>
              <Text style={styles.headerSubtitle}>
                서비스이용을 위해 회원가입 해주세요.
              </Text>
            </View>

            {/* 입력 폼 */}
            <View style={styles.formContainer}>
              {/* 이메일 입력 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={[
                    styles.inputContainer, 
                    emailFocused && styles.inputContainerFocused,
                    { paddingHorizontal: 16 }
                  ]}
                  placeholder="Example@email.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                />
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

              {/* 비밀번호 확인 */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>비밀번호 확인</Text>
                <View style={[
                  styles.inputContainer,
                  confirmPasswordFocused && styles.inputContainerFocused
                ]}>
                  <TextInput
                    style={styles.input}
                    placeholder="비밀번호 재입력"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    onFocus={() => setConfirmPasswordFocused(true)}
                    onBlur={() => setConfirmPasswordFocused(false)}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                  >
                    <Ionicons
                      name={
                        showConfirmPassword ? "eye-outline" : "eye-off-outline"
                      }
                      size={22}
                      color="#333"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* 다음 버튼 */}
              <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                <View style={styles.greenArrowCircle}>
                  <Ionicons name="arrow-forward" size={35} color="#FFFFFF" />
                </View>
                <Text style={styles.nextButtonText}>본인 인증하기</Text>
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
    backgroundColor: "#FFFFFF",
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
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerContainer: {
    alignItems: "flex-start",
    marginBottom: 40,
  },
  logoContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 13,
  },
  headerTitle: {
    fontSize: 21,
    fontWeight: "500",
    color: "#000000",
    textAlign: "left",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#666666",
    textAlign: "left",
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
    color: "#000000",
    fontWeight: "300",
    marginBottom: 0,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    height: 45,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    backgroundColor: "transparent",
    fontSize: 14,
    color: "#333",
    paddingVertical: 0,
  },
  eyeIcon: {
    padding: 8,
    marginLeft: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  nextButton: {
    backgroundColor: "#000",
    borderRadius: 40,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 21,
  },
  greenArrowCircle: {
    position: "absolute",
    right: 6,
    width: 43,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#10B585",
    justifyContent: "center",
    alignItems: "center",
  },
  nextButtonDisabled: {
    backgroundColor: "#ADB5BD",
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  inputContainerFocused: {
    backgroundColor: '#FFFFFF',
    borderColor: '#000000',
  },
});
