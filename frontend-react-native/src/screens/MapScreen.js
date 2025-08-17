import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Alert, ScrollView, TouchableOpacity, Text, TextInput, SafeAreaView, Image, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from 'expo-location';
import PropertyMapView from "../components/MapView";
import ApiService from "../services/api";
import { mockRooms } from "../data/mockRooms";
import { formatRentPrice } from "../utils/priceFormatter";

export default function MapScreen({ navigation }) {
  const [rooms, setRooms] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('전체');
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('성북구 안암동 2가');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });
  const slideAnim = useRef(new Animated.Value(0)).current;
  const mapViewRef = useRef(null);
  
  // Mock user data
  const userData = {
    id: "1",
    name: "김대학생",
  };

  const filterOptions = ['전체', '원룸', '투룸', '전세', '월세', '매매'];

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      // 서울 지역 범위로 방 검색
      const bounds = {
        latMin: 37.4,
        latMax: 37.6,
        lngMin: 126.9,
        lngMax: 127.2,
      };
      
      const roomData = await ApiService.searchRooms(bounds);
      
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
      
      // Mock 데이터와 API 데이터 합치기
      const combinedRooms = [...formattedRooms, ...mockRooms];
      
      setAllRooms(combinedRooms);
      setRooms(combinedRooms);
    } catch (error) {
      console.error('방 데이터 로드 실패:', error);
      Alert.alert('오류', '방 데이터를 불러오는데 실패했습니다.');
    }
  };

  useEffect(() => {
    applyFilter();
  }, [selectedFilter, allRooms]);

  const applyFilter = () => {
    let filteredRooms = [...allRooms];
    
    switch(selectedFilter) {
      case '원룸':
        filteredRooms = allRooms.filter(room => 
          room.address.includes('원룸') || room.description.includes('원룸')
        );
        break;
      case '투룸':
        filteredRooms = allRooms.filter(room => 
          room.address.includes('투룸') || room.description.includes('투룸')
        );
        break;
      case '전세':
        filteredRooms = allRooms.filter(room => 
          room.transaction_type === '전세'
        );
        break;
      case '월세':
        filteredRooms = allRooms.filter(room => 
          room.transaction_type === '월세'
        );
        break;
      case '매매':
        filteredRooms = allRooms.filter(room => 
          room.transaction_type === '매매'
        );
        break;
      default:
        filteredRooms = allRooms;
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
    
    // 카드 애니메이션
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
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

  const handleCloseCard = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setSelectedProperty(null);
      setSelectedPropertyId(null);
    });
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


  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      console.log(`🔍 검색 실행: ${searchQuery}`);
      
      // 거래유형 검색어 감지 및 자동 필터링
      const transactionTypes = ['월세', '전세', '매매'];
      const foundTransactionType = transactionTypes.find(type => 
        searchQuery.includes(type)
      );
      
      if (foundTransactionType && foundTransactionType !== selectedFilter) {
        setSelectedFilter(foundTransactionType);
      }
      
      let searchResults = [];
      try {
        searchResults = await ApiService.searchRoomsByText(searchQuery);
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
        room.address.includes(searchQuery) || 
        room.description.includes(searchQuery) ||
        room.transaction_type.includes(searchQuery)
      );
      
      const combinedResults = [...formattedResults, ...mockSearchResults];
      setRooms(combinedResults);
      setAllRooms(combinedResults);
      
      // 지역/주소 검색 시 해당 위치로 포커싱
      await focusOnSearchLocation(searchQuery, combinedResults);
      
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

  const PropertyCard = () => {
    if (!selectedProperty) return null;

    const formatPrice = (property) => {
      return formatRentPrice(property.price_deposit, property.price_monthly);
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
          activeOpacity={0.8}
        >
          <View style={styles.cardImageContainer}>
            <Image 
              source={{ uri: 'https://via.placeholder.com/100x80/f0f0f0/666?text=사진' }}
              style={styles.cardImage}
              resizeMode="cover"
            />
          </View>
          
          <View style={styles.cardInfo}>
            <Text style={styles.cardPrice}>
              {formatPrice(selectedProperty)}
            </Text>
            <Text style={styles.cardAddress} numberOfLines={1}>
              {selectedProperty.address}
            </Text>
            <Text style={styles.cardDetails}>
              {selectedProperty.description} • 관리비 7만원
            </Text>
            <View style={styles.cardIcons}>
              <TouchableOpacity onPress={() => handleFavoriteToggle(selectedProperty)}>
                <Ionicons 
                  name={selectedProperty.isFavorited ? "heart" : "heart-outline"} 
                  size={16} 
                  color={selectedProperty.isFavorited ? "#FF6600" : "#666"} 
                />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.closeButton}
          onPress={handleCloseCard}
        >
          <Ionicons name="close" size={20} color="#666" />
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 - 검색바 */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="location-outline" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="성북구 안암동 2가"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            placeholderTextColor="#999"
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Ionicons name="search" size={20} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 필터 바 */}
      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
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
        
        {/* 매물 개수 표시 - 블러 처리 추가 */}
        <View style={styles.propertyCountWrapper}>
          <View style={styles.propertyCountBlur} />
          <View style={styles.propertyCountContainer}>
            <Ionicons name="home" size={16} color="#FF6600" />
            <Text style={styles.propertyCountText}>{rooms.length}개 매물</Text>
          </View>
        </View>
      </View>

      {/* 지도 */}
      <View style={styles.mapContainer}>
        <PropertyMapView
          ref={mapViewRef}
          properties={rooms}
          onMarkerPress={handleMarkerPress}
          selectedPropertyId={selectedPropertyId}
        />
        
        {/* 현재 위치 버튼 */}
        <TouchableOpacity 
          style={styles.currentLocationButton}
          onPress={goToCurrentLocation}
        >
          <Ionicons name="locate" size={24} color="#FF6600" />
        </TouchableOpacity>
      </View>

      {/* Property Card */}
      <PropertyCard />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
    marginRight: 8,
  },
  searchButton: {
    padding: 4,
  },
  filterContainer: {
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterScrollContent: {
    paddingRight: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  filterButtonSelected: {
    backgroundColor: '#FF6600',
    borderColor: '#FF6600',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  filterButtonTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  propertyCountWrapper: {
    position: 'relative',
    borderRadius: 16,
  },
  propertyCountBlur: {
    position: 'absolute',
    left: -20,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 16,
  },
  propertyCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff5f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ffe0cc',
    position: 'relative',
    zIndex: 1,
  },
  propertyCountText: {
    fontSize: 12,
    color: '#FF6600',
    marginLeft: 4,
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  currentLocationButton: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  propertyCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardImageContainer: {
    marginRight: 12,
  },
  cardImage: {
    width: 100,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  cardInfo: {
    flex: 1,
    paddingVertical: 4,
  },
  cardPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  cardAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  cardDetails: {
    fontSize: 12,
    color: '#888',
    lineHeight: 16,
    marginBottom: 8,
  },
  cardIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
  },
});