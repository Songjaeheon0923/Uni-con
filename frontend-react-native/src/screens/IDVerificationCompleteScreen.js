import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function IDVerificationCompleteScreen({ navigation }) {
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    // 인증 처리 시뮬레이션
    const timer = setTimeout(() => {
      setIsProcessing(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleNext = () => {
    navigation.navigate('SchoolVerification');
  };

  return (
    <SafeAreaView style={styles.container}>
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
          source={require('../../assets/stage2.png')} 
          style={styles.stageImage}
          resizeMode="contain"
        />
      </View>

      {/* 메인 컨텐츠 */}
      <View style={styles.content}>
        {/* 헤더 텍스트 */}
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>신분증 인증</Text>
          <Text style={styles.headerSubtitle}>안전한 서비스이용을 위해 본인인증을 해주세요.</Text>
        </View>

        {/* 신분증 이미지 영역 */}
        <View style={styles.idImageContainer}>
          {isProcessing ? (
            <View style={styles.processingContainer}>
              <View style={styles.processingSpinner}>
                <Ionicons name="refresh" size={30} color="#666" />
              </View>
              <Text style={styles.processingText}>신분증을 인증하고 있습니다...</Text>
            </View>
          ) : (
            <View style={styles.completedContainer}>
              <View style={styles.idPreview}>
                {/* 신분증 미리보기 (가상) */}
                <View style={styles.idCard}>
                  <View style={styles.idCardHeader}>
                    <Text style={styles.idCardTitle}>주민등록증</Text>
                  </View>
                  <View style={styles.idCardContent}>
                    <View style={styles.photoPlaceholder} />
                    <View style={styles.idInfo}>
                      <Text style={styles.idName}>홍길동</Text>
                      <Text style={styles.idNumber}>960203-1234567</Text>
                      <Text style={styles.idAddress}>서울특별시 강남구...</Text>
                    </View>
                  </View>
                </View>
              </View>
              
              {/* 인증 완료 표시 */}
              <View style={styles.checkmarkContainer}>
                <View style={styles.checkmarkCircle}>
                  <Ionicons name="checkmark" size={30} color="#FFFFFF" />
                </View>
                <Text style={styles.successText}>인증 완료!</Text>
              </View>
            </View>
          )}
        </View>

        {/* 다음 버튼 */}
        {!isProcessing && (
          <TouchableOpacity 
            style={styles.nextButton}
            onPress={handleNext}
          >
            <View style={styles.greenArrowCircle}>
              <Ionicons name="arrow-forward" size={35} color="#FFFFFF" />
            </View>
            <Text style={styles.nextButtonText}>다음</Text>
          </TouchableOpacity>
        )}

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  idImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingContainer: {
    alignItems: 'center',
  },
  processingSpinner: {
    marginBottom: 20,
  },
  processingText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  completedContainer: {
    alignItems: 'center',
    width: '100%',
  },
  idPreview: {
    marginBottom: 30,
  },
  idCard: {
    width: width * 0.8,
    height: width * 0.5,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 16,
  },
  idCardHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  idCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  idCardContent: {
    flexDirection: 'row',
    flex: 1,
  },
  photoPlaceholder: {
    width: 80,
    height: 100,
    backgroundColor: '#DDD',
    borderRadius: 4,
    marginRight: 16,
  },
  idInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  idName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  idNumber: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  idAddress: {
    fontSize: 12,
    color: '#999',
  },
  checkmarkContainer: {
    alignItems: 'center',
  },
  checkmarkCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#28A745',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#28A745',
  },
  nextButton: {
    backgroundColor: '#000',
    borderRadius: 40,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 40,
  },
  greenArrowCircle: {
    position: 'absolute',
    right: 6,
    width: 43,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#10B585',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});