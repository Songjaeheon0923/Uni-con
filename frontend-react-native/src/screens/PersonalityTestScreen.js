import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Easing,
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
            easing: Easing.out(Easing.ease),
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
          duration: 400,
          easing: Easing.out(Easing.back(1.1)),
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
      {/* 뒤로가기 버튼 */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <Svg width="21" height="24" viewBox="0 0 21 24" fill="none">
          <Path d="M19 13.5C19.8284 13.5 20.5 12.8284 20.5 12C20.5 11.1716 19.8284 10.5 19 10.5V12V13.5ZM0.939341 10.9393C0.353554 11.5251 0.353554 12.4749 0.939341 13.0607L10.4853 22.6066C11.0711 23.1924 12.0208 23.1924 12.6066 22.6066C13.1924 22.0208 13.1924 21.0711 12.6066 20.4853L4.12132 12L12.6066 3.51472C13.1924 2.92893 13.1924 1.97919 12.6066 1.3934C12.0208 0.807611 11.0711 0.807611 10.4853 1.3934L0.939341 10.9393ZM19 12V10.5L2 10.5V12V13.5L19 13.5V12Z" fill="#494949"/>
        </Svg>
      </TouchableOpacity>
      
      {/* 헤더 타이틀 */}
      <Text style={styles.headerTitle}>주거 성향 테스트</Text>

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
              
              {/* 2단계: 서브 옵션들 (슬라이딩 애니메이션) */}
              {(answers[currentQuestion.id] === 'non_smoker' || answers[currentQuestion.id] === 'smoker' || smokingSubSelection) && (
                <Animated.View 
                  style={[
                    styles.smokingSubOptions,
                    {
                      maxHeight: slideAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, 180],
                      }),
                      opacity: slideAnim,
                      transform: [{
                        translateY: slideAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-30, 0],
                        })
                      }],
                    }
                  ]}
                >
                  {(currentQuestion.sub_options[answers[currentQuestion.id]] || 
                    (smokingSubSelection && currentQuestion.sub_options[smokingSubSelection.startsWith('non_smoker') ? 'non_smoker' : 'smoker']))?.map((subOption, index) => {
                    const isSubSelected = smokingSubSelection === subOption.value;
                    
                    return (
                      <Animated.View
                        key={subOption.value}
                        style={{
                          opacity: slideAnim,
                          transform: [{
                            translateY: slideAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [20, 0],
                            })
                          }],
                        }}
                      >
                        <TouchableOpacity
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
                      </Animated.View>
                    );
                  })}
                </Animated.View>
              )}
            </View>
          ) : (
            // 기본 옵션 UI
            currentQuestion.options.map((option, index) => {
              const isSelected = answers[currentQuestion.id] === option.value;
              
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
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* 버튼들 */}
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={[
              styles.nextButton,
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
            <Text style={[
              styles.nextButtonText,
              ((currentQuestion.id === 'smoking_status' && smokingSubSelection) || 
               (currentQuestion.id !== 'smoking_status' && answers[currentQuestion.id])) && styles.nextButtonTextEnabled
            ]}>
              NEXT
            </Text>
            <View style={[
              styles.nextButtonArrow,
              ((currentQuestion.id === 'smoking_status' && smokingSubSelection) || 
               (currentQuestion.id !== 'smoking_status' && answers[currentQuestion.id])) && styles.nextButtonArrowEnabled
            ]}>
              <Ionicons 
                name="arrow-forward" 
                size={20} 
                color={((currentQuestion.id === 'smoking_status' && smokingSubSelection) || 
                       (currentQuestion.id !== 'smoking_status' && answers[currentQuestion.id])) ? "#FFFFFF" : "#ACACAC"}
              />
            </View>
          </TouchableOpacity>
          
          <View style={styles.bottomNavigation}>
            {currentQuestionIndex > 0 && (
              <TouchableOpacity
                style={styles.prevButton}
                onPress={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
              >
                <Text style={styles.prevButtonText}>이전</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: '#F2F2F2',
    overflow: 'hidden',
    borderRadius: 40,
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
  backButton: {
    position: 'absolute',
    left: 20,
    top: 50,
    padding: 10,
  },
  headerTitle: {
    left: 147,
    top: 63,
    position: 'absolute',
    textAlign: 'center',
    color: 'black',
    fontSize: 18,
    fontFamily: 'Pretendard',
    fontWeight: '600',
  },
  progressContainer: {
    width: 373,
    height: 7,
    left: 19,
    top: 123,
    position: 'absolute',
  },
  progressBar: {
    width: '100%',
    height: '100%',
    backgroundColor: '#DADADA',
    borderRadius: 10,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#595959',
    borderRadius: 10,
    position: 'absolute',
  },
  content: {
    flex: 1,
    paddingTop: 0,
    justifyContent: 'space-between',
  },
  questionArea: {
    left: 20,
    right: 20,
    top: 213,
    position: 'absolute',
    alignItems: 'center',
  },
  questionText: {
    textAlign: 'center',
    color: '#1C1C1C',
    fontSize: 24,
    fontFamily: 'Pretendard',
    fontWeight: '600',
    lineHeight: 33.6,
  },
  optionsContainer: {
    position: 'absolute',
    top: 338,
    left: 19,
    width: 373,
  },
  optionButton: {
    width: 373,
    height: 75,
    paddingLeft: 40,
    paddingRight: 40,
    paddingTop: 18,
    paddingBottom: 18,
    backgroundColor: 'white',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#D8D8D8',
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  optionButtonSelected: {
    backgroundColor: '#10B585',
    borderColor: '#555555',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  optionMainText: {
    color: '#474747',
    fontSize: 21,
    fontFamily: 'Pretendard Variable',
    fontWeight: '600',
    lineHeight: 38.01,
  },
  optionMainTextSelected: {
    color: 'white',
  },
  optionSubText: {
    color: '#474747',
    fontSize: 16,
    fontFamily: 'Pretendard Variable',
    fontWeight: '400',
    lineHeight: 28.96,
    marginLeft: 0,
  },
  optionSubTextSelected: {
    color: 'white',
  },
  navigationContainer: {
    position: 'absolute',
    left: 55,
    top: 648,
    alignItems: 'center',
  },
  nextButton: {
    width: 302,
    height: 60,
    paddingLeft: 87,
    paddingRight: 87,
    paddingVertical: 0,
    backgroundColor: '#EFEFEF',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#ACACAC',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    position: 'relative',
  },
  nextButtonEnabled: {
    backgroundColor: 'black',
    borderColor: 'black',
  },
  nextButtonText: {
    textAlign: 'center',
    color: '#ACACAC',
    fontSize: 20,
    fontFamily: 'Pretendard Variable',
    fontWeight: '600',
    includeFontPadding: false,
    lineHeight: 24,
  },
  nextButtonTextEnabled: {
    color: 'white',
  },
  nextButtonArrow: {
    position: 'absolute',
    right: 8,
    width: 42.62,
    height: 41.53,
    backgroundColor: 'white',
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#ACACAC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonArrowEnabled: {
    backgroundColor: '#FC6339',
    borderColor: '#FC6339',
  },
  bottomNavigation: {
    width: 282.62,
    left: 10,
    top: 9,
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  prevButton: {
    height: 42.62,
    paddingHorizontal: 8.88,
    backgroundColor: '#F1F1F1',
    borderRadius: 88.79,
    borderWidth: 1,
    borderColor: '#ACACAC',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8.88,
  },
  prevButtonText: {
    textAlign: 'center',
    color: '#343434',
    fontSize: 14.21,
    fontFamily: 'Pretendard',
    fontWeight: '500',
  },
  // 흡연 질문 스타일
  smokingMainOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    gap: 10,
  },
  smokingMainButton: {
    flex: 1,
    height: 75,
    backgroundColor: 'white',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#D8D8D8',
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smokingMainButtonSelected: {
    backgroundColor: '#10B585',
    borderColor: '#555555',
  },
  smokingMainButtonText: {
    fontSize: 21,
    fontWeight: '600',
    color: '#474747',
    fontFamily: 'Pretendard Variable',
  },
  smokingMainButtonTextSelected: {
    color: 'white',
  },
  smokingSubOptions: {
    marginTop: 5,
    overflow: 'hidden',
  },
  smokingSubButton: {
    width: 373,
    height: 75,
    paddingHorizontal: 40,
    paddingVertical: 18,
    backgroundColor: 'white',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#D8D8D8',
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  smokingSubButtonSelected: {
    backgroundColor: '#10B585',
    borderColor: '#555555',
  },
  smokingSubButtonText: {
    fontSize: 21,
    fontWeight: '600',
    color: '#474747',
    fontFamily: 'Pretendard Variable',
    textAlign: 'center',
  },
  smokingSubButtonTextSelected: {
    color: 'white',
  },
});