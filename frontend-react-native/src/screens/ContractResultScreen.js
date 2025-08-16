import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ContractResultScreen({ navigation, route }) {
  const { photoUri } = route.params;
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [analysisResult, setAnalysisResult] = useState(null);

  useEffect(() => {
    // 분석 시뮬레이션 (3초 후 결과 표시)
    const timer = setTimeout(() => {
      setIsAnalyzing(false);
      setAnalysisResult(getHardcodedResult());
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const getHardcodedResult = () => ({
    safetyScore: 73,
    riskLevel: 'medium',
    mainIssues: [
      {
        type: 'warning',
        title: '보증금 반환 조건 미흡',
        description: '계약 종료 시 보증금 반환에 대한 구체적인 조건이 명시되지 않았습니다.',
        severity: 'high'
      },
      {
        type: 'caution',
        title: '수리비 부담 주체 불분명',
        description: '시설물 수리비용의 부담 주체가 명확하게 구분되지 않았습니다.',
        severity: 'medium'
      },
      {
        type: 'info',
        title: '임대료 인상 제한 조항 확인',
        description: '임대료 인상에 대한 제한 조항이 포함되어 있어 유리합니다.',
        severity: 'low'
      }
    ],
    checkedItems: [
      { item: '임대인 신원 확인', status: 'good' },
      { item: '임대료 및 관리비', status: 'good' },
      { item: '계약 기간 명시', status: 'good' },
      { item: '보증금 반환 조건', status: 'warning' },
      { item: '수리비 부담 조건', status: 'warning' },
      { item: '특약 사항', status: 'good' }
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

  const getScoreColor = (score) => {
    if (score >= 80) return '#4CAF50';
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
      case 'good': return '#4CAF50';
      case 'warning': return '#FF9800';
      case 'error': return '#F44336';
      default: return '#4CAF50';
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
          <Text style={styles.resultTitle}>
            대체로 안전하지만 일부 조항 추가 확인 필요{'\n'}
            유빈님의 계약서, {analysisResult.safetyScore}점
          </Text>
          
          {/* 계약서 이미지와 경고 오버레이 */}
          <View style={styles.contractImageContainer}>
            <Image source={{ uri: photoUri }} style={styles.contractImage} />
            {/* 경고 아이콘들 오버레이 */}
            <Text style={[styles.warningIcon, { top: 40, left: 0 }]}>⚠️</Text>
            <Text style={[styles.warningIcon, { top: 250, left: 0 }]}>⚠️</Text>
            <Text style={[styles.warningIcon, { top: 280, left: 0 }]}>⚠️</Text>
            <Text style={[styles.warningIcon, { top: 190, right: 18 }]}>⚠️</Text>
          </View>
        </View>

        {/* 분석 결과 */}
        <View style={styles.analysisSection}>
          <Text style={styles.sectionTitle}>분석 결과</Text>
          <View style={styles.resultItem}>
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
            </View>
            <Text style={styles.resultText}>필수 항목이 모두 기재 완료되어 있습니다.</Text>
          </View>
          <View style={styles.resultItem}>
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
            </View>
            <Text style={styles.resultText}>계약 기간·연장 조건이 명확합니다.</Text>
          </View>
          <View style={styles.resultItem}>
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={12} color="#FFFFFF" />
            </View>
            <Text style={styles.resultText}>서명란 이상 없습니다.</Text>
          </View>
          <View style={[styles.resultItem, styles.warningItem]}>
            <View style={styles.warningCircle}>
              <Ionicons name="close" size={12} color="#313131" />
            </View>
            <Text style={styles.resultText}>특약 일부 표현이 모호합니다.</Text>
          </View>
        </View>

        {/* 의심 조항 */}
        <View style={styles.analysisSection}>
          <Text style={styles.sectionTitle}>의심 조항</Text>
          <View style={[styles.resultItem, styles.suspiciousItem]}>
            <Text style={styles.warningEmoji}>⚠️</Text>
            <Text style={styles.resultText}>관리비 범위 불명확 ("기타 비용 포함")</Text>
          </View>
          <View style={[styles.resultItem, styles.suspiciousItem]}>
            <Text style={styles.warningEmoji}>⚠️</Text>
            <Text style={styles.resultText}>중도 해지 위약금 기준 미기재</Text>
          </View>
          <View style={[styles.resultItem, styles.suspiciousItem]}>
            <Text style={styles.warningEmoji}>⚠️</Text>
            <Text style={styles.resultText}>보증금 반환 시점 구체적 기한 없음</Text>
          </View>
          <View style={[styles.resultItem, styles.ambiguousItem]}>
            <Text style={styles.warningEmoji}>⚠️</Text>
            <Text style={styles.resultText}>특약 일부 표현이 모호합니다.</Text>
          </View>
        </View>

        {/* 집주인에게 물어볼 것 */}
        <View style={styles.analysisSection}>
          <Text style={styles.sectionTitle}>집주인에게 물어볼 것</Text>
          <View style={styles.resultItem}>
            <View style={styles.questionCircle}>
              <Ionicons name="help" size={12} color="#313131" />
            </View>
            <Text style={styles.resultText}>'기타 비용'에 포함되는 항목은 무엇인가요?</Text>
          </View>
          <View style={styles.resultItem}>
            <View style={styles.questionCircle}>
              <Ionicons name="help" size={12} color="#313131" />
            </View>
            <Text style={styles.resultText}>중도 해지 위약금 계산 방식은 어떻게 되나요?</Text>
          </View>
          <View style={styles.resultItem}>
            <View style={styles.questionCircle}>
              <Ionicons name="help" size={12} color="#313131" />
            </View>
            <Text style={styles.resultText}>보증금은 퇴거 후 며칠 이내 반환되나요?</Text>
          </View>
          <View style={styles.resultItem}>
            <View style={styles.questionCircle}>
              <Ionicons name="help" size={12} color="#313131" />
            </View>
            <Text style={styles.resultText}>시설 보수·수리 비용은 누가 부담하나요?</Text>
          </View>
        </View>

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
    height: 150,
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
  resultTitle: {
    fontSize: 24,
    fontWeight: '300',
    color: '#1C1C1C',
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: 22,
  },
  contractImageContainer: {
    width: 286,
    height: 347,
    position: 'relative',
  },
  contractImage: {
    width: 236,
    height: 347,
    marginLeft: 25,
    resizeMode: 'cover',
    borderWidth: 1,
    borderColor: '#000000',
  },
  warningIcon: {
    position: 'absolute',
    fontSize: 18,
    color: 'rgba(0, 0, 0, 0.8)',
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
  warningItem: {
    backgroundColor: '#FFDFDF',
  },
  warningCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suspiciousItem: {
    backgroundColor: '#FFE8E8',
  },
  ambiguousItem: {
    backgroundColor: '#FFEDE8',
  },
  warningEmoji: {
    fontSize: 18,
    color: 'rgba(0, 0, 0, 0.8)',
  },
  questionCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendationContainer: {
    backgroundColor: '#E8F5E8',
    borderRadius: 8,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
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
});