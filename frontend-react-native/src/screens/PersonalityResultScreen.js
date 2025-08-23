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
      navigation.goBack();
    } else {
      navigation.navigate('MatchResults');
    }
  };
  
  const handleRetakeTest = () => {
    navigation.navigate('PersonalityTest', { from: fromScreen });
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Svg width="21" height="24" viewBox="0 0 21 24" fill="none">
            <Path d="M19 13.5C19.8284 13.5 20.5 12.8284 20.5 12C20.5 11.1716 19.8284 10.5 19 10.5V12V13.5ZM0.939341 10.9393C0.353554 11.5251 0.353554 12.4749 0.939341 13.0607L10.4853 22.6066C11.0711 23.1924 12.0208 23.1924 12.6066 22.6066C13.1924 22.0208 13.1924 21.0711 12.6066 20.4853L4.12132 12L12.6066 3.51472C13.1924 2.92893 13.1924 1.97919 12.6066 1.3934C12.0208 0.807611 11.0711 0.807611 10.4853 1.3934L0.939341 10.9393ZM19 12V10.5L2 10.5V12V13.5L19 13.5V12Z" fill="#494949"/>
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>나만의 룸메이트 찾기</Text>
      </View>

      <View style={styles.content}>
        {/* 결과 텍스트 */}
        <Text style={styles.resultTitle}>
          {userName} 님은{'\n'}[{personalityResult.type}]이시군요!
        </Text>
        
        {/* 특성 해시태그 */}
        <Text style={styles.traits}>
          {personalityResult.traits.join(' ')}
        </Text>
        
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
          <View style={styles.findButtonContent}>
            <Text style={styles.findButtonTitle}>나와 잘 맞는 룸메이트 찾기</Text>
            <View style={styles.findButtonIcon}>
              <Ionicons name="arrow-forward" size={16} color="#404040" />
            </View>
          </View>
          <Text style={styles.findButtonSubtext}>어울리는 유형의 룸메이트를 찾아보세요!</Text>
        </TouchableOpacity>
        
        {/* 다시 테스트하기 링크 */}
        <TouchableOpacity onPress={handleRetakeTest}>
          <Text style={styles.retakeLink}>다시 테스트하기</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 63,
    paddingBottom: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 63,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1C1C1C',
    lineHeight: 33.6,
    textAlign: 'center',
    marginTop: 50,
    marginBottom: 25,
  },
  traits: {
    fontSize: 16,
    fontWeight: '300',
    color: '#1C1C1C',
    lineHeight: 22.4,
    textAlign: 'center',
    marginBottom: 22,
    marginTop: -10,
  },
  illustrationContainer: {
    width: 222,
    height: 329,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 25,
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  retakeLink: {
    fontSize: 16,
    fontWeight: '500',
    color: '#343434',
    textAlign: 'center',
    textDecorationLine: 'underline',
    marginBottom: 40,
  },
  findButton: {
    width: 345,
    backgroundColor: '#000000',
    borderRadius: 9,
    paddingHorizontal: 30,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 20,
  },
  findButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
  },
  findButtonTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#ffffff',
    marginRight: 8,
  },
  findButtonIcon: {
    width: 26,
    height: 26,
    backgroundColor: '#D9D9D9',
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  findButtonSubtext: {
    fontSize: 12,
    fontWeight: '400',
    color: '#ffffff',
    opacity: 0.8,
    textAlign: 'center',
  },
});