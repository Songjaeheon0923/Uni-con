import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path, G, Rect } from "react-native-svg";
import ApiService from '../services/api';

export default function RoommateChoiceScreen({ navigation, user }) {
  const [userProfile, setUserProfile] = useState(null);
  const [hasCompletedTest, setHasCompletedTest] = useState(false);

  const userData = user || {
    id: "1",
    name: "유빈",
    location: "성북구"
  };

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const profile = await ApiService.getUserProfile();
      setUserProfile(profile);

      // 프로필이 완성되어 있는지 확인 (한번이라도 테스트를 했는지)
      const isComplete = profile && profile.is_complete;
      setHasCompletedTest(isComplete);
    } catch (error) {
      console.error('사용자 프로필 로드 실패:', error);
      setHasCompletedTest(false);
    }
  };

  const handlePersonalityTest = () => {
    navigation.navigate('PersonalityTest');
  };

  const handleSkipTest = () => {
    Alert.alert(
      '검사 건너뛰기',
      '성향 검사를 건너뛰고 바로 룸메이트를 찾아보시겠어요?\n검사 없이도 다른 사용자들을 확인할 수 있습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '건너뛰기',
          onPress: () => {
            // 매칭 결과 화면으로 바로 이동
            navigation.navigate('MatchResults');
          }
        }
      ]
    );
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

      {/* 메인 텍스트 */}
      <Text style={styles.mainText}>
        내 주거 성향을 파악하고,{'\n'}딱 맞는 룸메이트를 찾아보세요!
      </Text>

      {/* 일러스트레이션 영역 */}
      <View style={styles.illustrationContainer}>
        <Image
          source={require('../../assets/roommate-character.png')}
          style={styles.illustration}
          resizeMode="contain"
        />
      </View>

      {/* 버튼 */}
      <TouchableOpacity style={styles.actionButton} onPress={handlePersonalityTest}>
        <Text style={styles.actionButtonText} numberOfLines={1}>내 유형 알아보기</Text>
        <View style={styles.greenCircle}>
          <Ionicons name="arrow-forward" size={40} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: '#F2F2F2',
    overflow: 'hidden',
    borderRadius: 40,
    marginTop: 15,
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 50,
    padding: 10,
  },
  headerTitle: {
    left: 147,
    top: 63,
    position: 'absolute',
    textAlign: 'center',
    color: 'black',
    fontSize: 18,
    fontFamily: 'Pretendard',
    fontWeight: '600',
  },
  mainText: {
    left: 59,
    top: 213,
    position: 'absolute',
    textAlign: 'center',
    color: '#1C1C1C',
    fontSize: 24,
    fontFamily: 'Pretendard',
    fontWeight: '600',
    lineHeight: 33.6,
  },
  illustrationContainer: {
    width: 280,
    height: 380,
    left: 60,
    top: 280,
    position: 'absolute',
  },
  illustration: {
    width: 240,
    height: 380,
    left: 20,
    top: 0,
    position: 'absolute',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
    height: 65,
    borderRadius: 30,
    position: 'absolute',
    left: 55,
    top: 648,
    width: 302,
    paddingLeft: 50,
    paddingRight: 60,
    paddingVertical: 0,
  },
  actionButtonText: {
    fontSize: 22,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
    includeFontPadding: false,
    lineHeight: 28,
  },
  greenCircle: {
    position: 'absolute',
    right: 8,
    width: 43,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#10B585',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
