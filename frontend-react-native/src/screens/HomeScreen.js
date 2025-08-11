import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  Alert,
  RefreshControl,
  FlatList,
  Dimensions
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ApiService from "../services/api";

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation, user }) {
  const [rooms, setRooms] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('찜 많은 순');
  
  // 사용자 정보 (로그인된 사용자 또는 기본값)
  const userData = user || {
    id: "1",
    name: "김대학생",
    location: "성북구"
  };

  const filterOptions = ['찜 많은 순', '원룸', '투룸', '오피스텔', '빌라'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadRooms(), loadFavorites()]);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadRooms = async () => {
    try {
      const bounds = {
        latMin: 37.4,
        latMax: 37.6,
        lngMin: 126.9,
        lngMax: 127.2,
      };
      
      const roomData = await ApiService.searchRooms(bounds);
      setRooms(roomData);
    } catch (error) {
      console.error('방 데이터 로드 실패:', error);
    }
  };

  const loadFavorites = async () => {
    try {
      const favoriteData = await ApiService.getUserFavorites(String(String(userData.id)));
      setFavorites(favoriteData.map(room => room.room_id));
    } catch (error) {
      console.error('찜 목록 로드 실패:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const toggleFavorite = async (roomId, event) => {
    if (event) event.stopPropagation();
    
    const isFavorited = favorites.includes(roomId);
    
    try {
      if (isFavorited) {
        await ApiService.removeFavorite(roomId, String(userData.id));
        setFavorites(favorites.filter(id => id !== roomId));
      } else {
        await ApiService.addFavorite(roomId, String(userData.id));
        setFavorites([...favorites, roomId]);
      }
    } catch (error) {
      Alert.alert('오류', isFavorited ? '찜 삭제에 실패했습니다.' : '찜하기에 실패했습니다.');
    }
  };

  const handleRoommateSearch = () => {
    navigation.navigate('RoommateSearch');
  };

  const handleContractVerification = () => {
    Alert.alert('계약서 검증', '계약서 안전성 검증 기능이 곧 출시됩니다!');
  };

  const handleNewsDetail = () => {
    Alert.alert('정책 뉴스', '청년 전세자금 대출에 대한 자세한 내용을 확인하세요.');
  };

  const getFilteredRooms = () => {
    let filteredRooms = [...rooms];
    
    switch(selectedFilter) {
      case '찜 많은 순':
        return filteredRooms.sort((a, b) => b.favorite_count - a.favorite_count);
      case '원룸':
        return filteredRooms.filter(room => room.rooms === 1);
      case '투룸':
        return filteredRooms.filter(room => room.rooms === 2);
      case '오피스텔':
        return filteredRooms.filter(room => room.address.includes('오피스텔'));
      case '빌라':
        return filteredRooms.filter(room => room.address.includes('빌라'));
      default:
        return filteredRooms;
    }
  };

  const renderRoomCard = ({ item }) => (
    <View style={styles.roomCard}>
      <View style={styles.roomImageContainer}>
        <View style={styles.placeholderImage}>
          <Ionicons name="home" size={30} color="#ccc" />
        </View>
        <TouchableOpacity 
          style={styles.heartButton}
          onPress={(event) => toggleFavorite(item.room_id, event)}
        >
          <Ionicons 
            name={favorites.includes(item.room_id) ? "heart" : "heart-outline"} 
            size={18} 
            color={favorites.includes(item.room_id) ? "#ff4757" : "#fff"} 
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.roomCardInfo}>
        <Text style={styles.roomType}>
          {item.rooms === 1 ? '원룸' : item.rooms === 2 ? '투룸' : '다가구'}, {item.transaction_type} {item.price_deposit}
          {item.price_monthly > 0 && `/${item.price_monthly}`}
        </Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={12} color="#666" />
          <Text style={styles.locationText}>
            {item.address.split(' ').slice(-3).join(' ')}
          </Text>
        </View>
      </View>
    </View>
  );

  const FilterButton = ({ title, isSelected, onPress }) => (
    <TouchableOpacity 
      style={[styles.filterButton, isSelected && styles.filterButtonSelected]}
      onPress={onPress}
    >
      <Text style={[styles.filterButtonText, isSelected && styles.filterButtonTextSelected]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>데이터를 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container} 
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* 인사말 */}
      <View style={styles.greetingContainer}>
        <Text style={styles.greeting}>안녕하세요 {userData.name}님 :)</Text>
      </View>

      {/* 나만의 룸메이트 찾기 박스 */}
      <TouchableOpacity style={styles.roommateBox} onPress={handleRoommateSearch}>
        <View style={styles.roommateBoxContent}>
          <Text style={styles.roommateBoxTitle}>나만의 룸메이트 찾기</Text>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </View>
      </TouchableOpacity>

      {/* 계약서 안전성 검증 박스 */}
      <TouchableOpacity style={styles.contractBox} onPress={handleContractVerification}>
        <View style={styles.contractBoxContent}>
          <Text style={styles.contractBoxTitle}>계약서 안전성 검증하기</Text>
          <Ionicons name="shield-checkmark-outline" size={18} color="#666" />
        </View>
      </TouchableOpacity>

      {/* 인기 매물 섹션 */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>{userData.location} 인기 매물</Text>
        
        {/* 필터 버튼들 */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
        >
          {filterOptions.map((option) => (
            <FilterButton
              key={option}
              title={option}
              isSelected={selectedFilter === option}
              onPress={() => setSelectedFilter(option)}
            />
          ))}
        </ScrollView>

        {/* 방 카드 리스트 - 가로 스크롤 */}
        <FlatList
          data={getFilteredRooms().slice(0, 10)}
          renderItem={renderRoomCard}
          keyExtractor={(item) => item.room_id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.roomCardContainer}
        />
      </View>

      {/* 주요 정책 NEWS */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>주요 정책 NEWS</Text>
        
        <View style={styles.newsBox}>
          <View style={styles.newsContent}>
            <Text style={styles.newsTag}>#청년 정책</Text>
            <Text style={styles.newsTitle}>청년 전세자금 대출, 최대 1억까지 가능!</Text>
          </View>
          <TouchableOpacity style={styles.newsButton} onPress={handleNewsDetail}>
            <Text style={styles.newsButtonText}>자세히 보기</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
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
  greetingContainer: {
    padding: 20,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  roommateBox: {
    backgroundColor: '#e0e0e0',
    marginHorizontal: 20,
    marginTop: 15,
    padding: 20,
    borderRadius: 12,
  },
  roommateBoxContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roommateBoxTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  contractBox: {
    backgroundColor: '#f0f0f0',
    marginHorizontal: 20,
    marginTop: 10,
    padding: 15,
    borderRadius: 12,
  },
  contractBoxContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contractBoxTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  sectionContainer: {
    marginTop: 25,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  filterContainer: {
    marginBottom: 15,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextSelected: {
    color: '#fff',
  },
  roomCardContainer: {
    paddingLeft: 0,
    paddingRight: 10,
  },
  roomCard: {
    width: 160,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roomImageContainer: {
    position: 'relative',
    height: 120,
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomCardInfo: {
    padding: 12,
  },
  roomType: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  newsBox: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newsContent: {
    flex: 1,
  },
  newsTag: {
    fontSize: 12,
    color: '#007AFF',
    marginBottom: 4,
  },
  newsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  newsButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  newsButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});