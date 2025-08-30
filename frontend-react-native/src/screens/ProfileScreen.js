import React, { useState, useEffect, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import ApiService from "../services/api";
import { generatePersonalityType, generateSubTags, getDefaultPersonalityData, isProfileComplete } from '../utils/personalityUtils';

// 인증 체크 컴포넌트
const VerificationCheck = ({ verified = true }) => (
  <View style={styles.verificationCheck}>
    <Ionicons
      name={verified ? "checkmark-circle" : "close-circle"}
      size={20}
      color={verified ? "#FF6600" : "#F44336"}
    />
  </View>
);

export default function ProfileScreen({ navigation, user, onLogout }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bio, setBio] = useState('');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);

  // 내 정보 데이터
  const [infoData, setInfoData] = useState({
    currentLocation: '',
    desiredLocation: '',
    budget: '',
    moveInDate: '',
    lifestyle: '',
    roommate: ''
  });

  // 자기소개 데이터
  const [introduction, setIntroduction] = useState('');
  const [isEditingIntroduction, setIsEditingIntroduction] = useState(false);

  // 사용자 프로필 데이터
  const [userProfile, setUserProfile] = useState(null);

  // 개성 유형 데이터
  const [personalityData, setPersonalityData] = useState(getDefaultPersonalityData());

  // refs
  const scrollViewRef = useRef(null);
  const introductionInputRef = useRef(null);
  const bioInputRef = useRef(null);

  // 나이대 계산 함수
  const getAgeGroup = (age) => {
    if (!age) return '';
    if (age >= 19 && age <= 23) return '20대 초반';
    if (age >= 24 && age <= 27) return '20대 중반';
    if (age >= 28 && age <= 30) return '20대 후반';
    if (age >= 31 && age <= 35) return '30대 초반';
    if (age >= 36 && age <= 39) return '30대 후반';
    return `${Math.floor(age / 10)}0대`;
  };

  // 성별 변환 함수
  const getGenderText = (gender) => {
    if (gender === 'male') return '남성';
    if (gender === 'female') return '여성';
    return '';
  };

  // 학교 이메일에서 학교명 추출 함수
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
    loadUserInfo();
    loadUserProfile();
  }, []);

  // 사용자 프로필이 변경될 때 개성 유형 데이터 업데이트
  useEffect(() => {
    if (userProfile && isProfileComplete(userProfile)) {
      const mainType = generatePersonalityType(userProfile);
      const subTags = generateSubTags(userProfile);
      setPersonalityData({ mainType, subTags });
    } else {
      // 프로필이 완성되지 않은 경우 기본값 사용
      setPersonalityData(getDefaultPersonalityData());
    }
  }, [userProfile]);

  // 사용자 프로필 로드
  const loadUserProfile = async () => {
    try {
      const profile = await ApiService.getUserProfile();
      setUserProfile(profile);
    } catch (error) {
      // 401 에러는 AuthContext에서 처리하므로 조용히 넘어감
      if (!error.message || !error.message.includes('401')) {
        console.error('사용자 프로필 로드 실패:', error);
      }
    }
  };

  // 한줄 소개만 저장하는 함수
  const saveBio = async () => {
    try {
      const trimmedBio = bio.trim() || '';
      await ApiService.updateUserBio(trimmedBio);
      setBio(trimmedBio);
      return true;
    } catch (error) {
      console.error('한줄 소개 저장 실패:', error);
      Alert.alert('오류', '한줄 소개 저장에 실패했습니다.');
      return false;
    }
  };

  // 공통 저장 함수
  const saveUserInfo = async () => {
    try {
      const saveData = {
        bio: bio.trim() || '',
        current_location: infoData.currentLocation.trim() || '',
        desired_location: infoData.desiredLocation.trim() || '',
        budget: infoData.budget.trim() || '',
        move_in_date: infoData.moveInDate.trim() || '',
        lifestyle: infoData.lifestyle.trim() || '',
        roommate_preference: infoData.roommate.trim() || '',
        introduction: introduction.trim() || ''
      };
      await ApiService.updateUserInfo(saveData);
      // 저장 후 상태를 trim된 값으로 업데이트
      setBio(saveData.bio);
      setInfoData({
        currentLocation: saveData.current_location,
        desiredLocation: saveData.desired_location,
        budget: saveData.budget,
        moveInDate: saveData.move_in_date,
        lifestyle: saveData.lifestyle,
        roommate: saveData.roommate_preference
      });
      setIntroduction(saveData.introduction);
      return true;
    } catch (error) {
      console.error('사용자 정보 저장 실패:', error);
      Alert.alert('오류', '정보 저장에 실패했습니다.');
      return false;
    }
  };

  const loadUserInfo = async () => {
    try {
      const userInfo = await ApiService.getUserInfo();
      setInfoData({
        currentLocation: userInfo.current_location || '',
        desiredLocation: userInfo.desired_location || '',
        budget: userInfo.budget || '',
        moveInDate: userInfo.move_in_date || '',
        lifestyle: userInfo.lifestyle || '',
        roommate: userInfo.roommate_preference || ''
      });
      setBio(userInfo.bio || '');
      setIntroduction(userInfo.introduction || '');
    } catch (error) {
      console.error('사용자 정보 로드 실패:', error);
    }
  };

  // 화면이 포커스될 때마다 찜 목록 및 사용자 프로필 새로고침
  useFocusEffect(
    React.useCallback(() => {
      loadFavorites();
      // 사용자 프로필 새로고침 (성향 테스트 완료 시 반영)
      loadUserProfile();

      // AsyncStorage에서 찜 변경 감지
      const checkFavoriteChanges = async () => {
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          const lastChanged = await AsyncStorage.getItem('favoriteChanged');
          const lastLoaded = await AsyncStorage.getItem('favoriteLastLoaded');

          if (lastChanged && lastChanged !== lastLoaded) {
            loadFavorites();
            await AsyncStorage.setItem('favoriteLastLoaded', lastChanged);
          }
        } catch (error) {
          console.log('Storage check failed:', error);
        }
      };

      checkFavoriteChanges();
    }, [userData.id])
  );

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
              await ApiService.removeFavorite(roomId);
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
        <Ionicons name={icon} size={20} color="#FF6600" />
        <Text style={styles.profileItemLabel}>{label}</Text>
      </View>
      <View style={styles.profileItemRight}>
        <Text style={styles.profileItemValue}>{value}</Text>
        <Ionicons name="chevron-forward" size={16} color="#ccc" />
      </View>
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* 내 정보 타이틀 - 고정 위치 */}
      <View style={styles.fixedHeaderContainer}>
        <Text style={styles.headerTitle}>내 정보</Text>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 프로필 영역 */}
        <View style={styles.profileSection}>
          {/* 프로필 이미지 */}
          <View style={styles.profileImageContainer}>
            <Ionicons name="person-circle" size={150} color="#ddd" />
          </View>

          {/* 이름과 인증 */}
          <View style={styles.nameContainer}>
            <View style={styles.nameRow}>
              <Text style={styles.userName}>{userData.name}</Text>
              <VerificationCheck verified={true} />
            </View>
          </View>

          {/* 태그 컨테이너 */}
          <View style={styles.tagContainer}>
            {userProfile && isProfileComplete(userProfile) ? (
              // 프로필이 완성된 경우 - 기존 성향 정보 표시
              <>
                {/* 메인 태그와 버튼 */}
                <View style={styles.tagHeader}>
                  <Text style={styles.mainTagText}>{personalityData.mainType}</Text>
                  <TouchableOpacity
                    style={styles.retestButton}
                    onPress={() => {
                      if (navigation && navigation.getParent) {
                        navigation.getParent()?.navigate('PersonalityTest', { from: 'profile' });
                      } else {
                        console.warn('Navigation prop not found');
                      }
                    }}
                  >
                    <Text style={styles.retestButtonText}>다시 테스트하기</Text>
                  </TouchableOpacity>
                </View>

                {/* 서브 태그들 */}
                <View style={styles.subTagsContainer}>
                  <View style={styles.subTagsWrapper}>
                    {personalityData.subTags.map((tag, index) => (
                      <View key={index} style={styles.subTag}>
                        <Text style={styles.subTagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </>
            ) : (
              // 프로필이 완성되지 않은 경우 - 성향 테스트 안내
              <View style={styles.incompleteProfileContainer}>
                <Text style={styles.incompleteProfileTitle}>내 성향을 알아보세요!</Text>
                <Text style={styles.incompleteProfileSubtitle}>
                  성향 테스트를 완료하면 나와 잘 맞는{'\n'}룸메이트를 찾을 수 있어요
                </Text>
                <TouchableOpacity
                  style={styles.personalityTestButton}
                  onPress={() => {
                    if (navigation && navigation.navigate) {
                      // RoommateChoiceScreen으로 이동 (성향 테스트 선택 화면)
                      navigation.navigate('RoommateChoice');
                    }
                  }}
                >
                  <Text style={styles.personalityTestButtonText}>성향 테스트 하러가기</Text>
                  <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* 기본 정보 */}
          <View style={styles.basicInfoRow}>
            <Text style={styles.basicInfoText}>
              {userProfile ?
                `${getAgeGroup(userProfile.age)}${getGenderText(userProfile.gender) ? `, ${getGenderText(userProfile.gender)}` : ''}${getSchoolNameFromEmail(userProfile.school_email) ? `, ${getSchoolNameFromEmail(userProfile.school_email)}` : ''}` :
                '정보 로딩 중...'
              }
            </Text>
          </View>

          {/* 한줄 소개 */}
          <View style={styles.bioSection}>
            <View style={styles.bioHeader}>
              <Text style={styles.bioLabel}>한줄 소개</Text>
              <TouchableOpacity
                style={[styles.editBioButton, isEditingBio && styles.saveButton]}
                onPress={async () => {
                  if (isEditingBio) {
                    const success = await saveBio();
                    if (success) {
                      setIsEditingBio(false);
                      console.log('한줄 소개 저장 완료');
                    }
                  } else {
                    setIsEditingBio(true);
                    setTimeout(() => {
                      bioInputRef.current?.focus();
                    }, 100);
                  }
                }}
              >
                <Text style={[styles.editBioButtonText, isEditingBio && styles.saveButtonText]}>
                  {isEditingBio ? '저장하기' : '수정하기'}
                </Text>
              </TouchableOpacity>
            </View>
            {isEditingBio ? (
              <View>
                <TextInput
                  ref={bioInputRef}
                  style={styles.bioInput}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="한줄 소개를 입력해주세요"
                  maxLength={40}
                  multiline={false}
                  returnKeyType="done"
                  onSubmitEditing={async () => {
                    const success = await saveBio();
                    if (success) {
                      setIsEditingBio(false);
                    }
                  }}
                />
                <Text style={styles.characterCount}>({bio.length}/40)</Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.bioTextContainer}
                onPress={() => {
                  setIsEditingBio(true);
                  setTimeout(() => {
                    bioInputRef.current?.focus();
                  }, 100);
                }}
              >
                <Text style={styles.bioText}>
                  {bio || '한줄 소개를 입력해주세요'}
                </Text>
              </TouchableOpacity>
            )}

            {/* 구분선 */}
            <View style={styles.divider} />
          </View>
        </View>

        {/* 내 정보 섹션 */}
        <View style={styles.infoSection}>
          <View style={styles.infoSectionHeader}>
            <Text style={styles.infoSectionTitle}>내 정보</Text>
            <TouchableOpacity
              style={[styles.editInfoButton, isEditingInfo && styles.saveButton]}
              onPress={async () => {
                if (isEditingInfo) {
                  const success = await saveUserInfo();
                  if (success) {
                    setIsEditingInfo(false);
                    console.log('사용자 정보 저장 완료');
                  }
                } else {
                  setIsEditingInfo(true);
                }
              }}
            >
              <Text style={[styles.editInfoButtonText, isEditingInfo && styles.saveButtonText]}>
                {isEditingInfo ? '저장하기' : '수정하기'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoContainer}>
            <View style={styles.infoTable}>
              <View style={styles.tableRow}>
                <View style={styles.labelCell}>
                  <Text style={styles.tableLabel}>현재 거주 지역</Text>
                </View>
                <View style={styles.contentCell}>
                  {isEditingInfo ? (
                    <TextInput
                      style={styles.tableInput}
                      value={infoData.currentLocation}
                      onChangeText={(text) => setInfoData({...infoData, currentLocation: text})}
                      placeholder="서울 사당동 인근"
                      placeholderTextColor="#999"
                    />
                  ) : (
                    <Text style={styles.tableValue}>
                      {infoData.currentLocation || '입력해주세요'}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.tableRow}>
                <View style={styles.labelCell}>
                  <Text style={styles.tableLabel}>희망 거주 지역</Text>
                </View>
                <View style={styles.contentCell}>
                  {isEditingInfo ? (
                    <TextInput
                      style={styles.tableInput}
                      value={infoData.desiredLocation}
                      onChangeText={(text) => setInfoData({...infoData, desiredLocation: text})}
                      placeholder="성북.종로.동대문구"
                      placeholderTextColor="#999"
                    />
                  ) : (
                    <Text style={styles.tableValue}>
                      {infoData.desiredLocation || '입력해주세요'}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.tableRow}>
                <View style={styles.labelCell}>
                  <Text style={styles.tableLabel}>예산 범위</Text>
                </View>
                <View style={styles.contentCell}>
                  {isEditingInfo ? (
                    <TextInput
                      style={styles.tableInput}
                      value={infoData.budget}
                      onChangeText={(text) => setInfoData({...infoData, budget: text})}
                      placeholder="월 45만~55만 원 (관리비 포함)"
                      placeholderTextColor="#999"
                    />
                  ) : (
                    <Text style={styles.tableValue}>
                      {infoData.budget || '입력해주세요'}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.tableRow}>
                <View style={styles.labelCell}>
                  <Text style={styles.tableLabel}>입주 가능일 / 기간</Text>
                </View>
                <View style={styles.contentCell}>
                  {isEditingInfo ? (
                    <TextInput
                      style={styles.tableInput}
                      value={infoData.moveInDate}
                      onChangeText={(text) => setInfoData({...infoData, moveInDate: text})}
                      placeholder="2025년 9월 초부터 -최소 1년"
                      placeholderTextColor="#999"
                      multiline
                    />
                  ) : (
                    <Text style={styles.tableValue}>
                      {infoData.moveInDate || '입력해주세요'}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.tableRow}>
                <View style={styles.labelCell}>
                  <Text style={styles.tableLabel}>라이프스타일</Text>
                </View>
                <View style={styles.contentCell}>
                  {isEditingInfo ? (
                    <TextInput
                      style={styles.tableInput}
                      value={infoData.lifestyle}
                      onChangeText={(text) => setInfoData({...infoData, lifestyle: text})}
                      placeholder={`기상 시간 : 오전 10시 전후\n취침 시간 : 새벽 2시 전후\n청결도 : 물건은 제자리에, 주 1-2회 청소\n흡연 여부 : 비흡연\n반려동물 : 없음`}
                      placeholderTextColor="#999"
                      multiline
                    />
                  ) : (
                    <Text style={styles.tableValue}>
                      {infoData.lifestyle || '입력해주세요'}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.tableRow}>
                <View style={styles.labelCell}>
                  <Text style={styles.tableLabel}>원하는 룸메이트</Text>
                </View>
                <View style={styles.contentCell}>
                  {isEditingInfo ? (
                    <TextInput
                      style={styles.tableInput}
                      value={infoData.roommate}
                      onChangeText={(text) => setInfoData({...infoData, roommate: text})}
                      placeholder="청결을 중요하게 생각하는 분"
                      placeholderTextColor="#999"
                      multiline
                    />
                  ) : (
                    <Text style={styles.tableValue}>
                      {infoData.roommate || '입력해주세요'}
                    </Text>
                  )}
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 자기소개 섹션 */}
        <View style={styles.introductionSection}>
          <View style={styles.introductionSectionHeader}>
            <Text style={styles.introductionSectionTitle}>자기소개</Text>
            <TouchableOpacity
              style={[styles.editIntroButton, isEditingIntroduction && styles.saveButton]}
              onPress={async () => {
                if (isEditingIntroduction) {
                  const success = await saveUserInfo();
                  if (success) {
                    setIsEditingIntroduction(false);
                    console.log('자기소개 저장 완료');
                  }
                } else {
                  setIsEditingIntroduction(true);
                  // 편집 모드로 전환 후 자동 포커스 및 스크롤
                  setTimeout(() => {
                    introductionInputRef.current?.focus();
                    // 자기소개 섹션으로 스크롤 (간단한 방법)
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }, 150);
                }
              }}
            >
              <Text style={[styles.editIntroButtonText, isEditingIntroduction && styles.saveButtonText]}>
                {isEditingIntroduction ? '저장하기' : '수정하기'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.introductionContainer}>
            {isEditingIntroduction ? (
              <TextInput
                ref={introductionInputRef}
                style={styles.introductionInput}
                value={introduction}
                onChangeText={setIntroduction}
                placeholder="저는 조용하고 깔끔한 생활을 선호합니다. 혼자만의 시간도 즐기지만, 좋은 룸메이트와 함께하는 시간도 소중하게 생각합니다. 남들의 패턴이 너무 이상한 것이면 조금은 어려우나 서로 간단한 정도의 요구 정도는 괜찮습니다."
                placeholderTextColor="#999"
                multiline
                textAlignVertical="top"
                scrollEnabled={true}
                blurOnSubmit={false}
                returnKeyType="default"
                autoFocus={false}
              />
            ) : (
              <Text style={styles.introductionText}>
                {introduction || '입력해주세요'}
              </Text>
            )}
          </View>
        </View>

        {/* 설정 */}
        <View style={styles.settingsSection}>
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
                        onLogout();
                      }
                    }
                  }
                ]
              );
            }}
          >
            <Ionicons name="log-out-outline" size={20} color="#ff4757" />
            <Text style={styles.logoutText}>로그아웃</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
    paddingTop: 120,
  },
  fixedHeaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FAFAFA',
    paddingTop: 80,
    marginBottom: 10,
    paddingBottom: 10,
    alignItems: 'center',
    zIndex: 1000,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  profileSection: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 30,
  },
  profileImageContainer: {
    marginBottom: 5,
    alignItems: 'center',
  },
  nameContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  verificationCheck: {
    marginLeft: 8,
  },
  tagContainer: {
    backgroundColor: '#E8E8E8',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 8,
    marginBottom: 20,
    marginTop: 12,
    width: '95%',
    alignSelf: 'center',
  },
  tagHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mainTagText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    flex: 1,
  },
  retestButton: {
    backgroundColor: '#FF6600',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  retestButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  subTagsContainer: {
    width: '100%',
  },
  subTagsWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  subTag: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginHorizontal: 3,
    marginVertical: 3,
  },
  subTagText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '400',
  },
  basicInfoRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  basicInfoText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  bioSection: {
    width: '100%',
  },
  bioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bioLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  editButton: {
    padding: 4,
  },
  editBioButton: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  editBioButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  bioInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 40,
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  bioTextContainer: {
    minHeight: 40,
    justifyContent: 'center',
  },
  bioText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  divider: {
    height: 2,
    backgroundColor: '#D0D0D0',
    marginHorizontal: 0,
    marginTop: 20,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoSection: {
    marginHorizontal: 4,
    marginTop: 8,
    marginBottom: 20,
  },
  infoSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginHorizontal: 12,
  },
  infoSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  editInfoButton: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  editInfoButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#FF6600',
  },
  saveButtonText: {
    color: '#FFFFFF',
  },
  infoContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 4,
  },
  infoTable: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    minHeight: 60,
    alignItems: 'stretch',
  },
  labelCell: {
    width: 140,
    backgroundColor: '#F0F0F0',
    paddingVertical: 15,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#E0E0E0',
  },
  tableLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  contentCell: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 15,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  tableValue: {
    fontSize: 14,
    color: '#666',
    textAlign: 'left',
    lineHeight: 20,
  },
  tableInput: {
    fontSize: 14,
    color: '#333',
    textAlign: 'left',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 8,
    minHeight: 40,
    textAlignVertical: 'top',
  },
  additionalInfo: {
    marginTop: 8,
  },
  additionalInfoText: {
    fontSize: 14,
    color: '#999',
    marginVertical: 2,
  },
  settingsSection: {
    margin: 16,
    marginTop: 8,
  },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logoutText: {
    fontSize: 16,
    color: '#ff4757',
    marginLeft: 12,
    fontWeight: '500',
  },
  introductionSection: {
    marginHorizontal: 4,
    marginTop: 20,
    marginBottom: 20,
  },
  introductionSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginHorizontal: 12,
  },
  introductionSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  editIntroButton: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  editIntroButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  introductionContainer: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    minHeight: 120,
  },
  introductionInput: {
    fontSize: 14,
    color: '#333',
    textAlign: 'left',
    minHeight: 100,
    lineHeight: 20,
  },
  introductionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'left',
    lineHeight: 20,
    minHeight: 100,
  },
  // 프로필 미완성 상태 스타일들
  incompleteProfileContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  incompleteProfileTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  incompleteProfileSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  personalityTestButton: {
    backgroundColor: '#666666',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  personalityTestButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
