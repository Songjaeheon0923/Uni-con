import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CheckIcon from './CheckIcon';

const { width: screenWidth } = Dimensions.get('window');
const HORIZONTAL_MARGIN = 15; // 좌우 여백 고정값

const UserMatchCard = ({ user, onPress, index }) => {
  const [message, setMessage] = useState('안녕하세요! 혹시 룸메 구하시나요?');
  const [isSent, setIsSent] = useState(false);
  // Helper functions
  const getCompatibilityText = (score) => {
    if (score >= 0.8) return '좋음';
    if (score >= 0.6) return '보통';
    return '나쁨';
  };

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

  const compatibility = getLifestyleCompatibility(user.matching_details || {});
  const firstRow = compatibility.slice(0, 2);
  const secondRow = compatibility.slice(2, 4);

  return (
    <View style={styles.userCard}>
      {/* 프로필 이미지 */}
      <View style={styles.profileImageBg}>
        <View style={styles.profileImage}>
          <Ionicons name="person" size={34} color="#595959" />
        </View>
      </View>

      {/* 사용자 정보 */}
      <View style={styles.userInfoSection}>
        <Text style={styles.userName}>{user.nickname || user.name}</Text>
        <View style={styles.userDetails}>
          <Text style={styles.userDetailsText}>
            {getAgeGroup(user.age)}{getGenderText(user.gender) ? `, ${getGenderText(user.gender)}` : ''}{getSchoolNameFromEmail(user.university) ? `, ${getSchoolNameFromEmail(user.university)}` : ''}
          </Text>
        </View>
      </View>

      {/* 매칭률 */}
      <View style={styles.matchingSection}>
        <Text style={[
          styles.scorePercentage,
          Math.round((user.compatibility_score || 0.8) * 100) === 100 && styles.scorePercentage100
        ]}>{Math.round((user.compatibility_score || 0.8) * 100)}%</Text>
        <Text style={styles.scoreLabel}>{getCompatibilityText(user.compatibility_score || 0.8)}</Text>
      </View>

      {/* 메시지 (프로필 이미지 아래) */}
      <View style={styles.messageWrapper}>
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>&quot; {user.bio || user.message || '안녕하세요! 좋은 룸메이트가 되고싶습니다 :)'} &quot;</Text>
        </View>
      </View>

      {/* 구분선 */}
      <View style={styles.separator} />

      {/* 카테고리 태그들 */}
      <View style={styles.categorySection}>
        <View style={styles.categoryRow}>
          {firstRow.map((category) => (
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
          {secondRow.map((category) => (
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
      </View>

      {/* 메시지 입력창 */}
      <View style={styles.messageInputContainer}>
        <TextInput
          style={styles.messageInput}
          placeholder="안녕하세요! 혹시 룸메 구하시나요?"
          placeholderTextColor="#999"
          value={message}
          onChangeText={setMessage}
          multiline={false}
        />
      </View>

      {/* 보내기 버튼 또는 전송 완료 상태 */}
      {isSent ? (
        <View style={styles.sentStatus}>
          <Text style={styles.sentStatusText}>전송되었습니다</Text>
          <View style={styles.checkIconContainer}>
            <CheckIcon width={10} height={7} color="black" />
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.sendButton}
          onPress={async () => {
            setIsSent(true);
            await onPress(user, message);
          }}
        >
          <Text style={styles.sendButtonText}>보내기</Text>
          <View style={styles.arrowIcon}>
            <Ionicons name="arrow-forward" size={16} color="white" />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  userCard: {
    width: screenWidth - (HORIZONTAL_MARGIN * 2),
    height: 255,
    backgroundColor: 'white',
    position: 'relative',
    borderRadius: 18,
    shadowColor: 'rgba(0, 0, 0, 0.10)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 3,
    marginBottom: 12,
    marginLeft: HORIZONTAL_MARGIN,
    marginRight: HORIZONTAL_MARGIN,
    overflow: 'visible',
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
  dotIndicator: {
    width: 2,
    height: 2,
    backgroundColor: '#343434',
    borderRadius: 1,
    opacity: 0.8,
  },
  cameraIcon: {
    width: 8,
    height: 8,
    backgroundColor: '#FF6600',
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
  },
  matchingSection: {
    width: 83,
    position: 'absolute',
    right: 19,
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
  messageInputContainer: {
    position: 'absolute',
    left: 19,
    right: 100,
    top: 210,
    height: 32,
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  messageInput: {
    fontSize: 13,
    color: '#333',
    fontFamily: 'Pretendard',
    includeFontPadding: false,
    paddingVertical: 0,
    margin: 0,
  },
  sendButton: {
    position: 'absolute',
    right: 19,
    top: 210,
    height: 32,
    backgroundColor: 'black',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingRight: 4,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Pretendard',
    fontWeight: '500',
    marginRight: 4,
  },
  arrowIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#FC6339',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sentStatus: {
    position: 'absolute',
    left: 19,
    right: 19,
    top: 210,
    height: 32,
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#000',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  sentStatusText: {
    color: 'black',
    fontSize: 12,
    fontFamily: 'Pretendard',
    fontWeight: '500',
  },
  checkIconContainer: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default UserMatchCard;
