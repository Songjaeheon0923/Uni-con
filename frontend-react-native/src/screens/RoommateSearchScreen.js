import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function RoommateSearchScreen({ navigation }) {
  const userData = {
    name: "김대학생"
  };

  const handlePersonalityTest = () => {
    navigation.navigate('PersonalityTest');
  };

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
        <Text style={styles.headerTitle}>룸메이트 찾기</Text>
      </View>

      {/* 메인 컨텐츠 */}
      <View style={styles.content}>
        <Text style={styles.welcomeText}>
          {userData.name}님의 성향을 파악하고{'\n'}딱 맞는 룸메이트를 찾아보세요!
        </Text>

        {/* 일러스트레이션 영역 */}
        <View style={styles.illustrationContainer}>
          <View style={styles.illustrationPlaceholder}>
            <View style={styles.phoneIcon}>
              <Ionicons name="phone-portrait" size={60} color="#007AFF" />
            </View>
            <View style={styles.personIcon}>
              <Ionicons name="person" size={40} color="#666" />
            </View>
          </View>
        </View>

        {/* 설명 텍스트 */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionTitle}>성향 파악으로 찾는 완벽한 매칭</Text>
          <Text style={styles.descriptionText}>
            생활 패턴, 청소 습관, 소음 민감도 등{'\n'}
            6가지 질문을 통해 당신과 가장 잘 맞는{'\n'}
            룸메이트를 찾아드립니다.
          </Text>
        </View>

        {/* 기능 설명 */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.featureText}>생활 패턴 분석</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.featureText}>성격 유형 매칭</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.featureText}>호환성 점수 제공</Text>
          </View>
        </View>

        {/* 시작하기 버튼 */}
        <TouchableOpacity 
          style={styles.startButton} 
          onPress={handlePersonalityTest}
        >
          <Text style={styles.startButtonText}>성격 유형 파악하기</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" style={styles.buttonIcon} />
        </TouchableOpacity>

        {/* 추가 정보 */}
        <Text style={styles.additionalInfo}>
          약 2-3분 소요 • 언제든지 다시 변경 가능
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 30,
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 40,
  },
  illustrationContainer: {
    marginBottom: 40,
  },
  illustrationPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#fff',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    position: 'relative',
  },
  phoneIcon: {
    position: 'absolute',
    right: 40,
    top: 60,
  },
  personIcon: {
    position: 'absolute',
    left: 50,
    bottom: 70,
  },
  descriptionContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  featuresContainer: {
    alignSelf: 'stretch',
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
  },
  startButton: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    minWidth: 200,
    justifyContent: 'center',
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  buttonIcon: {
    color: '#333',
  },
  additionalInfo: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});