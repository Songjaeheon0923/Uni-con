import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

const ShareRoomScreen = ({ navigation, route }) => {
  const { roomData } = route.params;
  const [selectedChats, setSelectedChats] = useState([]);
  const [chatList, setChatList] = useState([]);

  useEffect(() => {
    loadChatList();
  }, []);

  const loadChatList = async () => {
    try {
      // API에서 채팅 목록을 가져오는 대신 임시 데이터 사용
      const mockChats = [
        { id: '1', name: '반짝이는스케이트', school: '20대 초반, 여성, 성신여자대학교', lastMessage: '새 메시지 2개', time: '24시간', tags: ['창업혁신', '음메이', '비용절'] },
        { id: '2', name: '독특한 타타블라', school: '20대 초반, 여성, 고려대학교', lastMessage: '새 메시지 2개', time: '4시간', tags: ['창업혁신', '음메이', '비용절'] },
        { id: '3', name: '웃는나방화살', school: '20대 초반, 여성, 건국대학교', lastMessage: '8/15 20시 집넘다 오세요 :)', time: '3시간', tags: ['창업혁신', '음메이', '비용절'] },
        { id: '4', name: '백고로김치수뷔', school: '20대 초반, 여성, 고려대학교', lastMessage: '고려대 23학번 다초입니다!', time: '5시간', tags: ['창업혁신', '음메이', '비용절'] },
        { id: '5', name: '속초칠갈국수', school: '20대 초반, 여성, 고려대학교', lastMessage: '계약 이미 완료되었습니다ᅟᅟᅟᅟᅟ 아쉽네요', time: '7시간', tags: ['창업혁신', '음메이', '비용절'] },
      ];
      setChatList(mockChats);
    } catch (error) {
      console.error('채팅 목록 로드 실패:', error);
    }
  };

  const toggleChatSelection = (chatId) => {
    setSelectedChats(prev => 
      prev.includes(chatId) 
        ? prev.filter(id => id !== chatId)
        : [...prev, chatId]
    );
  };

  const handleShare = async () => {
    if (selectedChats.length === 0) {
      return;
    }

    try {
      // 선택된 채팅방에 매물 정보 공유
      for (const chatId of selectedChats) {
        await ApiService.shareRoom(chatId, roomData);
      }
      
      // 채팅 리스트로 이동
      navigation.navigate('MainTabs', {
        screen: '홈',
        params: {
          screen: 'ChatList'
        }
      });
    } catch (error) {
      console.error('매물 공유 실패:', error);
      Alert.alert('오류', '매물 공유에 실패했습니다.');
    }
  };

  const renderChatItem = ({ item }) => (
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
          <View style={styles.groupProfileContainer}>
            <Ionicons name="person-circle" size={56} color="#ddd" style={styles.groupProfile1} />
            <Ionicons name="person-circle" size={56} color="#bbb" style={styles.groupProfile2} />
          </View>
        </View>
      </View>

      {/* 콘텐츠 섹션 */}
      <View style={styles.contentSection}>
        {/* 첫 번째 줄: 사용자 정보 */}
        <View style={styles.userInfoLine}>
          <Text style={styles.userInfoText}>{item.school}</Text>
        </View>

        {/* 두 번째 줄: 이름과 태그 */}
        <View style={styles.nameTagLine}>
          <Text style={styles.nameText}>{item.name}</Text>
          <View style={styles.tagsList}>
            {item.tags.map((tag, index) => (
              <View key={index} style={styles.tagBox}>
                <Text style={styles.tagLabel}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 세 번째 줄: 메시지와 시간 */}
        <View style={styles.messageTimeLine}>
          <Text style={styles.messageText} numberOfLines={1} ellipsizeMode="tail">
            {item.lastMessage}
          </Text>
          <Text style={styles.timeLabel}>{item.time}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>공유 상대 선택</Text>
        <TouchableOpacity 
          onPress={handleShare}
          disabled={selectedChats.length === 0}
        >
          <Text style={[
            styles.confirmButton,
            selectedChats.length === 0 ? styles.confirmButtonDisabled : styles.confirmButtonEnabled
          ]}>
            {selectedChats.length > 0 ? `${selectedChats.length} 확인` : '확인'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity style={[styles.filterButton, styles.selectedFilterButton]}>
          <Text style={styles.selectedFilterButtonText}>전체</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterButtonText}>채팅진행</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterButtonText}>매물추천</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterButtonText}>룸메이트</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton}>
          <Text style={styles.filterButtonText}>집구인포캄</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.chatListContainer}>
        <FlatList
          data={chatList}
          keyExtractor={(item) => item.id}
          renderItem={renderChatItem}
          style={styles.chatList}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
};

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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  confirmButton: {
    position: 'absolute',
    right: 20,
    top: 20,
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButtonDisabled: {
    color: '#C0C0C0',
  },
  confirmButtonEnabled: {
    color: '#000',
  },
  filterContainer: {
    paddingHorizontal: 14,
    marginTop: 20,
    marginBottom: 18,
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
  chatRow: {
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  selectedChatItem: {
    backgroundColor: 'rgba(16, 181, 133, 0.20)',
    borderColor: '#10B585',
  },
  avatarSection: {
    marginRight: 12,
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImageContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupProfileContainer: {
    width: 80,
    height: 80,
    position: 'relative',
  },
  groupProfile1: {
    position: 'absolute',
    left: 0,
    top: 10,
    zIndex: 1,
  },
  groupProfile2: {
    position: 'absolute',
    right: 0,
    top: 10,
    zIndex: 0,
  },
  contentSection: {
    flex: 1,
    flexDirection: 'column',
    gap: 2,
    justifyContent: 'center',
  },
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
  messageTimeLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  messageText: {
    fontSize: 15,
    fontFamily: 'Pretendard',
    flex: 1,
    marginRight: 8,
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
});

export default ShareRoomScreen;