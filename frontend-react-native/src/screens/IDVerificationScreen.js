import { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSignup } from '../contexts/SignupContext';

const { width } = Dimensions.get('window');

export default function IDVerificationScreen({ navigation }) {
  const { updateIDVerificationData } = useSignup();
  const [isLoading, setIsLoading] = useState(false);
  const [showInitialScreen, setShowInitialScreen] = useState(true);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  const handleTakePhoto = async () => {
    if (!permission) {
      // 카메라 권한이 아직 확인되지 않음
      return;
    }

    if (!permission.granted) {
      // 권한이 없으면 권한 요청
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('카메라 권한 필요', '신분증 촬영을 위해 카메라 권한이 필요합니다.');
        return;
      }
    }

    setShowInitialScreen(false);
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;

    setIsLoading(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });
      
      // ID 인증 완료 처리
      updateIDVerificationData({ idVerified: true });
      
      // 촬영된 사진 정보를 다음 화면으로 전달
      navigation.navigate('IDVerificationComplete', { 
        photoUri: photo.uri 
      });
    } catch (error) {
      console.error('사진 촬영 실패:', error);
      Alert.alert('촬영 실패', '사진 촬영 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (showInitialScreen) {
    return (
      <SafeAreaView style={styles.initialContainer}>
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
          <View style={[styles.progressDot, styles.progressCompleted]} />
          <View style={styles.progressDot} />
        </View>

        {/* 메인 컨텐츠 */}
        <View style={styles.content}>
          {/* 헤더 텍스트 */}
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>신분증 인증</Text>
            <Text style={styles.headerSubtitle}>주민등록증 또는 운전면허증을 준비해주세요.</Text>
          </View>

          {/* 신분증 이미지 */}
          <View style={styles.idImageContainer}>
            <View style={styles.idCard}>
              <View style={styles.idCardContent}>
                <Text style={styles.idCardText}>신분증</Text>
                <Text style={styles.idCardSubText}>준비</Text>
              </View>
            </View>
          </View>

          {/* 촬영하기 버튼 */}
          <TouchableOpacity 
            style={styles.takePhotoButton}
            onPress={handleTakePhoto}
          >
            <Text style={styles.takePhotoButtonText}>촬영하기</Text>
          </TouchableOpacity>

          {/* 안내 텍스트 */}
          <Text style={styles.bottomText}>빛이 반사되지 않도록 주의하세요.</Text>
        </View>

        {/* 개발용 건너뛰기 버튼 */}
        <TouchableOpacity 
          style={styles.devSkipButton}
          onPress={() => {
            updateIDVerificationData({ idVerified: true });
            navigation.navigate('IDVerificationComplete');
          }}
        >
          <Text style={styles.devSkipButtonText}>🚀 개발용: 신분증 인증 건너뛰기</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 뒤로가기 버튼 */}
      <View style={styles.cameraBackButtonContainer}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => setShowInitialScreen(true)}
        >
          <Ionicons name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* 실제 카메라 뷰 */}
      <CameraView 
        style={styles.camera} 
        facing="back"
        ref={cameraRef}
      >
        {/* 신분증 가이드 프레임 */}
        <View style={styles.overlay}>
          <View style={styles.idFrame}>
            <View style={styles.idFrameCorner} />
            <View style={[styles.idFrameCorner, styles.topRight]} />
            <View style={[styles.idFrameCorner, styles.bottomLeft]} />
            <View style={[styles.idFrameCorner, styles.bottomRight]} />
          </View>
        </View>

        {/* 안내 텍스트 */}
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionText}>빛이 반사되지 않도록 주의하세요.</Text>
        </View>

        {/* 촬영 버튼 */}
        <View style={styles.controlsContainer}>
          <TouchableOpacity 
            style={[styles.captureButton, isLoading && styles.captureButtonDisabled]}
            onPress={takePicture}
            disabled={isLoading}
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
        </View>
      </CameraView>

      {/* 개발용 건너뛰기 버튼 */}
      <View style={styles.devSkipContainer}>
        <TouchableOpacity 
          style={styles.devSkipButton}
          onPress={() => {
            updateIDVerificationData({ idVerified: true });
            navigation.navigate('IDVerificationComplete');
          }}
        >
          <Text style={styles.devSkipButtonText}>🚀 개발용: 신분증 인증 건너뛰기</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  initialContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#000000',
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
  idImageContainer: {
    alignItems: 'center',
    marginVertical: 60,
  },
  idCard: {
    width: 200,
    height: 130,
    backgroundColor: '#F0F0F0',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  idCardContent: {
    alignItems: 'center',
  },
  idCardText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
    marginBottom: 4,
  },
  idCardSubText: {
    fontSize: 14,
    color: '#999999',
  },
  takePhotoButton: {
    backgroundColor: '#666666',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  takePhotoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bottomText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginTop: 10,
  },
  camera: {
    flex: 1,
  },
  cameraBackButtonContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  idFrame: {
    width: width * 0.8,
    height: width * 0.5,
    position: 'relative',
  },
  idFrameCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#FFFFFF',
    borderWidth: 3,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    top: 0,
    left: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    left: 'auto',
    borderLeftWidth: 0,
    borderRightWidth: 3,
    borderTopWidth: 3,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    top: 'auto',
    borderTopWidth: 0,
    borderLeftWidth: 3,
    borderRightWidth: 0,
    borderBottomWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    top: 'auto',
    left: 'auto',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 3,
    borderBottomWidth: 3,
  },
  instructionContainer: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#000000',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  devSkipContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  devSkipButton: {
    backgroundColor: '#FF9500',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  devSkipButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
});