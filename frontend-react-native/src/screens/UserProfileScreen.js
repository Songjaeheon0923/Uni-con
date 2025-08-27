import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { generatePersonalityType, generateSubTags, getDefaultPersonalityData, isProfileComplete } from '../utils/personalityUtils';
import ApiService from '../services/api';

export default function UserProfileScreen({ route, navigation }) {
  const { userId, roomId } = route.params;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [recommendationMessage, setRecommendationMessage] = useState('');
  const [room, setRoom] = useState(null);

  useEffect(() => {
    loadUserProfile();
  }, [userId]);

  // 백엔드와 동일한 매칭 알고리즘 (utils/matching.py 기반)
  const calculateDetailedCompatibility = (myProfile, otherProfile) => {
    let score = 0.0;
    let totalWeight = 0.0;
    const details = {};

    // 1. 기상/취침 시간 호환성 (가중치: 0.2)
    const sleepWeight = 0.2;
    if (myProfile.sleep_type === otherProfile.sleep_type) {
      score += sleepWeight * 1.0;
      details.sleepScore = 100;
    } else {
      score += sleepWeight * 0.3;
      details.sleepScore = 30;
    }
    totalWeight += sleepWeight;

    // 2. 청소 빈도 + 민감도 호환성 (가중치: 0.35)
    const cleaningWeight = 0.35;
    let cleaningScore = 0;
    
    // 청소 빈도 호환성
    const freqCompatibility = {
      "daily-daily": 1.0, "daily-weekly": 0.6, "daily-as_needed": 0.2,
      "weekly-weekly": 1.0, "weekly-as_needed": 0.7, "as_needed-as_needed": 1.0
    };
    const freqKey = `${myProfile.cleaning_frequency}-${otherProfile.cleaning_frequency}`;
    const freqReverseKey = `${otherProfile.cleaning_frequency}-${myProfile.cleaning_frequency}`;
    const freqScore = freqCompatibility[freqKey] || freqCompatibility[freqReverseKey] || 0.5;
    
    // 청소 민감도 호환성
    const sensCompatibility = {
      "very_sensitive-very_sensitive": 1.0, "very_sensitive-normal": 0.6, "very_sensitive-not_sensitive": 0.1,
      "normal-normal": 1.0, "normal-not_sensitive": 0.8, "not_sensitive-not_sensitive": 1.0
    };
    const sensKey = `${myProfile.cleaning_sensitivity}-${otherProfile.cleaning_sensitivity}`;
    const sensReverseKey = `${otherProfile.cleaning_sensitivity}-${myProfile.cleaning_sensitivity}`;
    const sensScore = sensCompatibility[sensKey] || sensCompatibility[sensReverseKey] || 0.5;
    
    cleaningScore = (freqScore + sensScore) / 2;
    score += cleaningWeight * cleaningScore;
    details.cleanlinessScore = Math.round(cleaningScore * 100);
    totalWeight += cleaningWeight;

    // 3. 흡연 호환성 (가중치: 0.25) - 가장 중요
    const smokingWeight = 0.25;
    const smokingCompatibility = {
      "non_smoker_strict-non_smoker_strict": 1.0, "non_smoker_strict-non_smoker_ok": 1.0,
      "non_smoker_strict-smoker_indoor_no": 0.3, "non_smoker_strict-smoker_indoor_yes": 0.0,
      "non_smoker_ok-non_smoker_ok": 1.0, "non_smoker_ok-smoker_indoor_no": 0.8,
      "non_smoker_ok-smoker_indoor_yes": 0.4, "smoker_indoor_no-smoker_indoor_no": 1.0,
      "smoker_indoor_no-smoker_indoor_yes": 0.6, "smoker_indoor_yes-smoker_indoor_yes": 1.0
    };
    const smokingKey = `${myProfile.smoking_status}-${otherProfile.smoking_status}`;
    const smokingReverseKey = `${otherProfile.smoking_status}-${myProfile.smoking_status}`;
    const smokingScore = smokingCompatibility[smokingKey] || smokingCompatibility[smokingReverseKey] || 0.5;
    score += smokingWeight * smokingScore;
    details.lifestyleScore = Math.round(smokingScore * 100);
    totalWeight += smokingWeight;

    // 4. 소음 민감도 호환성 (가중치: 0.2)
    const noiseWeight = 0.2;
    const noiseCompatibility = {
      "sensitive-sensitive": 1.0, "sensitive-normal": 0.7, "sensitive-not_sensitive": 0.3,
      "normal-normal": 1.0, "normal-not_sensitive": 0.8, "not_sensitive-not_sensitive": 1.0
    };
    const noiseKey = `${myProfile.noise_sensitivity}-${otherProfile.noise_sensitivity}`;
    const noiseReverseKey = `${otherProfile.noise_sensitivity}-${myProfile.noise_sensitivity}`;
    const noiseScore = noiseCompatibility[noiseKey] || noiseCompatibility[noiseReverseKey] || 0.5;
    score += noiseWeight * noiseScore;
    details.livingRangeScore = Math.round(noiseScore * 100);
    totalWeight += noiseWeight;

    const totalScore = totalWeight > 0 ? Math.round((score / totalWeight) * 100) : 0;
    
    return {
      totalScore,
      sleepScore: details.sleepScore,
      cleanlinessScore: details.cleanlinessScore,
      lifestyleScore: details.lifestyleScore,
      livingRangeScore: details.livingRangeScore
    };
  };

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      
      let userName = '사용자';
      let userTags = [];
      let userAge = null;
      let userGender = null;
      let userSchoolEmail = null;
      let userBio = '';
      let userCurrentArea = '';
      let userPreferredLocation = '';
      let userBudget = '';
      let userMoveInDate = '';
      let userSelfIntro = '';
      let userWantedRoommate = '';
      let compatibilityData = null;
      
      // 실제 API에서 이름과 태그, 기본 정보 가져오기 (내 정보 화면과 동일한 방식)
      if (userId) {
        try {
          const userProfile = await ApiService.getUserById(userId);
          if (userProfile) {
            userName = userProfile.name || '사용자';
            userAge = userProfile.profile?.age || null;
            userGender = userProfile.gender;
            userSchoolEmail = userProfile.school_email;
            userBio = userProfile.user_info?.bio || '';
            userCurrentArea = userProfile.user_info?.current_location || '';
            userPreferredLocation = userProfile.user_info?.desired_location || '';
            userBudget = userProfile.user_info?.budget || '';
            userMoveInDate = userProfile.user_info?.move_in_date || '';
            userSelfIntro = userProfile.user_info?.introduction || '';
            userWantedRoommate = userProfile.user_info?.roommate_preference || '';
            
            // 프로필이 있으면 내 정보 화면과 동일한 태그 생성 로직 사용
            const profile = userProfile.profile || userProfile;
            if (isProfileComplete(profile)) {
              userTags = generateSubTags(profile);
            }
            // 프로필이 미완성인 경우 빈 배열 유지 (태그 없음)
            
            // 나와의 궁합 점수 계산 (내 프로필과 비교)
            try {
              const myProfile = await ApiService.getUserProfile();
              console.log('내 프로필:', myProfile);
              console.log('다른 사용자 프로필:', userProfile.profile);
              console.log('내 프로필 완성도:', isProfileComplete(myProfile));
              console.log('다른 사용자 프로필 완성도:', isProfileComplete(userProfile.profile));
              
              if (myProfile && userProfile.profile && isProfileComplete(myProfile) && isProfileComplete(userProfile.profile)) {
                compatibilityData = calculateDetailedCompatibility(myProfile, userProfile.profile);
                console.log('계산된 궁합 점수:', compatibilityData);
              } else {
                console.log('프로필 조건 미충족 - 기본 궁합 점수 사용');
              }
            } catch (error) {
              console.log('내 프로필 로드 실패, 기본 궁합 점수 사용:', error);
            }
          }
        } catch (apiError) {
          // API 호출 실패 시 기본값 사용
          console.log('API 호출 실패, 기본값 사용:', apiError);
        }
      }
      
      // ProfileScreen과 동일한 로직으로 나이대, 성별, 학교 계산
      const getAgeGroup = (age) => {
        if (!age) return '';
        if (age >= 19 && age <= 23) return '20대 초반';
        if (age >= 24 && age <= 27) return '20대 중반';
        if (age >= 28 && age <= 30) return '20대 후반';
        if (age >= 31 && age <= 35) return '30대 초반';
        if (age >= 36 && age <= 39) return '30대 후반';
        return `${Math.floor(age / 10)}0대`;
      };
      
      const getGenderText = (gender) => {
        if (gender === 'male') return '남성';
        if (gender === 'female') return '여성';
        return '';
      };
      
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
      
      const ageGroupText = getAgeGroup(userAge) || '';
      const genderText = getGenderText(userGender) || '';
      const schoolText = getSchoolNameFromEmail(userSchoolEmail) || '';
      
      // 더미 방 데이터
      setRoom({
        id: roomId,
        price_deposit: 3000,
        price_monthly: 45,
        room_type: '원룸',
        room_size: '6평',
        floor: '4층',
        address: '안암역 10분 거리',
        management_fee: 7,
        verification_status: 'verified',
        images: ['https://via.placeholder.com/100x100/f0f0f0/666?text=매물']
      });
      
      // 더미 데이터
      setUser({
        id: userId,
        name: userName,
        tags: userTags,
        age: 20,
        gender: '여성',
        school: '성신여자대학교',
        ageGroupText,
        genderText,
        schoolText,
        bio: userBio,
        matchScore: compatibilityData?.totalScore || 88,
        compatibilityDetails: compatibilityData || {
          sleepScore: 85,
          cleanlinessScore: 80,
          lifestyleScore: 90,
          livingRangeScore: 95
        },
        profileImage: null,
        budget: userBudget || '정보 없음',
        moveInDate: userMoveInDate || '정보 없음',
        preferredLocation: userPreferredLocation || '정보 없음',
        currentArea: userCurrentArea || '정보 없음',
        weekdaySchedule: '오전 10시 전후',
        weekendSchedule: '새벽 2시 전후',
        lifeStyle: '청결도 : 물건은 제자리에, 주 1~2회 청소',
        soundSensitivity: '음연 여부 : 비흡연',
        petPolicy: '반려동물: 없음',
        selfIntro: userSelfIntro || '정보 없음',
        wantedRoommate: userWantedRoommate || '정보 없음'
      });
    } catch (error) {
      console.error('사용자 프로필 로드 실패:', error);
    } finally {
      setLoading(false);
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
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>룸메이트 구하기</Text>
        <TouchableOpacity>
          <Ionicons name="bookmark-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 프로필 섹션 */}
        <View style={styles.profileSection}>
          <View style={styles.profileAvatar}>
            {user.profileImage ? (
              <Image source={{ uri: user.profileImage }} style={styles.avatarImage} />
            ) : (
              <Ionicons name="person" size={60} color="#999" />
            )}
          </View>
          
          <Text style={styles.profileName}>{user.name}</Text>
          
          <View style={styles.profileTags}>
            {user.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
          
          <Text style={styles.profileInfo}>
            {user.ageGroupText}{user.genderText ? `, ${user.genderText}` : ''}{user.schoolText ? `, ${user.schoolText}` : ''}
          </Text>
          
          <Text style={styles.profileBio}>{user.bio}</Text>
        </View>

        {/* 나와의 궁합 점수 */}
        <View style={styles.compatibilitySection}>
          <Text style={styles.sectionTitle}>나와의 궁합 점수</Text>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreNumber}>{user.matchScore}</Text>
            <Text style={styles.scoreLabel}>%</Text>
          </View>
          <View style={styles.scoreDetails}>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreItemLabel}>청결도</Text>
              <View style={styles.scoreBar}>
                <View style={[styles.scoreBarFill, { width: `${user.compatibilityDetails.cleanlinessScore}%` }]} />
              </View>
            </View>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreItemLabel}>라이프스타일</Text>
              <View style={styles.scoreBar}>
                <View style={[styles.scoreBarFill, { width: `${user.compatibilityDetails.lifestyleScore}%` }]} />
              </View>
            </View>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreItemLabel}>취침시간</Text>
              <View style={styles.scoreBar}>
                <View style={[styles.scoreBarFill, { width: `${user.compatibilityDetails.sleepScore}%` }]} />
              </View>
            </View>
            <View style={styles.scoreItem}>
              <Text style={styles.scoreItemLabel}>생활범위</Text>
              <View style={styles.scoreBar}>
                <View style={[styles.scoreBarFill, { width: `${user.compatibilityDetails.livingRangeScore}%` }]} />
              </View>
            </View>
          </View>
        </View>

        {/* 거주 희망 정보 */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>현재 거주 지역</Text>
            <Text style={styles.infoValue}>{user.currentArea}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>희망 거주 지역</Text>
            <Text style={styles.infoValue}>{user.preferredLocation}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>예산 범위</Text>
            <Text style={styles.infoValue}>{user.budget}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>입주 가능일 / 기간</Text>
            <Text style={styles.infoValue}>{user.moveInDate}</Text>
          </View>
        </View>

        {/* 라이프스타일 */}
        <View style={styles.lifestyleSection}>
          <Text style={styles.sectionTitle}>라이프스타일</Text>
          <View style={styles.lifestyleGrid}>
            <View style={styles.lifestyleItem}>
              <Text style={styles.lifestyleLabel}>기상 시간 : 오전 10시 전후</Text>
            </View>
            <View style={styles.lifestyleItem}>
              <Text style={styles.lifestyleLabel}>취침 시간 : 새벽 2시 전후</Text>
            </View>
            <View style={styles.lifestyleItem}>
              <Text style={styles.lifestyleLabel}>청결도 : 물건은 제자리에, 주 1~2회 청소</Text>
            </View>
            <View style={styles.lifestyleItem}>
              <Text style={styles.lifestyleLabel}>음연 여부 : 비흡연</Text>
            </View>
            <View style={styles.lifestyleItem}>
              <Text style={styles.lifestyleLabel}>반려동물: 없음</Text>
            </View>
          </View>
          
          <Text style={styles.introTitle}>원하는 룸메이트</Text>
          <Text style={styles.introText}>
            {user.wantedRoommate}
          </Text>
        </View>

        {/* 자기소개 */}
        <View style={styles.selfIntroSection}>
          <Text style={styles.sectionTitle}>자기소개</Text>
          <Text style={styles.selfIntroText}>{user.selfIntro}</Text>
        </View>
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={styles.floatingButtonContainer}>
        <TouchableOpacity 
          style={styles.floatingButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.floatingButtonText}>매물 추천하기</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* 매물 추천 모달 */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {/* 모달 헤더 */}
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>매물 추천하기</Text>
              <View style={{ width: 24 }} />
            </View>

            {/* 매물 정보 */}
            {room && (
              <View style={styles.modalRoomInfo}>
                <Image 
                  source={{ uri: room.images[0] }}
                  style={styles.modalRoomImage}
                />
                <View style={styles.modalRoomDetails}>
                  <Text style={styles.modalRoomPrice}>
                    전세 {room.price_deposit}만원 / 월세 {room.price_monthly}만원
                  </Text>
                  <Text style={styles.modalRoomInfo1}>
                    {room.room_type} | {room.room_size} | {room.floor}
                  </Text>
                  <Text style={styles.modalRoomAddress}>
                    관리비 {room.management_fee}만원 | {room.address}
                  </Text>
                  <View style={styles.modalVerificationBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#FF6600" />
                    <Text style={styles.modalVerificationText}>집주인 인증</Text>
                  </View>
                </View>
              </View>
            )}

            {/* 사용자 정보 */}
            {user && (
              <View style={styles.modalUserInfo}>
                <View style={styles.modalUserAvatar}>
                  {user.profileImage ? (
                    <Image source={{ uri: user.profileImage }} style={styles.modalAvatarImage} />
                  ) : (
                    <Ionicons name="person" size={40} color="#999" />
                  )}
                </View>
                <View style={styles.modalUserDetails}>
                  <Text style={styles.modalUserName}>{user.name}</Text>
                  <View style={styles.modalUserTags}>
                    {user.tags.slice(0, 3).map((tag, index) => (
                      <View key={index} style={styles.modalTag}>
                        <Text style={styles.modalTagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.modalUserBio}>{user.bio}</Text>
                </View>
              </View>
            )}

            {/* 한 줄 소개 입력 */}
            <View style={styles.modalInputSection}>
              <TextInput
                style={styles.modalTextInput}
                placeholder="매물 추천 시 전달할 한 줄 소개를 적어주세요."
                placeholderTextColor="#999"
                value={recommendationMessage}
                onChangeText={setRecommendationMessage}
                multiline
                maxLength={100}
              />
            </View>

            {/* 추천하기 버튼 */}
            <TouchableOpacity 
              style={styles.modalRecommendButton}
              onPress={() => {
                // 추천 로직 구현
                console.log('매물 추천:', recommendationMessage);
                setModalVisible(false);
                setRecommendationMessage('');
              }}
            >
              <Text style={styles.modalRecommendButtonText}>매물 추천하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 8,
    borderBottomColor: '#f5f5f5',
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  profileTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 14,
    color: '#666',
  },
  profileInfo: {
    fontSize: 16,
    color: '#666',
    marginBottom: 12,
  },
  profileBio: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 24,
  },
  compatibilitySection: {
    padding: 20,
    borderBottomWidth: 8,
    borderBottomColor: '#f5f5f5',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  scoreNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: '#333',
  },
  scoreLabel: {
    fontSize: 16,
    color: '#666',
  },
  scoreDetails: {
    gap: 12,
  },
  scoreItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreItemLabel: {
    fontSize: 14,
    color: '#666',
    width: 100,
  },
  scoreBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  scoreBarFill: {
    height: '100%',
    backgroundColor: '#FF6600',
    borderRadius: 4,
  },
  infoSection: {
    padding: 20,
    borderBottomWidth: 8,
    borderBottomColor: '#f5f5f5',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
    marginLeft: 20,
  },
  lifestyleSection: {
    padding: 20,
    borderBottomWidth: 8,
    borderBottomColor: '#f5f5f5',
  },
  lifestyleGrid: {
    gap: 16,
    marginBottom: 24,
  },
  lifestyleItem: {
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  lifestyleLabel: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  introTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  introText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  selfIntroSection: {
    padding: 20,
    marginBottom: 80,
  },
  selfIntroText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  floatingButtonContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  floatingButton: {
    backgroundColor: '#000',
    paddingVertical: 18,
    paddingHorizontal: 48,
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  modalRecommendButton: {
    backgroundColor: '#666',
    paddingVertical: 16,
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  modalRecommendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});