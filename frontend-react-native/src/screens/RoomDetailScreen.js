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
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';
import { formatPrice as formatPriceUtil, formatArea, getRoomType, formatFloor } from '../utils/priceUtils';

const { width } = Dimensions.get('window');

const formatMaintenanceCost = (area) => {
  if (!area) return '7만';
  
  const cost = Math.round(area * 1000);
  const manWon = Math.round(cost / 10000);
  
  return `${manWon}만`;
};

export default function RoomDetailScreen({ route, navigation }) {
  const { roomId, room: roomFromParams } = route.params || {};
  const [room, setRoom] = useState(roomFromParams || null);
  const [loading, setLoading] = useState(!roomFromParams);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [images] = useState([
    'https://via.placeholder.com/400x300/f0f0f0/666?text=매물사진1',
    'https://via.placeholder.com/400x300/f0f0f0/666?text=매물사진2',
    'https://via.placeholder.com/400x300/f0f0f0/666?text=매물사진3',
    'https://via.placeholder.com/400x300/f0f0f0/666?text=매물사진4',
  ]);

  useEffect(() => {
    // room 데이터가 파라미터로 전달되지 않은 경우에만 API 호출
    if (!roomFromParams && roomId) {
      loadRoomDetail();
    }
  }, [roomId, roomFromParams]);

  const loadRoomDetail = async () => {
    try {
      setLoading(true);
      const roomData = await ApiService.getRoomDetail(roomId);
      setRoom(roomData);
    } catch (error) {
      console.error('방 정보 로드 실패:', error);
      // API 실패 시 에러 알림 없이 진행 (이미 room 데이터가 있을 수 있음)
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = () => {
    if (!room) return '';
    return formatPriceUtil(
      room.price_deposit,
      room.transaction_type,
      room.price_monthly,
      room.room_id || room.id
    );
  };

  const toggleFavorite = async () => {
    try {
      const id = roomId || room?.room_id;
      if (!id) {
        setIsFavorited(!isFavorited);
        return;
      }

      if (isFavorited) {
        await ApiService.removeFavorite(id);
      } else {
        await ApiService.addFavorite(id, 'user123'); // TODO: 실제 user ID 사용
      }
      setIsFavorited(!isFavorited);
    } catch (error) {
      console.error('찜 상태 변경 실패:', error);
      // API 실패해도 로컬 상태는 변경
      setIsFavorited(!isFavorited);
    }
  };

  const handleContactOwner = () => {
    navigation.navigate('FavoritedUsers', { roomId });
  };

  const handleViewFavoritedUsers = () => {
    navigation.navigate('FavoritedUsers', { roomId });
  };

  const handleViewContract = () => {
    // 임시로 비활성화 - 클릭해도 아무것도 실행되지 않음
    console.log('계약서 검증하기 버튼 클릭됨');
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
    <View style={styles.container}>
      {/* 이미지 갤러리 */}
      <View style={styles.imageContainer}>
        <FlatList
          data={images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.x / width);
            setCurrentImageIndex(index);
          }}
          renderItem={({ item }) => (
            <Image source={{ uri: item }} style={styles.mainImage} resizeMode="cover" />
          )}
          keyExtractor={(item, index) => index.toString()}
        />

        {/* 헤더 오버레이 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.headerRightButtons}>
            <TouchableOpacity onPress={toggleFavorite} style={styles.headerButton}>
              <Ionicons
                name={isFavorited ? "heart" : "heart-outline"}
                size={24}
                color={isFavorited ? "#FF6600" : "#333"}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="share-outline" size={24} color="#333" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 이미지 카운터 */}
        <View style={styles.imageCounter}>
          <Text style={styles.imageCountText}>{currentImageIndex + 1}/{images.length}</Text>
        </View>

        {/* 재생 버튼 */}
        <TouchableOpacity style={styles.playButton}>
          <Ionicons name="play" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* 매물 기본 정보 */}
        <View style={styles.basicInfoSection}>
          <View style={styles.propertyHeader}>
            <Text style={styles.propertyId}>매물번호 {room?.room_id?.substring(room?.room_id?.lastIndexOf('_') + 1, room?.room_id?.lastIndexOf('_') + 9) || '123123123'}</Text>
            <View style={styles.verificationBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#FF6600" />
              <Text style={styles.verificationText}>집주인 인증</Text>
            </View>
          </View>

          <Text style={styles.price}>{formatPrice()}</Text>
          <Text style={styles.description}>{room?.description || '매물 설명이 없습니다.'}</Text>

          <View style={styles.basicDetails}>
            <View style={styles.detailRowContainer}>
              <View style={styles.detailItem}>
                <View style={styles.detailIcon}>
                  <Ionicons name="cube-outline" size={16} color="#666" />
                </View>
                <Text style={styles.detailText}>{getRoomType(room?.area, room?.rooms)}, {room?.building_year && (new Date().getFullYear() - room.building_year < 5) ? '신축' : '기존건물'}</Text>
              </View>
              <View style={styles.detailItem}>
                <View style={styles.detailIcon}>
                  <Ionicons name="resize-outline" size={16} color="#666" />
                </View>
                <Text style={styles.detailText}>{formatArea(room?.area)} ({room?.area || 19.8347}㎡)</Text>
              </View>
            </View>
            <View style={styles.detailRowContainer}>
              <View style={styles.detailItem}>
                <View style={styles.detailIcon}>
                  <Ionicons name="business-outline" size={16} color="#666" />
                </View>
                <Text style={styles.detailText}>{formatFloor(room?.floor)}, {(room?.floor >= 3) ? '엘리베이터 사용' : '계단 이용'}</Text>
              </View>
              <View style={styles.detailItem}>
                <View style={styles.detailIcon}>
                  <Ionicons name="card-outline" size={16} color="#666" />
                </View>
                <Text style={styles.detailText}>관리비 {formatMaintenanceCost(room?.area)}원 (수도 포함)</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 기본 정보 테이블 */}
        <View style={styles.basicInfoTable}>
          <Text style={styles.sectionTitle}>기본 정보</Text>
          <View style={styles.infoTable}>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>매물 유형</Text>
              <Text style={styles.tableValue}>{getRoomType(room?.area, room?.rooms)}, {room?.building_year && (new Date().getFullYear() - room.building_year < 5) ? '신축' : '기존'} 건물</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>크기</Text>
              <Text style={styles.tableValue}>{formatArea(room?.area)} ({room?.area || 19.8347}㎡)</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>가격 정보</Text>
              <Text style={styles.tableValue}>{formatPrice()}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>관리비</Text>
              <Text style={styles.tableValue}>{formatMaintenanceCost(room?.area)}원 (수도세 포함)</Text>
            </View>
          </View>
        </View>

        {/* 상세 정보 테이블 */}
        <View style={styles.detailInfoTable}>
          <Text style={styles.sectionTitle}>상세 정보</Text>
          <View style={styles.infoTable}>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>건물 이름</Text>
              <Text style={styles.tableValue}>{(() => {
                const addressParts = room?.address?.trim().split(' ').filter(part => part !== '');
                const lastPart = addressParts?.pop();
                // 마지막 부분이 단순히 동/가로 끝나는지 (예: "장충동1가") vs 건물명인지 (예: "비전빌라트2동") 구분
                if (!lastPart ||
                    (lastPart?.endsWith('동') && lastPart?.length < 6 && /\d+동$/.test(lastPart)) ||
                    (lastPart?.endsWith('가') && lastPart?.length < 6)) {
                  return room?.room_id?.split('_')[2] || '건물명 정보 없음';
                }
                return lastPart;
              })()}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>해당층/건물층</Text>
              <Text style={styles.tableValue}>{formatFloor(room?.floor)} / {room?.floor ? room.floor + 1 : '-'}층</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>방 수/화장실 수</Text>
              <Text style={styles.tableValue}>{room?.rooms || 1}개 / {room?.rooms || 1}개</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>방향</Text>
              <Text style={styles.tableValue}>남향</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>난방종류</Text>
              <Text style={styles.tableValue}>개별난방</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>엘리베이터</Text>
              <Text style={styles.tableValue}>{(room?.floor >= 3) ? '있음' : '없음'}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>입주가능일</Text>
              <Text style={styles.tableValue}>즉시 입주 (협의 가능)</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>사용승인일</Text>
              <Text style={styles.tableValue}>{room?.building_year || '정보 없음'}</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.tableLabel}>최초등록일</Text>
              <Text style={styles.tableValue}>{room?.created_at ? new Date(room.created_at).toLocaleDateString('ko-KR') : '정보 없음'}</Text>
            </View>
          </View>
        </View>

        {/* 집주인 정보 섹션 */}
        <View style={styles.landlordSection}>
          <View style={styles.landlordHeader}>
            <Text style={styles.sectionTitle}>집주인 정보</Text>
            <View style={styles.landlordVerificationBadge}>
              <Text style={styles.landlordVerificationText}>집주인 인증</Text>
            </View>
          </View>
          <View style={styles.landlordProfile}>
            <View style={styles.landlordAvatar}>
              <Ionicons name="person" size={28} color="#999" />
            </View>
            <View style={styles.landlordDetails}>
              <Text style={styles.landlordName}>{room?.landlord_name || '정보 없음'}</Text>
              <Text style={styles.landlordPhone}>{room?.landlord_phone || '연락처 비공개'}</Text>
              <Text style={styles.landlordSubtext}>실제 집주인과 연결됩니다.</Text>
              <TouchableOpacity style={styles.landlordCallButton}>
                <Text style={styles.landlordCallText}>소유자 매물 · 등기부 소유자</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 계약서 확인하기 섹션 */}
        <View style={styles.contractSection}>
          <Text style={styles.sectionTitle}>이 매물 계약서 확인하기</Text>
          <View style={styles.contractPreview}>
            <Image
              source={{ uri: 'https://via.placeholder.com/300x400/f0f0f0/666?text=부동산임대차계약서' }}
              style={styles.contractImage}
              resizeMode="contain"
            />
            <TouchableOpacity style={styles.contractViewButton} onPress={handleViewContract}>
              <Text style={styles.contractViewText}>계약서 검증하기</Text>
              <Ionicons name="chevron-forward" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 찜한 사람들 */}
        <TouchableOpacity style={styles.favoritedUsersSection} onPress={handleViewFavoritedUsers}>
          <View style={styles.favoritedUsersHeader}>
            <Ionicons name="heart" size={20} color="#FF6600" />
            <Text style={styles.favoritedUsersTitle}>{room?.favorite_count || 0}명이 찜했어요</Text>
          </View>
          <View style={styles.favoritedUsersSubtitle}>
            <Text style={styles.favoritedUsersSubtext}>궁합 점수 순으로 보기</Text>
            <Ionicons name="chevron-forward" size={16} color="#666" />
          </View>
        </TouchableOpacity>

        {/* 하단 여백 */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* 하단 고정 버튼 */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity style={styles.bottomButton} onPress={handleContactOwner}>
          <Text style={styles.bottomButtonText}>룸메이트 구하기</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomCallButton}>
          <Text style={styles.bottomCallButtonText}>전화문의</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    height: 300,
    position: 'relative',
  },
  mainImage: {
    width: width,
    height: 300,
  },
  header: {
    position: 'absolute',
    top: 44,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRightButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  imageCounter: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  imageCountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  basicInfoSection: {
    padding: 20,
    borderBottomWidth: 8,
    borderBottomColor: '#f5f5f5',
  },
  propertyHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginBottom: 22,
    gap: 12,
  },
  propertyId: {
    fontSize: 12,
    color: '#999',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: '#f5f5f5',
    borderColor: '#eee',
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFE5D9',
    gap: 4,
  },
  verificationText: {
    fontSize: 11,
    color: '#FF6600',
    fontWeight: '600',
    fontWeight: '600',
  },
  price: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
    marginBottom: 20,
  },
  basicDetails: {
    gap: 16,
  },
  detailRowContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailIcon: {
    marginRight: 8,
    width: 20,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    flex: 1,
  },
  basicInfoTable: {
    padding: 20,
    borderBottomWidth: 8,
    borderBottomColor: '#f5f5f5',
  },
  detailInfoTable: {
    padding: 20,
    borderBottomWidth: 8,
    borderBottomColor: '#f5f5f5',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  infoTable: {
    backgroundColor: '#fff',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tableLabel: {
    fontSize: 14,
    color: '#666',
    width: 100,
    marginRight: 20,
  },
  tableValue: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    fontWeight: '500',
  },
  landlordSection: {
    padding: 20,
    borderBottomWidth: 8,
    borderBottomColor: '#f5f5f5',
  },
  landlordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  landlordVerificationBadge: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  landlordVerificationText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  landlordProfile: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  landlordAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  landlordDetails: {
    flex: 1,
  },
  landlordName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  landlordPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  landlordSubtext: {
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  landlordCallButton: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  landlordCallText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '500',
  },
  contractSection: {
    padding: 20,
    borderBottomWidth: 8,
    borderBottomColor: '#f5f5f5',
  },
  contractPreview: {
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  contractImage: {
    width: 200,
    height: 280,
    borderRadius: 8,
    marginBottom: 16,
    backgroundColor: '#f8f9fa',
  },
  contractViewButton: {
    backgroundColor: '#666',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contractViewText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  favoritedUsersSection: {
    padding: 20,
    borderBottomWidth: 8,
    borderBottomColor: '#f5f5f5',
  },
  favoritedUsersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  favoritedUsersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  favoritedUsersSubtitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  favoritedUsersSubtext: {
    fontSize: 14,
    color: '#666',
  },
  bottomSpacing: {
    height: 100,
  },
  bottomButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    flexDirection: 'row',
    gap: 12,
  },
  bottomButton: {
    flex: 1,
    backgroundColor: '#13AE86',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  bottomButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomCallButton: {
    flex: 1,
    backgroundColor: '#000000',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  bottomCallButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
