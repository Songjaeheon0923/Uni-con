import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  FlatList,
  Dimensions,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';
import UserProfileIcon from '../components/UserProfileIcon';
import SpeechBubble from '../components/SpeechBubble';
import { formatRentPrice } from '../utils/priceFormatter';

const { width } = Dimensions.get('window');

export default function FavoritedUsersScreen({ route, navigation }) {
  const { roomId } = route.params || {};
  const [room, setRoom] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('전체');
  const [loading, setLoading] = useState(true);
  const [suggestModalVisible, setSuggestModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [suggestionMessage, setSuggestionMessage] = useState('');
  const [showMatchScores, setShowMatchScores] = useState(false);

  useEffect(() => {
    loadData();
  }, [roomId]);

  const loadData = async () => {
    try {
      setLoading(true);
      // 방 정보 로드
      const roomData = await ApiService.getRoomDetail(roomId);
      setRoom(roomData);

      // 찜한 사용자들 로드 (궁합 점수 포함)
      const favoritedUsers = await ApiService.getRoomMatches(roomId);
      setUsers(favoritedUsers || []);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = () => {
    if (!room) return '';
    return formatRentPrice(room.price_deposit, room.price_monthly);
  };

  const filters = ['전체', '궁합 점수 높은 순', '고려대학교', '투룸 희망'];

  const filteredAndSortedUsers = React.useMemo(() => {
    let filtered = [...users];

    switch (selectedFilter) {
      case '궁합 점수 높은 순':
        filtered = filtered.sort((a, b) => (b.matching_score || 0) - (a.matching_score || 0));
        break;
      case '고려대학교':
        filtered = filtered.filter(user => user.school === '고려대학교');
        break;
      case '투룸 희망':
        filtered = filtered.filter(user => user.roomType === '투룸');
        break;
      default:
        // 전체는 기본 순서 유지
        break;
    }

    return filtered;
  }, [users, selectedFilter]);

  const getMatchScoreLabel = (score) => {
    if (score >= 80) return '좋음';
    if (score >= 60) return '보통';
    return '낮음';
  };

  const UserCard = ({ user, onPress }) => (
    <TouchableOpacity style={styles.userCard} onPress={onPress}>
      <View style={styles.userCardContent}>
        {/* 말풍선 */}
        <SpeechBubble
          text="깨끗한 집 약속드려요"
          style={styles.speechBubbleContainer}
        />

        <View style={styles.userAvatarContainer}>
          <View style={styles.userAvatar}>
            {user.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={styles.avatarImage} />
            ) : (
              <UserProfileIcon size={33} color="#595959" />
            )}
          </View>

          {/* 궁합 점수 오버레이 */}
          {showMatchScores && (
            <View style={styles.matchScoreOverlay}>
              <Text style={styles.matchScoreOverlayText}>{user.matching_score || 0}%</Text>
              <Text style={styles.matchScoreLabel}>{getMatchScoreLabel(user.matching_score || 0)}</Text>
            </View>
          )}
        </View>

        <Text style={styles.userName}>{user.nickname}</Text>

        <Text style={styles.userInfo}>
          {user.age}세, {user.gender}, {user.occupation}
        </Text>

        <View style={styles.userTags}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>청결함</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>야행형</Text>
          </View>
          <View style={styles.tag}>
            <Text style={styles.tagText}>비흡연</Text>
          </View>
        </View>

        {/* <TouchableOpacity
          style={styles.chatButton}
          onPress={() => {
            setSelectedUser(user);
            setSuggestModalVisible(true);
          }}
        >
          <Text style={styles.chatButtonText}>채팅 신청하기</Text>
        </TouchableOpacity> */}
      </View>
    </TouchableOpacity>
  );

  const handleUserPress = (user) => {
    navigation.navigate('UserProfile', { userId: user.user_id, roomId });
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

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>룸메이트 구하기</Text>
        <TouchableOpacity>
          <Ionicons name="search" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <View style={styles.container}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 방 정보 */}
        <View style={styles.roomInfo}>
          <Image
            source={{ uri: 'https://via.placeholder.com/100x100/f0f0f0/666?text=매물' }}
            style={styles.roomImage}
          />
          <View style={styles.roomDetails}>
            <Text style={styles.roomPrice}>{formatPrice()}</Text>
            <Text style={styles.roomInfo1}>{room?.property_type} | {room?.square_meter}평 | {room?.floor}층</Text>
            <Text style={styles.roomAddress}>관리비 {room?.price_manage}만원 | {room?.location}</Text>
            <View style={styles.verificationBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#FF6600" />
              <Text style={styles.verificationText}>집주인 인증</Text>
            </View>
          </View>
          <View style={styles.favoriteCountBadge}>
            <Ionicons name="heart" size={16} color="#FF6600" />
            <Text style={styles.favoriteCount}>{users.length}</Text>
          </View>
        </View>

        {/* 찜한 유저 수 */}
        <View style={styles.favoritedSection}>
          <View style={styles.favoritedLeft}>
            <Ionicons name="heart" size={16} color="#FF6600" />
            <Text style={styles.favoritedText}>이 매물을 찜한 유저 {users.length}명</Text>
          </View>
          <TouchableOpacity
            style={[styles.matchScoreToggle, showMatchScores && styles.matchScoreToggleActive]}
            onPress={() => setShowMatchScores(!showMatchScores)}
          >
            <Text style={[styles.matchScoreToggleText, showMatchScores && styles.matchScoreToggleTextActive]}>
              궁합 점수 확인하기
            </Text>
          </TouchableOpacity>
        </View>

        {/* 필터 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
        >
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterButton,
                selectedFilter === filter && styles.filterButtonActive,
              ]}
              onPress={() => setSelectedFilter(filter)}
            >
              <Text style={[
                styles.filterText,
                selectedFilter === filter && styles.filterTextActive,
              ]}>
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 사용자 카드 리스트 - 가로 스크롤 */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filteredAndSortedUsers}
          renderItem={({ item }) => (
            <UserCard user={item} onPress={() => handleUserPress(item)} />
          )}
          keyExtractor={(item, index) => item.user_id ? item.user_id.toString() : index.toString()}
          contentContainerStyle={styles.usersList}
        />

        {/* 다른 유저에게 매물 추천하기 섹션 */}
        <View style={styles.recommendSection}>
          <Text style={styles.recommendTitle}>다른 유저에게 매물 추천하기</Text>

          {/* <View style={styles.filterRow}>
            <TouchableOpacity style={styles.filterPill}>
              <Text style={styles.filterPillText}>최근 채팅순</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterPillOutline}>
              <Text style={styles.filterPillTextOutline}>안암 거주 희망</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterPillOutline}>
              <Text style={styles.filterPillTextOutline}>20대 초반</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterPillOutline}>
              <Text style={styles.filterPillTextOutline}>투룸 희망</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="chevron-down" size={20} color="#666" />
            </TouchableOpacity>
          </View> */}

          {/* 추천 사용자 리스트 */}
          {users.map((user, index) => (
            <TouchableOpacity
              key={index}
              style={styles.recommendUserCard}
              onPress={() => handleUserPress(user)}
            >
              <View style={styles.recommendUserAvatar}>
                <Ionicons name="person" size={28} color="#999" />
              </View>
              <View style={styles.recommendUserInfo}>
                <View style={styles.recommendUserHeader}>
                  <Text style={styles.recommendUserName}>{user.nickname}</Text>
                  <View style={styles.recommendUserTags}>
                    {(user.tags || []).slice(0, 3).map((tag, idx) => (
                      <View key={idx} style={styles.smallTag}>
                        <Text style={styles.smallTagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <Text style={styles.recommendUserDetails}>
                  {user.age}세, {user.gender}, {user.occupation}
                  <Ionicons name="checkmark-circle" size={14} color="#FF6600" />
                </Text>
                {user.bio && <Text style={styles.recommendUserBio}>{user.bio}</Text>}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* 이 매물로 룸메 제안하기 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={suggestModalVisible}
        onRequestClose={() => setSuggestModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* 모달 헤더 */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setSuggestModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>이 매물로 룸메 제안하기</Text>
              <View style={{ width: 24 }} />
            </View>

            {/* 매물 정보 */}
            {room && (
              <View style={styles.modalRoomInfo}>
                <Image
                  source={{ uri: 'https://via.placeholder.com/80x80/f0f0f0/666?text=매물' }}
                  style={styles.modalRoomImage}
                />
                <View style={styles.modalRoomDetails}>
                  <Text style={styles.modalRoomPrice}>
                    월세 {room.price_deposit}만원 / {room.price_monthly}만원
                  </Text>
                  <Text style={styles.modalRoomInfo1}>
                    {room?.property_type} | {room?.square_meter}평 | {room?.floor}층
                  </Text>
                  <Text style={styles.modalRoomAddress}>
                    관리비 {room?.price_manage}만원 | {room?.location}
                  </Text>
                  <View style={styles.modalVerificationBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#FF6600" />
                    <Text style={styles.modalVerificationText}>집주인 인증</Text>
                  </View>
                </View>
              </View>
            )}

            {/* 사용자 정보 */}
            {selectedUser && (
              <View style={styles.modalUserInfo}>
                <View style={styles.modalUserAvatar}>
                  {selectedUser.profileImage ? (
                    <Image source={{ uri: selectedUser.profileImage }} style={styles.modalAvatarImage} />
                  ) : (
                    <Ionicons name="person" size={40} color="#999" />
                  )}
                </View>
                <View style={styles.modalUserDetails}>
                  <Text style={styles.modalUserName}>{selectedUser.nickname}</Text>
                  <View style={styles.modalUserTags}>
                    {(selectedUser.tags || []).slice(0, 3).map((tag, index) => (
                      <View key={index} style={styles.modalTag}>
                        <Text style={styles.modalTagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                  {selectedUser.bio && <Text style={styles.modalUserBio}>{selectedUser.bio}</Text>}
                </View>
              </View>
            )}

            {/* 한 줄 소개 입력 */}
            <View style={styles.modalInputSection}>
              <TextInput
                style={styles.modalTextInput}
                placeholder="룸메 신청 시 전달할 한 줄 소개를 적어주세요."
                placeholderTextColor="#999"
                value={suggestionMessage}
                onChangeText={setSuggestionMessage}
                multiline
                maxLength={100}
              />
            </View>

            {/* 룸메 제안하기 버튼 */}
            <TouchableOpacity
              style={styles.modalSuggestButton}
              onPress={() => {
                // 제안 로직 구현
                console.log('룸메 제안:', suggestionMessage);
                setSuggestModalVisible(false);
                setSuggestionMessage('');
              }}
            >
              <Text style={styles.modalSuggestButtonText}>룸메 제안하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  roomInfo: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  roomImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  roomDetails: {
    flex: 1,
    marginLeft: 16,
  },
  roomPrice: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  roomInfo1: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  roomAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
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
    alignSelf: 'flex-start',
    gap: 4,
  },
  verificationText: {
    fontSize: 11,
    color: '#FF6600',
    fontWeight: '600',
  },
  favoriteCountBadge: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  favoriteCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6600',
  },
  favoritedSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    paddingBottom: 7,
  },
  favoritedLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  favoritedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  filterContainer: {
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  filterButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#666',
  },
  filterText: {
    fontSize: 12,
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
  },
  usersList: {
    paddingHorizontal: 13,
  },
  speechBubbleContainer: {
    width: 120,
    height: 40,
    marginBottom: 8,
  },
  speechBubble: {
    backgroundColor: '#10B585',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginBottom: 8,
    position: 'relative',
  },
  speechBubbleText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  userAvatarContainer: {
    position: 'relative',
    marginBottom: 12,
    marginTop: 6,
  },
  userCard: {
    width: width * 0.45,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  userCardContent: {
    alignItems: 'center',
  },
  userAvatar: {
    width: 53,
    height: 53,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchScoreOverlay: {
    position: 'absolute',
    top: -7,
    left: -7,
    right: -7,
    bottom: -7,
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    borderRadius: 45,
    borderWidth: 0.699,
    borderColor: '#10B585',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchScoreOverlayText: {
    color: '#10B585',
    fontSize: 22.369,
    fontWeight: 'bold',
  },
  matchScoreLabel: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '500',
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  userTags: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 8,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
  },
  userInfo: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  userBio: {
    fontSize: 13,
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  matchScoreContainer: {
    backgroundColor: '#FF6600',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  matchScore: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  chatButton: {
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    alignSelf: 'stretch',
  },
  chatButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  matchScoreToggle: {
    backgroundColor: '#FF6600',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  matchScoreToggleActive: {
    backgroundColor: '#f5f5f5',
  },
  matchScoreToggleText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '500',
  },
  matchScoreToggleTextActive: {
    color: '#666',
    fontWeight: '600',
  },
  recommendSection: {
    paddingVertical: 40,
    paddingHorizontal: 13,
  },
  recommendTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  filterPill: {
    backgroundColor: '#666',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterPillText: {
    color: '#fff',
    fontSize: 14,
  },
  filterPillOutline: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterPillTextOutline: {
    color: '#666',
    fontSize: 14,
  },
  recommendUserCard: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recommendUserAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recommendUserInfo: {
    flex: 1,
  },
  recommendUserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  recommendUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  recommendUserTags: {
    flexDirection: 'row',
    gap: 4,
  },
  smallTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  smallTagText: {
    fontSize: 11,
    color: '#666',
  },
  recommendUserDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  recommendUserBio: {
    fontSize: 14,
    color: '#333',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '100%',
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalRoomInfo: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalRoomImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  modalRoomDetails: {
    flex: 1,
    marginLeft: 12,
  },
  modalRoomPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  modalRoomInfo1: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  modalRoomAddress: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  modalVerificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    gap: 2,
  },
  modalVerificationText: {
    fontSize: 10,
    color: '#FF6600',
    fontWeight: '600',
  },
  modalUserInfo: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalUserAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAvatarImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  modalUserDetails: {
    flex: 1,
    marginLeft: 12,
  },
  modalUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  modalUserTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 6,
  },
  modalTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  modalTagText: {
    fontSize: 11,
    color: '#666',
  },
  modalUserBio: {
    fontSize: 13,
    color: '#333',
  },
  modalInputSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTextInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 16,
    fontSize: 14,
    color: '#333',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalSuggestButton: {
    backgroundColor: '#666',
    paddingVertical: 16,
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  modalSuggestButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
