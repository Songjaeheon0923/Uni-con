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
import { useFocusEffect } from '@react-navigation/native';
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
  const [isTransitioning, setIsTransitioning] = useState(false); // 화면 전환 상태

  // 네비게이션 바 제어
  React.useLayoutEffect(() => {
    const parent = navigation.getParent();
    if (parent) {
      parent.setOptions({
        tabBarStyle: { display: 'none' }
      });
    }
  }, [navigation]);

  // 분석 상태에 따른 네비게이션 바 동적 제어
  useEffect(() => {
    const parent = navigation.getParent();
    if (parent) {
      if (isAnalyzing) {
        // 분석 중일 때는 네비게이션 바 숨김
        parent.setOptions({
          tabBarStyle: { display: 'none' }
        });
      } else if (analysisResult || analysisError) {
        // 분석 완료 또는 에러 시 네비게이션 바 복원
        parent.setOptions({
          tabBarStyle: {
            height: 100,
            paddingBottom: 30,
            paddingTop: 15,
            backgroundColor: '#FFFFFF',
            borderTopWidth: 0,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 8,
            tabBarActiveTintColor: '#000000',
            tabBarInactiveTintColor: '#C0C0C0',
          }
        });
      }
    }
  }, [isAnalyzing, analysisResult, analysisError, navigation]);

  // 화면을 떠날 때 네비게이션 바 복원
  useFocusEffect(
    React.useCallback(() => {
      return () => {
        const parent = navigation.getParent();
        if (parent && !isAnalyzing) {
          parent.setOptions({
            tabBarStyle: {
              height: 100,
              paddingBottom: 30,
              paddingTop: 15,
              backgroundColor: '#FFFFFF',
              borderTopWidth: 0,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 8,
              tabBarActiveTintColor: '#000000',
              tabBarInactiveTintColor: '#C0C0C0',
            }
          });
        }
      };
    }, [navigation, isAnalyzing])
  );

  // 실시간 분석 상태 폴링
  useEffect(() => {
    if (!taskId || !isAnalyzing) return;

    let intervalId;
    let timeoutId;
    let errorCount = 0;
    const maxErrors = 5; // 최대 5번 연속 오류까지 허용

    const pollAnalysisStatus = async () => {
      try {
        const statusResponse = await api.getAnalysisStatus(taskId);
        
        // 성공적으로 응답을 받으면 에러 카운트 리셋
        errorCount = 0;
        
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
          // 분석 완료 - 부드러운 전환 효과
          console.log('분석 완료! 결과 화면으로 전환:', statusResponse.result);
          setCurrentStage("분석 완료");
          setProgress(100);
          setIsTransitioning(true);
          
          // 0.5초 후 결과 화면으로 전환 (사용자가 완료를 인지할 시간 제공)
          setTimeout(() => {
            setIsAnalyzing(false);
            setAnalysisResult(statusResponse.result.analysis);
            setAnalysisError(null);
            setIsTransitioning(false);
          }, 500);
          
          clearInterval(intervalId);
          clearTimeout(timeoutId);
        } else if (statusResponse.status === 'failed') {
          // 분석 실패
          console.log('분석 실패:', statusResponse.error);
          setCurrentStage("분석 실패");
          setIsTransitioning(true);
          
          // 0.5초 후 에러 상태로 전환
          setTimeout(() => {
            setIsAnalyzing(false);
            setAnalysisError(statusResponse.error || '분석에 실패했습니다.');
            setAnalysisResult(null);
            setIsTransitioning(false);
          }, 500);
          
          clearInterval(intervalId);
          clearTimeout(timeoutId);
        }
      } catch (error) {
        errorCount++;
        console.error(`상태 조회 오류 (${errorCount}/${maxErrors}):`, error);
        
        // 너무 많은 오류가 연속으로 발생하면 폴링 중지
        if (errorCount >= maxErrors) {
          console.error('연속된 오류로 인해 폴링을 중지합니다.');
          setCurrentStage("연결 오류");
          setIsTransitioning(true);
          
          setTimeout(() => {
            setIsAnalyzing(false);
            setAnalysisError('네트워크 연결이 불안정합니다. 네트워크 상태를 확인하고 다시 시도해주세요.');
            setIsTransitioning(false);
          }, 500);
          
          clearInterval(intervalId);
          clearTimeout(timeoutId);
        }
      }
    };

    // 즉시 첫 번째 상태 확인
    pollAnalysisStatus();

    // 1초마다 상태 폴링 (서버 부하 고려)
    intervalId = setInterval(pollAnalysisStatus, 1000);

    // 90초 후 타임아웃 (더 여유있는 시간)
    timeoutId = setTimeout(() => {
      if (isAnalyzing) {
        console.log('분석 타임아웃 - 하드코딩된 결과 표시');
        setCurrentStage("시간 초과");
        setProgress(100);
        setIsTransitioning(true);
        
        setTimeout(() => {
          setIsAnalyzing(false);
          setAnalysisResult(getHardcodedResult());
          setAnalysisError("분석에 예상보다 시간이 오래 걸려 샘플 결과를 표시합니다. 실제 분석 결과와 다를 수 있습니다.");
          setIsTransitioning(false);
        }, 500);
        
        clearInterval(intervalId);
      }
    }, 90000);

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

  const handleRetry = () => {
    // 분석 재시도
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);
    setCurrentStage("분석 재시작");
    setProgress(0);
    setStages([]);
    setIsTransitioning(false);
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

  // 에러 상태 화면
  if (analysisError && !isAnalyzing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>분석 오류</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.errorContainer}>
          <View style={styles.errorIconContainer}>
            <Ionicons name="alert-circle" size={80} color="#F44336" />
          </View>
          
          <Text style={styles.errorTitle}>분석 중 문제가 발생했습니다</Text>
          <Text style={styles.errorMessage}>{analysisError}</Text>
          
          <View style={styles.errorButtonContainer}>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Ionicons name="refresh" size={20} color="#FFFFFF" />
              <Text style={styles.retryButtonText}>다시 시도</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.retakeButton} onPress={handleRetake}>
              <Ionicons name="camera" size={20} color="#666" />
              <Text style={styles.retakeButtonText}>다시 촬영</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

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

        <ScrollView 
          style={styles.analyzingScrollContainer}
          contentContainerStyle={styles.analyzingScrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 계약서 이미지 미리보기 */}
          <View style={styles.analysisImageContainer}>
            <Image source={{ uri: photoUri }} style={styles.analysisImage} />
          </View>

          {/* 분석 상태 */}
          <View style={styles.analysisStatusContainer}>
            <Text style={styles.analysisTitle}>계약서를 꼼꼼히 분석하고 있어요</Text>
            
            {/* 현재 단계 표시 */}
            <View style={styles.currentStageContainer}>
              <View style={[
                styles.currentStageIndicator,
                isTransitioning && progress === 100 && { backgroundColor: '#4CAF50' }
              ]}>
                {isTransitioning && progress === 100 ? (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                ) : (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                )}
              </View>
              <Text style={styles.currentStageText}>{currentStage}</Text>
            </View>

            {/* 완료된 단계들 표시 */}
            {stages.length > 0 && (
              <View style={styles.stagesContainer}>
                {stages.map((stage, index) => {
                  // 현재 단계와 같지 않은 단계들은 완료된 것으로 표시
                  if (stage.stage === currentStage) return null;
                  
                  // AI 관련 단계들은 누적 로그에 표시하지 않음
                  if (stage.stage === "AI 분석 시작" || stage.stage === "AI 분석 중") {
                    return null;
                  }
                  
                  let stageText = stage.stage;
                  if (stage.stage === "이미지 전처리 중") {
                    stageText = "이미지 전처리 완료!";
                  } else if (stage.stage === "텍스트 추출 중") {
                    stageText = "텍스트 추출(OCR) 완료!";
                  } else if (stage.stage === "분석 결과 검증 중") {
                    stageText = "분석 결과 검증 완료!";
                  } else if (stage.stage === "결과 처리 중") {
                    stageText = "결과 처리 완료!";
                  } else {
                    stageText = `${stage.stage} 완료!`;
                  }
                  
                  return (
                    <View key={index} style={styles.completedStageItem}>
                      <View style={styles.completedStageIndicator}>
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      </View>
                      <Text style={styles.completedStageText}>
                        {stageText}
                      </Text>
                    </View>
                  );
                })}
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
        </ScrollView>
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
              <View style={styles.warningCircle}>
                <Ionicons name="warning" size={20} color="#FF6600" />
              </View>
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
  analyzingScrollContainer: {
    flex: 1,
  },
  analyzingScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 40,
    minHeight: '100%',
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
  analysisStatusContainer: {
    alignItems: 'center',
    paddingBottom: 40,
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
    fontSize: 32,
    fontWeight: '700',
    color: '#1C1C1C',
    textAlign: 'center',
    marginBottom: 22,
  },
  scoreText: {
    fontWeight: '700',
    color: '#10B585',
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
    marginBottom: 8,
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
    backgroundColor: '#10B585',
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
  warningCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
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
  // 에러 화면 스타일
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    backgroundColor: '#F8F8F8',
  },
  errorIconContainer: {
    marginBottom: 30,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  errorButtonContainer: {
    width: '100%',
    gap: 15,
  },
  retryButton: {
    backgroundColor: '#FF6600',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  retakeButton: {
    backgroundColor: '#F0F0F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  retakeButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
});