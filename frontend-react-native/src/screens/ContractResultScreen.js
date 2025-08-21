import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Modal,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ContractResultScreen({ navigation, route }) {
  const { photoUri, analysisData } = route.params;
  const [isAnalyzing, setIsAnalyzing] = useState(!analysisData);
  const [analysisResult, setAnalysisResult] = useState(analysisData || null);
  const [analysisError, setAnalysisError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [imageScale, setImageScale] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });

  // 실시간으로 route params 변경 감지
  React.useEffect(() => {
    const { analysisData: newAnalysisData, error } = route.params;
    if (newAnalysisData && newAnalysisData !== analysisData) {
      setAnalysisResult(newAnalysisData);
      setIsAnalyzing(false);
      setAnalysisError(null);
    } else if (error) {
      setIsAnalyzing(false);
      setAnalysisError(error);
    }
  }, [route.params]);

  useEffect(() => {
    // 실제 분석 데이터가 없는 경우에만 하드코딩된 결과 사용
    if (!analysisData) {
      const timer = setTimeout(() => {
        setIsAnalyzing(false);
        setAnalysisResult(getHardcodedResult());
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [analysisData]);

  const getHardcodedResult = () => ({
    subtitle: "대체로 안전하지만 일부 조항 추가 확인 필요",
    main_title: {
      user_name: "테스트 사용자",
      score: 73
    },
    analysis_results: [
      {
        text: "필수 항목이 모두 기재 완료되어 있습니다.",
        type: "positive"
      },
      {
        text: "계약 기간·연장 조건이 명확합니다.",
        type: "positive"
      },
      {
        text: "서명란 이상 없습니다.",
        type: "positive"
      }
    ],
    suspicious_clauses: [
      {
        text: "중도금 지불 시점 미기재",
        severity: "warning"
      },
      {
        text: "중도 해지 위약금 기준 미기재",
        severity: "warning"
      },
      {
        text: "보증금 반환 시점 구체적 기한 없음",
        severity: "high"
      }
    ],
    questions_for_landlord: [
      {
        text: "중도금은 언제 지불해야 하나요?"
      },
      {
        text: "중도 해지 위약금 계산 방식은 어떻게 되나요?"
      },
      {
        text: "보증금은 퇴거 후 며칠 이내 반환되나요?"
      },
      {
        text: "시설 보수·수리 비용은 누가 부담하나요?"
      }
    ]
  });

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleRetake = () => {
    navigation.goBack();
  };

  const handleComplete = () => {
    navigation.navigate('HomeMain');
  };

  const openImageModal = () => {
    setModalVisible(true);
  };

  const closeImageModal = () => {
    setModalVisible(false);
    // 모달 닫을 때 이미지 위치와 크기 초기화
    setImageScale(1);
    setImagePosition({ x: 0, y: 0 });
  };

  const handleDoubleTap = () => {
    if (imageScale > 1) {
      setImageScale(1);
      setImagePosition({ x: 0, y: 0 });
    } else {
      setImageScale(2);
    }
  };

  let lastTap = null;
  const handleImagePress = () => {
    const now = Date.now();
    const DOUBLE_PRESS_DELAY = 300;
    if (lastTap && (now - lastTap) < DOUBLE_PRESS_DELAY) {
      handleDoubleTap();
    }
    lastTap = now;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#FF6600';
    if (score >= 60) return '#FF9800';
    return '#F44336';
  };

  const getScoreText = (score) => {
    if (score >= 80) return '안전';
    if (score >= 60) return '주의';
    return '위험';
  };

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'high': return 'alert-circle';
      case 'medium': return 'warning';
      case 'low': return 'information-circle';
      default: return 'information-circle';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return '#F44336';
      case 'medium': return '#FF9800';
      case 'low': return '#2196F3';
      default: return '#666';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'good': return 'checkmark-circle';
      case 'warning': return 'warning';
      case 'error': return 'close-circle';
      default: return 'checkmark-circle';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'good': return '#FF6600';
      case 'warning': return '#FF9800';
      case 'error': return '#F44336';
      default: return '#FF6600';
    }
  };

  if (isAnalyzing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>계약서 분석 중</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.analyzingContainer}>
          <ActivityIndicator size="large" color="#FF6600" />
          <Text style={styles.analyzingText}>AI가 계약서를 분석하고 있습니다...</Text>
          <Text style={styles.analyzingSubtext}>잠시만 기다려주세요</Text>
          
          <View style={styles.photoPreview}>
            <Image source={{ uri: photoUri }} style={styles.previewImage} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>검증 결과</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 상단 제목과 계약서 이미지 */}
        <View style={styles.topSection}>
          <Text style={styles.resultTopText}>
            {analysisResult.subtitle}
          </Text>
          <Text style={styles.resultMainText}>
            {analysisResult.main_title.user_name}님의 계약서, <Text style={styles.scoreText}>{analysisResult.main_title.score}점</Text>
          </Text>
          
          {/* 계약서 이미지 */}
          <View style={styles.contractImageContainer}>
            <TouchableOpacity onPress={openImageModal} activeOpacity={1}>
              <Image source={{ uri: photoUri }} style={styles.contractImage} />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* 구분선 */}
        <View style={styles.divider} />

        {/* 분석 결과 */}
        <View style={styles.analysisSection}>
          <Text style={styles.sectionTitle}>분석 결과</Text>
          {analysisResult.analysis_results.map((result, index) => (
            <View key={index} style={styles.resultItem}>
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
              </View>
              <Text style={styles.resultText}>{result.text}</Text>
            </View>
          ))}
        </View>

        {/* 구분선 */}
        <View style={styles.divider} />

        {/* 의심 조항 */}
        <View style={styles.analysisSection}>
          <Text style={styles.sectionTitle}>의심 조항</Text>
          {analysisResult.suspicious_clauses.map((clause, index) => (
            <View key={index} style={styles.resultItem}>
              <Text style={styles.warningEmoji}>⚠️</Text>
              <Text style={styles.resultText}>{clause.text}</Text>
            </View>
          ))}
        </View>

        {/* 구분선 */}
        <View style={styles.divider} />

        {/* 집주인에게 물어볼 것 */}
        <View style={styles.analysisSection}>
          <Text style={styles.sectionTitle}>집주인에게 물어볼 것</Text>
          {analysisResult.questions_for_landlord.map((question, index) => (
            <View key={index} style={styles.resultItem}>
              <View style={styles.questionCircle}>
                <Ionicons name="help" size={12} color="#FFFFFF" />
              </View>
              <Text style={styles.resultText}>{question.text}</Text>
            </View>
          ))}
        </View>

        {/* 구분선 */}
        <View style={styles.divider} />

        {/* 면책조항 */}
        <View style={styles.disclaimerContainer}>
          <Text style={styles.disclaimerText}>
            ※ 본 검증 결과는 참고용이며 법적 효력이 없습니다. 중요한 계약 체결 시에는 전문가의 자문을 받으시기 바랍니다.
          </Text>
        </View>
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
          <Text style={styles.retakeButtonText}>다시 촬영</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.completeButton} onPress={handleComplete}>
          <Text style={styles.completeButtonText}>완료</Text>
        </TouchableOpacity>
      </View>

      {/* 전체화면 이미지 모달 */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeImageModal}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.modalBackground} onPress={closeImageModal} activeOpacity={1}>
            <View style={styles.modalContent}>
              <TouchableOpacity style={styles.closeButton} onPress={closeImageModal}>
                <Ionicons name="close" size={30} color="#FFFFFF" />
              </TouchableOpacity>
              <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={styles.scrollContent}
                maximumZoomScale={5}
                minimumZoomScale={1}
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
                centerContent={true}
              >
                <TouchableOpacity onPress={handleImagePress} activeOpacity={1}>
                  <Image 
                    source={{ uri: photoUri }} 
                    style={[
                      styles.fullscreenImage,
                      {
                        transform: [
                          { scale: imageScale },
                          { translateX: imagePosition.x },
                          { translateY: imagePosition.y },
                        ],
                      },
                    ]} 
                  />
                </TouchableOpacity>
              </ScrollView>
            </View>
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 32,
  },
  analyzingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  analyzingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    textAlign: 'center',
  },
  analyzingSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  photoPreview: {
    width: 200,
    height: 200 * (297 / 210), // A4 비율 (세로 297mm : 가로 210mm)
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  content: {
    flex: 1,
  },
  topSection: {
    paddingHorizontal: 15,
    paddingTop: 30,
    paddingBottom: 30,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  resultTopText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#666666',
    textAlign: 'center',
    marginBottom: 12,
  },
  resultMainText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1C',
    textAlign: 'center',
    marginBottom: 22,
  },
  scoreText: {
    fontWeight: '700',
  },
  contractImageContainer: {
    alignItems: 'center',
  },
  contractImage: {
    width: 340,
    height: 420,
    resizeMode: 'contain',
  },
  analysisSection: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    paddingVertical: 27,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(0, 0, 0, 0.8)',
    marginBottom: 16,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    gap: 10,
  },
  resultText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    opacity: 0.6,
    flex: 1,
  },
  checkCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#D5D5D5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  warningEmoji: {
    fontSize: 18,
    color: 'rgba(0, 0, 0, 0.8)',
  },
  divider: {
    height: 8,
    backgroundColor: '#F5F5F5',
    marginVertical: 0,
  },
  questionCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#313131',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendationContainer: {
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6600',
  },
  recommendationText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
  disclaimerContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    marginHorizontal: 15,
  },
  disclaimerText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    textAlign: 'center',
  },
  bottomContainer: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 30,
    gap: 12,
  },
  retakeButton: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  retakeButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  completeButton: {
    flex: 1,
    backgroundColor: '#FF6600',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    position: 'relative',
    width: screenWidth * 0.95,
    height: screenHeight * 0.8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: screenWidth * 0.9,
    height: screenHeight * 0.7,
    resizeMode: 'contain',
  },
});