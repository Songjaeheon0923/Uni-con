import React, { useState, useRef, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  Dimensions
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import * as ImageManipulator from 'expo-image-manipulator';

const { width, height } = Dimensions.get('window');

export default function ContractCameraScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  React.useEffect(() => {
    if (!permission) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // 탭 바 숨기기
  useFocusEffect(
    React.useCallback(() => {
      const parent = navigation.getParent();
      if (parent) {
        parent.setOptions({
          tabBarStyle: { display: 'none' }
        });
      }
      return () => {
        if (parent) {
          parent.setOptions({
            tabBarStyle: {
              tabBarActiveTintColor: '#FF6600',
              tabBarInactiveTintColor: 'gray',
            }
          });
        }
      };
    }, [navigation])
  );

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        
        // 사각 틀 크기와 위치 계산
        const frameWidth = width * 0.8;
        const frameHeight = frameWidth * (297 / 210); // A4 비율
        const actualFrameHeight = Math.min(frameHeight, height * 0.45);
        
        // 화면 중앙에서 프레임 위치 계산
        const frameX = (width - frameWidth) / 2;
        const frameY = (height - actualFrameHeight) / 2;
        
        // 카메라 이미지 크기에 대한 비율로 크롭 영역 계산
        const { width: imageWidth, height: imageHeight } = photo;
        const scaleX = imageWidth / width;
        const scaleY = imageHeight / height;
        
        const cropX = frameX * scaleX;
        const cropY = frameY * scaleY;
        const cropWidth = frameWidth * scaleX;
        const cropHeight = actualFrameHeight * scaleY;
        
        // 이미지 크롭
        const croppedImage = await ImageManipulator.manipulateAsync(
          photo.uri,
          [
            {
              crop: {
                originX: cropX,
                originY: cropY,
                width: cropWidth,
                height: cropHeight,
              },
            },
          ],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );
        
        console.log('원본 사진:', photo.uri, `${imageWidth}x${imageHeight}`);
        console.log('크롭 영역:', { cropX, cropY, cropWidth, cropHeight });
        console.log('크롭된 사진:', croppedImage.uri);
        
        // 크롭된 사진을 검증 결과 화면으로 전달
        navigation.navigate('ContractResult', { 
          photoUri: croppedImage.uri,
          originalUri: photo.uri
        });
      } catch (error) {
        console.error('사진 촬영 실패:', error);
        Alert.alert('오류', '사진 촬영에 실패했습니다.');
      }
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>카메라 권한을 확인하는 중...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={60} color="#ccc" />
        <Text style={styles.permissionText}>카메라 권한이 필요합니다</Text>
        <Text style={styles.permissionSubtext}>
          설정에서 카메라 권한을 허용해주세요
        </Text>
        <TouchableOpacity style={styles.backButton} onPress={requestPermission}>
          <Text style={styles.backButtonText}>권한 요청</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.backButton, { marginTop: 10, backgroundColor: '#ccc' }]} onPress={handleGoBack}>
          <Text style={styles.backButtonText}>돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
      >
        {/* 상단 컨트롤 */}
        <View style={styles.topControls}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.titleText}>계약서 촬영</Text>
          </View>
        </View>

        {/* 가이드 오버레이 */}
        <View style={styles.overlay}>
          <View style={styles.guideContainer}>
            <View style={styles.frame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            <Text style={styles.instructionText}>
              계약서 전체가 선명하게 보이도록 촬영해주세요
            </Text>
          </View>
        </View>

        {/* 하단 컨트롤 */}
        <View style={styles.bottomControls}>
          <View style={styles.controlsContainer}>
            <View style={styles.placeholder} />

            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePicture}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>

            <View style={styles.placeholder} />
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 40,
  },
  permissionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  permissionSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  backButton: {
    backgroundColor: '#FF6600',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  camera: {
    flex: 1,
  },
  topControls: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 1,
  },
  backButton: {
    padding: 8,
    width: 40,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    marginRight: 40, // 뒤로가기 버튼 너비만큼 오프셋
  },
  titleText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  placeholder: {
    width: 32,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 80, // 상단 컨트롤과의 간격
  },
  guideContainer: {
    alignItems: 'center',
  },
  guideText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 30,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  frame: {
    width: width * 0.8,
    height: (width * 0.8) * (297 / 210), // A4 비율 (세로 297mm : 가로 210mm)
    position: 'relative',
    marginBottom: 50, // 하단 텍스트와의 간격 증가
    maxHeight: height * 0.45, // 화면을 넘지 않도록 제한
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderColor: '#FFFFFF',
    borderWidth: 3,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  instructionText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.8,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  bottomControls: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    paddingBottom: 30,
    paddingTop: 20,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  captureButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF6600',
  },
});