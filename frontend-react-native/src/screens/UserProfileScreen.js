import React, { useState, useEffect } from "react";
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
  TouchableWithoutFeedback,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from "@expo/vector-icons";
import { generateSubTags, isProfileComplete } from "../utils/personalityUtils";
import ApiService from "../services/api";
import { Alert } from "react-native";
import SpeechBubble from "../components/SpeechBubble";
import UserProfileIcon from "../components/UserProfileIcon";
import CheckIcon from "../components/CheckIcon";

export default function UserProfileScreen({ route, navigation }) {
  const { userId, roomId } = route?.params || {};
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [recommendationMessage, setRecommendationMessage] = useState("저도 이 매물이 마음에 들어요!");
  const [room, setRoom] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
    if (userId) {
      loadUserProfile();
    }
  }, [userId]);

  const handleSendMessage = async () => {
    if (isSending || isSent) return;

    try {
      setIsSending(true);

      // 기존 채팅방이 있는지 확인
      const response = await ApiService.getChatRooms();
      const chatRooms = Array.isArray(response) ? response : (response?.rooms || []);

      const existingRoom = chatRooms.find(room =>
        room.participants && room.participants.some(participant => participant.user_id === parseInt(userId))
      );

      let chatRoomId;
      if (existingRoom) {
        // 기존 채팅방이 있으면 해당 채팅방 사용
        chatRoomId = existingRoom.room_id;
      } else {
        // 새 채팅방 생성
        const newRoom = await ApiService.createChatRoom(
          'individual',
          [parseInt(userId)],
          `${user?.name || '사용자'}님과의 채팅`
        );
        chatRoomId = newRoom.room_id;
      }

      // 1. 텍스트 메시지 전송
      if (recommendationMessage && recommendationMessage.trim()) {
        await ApiService.sendMessage(chatRoomId, recommendationMessage.trim());
      }

      // 2. 매물 카드 전송 (roomId가 있는 경우에만) - 텍스트 바로 다음에
      if (roomId) {
        try {
          const roomData = await ApiService.getRoomDetail(roomId);
          if (roomData) {
            const roomCardMessage = `ROOM_CARD:${JSON.stringify({
              room_id: roomData.room_id || roomData.id,
              transaction_type: roomData.transaction_type,
              price_deposit: roomData.price_deposit,
              price_monthly: roomData.price_monthly,
              area: roomData.area,
              rooms: roomData.rooms,
              floor: roomData.floor,
              address: roomData.address,
              favorite_count: roomData.favorite_count || 0
            })}`;
            await ApiService.sendMessage(chatRoomId, roomCardMessage);
          }
        } catch (error) {
          console.error('매물 정보 로드 실패:', error);
        }
      }

      // 3. 현재 사용자 프로필 카드 전송 (마지막에)
      try {
        const currentUserProfile = await ApiService.getUserProfile();
        const currentUser = await ApiService.getUserById(currentUserProfile.user_id);
        
        if (currentUser) {
          // 나이대 계산
          const getAgeGroup = (age) => {
            if (!age) return '';
            if (age >= 19 && age <= 23) return '20대 초반';
            if (age >= 24 && age <= 27) return '20대 중반';
            if (age >= 28 && age <= 30) return '20대 후반';
            if (age >= 31 && age <= 35) return '30대 초반';
            if (age >= 36 && age <= 39) return '30대 후반';
            return `${Math.floor(age / 10)}0대`;
          };

          // 성별 텍스트
          const getGenderText = (gender) => {
            if (gender === 'male') return '남성';
            if (gender === 'female') return '여성';
            return '';
          };

          // 학교 이름 추출
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
            
            return schoolPatterns[domain] || '';
          };

          // 사용자 태그 생성
          const generateUserTags = (profile) => {
            const tags = [];
            if (profile) {
              // 수면 패턴
              if (profile.sleep_type === 'early_bird') tags.push('종달새');
              else if (profile.sleep_type === 'night_owl') tags.push('올빼미');
              
              // 흡연 여부
              if (profile.smoking_status === 'non_smoker_strict' || profile.smoking_status === 'non_smoker_ok') {
                tags.push('비흡연');
              } else if (profile.smoking_status === 'smoker_indoor_no' || profile.smoking_status === 'smoker_indoor_yes') {
                tags.push('흡연');
              }
            }
            return tags;
          };

          const userProfileCardMessage = `USER_PROFILE:${JSON.stringify({
            user_id: currentUser.id || currentUser.user_id,
            name: currentUser.name,
            nickname: currentUser.nickname || currentUser.name,
            ageGroup: getAgeGroup(currentUser.profile?.age),
            gender: getGenderText(currentUser.gender),
            school: getSchoolNameFromEmail(currentUser.school_email),
            bio: currentUser.user_info?.bio || '안녕하세요!',
            tags: generateUserTags(currentUser.profile),
            compatibility_score: 0.85 // 기본 궁합 점수
          })}`;
          await ApiService.sendMessage(chatRoomId, userProfileCardMessage);
        }
      } catch (error) {
        console.error('현재 사용자 프로필 로드 실패:', error);
      }

      // 전송 완료 상태로 변경
      setIsSent(true);
      setIsSending(false);

      // 1초 후 채팅 화면으로 이동
      setTimeout(() => {
        navigation.navigate('홈', {
          screen: 'Chat',
          params: {
            roomId: chatRoomId,
            otherUser: {
              user_id: parseInt(userId),
              name: user?.name,
              university: user?.schoolText,
              age: user?.age,
              gender: user?.gender
            }
          }
        });
      }, 1000);

    } catch (error) {
      console.error('채팅방 생성/찾기 실패:', error);
      Alert.alert('오류', '메시지를 전송하는데 실패했습니다. 다시 시도해주세요.');
      setIsSending(false);
    }
  };

  // 라이프스타일 데이터 변환 함수들
  const getSleepTypeText = (sleepType) => {
    switch (sleepType) {
      case "early_bird":
        return "오전 6-8시 기상, 오후 10-12시 취침 (일찍 자는 타입)";
      case "normal":
        return "오전 8-10시 기상, 자정-오전 2시 취침 (보통 타입)";
      case "night_owl":
        return "오전 10시 이후 기상, 오전 2시 이후 취침 (늦게 자는 타입)";
      default:
        return "정보 없음";
    }
  };

  const getCleaningFrequencyText = (frequency) => {
    switch (frequency) {
      case "daily":
        return "매일 청소";
      case "weekly":
        return "주 1-2회 청소";
      case "as_needed":
        return "필요할 때만 청소";
      default:
        return "정보 없음";
    }
  };

  const getSmokingStatusText = (status) => {
    switch (status) {
      case "non_smoker_strict":
        return "비흡연 (흡연자와 생활 불가)";
      case "non_smoker_ok":
        return "비흡연 (흡연자와 생활 가능)";
      case "smoker_indoor_no":
        return "흡연 (실내 금연)";
      case "smoker_indoor_yes":
        return "흡연 (실내 흡연)";
      default:
        return "정보 없음";
    }
  };

  const getNoiseSensitivityText = (sensitivity) => {
    switch (sensitivity) {
      case "sensitive":
        return "소음에 민감";
      case "normal":
        return "보통";
      case "not_sensitive":
        return "소음에 둔감";
      default:
        return "정보 없음";
    }
  };

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
      "daily-daily": 1.0,
      "daily-weekly": 0.6,
      "daily-as_needed": 0.2,
      "weekly-weekly": 1.0,
      "weekly-as_needed": 0.7,
      "as_needed-as_needed": 1.0,
    };
    const freqKey = `${myProfile.cleaning_frequency}-${otherProfile.cleaning_frequency}`;
    const freqReverseKey = `${otherProfile.cleaning_frequency}-${myProfile.cleaning_frequency}`;
    const freqScore =
      freqCompatibility[freqKey] || freqCompatibility[freqReverseKey] || 0.5;

    // 청소 민감도 호환성
    const sensCompatibility = {
      "very_sensitive-very_sensitive": 1.0,
      "very_sensitive-normal": 0.6,
      "very_sensitive-not_sensitive": 0.1,
      "normal-normal": 1.0,
      "normal-not_sensitive": 0.8,
      "not_sensitive-not_sensitive": 1.0,
    };
    const sensKey = `${myProfile.cleaning_sensitivity}-${otherProfile.cleaning_sensitivity}`;
    const sensReverseKey = `${otherProfile.cleaning_sensitivity}-${myProfile.cleaning_sensitivity}`;
    const sensScore =
      sensCompatibility[sensKey] || sensCompatibility[sensReverseKey] || 0.5;

    cleaningScore = (freqScore + sensScore) / 2;
    score += cleaningWeight * cleaningScore;
    details.cleanlinessScore = Math.round(cleaningScore * 100);
    totalWeight += cleaningWeight;

    // 3. 흡연 호환성 (가중치: 0.25) - 가장 중요
    const smokingWeight = 0.25;
    const smokingCompatibility = {
      "non_smoker_strict-non_smoker_strict": 1.0,
      "non_smoker_strict-non_smoker_ok": 1.0,
      "non_smoker_strict-smoker_indoor_no": 0.3,
      "non_smoker_strict-smoker_indoor_yes": 0.0,
      "non_smoker_ok-non_smoker_ok": 1.0,
      "non_smoker_ok-smoker_indoor_no": 0.8,
      "non_smoker_ok-smoker_indoor_yes": 0.4,
      "smoker_indoor_no-smoker_indoor_no": 1.0,
      "smoker_indoor_no-smoker_indoor_yes": 0.6,
      "smoker_indoor_yes-smoker_indoor_yes": 1.0,
    };
    const smokingKey = `${myProfile.smoking_status}-${otherProfile.smoking_status}`;
    const smokingReverseKey = `${otherProfile.smoking_status}-${myProfile.smoking_status}`;
    const smokingScore =
      smokingCompatibility[smokingKey] ||
      smokingCompatibility[smokingReverseKey] ||
      0.5;
    score += smokingWeight * smokingScore;
    details.lifestyleScore = Math.round(smokingScore * 100);
    totalWeight += smokingWeight;

    // 4. 소음 민감도 호환성 (가중치: 0.2)
    const noiseWeight = 0.2;
    const noiseCompatibility = {
      "sensitive-sensitive": 1.0,
      "sensitive-normal": 0.7,
      "sensitive-not_sensitive": 0.3,
      "normal-normal": 1.0,
      "normal-not_sensitive": 0.8,
      "not_sensitive-not_sensitive": 1.0,
    };
    const noiseKey = `${myProfile.noise_sensitivity}-${otherProfile.noise_sensitivity}`;
    const noiseReverseKey = `${otherProfile.noise_sensitivity}-${myProfile.noise_sensitivity}`;
    const noiseScore =
      noiseCompatibility[noiseKey] ||
      noiseCompatibility[noiseReverseKey] ||
      0.5;
    score += noiseWeight * noiseScore;
    details.livingRangeScore = Math.round(noiseScore * 100);
    totalWeight += noiseWeight;

    const totalScore =
      totalWeight > 0 ? Math.round((score / totalWeight) * 100) : 0;

    return {
      totalScore,
      sleepScore: details.sleepScore,
      cleanlinessScore: details.cleanlinessScore,
      lifestyleScore: details.lifestyleScore,
      livingRangeScore: details.livingRangeScore,
    };
  };

  const loadUserProfile = async () => {
    try {
      setLoading(true);

      let userName = "사용자";
      let userTags = [];
      let userAge = null;
      let userGender = null;
      let userSchoolEmail = null;
      let userBio = "";
      let userCurrentArea = "";
      let userPreferredLocation = "";
      let userBudget = "";
      let userMoveInDate = "";
      let userSelfIntro = "";
      let userWantedRoommate = "";
      let userSleepType = "";
      let userCleaningFrequency = "";
      let userSmokingStatus = "";
      let userNoiseSensitivity = "";
      let compatibilityData = null;

      // 실제 API에서 이름과 태그, 기본 정보 가져오기 (내 정보 화면과 동일한 방식)
      if (userId) {
        try {
          const userProfile = await ApiService.getUserById(userId);
          if (userProfile) {
            console.log(
              "전체 사용자 프로필 데이터:",
              JSON.stringify(userProfile, null, 2)
            );
            userName = userProfile.name || "사용자";
            userAge = userProfile.profile?.age || null;
            userGender = userProfile.gender;
            userSchoolEmail = userProfile.school_email;
            userBio = userProfile.user_info?.bio || "";
            userCurrentArea = userProfile.user_info?.current_location || "";
            userPreferredLocation =
              userProfile.user_info?.desired_location || "";
            userBudget = userProfile.user_info?.budget || "";
            userMoveInDate = userProfile.user_info?.move_in_date || "";
            userSelfIntro = userProfile.user_info?.introduction || "";
            userWantedRoommate =
              userProfile.user_info?.roommate_preference || "";

            // 라이프스타일 정보 가져오기
            const profile = userProfile.profile || userProfile;
            if (profile) {
              userSleepType = profile.sleep_type || "";
              userCleaningFrequency = profile.cleaning_frequency || "";
              userSmokingStatus = profile.smoking_status || "";
              userNoiseSensitivity = profile.noise_sensitivity || "";

              console.log("라이프스타일 데이터:", {
                sleep_type: userSleepType,
                cleaning_frequency: userCleaningFrequency,
                smoking_status: userSmokingStatus,
                noise_sensitivity: userNoiseSensitivity,
              });
            }

            // 프로필이 있으면 내 정보 화면과 동일한 태그 생성 로직 사용
            if (isProfileComplete(profile)) {
              userTags = generateSubTags(profile);
            }
            // 프로필이 미완성인 경우 빈 배열 유지 (태그 없음)

            // API에서 궁합점수 가져오기 (roomId가 있으면 getRoomMatches를 우선 시도)
            try {
              let matchingUser = null;
              
              // roomId가 있으면 해당 방의 찜한 유저 목록에서 먼저 찾기
              if (roomId) {
                try {
                  const roomMatchedUsers = await ApiService.getRoomMatches(roomId);
                  console.log("방 찜한 사용자들:", roomMatchedUsers);
                  matchingUser = roomMatchedUsers?.find(user => 
                    user.user_id?.toString() === userId?.toString()
                  );
                  if (matchingUser) {
                    console.log("방 찜한 사용자 목록에서 찾음:", matchingUser);
                  }
                } catch (roomError) {
                  console.log("getRoomMatches 실패:", roomError);
                }
              }
              
              // 방 찜한 사용자에서 찾지 못했거나 roomId가 없으면 전체 매칭에서 찾기
              if (!matchingUser) {
                const allMatchingUsers = await ApiService.getMatches();
                console.log("전체 매칭 사용자들:", allMatchingUsers);
                matchingUser = allMatchingUsers?.find(user => 
                  user.user_id?.toString() === userId?.toString()
                );
                if (matchingUser) {
                  console.log("전체 매칭 사용자 목록에서 찾음:", matchingUser);
                }
              }
              
              if (matchingUser) {
                let score;
                
                // matching_score 우선 사용 (방 찜한 사용자 데이터)
                if (matchingUser.matching_score) {
                  score = Math.round(matchingUser.matching_score);
                  console.log("matching_score 사용:", score);
                } else if (matchingUser.compatibility_score) {
                  // compatibility_score가 0-1 범위라면 백분율로 변환
                  const rawScore = matchingUser.compatibility_score;
                  score = rawScore > 1 ? Math.round(rawScore) : Math.round(rawScore * 100);
                  console.log("compatibility_score 사용:", score);
                } else {
                  console.log("궁합점수 필드를 찾을 수 없음");
                  score = 80; // 기본값
                }
                
                compatibilityData = {
                  totalScore: score,
                  sleepScore: score,
                  cleaningScore: score,
                  smokingScore: score,
                  livingRangeScore: score
                };
                console.log("최종 궁합 점수:", compatibilityData);
              } else {
                console.log("매칭 사용자 목록에서 해당 사용자를 찾을 수 없음 - 기본 궁합 점수 사용");
              }
            } catch (error) {
              console.log("API 궁합 점수 로드 실패, 기본 궁합 점수 사용:", error);
            }
          }
        } catch (apiError) {
          // API 호출 실패 시 기본값 사용
          console.log("API 호출 실패, 기본값 사용:", apiError);
        }
      }

      // ProfileScreen과 동일한 로직으로 나이대, 성별, 학교 계산
      const getAgeGroup = (age) => {
        if (!age) return "";
        if (age >= 19 && age <= 23) return "20대 초반";
        if (age >= 24 && age <= 27) return "20대 중반";
        if (age >= 28 && age <= 30) return "20대 후반";
        if (age >= 31 && age <= 35) return "30대 초반";
        if (age >= 36 && age <= 39) return "30대 후반";
        return `${Math.floor(age / 10)}0대`;
      };

      const getGenderText = (gender) => {
        if (gender === "male") return "남성";
        if (gender === "female") return "여성";
        return "";
      };

      const getSchoolNameFromEmail = (schoolEmail) => {
        if (!schoolEmail) return "";

        const domain = schoolEmail.split("@")[1];
        if (!domain) return "";

        const schoolPatterns = {
          "snu.ac.kr": "서울대학교",
          "korea.ac.kr": "고려대학교",
          "yonsei.ac.kr": "연세대학교",
          "kaist.ac.kr": "카이스트",
          "postech.ac.kr": "포스텍",
          "seoul.ac.kr": "서울시립대학교",
          "hanyang.ac.kr": "한양대학교",
          "cau.ac.kr": "중앙대학교",
          "konkuk.ac.kr": "건국대학교",
          "dankook.ac.kr": "단국대학교",
        };

        if (schoolPatterns[domain]) {
          return schoolPatterns[domain];
        }

        let schoolName = domain
          .replace(".ac.kr", "")
          .replace(".edu", "")
          .replace("university", "")
          .replace("univ", "")
          .replace(".", "");

        if (schoolName && schoolName.length > 0) {
          return (
            schoolName.charAt(0).toUpperCase() + schoolName.slice(1) + "대학교"
          );
        }

        return "";
      };

      const ageGroupText = getAgeGroup(userAge) || "";
      const genderText = getGenderText(userGender) || "";
      const schoolText = getSchoolNameFromEmail(userSchoolEmail) || "";

      // 방 데이터 설정 (roomId가 있는 경우에만)
      if (roomId) {
        setRoom({
          id: roomId,
          // 실제 방 데이터는 API에서 가져와야 함
        });
      }

      // 사용자 데이터 설정
      setUser({
        id: userId,
        name: userName,
        tags: userTags,
        ageGroupText,
        genderText,
        schoolText,
        bio: userBio,
        matchScore: compatibilityData?.totalScore,
        compatibilityDetails: compatibilityData,
        profileImage: null,
        budget: userBudget || "정보 없음",
        moveInDate: userMoveInDate || "정보 없음",
        preferredLocation: userPreferredLocation || "정보 없음",
        currentArea: userCurrentArea || "정보 없음",
        selfIntro: userSelfIntro || "정보 없음",
        wantedRoommate: userWantedRoommate || "정보 없음",
        sleepType: userSleepType,
        cleaningFrequency: userCleaningFrequency,
        smokingStatus: userSmokingStatus,
        noiseSensitivity: userNoiseSensitivity,
      });
    } catch (error) {
      console.error("사용자 프로필 로드 실패:", error);
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

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>사용자 정보를 불러올 수 없습니다.</Text>
        </View>
      </SafeAreaView>
    );
  }

  console.log("렌더링 시작 - user 상태:", user);
  console.log("user.compatibilityDetails:", user?.compatibilityDetails);
  console.log("user.tags:", user?.tags);

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => {
          // HomeMain으로 돌아가서 탭바가 다시 보이도록
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate('홈', { screen: 'HomeMain' });
          }
        }}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>이 매물을 찜한 유저</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 프로필 섹션 */}
        <TouchableWithoutFeedback onPress={() => {
          Keyboard.dismiss();
          setIsInputFocused(false);
        }}>
          <View style={styles.profileSection}>
          <SpeechBubble
            text={user?.bio || "아침에 활동하는 갓생러"}
            style={styles.speechBubbleContainer}
          />

          <View style={styles.profileAvatar}>
            {user?.profileImage ? (
              <Image
                source={{ uri: user.profileImage }}
                style={styles.avatarImage}
              />
            ) : (
              <UserProfileIcon size={45} color="#595959" />
            )}
          </View>

          <Text style={styles.profileName}>{user?.name || "이름 없음"}</Text>

          <Text style={styles.profileInfo}>
            {user?.ageGroupText || ""}
            {user?.genderText ? `, ${user.genderText}` : ""}
            {user?.schoolText ? `, ${user.schoolText}` : ""}
          </Text>
          <View style={styles.profileTags}>
            {(user?.tags || []).map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
          </View>
        </TouchableWithoutFeedback>

        {/* 나와의 궁합 점수 */}
        {user?.compatibilityDetails && (
          <TouchableWithoutFeedback onPress={() => {
            Keyboard.dismiss();
            setIsInputFocused(false);
          }}>
            <View style={styles.compatibilitySection}>
            <Text style={styles.sectionTitle}>나와의 궁합 점수</Text>
            <View style={styles.compatibilityContent}>
              <View style={styles.scoreCircle}>
                <View style={styles.scoreRow}>
                  <Text style={styles.scoreNumber}>{user.matchScore || 0}</Text>
                  <Text style={styles.scoreLabel}>%</Text>
                </View>
                <Text style={styles.compatibilityText}>좋음</Text>
              </View>
              <View style={styles.scoreDetailsBox}>
                <View style={styles.scoreItem}>
                  <Text style={styles.scoreItemLabel}>청결도</Text>
                  <View style={styles.scoreBar}>
                    <View
                      style={[
                        styles.scoreBarFill,
                        {
                          width: `${
                            user.compatibilityDetails?.cleanlinessScore || 0
                          }%`,
                          backgroundColor:
                            (user.compatibilityDetails?.cleanlinessScore ||
                              0) >= 50
                              ? "#10B585"
                              : "#FF6B6B",
                        },
                      ]}
                    />
                  </View>
                </View>
                <View style={styles.scoreItem}>
                  <Text style={styles.scoreItemLabel}>라이프스타일</Text>
                  <View style={styles.scoreBar}>
                    <View
                      style={[
                        styles.scoreBarFill,
                        {
                          width: `${
                            user.compatibilityDetails?.lifestyleScore || 0
                          }%`,
                          backgroundColor:
                            (user.compatibilityDetails?.lifestyleScore || 0) >=
                            50
                              ? "#10B585"
                              : "#FF6B6B",
                        },
                      ]}
                    />
                  </View>
                </View>
                <View style={styles.scoreItem}>
                  <Text style={styles.scoreItemLabel}>기상·취침시간</Text>
                  <View style={styles.scoreBar}>
                    <View
                      style={[
                        styles.scoreBarFill,
                        {
                          width: `${
                            user.compatibilityDetails?.sleepScore || 0
                          }%`,
                          backgroundColor:
                            (user.compatibilityDetails?.sleepScore || 0) >= 50
                              ? "#10B585"
                              : "#FF6B6B",
                        },
                      ]}
                    />
                  </View>
                </View>
                <View style={styles.scoreItem}>
                  <Text style={styles.scoreItemLabel}>생활범위</Text>
                  <View style={styles.scoreBar}>
                    <View
                      style={[
                        styles.scoreBarFill,
                        {
                          width: `${
                            user.compatibilityDetails?.livingRangeScore || 0
                          }%`,
                          backgroundColor:
                            (user.compatibilityDetails?.livingRangeScore ||
                              0) >= 50
                              ? "#10B585"
                              : "#FF6B6B",
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>
            </View>
            </View>
          </TouchableWithoutFeedback>
        )}

        {/* 거주 정보 표 */}
        <TouchableWithoutFeedback onPress={() => {
          Keyboard.dismiss();
          setIsInputFocused(false);
        }}>
          <View style={styles.infoTableSection}>
          <View style={styles.tableRow}>
            <View style={styles.tableLabel}>
              <Text style={styles.tableLabelText}>현재 거주 지역</Text>
            </View>
            <View style={styles.tableValue}>
              <Text style={styles.tableValueText}>{user?.currentArea}</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableLabel}>
              <Text style={styles.tableLabelText}>희망 거주 지역</Text>
            </View>
            <View style={styles.tableValue}>
              <Text style={styles.tableValueText}>
                {user?.preferredLocation}
              </Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableLabel}>
              <Text style={styles.tableLabelText}>예산 범위</Text>
            </View>
            <View style={styles.tableValue}>
              <Text style={styles.tableValueText}>{user?.budget}</Text>
            </View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableLabel}>
              <Text style={styles.tableLabelText}>입주 가능일 / 기간</Text>
            </View>
            <View style={styles.tableValue}>
              <Text style={styles.tableValueText}>{user?.moveInDate}</Text>
            </View>
          </View>
          <View style={styles.lifestyleRow}>
            <View style={styles.tableLabel}>
              <Text style={styles.tableLabelText}>라이프스타일</Text>
            </View>
            <View style={styles.tableValue}>
              <Text style={styles.tableValueText}>
                기상·취침: {getSleepTypeText(user?.sleepType)}
              </Text>
              <Text style={styles.tableValueText}>
                청결도: {getCleaningFrequencyText(user?.cleaningFrequency)}
              </Text>
              <Text style={styles.tableValueText}>
                흡연 여부: {getSmokingStatusText(user?.smokingStatus)}
              </Text>
              <Text style={styles.tableValueText}>
                소음 민감도: {getNoiseSensitivityText(user?.noiseSensitivity)}
              </Text>
            </View>
          </View>
          <View style={styles.wantedRoommateRow}>
            <View style={[styles.tableLabel, styles.wantedRoommateLabel]}>
              <Text style={styles.tableLabelText}>원하는 룸메이트</Text>
            </View>
            <View style={[styles.tableValue, styles.wantedRoommateValue]}>
              <Text style={styles.tableValueText}>{user?.wantedRoommate}</Text>
            </View>
          </View>
          </View>
        </TouchableWithoutFeedback>

        {/* 자기소개 */}
        <TouchableWithoutFeedback onPress={() => {
          Keyboard.dismiss();
          setIsInputFocused(false);
        }}>
          <View style={styles.selfIntroSection}>
          <Text style={styles.sectionTitle}>자기소개</Text>
          <Text style={styles.selfIntroText}>
            {user?.selfIntro || "정보 없음"}
          </Text>
          </View>
        </TouchableWithoutFeedback>
      </ScrollView>

      {/* 하단 고정 컨테이너 - 채팅창에서 온 경우(roomId가 null) 숨기기 */}
      {roomId !== null && (
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.7)', 'rgba(255,255,255,1)']}
          locations={[0, 0.5, 1]}
          style={styles.bottomContainer}
        >
          <View style={styles.inputButtonWrapper}>
            {isSent ? (
              <View style={styles.sentStatus}>
                <Text style={styles.sentStatusText}>전송되었습니다</Text>
                <View style={styles.checkIconContainer}>
                  <CheckIcon width={10} height={7} color="black" />
                </View>
              </View>
            ) : (
              <>
                <View style={[styles.messageInputContainer, isInputFocused && styles.messageInputContainerFocused]}>
                  <TextInput
                    style={styles.messageInput}
                    placeholder="저도 이 매물이 마음에 들어요!"
                    placeholderTextColor="#B0B0B0"
                    value={recommendationMessage}
                    onChangeText={setRecommendationMessage}
                    multiline={false}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.sendButton, isSending && styles.sendButtonDisabled]}
                  onPress={handleSendMessage}
                  disabled={isSending || isSent}
                >
                  <Text style={styles.sendButtonText}>{isSending ? '전송중...' : '보내기'}</Text>
                  <View style={styles.arrowIcon}>
                    <Ionicons name="arrow-forward" size={38} color="white" />
                  </View>
                </TouchableOpacity>
              </>
            )}
          </View>
        </LinearGradient>
      )}

    </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F2F2F2",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: 20,
    zIndex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  profileSection: {
    alignItems: "center",
    padding: 20,
    paddingTop: 15,
    backgroundColor: "#F2F2F2",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  speechBubbleContainer: {
    marginBottom: 16,
  },
  profileAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#fff",
    borderWidth: 0.5,
    borderColor: "#D2D2D2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  profileName: {
    fontSize: 28,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 12,
  },
  profileTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  tagText: {
    fontSize: 14,
    color: "#666",
  },
  profileInfo: {
    fontSize: 16,
    color: "#666",
    marginBottom: 12,
  },
  profileBio: {
    fontSize: 16,
    color: "#333",
    textAlign: "center",
    lineHeight: 24,
  },
  compatibilitySection: {
    padding: 20,
    backgroundColor: "#fff",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  compatibilityContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 16,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "#10B585",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  compatibilityText: {
    fontSize: 16,
    color: "#333",
    fontWeight: "700",
    marginTop: 2,
  },
  scoreDetailsBox: {
    flex: 1,
    backgroundColor: "#F2F2F2",
    padding: 16,
    borderRadius: 8,
    gap: 12,
  },
  scoreNumber: {
    fontSize: 36,
    fontWeight: "700",
    color: "#10B585",
  },
  scoreLabel: {
    fontSize: 36,
    color: "#10B585",
    fontWeight: "700",
  },
  scoreDetails: {
    gap: 12,
  },
  scoreItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  scoreItemLabel: {
    fontSize: 12,
    color: "#666",
    width: 80,
  },
  scoreBar: {
    flex: 1,
    height: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    marginLeft: 8,
  },
  scoreBarFill: {
    height: "100%",
    backgroundColor: "#10B585",
    borderRadius: 4,
  },
  infoTableSection: {
    backgroundColor: "#fff",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  tableRow: {
    flexDirection: "row",
    minHeight: 40,
  },
  tableLabel: {
    flex: 0.4,
    backgroundColor: "#F3F3F3",
    padding: 10,
    justifyContent: "center",
  },
  tableValue: {
    flex: 0.6,
    backgroundColor: "#fff",
    padding: 10,
    justifyContent: "center",
  },
  tableLabelText: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  tableValueText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  lifestyleRow: {
    flexDirection: "row",
  },
  wantedRoommateRow: {
    flexDirection: "row",
  },
  wantedRoommateLabel: {
    backgroundColor: "#F3F3F3",
  },
  wantedRoommateValue: {
    backgroundColor: "#F3F3F3",
  },
  infoSection: {
    padding: 20,
    borderBottomWidth: 8,
    borderBottomColor: "#f5f5f5",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
  },
  infoValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
    textAlign: "right",
    flex: 1,
    marginLeft: 20,
  },
  lifestyleSection: {
    padding: 20,
    borderBottomWidth: 8,
    borderBottomColor: "#f5f5f5",
  },
  lifestyleGrid: {
    gap: 16,
    marginBottom: 24,
  },
  lifestyleItem: {
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  lifestyleLabel: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  introTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  introText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
  },
  selfIntroSection: {
    padding: 20,
    marginBottom: 0,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  selfIntroText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 22,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 15,
    paddingTop: 40,
    paddingBottom: 75,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
  },
  inputButtonWrapper: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  messageInputContainer: {
    flex: 1,
    height: 55,
    backgroundColor: "#E7E7E7",
    borderWidth: 1,
    borderColor: "#B7B7B7",
    borderRadius: 152,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  messageInputContainerFocused: {
    backgroundColor: "#FFFFFF",
  },
  messageInput: {
    fontSize: 13,
    color: "#7D7D7D",
    fontFamily: "Pretendard",
    includeFontPadding: false,
    paddingVertical: 0,
    margin: 0,
    textAlign: "left",
  },
  sendButton: {
    width: 125,
    height: 55,
    backgroundColor: "black",
    borderRadius: 152,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 5,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    color: "white",
    fontSize: 17,
    fontFamily: "Pretendard",
    fontWeight: "700",
    marginRight: 12,
  },
  arrowIcon: {
    width: 45,
    height: 45,
    backgroundColor: "#FC6339",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -1,
  },
  sentStatus: {
    flex: 1,
    height: 55,
    backgroundColor: "white",
    borderRadius: 152,
    borderWidth: 1,
    borderColor: "#000",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  sentStatusText: {
    color: "black",
    fontSize: 18,
    fontFamily: "Pretendard",
    fontWeight: "500",
  },
  checkIconContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#E5E5E5",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 20,
    width: "100%",
    maxHeight: "85%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  modalRoomInfo: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalRoomImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  modalRoomDetails: {
    flex: 1,
    marginLeft: 12,
  },
  modalRoomPrice: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 4,
  },
  modalRoomInfo1: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  modalRoomAddress: {
    fontSize: 12,
    color: "#666",
    marginBottom: 8,
  },
  modalVerificationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: "flex-start",
    gap: 2,
  },
  modalVerificationText: {
    fontSize: 10,
    color: "#FF6600",
    fontWeight: "600",
  },
  modalUserInfo: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalUserAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
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
    fontWeight: "600",
    color: "#333",
    marginBottom: 6,
  },
  modalUserTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    marginBottom: 6,
  },
  modalTag: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  modalTagText: {
    fontSize: 11,
    color: "#666",
  },
  modalUserBio: {
    fontSize: 13,
    color: "#333",
  },
  modalInputSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTextInput: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 16,
    fontSize: 14,
    color: "#333",
    minHeight: 80,
    textAlignVertical: "top",
  },
  modalRecommendButton: {
    backgroundColor: "#666",
    paddingVertical: 16,
    borderRadius: 8,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  modalRecommendButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});
