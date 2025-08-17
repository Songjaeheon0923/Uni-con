import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';
import { formatRentPrice } from '../utils/priceFormatter';

const { width, height } = Dimensions.get('window');

export default function RoomDetailScreen({ route, navigation }) {
  const { roomId } = route.params;
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);

  useEffect(() => {
    loadRoomDetail();
  }, [roomId]);

  const loadRoomDetail = async () => {
    try {
      setLoading(true);
      const roomData = await ApiService.getRoomDetail(roomId);
      setRoom(roomData);
    } catch (error) {
      console.error('방 정보 로드 실패:', error);
      Alert.alert('오류', '방 정보를 불러올 수 없습니다.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = () => {
    if (!room) return '';
    return formatRentPrice(room.price_deposit, room.price_monthly);
  };

  const toggleFavorite = async () => {
    try {
      if (isFavorited) {
        await ApiService.removeFavorite(roomId);
      } else {
        await ApiService.addFavorite(roomId, 'user123'); // TODO: 실제 user ID 사용
      }
      setIsFavorited(!isFavorited);
    } catch (error) {
      console.error('찜 상태 변경 실패:', error);
      Alert.alert('오류', '찜 상태를 변경할 수 없습니다.');
    }
  };

  const handleContactOwner = () => {
    navigation.navigate('LandlordInfo', { roomId });
  };

  const handleViewFavoritedUsers = () => {
    navigation.navigate('FavoritedUsers', { roomId });
  };

  const handleViewContract = () => {
    navigation.navigate('ContractView', { roomId });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>로딩 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!room) return null;

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleFavorite} style={styles.favoriteButton}>
          <Ionicons 
            name={isFavorited ? "heart" : "heart-outline"} 
            size={24} 
            color={isFavorited ? "#FF6600" : "#333"} 
          />
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* 이미지 갤러리 */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: 'https://via.placeholder.com/400x300/f0f0f0/666?text=매물사진' }}
            style={styles.mainImage}
            resizeMode="cover"
          />
          <View style={styles.imageIndicator}>
            <Text style={styles.imageCount}>1 / 4</Text>
          </View>
          <TouchableOpacity style={styles.playButton}>
            <Ionicons name="play" size={32} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* 매물 정보 */}
        <View style={styles.infoContainer}>
          <Text style={styles.propertyId}>매물번호 {room.room_id}</Text>
          <Text style={styles.verificationBadge}>✓ 확인된 매물</Text>

          <Text style={styles.price}>{formatPrice()}</Text>
          <Text style={styles.description}>
            안암역 10분거리 넓고 깔끔한 풀 옵션 원룸
          </Text>

          {/* 기본 정보 */}
          <View style={styles.basicInfoContainer}>
            <View style={styles.basicInfoItem}>
              <Ionicons name="home-outline" size={16} color="#666" />
              <Text style={styles.basicInfoText}>
                {room.transaction_type === '월세' ? '신축' : '빌라'}, {room.transaction_type === '월세' ? '전용' : '주택'}, 올콘삭제
              </Text>
            </View>
            <View style={styles.basicInfoItem}>
              <Ionicons name="resize-outline" size={16} color="#666" />
              <Text style={styles.basicInfoText}>
                {room.rooms || 1}룸 ({room.area}㎡)
              </Text>
            </View>
            <View style={styles.basicInfoItem}>
              <Ionicons name="layers-outline" size={16} color="#666" />
              <Text style={styles.basicInfoText}>
                4층, 엘리베이터 사용
              </Text>
            </View>
            <View style={styles.basicInfoItem}>
              <Ionicons name="camera-outline" size={16} color="#666" />
              <Text style={styles.basicInfoText}>
                관리비 7만원(수도 포함)
              </Text>
            </View>
          </View>

          {/* 카드 입력란 */}
          <View style={styles.cardInputContainer}>
            <Text style={styles.cardInputPlaceholder}>카드 정보</Text>
          </View>

          {/* 찜한 사람들 보기 */}
          <TouchableOpacity style={styles.favoritedUsersButton} onPress={handleViewFavoritedUsers}>
            <View style={styles.favoritedUsersContent}>
              <Ionicons name="heart" size={20} color="#FF6600" />
              <Text style={styles.favoritedUsersText}>
                {room.favorite_count || 0}명이 찜했어요
              </Text>
              <Text style={styles.favoritedUsersSubtext}>
                궁합 점수 순으로 보기
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          {/* 버튼들 */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.contactButton} onPress={handleContactOwner}>
              <Text style={styles.contactButtonText}>룸메이트 구하기</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.contractButton} onPress={handleViewContract}>
              <Text style={styles.contractButtonText}>전화걸기</Text>
              <Ionicons name="arrow-forward" size={16} color="#333" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 44, // 노치 영역 고려
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'transparent',
    position: 'absolute',
    top: 44, // 상태바 영역 만큼 아래로
    left: 0,
    right: 0,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: width,
    height: 300,
    position: 'relative',
    marginTop: 44, // 상태바 높이만큼 여백 추가
  },
  mainImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  imageIndicator: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    padding: 16,
  },
  propertyId: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  verificationBadge: {
    fontSize: 12,
    color: '#4CAF50',
    marginBottom: 16,
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 24,
  },
  basicInfoContainer: {
    marginBottom: 24,
  },
  basicInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  basicInfoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  cardInputContainer: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  cardInputPlaceholder: {
    fontSize: 14,
    color: '#66B2FF',
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  contactButton: {
    flex: 1,
    backgroundColor: '#666',
    borderRadius: 8,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  contractButton: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 8,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  contractButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  favoritedUsersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff5f0',
    borderWidth: 1,
    borderColor: '#ffe0cc',
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
  },
  favoritedUsersContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  favoritedUsersText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  favoritedUsersSubtext: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
});