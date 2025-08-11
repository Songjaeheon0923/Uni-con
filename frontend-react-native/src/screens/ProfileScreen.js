import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  FlatList 
} from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import ApiService from "../services/api";

export default function ProfileScreen({ user, onLogout }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // 사용자 정보 (로그인된 사용자 또는 기본값)
  const userData = user ? {
    id: user.id,
    name: user.name,
    email: user.email,
    university: "서울대학교", // 추후 사용자 프로필에서 가져오기
    age: 22, // 추후 사용자 프로필에서 가져오기
  } : {
    id: "1",
    name: "김대학생",
    email: "student@example.com",
    university: "서울대학교",
    age: 22,
  };

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    setLoading(true);
    try {
      const favoriteData = await ApiService.getUserFavorites(String(userData.id));
      setFavorites(favoriteData);
    } catch (error) {
      console.error('찜 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (roomId) => {
    Alert.alert(
      '찜 삭제',
      '이 방을 찜 목록에서 제거하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '삭제', 
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiService.removeFavorite(roomId, String(userData.id));
              setFavorites(favorites.filter(room => room.room_id !== roomId));
              Alert.alert('성공', '찜 목록에서 제거되었습니다.');
            } catch (error) {
              Alert.alert('오류', '삭제에 실패했습니다.');
            }
          }
        }
      ]
    );
  };

  const renderFavoriteItem = ({ item }) => (
    <View style={styles.favoriteCard}>
      <View style={styles.favoriteInfo}>
        <Text style={styles.favoriteAddress} numberOfLines={1}>
          {item.address}
        </Text>
        <View style={styles.favoriteDetails}>
          <Text style={styles.favoriteType}>{item.transaction_type}</Text>
          <Text style={styles.favoritePrice}>
            {item.price_deposit}만원
            {item.price_monthly > 0 && ` / ${item.price_monthly}만원`}
          </Text>
        </View>
        <Text style={styles.favoriteArea}>{item.area}㎡ • 위험도 {item.risk_score}/10</Text>
      </View>
      <TouchableOpacity 
        style={styles.removeButton}
        onPress={() => handleRemoveFavorite(item.room_id)}
      >
        <Ionicons name="heart" size={24} color="#ff4757" />
      </TouchableOpacity>
    </View>
  );

  const ProfileSection = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const ProfileItem = ({ icon, label, value, onPress }) => (
    <TouchableOpacity style={styles.profileItem} onPress={onPress}>
      <View style={styles.profileItemLeft}>
        <Ionicons name={icon} size={20} color="#007AFF" />
        <Text style={styles.profileItemLabel}>{label}</Text>
      </View>
      <View style={styles.profileItemRight}>
        <Text style={styles.profileItemValue}>{value}</Text>
        <Ionicons name="chevron-forward" size={16} color="#ccc" />
      </View>
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 프로필 헤더 */}
      <View style={styles.header}>
        <View style={styles.profileImageContainer}>
          <Ionicons name="person-circle" size={80} color="#007AFF" />
        </View>
        <Text style={styles.userName}>{userData.name}</Text>
        <Text style={styles.userEmail}>{userData.email}</Text>
      </View>

      {/* 기본 정보 */}
      <ProfileSection title="기본 정보">
        <ProfileItem 
          icon="school" 
          label="대학교" 
          value={userData.university}
          onPress={() => Alert.alert('정보', '대학교 정보를 수정할 수 있습니다.')}
        />
        <ProfileItem 
          icon="calendar" 
          label="나이" 
          value={`${userData.age}세`}
          onPress={() => Alert.alert('정보', '나이 정보를 수정할 수 있습니다.')}
        />
        <ProfileItem 
          icon="settings" 
          label="프로필 설정" 
          value="완료"
          onPress={() => Alert.alert('프로필', '라이프스타일 설문을 다시 진행할 수 있습니다.')}
        />
      </ProfileSection>

      {/* 찜 목록 */}
      <ProfileSection title={`내 찜 목록 (${favorites.length}개)`}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>찜 목록을 불러오는 중...</Text>
          </View>
        ) : favorites.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={40} color="#ccc" />
            <Text style={styles.emptyText}>찜한 방이 없습니다</Text>
            <Text style={styles.emptySubtext}>마음에 드는 방을 찜해보세요!</Text>
          </View>
        ) : (
          <FlatList
            data={favorites}
            renderItem={renderFavoriteItem}
            keyExtractor={(item) => item.room_id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        )}
        
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={loadFavorites}
        >
          <Ionicons name="refresh" size={16} color="#007AFF" />
          <Text style={styles.refreshButtonText}>새로고침</Text>
        </TouchableOpacity>
      </ProfileSection>

      {/* 앱 설정 */}
      <ProfileSection title="설정">
        <ProfileItem 
          icon="notifications" 
          label="알림 설정" 
          value="켜짐"
          onPress={() => Alert.alert('알림', '알림 설정을 관리할 수 있습니다.')}
        />
        <ProfileItem 
          icon="help-circle" 
          label="도움말" 
          value=""
          onPress={() => Alert.alert('도움말', '자주 묻는 질문과 사용법을 확인할 수 있습니다.')}
        />
        <ProfileItem 
          icon="information-circle" 
          label="앱 정보" 
          value="v1.0.0"
          onPress={() => Alert.alert('앱 정보', 'Uni-con v1.0.0\n대학생을 위한 방 찾기 앱')}
        />
        <TouchableOpacity 
          style={styles.logoutButton}
          onPress={() => {
            Alert.alert(
              '로그아웃',
              '정말 로그아웃 하시겠습니까?',
              [
                { text: '취소', style: 'cancel' },
                { 
                  text: '로그아웃', 
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await ApiService.logout();
                      onLogout();
                    } catch (error) {
                      console.error('로그아웃 실패:', error);
                      onLogout(); // API 실패해도 로컬에서는 로그아웃 진행
                    }
                  }
                }
              ]
            );
          }}
        >
          <View style={styles.profileItemLeft}>
            <Ionicons name="log-out-outline" size={20} color="#ff4757" />
            <Text style={[styles.profileItemLabel, { color: '#ff4757' }]}>로그아웃</Text>
          </View>
        </TouchableOpacity>
      </ProfileSection>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profileImageContainer: {
    marginBottom: 15,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  userEmail: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 10,
    marginHorizontal: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    padding: 20,
    paddingBottom: 10,
    backgroundColor: '#f9f9f9',
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileItemLabel: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  profileItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileItemValue: {
    fontSize: 16,
    color: '#666',
    marginRight: 10,
  },
  favoriteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  favoriteInfo: {
    flex: 1,
  },
  favoriteAddress: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 5,
  },
  favoriteDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  favoriteType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
    marginRight: 10,
  },
  favoritePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  favoriteArea: {
    fontSize: 14,
    color: '#666',
  },
  removeButton: {
    padding: 5,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  refreshButtonText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 5,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
});
