import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import ApiService from '../services/api';
import { formatPrice, formatArea, getRoomType, formatFloor } from '../utils/priceUtils';

const { width } = Dimensions.get('window');

// 주소 포맷팅 함수 - 시구 제외하고 동부터 표시
const formatAddress = (address) => {
  if (!address) return '';
  
  // 주소를 공백으로 분리
  const parts = address.split(' ');
  
  // 서울특별시, 경기도 등과 구를 제거하고 동부터 시작
  const filteredParts = parts.filter((part, index) => {
    // 특별시, 광역시, 도, 시, 구 등을 제거
    if (part.includes('특별시') || part.includes('광역시') || part.includes('도') || 
        part.endsWith('시') || part.endsWith('구')) {
      return false;
    }
    return true;
  });
  
  // 처음 2-3개 부분만 사용 (동, 번지 등)
  return filteredParts.slice(0, 2).join(' ');
};

// 관리비를 만원 단위로 반올림하여 포맷팅 (HomeScreen과 동일한 로직)
const formatMaintenanceCost = (area) => {
  if (!area) return '7만';

  const cost = Math.round(area * 1000);
  const manWon = Math.round(cost / 10000);

  return `${manWon}만`;
};

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

const FavoriteRoomsScreen = ({ navigation, user }) => {
  const [favoriteRooms, setFavoriteRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // 사용자 정보
  const userData = user || { id: "1" };

  useEffect(() => {
    loadFavorites();
    
    // 탭이 포커스될 때마다 찜 목록 새로고침
    const unsubscribe = navigation.addListener('focus', () => {
      loadFavorites();
    });
    
    return unsubscribe;
  }, [navigation]);
  
  const loadFavorites = async () => {
    try {
      setLoading(true);
      const favorites = await ApiService.getUserFavorites(String(userData.id));
      
      console.log('API 응답 샘플:', favorites[0]); // 첫 번째 아이템의 구조 확인
      
      // API 응답 구조에 맞게 데이터 변환
      const formattedFavorites = favorites.map(item => ({
        id: item.room_id,
        room_id: item.room_id,
        price_deposit: item.price_deposit,
        price_monthly: item.price_monthly || 0,
        transaction_type: item.transaction_type,
        area: item.area,
        floor: item.floor,
        rooms: item.rooms,
        address: item.address,
        favorite_count: item.favorite_count || 0, // 실제 백엔드 데이터 사용
        verified: true, // 실제 인증 여부는 백엔드에서 받아와야 함
      }));
      
      setFavoriteRooms(formattedFavorites);
    } catch (error) {
      console.error('찜 목록 로드 실패:', error);
      setFavoriteRooms([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    loadFavorites();
  };
  
  const removeFavorite = async (roomId) => {
    try {
      await ApiService.removeFavorite(roomId);
      setFavoriteRooms(favoriteRooms.filter(room => room.room_id !== roomId));
      
      // 찜 상태 변경을 저장하여 다른 화면에서 감지할 수 있도록 함
      await AsyncStorage.setItem('favoriteChanged', Date.now().toString());
    } catch (error) {
      Alert.alert('오류', '찜 삭제에 실패했습니다.');
    }
  };
  
  const handleRoomPress = (room) => {
    navigation.navigate('RoomDetail', { roomId: room.room_id });
  };

  const renderRoomCard = ({ item }) => (
    <View style={styles.cardContainer}>
      <View style={styles.roomCard}>
        <TouchableOpacity onPress={() => handleRoomPress(item)}>
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: getRoomImage(item.room_id) }}
              style={styles.roomImage}
              defaultSource={{ uri: 'https://via.placeholder.com/116x116/f0f0f0/666?text=매물' }}
            />
          </View>
        </TouchableOpacity>

        <View style={styles.infoContainer}>
          <View style={styles.contentHeader}>
            <View style={styles.contentLeft}>
              <View style={styles.priceAndDetailsContainer}>
                <View style={styles.priceContainer}>
                  <Text style={styles.price}>
                    {formatPrice(item.price_deposit, item.transaction_type, item.price_monthly, item.room_id)}
                  </Text>
                </View>
                <View style={styles.roomDetailsContainer}>
                  <View style={styles.roomInfoRow}>
                    <Text style={styles.roomInfo}>
                      {getRoomType(item.area, item.rooms)} | {formatArea(item.area)} | {formatFloor(item.floor)}
                    </Text>
                  </View>
                  <View style={styles.additionalInfoRow}>
                    <Text 
                      style={styles.additionalInfo}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      관리비 {formatMaintenanceCost(item.area)}원 | {formatAddress(item.address)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            <View style={styles.heartContainer}>
              <TouchableOpacity 
                style={styles.heartButton}
                onPress={(e) => {
                  e.stopPropagation();
                  removeFavorite(item.room_id);
                }}
              >
                <Ionicons name="heart" size={12} color="#FC6339" />
              </TouchableOpacity>
              <Text style={styles.heartCount}>{item.favorite_count}</Text>
            </View>
          </View>
          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={styles.shareButton}>
              <Text style={styles.shareButtonText}>공유하기</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.roommateButton}>
              <Text style={styles.roommateButtonText}>룸메이트 찾기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>관심 매물</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6600" />
          <Text style={styles.loadingText}>찜 목록을 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>관심 목록</Text>
      </View>

      {favoriteRooms.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={48} color="#999" />
          <Text style={styles.emptyText}>아직 찜한 매물이 없습니다</Text>
          <Text style={styles.emptySubtext}>마음에 드는 매물을 찜해보세요!</Text>
        </View>
      ) : (
        <FlatList
          data={favoriteRooms}
          renderItem={renderRoomCard}
          keyExtractor={(item) => item.room_id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FF6600"
            />
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 5,
    backgroundColor: '#F2F2F2',
    height: 55,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    fontFamily: 'Pretendard',
  },
  listContainer: {
    paddingHorizontal: 14,
    paddingVertical: 0,
    gap: 10,
  },
  cardContainer: {
    width: 384,
    height: 158,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginBottom: 10,
    paddingTop: 20,
    paddingBottom: 20,
    paddingLeft: 19,
    paddingRight: 23,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: 10,
  },
  imageContainer: {
    width: 116,
    height: 116,
    overflow: 'hidden',
    borderRadius: 9,
  },
  roomImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#D9D9D9',
    borderRadius: 9,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  roomCard: {
    width: 365,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 18,
  },
  infoContainer: {
    height: 116,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: 7,
  },
  contentHeader: {
    width: 213,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  contentLeft: {
    width: 178,
    height: 80,
    paddingTop: 3,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 11,
  },
  priceAndDetailsContainer: {
    alignSelf: 'stretch',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: 5,
  },
  heartContainer: {
    width: 24,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 3.43,
  },
  heartButton: {
    width: 24,
    height: 24,
    backgroundColor: '#ffffff',
    borderRadius: 9999,
    borderWidth: 0.5,
    borderColor: '#D9D9D9',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  heartCount: {
    textAlign: 'center',
    color: '#595959',
    fontSize: 12.57,
    fontFamily: 'Pretendard Variable',
    fontWeight: '300',
    lineHeight: 14.86,
    letterSpacing: 0.07,
  },
  priceContainer: {
    alignSelf: 'stretch',
    justifyContent: 'flex-end',
    display: 'flex',
    flexDirection: 'column',
  },
  price: {
    color: 'rgba(0, 0, 0, 0.80)',
    fontSize: 18,
    fontFamily: 'Pretendard',
    fontWeight: '600',
  },
  roomDetailsContainer: {
    alignSelf: 'stretch',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: 1,
  },
  roomInfoRow: {
    alignSelf: 'stretch',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 10,
    display: 'flex',
    flexDirection: 'row',
  },
  roomInfo: {
    opacity: 0.6,
    color: 'black',
    fontSize: 14,
    fontFamily: 'Pretendard Variable',
    fontWeight: '400',
    lineHeight: 22.4,
  },
  additionalInfoRow: {
    alignSelf: 'stretch',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 10,
    display: 'flex',
    flexDirection: 'row',
  },
  additionalInfo: {
    opacity: 0.6,
    color: 'black',
    fontSize: 14,
    fontFamily: 'Pretendard Variable',
    fontWeight: '400',
    lineHeight: 22.4,
  },
  buttonsContainer: {
    width: 178,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: 4,
  },
  shareButton: {
    width: 105,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'black',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButtonText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Pretendard Variable',
    fontWeight: '600',
    lineHeight: 19.2,
  },
  roommateButton: {
    width: 104,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#10B585',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roommateButtonText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Pretendard Variable',
    fontWeight: '600',
    lineHeight: 19.2,
  },
});

export default FavoriteRoomsScreen;
