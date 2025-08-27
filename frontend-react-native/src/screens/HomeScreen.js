import React, { useState, useEffect, useRef } from "react";
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
import PeopleIcon from "../components/PeopleIcon";
import DocumentIcon from "../components/DocumentIcon";
import ChatIcon from "../components/ChatIcon";
import * as Location from 'expo-location';
import ApiService from "../services/api";
import RoomDetailModal from "../components/RoomDetailModal";
import { formatPrice, formatArea, getRoomType, formatFloor } from "../utils/priceUtils";

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
  const [policyPage, setPolicyPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const scrollViewRef = useRef(null);
  const policyNewsRef = useRef(null);

  // 사용자 정보 (로그인된 사용자 또는 기본값)
  const userData = user || {
    id: "1",
    name: "김대학생",
    location: "성북구"
  };

  const filterOptions = ['찜 많은 순', '원룸', '투룸', '오피스텔', '빌라', '아파트'];

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

  const loadPolicyNews = async (page = 1) => {
    setLoadingPolicies(true);
    try {
      if (user?.token) {
        // 로그인된 사용자 - 개인화된 추천 정책 (페이지네이션 사용)
        const offset = (page - 1) * 5;
        const response = await ApiService.getPolicyRecommendations(5, offset);

        if (response && response.policies) {
          setPolicyNews(response.policies);
          setPolicyPage(page);
          const totalPolicies = response.total_count || 0;
          setTotalPages(Math.ceil(totalPolicies / 5));
        } else {
          setPolicyNews([]);
          setPolicyPage(1);
          setTotalPages(1);
        }
      } else {
        // 비로그인 사용자 - 인기 정책 (페이지네이션 지원)
        const offset = (page - 1) * 5;
        const response = await ApiService.getPopularPolicies(5, offset);

        if (response && response.data) {
          setPolicyNews(response.data || []);
          setPolicyPage(page);
          const totalPolicies = response.total_count || 0;
          setTotalPages(Math.ceil(totalPolicies / 5));
        } else {
          // 폴백
          setPolicyNews([]);
          setPolicyPage(1);
          setTotalPages(1);
        }
      }
    } catch (error) {
      console.error('정책 뉴스 로드 실패:', error);
      // 에러 시 빈 배열로 설정
      setPolicyNews([]);
      setPolicyPage(1);
      setTotalPages(1);
    } finally {
      setLoadingPolicies(false);
    }
  };

  const goToPage = async (page) => {
    if (loadingPolicies || page < 1 || page > totalPages || page === policyPage) return;
    await loadPolicyNews(page);

    // 페이지 변경 후 정책 뉴스 섹션으로 스크롤
    setTimeout(() => {
      if (policyNewsRef.current && scrollViewRef.current) {
        policyNewsRef.current.measureLayout(
          scrollViewRef.current,
          (x, y) => {
            scrollViewRef.current.scrollTo({ y: y - 20, animated: true });
          }
        );
      }
    }, 100);
  };

  const renderPaginationNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, policyPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    // 끝에서부터 계산해서 시작점 조정
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <TouchableOpacity
          key={i}
          style={[
            styles.pageButton,
            policyPage === i && styles.activePageButton
          ]}
          onPress={() => goToPage(i)}
          disabled={loadingPolicies}
        >
          <Text style={[
            styles.pageButtonText,
            policyPage === i && styles.activePageButtonText
          ]}>
            {i}
          </Text>
        </TouchableOpacity>
      );
    }

    return pages;
  };

  const onRefresh = () => {
    setRefreshing(true);
    Promise.all([loadData(), loadPolicyNews(1)]);
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
      // 정책 조회 기록 (안전하게 접근)
      const policyId = policy?.policy?.id || policy?.id;
      if (policyId) {
        await ApiService.recordPolicyView(policyId);
      }

      const description = policy?.policy?.description || policy?.description || policy?.content || '정책 상세 내용을 확인하세요.';
      const url = policy?.policy?.url || policy?.url;

      Alert.alert(
        '정책 뉴스',
        description,
        [
          { text: '닫기', style: 'cancel' },
          {
            text: '자세히 보기',
            onPress: () => {
              if (url) {
                // 실제로는 웹뷰나 브라우저로 열기
                console.log('정책 URL:', url);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('정책 조회 기록 실패:', error);
      const fallbackDescription = policy?.policy?.description || policy?.description || policy?.content || '정책 상세 내용을 확인하세요.';
      Alert.alert('정책 뉴스', fallbackDescription);
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
      case '아파트':
        return filteredRooms.filter(room => room.address.includes('아파트'));
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

  // 주소를 기반으로 가장 가까운 역과 거리 계산
  const getNearestStation = (address) => {
    if (!address) return '역 정보 없음';
    
    // 서울 주요 역 리스트 (간단한 매칭용)
    const stations = {
      '성북': '안암역 10분',
      '안암': '안암역 5분',
      '보문': '보문역 8분',
      '종로': '종각역 12분',
      '중구': '을지로입구역 10분',
      '강남': '강남역 7분',
      '서초': '강남역 15분',
      '송파': '잠실역 10분',
      '강동': '천호역 8분',
      '마포': '홍대입구역 12분',
      '서대문': '신촌역 10분',
      '은평': '연신내역 15분',
      '용산': '용산역 8분',
      '영등포': '영등포구청역 10분',
      '구로': '구로역 8분',
      '관악': '신림역 12분',
      '동작': '사당역 10분',
      '성동': '왕십리역 8분',
      '광진': '건대입구역 10분',
      '동대문': '동대문역 7분',
      '중랑': '상봉역 12분',
      '노원': '노원역 8분',
      '도봉': '도봉산역 10분',
      '강북': '미아역 12분'
    };
    
    // 주소에서 구 이름 추출
    for (const [district, station] of Object.entries(stations)) {
      if (address.includes(district)) {
        return station + ' 거리';
      }
    }
    
    return '안암역 10분 거리'; // 기본값
  };

  // 관리비를 만원 단위로 반올림하여 포맷팅
  const formatMaintenanceCost = (area) => {
    if (!area) return '7만';
    
    const cost = Math.round(area * 1000);
    const manWon = Math.round(cost / 10000);
    
    return `${manWon}만`;
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
        {/* 가격 */}
        <Text style={styles.priceText}>
          {item.transaction_type} {formatPrice(item.price_deposit, item.transaction_type, item.price_monthly, item.room_id)}
        </Text>
        
        {/* 방 정보 */}
        <Text style={styles.roomInfoText}>
          {getRoomType(item.area, item.rooms)} | {formatArea(item.area)} | {formatFloor(item.floor)}
        </Text>
        
        {/* 관리비와 거리 정보 */}
        <Text style={styles.additionalInfoText}>
          관리비 {formatMaintenanceCost(item.area)}원 | {getNearestStation(item.address)}
        </Text>
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
      ref={scrollViewRef}
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
    >
      {/* 채팅 버튼과 인사말 */}
      <View style={styles.topContainer}>
        <Text style={styles.greeting}>안녕하세요, {userData.name.slice(1)}님 :)</Text>
        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => navigation.navigate('ChatList')}
        >
          <View style={styles.chatButtonInner}>
            <ChatIcon size={21} color="#464646" />
          </View>
        </TouchableOpacity>
      </View>

      {/* 나만의 룸메이트 찾기 박스 */}
      <TouchableOpacity style={styles.roommateBox} onPress={() => navigation.navigate('RoommateChoice')}>
        <View style={styles.cardHeader}>
          <PeopleIcon size={24} color="#333333" />
          <Text style={styles.whiteCardTitle}>나만의 룸메이트 찾기</Text>
        </View>
        <Text style={styles.whiteCardSubtitle}>주거성향 테스트하고, 나와 딱 맞는 룸메이트를 만나보세요!</Text>
        <View style={styles.blackActionButton}>
          <Text style={styles.blackActionButtonText}>
            내 <Text style={styles.boldText}>주거 성향</Text> 확인해보기
          </Text>
          <View style={styles.greenArrowCircle}>
            <Ionicons name="arrow-forward" size={40} color="#FFFFFF" />
          </View>
        </View>
      </TouchableOpacity>

      {/* 계약서 안전성 검증 박스 */}
      <TouchableOpacity style={styles.contractBox} onPress={handleContractVerification}>
        <View style={styles.cardHeader}>
          <DocumentIcon size={24} color="#333" />
          <Text style={styles.contractCardTitle}>계약서 안전성 검증하기</Text>
        </View>
        <Text style={styles.contractCardSubtitle}>내가 가진 계약서의 위험 정도를 확인해보세요.</Text>
        <View style={styles.orangeArrowCircle}>
          <Ionicons name="arrow-forward" size={50} color="#FFFFFF" />
        </View>
      </TouchableOpacity>

      {/* 인기 매물 섹션 */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>{currentLocation} 인기 매물</Text>

        {/* 필터와 방 카드 컨테이너 */}
        <View style={styles.filterAndRoomsContainer}>
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
            overScrollMode="never"
            bounces={false}
          />
        </View>
      </View>

      {/* 주요 정책 NEWS */}
      <View ref={policyNewsRef} style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>주요 정책 NEWS</Text>

        {loadingPolicies ? (
          <View style={styles.newsBox}>
            <Text style={styles.loadingText}>정책 정보를 불러오는 중...</Text>
          </View>
        ) : policyNews.length > 0 ? (
          policyNews.map((policy, index) => (
            <View key={index} style={[styles.newsBox, index > 0 && { marginTop: 10 }]}>
              <View style={styles.newsContent}>
                <Text style={styles.newsTag}>#{policy?.policy?.category || policy?.category || '정책'}</Text>
                <Text style={styles.newsTitle} numberOfLines={2}>
                  {policy?.policy?.title || policy?.title || '정책 정보'}
                </Text>
                <Text style={styles.newsDescription} numberOfLines={2}>
                  {policy?.policy?.description || policy?.description || policy?.content || '정책 상세 내용을 확인하세요.'}
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

        {/* 페이지네이션 */}
        {policyNews.length > 0 && totalPages > 1 && (
          <View style={styles.paginationContainer}>
            {/* 이전 버튼 */}
            <TouchableOpacity
              style={[styles.arrowButton, policyPage === 1 && styles.disabledButton]}
              onPress={() => goToPage(policyPage - 1)}
              disabled={loadingPolicies || policyPage === 1}
            >
              <Ionicons name="chevron-back" size={16} color={policyPage === 1 ? "#ccc" : "#000000"} />
            </TouchableOpacity>

            {/* 페이지 번호들 */}
            <View style={styles.pageNumbersContainer}>
              {renderPaginationNumbers()}
            </View>

            {/* 다음 버튼 */}
            <TouchableOpacity
              style={[styles.arrowButton, policyPage === totalPages && styles.disabledButton]}
              onPress={() => goToPage(policyPage + 1)}
              disabled={loadingPolicies || policyPage === totalPages}
            >
              <Ionicons name="chevron-forward" size={16} color={policyPage === totalPages ? "#ccc" : "#000000"} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>

    {/* 플로팅 정책 챗봇 버튼 */}
    <TouchableOpacity
      style={styles.floatingChatbotButton}
      onPress={() => navigation.navigate('PolicyChatbot')}
      activeOpacity={0.8}
    >
      <View style={styles.chatbotButtonInner}>
        <Ionicons name="chatbubbles" size={28} color="#fff" />
      </View>
      <View style={styles.chatbotBadge}>
        <Ionicons name="information-circle" size={12} color="#fff" />
      </View>
    </TouchableOpacity>

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
    backgroundColor: '#F2F2F2',
  },
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    backgroundColor: '#F2F2F2',
    marginBottom: 3,
  },
  greeting: {
    fontSize: 31,
    fontWeight: '600',
    color: '#333',
  },
  chatButton: {
    padding: 4,
  },
  chatButtonInner: {
    width: 37,
    height: 37,
    borderRadius: 18.5,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  roommateBox: {
    backgroundColor: '#ffffff',
    marginHorizontal: 15,
    marginTop: 15,
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 17,
    borderRadius: 16,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 6,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginLeft: 12,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
    marginBottom: 16,
    opacity: 0.8,
  },
  whiteCardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333333',
    marginLeft: 4,
  },
  whiteCardSubtitle: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
    marginBottom: 28,
  },
  contractCardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#343434',
    marginLeft: 3,
  },
  contractCardSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 16,
    marginBottom: 0,
  },
  blackActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    height: 60,
    borderRadius: 30,
    position: 'relative',
  },
  blackActionButtonText: {
    fontSize: 20,
    fontWeight: '200',
    color: '#FFFFFF',
  },
  greenArrowCircle: {
    position: 'absolute',
    right: 8,
    width: 43,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#10B585',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orangeArrowCircle: {
    position: 'absolute',
    right: 16,
    top: 12,
    width: 60,
    height: 60,
    borderRadius: 50,
    backgroundColor: '#FC6339',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowIcon: {
    fontWeight: 'bold',
  },
  contractBox: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 15,
    marginTop: 12,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    borderRadius: 16,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
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
  sectionContainer: {
    marginTop: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  filterAndRoomsContainer: {
    gap: 5,
  },
  filterContainer: {
    paddingHorizontal: 15,
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    marginRight: 5,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterButtonSelected: {
    backgroundColor: '#353535',
    borderColor: '#353535',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonTextSelected: {
    color: '#fff',
  },
  roomCardContainer: {
    paddingLeft: 15,
    paddingRight: 10,
    marginBottom: 10,
    marginTop: 5,
  },
  roomCard: {
    width: 181,
    height: 191,
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
    height: 111,
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
  priceText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  roomInfoText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
    marginBottom: 3,
  },
  additionalInfoText: {
    fontSize: 11,
    color: '#999',
  },
  newsBox: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 15,
    marginBottom: 5,
  },
  newsContent: {
    flex: 1,
  },
  newsTag: {
    fontSize: 12,
    color: '#FF6600',
    marginBottom: 4,
  },
  newsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  newsDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
    lineHeight: 16,
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
  paginationContainer: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  pageNumbersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 15,
  },
  pageButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    marginHorizontal: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePageButton: {
    backgroundColor: '#10B585',
    borderColor: '#10B585',
  },
  pageButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  activePageButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  arrowButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ddd',
  },
  floatingChatbotButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10B585',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 1000,
  },
  chatbotButtonInner: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#10B585',
  },
  chatbotBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  boldText: {
    fontWeight: '900',
  },
});
