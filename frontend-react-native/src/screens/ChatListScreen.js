import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  RefreshControl,
  Animated,
  PanResponder,
  Dimensions,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';
import ApiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';


const FILTER_OPTIONS = [
  { id: 'all', title: '전체', isSelected: true },
  { id: 'request', title: '채팅신청', isSelected: false },
  { id: 'room', title: '매물추천', isSelected: false },
  { id: 'roommate', title: '룸메제안', isSelected: false },
  { id: 'landlord', title: '집주인포함', isSelected: false },
];

const { width: screenWidth } = Dimensions.get('window');

// 스와이프 가능한 채팅 아이템 컴포넌트
const SwipeableChatItem = ({ item, navigation, onDelete, user, setIsAnyItemSwiping, updateUnreadCount }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const [isSwipeOpen, setIsSwipeOpen] = useState(false);
  const SWIPE_THRESHOLD = 80; // 스와이프 임계값
  const DELETE_BUTTON_WIDTH = 80; // 삭제 버튼 넓이

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dy) < 50;
    },
    onPanResponderGrant: () => {
      // 스와이프 시작 - FlatList 스크롤 비활성화
      setIsAnyItemSwiping(true);
    },
    onPanResponderTerminationRequest: () => false, // 다른 컴포넌트가 제스처를 가져가지 못하게 방지
    onShouldBlockNativeResponder: () => true, // 네이티브 스크롤 등을 차단
    onPanResponderMove: (evt, gestureState) => {
      // 왼쪽으로 스와이프할 때만 (음수 dx)
      if (gestureState.dx < 0) {
        // 스와이프 범위 제한 (-DELETE_BUTTON_WIDTH 이상으로 가지 않게)
        const newTranslateX = Math.max(gestureState.dx, -DELETE_BUTTON_WIDTH);
        translateX.setValue(newTranslateX);
      } else if (gestureState.dx > 0 && isSwipeOpen) {
        // 오른쪽으로 스와이프하여 닫기
        const newTranslateX = Math.min(gestureState.dx - DELETE_BUTTON_WIDTH, 0);
        translateX.setValue(newTranslateX);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      const { dx, vx } = gestureState;
      
      // 스와이프 끝 - FlatList 스크롤 재활성화
      setIsAnyItemSwiping(false);
      
      // 휴지통이 열린 상태에서 왼쪽으로 추가 스와이프하면 삭제 실행
      if (isSwipeOpen && ((dx < -SWIPE_THRESHOLD || (vx < -0.5 && dx < 0)))) {
        // 채팅창을 왼쪽으로 날려보내며 삭제
        executeDeleteWithAnimation();
      }
      // 왼쪽으로 스와이프 (음수 dx, 음수 vx) - 휴지통이 닫힌 상태일 때만
      else if ((dx < -SWIPE_THRESHOLD || (vx < -0.5 && dx < 0)) && !isSwipeOpen) {
        // 삭제 버튼 보이기
        openSwipe();
      } 
      // 오른쪽으로 스와이프 (양수 dx, 양수 vx) - 휴지통이 열린 상태일 때만
      else if ((dx > SWIPE_THRESHOLD || (vx > 0.5 && dx > 0)) && isSwipeOpen) {
        // 삭제 버튼 숨기기
        closeSwipe();
      } else {
        // 임계값 미달 시 원래 상태로 돌아가기
        if (isSwipeOpen) {
          openSwipe(); // 열린 상태 유지
        } else {
          closeSwipe(); // 닫힌 상태 유지
        }
      }
    },
  });

  const openSwipe = () => {
    setIsSwipeOpen(true);
    Animated.spring(translateX, {
      toValue: -DELETE_BUTTON_WIDTH,
      tension: 300,
      friction: 30,
      useNativeDriver: false,
    }).start();
  };

  const closeSwipe = () => {
    setIsSwipeOpen(false);
    Animated.spring(translateX, {
      toValue: 0,
      tension: 300,
      friction: 30,
      useNativeDriver: false,
    }).start();
  };

  const executeDeleteWithAnimation = () => {
    // 휴지통 즉시 숨기기
    setIsSwipeOpen(false);
    
    // 채팅창을 왼쪽으로 날려보내는 애니메이션
    Animated.timing(translateX, {
      toValue: -screenWidth, // 화면 너비만큼 왼쪽으로 이동
      duration: 300,
      useNativeDriver: false,
    }).start(() => {
      // 애니메이션 완료 후 실제 삭제 실행
      onDelete(item.id);
    });
  };

  const handleDelete = () => {
    Alert.alert(
      '채팅방 삭제',
      '이 채팅방을 삭제하시겠습니까?\n삭제된 채팅방은 상대방에게도 보이지 않게 됩니다.',
      [
        { text: '취소', style: 'cancel', onPress: closeSwipe },
        { 
          text: '삭제', 
          style: 'destructive', 
          onPress: executeDeleteWithAnimation
        }
      ]
    );
  };

  return (
    <View style={styles.swipeContainer}>
      {/* 배경의 휴지통 버튼 - 스와이프가 열린 상태일 때만 렌더링 */}
      {isSwipeOpen && (
        <View style={styles.deleteBackground}>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* 메인 채팅 아이템 */}
      <Animated.View
        style={[styles.chatRowContainer, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity 
          style={[
            styles.chatRow,
            item.isReal && styles.realChatRow
          ]}
          onPress={async () => {
            if (isSwipeOpen) {
              closeSwipe();
              return;
            }
            if (item.isReal) {
              try {
                // 채팅방 입장 시 읽지 않은 메시지 수 초기화
                await updateUnreadCount(item.id, 0);
                
                navigation.navigate('Chat', { 
                  roomId: item.id,
                  otherUser: item.otherUser
                });
              } catch (error) {
                console.error('Error during chat navigation:', error);
              }
            }
          }}
        >
          {/* 아바타 */}
          <View style={styles.avatarSection}>
            {item.isIndividual ? (
              <View style={styles.profileImageContainer}>
                <View style={styles.singleProfileImage} />
                {/* 읽지 않은 메시지 수 배지 */}
                {item.unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>
                      {item.unreadCount > 99 ? '99+' : item.unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.profileImageContainer}>
                <View style={styles.groupProfileContainer}>
                  <View style={styles.groupProfile1} />
                  <View style={styles.groupProfile2} />
                </View>
                {/* 읽지 않은 메시지 수 배지 */}
                {item.unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadBadgeText}>
                      {item.unreadCount > 99 ? '99+' : item.unreadCount}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* 채팅 내용 */}
          <View style={styles.contentSection}>
            {/* 사용자 정보 */}
            <View style={styles.userInfoLine}>
              <Text style={styles.userInfoText}>{item.info || '정보 없음'}</Text>
            </View>
            
            {/* 이름과 태그 */}
            <View style={styles.nameTagLine}>
              <Text style={styles.nameText}>{item.name || '이름 없음'}</Text>
              <View style={styles.tagsList}>
                {item.tags && item.tags.map((tag, index) => (
                  <View key={index} style={styles.tagBox}>
                    <Text style={styles.tagLabel}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
            
            {/* 메시지와 시간 */}
            <View style={styles.messageTimeLine}>
              <Text style={[
                styles.messageText,
                item.hasUnread ? styles.boldMessage : styles.normalMessage
              ]}>
                {item.lastMessage || '메시지 없음'}
              </Text>
              <Text style={styles.timeLabel}>{item.time || ''}</Text>
            </View>
          </View>
          
          {/* 실제 채팅방 표시 */}
          {item.isReal && (
            <View style={styles.realIndicator}>
              <Ionicons name="checkmark-circle" size={16} color="#FF6600" />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export default function ChatListScreen({ navigation }) {
  const { user } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAnyItemSwiping, setIsAnyItemSwiping] = useState(false); // 아이템 스와이프 상태
  const [unreadCounts, setUnreadCounts] = useState({}); // AsyncStorage에서 가져온 읽지 않은 메시지 수

  // AsyncStorage에서 읽지 않은 메시지 수 로드
  const loadUnreadCounts = async () => {
    try {
      const storedUnreadData = await AsyncStorage.getItem('unreadMessages');
      const unreadData = storedUnreadData ? JSON.parse(storedUnreadData) : {};
      setUnreadCounts(unreadData);
    } catch (error) {
      console.error('Error loading unread counts:', error);
    }
  };

  // 특정 채팅방의 읽지 않은 메시지 수 업데이트
  const updateUnreadCount = async (roomId, count) => {
    try {
      const storedUnreadData = await AsyncStorage.getItem('unreadMessages');
      const unreadData = storedUnreadData ? JSON.parse(storedUnreadData) : {};
      
      if (count > 0) {
        unreadData[roomId] = count;
      } else {
        delete unreadData[roomId]; // 0이면 삭제
      }
      
      await AsyncStorage.setItem('unreadMessages', JSON.stringify(unreadData));
      setUnreadCounts(unreadData);
    } catch (error) {
      console.error('Error updating unread count:', error);
      throw error;
    }
  };

  useEffect(() => {
    // 실제 채팅방과 더미 데이터 함께 로드
    loadChatRooms();
    loadUnreadCounts();
  }, []);

  // 화면에 포커스될 때마다 채팅방 목록 새로고침 + 읽지 않은 메시지 수 새로고침
  useFocusEffect(
    React.useCallback(() => {
      loadChatRooms();
      loadUnreadCounts();
    }, [])
  );

  // 실제 API에서 채팅방 로드 + 더미 데이터와 합치기
  const loadChatRooms = async () => {
    try {
      setLoading(true);
      
      // 실제 API에서 채팅방 데이터 가져오기
      const response = await ApiService.getChatRooms();
      let realChats = [];
      
      if (response && response.rooms) {
        realChats = response.rooms.map(room => {
          // AsyncStorage의 읽지 않은 메시지 수와 서버의 데이터를 결합
          const asyncUnreadCount = unreadCounts[room.id] || 0;
          const serverUnreadCount = room.unread_count || 0;
          const totalUnreadCount = Math.max(asyncUnreadCount, serverUnreadCount);
          const otherUser = getOtherUser(room.participants);
          
          return {
            id: room.id,
            name: getOtherUserName(room.participants),
            info: getOtherUserInfo(room.participants),
            tags: getOtherUserTags(room.participants),
            lastMessage: room.last_message || '대화를 시작해보세요',
            time: formatTime(room.last_message_time),
            hasUnread: totalUnreadCount > 0,
            unreadCount: totalUnreadCount,
            isIndividual: room.room_type === 'individual',
            otherUser: otherUser,
            roomType: room.room_type,
            participants: room.participants,
            isReal: true // 실제 채팅방 표시
          };
        });
      }
      
      // 더미 데이터 (2개만 남김)
      const dummyChats = [
        {
          id: 'dummy1',
          name: '반짝이는스케이트',
          info: '20대 중반, 여성, 성신여자대학교',
          tags: ['청결함', '올빼미', '비흡연'],
          lastMessage: '새 메시지 2개',
          time: '2시간',
          hasUnread: true,
          unreadCount: 2,
          isIndividual: true,
          otherUser: { name: '반짝이는스케이트' },
          isReal: false
        },
        {
          id: 'dummy2',
          name: '독특한 타란튤라',
          info: '20대 초반, 여성, 고려대학교',
          tags: ['청결함', '올빼미', '비흡연'],
          lastMessage: '새 메시지 2개',
          time: '3시간',
          hasUnread: true,
          isIndividual: false,
          otherUser: { name: '독특한 타란튤라' },
          isReal: false
        }
      ];
      
      // 실제 채팅방을 맨 위에, 더미 데이터를 아래에 배치
      const allChats = [...realChats, ...dummyChats];
      setChats(allChats);
      
    } catch (error) {
      console.error('채팅방 목록 로드 실패:', error);
      // API 실패 시 더미 데이터만 표시
      loadDummyData();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadDummyData = () => {
    const dummyChats = [
      {
        id: 'dummy1',
        name: '반짝이는스케이트',
        info: '20대 중반, 여성, 성신여자대학교',
        tags: ['청결함', '올빼미', '비흡연'],
        lastMessage: '새 메시지 2개',
        time: '2시간',
        hasUnread: true,
        isIndividual: true,
        otherUser: { name: '반짝이는스케이트' },
        isReal: false
      },
      {
        id: 'dummy2',
        name: '독특한 타란튤라',
        info: '20대 초반, 여성, 고려대학교',
        tags: ['청결함', '올빼미', '비흡연'],
        lastMessage: '새 메시지 2개',
        time: '3시간',
        hasUnread: true,
        isIndividual: false,
        otherUser: { name: '독특한 타란튤라' },
        isReal: false
      }
    ];
    
    setChats(dummyChats);
    setLoading(false);
    setRefreshing(false);
  };


  const onRefresh = () => {
    setRefreshing(true);
    loadChatRooms(); // 새로고침 시 실제 데이터와 더미 데이터 함께 로드
  };

  const handleDeleteChat = async (chatId) => {
    try {
      console.log('🗑️ [DELETE] 채팅방 삭제 시작:', { chatId, typeof: typeof chatId });
      
      // 실제 채팅방만 삭제 가능
      if (typeof chatId === 'string' && chatId.startsWith('dummy')) {
        console.log('❌ [DELETE] 더미 채팅방 삭제 시도');
        Alert.alert('알림', '더미 채팅방은 삭제할 수 없습니다.');
        return;
      }

      console.log('📡 [DELETE] API 호출 시작:', ApiService.getCurrentApiUrl());
      const response = await ApiService.deleteChatRoom(chatId);
      console.log('📡 [DELETE] API 응답:', response);
      
      if (response) {
        console.log('✅ [DELETE] 삭제 성공, 채팅방 목록 새로고침 시작');
        // 삭제 성공 시 서버에서 최신 채팅방 목록 다시 불러오기
        await loadChatRooms();
        console.log('✅ [DELETE] 채팅방 목록 새로고침 완료');
      } else {
        console.log('❌ [DELETE] 서버에서 실패 응답 받음');
      }
    } catch (error) {
      console.error('❌ [DELETE] 채팅방 삭제 실패:', error);
      console.error('❌ [DELETE] 에러 상세:', {
        message: error.message,
        stack: error.stack,
        response: error.response?.data
      });
      Alert.alert('오류', '채팅방 삭제에 실패했습니다.');
    }
  };

  const getOtherUser = (participants) => {
    return participants.find(p => p.id !== user.id) || participants[0];
  };

  const getOtherUserName = (participants) => {
    const otherUser = getOtherUser(participants);
    return otherUser ? otherUser.name : '알 수 없음';
  };

  const getOtherUserInfo = (participants) => {
    const otherUser = getOtherUser(participants);
    if (!otherUser) return '';
    
    // 나이, 성별, 학교 정보 조합 (프로필에서 가져오기)
    const parts = [];
    
    // 나이 정보 (age 또는 birth_year로부터 계산)
    if (otherUser.age) {
      const ageGroup = otherUser.age < 25 ? '20대 초반' : '20대 중반';
      parts.push(ageGroup);
    } else if (otherUser.birth_year) {
      const currentYear = new Date().getFullYear();
      const age = currentYear - otherUser.birth_year;
      const ageGroup = age < 25 ? '20대 초반' : '20대 중반';
      parts.push(ageGroup);
    }
    
    // 성별 정보
    if (otherUser.gender) {
      parts.push(otherUser.gender === 'male' ? '남성' : '여성');
    }
    
    // 학교 정보
    if (otherUser.school) {
      parts.push(otherUser.school);
    } else if (otherUser.university) {
      parts.push(otherUser.university);
    }
    
    return parts.join(', ');
  };

  const getOtherUserTags = (participants) => {
    const otherUser = getOtherUser(participants);
    console.log('🏷️ getOtherUserTags - otherUser:', otherUser);
    
    if (!otherUser || !otherUser.profile) {
      console.log('❌ 프로필 정보 없음:', { hasUser: !!otherUser, hasProfile: !!otherUser?.profile });
      return [];
    }
    
    const tags = [];
    const profile = otherUser.profile;
    console.log('🔍 프로필 데이터:', profile);
    
    // 수면 패턴: 종달새/올빼미
    if (profile.sleep_type === 'morning' || profile.sleep_type === 'early') {
      tags.push('종달새');
    } else if (profile.sleep_type === 'night' || profile.sleep_type === 'late' || profile.sleep_type === 'evening') {
      tags.push('올빼미');
    }
    
    // 흡연 여부: 비흡연/흡연
    if (profile.smoking_status === 'non_smoker' || profile.smoking_status === 'non_smoker_ok' || profile.smoking_status === 'non_smoker_strict' || profile.smoking_status === false) {
      tags.push('비흡연');
    } else if (profile.smoking_status === 'smoker' || profile.smoking_status === 'smoker_indoor_yes' || profile.smoking_status === 'smoker_indoor_no' || profile.smoking_status === true) {
      tags.push('흡연');
    }
    
    console.log('🏷️ 생성된 태그들:', tags);
    return tags;
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    
    const messageTime = new Date(timeString);
    const now = new Date();
    const diff = now - messageTime;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (hours < 1) return '방금';
    if (hours < 24) return `${hours}시간`;
    return `${days}일`;
  };

  const renderChatItem = ({ item }) => {
    return (
      <SwipeableChatItem
        item={item}
        navigation={navigation}
        onDelete={handleDeleteChat}
        user={user}
        setIsAnyItemSwiping={setIsAnyItemSwiping}
        updateUnreadCount={updateUnreadCount}
      />
    );
  };

  const renderFilterButton = (filter) => (
    <TouchableOpacity
      key={filter.id}
      style={[
        styles.filterButton,
        selectedFilter === filter.id && styles.selectedFilterButton
      ]}
      onPress={() => setSelectedFilter(filter.id)}
    >
      <Text style={[
        styles.filterButtonText,
        selectedFilter === filter.id && styles.selectedFilterButtonText
      ]}>
        {filter.title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Svg width="21" height="24" viewBox="0 0 21 24" fill="none">
            <Path d="M19 13.5C19.8284 13.5 20.5 12.8284 20.5 12C20.5 11.1716 19.8284 10.5 19 10.5V12V13.5ZM0.939341 10.9393C0.353554 11.5251 0.353554 12.4749 0.939341 13.0607L10.4853 22.6066C11.0711 23.1924 12.0208 23.1924 12.6066 22.6066C13.1924 22.0208 13.1924 21.0711 12.6066 20.4853L4.12132 12L12.6066 3.51472C13.1924 2.92893 13.1924 1.97919 12.6066 1.3934C12.0208 0.807611 11.0711 0.807611 10.4853 1.3934L0.939341 10.9393ZM19 12V10.5L2 10.5V12V13.5L19 13.5V12Z" fill="#494949"/>
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>채팅</Text>
      </View>

      {/* 필터 탭 */}
      <View style={styles.filterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContent}
        >
          {FILTER_OPTIONS.map(renderFilterButton)}
        </ScrollView>
      </View>

      {/* 채팅 목록 */}
      <View style={styles.chatListContainer}>
        <FlatList
          data={chats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!isAnyItemSwiping} // 스와이프 중일 때 스크롤 비활성화
          contentContainerStyle={[
            styles.chatList,
            chats.length === 0 && styles.emptyChatList
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyChatContainer}>
                <Ionicons name="chatbubbles-outline" size={60} color="#ccc" />
                <Text style={styles.emptyChatTitle}>아직 채팅이 없습니다</Text>
                <Text style={styles.emptyChatText}>
                  룸메이트 매칭에서 마음에 드는 사람에게{'\n'}
                  연락해보세요!
                </Text>
              </View>
            ) : null
          }
        />
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 10,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  filterContainer: {
    paddingHorizontal: 14,
    marginTop: 20,
    marginBottom: 18,
  },
  filterScrollContent: {
    paddingHorizontal: 0,
  },
  filterButton: {
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(153, 153, 153, 0.7)',
  },
  selectedFilterButton: {
    backgroundColor: '#616161',
    borderColor: '#616161',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#999999',
  },
  selectedFilterButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  chatListContainer: {
    flex: 1,
    paddingHorizontal: 14,
  },
  chatList: {
    paddingBottom: 20,
  },
  emptyChatList: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyChatContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyChatTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyChatText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  // 채팅방 셀 스타일
  chatRow: {
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    padding: 12,
    marginBottom: 15,
    alignItems: 'flex-start',
  },
  
  // 아바타 섹션
  avatarSection: {
    marginRight: 12,
    width: 68,
    height: 68,
    justifyContent: 'center',
    alignItems: 'center',
  },
  singleProfileImage: {
    width: 68,
    height: 68,
    backgroundColor: '#D9D9D9',
    borderRadius: 34,
  },
  groupProfileContainer: {
    width: 68,
    height: 68,
    position: 'relative',
  },
  groupProfile1: {
    position: 'absolute',
    left: 0,
    top: 10,
    width: 48,
    height: 48,
    backgroundColor: '#D9D9D9',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#CFCFCF',
    zIndex: 1,
  },
  groupProfile2: {
    position: 'absolute',
    right: 0,
    top: 10,
    width: 48,
    height: 48,
    backgroundColor: '#BCBCBC',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#CFCFCF',
    zIndex: 0,
  },
  
  // 콘텐츠 섹션
  contentSection: {
    flex: 1,
    flexDirection: 'column',
    gap: 3,
  },
  
  // 첫 번째 줄: 사용자 정보
  userInfoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  userInfoText: {
    fontSize: 12,
    fontWeight: '300',
    color: '#343434',
    opacity: 0.8,
    fontFamily: 'Pretendard',
  },
  
  // 두 번째 줄: 이름과 태그
  nameTagLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    width: '100%',
    flexWrap: 'wrap',
  },
  nameText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#474747',
    fontFamily: 'Pretendard',
    lineHeight: 27,
  },
  tagsList: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    flexWrap: 'wrap',
  },
  tagBox: {
    backgroundColor: '#E2E2E2',
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  tagLabel: {
    fontSize: 11,
    fontWeight: '300',
    color: '#343434',
    opacity: 0.8,
    fontFamily: 'Pretendard',
  },
  
  // 세 번째 줄: 메시지와 시간
  messageTimeLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  messageText: {
    fontSize: 14,
    fontFamily: 'Pretendard',
    flex: 1,
    marginRight: 8,
  },
  boldMessage: {
    fontWeight: '500',
    color: '#343434',
    opacity: 0.8,
  },
  normalMessage: {
    fontWeight: '300',
    color: '#343434',
    opacity: 0.8,
  },
  timeLabel: {
    fontSize: 12,
    fontWeight: '300',
    color: '#929292',
    opacity: 0.8,
    fontFamily: 'Pretendard',
  },
  
  // 실제 채팅방 표시 스타일
  realChatRow: {
    borderColor: '#FF6600',
    borderWidth: 1.5,
  },
  realIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 2,
  },

  // 스와이프 관련 스타일
  swipeContainer: {
    position: 'relative',
  },
  chatRowContainer: {
    backgroundColor: 'transparent',
  },
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 15, // marginBottom과 맞춤
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  deleteButton: {
    width: 80,
    height: '100%',
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 9,
  },

  // 프로필 이미지 컨테이너와 배지 스타일
  profileImageContainer: {
    position: 'relative',
    width: 68,
    height: 68,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 10,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 4,
  },
});