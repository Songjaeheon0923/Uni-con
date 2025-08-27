import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView
} from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import ApiService from "../services/api";
import { generatePersonalityType, generateSubTags, getDefaultPersonalityData, isProfileComplete } from '../utils/personalityUtils';


export default function UserProfileViewScreen({ navigation, route }) {
  const { userId, userName } = route.params;
  const [userData, setUserData] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [personalityData, setPersonalityData] = useState(getDefaultPersonalityData());
  const [loading, setLoading] = useState(true);

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


  useEffect(() => {
    loadUserData();
  }, [userId]);

  // 사용자 프로필이 변경될 때 개성 유형 데이터 업데이트
  useEffect(() => {
    if (userProfile && isProfileComplete(userProfile)) {
      const mainType = generatePersonalityType(userProfile);
      const subTags = generateSubTags(userProfile);
      setPersonalityData({ mainType, subTags });
    }
  }, [userProfile]);

  const loadUserData = async () => {
    try {
      setLoading(true);
      
      // 실제 API를 통해 사용자 데이터 조회
      const response = await ApiService.getUserById(userId);
      
      if (response && response.id) {
        // 기본 사용자 정보 설정
        setUserData({
          id: response.id,
          name: response.name || userName,
          email: response.email,
          phone_number: response.phone_number,
          gender: response.gender,
          school_email: response.school_email,
          created_at: response.created_at,
          age: response.profile?.age
        });
        
        // 프로필 정보 설정
        if (response.profile) {
          setUserProfile({
            age: response.profile.age,
            sleep_type: response.profile.sleep_type,
            home_time: response.profile.home_time,
            cleaning_frequency: response.profile.cleaning_frequency,
            cleaning_sensitivity: response.profile.cleaning_sensitivity,
            smoking_status: response.profile.smoking_status,
            noise_sensitivity: response.profile.noise_sensitivity,
            personality_type: response.profile.personality_type,
            lifestyle_type: response.profile.lifestyle_type,
            budget_range: response.profile.budget_range,
            is_complete: response.profile.is_complete
          });
        }
        
        // 사용자 추가 정보 설정
        if (response.user_info) {
          setUserInfo(response.user_info);
        } else {
          setUserInfo({
            bio: "",
            current_location: "",
            desired_location: "",
            budget: "",
            move_in_date: "",
            lifestyle: "",
            roommate_preference: "",
            introduction: ""
          });
        }
      } else {
        // API에서 데이터를 가져오지 못한 경우 기본값 설정
        setUserData({
          id: userId,
          name: userName,
          email: null,
          age: null,
        });
        setUserProfile(null);
        setUserInfo(null);
      }
      
    } catch (error) {
      console.error('사용자 데이터 로드 실패:', error);
      // 에러 발생 시 기본 데이터 설정
      setUserData({
        id: userId,
        name: userName,
        email: null,
        age: null,
      });
      setUserProfile(null);
      setUserInfo(null);
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

  if (!userData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text>사용자 정보를 찾을 수 없습니다.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>프로필</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 프로필 영역 */}
        <View style={styles.profileSection}>
          {/* 프로필 이미지 */}
          <View style={styles.profileImageContainer}>
            <Ionicons name="person-circle" size={150} color="#ddd" />
          </View>
          
          {/* 이름 */}
          <View style={styles.nameContainer}>
            <Text style={styles.userName}>{userData.name}</Text>
          </View>

          {/* 기본 정보 */}
          <View style={styles.basicInfoRow}>
            <Text style={styles.basicInfoText}>
              {getAgeGroup(userData.age)} · {getGenderText(userData.gender)} · {getSchoolNameFromEmail(userData.school_email)}
            </Text>
          </View>

          {/* 개성 유형 태그 */}
          {personalityData.subTags && personalityData.subTags.length > 0 && (
            <View style={styles.tagsSection}>
              <View style={styles.tagsContainer}>
                {personalityData.subTags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 한줄 소개 */}
          <View style={styles.bioSection}>
            <View style={styles.bioHeader}>
              <Text style={styles.bioLabel}>한줄소개</Text>
            </View>
            <View style={styles.bioContent}>
              <Text style={styles.bioText}>
                {userInfo?.bio || "아직 소개가 없습니다."}
              </Text>
            </View>
          </View>

          {/* 내 정보 테이블 */}
          <View style={styles.infoSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>내 정보</Text>
            </View>
            
            <View style={styles.infoTable}>
              <View style={styles.tableRow}>
                <View style={styles.labelCell}>
                  <Text style={styles.tableLabel}>현재 거주 지역</Text>
                </View>
                <View style={styles.contentCell}>
                  <Text style={styles.tableValue}>
                    {userInfo?.current_location || '정보가 없습니다.'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.tableRow}>
                <View style={styles.labelCell}>
                  <Text style={styles.tableLabel}>희망 거주 지역</Text>
                </View>
                <View style={styles.contentCell}>
                  <Text style={styles.tableValue}>
                    {userInfo?.desired_location || '정보가 없습니다.'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.tableRow}>
                <View style={styles.labelCell}>
                  <Text style={styles.tableLabel}>예산 범위</Text>
                </View>
                <View style={styles.contentCell}>
                  <Text style={styles.tableValue}>
                    {userInfo?.budget || '정보가 없습니다.'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.tableRow}>
                <View style={styles.labelCell}>
                  <Text style={styles.tableLabel}>입주 가능일 / 기간</Text>
                </View>
                <View style={styles.contentCell}>
                  <Text style={styles.tableValue}>
                    {userInfo?.move_in_date || '정보가 없습니다.'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.tableRow}>
                <View style={styles.labelCell}>
                  <Text style={styles.tableLabel}>라이프스타일</Text>
                </View>
                <View style={styles.contentCell}>
                  <Text style={styles.tableValue}>
                    {userInfo?.lifestyle || '정보가 없습니다.'}
                  </Text>
                </View>
              </View>
              
              <View style={styles.tableRow}>
                <View style={styles.labelCell}>
                  <Text style={styles.tableLabel}>원하는 룸메이트</Text>
                </View>
                <View style={styles.contentCell}>
                  <Text style={styles.tableValue}>
                    {userInfo?.roommate_preference || '정보가 없습니다.'}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* 자기소개 테이블 */}
          <View style={styles.introSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>자기소개</Text>
            </View>
            
            <View style={styles.infoTable}>
              <View style={styles.tableRow}>
                <View style={styles.contentCell}>
                  <Text style={styles.tableValue}>
                    {userInfo?.introduction || '정보가 없습니다.'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    fontFamily: 'Pretendard',
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
  tagsSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
    marginTop: -2,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
  },
  tag: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginHorizontal: 2,
    marginVertical: 2,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '400',
  },
  bioSection: {
    width: '100%',
    marginBottom: 32,
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
  bioContent: {
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    padding: 12,
    minHeight: 60,
  },
  bioText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  infoSection: {
    width: '100%',
  },
  introSection: {
    width: '100%',
    marginTop: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  infoTable: {
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    minHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  labelCell: {
    flex: 0.35,
    backgroundColor: '#EFEFEF',
    padding: 16,
    justifyContent: 'center',
  },
  contentCell: {
    flex: 0.65,
    padding: 16,
    justifyContent: 'center',
  },
  tableLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  tableValue: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});