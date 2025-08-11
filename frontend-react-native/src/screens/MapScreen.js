import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Alert, ScrollView, TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Location from 'expo-location';
import PropertyMapView from "../components/MapView";
import ApiService from "../services/api";
import RoomDetailModal from "../components/RoomDetailModal";

export default function MapScreen({ navigation }) {
  const [rooms, setRooms] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('전체');
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showModal, setShowModal] = useState(false);
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
      
      setAllRooms(formattedRooms);
      setRooms(formattedRooms);
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
    try {
      // 방 상세 정보 가져오기
      const roomDetail = await ApiService.getRoomDetail(room.id);
      
      // 모달에 필요한 형태로 데이터 변환
      const formattedRoom = {
        room_id: roomDetail.room_id,
        address: roomDetail.address,
        transaction_type: roomDetail.transaction_type,
        price_deposit: roomDetail.price_deposit,
        price_monthly: roomDetail.price_monthly,
        area: roomDetail.area,
        rooms: roomDetail.rooms || 1,
        bathrooms: roomDetail.bathrooms || 1,
        floor_info: roomDetail.floor_info || roomDetail.floor,
        risk_score: roomDetail.risk_score,
        latitude: roomDetail.latitude,
        longitude: roomDetail.longitude,
        favorite_count: roomDetail.favorite_count || 0,
      };
      
      setSelectedRoom(formattedRoom);
      setShowModal(true);
    } catch (error) {
      console.error('방 상세 정보 로드 실패:', error);
      Alert.alert('오류', '방 정보를 불러오는데 실패했습니다.');
    }
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

  return (
    <View style={styles.container}>
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
        
        {/* 매물 개수 표시 */}
        <View style={styles.propertyCountContainer}>
          <Ionicons name="home-outline" size={14} color="#666" />
          <Text style={styles.propertyCountText}>{rooms.length}개 매물</Text>
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

      {/* Room Detail Modal */}
      <RoomDetailModal
        visible={showModal}
        room={selectedRoom}
        user={userData}
        onClose={handleModalClose}
        onNavigateToChat={handleNavigateToChat}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  filterContainer: {
    backgroundColor: '#fff',
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
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
    marginRight: 8,
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
  propertyCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
  },
  propertyCountText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontWeight: '500',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  currentLocationButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
});