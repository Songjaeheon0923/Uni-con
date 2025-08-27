import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '../contexts/AuthContext';
import { generatePersonalityType, generateSubTags, isProfileComplete } from '../utils/personalityUtils';

export default function PersonalityResultScreen({ navigation, route }) {
  const { user } = useAuth();
  const { userProfile, fromScreen } = route?.params || {};
  const userName = user?.name || userProfile?.name || '사용자';
  
  // 사용자 프로필을 바탕으로 성격 유형 결정 (ProfileScreen과 동일한 로직)
  const getPersonalityData = () => {
    if (!userProfile || !isProfileComplete(userProfile)) {
      return {
        type: '균형잡힌 룸메이트',
        traits: ['# 균형적', '# 적응력', '# 친화적']
      };
    }
    
    const mainType = generatePersonalityType(userProfile);
    const allSubTags = generateSubTags(userProfile);
    
    // 3개의 랜덤 태그 선택
    const shuffledTags = allSubTags.sort(() => 0.5 - Math.random());
    const selectedTags = shuffledTags.slice(0, 3).map(tag => `# ${tag}`);
    
    return {
      type: mainType,
      traits: selectedTags
    };
  };
  
  const personalityResult = getPersonalityData();
  
  const handleFindRoommate = () => {
    if (fromScreen === 'profile') {
      // 내 정보 화면으로 직접 이동
      navigation.navigate('ProfileMain');
    } else {
      navigation.navigate('MatchResults');
    }
  };
  
  const handleRetakeTest = () => {
    navigation.navigate('PersonalityTest', { from: fromScreen });
  };

  return (
    <View style={styles.container}>
      {/* 뒤로가기 버튼 */}
      <TouchableOpacity 
        style={styles.backButton} 
        onPress={() => navigation.goBack()}
      >
        <Svg width="21" height="24" viewBox="0 0 21 24" fill="none">
          <Path d="M19 13.5C19.8284 13.5 20.5 12.8284 20.5 12C20.5 11.1716 19.8284 10.5 19 10.5V12V13.5ZM0.939341 10.9393C0.353554 11.5251 0.353554 12.4749 0.939341 13.0607L10.4853 22.6066C11.0711 23.1924 12.0208 23.1924 12.6066 22.6066C13.1924 22.0208 13.1924 21.0711 12.6066 20.4853L4.12132 12L12.6066 3.51472C13.1924 2.92893 13.1924 1.97919 12.6066 1.3934C12.0208 0.807611 11.0711 0.807611 10.4853 1.3934L0.939341 10.9393ZM19 12V10.5L2 10.5V12V13.5L19 13.5V12Z" fill="#494949"/>
        </Svg>
      </TouchableOpacity>

      {/* 헤더 타이틀 */}
      <Text style={styles.headerTitle}>주거 성향 테스트</Text>

      {/* 결과 텍스트 */}
      <Text style={styles.resultTitle}>
        {userName} 님은{'\n'}[{personalityResult.type}]이시군요!
      </Text>
      
      {/* 특성 태그들 */}
      <View style={styles.tagsContainer}>
        <View style={styles.tagsRow}>
          {personalityResult.traits.slice(0, 2).map((trait, index) => (
            <View key={index} style={styles.tagItem}>
              <Text style={styles.tagText}>{trait}</Text>
            </View>
          ))}
        </View>
        {personalityResult.traits.length > 2 && (
          <View style={styles.tagsRow}>
            {personalityResult.traits.slice(2).map((trait, index) => (
              <View key={index + 2} style={styles.tagItem}>
                <Text style={styles.tagText}>{trait}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      
      {/* 일러스트레이션 */}
      <View style={styles.illustrationContainer}>
        <Image 
          source={require('../../assets/cleaning-character.png')}
          style={styles.illustration}
          resizeMode="contain"
        />
      </View>

      
      {/* 룸메이트 찾기 버튼 */}
      <TouchableOpacity style={styles.findButton} onPress={handleFindRoommate}>
        <Text style={styles.findButtonText}>나와 잘 맞는 룸메이트 추천받기</Text>
      </TouchableOpacity>
      
      {/* 다시 테스트하기 링크 */}
      <TouchableOpacity style={styles.retakeButton} onPress={handleRetakeTest}>
        <Text style={styles.retakeLink}>다시 테스트하기</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F2',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 50,
    padding: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    position: 'absolute',
    top: 63,
    left: 0,
    right: 0,
    fontFamily: 'Pretendard',
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1C1C1C',
    lineHeight: 33.6,
    textAlign: 'center',
    position: 'absolute',
    top: 150,
    left: 20,
    right: 20,
    fontFamily: 'Pretendard',
  },
  tagsContainer: {
    position: 'absolute',
    top: 240,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  tagsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  tagItem: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginHorizontal: 5,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#1C1C1C',
    fontFamily: 'Pretendard',
  },
  illustrationContainer: {
    width: 222,
    height: 329,
    position: 'absolute',
    top: 360,
    left: '50%',
    marginLeft: -111,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  findButton: {
    position: 'absolute',
    bottom: 120,
    left: 35,
    right: 35,
    backgroundColor: '#FC6339',
    borderRadius: 100,
    height: 65,
    justifyContent: 'center',
    alignItems: 'center',
  },
  findButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    fontFamily: 'Pretendard',
  },
  retakeButton: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  retakeLink: {
    fontSize: 16,
    fontWeight: '500',
    color: '#343434',
    textAlign: 'center',
    textDecorationLine: 'underline',
    fontFamily: 'Pretendard',
  },
});