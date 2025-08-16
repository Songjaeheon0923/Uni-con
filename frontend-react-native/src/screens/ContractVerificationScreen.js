import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ContractVerificationScreen({ navigation }) {
  const handleTakePhoto = () => {
    navigation.navigate('ContractCamera');
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>계약서 안전성 검증</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 메인 아이콘 */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark" size={60} color="#FF6600" />
          </View>
        </View>

        {/* 제목 */}
        <Text style={styles.title}>계약서 안전성 검증하기</Text>
        <Text style={styles.subtitle}>AI가 계약서를 분석하여 위험 요소를 찾아드립니다</Text>

        {/* 기능 설명 */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="document-text" size={24} color="#FF6600" />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>계약서 분석</Text>
              <Text style={styles.featureDescription}>
                임대차 계약서의 모든 조항을 꼼꼼히 분석합니다
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="warning" size={24} color="#FF6600" />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>위험 요소 탐지</Text>
              <Text style={styles.featureDescription}>
                불리한 조항이나 주의해야 할 내용을 알려드립니다
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="checkmark-circle" size={24} color="#FF6600" />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>안전성 점수</Text>
              <Text style={styles.featureDescription}>
                계약서의 전체적인 안전성을 점수로 제공합니다
              </Text>
            </View>
          </View>
        </View>

        {/* 주의사항 */}
        <View style={styles.noticeContainer}>
          <View style={styles.noticeHeader}>
            <Ionicons name="information-circle" size={20} color="#666" />
            <Text style={styles.noticeTitle}>주의사항</Text>
          </View>
          <Text style={styles.noticeText}>
            • 계약서 전체가 선명하게 보이도록 촬영해주세요{'\n'}
            • 여러 페이지가 있는 경우 모든 페이지를 촬영해주세요{'\n'}
            • 개인정보는 안전하게 처리됩니다{'\n'}
            • 검증 결과는 참고용이며, 법적 효력은 없습니다
          </Text>
        </View>
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.cameraButton} onPress={handleTakePhoto}>
          <Ionicons name="camera" size={24} color="#FFFFFF" />
          <Text style={styles.cameraButtonText}>계약서 사진 촬영하기</Text>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 30,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF5E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  featuresContainer: {
    marginBottom: 30,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF5E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  noticeContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 6,
  },
  noticeText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: 30,
  },
  cameraButton: {
    backgroundColor: '#FF6600',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cameraButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});