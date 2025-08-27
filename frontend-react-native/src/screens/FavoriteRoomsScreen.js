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
    <TouchableOpacity style={styles.cardContainer} onPress={() => handleRoomPress(item)}>
      <View style={styles.imageContainer}>
        <View style={styles.imagePlaceholder}>
          <Ionicons name="home-outline" size={24} color="#999" />
        </View>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.contentHeader}>
          <View style={styles.contentLeft}>
            <Text style={styles.price}>
              {formatPrice(item.price_deposit, item.transaction_type, item.price_monthly, item.room_id)}
            </Text>
            <Text style={styles.roomInfo}>
              {getRoomType(item.area, item.rooms)} | {formatArea(item.area)} | {formatFloor(item.floor)}
            </Text>
            <Text style={styles.additionalInfo}>
              {item.address}
            </Text>
            {item.verified && (
              <View style={styles.verificationBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#FF6600" />
                <Text style={styles.verificationText}>집주인 인증</Text>
              </View>
            )}
          </View>
          <TouchableOpacity 
            style={styles.heartContainer}
            onPress={(e) => {
              e.stopPropagation();
              removeFavorite(item.room_id);
            }}
          >
            <Ionicons name="heart" size={20} color="#FF6B6B" />
            <Text style={styles.heartCount}>{item.favorite_count}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>관심 목록</Text>
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    marginBottom: 0,
    flexDirection: 'row',
    minHeight: 120,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  imageContainer: {
    width: 100,
    height: 100,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E9ECEF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
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
  infoContainer: {
    flex: 1,
    paddingLeft: 15,
    justifyContent: 'center',
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  contentLeft: {
    flex: 1,
    paddingRight: 12,
  },
  heartContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  heartCount: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '500',
    color: '#212529',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 4,
  },
  roomInfo: {
    fontSize: 13,
    fontWeight: '500',
    color: '#495057',
    marginBottom: 3,
  },
  additionalInfo: {
    fontSize: 11,
    color: '#6C757D',
    marginBottom: 6,
  },
  verificationBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF5F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE5D9',
  },
  verificationText: {
    fontSize: 11,
    color: '#FF6600',
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default FavoriteRoomsScreen;
