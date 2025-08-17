import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

export default function FavoritedUsersScreen({ route, navigation }) {
  const { roomId } = route.params;
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavoritedUsers();
  }, [roomId]);

  const loadFavoritedUsers = async () => {
    try {
      setLoading(true);
      const favoritedUsers = await ApiService.getRoomFavorites(roomId);
      
      // 궁합 점수로 정렬 (높은 순)
      const sortedUsers = favoritedUsers.sort((a, b) => 
        (b.compatibility_score || 0) - (a.compatibility_score || 0)
      );
      
      setUsers(sortedUsers);
    } catch (error) {
      console.error('찜한 사용자 목록 로드 실패:', error);
      Alert.alert('오류', '찜한 사용자 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleUserPress = (user) => {
    // 사용자 프로필로 이동
    navigation.navigate('UserProfile', { userId: user.user_id });
  };

  const getCompatibilityColor = (score) => {
    if (score >= 80) return '#4CAF50';
    if (score >= 60) return '#FF9800';
    if (score >= 40) return '#FFC107';
    return '#F44336';
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
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>찜한 사람들</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        <Text style={styles.subtitle}>궁합 점수 순으로 정렬됨</Text>
        
        {users.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>아직 찜한 사람이 없습니다</Text>
          </View>
        ) : (
          users.map((user, index) => (
            <TouchableOpacity
              key={user.user_id}
              style={styles.userCard}
              onPress={() => handleUserPress(user)}
            >
              <View style={styles.userRank}>
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>
              
              <View style={styles.userAvatar}>
                {user.profile_image ? (
                  <Image source={{ uri: user.profile_image }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>
                      {user.name ? user.name.charAt(0) : '?'}
                    </Text>
                  </View>
                )}
              </View>
              
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{user.name || '익명'}</Text>
                <Text style={styles.userBio} numberOfLines={1}>
                  {user.bio || '자기소개가 없습니다'}
                </Text>
                <View style={styles.userTags}>
                  {user.school && (
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>{user.school}</Text>
                    </View>
                  )}
                  {user.gender && (
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>
                        {user.gender === 'M' ? '남성' : '여성'}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
              
              <View style={styles.scoreContainer}>
                <Text 
                  style={[
                    styles.scoreText, 
                    { color: getCompatibilityColor(user.compatibility_score || 0) }
                  ]}
                >
                  {user.compatibility_score || 0}%
                </Text>
                <Text style={styles.scoreLabel}>궁합</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 44,
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
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userRank: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  userAvatar: {
    marginRight: 12,
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userBio: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  userTags: {
    flexDirection: 'row',
    gap: 8,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 24,
    fontWeight: '700',
  },
  scoreLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
});