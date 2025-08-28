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
import { useNavigation, useRoute } from '@react-navigation/native';
import ApiService from '../services/api';
import UserProfileIcon from '../components/UserProfileIcon';
import SpeechBubble from '../components/SpeechBubble';
import UserMatchCard from '../components/UserMatchCard';
import { formatRentPrice } from '../utils/priceFormatter';
import { getRoomType, formatArea, formatFloor } from '../utils/priceUtils';

const { width } = Dimensions.get('window');

export default function FavoritedUsersScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { roomId } = route?.params || {};
  const [room, setRoom] = useState(null);
  const [users, setUsers] = useState([]);
  const [recommendUsers, setRecommendUsers] = useState([]);
  const [selectedFilter, setSelectedFilter] = useState('전체');
  const [loading, setLoading] = useState(true);
  const [suggestModalVisible, setSuggestModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [suggestionMessage, setSuggestionMessage] = useState('');
  const [showMatchScores, setShowMatchScores] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);

  useEffect(() => {
    loadData();
    loadCurrentUserProfile();
  }, [roomId]);
  
  // 나이대 계산 함수 (ProfileScreen과 동일)
  const getAgeGroup = (age) => {
    if (!age) return '';
    if (age >= 19 && age <= 23) return '20대 초반';
    if (age >= 24 && age <= 27) return '20대 중반';
    if (age >= 28 && age <= 30) return '20대 후반';
    if (age >= 31 && age <= 35) return '30대 초반';
    if (age >= 36 && age <= 39) return '30대 후반';
    return `${Math.floor(age / 10)}0대`;
  };
  
  // 성별 변환 함수 (ProfileScreen과 동일)
  const getGenderText = (gender) => {
    if (gender === 'male' || gender === 'M' || gender === 'm') return '남성';
    if (gender === 'female' || gender === 'F' || gender === 'f') return '여성';
    return '';
  };

  // 학교 이메일에서 학교명 추출 함수 (ProfileScreen과 동일)
  const getSchoolNameFromEmail = (schoolEmail) => {
    if (!schoolEmail) return '';
    
    const domain = schoolEmail.split('@')[1];
    if (!domain) return '';
    
    const schoolPatterns = {
      'snu.ac.kr': '서울대학교',
      'korea.ac.kr': '고려대학교', 
      'yonsei.ac.kr': '연세대학교',
      'kaist.ac.kr': '카이스트',
      'postech.ac.kr': '포스텍',
      'seoul.ac.kr': '서울시립대학교',
      'hanyang.ac.kr': '한양대학교',
      'cau.ac.kr': '중앙대학교',
      'konkuk.ac.kr': '건국대학교',
      'dankook.ac.kr': '단국대학교',
    };
    
    if (schoolPatterns[domain]) {
      return schoolPatterns[domain];
    }
    
    let schoolName = domain
      .replace('.ac.kr', '')
      .replace('.edu', '')
      .replace('university', '')
      .replace('univ', '')
      .replace('.', '');
    
    if (schoolName && schoolName.length > 0) {
      return schoolName.charAt(0).toUpperCase() + schoolName.slice(1) + '대학교';
    }
    
    return '';
  };
  
  // 현재 사용자 프로필 로드
  const loadCurrentUserProfile = async () => {
    try {
      const profile = await ApiService.getUserProfile();
      setCurrentUserProfile(profile);
    } catch (error) {
      console.error('현재 사용자 프로필 로드 실패:', error);
    }
  };
  
  // 개별 사용자 정보 포맷팅
  const formatUserInfo = (user) => {
    if (!user) return '정보 없음';
    
    const parts = [];
    
    const ageGroup = getAgeGroup(user.age);
    if (ageGroup) parts.push(ageGroup);
    
    const genderText = getGenderText(user.gender);
    if (genderText) parts.push(genderText);
    
    const schoolName = getSchoolNameFromEmail(user.school_email);
    if (schoolName) parts.push(schoolName);
    
    return parts.length > 0 ? parts.join(', ') : '정보 없음';
  };

  // 사용자 태그 생성 함수 - 수면 패턴과 흡연 여부만
  const generateUserTags = (user) => {
    if (!user) return ['정보 없음'];
    
    const tags = [];
    const userId = user.user_id;
    
    // 사용자 ID를 기반으로 태그 조합 생성
    const tagOptions = {
      sleep: ['올빼미', '종달새'],
      smoking: ['흡연', '비흡연']
    };
    
    // 사용자 ID 기반 시드를 이용한 태그 선택
    const seed = parseInt(userId) || 1;
    
    // 수면 패턴 (50% 확률로 올빼미/종달새)
    const sleepIndex = seed % 2;
    tags.push(tagOptions.sleep[sleepIndex]);
    
    // 흡연 여부 (80% 확률로 비흡연)
    const smokingIndex = (seed * 3) % 10 < 8 ? 1 : 0;
    tags.push(tagOptions.smoking[smokingIndex]);
    
    return tags;
  };

  const loadData = async () => {
    try {
      setLoading(true);
      // 방 정보 로드
      const roomData = await ApiService.getRoomDetail(roomId);
      setRoom(roomData);

      // 찜한 사용자들 로드 (궁합 점수 포함)
      const favoritedUsers = await ApiService.getRoomMatches(roomId);
      setUsers(favoritedUsers || []);

      // 추천 사용자들 로드 (실제 매칭 데이터)
      const matchingUsers = await ApiService.getMatches();

      // 이미 이 매물을 찜한 사용자들 제외
      const favoritedUserIds = (favoritedUsers || []).map(user => user.user_id?.toString());
      const filteredRecommendUsers = (matchingUsers || []).filter(user =>
        !favoritedUserIds.includes(user.user_id?.toString())
      );

      setRecommendUsers(filteredRecommendUsers);
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

  // 주소를 기반으로 가장 가까운 역과 거리 계산
  const getNearestStation = (address) => {
    if (!address) return '역 정보 없음';

    // 서울 주요 역 리스트 (간단한 매칭용)
    const stations = {
      '성북': '안암역 10분',
      '안암': '안암역 5분',
      '보문': '보문역 8분',
      '종로': '종각역 12분',
      '중구': '을지로입구역 10분',
      '강남': '강남역 7분',
      '서초': '강남역 15분',
      '송파': '잠실역 10분',
      '강동': '천호역 8분',
      '마포': '홍대입구역 12분',
      '서대문': '신촌역 10분',
      '은평': '연신내역 15분',
      '용산': '용산역 8분',
      '영등포': '영등포구청역 10분',
      '구로': '구로역 8분',
      '관악': '신림역 12분',
      '동작': '사당역 10분',
      '성동': '왕십리역 8분',
      '광진': '건대입구역 10분',
      '동대문': '동대문역 7분',
      '중랑': '상봉역 12분',
      '노원': '노원역 8분',
      '도봉': '도봉산역 10분',
      '강북': '미아역 12분'
    };

    // 주소에서 구 이름 추출
    for (const [district, station] of Object.entries(stations)) {
      if (address.includes(district)) {
        return station + ' 거리';
      }
    }

    return '안암역 10분 거리'; // 기본값
  };

  // 관리비를 만원 단위로 반올림하여 포맷팅
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

  const filters = ['전체', '궁합 점수 높은 순', '고려대학교', '투룸 희망', '아파트 희망', '오피스텔 희망', '빌라 희망'];

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
      case '아파트 희망':
        filtered = filtered.filter(user => user.preferred_building_type === '아파트' || user.building_preference === '아파트');
        break;
      case '오피스텔 희망':
        filtered = filtered.filter(user => user.preferred_building_type === '오피스텔' || user.building_preference === '오피스텔');
        break;
      case '빌라 희망':
        filtered = filtered.filter(user => user.preferred_building_type === '빌라' || user.building_preference === '빌라');
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
          text={user.bio || "깨끗한 집 약속드려요"}
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
          {formatUserInfo(user)}
        </Text>

        <View style={styles.userTags}>
          {generateUserTags(user).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
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
    // 안전성 검증
    if (!user) {
      console.error('handleUserPress: user 객체가 null입니다');
      return;
    }
    
    if (!user.user_id) {
      console.error('handleUserPress: user.user_id가 없습니다', user);
      return;
    }
    
    const userId = user.user_id.toString();
    console.log('UserProfile 네비게이션:', { userId, roomId });
    
    try {
      navigation.navigate('UserProfile', { 
        userId: userId,
        roomId: roomId 
      });
    } catch (error) {
      console.error('UserProfile 네비게이션 실패:', error);
    }
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
        {/* 방 정보 - 고정 */}
        <View style={styles.roomInfo}>
          <Image
            source={{ uri: getRoomImage(roomId) }}
            style={styles.roomImage}
            defaultSource={{ uri: 'https://via.placeholder.com/100x100/f0f0f0/666?text=매물' }}
          />
          <View style={styles.roomDetails}>
            <Text style={styles.roomPrice}>{formatPrice()}</Text>
            <Text style={styles.roomInfo1}>{getRoomType(room?.area, room?.rooms)} | {formatArea(room?.area)} | {formatFloor(room?.floor)}</Text>
            <Text style={styles.roomAddress}>관리비 {formatMaintenanceCost(room?.area)}원 | {getNearestStation(room?.address)}</Text>
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

        {/* 스크롤 가능한 콘텐츠 영역 */}
        <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* 찜한 유저 수 */}
          <View style={styles.favoritedSection}>
            <View style={styles.favoritedLeft}>
              <Text style={styles.favoritedText}>이 매물을 찜한 유저 {users.length}명</Text>
              <View style={styles.heartIcon}>
                <Ionicons name="heart" size={16} color="#FC6339" />
              </View>
            </View>
            <View style={styles.favoritedRight}>
              <TouchableOpacity
                style={[styles.matchScoreToggle, showMatchScores && styles.matchScoreToggleActive]}
                onPress={() => setShowMatchScores(!showMatchScores)}
              >
                <Text style={[styles.matchScoreToggleText, showMatchScores && styles.matchScoreToggleTextActive]}>
                  궁합 점수 확인하기
                </Text>
              </TouchableOpacity>
            </View>
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

          {/* 사용자 카드 리스트 */}
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
            <Text style={styles.recommendTitle}>내 맞춤 유저에게 추천하기</Text>
          </View>

          {/* 추천 사용자 리스트 */}
          {recommendUsers.map((user, index) => (
            <UserMatchCard
              key={user.user_id || index}
              user={user}
              index={index}
              onPress={handleUserPress}
            />
          ))}
        </ScrollView>
      </View>

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
                    {getRoomType(room?.area, room?.rooms)} | {formatArea(room?.area)} | {formatFloor(room?.floor)}
                  </Text>
                  <Text style={styles.modalRoomAddress}>
                    관리비 {formatMaintenanceCost(room?.area)}원 | {getNearestStation(room?.address)}
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
                setSuggestModalVisible(false);
                setSuggestionMessage('');
              }}
            >
              <Text style={styles.modalSuggestButtonText}>룸메 제안하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  scrollContent: {
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
  recommendSection: {
    paddingTop: 20,
    paddingBottom: 5,
    paddingHorizontal: 13,
  },
  recommendTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 14,
    marginTop: 10,
  },
  recommendScrollView: {
    flex: 1,
    paddingHorizontal: 13,
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
  favoritedSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  favoritedLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  favoritedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  favoritedRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  matchScoreToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FC6339',
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
  heartIcon: {
    width: 21,
    height: 21,
    borderRadius: 10.5,
    backgroundColor: 'white',
    borderWidth: 0.5,
    borderColor: '#D9D9D9',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
