import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Alert, ScrollView, TouchableOpacity, Text, TextInput, SafeAreaView, Animated, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import PropertyMapView from "../components/MapView";
import ApiService from "../services/api";
import { mockRooms } from "../data/mockRooms";

export default function MapScreen({ navigation }) {
  const [rooms, setRooms] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('성북구 안암동 2가');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [recentSearches, setRecentSearches] = useState(['안암동 2가', '안암동 1가', '보문역', '성신여대입구역']);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const locationButtonAnim = useRef(new Animated.Value(0)).current;
  const mapViewRef = useRef(null);

  // Mock user data
  const userData = {
    id: "1",
    name: "김대학생",
  };

  const filterOptions = [
    {
      id: 'type',
      label: '매물 종류',
      icon: 'chevron-down',
      options: ['원룸', '투룸', '오피스텔', '아파트']
    },
    {
      id: 'transaction',
      label: '거래 유형',
      icon: 'chevron-down',
      options: ['월세', '전세', '매매']
    },
    {
      id: 'price',
      label: '가격',
      icon: 'chevron-down',
      options: ['1억 이하', '1-3억', '3-5억', '5억 이상']
    },
    {
      id: 'size',
      label: '평수',
      icon: 'chevron-down',
      options: ['10평 이하', '10-20평', '20-30평', '30평 이상']
    },
  ];

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      // 서울 전체 지역 범위로 방 검색
      const bounds = {
        latMin: 37.42,
        latMax: 37.71,
        lngMin: 126.76,
        lngMax: 127.18,
      };

      const roomData = await ApiService.searchRooms(bounds);
      console.log(`🔍 API 응답: ${roomData?.length || 0}개 매물`);
      
      // 강북쪽 데이터 확인
      const northernData = roomData?.filter(room => 
        room.address.includes('강북구') || 
        room.address.includes('도봉구') || 
        room.address.includes('노원구') || 
        room.address.includes('광진구') || 
        room.address.includes('성북구') || 
        room.address.includes('용산구')
      ) || [];
      console.log(`🌟 강북쪽 매물: ${northernData.length}개`);
      northernData.slice(0, 3).forEach(room => {
        console.log(`  - ${room.address} (${room.latitude}, ${room.longitude})`);
      });

      // API 데이터를 MapView에서 사용할 수 있는 형태로 변환
      const formattedRooms = roomData.map(room => ({
        id: room.room_id,
        title: room.address.split(' ').slice(-2).join(' '), // 주소에서 마지막 두 부분만 제목으로
        price: `${room.price_monthly > 0 ? room.price_monthly : room.price_deposit}만원`,
        latitude: room.latitude,
        longitude: room.longitude,
        address: room.address,
        description: `${room.transaction_type} • ${room.area}㎡`,
        deposit: `${room.price_deposit}만원`,
        area: `${room.area}㎡`,
        transaction_type: room.transaction_type,
        price_deposit: room.price_deposit,
        price_monthly: room.price_monthly,
        favorite_count: room.favorite_count,
        risk_score: room.risk_score,
      }));

      // 실제 API 데이터만 사용
      setAllRooms(formattedRooms);
      setRooms(formattedRooms);
    } catch (error) {
      console.error('방 데이터 로드 실패:', error);
      Alert.alert('오류', '방 데이터를 불러오는데 실패했습니다.');
    }
  };

  useEffect(() => {
    applyFilter();
  }, [selectedFilterValues, allRooms]);

  const applyFilter = () => {
    let filteredRooms = [...allRooms];

    // 거래 유형 필터
    if (selectedFilterValues.transaction) {
      filteredRooms = filteredRooms.filter(room =>
        room.transaction_type === selectedFilterValues.transaction
      );
    }

    // 매물 종류 필터
    if (selectedFilterValues.type) {
      const typeKeywords = {
        '원룸': ['원룸'],
        '투룸': ['투룸', '2룸'],
        '오피스텔': ['오피스텔'],
        '아파트': ['아파트']
      };
      const keywords = typeKeywords[selectedFilterValues.type] || [];
      filteredRooms = filteredRooms.filter(room =>
        keywords.some(keyword =>
          room.address.includes(keyword) || room.description.includes(keyword)
        )
      );
    }

    // 가격 필터
    if (selectedFilterValues.price) {
      const priceRanges = {
        '1억 이하': [0, 10000],
        '1-3억': [10000, 30000],
        '3-5억': [30000, 50000],
        '5억 이상': [50000, 999999]
      };
      const [min, max] = priceRanges[selectedFilterValues.price] || [0, 999999];
      filteredRooms = filteredRooms.filter(room =>
        room.price_deposit >= min && room.price_deposit <= max
      );
    }

    setRooms(filteredRooms);
  };

  const goToCurrentLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('위치 권한 필요', '현재 위치를 보려면 위치 권한이 필요합니다.');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // 맵을 현재 위치로 이동
      if (mapViewRef.current) {
        mapViewRef.current.animateToRegion({
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      }
    } catch (error) {
      console.error('현재 위치 가져오기 실패:', error);
      Alert.alert('오류', '현재 위치를 가져올 수 없습니다.');
    }
  };

  const handleMarkerPress = async (room) => {
    setSelectedPropertyId(room.id);
    setSelectedProperty(room);

    // 카드와 위치 버튼 애니메이션
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(locationButtonAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  };

  const handleCardPress = () => {
    if (!selectedProperty) return;

    // Mock 데이터와 실제 데이터 구분
    if (selectedProperty.id && selectedProperty.id.startsWith('mock_')) {
      // Mock 데이터는 상세 페이지 대신 알림 표시
      Alert.alert('알림', '샘플 데이터입니다. 실제 매물을 확인해주세요.');
    } else {
      // 실제 데이터만 상세 화면으로 네비게이션
      navigation.navigate('RoomDetail', { roomId: selectedProperty.id });
    }
  };


  const handleFavoriteToggle = async (property) => {
    try {
      // Mock 데이터는 찜 기능 건너뛰기
      if (property.id && property.id.startsWith('mock_')) {
        Alert.alert('알림', '샘플 데이터는 찜할 수 없습니다.');
        return;
      }

      if (property.isFavorited) {
        await ApiService.removeFavorite(property.id);
      } else {
        await ApiService.addFavorite(property.id, userData.id);
      }

      // 상태 업데이트
      const updatedRooms = rooms.map(room =>
        room.id === property.id
          ? { ...room, isFavorited: !room.isFavorited }
          : room
      );
      setRooms(updatedRooms);
      setSelectedProperty({ ...property, isFavorited: !property.isFavorited });
    } catch (error) {
      console.error('찜 상태 변경 실패:', error);
      // 404 에러는 무시
      if (error.message && !error.message.includes('404')) {
        Alert.alert('오류', '찜 상태를 변경할 수 없습니다.');
      }
    }
  };


  const saveRecentSearch = (query) => {
    const newRecentSearches = [query, ...recentSearches.filter(item => item !== query)].slice(0, 4);
    setRecentSearches(newRecentSearches);
  };

  const handleRecentSearchSelect = (query) => {
    setSearchQuery(query);
    setShowRecentSearches(false);
    handleSearch(query);
  };

  const removeRecentSearch = (query) => {
    setRecentSearches(recentSearches.filter(item => item !== query));
  };

  const handleSearch = async (customQuery = null) => {
    const query = customQuery || searchQuery;
    if (!query.trim()) return;

    try {
      console.log(`🔍 검색 실행: ${query}`);

      // 최근 검색어에 추가
      saveRecentSearch(query);
      setShowRecentSearches(false);

      // 거래유형 검색어 감지 및 자동 필터링
      const transactionTypes = ['월세', '전세', '매매'];
      const foundTransactionType = transactionTypes.find(type =>
        query.includes(type)
      );

      if (foundTransactionType && !selectedFilters.includes(foundTransactionType)) {
        setSelectedFilters([foundTransactionType]);
      }

      let searchResults = [];
      try {
        searchResults = await ApiService.searchRoomsByText(query);
      } catch (error) {
        console.log('API 검색 실패, Mock 데이터만 사용:', error.message);
        // API 실패시 빈 배열로 처리
        searchResults = [];
      }

      // 검색 결과를 맵에 표시할 수 있는 형태로 변환
      const formattedResults = searchResults.map(room => ({
        id: room.room_id,
        title: room.address.split(' ').slice(-2).join(' '),
        price: `${room.price_monthly > 0 ? room.price_monthly : room.price_deposit}만원`,
        latitude: room.latitude,
        longitude: room.longitude,
        address: room.address,
        description: `${room.transaction_type} • ${room.area}㎡`,
        deposit: `${room.price_deposit}만원`,
        area: `${room.area}㎡`,
        transaction_type: room.transaction_type,
        price_deposit: room.price_deposit,
        price_monthly: room.price_monthly,
        favorite_count: room.favorite_count,
        risk_score: room.risk_score,
      }));

      // Mock 데이터도 검색에 포함
      const mockSearchResults = mockRooms.filter(room =>
        room.address.includes(query) ||
        room.description.includes(query) ||
        room.transaction_type.includes(query)
      );

      const combinedResults = [...formattedResults, ...mockSearchResults];
      setRooms(combinedResults);
      setAllRooms(combinedResults);

      // 지역/주소 검색 시 해당 위치로 포커싱
      await focusOnSearchLocation(query, combinedResults);

      console.log(`✅ 검색 완료: ${combinedResults.length}개 결과`);
    } catch (error) {
      console.error('검색 실패:', error);
      Alert.alert('오류', '검색에 실패했습니다.');
    }
  };

  const focusOnSearchLocation = async (query, results) => {
    if (!mapViewRef.current) return;

    // 서울 주요 지역별 좌표
    const seoulLocations = {
      '강남': { latitude: 37.4979, longitude: 127.0276 },
      '강남구': { latitude: 37.4979, longitude: 127.0276 },
      '성북': { latitude: 37.5894, longitude: 127.0167 },
      '성북구': { latitude: 37.5894, longitude: 127.0167 },
      '안암': { latitude: 37.5857, longitude: 127.0297 },
      '안암동': { latitude: 37.5857, longitude: 127.0297 },
      '광진': { latitude: 37.5384, longitude: 127.0822 },
      '광진구': { latitude: 37.5384, longitude: 127.0822 },
      '건대': { latitude: 37.5403, longitude: 127.0695 },
      '건대입구': { latitude: 37.5403, longitude: 127.0695 },
      '종로': { latitude: 37.5735, longitude: 126.9788 },
      '종로구': { latitude: 37.5735, longitude: 126.9788 },
      '혜화': { latitude: 37.5820, longitude: 127.0012 },
      '혜화동': { latitude: 37.5820, longitude: 127.0012 },
      '마포': { latitude: 37.5663, longitude: 126.9019 },
      '마포구': { latitude: 37.5663, longitude: 126.9019 },
      '홍대': { latitude: 37.5563, longitude: 126.9236 },
      '서대문': { latitude: 37.5791, longitude: 126.9368 },
      '신촌': { latitude: 37.5596, longitude: 126.9426 },
    };

    // 지역명으로 검색한 경우 해당 지역으로 포커싱
    const foundLocation = Object.keys(seoulLocations).find(location =>
      query.includes(location)
    );

    if (foundLocation) {
      const targetLocation = seoulLocations[foundLocation];
      mapViewRef.current.animateToRegion({
        ...targetLocation,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }, 1000);
    } else if (results.length > 0) {
      // 검색 결과가 있으면 해당 영역으로 이동
      const coordinates = results.map(room => ({
        latitude: room.latitude,
        longitude: room.longitude,
      }));

      mapViewRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
        animated: true,
      });
    }
  };

  const [activeFilter, setActiveFilter] = useState(null);
  const [selectedFilterValues, setSelectedFilterValues] = useState({});

  const FilterButton = ({ option }) => {
    const hasSelection = selectedFilterValues[option.id];

    return (
      <TouchableOpacity
        style={[styles.filterButton, hasSelection && styles.filterButtonActive]}
        onPress={() => setActiveFilter(option)}
      >
        <Text style={[styles.filterButtonText, hasSelection && styles.filterButtonTextActive]}>
          {option.label}
        </Text>
        <Ionicons
          name={option.icon}
          size={12}
          color={hasSelection ? "#FF6600" : "#666"}
          style={{ marginLeft: 4 }}
        />
      </TouchableOpacity>
    );
  };

  const PropertyCard = () => {
    if (!selectedProperty) return null;

    const formatPrice = (property) => {
      if (property.transaction_type === '월세') {
        return `월세 ${property.price_deposit}/${property.price_monthly}만원`;
      } else if (property.transaction_type === '전세') {
        return `전세 ${property.price_deposit}만원`;
      }
      return `${property.price_deposit}만원`;
    };

    const handleCloseCard = () => {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(locationButtonAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start(() => {
        setSelectedProperty(null);
        setSelectedPropertyId(null);
      });
    };

    return (
      <Animated.View
        style={[
          styles.propertyCard,
          {
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [200, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.cardContent}
          onPress={handleCardPress}
          activeOpacity={0.9}
        >
          <View style={styles.cardImageContainer}>
            <View style={styles.cardImagePlaceholder}>
              <Ionicons name="image-outline" size={24} color="#ccc" />
            </View>
          </View>

          <View style={styles.cardInfo}>
            <Text style={styles.cardPrice}>
              {formatPrice(selectedProperty)}
            </Text>
            <Text style={styles.cardSubInfo} numberOfLines={1}>
              원룸 | 6평 | 4층
            </Text>
            <Text style={styles.cardAddress} numberOfLines={1}>
              {selectedProperty.address.split(' ').slice(-3).join(' ')}
            </Text>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={12} color="#FF6600" />
              <Text style={styles.verifiedText}>집주인 인증</Text>
            </View>
          </View>

          <View style={styles.cardRightSection}>
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={() => handleFavoriteToggle(selectedProperty)}
            >
              <Ionicons
                name={selectedProperty.isFavorited ? "heart" : "heart-outline"}
                size={20}
                color={selectedProperty.isFavorited ? "#FF6600" : "#999"}
              />
            </TouchableOpacity>

            <View style={styles.cardLikeCount}>
              <Text style={styles.likeCountText}>{selectedProperty.favorite_count || 13}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 - 검색바 */}
      <View style={styles.header}>
        <View style={styles.headerLeft} />
        <Text style={styles.headerTitle}>매물 둘러보기</Text>
        <TouchableOpacity style={styles.profileButton}>
          <View style={styles.profileCircle}>
            <View style={styles.speechBubble}>
              <View style={styles.longLine} />
              <View style={styles.shortLine} />
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* 검색바 */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Ionicons name="location-outline" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="성북구 안암동 2가"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => handleSearch()}
            onFocus={() => setShowRecentSearches(true)}
            onBlur={() => setTimeout(() => setShowRecentSearches(false), 150)}
            returnKeyType="search"
            placeholderTextColor="#999"
          />
          <TouchableOpacity style={styles.searchButton} onPress={() => handleSearch()}>
            <Ionicons name="search" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* 최근 검색어 드롭다운 */}
        {showRecentSearches && (
          <View style={styles.recentSearchDropdown}>
            <Text style={styles.recentSearchTitle}>최근 검색어</Text>
            {recentSearches.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.recentSearchItem}
                onPress={() => handleRecentSearchSelect(item)}
              >
                <Ionicons name="time-outline" size={16} color="#999" />
                <Text style={styles.recentSearchText}>{item}</Text>
                <TouchableOpacity
                  style={styles.removeRecentButton}
                  onPress={() => removeRecentSearch(item)}
                >
                  <Ionicons name="close" size={14} color="#ccc" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* 필터 바 */}
      {!showRecentSearches && (
        <View style={styles.filterContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScrollContent}
          >
            {filterOptions.map((option) => (
              <FilterButton
                key={option.id}
                option={option}
              />
            ))}
          </ScrollView>

          {/* 페이드 아웃 그라데이션 */}
          <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.9)', 'rgba(255,255,255,1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.fadeGradient}
            pointerEvents="none"
          />

          {/* 더보기 버튼 */}
          <TouchableOpacity style={styles.moreButton}>
            <Ionicons name="chevron-down" size={16} color="#666" />
          </TouchableOpacity>
        </View>
      )}

      {/* 지도 */}
      <View style={styles.mapContainer}>
        <PropertyMapView
          ref={mapViewRef}
          properties={rooms}
          onMarkerPress={handleMarkerPress}
          selectedPropertyId={selectedPropertyId}
        />

        {/* 현재 위치 버튼 */}
        <Animated.View
          style={[
            styles.currentLocationButton,
            {
              transform: [{
                translateY: locationButtonAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -90],
                })
              }]
            }
          ]}
        >
          <TouchableOpacity
            style={styles.locationButtonInner}
            onPress={goToCurrentLocation}
          >
            <Ionicons name="locate" size={24} color="#FF6600" />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Property Card */}
      <PropertyCard />

      {/* 필터 모달 */}
      <Modal
        visible={activeFilter !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setActiveFilter(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActiveFilter(null)}
        >
          <View style={styles.filterModal}>
            <Text style={styles.filterModalTitle}>
              {activeFilter?.label}
            </Text>
            <ScrollView style={styles.filterOptionsList}>
              {activeFilter?.options?.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.filterOptionItem,
                    selectedFilterValues[activeFilter.id] === option && styles.filterOptionSelected
                  ]}
                  onPress={() => {
                    setSelectedFilterValues({
                      ...selectedFilterValues,
                      [activeFilter.id]: selectedFilterValues[activeFilter.id] === option ? null : option
                    });
                    setActiveFilter(null);
                  }}
                >
                  <Text style={[
                    styles.filterOptionText,
                    selectedFilterValues[activeFilter.id] === option && styles.filterOptionTextSelected
                  ]}>
                    {option}
                  </Text>
                  {selectedFilterValues[activeFilter.id] === option && (
                    <Ionicons name="checkmark" size={16} color="#FF6600" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerLeft: {
    width: 40,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
  profileButton: {
    padding: 4,
  },
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  speechBubble: {
    width: 18,
    height: 18,
    borderWidth: 2.0,
    borderColor: '#666',
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
    width: 10,
    height: 2.0,
    backgroundColor: '#666',
    borderRadius: 1,
    marginBottom: 2,
  },
  shortLine: {
    right: 0,
    width: 7,
    height: 2.0,
    backgroundColor: '#666',
    borderRadius: 1,
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#ffffff',
    position: 'relative',
    zIndex: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    marginLeft: 8,
    marginRight: 8,
  },
  searchButton: {
    padding: 4,
  },
  filterContainer: {
    backgroundColor: '#ffffff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 40,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  filterButtonText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  filterButtonActive: {
    backgroundColor: '#fff5f0',
    borderColor: '#FF6600',
  },
  filterButtonTextActive: {
    color: '#FF6600',
    fontWeight: '600',
  },
  fadeGradient: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
  },
  moreButton: {
    width: 20,
    height: 20,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 14,
    top: 15,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  currentLocationButton: {
    position: 'absolute',
    bottom: 100,
    right: 16,
  },
  locationButtonInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  propertyCard: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
  },
  cardRightSection: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginLeft: 8,
  },
  cardImageContainer: {
    marginRight: 12,
  },
  cardImagePlaceholder: {
    width: 80,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardInfo: {
    flex: 1,
    paddingVertical: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000',
  },
  cardSubInfo: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  cardAddress: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFE5D9',
    alignSelf: 'flex-start',
  },
  verifiedText: {
    fontSize: 11,
    color: '#FF6600',
    marginLeft: 4,
    fontWeight: '600',
  },
  favoriteButton: {
    padding: 4,
    marginBottom: 8,
  },
  cardLikeCount: {
    alignItems: 'center',
  },
  likeCountText: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },
  cardIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentSearchDropdown: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    marginHorizontal: 16,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
  },
  recentSearchTitle: {
    fontSize: 13,
    color: '#999',
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  recentSearchText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    marginLeft: 12,
  },
  removeRecentButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterModal: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    margin: 20,
    minWidth: 200,
    maxHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  filterModalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  filterOptionsList: {
    maxHeight: 300,
  },
  filterOptionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8',
  },
  filterOptionSelected: {
    backgroundColor: '#fff5f0',
  },
  filterOptionText: {
    fontSize: 14,
    color: '#333',
  },
  filterOptionTextSelected: {
    color: '#FF6600',
    fontWeight: '600',
  },
});
