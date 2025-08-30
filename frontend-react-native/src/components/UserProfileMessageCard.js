import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import UserProfileIcon from './UserProfileIcon';
import SpeechBubble from './SpeechBubble';

const { width } = Dimensions.get('window');

const UserProfileMessageCard = ({ userData, alignment = 'center', isMyMessage = false }) => {
  const navigation = useNavigation();
  const [showCompatibility, setShowCompatibility] = useState(false);
  
  const alignmentStyle = alignment === 'right' ? { alignSelf: 'flex-end' } : 
                        alignment === 'left' ? { alignSelf: 'flex-start' } : 
                        { alignSelf: 'center' };

  // Helper functions
  const getCompatibilityText = (score) => {
    if (score >= 0.8) return '좋음';
    if (score >= 0.6) return '보통';
    return '나쁨';
  };

  // 실제 태그 데이터 생성 함수 (UserMatchCard와 동일)
  const getUserTags = (userData) => {
    const tags = [];
    
    if (userData.profile) {
      if (userData.profile.sleep_type === 'early_bird') tags.push('종달새');
      else if (userData.profile.sleep_type === 'night_owl') tags.push('올빼미');
      
      if (userData.profile.smoking_status === 'non_smoker_strict' || userData.profile.smoking_status === 'non_smoker_ok') {
        tags.push('비흡연');
      } else if (userData.profile.smoking_status === 'smoker_indoor_no' || userData.profile.smoking_status === 'smoker_indoor_yes') {
        tags.push('흡연');
      }
    }
    
    if (userData.tags && Array.isArray(userData.tags)) {
      tags.push(...userData.tags);
    }
    
    if (tags.length === 0) {
      const seed = parseInt(userData.user_id) || 1;
      const sleepIndex = seed % 2;
      tags.push(sleepIndex === 0 ? '올빼미' : '종달새');
      const smokingIndex = (seed * 3) % 10 < 8 ? 1 : 0;
      tags.push(smokingIndex === 1 ? '비흡연' : '흡연');
    }
    
    return tags;
  };
  
  return (
    <View style={[styles.userCard, alignmentStyle]}>
      <View style={styles.userCardContent}>
        {/* 말풍선 */}
        <SpeechBubble
          text={userData.bio || userData.message || "안녕하세요! 좋은 룸메이트가 되고싶습니다 :)"}
          style={styles.speechBubbleContainer}
        />

        {/* 프로필 이미지 - 클릭 가능 */}
        <TouchableOpacity
          style={styles.userAvatarContainer}
          onPress={() => setShowCompatibility(!showCompatibility)}
          activeOpacity={0.7}
        >
          <View style={styles.userAvatar}>
            {userData.profileImage ? (
              <Image source={{ uri: userData.profileImage }} style={styles.avatarImage} />
            ) : (
              <UserProfileIcon size={33} color="#595959" />
            )}
          </View>

          {/* 궁합도 오버레이 (클릭 시에만 표시) */}
          {showCompatibility && (
            <View style={styles.matchScoreOverlay}>
              <Text style={styles.matchScoreOverlayText}>{Math.round((userData.compatibility_score || 0.85) * 100)}%</Text>
              <Text style={styles.matchScoreLabel}>{getCompatibilityText(userData.compatibility_score || 0.85)}</Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.userName}>{userData.name || userData.nickname}</Text>

        <Text style={styles.userInfo}>
          {[userData.ageGroup, userData.gender, userData.school].filter(Boolean).join(', ')}
        </Text>

        {/* 하단 태그들 (항상 표시) */}
        <View style={styles.userTags}>
          {getUserTags(userData).slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        {/* 프로필 확인하기 버튼 */}
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => {
            if (isMyMessage) {
              // 내가 보낸 메시지인 경우 탭바의 "내 정보" 탭으로 이동
              navigation.navigate('MainTabs', { 
                screen: '내 정보',
                params: {
                  screen: 'ProfileMain'
                }
              });
            } else {
              // 상대방이 보낸 메시지인 경우 해당 사용자의 UserProfile로 이동
              navigation.navigate('UserProfile', {
                userId: userData.user_id?.toString() || userData.id?.toString(),
              });
            }
          }}
        >
          <Text style={styles.profileButtonText}>프로필 확인하기</Text>
          <View style={styles.profileArrowIcon}>
            <Ionicons name="arrow-forward" size={25} color="#FFFFFF" />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  userCard: {
    width: width * 0.45,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 3,
    maxWidth: 200,
  },
  userCardContent: {
    alignItems: 'center',
  },
  speechBubbleContainer: {
    width: 120,
    height: 40,
    marginBottom: 8,
  },
  userAvatarContainer: {
    position: 'relative',
    marginBottom: 12,
    marginTop: 6,
  },
  userAvatar: {
    width: 53,
    height: 53,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchScoreOverlay: {
    position: 'absolute',
    top: -7,
    left: -7,
    right: -7,
    bottom: -7,
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    borderRadius: 45,
    borderWidth: 0.699,
    borderColor: '#10B585',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchScoreOverlayText: {
    color: '#10B585',
    fontSize: 22.369,
    fontFamily: 'Pretendard',
    fontWeight: 'bold',
  },
  matchScoreLabel: {
    color: '#000000',
    fontSize: 12,
    fontFamily: 'Pretendard',
    fontWeight: '500',
  },
  profileTagsOverlay: {
    alignItems: 'center',
    gap: 2,
  },
  profileTagOverlay: {
    fontSize: 10,
    color: '#10B585',
    fontFamily: 'Pretendard',
    fontWeight: '600',
    textAlign: 'center',
  },
  avatarImage: {
    width: 53,
    height: 53,
    borderRadius: 40,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Pretendard',
    color: '#333',
    marginBottom: 8,
  },
  userTags: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    fontFamily: 'Pretendard',
    color: '#666',
  },
  userInfo: {
    fontSize: 12,
    fontFamily: 'Pretendard',
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  profileButton: {
    backgroundColor: '#000000',
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    position: 'relative',
    width: '100%',
    marginTop: 8,
  },
  profileButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Pretendard',
  },
  profileArrowIcon: {
    position: 'absolute',
    right: 3,
    width: 28,
    height: 28,
    borderRadius: 25,
    backgroundColor: '#FF6600',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default UserProfileMessageCard;