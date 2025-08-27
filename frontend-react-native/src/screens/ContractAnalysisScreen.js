import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ContractAnalysisScreen = ({ navigation, route }) => {
  const { contractImagePath } = route.params || {};
  const [analysisComplete, setAnalysisComplete] = useState(false);

  useEffect(() => {
    // 3초 후 분석 완료로 설정
    const timer = setTimeout(() => {
      setAnalysisComplete(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleAnalysisComplete = () => {
    // 기존 ContractResultScreen으로 이동 (더미 데이터와 함께)
    const dummyAnalysisData = {
      subtitle: "대체로 안전하지만 일부 조항 추가 확인 필요",
      main_title: {
        user_name: "사용자",
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
    };

    // 기존 ContractResultScreen으로 이동
    navigation.navigate('ContractResult', { 
      photoUri: require('../../assets/ex.png'),
      analysisData: dummyAnalysisData,
      taskId: null // taskId가 없으므로 바로 결과 표시
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>계약서 분석</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.imageContainer}>
          <Image
            source={require('../../assets/ex.png')}
            style={styles.contractImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.analysisContainer}>
          {!analysisComplete ? (
            <>
              <ActivityIndicator size="large" color="#FF6600" />
              <Text style={styles.analysisText}>계약서를 분석하고 있습니다...</Text>
              <Text style={styles.subText}>잠시만 기다려 주세요</Text>
            </>
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={50} color="#10B585" />
              <Text style={styles.completeText}>분석이 완료되었습니다!</Text>
              <TouchableOpacity style={styles.resultButton} onPress={handleAnalysisComplete}>
                <Text style={styles.resultButtonText}>결과 보기</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  contractImage: {
    width: 200,
    height: 280,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
  },
  analysisContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  analysisText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  subText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  completeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#10B585',
    textAlign: 'center',
  },
  resultButton: {
    backgroundColor: '#FF6600',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 8,
    marginTop: 16,
  },
  resultButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ContractAnalysisScreen;