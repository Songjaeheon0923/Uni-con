import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import InfoIcon from '../components/InfoIcon';
import UserMatchCard from '../components/UserMatchCard';
import ApiService from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function MatchResultsScreen({ navigation }) {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);

  useEffect(() => {
    loadMatches();
  }, []);

  const loadMatches = async () => {
    try {
      setLoading(true);
      const matchesData = await ApiService.getMatches();
      setMatches(matchesData);
      setError(null);
    } catch (error) {
      console.error('매칭 데이터 로드 실패:', error);
      setError('매칭 데이터를 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleRetakeTest = () => {
    navigation.navigate('RoommateChoice');
  };

  const handleSendMessage = async (user, message) => {
    try {
      // 기존 채팅방이 있는지 확인
      const response = await ApiService.getChatRooms();
      const chatRooms = Array.isArray(response) ? response : (response?.rooms || []);

      const existingRoom = chatRooms.find(room =>
        room.participants && room.participants.some(participant => participant.user_id === user.user_id)
      );

      let roomId;
      if (existingRoom) {
        // 기존 채팅방이 있으면 해당 채팅방 사용
        roomId = existingRoom.room_id;
      } else {
        // 새 채팅방 생성
        const newRoom = await ApiService.createChatRoom(
          'individual',
          [user.user_id],
          `${user.nickname || user.name}님과의 채팅`
        );
        roomId = newRoom.room_id;
      }

      // 메시지 전송
      if (message && message.trim()) {
        await ApiService.sendMessage(roomId, message.trim());
      }

      // 채팅 화면으로 이동 (MainTabs를 통해 네비게이션해서 TabBar 숨김)
      navigation.navigate('MainTabs', {
        screen: '홈',
        params: {
          screen: 'Chat',
          params: {
            roomId: roomId,
            otherUser: {
              user_id: user.user_id,
              name: user.name,
              university: user.university,
              age: user.age,
              gender: user.gender
            }
          }
        }
      });
    } catch (error) {
      console.error('채팅방 생성/찾기 실패:', error);
      Alert.alert('오류', '채팅방을 만드는데 실패했습니다. 다시 시도해주세요.');
    }
  };

  const getCompatibilityText = (score) => {
    if (score >= 0.8) return '좋음';
    if (score >= 0.6) return '보통';
    return '나쁨';
  };

  // 나이대 계산 함수 (ProfileScreen.js와 동일)
  const getAgeGroup = (age) => {
    if (!age) return '';
    if (age >= 19 && age <= 23) return '20대 초반';
    if (age >= 24 && age <= 27) return '20대 중반';
    if (age >= 28 && age <= 30) return '20대 후반';
    if (age >= 31 && age <= 35) return '30대 초반';
    if (age >= 36 && age <= 39) return '30대 후반';
    return `${Math.floor(age / 10)}0대`;
  };

  // 성별 변환 함수 (ProfileScreen.js와 동일)
  const getGenderText = (gender) => {
    if (gender === 'male') return '남성';
    if (gender === 'female') return '여성';
    return '';
  };

  // 학교 이메일에서 학교명 추출 함수 (ProfileScreen.js와 동일)
  const getSchoolNameFromEmail = (schoolEmail) => {
    if (!schoolEmail) return '';

    // @를 기준으로 도메인 추출
    const domain = schoolEmail.split('@')[1];
    if (!domain) return '';

    // 일반적인 학교 도메인 패턴 매칭
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

    // 정확한 매칭이 있으면 사용
    if (schoolPatterns[domain]) {
      return schoolPatterns[domain];
    }

    // 없으면 도메인에서 학교명 추출 시도 (university, univ 등 제거)
    let schoolName = domain
      .replace('.ac.kr', '')
      .replace('.edu', '')
      .replace('university', '')
      .replace('univ', '')
      .replace('.', '');

    // 첫글자 대문자로 변환하고 '대학교' 추가
    if (schoolName && schoolName.length > 0) {
      return schoolName.charAt(0).toUpperCase() + schoolName.slice(1) + '대학교';
    }

    return '';
  };

  const getLifestyleCompatibility = (matchingDetails) => {
    const categories = [
      {
        key: 'sleep_type_match',
        label: '수면패턴',
        icon: 'bed'
      },
      {
        key: 'home_time_compatible',
        label: '시간대',
        icon: 'time'
      },
      {
        key: 'cleaning_frequency_compatible',
        label: '청소습관',
        icon: 'brush'
      },
      {
        key: 'smoking_compatible',
        label: '흡연여부',
        icon: 'ban'
      }
    ];

    return categories.map(category => ({
      ...category,
      isCompatible: matchingDetails[category.key] === true
    }));
  };

  const renderUserCard = (user, index) => (
    <UserMatchCard
      key={user.user_id}
      user={user}
      index={index}
      onPress={handleSendMessage}
    />
  );

  const renderUserCardOld = (user, index) => (
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
          <Text style={styles.userDetailsText}>
            {getAgeGroup(user.age)}{getGenderText(user.gender) ? `, ${getGenderText(user.gender)}` : ''}{getSchoolNameFromEmail(user.university) ? `, ${getSchoolNameFromEmail(user.university)}` : ''}
          </Text>
          <View style={styles.dotIndicator} />
          <View style={styles.cameraIcon}>
            <Ionicons name="camera" size={6} color="white" />
          </View>
        </View>
      </View>

      {/* 매칭률 */}
      <View style={styles.matchingSection}>
        <Text style={[
          styles.scorePercentage,
          Math.round(user.compatibility_score * 100) === 100 && styles.scorePercentage100
        ]}>{Math.round(user.compatibility_score * 100)}%</Text>
        <Text style={styles.scoreLabel}>{getCompatibilityText(user.compatibility_score)}</Text>
      </View>

      {/* 메시지 (프로필 이미지 아래) */}
      <View style={styles.messageWrapper}>
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>&quot; {user.message || '안녕하세요! 좋은 룸메이트가 되고싶습니다 :)'} &quot;</Text>
        </View>
      </View>

      {/* 구분선 */}
      <View style={styles.separator} />

      {/* 카테고리 태그들 */}
      <View style={styles.categorySection}>
        {(() => {
          const compatibility = getLifestyleCompatibility(user.matching_details || {});
          const firstRow = compatibility.slice(0, 2);
          const secondRow = compatibility.slice(2, 4);

          return (
            <>
              <View style={styles.categoryRow}>
                {firstRow.map((category, idx) => (
                  <View key={category.key} style={styles.categoryItem}>
                    <Ionicons
                      name={category.icon}
                      size={16}
                      color={category.isCompatible ? "#10B585" : "#FC6339"}
                    />
                    <Text style={styles.categoryText}>{category.label}</Text>
                    <View style={[styles.statusDot, {
                      backgroundColor: category.isCompatible ? '#10B585' : '#FC6339'
                    }]}>
                      <Ionicons
                        name={category.isCompatible ? "checkmark" : "close"}
                        size={10}
                        color="white"
                      />
                    </View>
                  </View>
                ))}
              </View>
              <View style={styles.categoryRow}>
                {secondRow.map((category, idx) => (
                  <View key={category.key} style={styles.categoryItem}>
                    <Ionicons
                      name={category.icon}
                      size={16}
                      color={category.isCompatible ? "#10B585" : "#FC6339"}
                    />
                    <Text style={styles.categoryText}>{category.label}</Text>
                    <View style={[styles.statusDot, {
                      backgroundColor: category.isCompatible ? '#10B585' : '#FC6339'
                    }]}>
                      <Ionicons
                        name={category.isCompatible ? "checkmark" : "close"}
                        size={10}
                        color="white"
                      />
                    </View>
                  </View>
                ))}
              </View>
            </>
          );
        })()}
      </View>

      {/* 채팅 신청하기 버튼 */}
      <TouchableOpacity
        style={styles.chatButton}
        onPress={() => handleContactUser(user)}
      >
        <Text style={styles.chatButtonText}>채팅 신청하기</Text>
        <View style={styles.arrowIcon}>
          <Ionicons name="arrow-forward" size={22} color="white" />
        </View>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>매칭 결과를 분석하는 중...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadMatches}>
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </TouchableOpacity>
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
            <TouchableOpacity onPress={() => setShowInfoModal(true)}>
              <InfoIcon width={30} height={30} />
            </TouchableOpacity>
          </View>

          {/* 테스트 다시하기 버튼 */}
          <TouchableOpacity style={styles.retestButton} onPress={handleRetakeTest}>
            <Text style={styles.retestButtonText}>테스트 다시하기</Text>
          </TouchableOpacity>
        </View>

        {/* 결과 제목 */}
        <Text style={styles.resultTitle}>
          {matches.length > 0 ? `${matches.length}명의 룸메이트를 찾았어요 !` : '매칭 결과가 없습니다'}
        </Text>

        {/* 결과 설명 */}
        <Text style={styles.resultDescription}>
          성격 유형과 생활 패턴을 분석하여{"\n"}{user?.name ? user.name.slice(1) : '사용자'}님에게 가장 잘 맞는 순서로 정렬했습니다.
        </Text>
      </View>



      <ScrollView
        style={{ marginTop: 243 }}
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 매칭 결과 카드 컴포넌트 */}
        {matches.map(renderUserCard)}
      </ScrollView>

      {/* 매칭 시스템 설명 모달 */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showInfoModal}
        onRequestClose={() => setShowInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.infoModalContainer}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowInfoModal(false)}
            >
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>

            <Text style={styles.modalTitle}>룸메이트 매칭 규칙</Text>

            {/* 제목 아래 구분선 */}
            <View style={styles.modalTitleSeparator} />

            <View style={styles.matchingRulesContainer}>
              <View style={styles.ruleItem}>
                <View style={styles.ruleIconContainer}>
                  <Ionicons name="time-outline" size={20} color="black" />
                </View>
                <View style={styles.ruleContent}>
                  <Text style={styles.ruleTitle}>시간대 차이 선호</Text>
                  <Text style={styles.ruleDescription}>집에 머무는 시간이 다를 때 더 높은 점수 부여</Text>
                </View>
              </View>

              <View style={styles.ruleItem}>
                <View style={styles.ruleIconContainer}>
                  <Ionicons name="sparkles-outline" size={20} color="black" />
                </View>
                <View style={styles.ruleContent}>
                  <Text style={styles.ruleTitle}>청소 기준 종합 평가</Text>
                  <Text style={styles.ruleDescription}>청소 빈도와 민감도를 모두 고려한 세밀한 매칭</Text>
                </View>
              </View>

              <View style={styles.ruleItem}>
                <View style={styles.ruleIconContainer}>
                  <Ionicons name="warning-outline" size={20} color="black" />
                </View>
                <View style={styles.ruleContent}>
                  <Text style={styles.ruleTitle}>흡연 여부 완전 구분</Text>
                  <Text style={styles.ruleDescription}>엄격한 비흡연자와 흡연자는 절대 매칭하지 않음</Text>
                </View>
              </View>
            </View>

            {/* 3가지 기준 아래 구분선 */}
            <View style={styles.modalRulesSeparator} />

            <Text style={styles.modalFooterText}>
              <Text style={styles.footerNormalText}>이룸만의 </Text>
              <Text style={styles.footerOrangeText}>종합 매칭 알고리즘</Text>
              <Text style={styles.footerNormalText}>을 통해{'\n'}</Text>
              <Text style={styles.footerGreenText}>최적의 룸메이트</Text>
              <Text style={styles.footerNormalText}>를 연결합니다.</Text>
            </Text>
          </View>
        </View>
      </Modal>

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
    backgroundColor: '#F2F2F2',
  },
  loadingText: {
    fontSize: 16,
    color: '#565656',
    fontFamily: 'Pretendard',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#FC6339',
    fontFamily: 'Pretendard',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#FC6339',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Pretendard',
    fontWeight: '600',
  },
  headerContainer: {
    width: '100%',
    height: 243,
    left: 0,
    top: 0,
    position: 'absolute',
    backgroundColor: '#F2F2F2',
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 2,
    shadowRadius: 3,
    elevation: 2,
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
    height: 30,
    backgroundColor: '#FC6339',
    borderRadius: 20,
    shadowColor: 'rgba(0, 0, 0, 0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 3,
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
    marginRight: 3,
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
    height: 50,
    position: 'absolute',
    left: 19,
    top: 203,
    backgroundColor: 'black',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    paddingLeft: 60,
    paddingRight: 60,
    paddingVertical: 0,
    shadowColor: 'rgba(0, 0, 0, 0.15)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 6,
  },
  chatButtonText: {
    color: 'white',
    fontSize: 15,
    fontFamily: 'Pretendard Variable',
    fontWeight: '600',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  arrowIcon: {
    position: 'absolute',
    right: 12,
    width: 36,
    height: 36,
    backgroundColor: '#FC6339',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: 'rgba(252, 99, 57, 0.3)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
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
    alignSelf: 'flex-start',
    justifyContent: 'flex-start',
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
  scorePercentage100: {
    fontSize: 29,
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
  separator: {
    position: 'absolute',
    left: 19,
    right: 19,
    top: 115,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoModalContainer: {
    width: 308,
    height: 385,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 0,
    shadowColor: 'rgba(0, 0, 0, 0.25)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 4,
    position: 'relative',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 10,
    padding: 5,
  },
  modalTitle: {
    width: 282,
    height: 20,
    position: 'absolute',
    left: 13,
    top: 25.71,
    textAlign: 'center',
    color: 'black',
    fontSize: 20,
    fontFamily: 'Pretendard',
    fontWeight: '600',
    lineHeight: 22,
  },
  matchingRulesContainer: {
    width: 285,
    position: 'absolute',
    left: 11,
    top: 90,
    flexDirection: 'column',
    gap: 18,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ruleIconContainer: {
    width: 46,
    height: 46,
    backgroundColor: 'white',
    borderRadius: 23,
    borderWidth: 1,
    borderColor: '#DEDEDE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ruleContent: {
    flex: 1,
    flexDirection: 'column',
    gap: 5,
  },
  ruleTitle: {
    color: 'black',
    fontSize: 15,
    fontFamily: 'Pretendard',
    fontWeight: '600',
    lineHeight: 18,
    flexWrap: 'nowrap',
  },
  ruleDescription: {
    color: '#595959',
    fontSize: 12,
    fontFamily: 'Pretendard',
    fontWeight: '400',
    lineHeight: 14,
    flexWrap: 'nowrap',
  },
  modalTitleSeparator: {
    width: 282,
    height: 1,
    backgroundColor: '#999999',
    position: 'absolute',
    left: 13,
    top: 60,
  },
  modalRulesSeparator: {
    width: 282,
    height: 1,
    backgroundColor: '#E0E0E0',
    position: 'absolute',
    left: 13,
    top: 310,
  },
  modalFooterText: {
    width: 282,
    position: 'absolute',
    left: 13,
    top: 320,
    textAlign: 'center',
    lineHeight: 24,
  },
  footerNormalText: {
    color: 'black',
    fontSize: 16,
    fontFamily: 'Pretendard',
    fontWeight: '600',
    lineHeight: 24,
  },
  footerOrangeText: {
    color: '#FC6339',
    fontSize: 16,
    fontFamily: 'Pretendard',
    fontWeight: '600',
    lineHeight: 24,
  },
  footerGreenText: {
    color: '#10B585',
    fontSize: 16,
    fontFamily: 'Pretendard',
    fontWeight: '600',
    lineHeight: 24,
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
