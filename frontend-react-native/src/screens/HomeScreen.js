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
  Dimensions,
  SafeAreaView
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import HomeIcon from "../components/HomeIcon";
import * as Location from 'expo-location';
import ApiService from "../services/api";
import RoomDetailModal from "../components/RoomDetailModal";

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation, user }) {
  const [rooms, setRooms] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('찜 많은 순');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [currentLocation, setCurrentLocation] = useState('성북구');
  const [policyNews, setPolicyNews] = useState([]);
  const [loadingPolicies, setLoadingPolicies] = useState(false);

  // 사용자 정보 (로그인된 사용자 또는 기본값)
  const userData = user || {
    id: "1",
    name: "김대학생",
    location: "성북구"
  };

  const filterOptions = ['찜 많은 순', '원룸', '투룸', '오피스텔', '빌라'];

  useEffect(() => {
    loadData();
    getCurrentLocation();
    loadPolicyNews();
  }, []);

  const getCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('위치 권한이 거부되었습니다');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // 역 지오코딩으로 주소 가져오기
      let address = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (address.length > 0) {
        const locationInfo = address[0];
        // 구 또는 동 정보 추출
        const district = locationInfo.district || locationInfo.subLocality || locationInfo.city;
        if (district) {
          setCurrentLocation(district.replace(/구$|시$/, '')); // "성북구" 형태로 설정
        }
      }
    } catch (error) {
      console.error('위치 가져오기 실패:', error);
      // 실패 시 기본값 유지
    }
  };

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

  const loadPolicyNews = async () => {
    setLoadingPolicies(true);
    try {
      const policies = await ApiService.getPolicyRecommendations(3);
      setPolicyNews(policies || []);
    } catch (error) {
      console.error('정책 뉴스 로드 실패:', error);
      // 로그인하지 않은 경우 인기 정책으로 대체
      try {
        const popularPolicies = await ApiService.getPopularPolicies(3);
        setPolicyNews(popularPolicies || []);
      } catch (fallbackError) {
        console.error('인기 정책 로드도 실패:', fallbackError);
        setPolicyNews([]);
      }
    } finally {
      setLoadingPolicies(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    Promise.all([loadData(), loadPolicyNews()]);
  };

  const toggleFavorite = async (roomId, event) => {
    if (event) event.stopPropagation();

    const isFavorited = favorites.includes(roomId);

    try {
      if (isFavorited) {
        await ApiService.removeFavorite(roomId);
        setFavorites(favorites.filter(id => id !== roomId));
      } else {
        await ApiService.addFavorite(roomId, String(userData.id));
        setFavorites([...favorites, roomId]);
      }
      // 찜 상태 변경 시 저장하여 다른 화면에서 감지할 수 있도록 함
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem('favoriteChanged', Date.now().toString());
      } catch (storageError) {
        console.log('Storage update failed:', storageError);
      }
    } catch (error) {
      Alert.alert('오류', isFavorited ? '찜 삭제에 실패했습니다.' : '찜하기에 실패했습니다.');
    }
  };

  const handleRoommateSearch = () => {
    navigation.navigate('RoommateSearch');
  };

  const checkProfileCompletion = async () => {
    try {
      const profile = await ApiService.getUserProfile();
      return profile && profile.is_complete;
    } catch (error) {
      console.error('프로필 확인 실패:', error);
      return false;
    }
  };

  const handleSkipTest = async () => {
    const isProfileComplete = await checkProfileCompletion();
    
    if (isProfileComplete) {
      // 프로필이 완성되어 있으면 바로 매칭 화면으로 이동
      navigation.navigate('MatchResults');
    } else {
      // 프로필이 완성되지 않았으면 검사를 하라는 alert
      Alert.alert(
        '성격 유형 검사 필요',
        '룸메이트 매칭을 위해서는 성격 유형 검사를 완료해야 합니다.',
        [
          { text: '취소', style: 'cancel' },
          { text: '검사하기', onPress: () => navigation.navigate('RoommateSearch') }
        ]
      );
    }
  };

  const handleContractVerification = () => {
    navigation.navigate('ContractVerification');
  };

  const handleNewsDetail = async (policy) => {
    try {
      // 정책 조회 기록
      if (policy && policy.policy && policy.policy.id) {
        await ApiService.recordPolicyView(policy.policy.id);
      }
      
      Alert.alert(
        '정책 뉴스', 
        policy?.policy?.description || '정책 상세 내용을 확인하세요.',
        [
          { text: '닫기', style: 'cancel' },
          { 
            text: '자세히 보기', 
            onPress: () => {
              if (policy?.policy?.url) {
                // 실제로는 웹뷰나 브라우저로 열기
                console.log('정책 URL:', policy.policy.url);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('정책 조회 기록 실패:', error);
      Alert.alert('정책 뉴스', policy?.policy?.description || '정책 상세 내용을 확인하세요.');
    }
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

  const handleRoomPress = (room) => {
    console.log('🏠 HomeScreen selected room:', room); // 디버그용
    // RoomDetailScreen으로 이동
    navigation.navigate('RoomDetail', { room });
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedRoom(null);
  };

  const handleNavigateToChat = (otherUser) => {
    handleModalClose();
    navigation.navigate('Chat', {
      user: otherUser,
      currentUser: userData
    });
  };

  const renderRoomCard = ({ item }) => (
    <TouchableOpacity style={styles.roomCard} onPress={() => handleRoomPress(item)}>
      <View style={styles.roomImageContainer}>
        <View style={styles.placeholderImage}>
          <HomeIcon size={30} color="#ccc" />
        </View>
        <TouchableOpacity
          style={styles.heartButton}
          onPress={(event) => {
            event.stopPropagation();
            toggleFavorite(item.room_id, event);
          }}
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
    </TouchableOpacity>
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
    <SafeAreaView style={styles.safeContainer}>
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* 채팅 버튼 */}
      <View style={styles.topContainer}>
        <TouchableOpacity style={styles.chatButton}>
          <View style={styles.chatButtonInner}>
            <View style={styles.speechBubble}>
              <View style={styles.longLine} />
              <View style={styles.shortLine} />
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* 인사말 */}
      <View style={styles.greetingContainer}>
        <Text style={styles.greeting}>안녕하세요 {userData.name}님 :)</Text>
      </View>

      {/* 나만의 룸메이트 찾기 박스 */}
      <TouchableOpacity style={styles.roommateBox} onPress={() => navigation.navigate('RoommateChoice')}>
        <View style={styles.roommateBoxContent}>
          <View style={styles.roommateTextContainer}>
            <Text style={styles.roommateBoxTitle}>나만의 룸메이트 찾기</Text>
            <Text style={styles.roommateBoxSubtitle}>내 성향을 파악하고 딱 맞는 룸메이트를 찾아보세요!</Text>
          </View>
        </View>
        <View style={styles.arrowCircle}>
          <Ionicons name="arrow-forward" size={20} color="#737373" />
        </View>
      </TouchableOpacity>

      {/* 계약서 안정성 검증 박스 */}
      <TouchableOpacity style={styles.contractBox} onPress={handleContractVerification}>
        <View style={styles.contractBoxContent}>
          <View style={styles.contractTextContainer}>
            <Text style={styles.contractBoxTitle}>계약서 안전성 검증하기</Text>
            <Text style={styles.contractBoxSubtitle}>내가 갖고 있는 계약서의 안전 정도를 검증해보세요</Text>
          </View>
        </View>
        <View style={styles.contractArrowCircle}>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </View>
      </TouchableOpacity>

      {/* 인기 매물 섹션 */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>{currentLocation} 인기 매물</Text>

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

        {loadingPolicies ? (
          <View style={styles.newsBox}>
            <Text style={styles.loadingText}>정책 정보를 불러오는 중...</Text>
          </View>
        ) : policyNews.length > 0 ? (
          policyNews.map((policy, index) => (
            <View key={index} style={[styles.newsBox, index > 0 && { marginTop: 10 }]}>
              <View style={styles.newsContent}>
                <Text style={styles.newsTag}>#{policy.policy.category}</Text>
                <Text style={styles.newsTitle} numberOfLines={2}>
                  {policy.policy.title}
                </Text>
                {policy.reason && (
                  <Text style={styles.newsReason}>{policy.reason}</Text>
                )}
              </View>
              <TouchableOpacity 
                style={styles.newsButton} 
                onPress={() => handleNewsDetail(policy)}
              >
                <Text style={styles.newsButtonText}>자세히 보기</Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.newsBox}>
            <View style={styles.newsContent}>
              <Text style={styles.newsTag}>#청년 정책</Text>
              <Text style={styles.newsTitle}>정책 정보를 준비 중입니다</Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>

    {/* Room Detail Modal */}
    <RoomDetailModal
      visible={showModal}
      room={selectedRoom}
      user={userData}
      onClose={handleModalClose}
      onNavigateToChat={handleNavigateToChat}
    />
  </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 15,
    backgroundColor: '#fff',
  },
  greetingContainer: {
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  chatButton: {
    padding: 4,
  },
  chatButtonInner: {
    width: 37,
    height: 37,
    borderRadius: 18.5,
    backgroundColor: '#E8E8E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speechBubble: {
    width: 17,
    height: 17,
    borderWidth: 2.0,
    borderColor: '#464646',
    borderTopLeftRadius: 50,
    borderTopRightRadius: 50,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  longLine: {
    right: 0,
    width: 9,
    height: 2.0,
    backgroundColor: '#464646',
    borderRadius: 1,
    marginBottom: 2,
  },
  shortLine: {
    right: 0,
    width: 6,
    height: 2.0,
    backgroundColor: '#464646',
    borderRadius: 1,
  },
  roommateBox: {
    backgroundColor: '#737373',
    marginHorizontal: 20,
    marginTop: 15,
    paddingHorizontal: 19,
    paddingTop: 23,
    paddingBottom: 25,
    borderRadius: 18,
    position: 'relative',
    height: 193,
  },
  roommateBoxContent: {
    flex: 1,
  },
  roommateTextContainer: {
    alignItems: 'flex-start',
  },
  roommateBoxTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 24,
  },
  roommateBoxSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: '#FFFFFF',
    opacity: 0.8,
    lineHeight: 14,
  },
  arrowCircle: {
    position: 'absolute',
    right: 15,
    bottom: 17,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#D9D9D9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contractBox: {
    backgroundColor: '#E5E5E5',
    marginHorizontal: 20,
    marginTop: 12,
    paddingHorizontal: 19,
    paddingTop: 21,
    paddingBottom: 21,
    borderRadius: 18,
    position: 'relative',
    height: 87,
  },
  contractBoxContent: {
    flex: 1,
  },
  contractTextContainer: {
    alignItems: 'flex-start',
  },
  contractBoxTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#343434',
    marginBottom: 8,
    lineHeight: 24,
  },
  contractBoxSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: '#343434',
    opacity: 0.8,
    lineHeight: 14,
  },
  contractArrowCircle: {
    position: 'absolute',
    right: 15,
    top: 14,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#CACACA',
    justifyContent: 'center',
    alignItems: 'center',
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
    backgroundColor: '#FF6600',
    borderColor: '#FF6600',
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
    color: '#228B22',
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
  loadingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  newsReason: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
});
