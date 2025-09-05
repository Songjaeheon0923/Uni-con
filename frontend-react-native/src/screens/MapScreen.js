import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, StyleSheet, Alert, ScrollView, TouchableOpacity, Text, TextInput, SafeAreaView, Animated, Modal, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import PropertyMapView from "../components/MapView";
import ApiService from "../services/api";
import { formatArea, getRoomType, formatFloor, formatPrice } from "../utils/priceUtils";
import SearchIcon from "../components/SearchIcon";
import ChevronDownIcon from "../components/ChevronDownIcon";
import LocationIcon from "../components/LocationIcon";
import CurrentLocationIcon from "../components/CurrentLocationIcon";
import HeartIcon from "../components/HeartIcon";
import ChatIcon from "../components/ChatIcon";
import FavoriteButton from "../components/FavoriteButton";

const getRoomImage = (roomId) => {
  // roomId 기반으로 부동산 이미지 선택
  const imageIndex = parseInt(roomId?.toString().slice(-1) || '0') % 8;
  const roomImages = [
    'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop', // 모던 거실
    'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop', // 침실
    'https://images.pexels.com/photos/2029722/pexels-photo-2029722.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop', // 주방
    'https://images.pexels.com/photos/1571453/pexels-photo-1571453.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop', // 원룸
    'https://images.pexels.com/photos/2079249/pexels-photo-2079249.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop', // 아파트 거실
    'https://images.pexels.com/photos/2121121/pexels-photo-2121121.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop', // 화이트 인테리어
    'https://images.pexels.com/photos/1454804/pexels-photo-1454804.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop', // 밝은 방
    'https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop'  // 아늑한 방
  ];
  return roomImages[imageIndex];
};

export default function MapScreen({ navigation, user }) {
  const [rooms, setRooms] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProperty, setSelectedProperty] = useState(null);
  
  // 필터 관련 상태 추가
  const [activeFilter, setActiveFilter] = useState(null);
  const [selectedFilterValues, setSelectedFilterValues] = useState({});
  const [mapKey, setMapKey] = useState(0);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [recentSearches, setRecentSearches] = useState(['안암동 2가', '안암동 1가', '보문역', '성신여대입구역']);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [showBuildingModal, setShowBuildingModal] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [initialRegion, setInitialRegion] = useState(null);
  const [searchPin, setSearchPin] = useState(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const locationButtonAnim = useRef(new Animated.Value(0)).current;
  const mapViewRef = useRef(null);
  const searchInputRef = useRef(null);

  // Google Maps API 키
  const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  // 사용자 정보
  const userData = user || {
    id: "1",
    name: "김대학생",
  };

  // 관리비를 만원 단위로 반올림하여 포맷팅
  const formatMaintenanceCost = (area) => {
    if (!area) return "7만";
    // 문자열에서 숫자 부분만 추출 ("190.32㎡" -> 190.32)
    const numericArea = parseFloat(area.toString().replace(/㎡/g, ''));
    if (isNaN(numericArea)) return "7만";
    const cost = Math.round(numericArea * 1000);
    const manWon = Math.round(cost / 10000);
    return `${manWon}만`;
  };

  // 주소에서 가장 가까운 역 정보 추출
  const getNearestStation = (address) => {
    if (!address) return "안암역 10분 거리";

    if (address.includes("성수동")) return "성수역 5분 거리";
    if (address.includes("안암동")) return "안암역 7분 거리";
    if (address.includes("종로")) return "종로3가역 8분 거리";
    if (address.includes("성북")) return "성신여대입구역 10분 거리";
    if (address.includes("동대문")) return "동대문역 6분 거리";

    return "안암역 10분 거리"; // 기본값
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
    {
      id: 'favorites',
      label: '찜 개수',
      icon: 'chevron-down',
      options: ['5개', '10개', '15개', '20개']
    },
  ];

  useEffect(() => {
    const initializeMap = async () => {
      try {
        // Google API로 서울 좌표 검색
        const seoulRegion = await searchLocationWithGoogle('서울특별시');
        if (seoulRegion) {
          // 검색 결과를 기반으로 초기 지역 설정
          let latitudeDelta = 0.6;
          let longitudeDelta = 0.5;

          // bounds 정보가 있으면 사용
          if (seoulRegion.bounds) {
            const { northeast, southwest } = seoulRegion.bounds;
            latitudeDelta = Math.abs(northeast.lat - southwest.lat) * 1.2;
            longitudeDelta = Math.abs(northeast.lng - southwest.lng) * 1.2;
          }

          // 오프셋 적용해서 초기 지역 설정
          const offsetLatitude = seoulRegion.latitude - (latitudeDelta * 0.3);

          setInitialRegion({
            latitude: offsetLatitude,
            longitude: seoulRegion.longitude,
            latitudeDelta,
            longitudeDelta,
          });

          console.log('✅ 초기 지역을 Google API로 설정:', seoulRegion.address);
        } else {
          // Google API 실패시 기본값 사용
          setInitialRegion({
            latitude: 37.35,
            longitude: 127.1,
            latitudeDelta: 0.6,
            longitudeDelta: 0.5,
          });
          console.log('⚠️ Google API 실패, 기본 서울 좌표 사용');
        }
      } catch (error) {
        console.error('초기 지역 설정 실패:', error);
        // 에러 시 기본값 설정
        setInitialRegion({
          latitude: 37.35,
          longitude: 127.1,
          latitudeDelta: 0.6,
          longitudeDelta: 0.5,
        });
      }
    };

    initializeMap();
    loadRooms();
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const favoriteData = await ApiService.getUserFavorites(String(userData.id));
      setFavorites(favoriteData.map(room => room.room_id));
    } catch (error) {
      console.error('찜 목록 로드 실패:', error);
    }
  };

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
        floor: room.floor,
        rooms: room.rooms,
      }));

      // 실제 API 데이터만 사용
      setAllRooms(formattedRooms);
      setRooms(formattedRooms);
    } catch (error) {
      // 방 데이터 로드 실패
      Alert.alert('오류', '방 데이터를 불러오는데 실패했습니다.');
    }
  };

  useEffect(() => {
    console.log('🔄 useEffect 트리거 - 필터 적용');
    applyFilter();
  }, [selectedFilterValues, allRooms]);

  const applyFilter = useCallback(() => {
    console.log('🔍 필터 적용 중...', selectedFilterValues);
    let filteredRooms = [...allRooms];
    console.log('📊 전체 매물 수:', allRooms.length);

    // 거래 유형 필터
    if (selectedFilterValues.transaction) {
      console.log('🏠 거래 유형 필터:', selectedFilterValues.transaction);
      filteredRooms = filteredRooms.filter(room =>
        room.transaction_type === selectedFilterValues.transaction
      );
      console.log('🏠 거래 유형 필터 후 매물 수:', filteredRooms.length);
    }

    // 매물 종류 필터
    if (selectedFilterValues.type) {
      console.log('🏢 매물 종류 필터:', selectedFilterValues.type);
      const typeKeywords = {
        '원룸': ['원룸', '1룸', 'oneroom'],
        '투룸': ['투룸', '2룸', 'tworoom'],
        '오피스텔': ['오피스텔', 'officetel', '오피', '상업시설'],
        '아파트': ['아파트', 'apartment', '아파', '공동주택']
      };
      const keywords = typeKeywords[selectedFilterValues.type] || [];

      // 더 유연한 매칭: 주소, 설명, 제목에서 검색하고 부분 매칭도 허용
      filteredRooms = filteredRooms.filter(room => {
        const searchText = `${room.address || ''} ${room.description || ''} ${room.title || ''}`.toLowerCase();
        const hasKeyword = keywords.some(keyword =>
          searchText.includes(keyword.toLowerCase())
        );

        // 키워드가 없으면 면적 기반으로도 추정
        if (!hasKeyword && selectedFilterValues.type === '원룸') {
          // 25㎡ 이하면 원룸으로 추정
          return room.area && parseFloat(room.area) <= 25;
        } else if (!hasKeyword && selectedFilterValues.type === '투룸') {
          // 25-50㎡이면 투룸으로 추정
          return room.area && parseFloat(room.area) > 25 && parseFloat(room.area) <= 50;
        }

        return hasKeyword;
      });

      console.log('🏢 매물 종류 필터 후 매물 수:', filteredRooms.length);
    }

    // 가격 필터
    if (selectedFilterValues.price) {
      console.log('💰 가격 필터:', selectedFilterValues.price);
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
      console.log('💰 가격 필터 후 매물 수:', filteredRooms.length);
    }

    // 평수 필터
    if (selectedFilterValues.size) {
      console.log('📐 평수 필터:', selectedFilterValues.size);
      const sizeRanges = {
        '10평 이하': [0, 33], // 1평 ≈ 3.3㎡
        '10-20평': [33, 66],
        '20-30평': [66, 99],
        '30평 이상': [99, 999999]
      };
      const [min, max] = sizeRanges[selectedFilterValues.size] || [0, 999999];
      filteredRooms = filteredRooms.filter(room => {
        const area = parseFloat(room.area);
        return !isNaN(area) && area >= min && area <= max;
      });
      console.log('📐 평수 필터 후 매물 수:', filteredRooms.length);
    }

    // 찜 개수 필터
    if (selectedFilterValues.favorites) {
      console.log('❤️ 찜 개수 필터:', selectedFilterValues.favorites);
      const favoriteRanges = {
        '5개': 5,
        '10개': 10,
        '15개': 15,
        '20개': 20
      };
      const minFavorites = favoriteRanges[selectedFilterValues.favorites] || 0;
      filteredRooms = filteredRooms.filter(room =>
        (room.favorite_count || 0) >= minFavorites
      );
      console.log('❤️ 찜 개수 필터 후 매물 수:', filteredRooms.length);
    }

    console.log('✅ 최종 필터링된 매물 수:', filteredRooms.length);

    // 강제 리렌더링을 위해 새 배열 생성
    setRooms([...filteredRooms]);
    console.log('📍 MapScreen rooms 상태 업데이트:', filteredRooms.length);

    // MapView 강제 리렌더링
    setMapKey(prev => prev + 1);
  }, [selectedFilterValues, allRooms]);

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
      // 현재 위치 가져오기 실패
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
      const roomId = property.room_id || property.id;
      if (roomId && roomId.startsWith('mock_')) {
        Alert.alert('알림', '샘플 데이터는 찜할 수 없습니다.');
        return;
      }

      const isFavorited = favorites.includes(roomId);

      if (isFavorited) {
        await ApiService.removeFavorite(roomId);
        setFavorites(favorites.filter(id => id !== roomId));
      } else {
        await ApiService.addFavorite(roomId, String(userData.id));
        setFavorites([...favorites, roomId]);
      }

      // 상태 업데이트
      const currentFavoriteCount = property.favorite_count || 0;
      const newFavoriteCount = isFavorited
        ? Math.max(0, currentFavoriteCount - 1)
        : currentFavoriteCount + 1;

      const updatedRooms = rooms.map(room =>
        room.id === property.id
          ? { ...room, isFavorited: !room.isFavorited, favorite_count: newFavoriteCount }
          : room
      );
      setRooms(updatedRooms);

      // selectedProperty의 favorite_count도 업데이트
      setSelectedProperty({
        ...property,
        isFavorited: !property.isFavorited,
        favorite_count: newFavoriteCount
      });

      console.log('❤️ 좋아요 수 업데이트:', currentFavoriteCount, '->', newFavoriteCount);
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

  // 매물 타입별 키워드 매칭 함수
  const matchPropertyType = (room, query) => {
    const roomTypeKeywords = {
      '원룸': ['원룸', '1룸', 'oneroom'],
      '투룸': ['투룸', '2룸', 'tworoom'],
      '쓰리룸': ['쓰리룸', '3룸', 'threeroom'],
      '오피스텔': ['오피스텔', 'officetel'],
      '아파트': ['아파트', 'apartment', '아파'],
      '빌라': ['빌라', 'villa'],
      '연립': ['연립', '연립주택'],
      '다세대': ['다세대', '다세대주택']
    };

    // 검색어에서 매물 유형 키워드 찾기
    for (const [type, keywords] of Object.entries(roomTypeKeywords)) {
      if (keywords.some(keyword => query.toLowerCase().includes(keyword.toLowerCase()))) {
        // 매물의 주소나 설명에서 해당 타입이 있는지 확인
        const hasTypeInRoom = keywords.some(keyword =>
          room.address.toLowerCase().includes(keyword.toLowerCase()) ||
          room.description.toLowerCase().includes(keyword.toLowerCase()) ||
          (room.title && room.title.toLowerCase().includes(keyword.toLowerCase()))
        );
        return hasTypeInRoom;
      }
    }
    return true; // 매물 타입 검색어가 없으면 모든 매물 포함
  };

  const handleSearch = async (customQuery = null) => {
    const query = customQuery || searchQuery;

    // 검색어가 비어있으면 전체 매물 표시
    if (!query.trim()) {
      setRooms(allRooms);
      setShowRecentSearches(false);
      setSearchPin(null); // 검색 핀 제거
      console.log(`✅ 전체 매물 표시: ${allRooms.length}개 결과`);
      return;
    }

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
        floor: room.floor,
        rooms: room.rooms,
      }));

      // API 결과와 전체 매물에서 검색어에 맞는 매물들을 모두 합치기
      const matchingRoomsFromAll = allRooms.filter(room =>
        matchPropertyType(room, query) && (
          room.address.toLowerCase().includes(query.toLowerCase()) ||
          room.description.toLowerCase().includes(query.toLowerCase()) ||
          room.transaction_type.includes(query) ||
          (room.title && room.title.toLowerCase().includes(query.toLowerCase()))
        )
      );

      // API 결과와 전체 매물 검색 결과를 병합하고 중복 제거
      const apiResultIds = new Set(formattedResults.map(room => room.id));
      const uniqueRooms = matchingRoomsFromAll.filter(room => !apiResultIds.has(room.id));

      let combinedResults = [...formattedResults, ...uniqueRooms];

      // 매물 유형별 필터링 적용
      combinedResults = combinedResults.filter(room => matchPropertyType(room, query));

      setRooms(combinedResults);


      // 지역/주소 검색 시 해당 위치로 포커싱
      await focusOnSearchLocation(query, combinedResults);

      console.log(`✅ 검색 완료: ${combinedResults.length}개 결과`);
    } catch (error) {
      console.error('검색 실패:', error);
      Alert.alert('오류', '검색에 실패했습니다.');
    }
  };

  // Google Places API를 사용한 지역 검색
  const searchLocationWithGoogle = async (query) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${GOOGLE_MAPS_API_KEY}&region=kr&language=ko`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const result = data.results[0];
        const location = result.geometry.location;
        const bounds = result.geometry.bounds || result.geometry.viewport;

        return {
          latitude: location.lat,
          longitude: location.lng,
          address: result.formatted_address,
          bounds: bounds,
          locationTypes: result.types
        };
      }

      console.log('Google Geocoding API 응답:', data.status);
      return null;
    } catch (error) {
      console.log('Google Geocoding API 에러:', error);
      return null;
    }
  };

  const focusOnSearchLocation = async (query, results) => {
    if (!mapViewRef.current) return;

    // Google Places API로 검색 시도
    const googleResult = await searchLocationWithGoogle(query);

    if (googleResult) {
      // 검색 결과 타입에 따라 적절한 줌 레벨 설정
      let latitudeDelta = 0.02;
      let longitudeDelta = 0.02;

      // 지역 타입에 따른 줌 레벨 조정
      if (googleResult.locationTypes) {
        const types = googleResult.locationTypes;

        if (types.includes('country')) {
          // 국가 - 매우 넓게
          latitudeDelta = 10.0;
          longitudeDelta = 10.0;
        } else if (types.includes('administrative_area_level_1')) {
          // 시/도 (서울특별시) - 넓게
          latitudeDelta = 0.5;
          longitudeDelta = 0.5;
        } else if (types.includes('administrative_area_level_2')) {
          // 구/군 - 중간
          latitudeDelta = 0.1;
          longitudeDelta = 0.1;
        } else if (types.includes('administrative_area_level_3') || types.includes('sublocality')) {
          // 동/읍/면 - 좁게
          latitudeDelta = 0.05;
          longitudeDelta = 0.05;
        } else if (types.includes('establishment') || types.includes('point_of_interest')) {
          // 특정 장소/건물 - 매우 좁게
          latitudeDelta = 0.01;
          longitudeDelta = 0.01;
        }
      }

      // bounds 정보가 있으면 더 정확하게 계산
      if (googleResult.bounds) {
        const { northeast, southwest } = googleResult.bounds;
        latitudeDelta = Math.abs(northeast.lat - southwest.lat) * 1.2; // 여유 공간 20% 추가
        longitudeDelta = Math.abs(northeast.lng - southwest.lng) * 1.2;
      }

      // UI 요소를 고려한 중앙 정렬을 위해 아래로 오프셋 (화면 중앙에 배치)
      const offsetLatitude = googleResult.latitude - (latitudeDelta * 0.50); // 25% 아래로 이동

      mapViewRef.current.animateToRegion({
        latitude: offsetLatitude,
        longitude: googleResult.longitude,
        latitudeDelta,
        longitudeDelta,
      }, 1000);

      // 검색 핀 설정
      setSearchPin({
        latitude: googleResult.latitude,
        longitude: googleResult.longitude,
        title: query,
        address: googleResult.address
      });

      console.log('✅ Google API로 지역 검색 성공:', googleResult.address);
      console.log('📍 줌 레벨:', { latitudeDelta, longitudeDelta });
      return;
    }

    // Google API 실패시 매물 검색 결과가 있으면 해당 영역으로 이동
    if (results.length > 0) {
      const coordinates = results.map(room => ({
        latitude: room.latitude,
        longitude: room.longitude,
      }));

      mapViewRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
        animated: true,
      });
      console.log('✅ 매물 검색 결과로 지도 이동');
    } else {
      console.log('❌ 검색 결과를 찾을 수 없습니다');
    }
  };

  // 필터 상태들을 미리 이동 - 기존 것은 삭제됨

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
        <View style={{ marginLeft: 4 }}>
          <ChevronDownIcon
            width={8}
            height={5}
            color={hasSelection ? "#FF6600" : "#666"}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const PropertyCard = () => {
    if (!selectedProperty || showBuildingModal) return null;


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
            <Image
              source={{ uri: getRoomImage(selectedProperty?.room_id) }}
              style={styles.cardImage}
              defaultSource={{ uri: 'https://via.placeholder.com/80x80/f0f0f0/666?text=매물' }}
            />
          </View>

          <View style={styles.cardInfo}>
            <Text style={styles.cardPrice}>
              {selectedProperty.transaction_type} {formatPrice(selectedProperty.price_deposit, selectedProperty.transaction_type, selectedProperty.price_monthly, selectedProperty.room_id)}
            </Text>
            <Text style={styles.cardSubInfo} numberOfLines={1}>
              {getRoomType(selectedProperty.area, selectedProperty.rooms)} | {formatArea(selectedProperty.area)} | {formatFloor(selectedProperty.floor)}
            </Text>
            <Text style={styles.cardAddress} numberOfLines={1}>
              관리비 {formatMaintenanceCost(selectedProperty.area)}원 | {getNearestStation(selectedProperty.address)}
            </Text>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={12} color="#fff" />
              <Text style={styles.verifiedText}>집주인 인증</Text>
            </View>
          </View>

          <View style={styles.cardRightSection}>
            <View style={styles.favoriteSection}>
              <FavoriteButton
                isFavorited={favorites.includes(selectedProperty.room_id || selectedProperty.id)}
                onPress={() => handleFavoriteToggle(selectedProperty)}
                style={{ marginBottom: 3 }}
              />
              <View style={styles.cardLikeCount}>
                <Text style={styles.likeCountText}>{selectedProperty.favorite_count || 0}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const handleMarkerSelectionChange = useCallback((propertyId) => {
    if (!propertyId) {
      // 지도 배경 클릭 시 - 마커 선택 해제 및 검색창 닫기
      setShowRecentSearches(false);
      // 검색창의 포커스 해제
      if (searchInputRef.current) {
        searchInputRef.current.blur();
      }
      if (selectedProperty) {
        // PropertyCard 닫기 애니메이션 실행
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
      } else {
        setSelectedProperty(null);
        setSelectedPropertyId(null);
      }
    }
  }, [selectedProperty, slideAnim, locationButtonAnim]);

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 - 검색바 */}
      <View style={styles.header}>
        <View style={styles.headerLeft} />
        <Text style={styles.headerTitle}>매물 둘러보기</Text>
        <TouchableOpacity
          style={styles.profileButton}
          onPress={() => navigation.navigate('ChatList')}
        >
          <View style={styles.profileCircle}>
            <ChatIcon size={21} color="#464646" />
          </View>
        </TouchableOpacity>
      </View>

      {/* 검색바 */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <LocationIcon width={22} height={22} color="#666" />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="지역, 지하철역, 학교명 검색"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => handleSearch()}
            onFocus={() => setShowRecentSearches(true)}
            onBlur={() => setTimeout(() => setShowRecentSearches(false), 150)}
            returnKeyType="search"
            placeholderTextColor="#999"
          />
          <TouchableOpacity style={styles.searchButton} onPress={() => handleSearch()}>
            <SearchIcon width={16} height={16} color="#666" />
          </TouchableOpacity>
        </View>

        {/* 최근 검색어 드롭다운 */}
        <View style={[
          styles.recentSearchDropdown,
          {
            opacity: showRecentSearches ? 1 : 0,
            pointerEvents: showRecentSearches ? 'auto' : 'none'
          }
        ]}>
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
      </View>

      {/* 필터 바 */}
      <View style={[styles.filterContainer, isFilterExpanded && styles.filterContainerExpanded]}>
        {isFilterExpanded ? (
          <View style={styles.filterContentExpanded}>
            {filterOptions.map((option) => (
              <FilterButton
                key={option.id}
                option={option}
              />
            ))}
          </View>
        ) : (
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
        )}

        {/* 페이드 아웃 그라데이션 - 확장되지 않았을 때만 */}
        {!isFilterExpanded && (
          <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.9)', 'rgba(255,255,255,1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.fadeGradient}
            pointerEvents="none"
          />
        )}

        {/* 더보기 버튼 */}
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => setIsFilterExpanded(!isFilterExpanded)}
        >
          <Ionicons
            name={isFilterExpanded ? "chevron-up" : "chevron-down"}
            size={12}
            color="#666"
          />
        </TouchableOpacity>

      </View>


      {/* 지도 */}
      <View style={styles.mapContainer}>
        <PropertyMapView
          key={mapKey}
          ref={mapViewRef}
          properties={rooms}
          showFavoritesOnly={showFavoritesOnly}
          initialRegion={initialRegion}
          onMarkerPress={handleMarkerPress}
          selectedPropertyId={selectedPropertyId}
          navigation={navigation}
          onBuildingModalStateChange={setShowBuildingModal}
          onMarkerSelectionChange={handleMarkerSelectionChange}
          searchPin={searchPin}
          favorites={favorites}
          onToggleFavorite={handleFavoriteToggle}
        />

        {/* 오른쪽 상단 버튼들 */}
        <View style={styles.topRightButtons}>
          {/* 하트(찜 목록) 버튼 */}
          <TouchableOpacity
            style={styles.heartButton}
            onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
          >
            <HeartIcon width={22} height={20} color={showFavoritesOnly ? '#FF6600' : '#333'} filled={showFavoritesOnly} />
          </TouchableOpacity>

          {/* 현재 위치 버튼 */}
          <TouchableOpacity
            style={styles.locationButton}
            onPress={goToCurrentLocation}
          >
            <CurrentLocationIcon width={20} height={20} color="#333" />
          </TouchableOpacity>
        </View>
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
                    const newFilterValues = {
                      ...selectedFilterValues,
                      [activeFilter.id]: selectedFilterValues[activeFilter.id] === option ? null : option
                    };
                    setSelectedFilterValues(newFilterValues);
                    setActiveFilter(null);

                    // 필터 변경 후 즉시 적용을 위해 직접 필터링 수행
                    console.log('🔄 필터 즉시 적용');
                    let filteredRooms = [...allRooms];

                    // 새로운 필터 값으로 필터링
                    Object.entries(newFilterValues).forEach(([key, value]) => {
                      if (!value) return;

                      if (key === 'transaction') {
                        filteredRooms = filteredRooms.filter(room =>
                          room.transaction_type === value
                        );
                      } else if (key === 'type') {
                        const typeKeywords = {
                          '원룸': ['원룸', '1룸', 'oneroom'],
                          '투룸': ['투룸', '2룸', 'tworoom'],
                          '오피스텔': ['오피스텔', 'officetel', '오피', '상업시설'],
                          '아파트': ['아파트', 'apartment', '아파', '공동주택']
                        };
                        const keywords = typeKeywords[value] || [];
                        filteredRooms = filteredRooms.filter(room => {
                          const searchText = `${room.address || ''} ${room.description || ''} ${room.title || ''}`.toLowerCase();
                          const hasKeyword = keywords.some(keyword =>
                            searchText.includes(keyword.toLowerCase())
                          );
                          if (!hasKeyword && value === '원룸') {
                            return room.area && parseFloat(room.area) <= 25;
                          } else if (!hasKeyword && value === '투룸') {
                            return room.area && parseFloat(room.area) > 25 && parseFloat(room.area) <= 50;
                          }
                          return hasKeyword;
                        });
                      } else if (key === 'price') {
                        const priceRanges = {
                          '1억 이하': [0, 10000],
                          '1-3억': [10000, 30000],
                          '3-5억': [30000, 50000],
                          '5억 이상': [50000, 999999]
                        };
                        const [min, max] = priceRanges[value] || [0, 999999];
                        filteredRooms = filteredRooms.filter(room =>
                          room.price_deposit >= min && room.price_deposit <= max
                        );
                      } else if (key === 'size') {
                        const sizeRanges = {
                          '10평 이하': [0, 33],
                          '10-20평': [33, 66],
                          '20-30평': [66, 99],
                          '30평 이상': [99, 999999]
                        };
                        const [min, max] = sizeRanges[value] || [0, 999999];
                        filteredRooms = filteredRooms.filter(room => {
                          const area = parseFloat(room.area);
                          return !isNaN(area) && area >= min && area <= max;
                        });
                      } else if (key === 'favorites') {
                        const favoriteRanges = {
                          '5개': 5,
                          '10개': 10,
                          '15개': 15,
                          '20개': 20
                        };
                        const minFavorites = favoriteRanges[value] || 0;
                        filteredRooms = filteredRooms.filter(room =>
                          (room.favorite_count || 0) >= minFavorites
                        );
                      }
                    });

                    setRooms([...filteredRooms]);
                    setMapKey(prev => prev + 1);
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
    paddingTop: 3,
    paddingBottom: 6,
  },
  headerLeft: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
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
    zIndex: 10000,
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
    paddingVertical: 0,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 0,
    zIndex: 1,
    position: 'relative',
  },
  filterContainerExpanded: {
    flexDirection: 'column',
    alignItems: 'stretch',
    paddingVertical: 15,
  },
  filterContentExpanded: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    rowGap: 8,
    paddingRight: 40,
  },
  filterScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 40,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 10,
  },
  filterButtonText: {
    fontSize: 12,
    color: '#888888',
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
    width: 18,
    height: 18,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    right: 14,
    top: 7,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  topRightButtons: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'column',
  },
  heartButton: {
    width: 35,
    height: 35,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    marginBottom: 8,
  },
  locationButton: {
    width: 35,
    height: 35,
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
    zIndex: 10,
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
    justifyContent: 'space-between',
    padding: 12,
  },
  cardRightSection: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginLeft: 8,
    height: 100,
  },
  favoriteSection: {
    gap: 0,
  },
  cardImageContainer: {
    marginRight: 12,
  },
  cardImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  cardInfo: {
    flex: 1,
    paddingVertical: 2,
    height: 100,
    justifyContent: 'space-between',
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
    fontFamily: 'Pretendard',
  },
  cardSubInfo: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'Pretendard',
  },
  cardAddress: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
    fontFamily: 'Pretendard',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#595959',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#595959',
    alignSelf: 'flex-start',
  },
  verifiedText: {
    fontSize: 11,
    color: '#fff',
    marginLeft: 4,
    fontWeight: '600',
    fontFamily: 'Pretendard',
  },
  cardLikeCount: {
    alignItems: 'center',
  },
  likeCountText: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
    fontFamily: 'Pretendard',
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
    zIndex: 9999,
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
