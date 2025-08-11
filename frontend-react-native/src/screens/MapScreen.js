import React, { useState, useEffect } from "react";
import { View, StyleSheet, Alert, ScrollView, TouchableOpacity, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import PropertyMapView from "../components/MapView";
import ApiService from "../services/api";

export default function MapScreen() {
  const [rooms, setRooms] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('전체');
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);

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

  const handleMarkerPress = async (room) => {
    setSelectedPropertyId(room.id);
    try {
      // 방 상세 정보 가져오기
      const roomDetail = await ApiService.getRoomDetail(room.id);
      const marketPrice = await ApiService.getMarketPrice(room.id);
      
      let alertMessage = `${roomDetail.address}\n\n`;
      alertMessage += `${roomDetail.transaction_type}: ${roomDetail.price_deposit}만원`;
      if (roomDetail.price_monthly > 0) {
        alertMessage += ` / ${roomDetail.price_monthly}만원`;
      }
      alertMessage += `\n면적: ${roomDetail.area}㎡`;
      alertMessage += `\n층수: ${roomDetail.floor}층`;
      if (roomDetail.building_year) {
        alertMessage += `\n건축년도: ${roomDetail.building_year}년`;
      }
      alertMessage += `\n찜 수: ${roomDetail.favorite_count}개`;
      alertMessage += `\n위험도: ${roomDetail.risk_score}/10`;
      
      if (marketPrice) {
        alertMessage += `\n\n📊 시세 정보:`;
        alertMessage += `\n현재가: ${marketPrice.current_price}만원`;
        alertMessage += `\n평균가: ${marketPrice.average_price}만원`;
        if (marketPrice.price_analysis.is_expensive) {
          alertMessage += `\n⚠️ 시세보다 ${marketPrice.price_analysis.price_difference_percent}% 비쌈`;
        } else if (marketPrice.price_analysis.is_cheap) {
          alertMessage += `\n💰 시세보다 ${Math.abs(marketPrice.price_analysis.price_difference_percent)}% 저렴`;
        }
      }
      
      if (roomDetail.description) {
        alertMessage += `\n\n📝 ${roomDetail.description}`;
      }
      
      Alert.alert(room.title, alertMessage);
    } catch (error) {
      Alert.alert(room.title, `${room.address}\n${room.description}`);
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
      <PropertyMapView
        properties={rooms}
        onMarkerPress={handleMarkerPress}
        selectedPropertyId={selectedPropertyId}
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
});