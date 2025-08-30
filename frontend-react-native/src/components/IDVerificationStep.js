import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SvgXml } from 'react-native-svg';
import { useSignup } from '../contexts/SignupContext';

const { width } = Dimensions.get('window');

const checkIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="29" viewBox="0 0 40 29" fill="none">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M39.0901 1.22164C39.6525 1.78423 39.9685 2.54715 39.9685 3.34264C39.9685 4.13814 39.6525 4.90106 39.0901 5.46364L16.6041 27.9496C16.3069 28.2469 15.9541 28.4826 15.5659 28.6435C15.1776 28.8044 14.7614 28.8872 14.3411 28.8872C13.9208 28.8872 13.5046 28.8044 13.1163 28.6435C12.7281 28.4826 12.3753 28.2469 12.0781 27.9496L0.906099 16.7796C0.619569 16.5029 0.391022 16.1719 0.233795 15.8059C0.0765679 15.4398 -0.00619091 15.0462 -0.00965236 14.6478C-0.0131138 14.2495 0.0627916 13.8545 0.213634 13.4858C0.364477 13.1171 0.587236 12.7821 0.868914 12.5005C1.15059 12.2188 1.48555 11.996 1.85424 11.8452C2.22293 11.6943 2.61797 11.6184 3.0163 11.6219C3.41464 11.6254 3.8083 11.7081 4.17431 11.8653C4.54033 12.0226 4.87136 12.2511 5.1481 12.5376L14.3401 21.7296L34.8461 1.22164C35.1247 0.942865 35.4555 0.721715 35.8196 0.57083C36.1837 0.419946 36.574 0.342285 36.9681 0.342285C37.3622 0.342285 37.7525 0.419946 38.1166 0.57083C38.4807 0.721715 38.8115 0.942865 39.0901 1.22164Z" fill="black"/>
</svg>`;

export default function IDVerificationStep({ onNext }) {
  const { signupData, updateIDVerificationData } = useSignup();
  const [isLoading, setIsLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  // 이미 인증된 상태인지 확인
  const isVerified = signupData.idVerified;
  const [capturedImage, setCapturedImage] = useState(signupData.idPhoto || null);

  const handleTakePhoto = async () => {
    if (!permission) {
      return;
    }

    if (!permission.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('카메라 권한 필요', '신분증 촬영을 위해 카메라 권한이 필요합니다.');
        return;
      }
    }

    setShowCamera(true);
  };

  const takePicture = async () => {
    if (!cameraRef.current) return;

    setIsLoading(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      // 촬영한 사진 저장
      setCapturedImage(photo.uri);
      updateIDVerificationData({ 
        idVerified: true,
        idPhoto: photo.uri
      });

      setShowCamera(false);
      
      // 1초 딜레이 후 다음 페이지로 이동
      setTimeout(() => {
        onNext();
      }, 1000);
    } catch (error) {
      console.error('사진 촬영 실패:', error);
      Alert.alert('촬영 실패', '사진 촬영 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <View style={styles.cameraBackButtonContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowCamera(false)}
          >
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        <CameraView
          style={styles.camera}
          facing="back"
          ref={cameraRef}
        >
          <View style={styles.overlay}>
            <View style={styles.idFrame}>
              <View style={styles.idFrameCorner} />
              <View style={[styles.idFrameCorner, styles.topRight]} />
              <View style={[styles.idFrameCorner, styles.bottomLeft]} />
              <View style={[styles.idFrameCorner, styles.bottomRight]} />
            </View>
          </View>

          <View style={styles.instructionContainer}>
            <Text style={styles.instructionText}>빛이 반사되지 않도록 주의하세요.</Text>
          </View>

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
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.content}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>신분증 인증</Text>
          <Text style={styles.headerSubtitle}>
            {isVerified
              ? '인증이 완료되었습니다. 다시 인증하려면 아래 버튼을 눌러주세요.'
              : '주민등록증 또는 운전면허증을 준비해주세요.'
            }
          </Text>
        </View>

        <View style={styles.idImageContainer}>
          {isVerified && capturedImage ? (
            <View style={styles.completedContainer}>
              <Image
                source={{ uri: capturedImage }}
                style={styles.capturedIdImage}
                resizeMode="cover"
              />
              <View style={styles.overlayContainer}>
                <View style={styles.checkIconContainer}>
                  <SvgXml xml={checkIconSvg} width={40} height={29} />
                </View>
                <Text style={styles.completionText}>인증 완료 !</Text>
              </View>
            </View>
          ) : (
            <Image
              source={require('../../assets/vertification.png')}
              style={styles.verificationImage}
              resizeMode="contain"
            />
          )}
        </View>

        <TouchableOpacity
          style={styles.takePhotoButton}
          onPress={handleTakePhoto}
        >
          <Image
            source={require('../../assets/TakePicture.png')}
            style={styles.takePhotoButtonImage}
            resizeMode="contain"
          />
        </TouchableOpacity>

        <Text style={styles.bottomText}>
          {isVerified
            ? '새로운 신분증으로 다시 인증할 수 있습니다.'
            : '빛이 반사되지 않도록 주의하세요.'
          }
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
    marginBottom: 80,
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
    marginVertical: 50,
  },
  verificationImage: {
    width: 250,
    height: 160,
  },
  completedContainer: {
    alignItems: 'center',
    position: 'relative',
  },
  capturedIdImage: {
    width: 250,
    height: 160,
    borderRadius: 12,
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
  },
  checkIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  completionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  takePhotoButton: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 20,
  },
  takePhotoButtonImage: {
    width: 335,
    height: 56,
  },
  bottomText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginTop: 10,
  },
  cameraContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cameraBackButtonContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  camera: {
    flex: 1,
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
});
