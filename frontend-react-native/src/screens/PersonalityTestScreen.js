import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import ApiService from '../services/api';

export default function PersonalityTestScreen({ navigation, route }) {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [smokingSubSelection, setSmokingSubSelection] = useState(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  // 출발점 파라미터 받기 (기본값: 'home')
  const fromScreen = route?.params?.from || 'home';

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = async () => {
    try {
      const response = await ApiService.getProfileQuestions();
      setQuestions(response.questions);
    } catch (error) {
      console.error('질문 로드 실패:', error);
      Alert.alert('오류', '질문을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId, value) => {
    setAnswers(prev => {
      // 이미 선택된 값과 같으면 선택 취소
      if (prev[questionId] === value) {
        const newAnswers = { ...prev };
        delete newAnswers[questionId];
        // 흡연 질문의 경우 서브 선택도 초기화 및 애니메이션
        if (questionId === 'smoking_status') {
          setSmokingSubSelection(null);
          // 서브 옵션 숨기기 애니메이션
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: false,
          }).start();
        }
        return newAnswers;
      }
      // 새로운 값 선택
      const newAnswers = {
        ...prev,
        [questionId]: value
      };
      
      // 흡연 질문의 경우 서브 선택 초기화 및 애니메이션
      if (questionId === 'smoking_status') {
        setSmokingSubSelection(null);
        // 서브 옵션 표시 애니메이션
        Animated.timing(slideAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }).start();
      }
      
      return newAnswers;
    });
  };

  const handleSubAnswer = (value) => {
    setSmokingSubSelection(value);
    setAnswers(prev => ({
      ...prev,
      'smoking_status': value
    }));
  };

  const goToNext = () => {
    const currentQuestion = questions[currentQuestionIndex];
    
    // 흡연 질문의 경우 서브 선택까지 확인
    if (currentQuestion.id === 'smoking_status') {
      if (!smokingSubSelection) {
        Alert.alert('알림', '답변을 선택해주세요.');
        return;
      }
    } else if (!answers[currentQuestion.id]) {
      Alert.alert('알림', '답변을 선택해주세요.');
      return;
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      submitProfile();
    }
  };

  const submitProfile = async () => {
    setIsSubmitting(true);
    try {
      await ApiService.updateUserProfile(answers);
      
      // 사용자 프로필 정보와 함께 결과 화면으로 이동
      const userProfile = {
        name: '유빈', // 실제로는 현재 사용자 이름을 가져와야 함
        sleep_type: answers.sleep_type,
        home_time: answers.home_time,
        cleaning_frequency: answers.cleaning_frequency,
        cleaning_sensitivity: answers.cleaning_sensitivity,
        smoking_status: answers.smoking_status,
        noise_sensitivity: answers.noise_sensitivity
      };
      
      navigation.navigate('PersonalityResult', { 
        userProfile, 
        fromScreen 
      });
      
    } catch (error) {
      console.error('프로필 저장 실패:', error);
      Alert.alert('오류', '프로필 저장에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getProgressPercentage = () => {
    return ((currentQuestionIndex + 1) / questions.length) * 100;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>질문을 불러오는 중...</Text>
      </View>
    );
  }

  if (questions.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <Text>질문을 불러올 수 없습니다.</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadQuestions}>
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Svg width="21" height="24" viewBox="0 0 21 24" fill="none">
            <Path d="M19 13.5C19.8284 13.5 20.5 12.8284 20.5 12C20.5 11.1716 19.8284 10.5 19 10.5V12V13.5ZM0.939341 10.9393C0.353554 11.5251 0.353554 12.4749 0.939341 13.0607L10.4853 22.6066C11.0711 23.1924 12.0208 23.1924 12.6066 22.6066C13.1924 22.0208 13.1924 21.0711 12.6066 20.4853L4.12132 12L12.6066 3.51472C13.1924 2.92893 13.1924 1.97919 12.6066 1.3934C12.0208 0.807611 11.0711 0.807611 10.4853 1.3934L0.939341 10.9393ZM19 12V10.5L2 10.5V12V13.5L19 13.5V12Z" fill="#494949"/>
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>나만의 룸메이트 찾기</Text>
      </View>

      {/* 진행률 바 */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[styles.progressFill, { width: `${getProgressPercentage()}%` }]} 
          />
        </View>
      </View>

      <View style={styles.content}>
        {/* 질문 */}
        <View style={styles.questionArea}>
          <Text style={styles.questionText}>{currentQuestion.question}</Text>
        </View>

        {/* 답변 옵션들 */}
        <View style={styles.optionsContainer}>
          {currentQuestion.id === 'smoking_status' ? (
            // 흡연 질문 특별 UI
            <View>
              {/* 1단계: 흡연자/비흡연자 선택 */}
              <View style={styles.smokingMainOptions}>
                {currentQuestion.options.map((option) => {
                  const isMainSelected = answers[currentQuestion.id] === option.value || 
                    (smokingSubSelection && smokingSubSelection.startsWith(option.value === 'non_smoker' ? 'non_smoker' : 'smoker'));
                  
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.smokingMainButton,
                        isMainSelected && styles.smokingMainButtonSelected
                      ]}
                      onPress={() => handleAnswer(currentQuestion.id, option.value)}
                    >
                      <Text style={[
                        styles.smokingMainButtonText,
                        isMainSelected && styles.smokingMainButtonTextSelected
                      ]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              
              {/* 2단계: 서브 옵션들 (애니메이션) */}
              {(answers[currentQuestion.id] === 'non_smoker' || answers[currentQuestion.id] === 'smoker' || smokingSubSelection) && (
                <Animated.View 
                  style={[
                    styles.smokingSubOptions,
                    {
                      maxHeight: slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 200],
                      }),
                      opacity: slideAnim,
                    }
                  ]}
                >
                  {(currentQuestion.sub_options[answers[currentQuestion.id]] || 
                    (smokingSubSelection && currentQuestion.sub_options[smokingSubSelection.startsWith('non_smoker') ? 'non_smoker' : 'smoker']))?.map((subOption) => {
                    const isSubSelected = smokingSubSelection === subOption.value;
                    
                    return (
                      <TouchableOpacity
                        key={subOption.value}
                        style={[
                          styles.smokingSubButton,
                          isSubSelected && styles.smokingSubButtonSelected
                        ]}
                        onPress={() => handleSubAnswer(subOption.value)}
                      >
                        <Text style={[
                          styles.smokingSubButtonText,
                          isSubSelected && styles.smokingSubButtonTextSelected
                        ]}>
                          {subOption.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </Animated.View>
              )}
            </View>
          ) : (
            // 기본 옵션 UI
            currentQuestion.options.map((option, index) => {
              const isSelected = answers[currentQuestion.id] === option.value;
              const getOptionIcon = () => {
                if (currentQuestion.id === 'sleep_type') {
                  if (option.value === 'morning') {
                    return 'sunny-outline';
                  } else if (option.value === 'night') {
                    return 'moon-outline';
                  }
                }
                return 'time-outline';
              };
              
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionButton,
                    isSelected && styles.optionButtonSelected
                  ]}
                  onPress={() => handleAnswer(currentQuestion.id, option.value)}
                >
                  <View style={styles.optionContent}>
                    <View style={styles.optionIcon}>
                      <Ionicons 
                        name={getOptionIcon()} 
                        size={28} 
                        color={isSelected ? '#ffffff' : '#8D8D8D'} 
                      />
                    </View>
                    <View style={styles.optionTextContainer}>
                      <Text style={[
                        styles.optionMainText,
                        isSelected && styles.optionMainTextSelected
                      ]}>
                        {option.label.split('(')[0].trim()}
                      </Text>
                      {option.label.includes('(') && (
                        <Text style={[
                          styles.optionSubText,
                          isSelected && styles.optionSubTextSelected
                        ]}>
                          {' (' + option.label.split('(')[1]}
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* 버튼들 */}
        <View style={styles.navigationContainer}>
          {currentQuestionIndex > 0 && (
            <TouchableOpacity
              style={styles.prevButton}
              onPress={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
            >
              <Text style={styles.prevButtonText}>이전</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.nextButton,
              currentQuestionIndex === 0 && styles.nextButtonFullWidth,
              ((currentQuestion.id === 'smoking_status' && smokingSubSelection) || 
               (currentQuestion.id !== 'smoking_status' && answers[currentQuestion.id])) && styles.nextButtonEnabled
            ]}
            onPress={goToNext}
            disabled={
              (currentQuestion.id === 'smoking_status' && !smokingSubSelection) || 
              (currentQuestion.id !== 'smoking_status' && !answers[currentQuestion.id]) ||
              isSubmitting
            }
          >
            <Text style={styles.nextButtonText}>
              NEXT
            </Text>
            <View style={styles.nextButtonIcon}>
              <Ionicons 
                name="arrow-forward" 
                size={16} 
                color="#404040" 
              />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#228B22',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 63,
    paddingBottom: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 63,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  progressText: {
    position: 'absolute',
    right: 20,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  progressContainer: {
    paddingHorizontal: 19,
    paddingTop: 10,
    paddingBottom: 30,
    backgroundColor: '#fff',
  },
  progressBar: {
    height: 7,
    backgroundColor: '#EAEAEA',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#404040',
    borderRadius: 10,
  },
  content: {
    flex: 1,
    paddingTop: 0,
    justifyContent: 'space-between',
  },
  questionArea: {
    height: 120,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  questionText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1C1C1C',
    lineHeight: 33.6,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  optionsContainer: {
    paddingHorizontal: 19,
    marginBottom: 40,
  },
  optionButton: {
    backgroundColor: '#E0E0E0',
    borderRadius: 9,
    marginBottom: 15,
    paddingHorizontal: 22,
    paddingVertical: 20,
  },
  optionButtonSelected: {
    backgroundColor: '#404040',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIcon: {
    width: 34,
    height: 33,
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionMainText: {
    fontSize: 21,
    fontWeight: '600',
    color: '#474747',
    lineHeight: 38,
  },
  optionMainTextSelected: {
    color: '#ffffff',
  },
  optionSubText: {
    fontSize: 16,
    fontWeight: '400',
    color: '#474747',
    lineHeight: 29,
    marginLeft: 5,
  },
  optionSubTextSelected: {
    color: '#ffffff',
  },
  navigationContainer: {
    flexDirection: 'row',
    paddingHorizontal: 19,
    paddingBottom: 80,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  prevButton: {
    width: 77,
    height: 56,
    backgroundColor: '#E0E0E0',
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  prevButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6F6F6F',
    textAlign: 'center',
  },
  nextButton: {
    width: 289,
    height: 56,
    backgroundColor: '#696969',
    borderRadius: 9,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  nextButtonFullWidth: {
    width: 373,
  },
  nextButtonEnabled: {
    backgroundColor: '#000000',
  },
  nextButtonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginRight: 8,
  },
  nextButtonIcon: {
    width: 26,
    height: 26,
    backgroundColor: '#D9D9D9',
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // 흡연 질문 스타일
  smokingMainOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 10,
  },
  smokingMainButton: {
    flex: 1,
    height: 75,
    backgroundColor: '#E0E0E0',
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smokingMainButtonSelected: {
    backgroundColor: '#7E7E7E',
  },
  smokingMainButtonText: {
    fontSize: 21,
    fontWeight: '600',
    color: '#474747',
  },
  smokingMainButtonTextSelected: {
    color: '#ffffff',
  },
  smokingSubOptions: {
    marginTop: 5,
    overflow: 'hidden',
  },
  smokingSubButton: {
    backgroundColor: '#E0E0E0',
    borderRadius: 9,
    paddingHorizontal: 22,
    paddingVertical: 20,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  smokingSubButtonSelected: {
    backgroundColor: '#404040',
  },
  smokingSubButtonText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#474747',
    flex: 1,
  },
  smokingSubButtonTextSelected: {
    color: '#ffffff',
  },
});