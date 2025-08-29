import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import ApiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import RoomMessageCard from '../components/RoomMessageCard';
import PhoneIcon from '../components/icons/PhoneIcon';
import PersonIcon from '../components/icons/PersonIcon';
import SendIcon from '../components/icons/SendIcon';
import PlusIcon from '../components/icons/PlusIcon';


export default function ChatScreen({ navigation, route }) {
  const { roomId, otherUser } = route.params;
  const { user: currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [otherUserProfile, setOtherUserProfile] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const flatListRef = useRef(null);
  const pollIntervalRef = useRef(null);

  useEffect(() => {
    loadMessages();
    loadOtherUserProfile();
    
    // 실시간 메시지 폴링 시작
    startPolling();
    
    return () => {
      // 컴포넌트 언마운트 시 폴링 정리
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [roomId]);

  const handleFavoriteToggle = async (roomId) => {
    try {
      const isFavorited = favorites.includes(roomId);
      if (isFavorited) {
        setFavorites(prev => prev.filter(id => id !== roomId));
        // 찜 해제 시 개수 -1
        setMessages(prevMessages => 
          prevMessages.map(msg => {
            if (msg.messageType === 'room_share') {
              try {
                const roomData = JSON.parse(msg.text);
                if (roomData.room_id === roomId) {
                  const updatedRoomData = {
                    ...roomData,
                    favorite_count: Math.max(0, (roomData.favorite_count || 0) - 1)
                  };
                  return {
                    ...msg,
                    text: JSON.stringify(updatedRoomData)
                  };
                }
              } catch (e) {
                console.error('JSON parse error:', e);
              }
            }
            return msg;
          })
        );
      } else {
        setFavorites(prev => [...prev, roomId]);
        // 찜 추가 시 개수 +1
        setMessages(prevMessages => 
          prevMessages.map(msg => {
            if (msg.messageType === 'room_share') {
              try {
                const roomData = JSON.parse(msg.text);
                if (roomData.room_id === roomId) {
                  const updatedRoomData = {
                    ...roomData,
                    favorite_count: (roomData.favorite_count || 0) + 1
                  };
                  return {
                    ...msg,
                    text: JSON.stringify(updatedRoomData)
                  };
                }
              } catch (e) {
                console.error('JSON parse error:', e);
              }
            }
            return msg;
          })
        );
      }
    } catch (error) {
      console.error('찜 토글 실패:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const response = await ApiService.getChatMessages(roomId);
      if (response && response.messages) {
        const formattedMessages = response.messages.map(msg => {
          // ROOM_SHARE prefix 확인
          const isRoomShare = msg.content?.startsWith('ROOM_SHARE:');
          const messageType = isRoomShare ? 'room_share' : (msg.message_type || 'text');
          const content = isRoomShare ? msg.content.substring(11) : msg.content; // ROOM_SHARE: 제거
          
          // 디버깅 로그 추가
          if (isRoomShare) {
            console.log('ROOM_SHARE message detected in loadMessages:', msg.content);
            console.log('Parsed content:', content);
            try {
              const parsedData = JSON.parse(content);
              console.log('Successfully parsed room data:', parsedData);
            } catch (parseError) {
              console.error('Failed to parse room data:', parseError);
            }
          }
          
          return {
            id: msg.id.toString(),
            text: content,
            messageId: msg.id,
            sender: msg.sender_id === currentUser.id ? 'me' : 'other',
            timestamp: new Date(msg.created_at),
            senderName: msg.sender_name,
            unreadCount: msg.unread_count || 0, // 읽지 않은 사용자 수
            sent: msg.sent || false,
            delivered: msg.delivered || false,
            read: msg.read || false,
            status: msg.status || 'pending',
            messageType: messageType // 메시지 타입 추가
          };
        });
        setMessages(formattedMessages);
        
        // 메시지 읽음 처리
        await ApiService.markMessagesAsRead(roomId);
      }
    } catch (error) {
      console.error('메시지 로드 실패:', error);
    } finally {
      setLoading(false);
      // 메시지 로드 후 스크롤
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    }
  };

  const loadMessagesWithoutMarkingAsRead = async () => {
    try {
      // peek API를 사용하여 읽음 처리 없이 메시지 로드
      const response = await ApiService.peekChatMessages(roomId);
      if (response && response.messages) {
        const formattedMessages = response.messages.map(msg => {
          // ROOM_SHARE prefix 확인
          const isRoomShare = msg.content?.startsWith('ROOM_SHARE:');
          const messageType = isRoomShare ? 'room_share' : (msg.message_type || 'text');
          const content = isRoomShare ? msg.content.substring(11) : msg.content; // ROOM_SHARE: 제거
          
          // 디버깅 로그 추가
          if (isRoomShare) {
            console.log('ROOM_SHARE message detected in loadMessagesWithoutMarkingAsRead:', msg.content);
            console.log('Parsed content:', content);
            try {
              const parsedData = JSON.parse(content);
              console.log('Successfully parsed room data:', parsedData);
            } catch (parseError) {
              console.error('Failed to parse room data:', parseError);
            }
          }
          
          return {
            id: msg.id.toString(),
            text: content,
            messageId: msg.id,
            sender: msg.sender_id === currentUser.id ? 'me' : 'other',
            timestamp: new Date(msg.created_at),
            senderName: msg.sender_name,
            unreadCount: msg.unread_count || 0, // 읽지 않은 사용자 수
            sent: msg.sent || false,
            delivered: msg.delivered || false,
            read: msg.read || false,
            status: msg.status || 'pending',
            messageType: messageType // 메시지 타입 추가
          };
        });
        setMessages(formattedMessages);
        
        // 읽음 처리하지 않음 - 내가 보낸 메시지의 읽음 상태 확인용
      }
    } catch (error) {
      console.error('메시지 로드 실패:', error);
    } finally {
      // 메시지 로드 후 스크롤
      setTimeout(() => {
        if (flatListRef.current) {
          flatListRef.current.scrollToEnd({ animated: true });
        }
      }, 100);
    }
  };

  const loadOtherUserProfile = async () => {
    try {
      // 채팅방 정보를 가져와서 상대방 정보 추출
      const response = await ApiService.getChatRooms();
      if (response && response.rooms) {
        const currentRoom = response.rooms.find(room => room.id.toString() === roomId.toString());
        if (currentRoom && currentRoom.participants) {
          const otherUserData = currentRoom.participants.find(p => p.id !== currentUser.id);
          if (otherUserData) {
            setOtherUserProfile(otherUserData);
          }
        }
      }
    } catch (error) {
      console.error('상대방 프로필 로드 실패:', error);
    }
  };

  // AsyncStorage에서 읽지 않은 메시지 수 관리
  const updateUnreadCount = async (roomId, increment = true) => {
    try {
      const storedUnreadData = await AsyncStorage.getItem('unreadMessages');
      const unreadData = storedUnreadData ? JSON.parse(storedUnreadData) : {};
      
      if (increment) {
        unreadData[roomId] = (unreadData[roomId] || 0) + 1;
      } else {
        unreadData[roomId] = 0;
      }
      
      await AsyncStorage.setItem('unreadMessages', JSON.stringify(unreadData));
    } catch (error) {
      console.error('Error updating unread count:', error);
    }
  };

  const clearUnreadCount = async () => {
    try {
      await updateUnreadCount(roomId, false);
    } catch (error) {
      console.error('Error clearing unread count:', error);
    }
  };

  const startPolling = () => {
    // 3초마다 새 메시지 확인 (읽음 처리 없이)
    pollIntervalRef.current = setInterval(loadMessagesWithoutMarkingAsRead, 3000);
  };

  const getOtherUserInfo = (otherUserData) => {
    if (!otherUserData) return '';
    
    const parts = [];
    
    // 나이 정보 (age 또는 birth_year로부터 계산)
    if (otherUserData.age) {
      const ageGroup = otherUserData.age < 25 ? '20대 초반' : '20대 중반';
      parts.push(ageGroup);
    } else if (otherUserData.birth_year) {
      const currentYear = new Date().getFullYear();
      const age = currentYear - otherUserData.birth_year;
      const ageGroup = age < 25 ? '20대 초반' : '20대 중반';
      parts.push(ageGroup);
    }
    
    // 성별 정보
    if (otherUserData.gender) {
      parts.push(otherUserData.gender === 'male' ? '남성' : '여성');
    }
    
    // 학교 정보
    if (otherUserData.school) {
      parts.push(otherUserData.school);
    } else if (otherUserData.university) {
      parts.push(otherUserData.university);
    }
    
    return parts.join(', ');
  };

  const getOtherUserTags = (otherUserData) => {
    if (!otherUserData || !otherUserData.profile) return [];
    
    const tags = [];
    const profile = otherUserData.profile;
    
    // 수면 패턴: 종달새/올빼미
    if (profile.sleep_type === 'morning' || profile.sleep_type === 'early') {
      tags.push('종달새');
    } else if (profile.sleep_type === 'night' || profile.sleep_type === 'late') {
      tags.push('올빼미');
    }
    
    // 흡연 여부: 비흡연/흡연
    if (profile.smoking_status === 'non_smoker' || profile.smoking_status === false) {
      tags.push('비흡연');
    } else if (profile.smoking_status === 'smoker' || profile.smoking_status === true) {
      tags.push('흡연');
    }
    
    return tags;
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    // 한국 시간으로 변환
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const sendMessage = async () => {
    if (inputText.trim()) {
      const messageText = inputText.trim();
      
      try {
        // 입력창 먼저 비우기 (UX 개선)
        setInputText('');
        
        // 서버에 메시지 전송
        await ApiService.sendMessage(roomId, messageText);
        
        // 메시지 전송 후 바로 새로고침하여 화면에 반영 (읽음 처리 없이)
        await loadMessagesWithoutMarkingAsRead();
        
      } catch (error) {
        console.error('메시지 전송 실패:', error);
        Alert.alert('알림', '메시지 전송에 실패했습니다. 다시 시도해주세요.');
        // 실패 시 입력창에 텍스트 복원
        setInputText(messageText);
      }
    }
  };

  const renderMessage = ({ item, index }) => {
    const isMe = item.sender === 'me';
    const isBot = item.isBot || item.sender === 'bot';
    const nextItem = messages[index + 1];
    const prevItem = messages[index - 1];
    
    // 같은 발신자의 연속 메시지인지 확인
    const isConsecutive = prevItem && prevItem.sender === item.sender;
    const isLastInGroup = !nextItem || nextItem.sender !== item.sender;
    
    // 프로필을 보여줄지 결정 (다른 사람의 메시지이고, 그룹의 첫 번째 메시지)
    const showProfile = !isMe && !isConsecutive;
    
    if (isMe) {
      // 내가 보낸 메시지
      return (
        <View style={styles.messageContainer}>
          <View style={styles.myMessageRow}>
            <View style={styles.myMessageBubbleRow}>
              <View style={styles.myMessageInfo}>
                {item.unreadCount > 0 && (
                  <Text style={styles.readStatus}>
                    {item.unreadCount}
                  </Text>
                )}
                <Text style={styles.myTimestamp}>
                  {formatTime(item.timestamp)}
                </Text>
              </View>
              
              {item.messageType === 'room_share' ? (
                <View style={styles.roomShareContainer}>
                  {(() => {
                    try {
                      const roomData = JSON.parse(item.text);
                      return (
                        <RoomMessageCard 
                          roomData={roomData}
                          onPress={() => {
                            navigation.navigate('RoomDetail', { roomId: roomData.room_id });
                          }}
                          isFavorited={favorites.includes(roomData.room_id)}
                          onFavoriteToggle={() => handleFavoriteToggle(roomData.room_id)}
                        />
                      );
                    } catch (error) {
                      console.error('Failed to parse room share data:', error);
                      console.log('Raw text data:', item.text);
                      return (
                        <View style={styles.errorContainer}>
                          <Text style={styles.errorText}>매물 정보를 불러올 수 없습니다</Text>
                        </View>
                      );
                    }
                  })()}
                </View>
              ) : (
                <View style={[styles.messageBubble, styles.myBubble]}>
                  <Text style={[styles.messageText, styles.myText]}>
                    {item.text}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      );
    } else {
      // 상대방이 보낸 메시지
      return (
        <View style={styles.messageContainer}>
          <View style={styles.otherMessageRow}>
            {/* 왼쪽 프로필 영역 */}
            <View style={styles.avatarContainer}>
              {showProfile ? (
                isBot ? (
                  <View style={[styles.avatar, styles.botAvatar]}>
                    <Text style={styles.botInitial}>K</Text>
                  </View>
                ) : (
                  <View style={[styles.avatar, { backgroundColor: '#F8F8F8', borderWidth: 1, borderColor: '#E5E5E5' }]}>
                    <PersonIcon size={24} color="#000000" />
                  </View>
                )
              ) : (
                <View style={styles.avatarSpacer} />
              )}
            </View>
            
            <View style={styles.messageContent}>
              {/* 발신자 이름 (첫 번째 메시지에만 표시) */}
              {!isConsecutive && (
                <View style={styles.senderNameRow}>
                  <Text style={styles.senderName}>
                    {item.senderName || (isBot ? '수리봇' : '알 수 없음')}
                  </Text>
                </View>
              )}
              
              {/* 메시지 버블과 시간 */}
              <View style={styles.otherMessageBubbleRow}>
                {item.messageType === 'room_share' ? (
                  <View style={styles.roomShareWithTimeContainer}>
                    <View style={styles.roomShareContainer}>
                      {(() => {
                        try {
                          const roomData = JSON.parse(item.text);
                          return (
                            <RoomMessageCard 
                              roomData={roomData}
                              onPress={() => {
                                navigation.navigate('RoomDetail', { roomId: roomData.room_id });
                              }}
                              isFavorited={favorites.includes(roomData.room_id)}
                              onFavoriteToggle={() => handleFavoriteToggle(roomData.room_id)}
                            />
                          );
                        } catch (error) {
                          console.error('Failed to parse room share data:', error);
                          console.log('Raw text data:', item.text);
                          return (
                            <View style={styles.errorContainer}>
                              <Text style={styles.errorText}>매물 정보를 불러올 수 없습니다</Text>
                            </View>
                          );
                        }
                      })()}
                    </View>
                    
                    {/* 매물 카드 오른쪽 아래에 시간 표시 */}
                    {isLastInGroup && (
                      <View style={styles.roomShareTimeOverlay}>
                        <Text style={styles.otherTimestamp}>
                          {formatTime(item.timestamp)}
                        </Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={[styles.messageBubble, styles.otherBubble]}>
                    <Text style={[styles.messageText, styles.otherText]}>
                      {item.text}
                    </Text>
                  </View>
                )}
                
                {/* 시간 (일반 메시지이고 그룹의 마지막 메시지에만) */}
                {item.messageType !== 'room_share' && isLastInGroup && (
                  <View style={styles.otherMessageInfo}>
                    <Text style={styles.otherTimestamp}>
                      {formatTime(item.timestamp)}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      );
    }
  };

  const EmptyChat = () => (
    <View style={styles.emptyChatContainer}>
      <View style={styles.emptyChatIcon}>
        <Ionicons name="chatbubble-outline" size={40} color="#ccc" />
      </View>
      <Text style={styles.emptyChatText}>대화를 시작해보세요!</Text>
      <Text style={styles.emptyChatSubText}>
        {otherUser.name}님과의 첫 대화를 나눠보세요
      </Text>
    </View>
  );

  return (
    <View style={styles.outerContainer}>
      <SafeAreaView style={styles.topSafeArea} />
      <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Svg width="21" height="24" viewBox="0 0 21 24" fill="none">
            <Path d="M19 13.5C19.8284 13.5 20.5 12.8284 20.5 12C20.5 11.1716 19.8284 10.5 19 10.5V12V13.5ZM0.939341 10.9393C0.353554 11.5251 0.353554 12.4749 0.939341 13.0607L10.4853 22.6066C11.0711 23.1924 12.0208 23.1924 12.6066 22.6066C13.1924 22.0208 13.1924 21.0711 12.6066 20.4853L4.12132 12L12.6066 3.51472C13.1924 2.92893 13.1924 1.97919 12.6066 1.3934C12.0208 0.807611 11.0711 0.807611 10.4853 1.3934L0.939341 10.9393ZM19 12V10.5L2 10.5V12V13.5L19 13.5V12Z" fill="#494949"/>
          </Svg>
        </TouchableOpacity>
        
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{otherUser.name || '반짝이는스케이트'}</Text>
        </View>
        
        <TouchableOpacity style={styles.menuButton}>
          <PhoneIcon size={28} />
        </TouchableOpacity>
      </View>

      {/* 채팅 메시지 리스트 */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={[
          styles.messagesContainer,
          messages.length === 0 && styles.emptyMessagesContainer
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={!loading && messages.length === 0 ? EmptyChat : null}
      />

      {/* 입력 영역 */}
      <View style={styles.inputContainer}>
        <View style={styles.inputOuterWrapper}>
          <TouchableOpacity style={styles.attachButton}>
            <PlusIcon size={48} backgroundColor="#D9D9D9" iconColor="#595959" />
          </TouchableOpacity>
          
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="메시지를 입력하세요"
              placeholderTextColor="#B3B3B3"
              multiline
              maxLength={1000}
            />
          </View>
          
          <TouchableOpacity 
            style={[styles.sendButton, inputText.trim() ? styles.sendButtonActive : null]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <SendIcon 
              size={20} 
              color={inputText.trim() ? '#00E1A0' : '#8C8C8C'} 
            />
          </TouchableOpacity>
        </View>
      </View>
      </View>
      <SafeAreaView style={styles.bottomSafeArea} />
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: '#F2F2F2',
  },
  topSafeArea: {
    backgroundColor: '#F2F2F2',
  },
  bottomSafeArea: {
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F2F2F2',
    justifyContent: 'space-between',
  },
  userInfo: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#F2F2F2',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#CCCCCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    fontFamily: 'Pretendard',
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  messageContainer: {
    marginBottom: 2,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  myMessageRow: {
    justifyContent: 'flex-end',
  },
  otherMessageRow: {
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    width: 50,
    marginRight: 2,
    alignItems: 'flex-start',
  },
  avatarSpacer: {
    width: 50,
    height: 40,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botAvatar: {
    backgroundColor: '#45DCB1',
  },
  botInitial: {
    color: '#FFFFFF',
    fontSize: 28,
    fontFamily: 'Aquire',
    fontWeight: '700',
  },
  messageContent: {
    flex: 1,
  },
  senderNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 3,
  },
  senderName: {
    color: '#667085',
    fontSize: 13,
    fontFamily: 'Pretendard',
    fontWeight: '500',
  },
  messageBubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    maxWidth: 280,
  },
  myBubble: {
    backgroundColor: '#CDCDCD',
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: '#CDCDCD',
  },
  otherBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#E0E0E0',
  },
  messageText: {
    fontSize: 15.7,
    lineHeight: 21,
    fontFamily: 'Pretendard',
    fontWeight: '400',
  },
  myText: {
    color: '#000000',
  },
  otherText: {
    color: '#000000',
  },
  myMessageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    width: '100%',
  },
  otherMessageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    width: '100%',
  },
  myMessageBubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  otherMessageBubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    marginBottom: 4,
  },
  myMessageInfo: {
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    marginRight: 6,
    marginBottom: 2,
  },
  otherMessageInfo: {
    alignItems: 'flex-start',
    justifyContent: 'flex-end',
    marginLeft: 6,
    marginBottom: 2,
  },
  readStatus: {
    fontSize: 11,
    color: '#FF6600',
    fontFamily: 'Pretendard',
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 2,
  },
  myTimestamp: {
    fontSize: 10,
    color: '#999999',
    fontFamily: 'Pretendard',
  },
  otherTimestamp: {
    fontSize: 10,
    color: '#999999',
    fontFamily: 'Pretendard',
  },
  profileCard: {
    marginTop: 16,
    marginLeft: 53,
    backgroundColor: '#F8F8F8',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  profileAvatar: {
    width: 68,
    height: 68,
    backgroundColor: '#D9D9D9',
    borderRadius: 34,
    marginRight: 12,
  },
  profileContent: {
    flex: 1,
  },
  profileHeader: {
    marginBottom: 9,
  },
  profileName: {
    color: '#474747',
    fontSize: 15,
    fontFamily: 'Pretendard',
    fontWeight: '600',
    marginBottom: 9,
  },
  profileTags: {
    flexDirection: 'row',
    gap: 5,
  },
  tag: {
    backgroundColor: '#E2E2E2',
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  tagText: {
    color: '#343434',
    fontSize: 11,
    fontFamily: 'Pretendard',
    fontWeight: '300',
    opacity: 0.8,
  },
  profileInfo: {
    color: '#343434',
    fontSize: 13,
    fontFamily: 'Pretendard',
    fontWeight: '500',
    opacity: 0.8,
    marginBottom: 4,
  },
  profileQuote: {
    color: '#343434',
    fontSize: 13,
    fontFamily: 'Pretendard',
    fontWeight: '300',
    opacity: 0.8,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 40,
    borderTopWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  },
  inputOuterWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  inputWrapper: {
    flex: 1,
    backgroundColor: '#F2F2F2',
    borderRadius: 24,
    borderWidth: 1.058,
    borderColor: '#D9D9D9',
    paddingHorizontal: 16,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    height: 48,
  },
  textInput: {
    minHeight: 32,
    maxHeight: 120,
    backgroundColor: 'transparent',
    borderRadius: 0,
    borderWidth: 0,
    paddingHorizontal: 0,
    paddingVertical: 8,
    fontSize: 16,
    fontFamily: 'Pretendard',
    fontWeight: '400',
    lineHeight: 20,
    color: '#000000',
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 48,
    height: 48,
    backgroundColor: '#E5E5EA',
    borderRadius: 24,
    borderWidth: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#000000',
    transform: [{ scale: 1.05 }],
  },
  attachButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChatContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyChatIcon: {
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyChatText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#999',
    marginBottom: 8,
  },
  emptyChatSubText: {
    fontSize: 14,
    color: '#bbb',
    textAlign: 'center',
  },
  emptyMessagesContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  roomShareContainer: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingVertical: 4,
    marginVertical: 8,
    width: '100%',
    maxWidth: 300,
  },
  errorContainer: {
    backgroundColor: '#ffebee',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffcdd2',
  },
  errorText: {
    color: '#c62828',
    fontSize: 12,
    textAlign: 'center',
  },
  roomShareWithTimeContainer: {
    position: 'relative',
    width: '100%',
    maxWidth: 300,
  },
  roomShareTimeOverlay: {
    position: 'absolute',
    bottom: -15,
    right: 12,
  },
});