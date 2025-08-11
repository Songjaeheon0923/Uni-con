import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

export default function PersonalityTestScreen({ navigation }) {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const goToNext = () => {
    const currentQuestion = questions[currentQuestionIndex];
    if (!answers[currentQuestion.id]) {
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
      Alert.alert(
        '완료!', 
        '성격 유형 분석이 완료되었습니다!\n이제 매칭된 룸메이트를 확인해보세요.',
        [
          { text: '확인', onPress: () => navigation.navigate('MatchResults') }
        ]
      );
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

  const getCategoryIcon = (questionId) => {
    const iconMap = {
      'sleep_type': 'bed',
      'home_time': 'time',
      'cleaning_frequency': 'brush',
      'cleaning_sensitivity': 'sparkles',
      'smoking_status': 'ban',
      'noise_sensitivity': 'volume-medium'
    };
    return iconMap[questionId] || 'help-circle';
  };

  const getCategoryTitle = (questionId) => {
    const titleMap = {
      'sleep_type': '수면 패턴',
      'home_time': '활동 시간',
      'cleaning_frequency': '청소 빈도',
      'cleaning_sensitivity': '청소 민감도',
      'smoking_status': '흡연 상태',
      'noise_sensitivity': '소음 민감도'
    };
    return titleMap[questionId] || '질문';
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
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>성격 유형 검사</Text>
        <Text style={styles.progressText}>
          {currentQuestionIndex + 1}/{questions.length}
        </Text>
      </View>

      {/* 진행률 바 */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[styles.progressFill, { width: `${getProgressPercentage()}%` }]} 
          />
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 카테고리 표시 */}
        <View style={styles.categoryContainer}>
          <View style={styles.categoryIcon}>
            <Ionicons 
              name={getCategoryIcon(currentQuestion.id)} 
              size={24} 
              color="#FF6600" 
            />
          </View>
          <Text style={styles.categoryText}>
            {getCategoryTitle(currentQuestion.id)}
          </Text>
        </View>

        {/* 질문 */}
        <Text style={styles.questionText}>{currentQuestion.question}</Text>

        {/* 답변 옵션들 */}
        <View style={styles.optionsContainer}>
          {currentQuestion.options.map((option, index) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionButton,
                answers[currentQuestion.id] === option.value && styles.optionButtonSelected
              ]}
              onPress={() => handleAnswer(currentQuestion.id, option.value)}
            >
              <View style={styles.optionContent}>
                <View style={[
                  styles.radioButton,
                  answers[currentQuestion.id] === option.value && styles.radioButtonSelected
                ]}>
                  {answers[currentQuestion.id] === option.value && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
                <Text style={[
                  styles.optionText,
                  answers[currentQuestion.id] === option.value && styles.optionTextSelected
                ]}>
                  {option.label}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* 네비게이션 버튼들 */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[styles.navButton, styles.prevButton]}
          onPress={goToPrevious}
          disabled={currentQuestionIndex === 0}
        >
          <Ionicons 
            name="chevron-back" 
            size={20} 
            color={currentQuestionIndex === 0 ? "#ccc" : "#666"} 
          />
          <Text style={[
            styles.navButtonText,
            currentQuestionIndex === 0 && styles.navButtonTextDisabled
          ]}>
            이전
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.navButton, 
            styles.nextButton,
            answers[currentQuestion.id] && styles.nextButtonEnabled
          ]}
          onPress={goToNext}
          disabled={!answers[currentQuestion.id] || isSubmitting}
        >
          <Text style={[
            styles.navButtonText,
            styles.nextButtonText,
            answers[currentQuestion.id] && styles.nextButtonTextEnabled
          ]}>
            {currentQuestionIndex === questions.length - 1 ? '완료' : '다음'}
          </Text>
          <Ionicons 
            name={currentQuestionIndex === questions.length - 1 ? "checkmark" : "chevron-forward"} 
            size={20} 
            color={answers[currentQuestion.id] ? "#fff" : "#ccc"} 
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    marginRight: 15,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#f0f0f0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#228B22',
    borderRadius: 3,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 20,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6600',
  },
  questionText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 30,
    marginBottom: 30,
  },
  optionsContainer: {
    marginBottom: 30,
  },
  optionButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#f0f0f0',
  },
  optionButtonSelected: {
    borderColor: '#FF6600',
    backgroundColor: '#F3F8FF',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    borderColor: '#FF6600',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#228B22',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  optionTextSelected: {
    color: '#FF6600',
    fontWeight: '600',
  },
  navigationContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
  },
  prevButton: {
    marginRight: 10,
    backgroundColor: '#f8f8f8',
  },
  nextButton: {
    marginLeft: 10,
    backgroundColor: '#e0e0e0',
  },
  nextButtonEnabled: {
    backgroundColor: '#228B22',
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginHorizontal: 8,
  },
  navButtonTextDisabled: {
    color: '#ccc',
  },
  nextButtonText: {
    color: '#ccc',
  },
  nextButtonTextEnabled: {
    color: '#fff',
  },
});