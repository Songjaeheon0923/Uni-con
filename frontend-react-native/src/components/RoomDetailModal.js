import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Animated,
  Dimensions,
  Alert,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const { height: screenHeight } = Dimensions.get('window');

export default function RoomDetailModal({ visible, room, onClose, user, onNavigateToChat }) {
  const [slideAnim] = useState(new Animated.Value(screenHeight * 0.75));
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteUsers, setFavoriteUsers] = useState([]);
  const [showFavoriteUsers, setShowFavoriteUsers] = useState(false);

  useEffect(() => {
    if (visible && room) {
      console.log('🏠 Modal room data:', room); // 디버그용
      
      // 모달 슬라이드 업 애니메이션 
      Animated.timing(slideAnim, {
        toValue: 0, // 최종 위치로 슬라이드 업
        duration: 300,
        useNativeDriver: true,
      }).start();
      
      loadRoomData();
    } else {
      // 모달 슬라이드 다운 애니메이션
      Animated.timing(slideAnim, {
        toValue: screenHeight * 0.75, // 아래로 숨김
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, room]);

  const loadRoomData = async () => {
    if (!room || !user) return;

    try {
      // 찜 상태는 일단 false로 설정 (세션 인증 문제로 임시)
      setIsFavorited(false);

      // 이 방을 찜한 사용자들 조회 (궁합점수 기반 정렬)
      const favoriteUsersData = await ApiService.getMatchedRoommates(room.room_id);
      setFavoriteUsers(favoriteUsersData);
    } catch (error) {
      console.error('방 데이터 로드 실패:', error);
      // 에러 시 빈 배열로 설정
      setFavoriteUsers([]);
    }
  };

  const toggleFavorite = async () => {
    if (!user || !room) return;

    // 임시로 로컬 상태만 변경 (세션 인증 문제로)
    if (isFavorited) {
      setIsFavorited(false);
      setFavoriteUsers(favoriteUsers.filter(u => u.user_id !== String(user.id)));
    } else {
      setIsFavorited(true);
      const newUser = { 
        user_id: String(user.id), 
        nickname: user.name || "김대학생",
        age: 22,
        gender: "Unknown",
        occupation: "대학생"
      };
      setFavoriteUsers([...favoriteUsers, newUser]);
    }
  };

  const handleBackdropPress = () => {
    onClose();
  };

  const renderFavoriteUser = ({ item }) => (
    <View style={styles.favoriteUserCard}>
      <View style={styles.userInfo}>
        <View style={styles.userAvatar}>
          <Ionicons name="person" size={24} color="#666" />
        </View>
        <View style={styles.userNameContainer}>
          <Text style={styles.userName}>{item.name || item.nickname}</Text>
          <Text style={styles.userDetail}>
            {item.age ? `${item.age}세` : ''} {item.occupation || '대학생'}
          </Text>
          {/* 궁합점수 표시 */}
          <View style={styles.compatibilityScoreContainer}>
            <Ionicons name="heart" size={12} color="#FF6600" />
            <Text style={styles.compatibilityScore}>궁합 {item.matching_score || 0}점</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.chatButton}
        onPress={() => onNavigateToChat(item)}
      >
        <Ionicons name="chatbubble" size={20} color="#FF6600" />
      </TouchableOpacity>
    </View>
  );

  if (!visible || !room) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.backdrop}
        activeOpacity={1}
        onPress={handleBackdropPress}
      >
        <Animated.View style={[styles.modalContainer, { transform: [{ translateY: slideAnim }] }]}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            {/* 드래그 핸들 */}
            <View style={styles.dragHandle} />
            
            {/* 헤더 */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>매물 정보</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* 매물 기본 정보 */}
              <View style={styles.roomInfo}>
                <View style={styles.roomImagePlaceholder}>
                  <Ionicons name="home" size={50} color="#ccc" />
                </View>
                
                <View style={styles.roomDetails}>
                  <Text style={styles.roomType}>
                    {room?.rooms === 1 ? '원룸' : room?.rooms === 2 ? '투룸' : '다가구'}
                  </Text>
                  <Text style={styles.roomAddress}>{room?.address || '주소 정보 없음'}</Text>
                  <View style={styles.priceContainer}>
                    <Text style={styles.transactionType}>{room?.transaction_type || ''}</Text>
                    <Text style={styles.price}>
                      {room?.price_deposit || 0}만원
                      {room?.price_monthly > 0 && ` / ${room.price_monthly}만원`}
                    </Text>
                  </View>
                  <Text style={styles.roomArea}>{room?.area || 0}㎡</Text>
                  <Text style={styles.riskScore}>위험도: {room?.risk_score || 0}/10</Text>
                </View>
              </View>

              {/* 찜하기 & 찜한 사람들 */}
              <View style={styles.favoriteSection}>
                <TouchableOpacity style={styles.favoriteButton} onPress={toggleFavorite}>
                  <Ionicons 
                    name={isFavorited ? "heart" : "heart-outline"} 
                    size={24} 
                    color={isFavorited ? "#ff4757" : "#666"} 
                  />
                  <Text style={styles.favoriteButtonText}>
                    찜하기 ({favoriteUsers.length})
                  </Text>
                </TouchableOpacity>
                
                {favoriteUsers.length > 0 && (
                  <TouchableOpacity 
                    style={styles.showFavoritesButton}
                    onPress={() => setShowFavoriteUsers(!showFavoriteUsers)}
                  >
                    <Text style={styles.showFavoritesText}>
                      찜한 사람들 {showFavoriteUsers ? '숨기기' : '보기'}
                    </Text>
                    <Ionicons 
                      name={showFavoriteUsers ? "chevron-up" : "chevron-down"} 
                      size={16} 
                      color="#FF6600" 
                    />
                  </TouchableOpacity>
                )}
              </View>

              {/* 찜한 사람들 목록 */}
              {showFavoriteUsers && favoriteUsers.length > 0 && (
                <View style={styles.favoriteUsersList}>
                  <Text style={styles.sectionTitle}>이 방을 찜한 사람들</Text>
                  <FlatList
                    data={favoriteUsers}
                    renderItem={renderFavoriteUser}
                    keyExtractor={(item) => item.user_id}
                    scrollEnabled={false}
                    showsVerticalScrollIndicator={false}
                  />
                </View>
              )}

              {/* 추가 정보 */}
              <View style={styles.additionalInfo}>
                <Text style={styles.sectionTitle}>상세 정보</Text>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>방 개수:</Text>
                  <Text style={styles.infoValue}>{room?.rooms || 1}개</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>화장실:</Text>
                  <Text style={styles.infoValue}>{room?.bathrooms || 1}개</Text>
                </View>
                {room?.floor_info && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>층수:</Text>
                    <Text style={styles.infoValue}>{room.floor_info}</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: screenHeight * 0.75,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  roomInfo: {
    flexDirection: 'row',
    paddingVertical: 20,
  },
  roomImagePlaceholder: {
    width: 100,
    height: 100,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  roomDetails: {
    flex: 1,
  },
  roomType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  roomAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  transactionType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6600',
    marginRight: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  roomArea: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  riskScore: {
    fontSize: 14,
    color: '#666',
  },
  favoriteSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  favoriteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 20,
  },
  favoriteButtonText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
    fontWeight: '500',
  },
  showFavoritesButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  showFavoritesText: {
    fontSize: 14,
    color: '#FF6600',
    marginRight: 4,
  },
  favoriteUsersList: {
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  favoriteUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    marginBottom: 8,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userNameContainer: {
    flex: 1,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  userDetail: {
    fontSize: 12,
    color: '#666',
  },
  compatibilityScoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  compatibilityScore: {
    fontSize: 12,
    color: '#FF6600',
    fontWeight: '600',
    marginLeft: 4,
  },
  chatButton: {
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FF6600',
  },
  additionalInfo: {
    paddingVertical: 16,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
});