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
import PersonIcon from '../components/icons/PersonIcon';


const FILTER_OPTIONS = [
  { id: 'all', title: '전체', isSelected: true },
  { id: 'request', title: '채팅신청', isSelected: false },
  { id: 'room', title: '매물추천', isSelected: false },
  { id: 'roommate', title: '룸메제안', isSelected: false },
  { id: 'landlord', title: '집주인포함', isSelected: false },
];

const { width: screenWidth } = Dimensions.get('window');

// 스와이프 가능한 채팅 아이템 컴포넌트
const SwipeableChatItem = ({ item, navigation, onDelete, user, setIsAnyItemSwiping, formatUserStatus }) => {
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
            <Svg width="33" height="38" viewBox="0 0 37 42" fill="none">
              <Path
                d="M22.458 19.0139V31.6806M14.208 19.0139V31.6806M5.95801 10.5694V35.9028C5.95801 37.0226 6.3926 38.0965 7.16619 38.8883C7.93978 39.6802 8.98899 40.125 10.083 40.125H26.583C27.677 40.125 28.7262 39.6802 29.4998 38.8883C30.2734 38.0965 30.708 37.0226 30.708 35.9028V10.5694M1.83301 10.5694H34.833M8.02051 10.5694L12.1455 2.125H24.5205L28.6455 10.5694"
                stroke="white"
                strokeWidth="2.6875"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
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
            styles.chatRow
          ]}
          onPress={async () => {
            if (isSwipeOpen) {
              closeSwipe();
              return;
            }
            try {
              navigation.navigate('MainTabs', {
                screen: '홈',
                params: {
                  screen: 'Chat',
                  params: {
                    roomId: item.id,
                    otherUser: item.otherUser
                  }
                }
              });
            } catch (error) {
              console.error('Error during chat navigation:', error);
            }
          }}
        >
          {/* 아바타 */}
          <TouchableOpacity
            style={styles.avatarSection}
            onPress={() => {
              if (item.isIndividual && item.otherUser) {
                navigation.navigate('MainTabs', {
                  screen: '홈',
                  params: {
                    screen: 'UserProfile',
                    params: {
                      userId: item.otherUser.id,
                      roomId: null // 채팅에서는 특정 방이 없으므로 null
                    }
                  }
                });
              }
            }}
          >
            {item.isIndividual ? (
              <View style={styles.profileImageContainer}>
                <View style={styles.avatarCircle}>
                  <PersonIcon size={33} color="#595959" />
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
            ) : (
              <View style={styles.profileImageContainer}>
                <View style={styles.groupProfileContainer}>
                  <Ionicons name="person-circle" size={56} color="#ddd" style={styles.groupProfile1} />
                  <Ionicons name="person-circle" size={56} color="#bbb" style={styles.groupProfile2} />
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
          </TouchableOpacity>

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
              <Text
                style={[
                  styles.messageText,
                  item.hasUnread ? styles.boldMessage : styles.normalMessage
                ]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {item.lastMessage || '메시지 없음'}
                {(item.userStatus || item.time) && (
                  <Text style={styles.dotSeparator}> • </Text>
                )}
                {item.userStatus ? (
                  <Text style={[
                    styles.timeLabel,
                    item.userStatus.minutes_ago < 5 && styles.onlineTimeLabel
                  ]}>
                    {formatUserStatus(item.userStatus)}
                  </Text>
                ) : item.time ? (
                  <Text style={styles.timeLabel}>{item.time}</Text>
                ) : null}
              </Text>
            </View>
          </View>

        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

export default function ChatListScreen({ navigation, route }) {
  const { user } = useAuth();
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [chats, setChats] = useState([]);
  const [allChats, setAllChats] = useState([]); // 필터링 전 전체 채팅방 목록
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAnyItemSwiping, setIsAnyItemSwiping] = useState(false); // 아이템 스와이프 상태

  // 공유 모드 관련 state
  const [isShareMode, setIsShareMode] = useState(false);
  const [selectedChats, setSelectedChats] = useState([]);
  const [roomData, setRoomData] = useState(null);


  useEffect(() => {
    // 실제 채팅방 로드
    loadChatRooms();

    // route params로 공유 모드인지 확인
    if (route?.params?.isShareMode && route?.params?.roomData) {
      setIsShareMode(true);
      setRoomData(route.params.roomData);
    }
  }, [route?.params]);

  // 화면에 포커스될 때마다 채팅방 목록 새로고침 (채팅방에서 돌아왔을 때 포함)
  useFocusEffect(
    React.useCallback(() => {
      console.log('📱 ChatListScreen focused - 채팅방 목록 새로고침');
      loadChatRooms();
    }, [])
  );

  // 필터가 변경될 때마다 채팅방 목록 다시 로드
  useEffect(() => {
    loadChatRooms();
  }, [selectedFilter]);

  // 실제 API에서 채팅방 로드 + 더미 데이터와 합치기
  const loadChatRooms = async () => {
    try {
      setLoading(true);

      // 실제 API에서 채팅방 데이터 가져오기
      const response = await ApiService.getChatRooms();
      let realChats = [];

      if (response && response.rooms) {
        realChats = await Promise.all(response.rooms.map(async (room) => {
          // 서버에서 받은 읽지 않은 메시지 수만 사용
          const totalUnreadCount = room.unread_count || 0;
          const otherUser = getOtherUser(room.participants);

          // 상대방의 접속 상태 조회
          let userStatus = null;
          if (otherUser) {
            try {
              userStatus = await ApiService.getUserStatus(otherUser.id);
            } catch (error) {
              // 조용히 처리 - 에러 로그 없음
            }
          }

          return {
            id: room.id,
            name: getOtherUserName(room.participants),
            info: getOtherUserInfo(room.participants),
            tags: getOtherUserTags(room.participants),
            lastMessage: formatLastMessage(room.last_message),
            time: formatTime(room.last_message_time),
            userStatus: userStatus, // 사용자 상태 추가
            hasUnread: totalUnreadCount > 0,
            unreadCount: totalUnreadCount,
            isIndividual: room.room_type === 'individual',
            otherUser: otherUser,
            roomType: room.room_type,
            participants: room.participants,
            lastMessageTime: room.last_message_time, // 필터링용 원본 시간
            rawLastMessage: room.last_message, // 필터링용 원본 메시지
          };
        }));
      }

      // 전체 채팅방 목록 저장 (필터 표시용)
      setAllChats(realChats);

      // 필터링 적용
      const filteredChats = applyFilter(realChats, selectedFilter);
      setChats(filteredChats);

    } catch (error) {
      console.error('채팅방 목록 로드 실패:', error);
      // API 실패 시 빈 배열 설정
      setChats([]);
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
    loadChatRooms(); // 새로고침 시 실제 데이터 로드
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
    if (days === 1) return '1일';
    if (days < 7) return `${days}일`;

    // 7일 이상일 경우 날짜 형식으로 표시
    const month = messageTime.getMonth() + 1;
    const date = messageTime.getDate();
    return `${month}/${date}`;
  };

  const formatUserStatus = (userStatus) => {
    if (!userStatus) return '';

    const minutes = userStatus.minutes_ago;

    // 5분 이내로 접속 - 방금 전(초록색)
    if (minutes < 5) {
      return '방금 전';
    }
    // 1시간 이내로 접속 - x분 전(회색)
    else if (minutes < 60) {
      return `${minutes}분 전`;
    }
    // 24시간 이내로 접속 - x시간 전(회색)
    else if (minutes < 1440) {
      return `${Math.floor(minutes / 60)}시간 전`;
    }
    // 이후로는 - x일 전(회색)
    else {
      return `${Math.floor(minutes / 1440)}일 전`;
    }
  };

  const formatLastMessage = (message) => {
    if (!message) return '대화를 시작해보세요';

    // ROOM_SHARE 메시지인지 확인
    if (message.startsWith('ROOM_SHARE:')) {
      return '매물을 공유했습니다';
    }

    // ROOM_CARD 메시지인지 확인
    if (message.startsWith('ROOM_CARD:')) {
      return '매물 정보를 공유했습니다';
    }

    // USER_PROFILE 메시지인지 확인
    if (message.startsWith('USER_PROFILE:')) {
      return '프로필을 공유했습니다';
    }

    if (message.startsWith('HOUSE_RULES:')) {
      return '주택 규칙을 공유했습니다';
    }

    if (message.startsWith('VOTING:')) {
      return '투표를 공유했습니다';
    }

    if (message.startsWith('DISPUTE_GUIDE:')) {
      return '분쟁 안내를 공유했습니다';
    }

    return message;
  };

  // 필터링 함수
  const applyFilter = (chats, filterType) => {
    if (filterType === 'all') {
      return chats;
    }

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    return chats.filter(chat => {
      // 최근 3일 이내의 채팅방만 필터링 대상
      if (!chat.lastMessageTime) return false;

      const messageTime = new Date(chat.lastMessageTime);
      if (messageTime < threeDaysAgo) return false;

      const rawMessage = chat.rawLastMessage || '';

      switch (filterType) {
        case 'room': // 매물추천
          return rawMessage.startsWith('ROOM_SHARE:');

        case 'roommate': // 룸메제안
          return rawMessage.startsWith('USER_PROFILE:') || rawMessage.startsWith('ROOM_CARD:');

        case 'request': // 채팅신청
          // 일반 텍스트 메시지 (특수 메시지가 아닌 경우)
          return !rawMessage.startsWith('ROOM_SHARE:') &&
                 !rawMessage.startsWith('ROOM_CARD:') &&
                 !rawMessage.startsWith('USER_PROFILE:');

        case 'landlord': // 집주인포함
          // 이 필터는 추가 조건이 필요할 수 있습니다 (집주인 여부를 판단하는 로직)
          return true; // 현재는 모든 채팅방 표시

        default:
          return true;
      }
    });
  };

  // 각 필터별 안읽은 메시지 여부 확인
  const hasUnreadInFilter = (chats, filterType) => {
    if (!chats || chats.length === 0) return false;

    const filteredChats = applyFilter(chats, filterType);
    return filteredChats.some(chat => chat.hasUnread);
  };

  // 공유 모드에서 채팅방 선택/해제
  const toggleChatSelection = (chatId) => {
    if (!isShareMode) return;

    setSelectedChats(prev =>
      prev.includes(chatId)
        ? prev.filter(id => id !== chatId)
        : [...prev, chatId]
    );
  };

  // 공유 실행
  const handleShare = async () => {
    if (!isShareMode || selectedChats.length === 0) return;

    try {
      // 선택된 채팅방에 매물 정보 공유
      for (const chatId of selectedChats) {
        await ApiService.shareRoom(chatId, roomData);
      }

      // 공유 모드 종료하고 채팅방 목록 새로고침
      setIsShareMode(false);
      setSelectedChats([]);
      setRoomData(null);

      // 채팅방 목록 새로고침하여 공유된 매물 카드 표시
      loadChatRooms();
    } catch (error) {
      console.error('매물 공유 실패:', error);
      Alert.alert('오류', '매물 공유에 실패했습니다.');
    }
  };

  const renderChatItem = ({ item }) => {
    if (isShareMode) {
      // 공유 모드에서는 선택 가능한 채팅 아이템 렌더링
      return (
        <TouchableOpacity
          style={[
            styles.chatRow,
            selectedChats.includes(item.id) && styles.selectedChatItem
          ]}
          onPress={() => toggleChatSelection(item.id)}
        >
          {/* 아바타 섹션 */}
          <View style={styles.avatarSection}>
            <View style={styles.profileImageContainer}>
              {item.isIndividual ? (
                <View style={[
                  styles.avatarCircle,
                  selectedChats.includes(item.id) && styles.selectedAvatarCircle
                ]}>
                  <PersonIcon size={33} color="#595959" />
                </View>
              ) : (
                <View style={styles.groupProfileContainer}>
                  <View style={[
                    styles.avatarCircle,
                    styles.groupProfile1,
                    selectedChats.includes(item.id) && styles.selectedAvatarCircle
                  ]}>
                    <PersonIcon size={33} color="#595959" />
                  </View>
                  <View style={[
                    styles.avatarCircle,
                    styles.groupProfile2,
                    selectedChats.includes(item.id) && styles.selectedAvatarCircle
                  ]}>
                    <PersonIcon size={33} color="#595959" />
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* 콘텐츠 섹션 */}
          <View style={styles.contentSection}>
            {/* 첫 번째 줄: 사용자 정보 */}
            <View style={styles.userInfoLine}>
              <Text style={styles.userInfoText}>{item.info || '정보 없음'}</Text>
            </View>

            {/* 두 번째 줄: 이름과 태그 */}
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

            {/* 세 번째 줄: 메시지와 시간 */}
            <View style={styles.messageTimeLine}>
              <Text style={styles.messageText} numberOfLines={1} ellipsizeMode="tail">
                {item.lastMessage || '메시지 없음'}
                {(item.userStatus || item.time) && (
                  <Text style={styles.dotSeparator}> • </Text>
                )}
                {item.userStatus ? (
                  <Text style={[
                    styles.timeLabel,
                    item.userStatus.minutes_ago < 5 && styles.onlineTimeLabel
                  ]}>
                    {formatUserStatus(item.userStatus)}
                  </Text>
                ) : item.time ? (
                  <Text style={styles.timeLabel}>{item.time}</Text>
                ) : null}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <SwipeableChatItem
        item={item}
        navigation={navigation}
        onDelete={handleDeleteChat}
        user={user}
        setIsAnyItemSwiping={setIsAnyItemSwiping}
        formatUserStatus={formatUserStatus}
      />
    );
  };

  const renderFilterButton = (filter) => {
    const hasUnread = hasUnreadInFilter(allChats, filter.id);

    return (
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
        {hasUnread && (
          <View style={styles.filterUnreadIndicator} />
        )}
      </TouchableOpacity>
    );
  };

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
        <Text style={styles.headerTitle}>
          {isShareMode ? '공유 상대 선택' : '채팅'}
        </Text>
        {isShareMode && (
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleShare}
            disabled={selectedChats.length === 0}
          >
            <Text style={[
              styles.confirmButtonText,
              selectedChats.length === 0 ? styles.confirmButtonDisabled : styles.confirmButtonEnabled
            ]}>
              {selectedChats.length > 0 ? `${selectedChats.length} 확인` : '확인'}
            </Text>
          </TouchableOpacity>
        )}
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
    backgroundColor: '#F2F2F2',
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 10,
    backgroundColor: '#F2F2F2',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 30,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  confirmButton: {
    position: 'absolute',
    right: 20,
    top: 30,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonDisabled: {
    color: '#C0C0C0',
  },
  confirmButtonEnabled: {
    color: '#000',
  },
  selectedChatItem: {
    backgroundColor: 'rgba(16, 181, 133, 0.20)',
    borderColor: '#10B585',
  },
  filterContainer: {
    paddingHorizontal: 14,
    marginTop: 23,
    marginBottom: 18,
  },
  filterScrollContent: {
    paddingHorizontal: 0,
  },
  filterButton: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 6,
    marginTop: 3,
    borderWidth: 0.5,
    borderColor: 'rgba(153, 153, 153, 0.7)',
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  selectedFilterButton: {
    backgroundColor: '#000000',
    borderColor: '#000000',
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
  filterUnreadIndicator: {
    position: 'absolute',
    top: -2,
    right: -1,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
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

  // 아바타 섹션
  avatarSection: {
    marginRight: 12,
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F2F2F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedAvatarCircle: {
    backgroundColor: '#FFFFFF',
  },
  groupProfileContainer: {
    width: 52,
    height: 52,
    position: 'relative',
  },
  groupProfile1: {
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 1,
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  groupProfile2: {
    position: 'absolute',
    right: 0,
    top: 12,
    zIndex: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
  },

  // 콘텐츠 섹션
  contentSection: {
    flex: 1,
    flexDirection: 'column',
    gap: 2,
    justifyContent: 'center',
  },

  // 첫 번째 줄: 사용자 정보
  userInfoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  userInfoText: {
    fontSize: 13,
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
    fontSize: 16,
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
    fontSize: 12,
    fontWeight: '300',
    color: '#343434',
    opacity: 0.8,
    fontFamily: 'Pretendard',
  },

  // 세 번째 줄: 메시지와 시간
  messageTimeLine: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
  },
  messageText: {
    fontSize: 15,
    fontFamily: 'Pretendard',
    flex: 1,
  },
  dotSeparator: {
    fontSize: 15,
    color: '#929292',
    fontFamily: 'Pretendard',
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
    fontSize: 13,
    fontWeight: '300',
    color: '#929292',
    opacity: 0.8,
    fontFamily: 'Pretendard',
  },
  onlineTimeLabel: {
    color: '#10B585',
    opacity: 1,
  },
  timeStatusContainer: {
    alignItems: 'flex-end',
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
    width: 70,
    height: 70,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 35,
    alignSelf: 'center',
  },

  // 프로필 이미지 컨테이너와 배지 스타일
  profileImageContainer: {
    position: 'relative',
    width: 52,
    height: 52,
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
