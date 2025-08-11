import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const userName = "유빈"; // TODO: 실제 사용자 이름으로 변경

  const handleRoommateSearch = () => {
    // TODO: 룸메이트 찾기 화면으로 이동
    console.log('룸메이트 찾기');
  };

  const handleContractVerification = () => {
    // TODO: 계약서 검증 화면으로 이동
    console.log('계약서 검증');
  };

  const handleMap = () => {
    // TODO: 동네지도 화면으로 이동
    console.log('동네지도');
  };

  const handlePolicyNews = () => {
    // TODO: 정책 뉴스 화면으로 이동
    console.log('정책 뉴스');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* 그라데이션 헤더 */}
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.header}
        >
          <View style={styles.headerContent}>
            <Text style={styles.greeting}>안녕하세요, {userName}님 :)</Text>
            <Text style={styles.subGreeting}>오늘은 어떤 룸메이트를 찾아볼까요?</Text>
          </View>
        </LinearGradient>

        {/* 메인 기능 카드들 */}
        <View style={styles.featureCardsContainer}>
          {/* 룸메이트 찾기 메인 카드 */}
          <TouchableOpacity style={styles.mainFeatureCard} onPress={handleRoommateSearch}>
            <View style={styles.mainCardIcon}>
              <Ionicons name="people" size={32} color="white" />
            </View>
            <View style={styles.mainCardContent}>
              <Text style={styles.mainCardTitle}>나만의 룸메이트 찾기</Text>
              <Text style={styles.mainCardDescription}>
                성향 테스트로 완벽한 룸메이트를 매칭해보세요
              </Text>
            </View>
            <View style={styles.cardArrow}>
              <Ionicons name="chevron-forward" size={24} color="white" />
            </View>
          </TouchableOpacity>

          {/* 서브 기능 카드들 */}
          <View style={styles.subFeatureCards}>
            <TouchableOpacity style={styles.subFeatureCard} onPress={handleContractVerification}>
              <View style={[styles.subCardIcon, { backgroundColor: '#F59E0B' }]}>
                <Ionicons name="shield-checkmark" size={24} color="white" />
              </View>
              <Text style={styles.subCardTitle}>계약서 검증</Text>
              <Text style={styles.subCardDescription}>AI 위험 요소 분석</Text>
              <View style={styles.subCardArrow}>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.subFeatureCard} onPress={handleMap}>
              <View style={[styles.subCardIcon, { backgroundColor: '#10B981' }]}>
                <Ionicons name="location" size={24} color="white" />
              </View>
              <Text style={styles.subCardTitle}>동네지도</Text>
              <Text style={styles.subCardDescription}>주변 매물 정보</Text>
              <View style={styles.subCardArrow}>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.subFeatureCard} onPress={handlePolicyNews}>
              <View style={[styles.subCardIcon, { backgroundColor: '#8B5CF6' }]}>
                <Ionicons name="newspaper" size={24} color="white" />
              </View>
              <Text style={styles.subCardTitle}>주요 정책 News</Text>
              <Text style={styles.subCardDescription}>최신 주거 정책</Text>
              <View style={styles.subCardArrow}>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* 추천 매물 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>추천 매물</Text>
          <View style={styles.propertyList}>
            <View style={styles.propertyCard}>
              <Image 
                source={{ uri: 'https://via.placeholder.com/120x80/f0f0f0/999?text=매물' }}
                style={styles.propertyImage}
              />
              <View style={styles.propertyInfo}>
                <Text style={styles.propertyTitle}>서울시 성북구 안암동</Text>
                <Text style={styles.propertyType}>원룸 | 오피스텔 | 14평형</Text>
                <Text style={styles.propertyPrice}>보증금 1,000만원 / 월세 55만원</Text>
                <View style={styles.priceBadge}>
                  <Text style={styles.priceBadgeText}>시세보다 8% 저렴</Text>
                </View>
              </View>
            </View>

            <View style={styles.propertyCard}>
              <Image 
                source={{ uri: 'https://via.placeholder.com/120x80/f0f0f0/999?text=매물' }}
                style={styles.propertyImage}
              />
              <View style={styles.propertyInfo}>
                <Text style={styles.propertyTitle}>서울시 종로구 명륜동</Text>
                <Text style={styles.propertyType}>투룸 | 오피스텔 | 20평형</Text>
                <Text style={styles.propertyPrice}>보증금 1,500만원 / 월세 70만원</Text>
                <View style={[styles.priceBadge, styles.priceBadgeAverage]}>
                  <Text style={styles.priceBadgeText}>시세 평균</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 최근 활동 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>최근 활동</Text>
          <View style={styles.activityList}>
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: '#EF4444' }]}>
                <Ionicons name="heart" size={16} color="white" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>관심 매물 2개 추가됨</Text>
                <Text style={styles.activityTime}>2시간 전</Text>
              </View>
            </View>

            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: '#10B981' }]}>
                <Ionicons name="checkmark-circle" size={16} color="white" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>성향 테스트 완료</Text>
                <Text style={styles.activityTime}>1일 전</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 하단 여백 */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  headerContent: {
    paddingTop: 20,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  subGreeting: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  featureCardsContainer: {
    paddingHorizontal: 20,
    marginTop: -20,
  },
  mainFeatureCard: {
    backgroundColor: '#667eea',
    borderRadius: 20,
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  mainCardIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  mainCardContent: {
    flex: 1,
  },
  mainCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  mainCardDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  cardArrow: {
    marginLeft: 8,
  },
  subFeatureCards: {
    gap: 12,
  },
  subFeatureCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  subCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  subCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  subCardDescription: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
    marginRight: 8,
  },
  subCardArrow: {
    marginLeft: 8,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  propertyList: {
    gap: 16,
  },
  propertyCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  propertyImage: {
    width: 120,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginRight: 16,
  },
  propertyInfo: {
    flex: 1,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  propertyType: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  propertyPrice: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
  },
  priceBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  priceBadgeAverage: {
    backgroundColor: '#6B7280',
  },
  priceBadgeText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '500',
  },
  activityList: {
    gap: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 14,
    color: '#6B7280',
  },
  bottomSpacing: {
    height: 100,
  },
});
