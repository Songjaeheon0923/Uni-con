import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';

const DUMMY_CHATS = [
  {
    id: 1,
    name: '반짝이는스케이트',
    info: '20대 중반, 여성, 성신여자대학교',
    tags: ['청결함', '올빼미', '비흡연'],
    lastMessage: '새 메시지 2개',
    time: '2시간',
    hasUnread: true,
    isIndividual: true,
    avatar: null,
  },
  {
    id: 2,
    name: '독특한 타란튤라',
    info: '20대 초반, 여성, 고려대학교', 
    tags: ['청결함', '올빼미', '비흡연'],
    lastMessage: '새 메시지 2개',
    time: '3시간',
    hasUnread: true,
    isIndividual: false,
    avatar: null,
  },
];

const FILTER_OPTIONS = [
  { id: 'all', title: '전체', isSelected: true },
  { id: 'request', title: '채팅신청', isSelected: false },
  { id: 'room', title: '매물추천', isSelected: false },
  { id: 'roommate', title: '룸메제안', isSelected: false },
  { id: 'landlord', title: '집주인포함', isSelected: false },
];

export default function ChatListScreen({ navigation }) {
  const [selectedFilter, setSelectedFilter] = useState('all');

  const renderChatItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.chatItem}
      onPress={() => {
        // 개별 채팅 화면으로 이동 (구현 예정)
        // navigation.navigate('Chat', { chatId: item.id });
      }}
    >
      {/* 프로필 이미지 */}
      <View style={styles.avatarContainer}>
        {item.isIndividual ? (
          <View style={styles.singleAvatar} />
        ) : (
          <View style={styles.groupAvatarContainer}>
            <View style={[styles.groupAvatar, styles.groupAvatar1]} />
            <View style={[styles.groupAvatar, styles.groupAvatar2]} />
          </View>
        )}
      </View>

      {/* 채팅 정보 */}
      <View style={styles.chatInfo}>
        {/* 상단 정보 */}
        <View style={styles.topInfo}>
          <Text style={styles.userInfo}>{item.info}</Text>
          <View style={styles.statusIndicators}>
            <View style={styles.onlineIndicator}>
              <Ionicons name="checkmark" size={8} color="white" />
            </View>
          </View>
        </View>

        {/* 이름과 태그 */}
        <View style={styles.nameAndTags}>
          <Text style={styles.userName}>{item.name}</Text>
          <View style={styles.tagsContainer}>
            {item.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 마지막 메시지 */}
        <View style={styles.bottomInfo}>
          <Text style={[
            styles.lastMessage, 
            item.hasUnread ? styles.unreadMessage : styles.readMessage
          ]}>
            {item.lastMessage}
          </Text>
          <Text style={styles.timeText}>{item.time}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

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
          data={DUMMY_CHATS}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.chatList}
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
  chatItem: {
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    padding: 12,
    marginBottom: 15,
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  singleAvatar: {
    width: 68,
    height: 68,
    backgroundColor: '#D9D9D9',
    borderRadius: 34,
  },
  groupAvatarContainer: {
    width: 68,
    height: 48,
    position: 'relative',
  },
  groupAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#CFCFCF',
    position: 'absolute',
  },
  groupAvatar1: {
    left: 0,
    backgroundColor: '#D9D9D9',
  },
  groupAvatar2: {
    right: 0,
    backgroundColor: '#BCBCBC',
  },
  chatInfo: {
    flex: 1,
  },
  topInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userInfo: {
    fontSize: 12,
    fontWeight: '300',
    color: '#343434',
    opacity: 0.8,
  },
  statusIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  onlineIndicator: {
    width: 12,
    height: 12,
    backgroundColor: '#B5B5B5',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameAndTags: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#474747',
    marginRight: 9,
  },
  tagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tag: {
    backgroundColor: '#E2E2E2',
    borderRadius: 9,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginRight: 5,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '300',
    color: '#343434',
    opacity: 0.8,
  },
  bottomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
  },
  unreadMessage: {
    fontWeight: '500',
    color: '#343434',
    opacity: 0.8,
  },
  readMessage: {
    fontWeight: '300',
    color: '#343434',
    opacity: 0.8,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '300',
    color: '#929292',
    opacity: 0.8,
  },
});