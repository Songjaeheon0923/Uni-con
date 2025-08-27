import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import ApiService from '../services/api';

export default function MatchResultsScreen({ navigation }) {
  const [matches, setMatches] = useState([
    {
      user_id: 1,
      name: "반짝이는스케이트", 
      age: "20대 중반",
      gender: "여성",
      university: "성신여대",
      compatibility_score: 0.80,
      message: "반갑습니다! 깨끗한 집 약속드려요 :)"
    },
    {
      user_id: 2,
      name: "멧돼지사슴",
      age: "20대 중반", 
      gender: "여성",
      university: "성신여대",
      compatibility_score: 0.79,
      message: "저는 야행성이고, 아침에 늦게 일어나는 편입니다."
    },
    {
      user_id: 3,
      name: "반짝이는스케이트",
      age: "20대 중반",
      gender: "여성", 
      university: "성신여대",
      compatibility_score: 0.80,
      message: "반갑습니다! 깨끗한 집 약속드려요 :)"
    }
  ]);
  const [loading, setLoading] = useState(false);

  const handleRetakeTest = () => {
    navigation.navigate('PersonalityTest');
  };

  const handleContactUser = (user) => {
    Alert.alert('채팅 신청', `${user.name}님에게 채팅을 신청하시겠습니까?`);
  };

  const getCompatibilityText = (score) => {
    if (score >= 0.8) return '좋음';
    if (score >= 0.6) return '보통';
    return '나쁨';
  };

  const renderUserCard = (user, index) => (
    <View key={user.user_id} style={styles.userCard}>
      {/* 프로필 이미지 */}
      <View style={styles.profileImageBg}>
        <View style={styles.profileImage}>
          <Ionicons name="person" size={34} color="#595959" />
        </View>
      </View>

      {/* 사용자 정보 */}
      <View style={styles.userInfoSection}>
        <Text style={styles.userName}>{user.name}</Text>
        <View style={styles.userDetails}>
          <Text style={styles.userDetailsText}>{user.age}, {user.gender}, {user.university}</Text>
          <View style={styles.dotIndicator} />
          <View style={styles.cameraIcon}>
            <Ionicons name="camera" size={6} color="white" />
          </View>
        </View>
      </View>

      {/* 매칭률 */}
      <View style={styles.matchingSection}>
        <Text style={styles.scorePercentage}>{Math.round(user.compatibility_score * 100)}%</Text>
        <Text style={styles.scoreLabel}>{getCompatibilityText(user.compatibility_score)}</Text>
      </View>

      {/* 메시지 (프로필 이미지 아래) */}
      <View style={styles.messageWrapper}>
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>&quot; {user.message} &quot;</Text>
        </View>
      </View>

      {/* 구분선 */}
      <View style={styles.separator} />

      {/* 카테고리 태그들 */}
      <View style={styles.categorySection}>
        <View style={styles.categoryRow}>
          <View style={styles.categoryItem}>
            <Ionicons name="bed" size={16} color="#10B585" />
            <Text style={styles.categoryText}>수면패턴</Text>
            <View style={[styles.statusDot, {backgroundColor: '#10B585'}]}>
              <Ionicons name="checkmark" size={10} color="white" />
            </View>
          </View>
          <View style={styles.categoryItem}>
            <Ionicons name="time" size={16} color="#FC6339" />
            <Text style={styles.categoryText}>시간대</Text>
            <View style={[styles.statusDot, {backgroundColor: '#FC6339'}]}>
              <Ionicons name="close" size={10} color="white" />
            </View>
          </View>
        </View>
        <View style={styles.categoryRow}>
          <View style={styles.categoryItem}>
            <Ionicons name="brush" size={16} color="#10B585" />
            <Text style={styles.categoryText}>청소습관</Text>
            <View style={[styles.statusDot, {backgroundColor: '#10B585'}]}>
              <Ionicons name="checkmark" size={10} color="white" />
            </View>
          </View>
          <View style={styles.categoryItem}>
            <Ionicons name="ban" size={16} color="#10B585" />
            <Text style={styles.categoryText}>흡연여부</Text>
            <View style={[styles.statusDot, {backgroundColor: '#10B585'}]}>
              <Ionicons name="checkmark" size={10} color="white" />
            </View>
          </View>
        </View>
      </View>

      {/* 채팅 신청하기 버튼 */}
      <TouchableOpacity 
        style={styles.chatButton}
        onPress={() => handleContactUser(user)}
      >
        <Text style={styles.chatButtonText}>채팅 신청하기</Text>
        <View style={styles.arrowIcon}>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </View>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>매칭 결과를 분석하는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 영역 */}
      <View style={styles.headerContainer}>

        {/* 헤더 상단 라인 (모든 요소들이 같은 높이) */}
        <View style={styles.headerTopLine}>
          {/* 뒤로가기 버튼 + 제목 + 정보 아이콘 */}
          <View style={styles.leftSection}>
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={() => navigation.goBack()}
            >
              <Svg width="21" height="24" viewBox="0 0 21 24" fill="none">
                <Path d="M19 13.5C19.8284 13.5 20.5 12.8284 20.5 12C20.5 11.1716 19.8284 10.5 19 10.5V12V13.5ZM0.939341 10.9393C0.353554 11.5251 0.353554 12.4749 0.939341 13.0607L10.4853 22.6066C11.0711 23.1924 12.0208 23.1924 12.6066 22.6066C13.1924 22.0208 13.1924 21.0711 12.6066 20.4853L4.12132 12L12.6066 3.51472C13.1924 2.92893 13.1924 1.97919 12.6066 1.3934C12.0208 0.807611 11.0711 0.807611 10.4853 1.3934L0.939341 10.9393ZM19 12V10.5L2 10.5V12V13.5L19 13.5V12Z" fill="#494949"/>
              </Svg>
            </TouchableOpacity>
            
            <Text style={styles.headerTitle}>룸메이트 매칭</Text>
            <Ionicons 
              name="information-circle-outline" 
              size={20} 
              color="#494949" 
              style={styles.infoIcon} 
            />
          </View>

          {/* 테스트 다시하기 버튼 */}
          <TouchableOpacity style={styles.retestButton} onPress={handleRetakeTest}>
            <Text style={styles.retestButtonText}>테스트 다시하기</Text>
          </TouchableOpacity>
        </View>

        {/* 결과 제목 */}
        <Text style={styles.resultTitle}>5명의 룸메이트를 찾았어요 !</Text>

        {/* 결과 설명 */}
        <Text style={styles.resultDescription}>
          성격 유형과 생활 패턴을 분석하여{"\n"}유빈님에게 가장 잘 맞는 순서로 정렬했습니다.
        </Text>
      </View>
      
      {/* 헤더와 카드들 사이 그라데이션 그림자 */}
      <LinearGradient
        colors={['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.08)', 'rgba(0,0,0,0)']}
        locations={[0, 0.5, 1]}
        style={styles.shadowGradient}
        pointerEvents="none"
      />
      
      <ScrollView 
        style={{ marginTop: 243 }}
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 매칭 결과 카드 컴포넌트 */}
        {matches.map(renderUserCard)}
      </ScrollView>
      
      {/* 하단 네비게이션 바 */}
      <View style={styles.bottomNavigation}>
        <View style={styles.navContainer}>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="home" size={28} color="#10B585" />
            <Text style={[styles.navText, {color: '#10B585'}]}>홈</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="map-outline" size={28} color="#C0C0C0" />
            <Text style={styles.navText}>지도</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="heart-outline" size={28} color="#C0C0C0" />
            <Text style={styles.navText}>관심목록</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="person-outline" size={28} color="#C0C0C0" />
            <Text style={styles.navText}>내 정보</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F2F2F2',
    borderRadius: 40,
    overflow: 'hidden',
    position: 'relative',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    width: '100%',
    height: 243,
    left: 0,
    top: 0,
    position: 'absolute',
    backgroundColor: '#F2F2F2',
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10,
  },
  statusBar: {
    width: 412,
    height: 40,
    paddingLeft: 16,
    paddingRight: 16,
    left: 0,
    top: 0,
    position: 'absolute',
    backgroundColor: '#F2F2F2',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLeft: {
    width: 128,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    color: '#171D1B',
    fontSize: 14,
    fontFamily: 'Roboto',
    fontWeight: '400',
    lineHeight: 20,
    letterSpacing: 0.25,
  },
  statusRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 2,
  },
  headerTopLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 63,
    height: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 2,
  },
  backButton: {
    padding: 10,
  },
  retestButton: {
    paddingHorizontal: 13,
    paddingVertical: 0,
    height: 34,
    backgroundColor: '#FC6339',
    borderRadius: 20,
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retestButtonText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Pretendard',
    fontWeight: '500',
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: 16,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    color: 'black',
    fontSize: 18,
    fontFamily: 'Pretendard',
    fontWeight: '600',
    marginLeft: 12,
    marginRight: 6,
  },
  infoIcon: {
    marginLeft: 2,
  },
  resultTitle: {
    position: 'absolute',
    left: 72,
    top: 130,
    textAlign: 'center',
    color: '#1C1C1C',
    fontSize: 24,
    fontFamily: 'Pretendard',
    fontWeight: '600',
    lineHeight: 33.6,
  },
  resultDescription: {
    position: 'absolute',
    left: 71,
    top: 176,
    textAlign: 'center',
    color: '#565656',
    fontSize: 15,
    fontFamily: 'Pretendard',
    fontWeight: '400',
    lineHeight: 21,
  },
  userCard: {
    width: 382,
    height: 270,
    backgroundColor: 'white',
    position: 'relative',
    borderRadius: 18,
    shadowColor: 'rgba(0, 0, 0, 0.10)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 12,
    marginLeft: 'auto',
    marginRight: 'auto',
    overflow: 'visible',
  },
  chatButton: {
    width: 344,
    height: 47,
    position: 'absolute',
    left: 19,
    top: 205,
    backgroundColor: 'black',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingLeft: 87,
    paddingRight: 87,
    paddingVertical: 0,
    gap: 10,
  },
  chatButtonText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Pretendard Variable',
    fontWeight: '600',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: 20,
  },
  arrowIcon: {
    position: 'absolute',
    right: 15,
    width: 32,
    height: 32,
    backgroundColor: '#FC6339',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageWrapper: {
    position: 'absolute',
    left: 19,
    top: 80,
    maxWidth: 320,
  },
  messageContainer: {
    backgroundColor: '#10B585',
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  messageText: {
    opacity: 0.8,
    color: 'white',
    fontSize: 12,
    fontFamily: 'Pretendard',
    fontWeight: '500',
    wordWrap: 'break-word',
    textAlign: 'center',
    width: '100%',
    lineHeight: 16,
    includeFontPadding: false,
    paddingBottom: 0,
    paddingTop: 0,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  userInfoSection: {
    width: 147.24,
    position: 'absolute',
    left: 83,
    top: 22,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    display: 'flex',
  },
  userName: {
    color: '#474747',
    fontSize: 16,
    fontFamily: 'Pretendard Variable',
    fontWeight: '700',
    lineHeight: 28.96,
    wordWrap: 'break-word',
  },
  userDetails: {
    alignSelf: 'stretch',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 2,
    display: 'flex',
  },
  userDetailsText: {
    opacity: 0.8,
    color: '#343434',
    fontSize: 13,
    fontFamily: 'Pretendard',
    fontWeight: '400',
    wordWrap: 'break-word',
  },
  matchingSection: {
    width: 83,
    position: 'absolute',
    left: 280,
    top: 18,
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 3,
    display: 'flex',
    minHeight: 60,
  },
  scorePercentage: {
    textAlign: 'center',
    color: '#10B585',
    fontSize: 32,
    fontFamily: 'Pretendard Variable',
    fontWeight: '800',
    lineHeight: 38,
    wordWrap: 'break-word',
    width: '100%',
    includeFontPadding: false,
    paddingBottom: 0,
    paddingTop: 0,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  scoreLabel: {
    textAlign: 'center',
    color: 'black',
    fontSize: 13,
    fontFamily: 'Pretendard Variable',
    fontWeight: '700',
    lineHeight: 18,
    wordWrap: 'break-word',
    width: '100%',
    includeFontPadding: false,
    paddingBottom: 0,
    paddingTop: 0,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  profileImageBg: {
    width: 53,
    height: 53,
    position: 'absolute',
    left: 19,
    top: 18,
    backgroundColor: '#F2F2F2',
    borderRadius: 9999,
  },
  profileImage: {
    width: 34,
    height: 34,
    position: 'absolute',
    left: 9.5,
    top: 9.5,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsSection: {
    position: 'absolute',
    left: 19,
    top: 95,
    width: 344,
  },
  tagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    flex: 1,
  },
  tagIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 4,
  },
  bottomNavigation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 15,
    paddingBottom: 30,
    height: '100%',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    color: '#C0C0C0',
  },
  separator: {
    position: 'absolute',
    left: 19,
    right: 19,
    top: 115,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  categorySection: {
    position: 'absolute',
    left: 19,
    right: 19,
    top: 125,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 15,
    paddingVertical: 4,
  },
  categoryText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
    flex: 1,
    fontFamily: 'Pretendard',
    fontWeight: '500',
  },
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginLeft: 'auto',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shadowGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 243,
    height: 20,
    zIndex: 5,
  },
});