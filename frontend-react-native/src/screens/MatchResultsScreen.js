import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

export default function MatchResultsScreen({ navigation }) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      const matchData = await ApiService.getMatches();
      setMatches(matchData);
    } catch (error) {
      console.error('매칭 결과 로드 실패:', error);
      Alert.alert('알림', '아직 매칭 가능한 룸메이트가 없습니다.');
      setMatches([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMatches();
  };

  const getCompatibilityColor = (score) => {
    if (score >= 0.8) return '#4CAF50'; // 녹색
    if (score >= 0.6) return '#FF9800'; // 주황색
    return '#F44336'; // 빨간색
  };

  const getCompatibilityText = (score) => {
    if (score >= 0.8) return '매우 좋음';
    if (score >= 0.6) return '좋음';
    return '보통';
  };

  const renderMatchItem = ({ item }) => (
    <View style={styles.matchCard}>
      <View style={styles.matchHeader}>
        <View style={styles.profileSection}>
          <View style={styles.profileImage}>
            <Ionicons name="person" size={30} color="#666" />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{item.name}</Text>
            <Text style={styles.profileEmail}>{item.email}</Text>
          </View>
        </View>
        <View style={styles.scoreSection}>
          <Text 
            style={[
              styles.scoreText, 
              { color: getCompatibilityColor(item.compatibility_score) }
            ]}
          >
            {Math.round(item.compatibility_score * 100)}%
          </Text>
          <Text style={styles.scoreLabel}>
            {getCompatibilityText(item.compatibility_score)}
          </Text>
        </View>
      </View>

      <View style={styles.detailsContainer}>
        <Text style={styles.detailsTitle}>호환성 분석</Text>
        <View style={styles.detailsGrid}>
          <DetailItem
            icon="bed"
            title="수면패턴"
            isMatch={item.matching_details.sleep_type_match}
          />
          <DetailItem
            icon="time"
            title="시간대"
            isMatch={item.matching_details.home_time_match}
          />
          <DetailItem
            icon="brush"
            title="청소습관"
            isMatch={item.matching_details.cleaning_frequency_compatible}
          />
          <DetailItem
            icon="ban"
            title="흡연여부"
            isMatch={item.matching_details.smoking_compatible}
          />
        </View>
      </View>

      <TouchableOpacity 
        style={styles.contactButton}
        onPress={() => Alert.alert('연락하기', `${item.name}님께 메시지를 보내시겠습니까?`)}
      >
        <Ionicons name="chatbubble-ellipses" size={16} color="#007AFF" />
        <Text style={styles.contactButtonText}>연락하기</Text>
      </TouchableOpacity>
    </View>
  );

  const DetailItem = ({ icon, title, isMatch }) => (
    <View style={styles.detailItem}>
      <Ionicons 
        name={icon} 
        size={16} 
        color={isMatch ? '#4CAF50' : '#F44336'} 
      />
      <Text style={[
        styles.detailItemText,
        { color: isMatch ? '#4CAF50' : '#F44336' }
      ]}>
        {title}
      </Text>
      <Ionicons 
        name={isMatch ? "checkmark-circle" : "close-circle"} 
        size={14} 
        color={isMatch ? '#4CAF50' : '#F44336'} 
      />
    </View>
  );

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={60} color="#ccc" />
      <Text style={styles.emptyTitle}>매칭된 룸메이트가 없습니다</Text>
      <Text style={styles.emptyText}>
        아직 호환되는 룸메이트가 없어요.{'\n'}
        더 많은 사람들이 가입하면 알림을 드릴게요!
      </Text>
      <TouchableOpacity 
        style={styles.retryButton}
        onPress={onRefresh}
      >
        <Ionicons name="refresh" size={16} color="#007AFF" />
        <Text style={styles.retryButtonText}>새로고침</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>매칭 결과를 분석하는 중...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.navigate('HomeMain')}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>매칭 결과</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={22} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* 결과 요약 */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>
          {matches.length}명의 룸메이트를 찾았어요!
        </Text>
        {matches.length > 0 && (
          <Text style={styles.summaryText}>
            성격 유형과 생활 패턴을 분석하여{'\n'}가장 잘 맞는 순서로 정렬했습니다.
          </Text>
        )}
      </View>

      {/* 매칭 리스트 */}
      <FlatList
        data={matches}
        renderItem={renderMatchItem}
        keyExtractor={(item) => item.user_id.toString()}
        ListEmptyComponent={EmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          matches.length === 0 && styles.emptyListContent
        ]}
      />
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
  refreshButton: {
    padding: 5,
  },
  summaryContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  emptyListContent: {
    flex: 1,
  },
  matchCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  matchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
    color: '#666',
  },
  scoreSection: {
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#666',
  },
  detailsContainer: {
    marginBottom: 20,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 8,
  },
  detailItemText: {
    fontSize: 14,
    marginLeft: 6,
    marginRight: 6,
    flex: 1,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3F8FF',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 30,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#F3F8FF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  retryButtonText: {
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 6,
    fontWeight: '500',
  },
});