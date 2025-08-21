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
import api from '../services/api';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function ContractResultScreen({ navigation, route }) {
  const { photoUri, analysisData, taskId } = route.params;
  const [isAnalyzing, setIsAnalyzing] = useState(!analysisData);
  const [analysisResult, setAnalysisResult] = useState(analysisData || null);
  const [analysisError, setAnalysisError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [imageScale, setImageScale] = useState(1);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  
  // 실시간 분석 상태
  const [currentStage, setCurrentStage] = useState("분석 시작");
  const [progress, setProgress] = useState(0);
  const [stages, setStages] = useState([]);

  // 실시간 분석 상태 폴링
  useEffect(() => {
    if (!taskId || !isAnalyzing) return;

    let intervalId;
    let timeoutId;

    const pollAnalysisStatus = async () => {
      try {
        const statusResponse = await api.getAnalysisStatus(taskId);
        
        console.log('분석 상태 업데이트:', {
          status: statusResponse.status,
          current_stage: statusResponse.current_stage,
          progress: statusResponse.progress,
          stages_count: statusResponse.stages?.length || 0,
          timestamp: new Date().toISOString()
        });
        
        // 상태 업데이트
        setCurrentStage(statusResponse.current_stage);
        setProgress(statusResponse.progress);
        setStages(statusResponse.stages || []);
        
        if (statusResponse.status === 'completed') {
          // 분석 완료
          setIsAnalyzing(false);
          setAnalysisResult(statusResponse.result.analysis);
          clearInterval(intervalId);
          clearTimeout(timeoutId);
        } else if (statusResponse.status === 'failed') {
          // 분석 실패
          setIsAnalyzing(false);
          setAnalysisError(statusResponse.error || '분석에 실패했습니다.');
          clearInterval(intervalId);
          clearTimeout(timeoutId);
        }
      } catch (error) {
        console.error('상태 조회 오류:', error);
        // 계속 폴링하되, 너무 많은 오류가 발생하면 중지
      }
    };

    // 즉시 첫 번째 상태 확인
    pollAnalysisStatus();

    // 0.5초마다 상태 폴링 (더 빠른 동기화)
    intervalId = setInterval(pollAnalysisStatus, 500);

    // 30초 후 타임아웃 (백업)
    timeoutId = setTimeout(() => {
      if (isAnalyzing) {
        setIsAnalyzing(false);
        setAnalysisResult(getHardcodedResult());
        setAnalysisError("분석이 지연되어 임시 결과를 표시합니다.");
        clearInterval(intervalId);
      }
    }, 30000);

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [taskId, isAnalyzing]);

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
          {/* 계약서 이미지 미리보기 */}
          <View style={styles.analysisImageContainer}>
            <Image source={{ uri: photoUri }} style={styles.analysisImage} />
            <View style={styles.analysisOverlay}>
              <View style={styles.scanLine} />
            </View>
          </View>

          {/* 분석 상태 */}
          <View style={styles.analysisStatusContainer}>
            <Text style={styles.analysisTitle}>계약서를 꼼꼼히 분석하고 있어요</Text>
            
            {/* 현재 단계 표시 */}
            <View style={styles.currentStageContainer}>
              <View style={styles.currentStageIndicator}>
                <ActivityIndicator size="small" color="#FFFFFF" />
              </View>
              <Text style={styles.currentStageText}>{currentStage}</Text>
            </View>

            {/* 완료된 단계들 표시 */}
            {stages.length > 1 && (
              <View style={styles.stagesContainer}>
                {stages.slice(0, -1).map((stage, index) => (
                  <View key={index} style={styles.completedStageItem}>
                    <View style={styles.completedStageIndicator}>
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    </View>
                    <Text style={styles.completedStageText}>
                      {stage.stage} ({new Date(stage.timestamp).toLocaleTimeString()})
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* 진행률 바 */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    { width: `${progress}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {progress}%
              </Text>
            </View>

            <Text style={styles.analysisSubText}>
              AI가 계약서의 위험 요소와 중요 조항들을 검토 중입니다
            </Text>
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
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  analysisImageContainer: {
    alignItems: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  analysisImage: {
    width: 250,
    height: 250 * (297 / 210), // A4 비율
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  analysisOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  scanLine: {
    width: '80%',
    height: 3,
    backgroundColor: '#FF6600',
    opacity: 0.8,
    borderRadius: 2,
  },
  analysisStatusContainer: {
    flex: 1,
    alignItems: 'center',
  },
  analysisTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 30,
  },
  currentStageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    width: '100%',
  },
  currentStageIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6600',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  currentStageText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  stagesContainer: {
    width: '100%',
    marginBottom: 20,
  },
  completedStageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 4,
  },
  completedStageIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  completedStageText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6600',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6600',
    minWidth: 40,
  },
  analysisSubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
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