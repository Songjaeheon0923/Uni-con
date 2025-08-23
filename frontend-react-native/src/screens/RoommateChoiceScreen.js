import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Svg, { Path, G, Rect } from "react-native-svg";

export default function RoommateChoiceScreen({ navigation, user }) {
  const userData = user || {
    id: "1",
    name: "유빈",
    location: "성북구"
  };

  const handlePersonalityTest = () => {
    navigation.navigate('PersonalityTest');
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

      {/* 메인 텍스트 */}
      <Text style={styles.mainText}>
        {userData.name}님의 성향을 파악하고{'\n'}딱 맞는 룸메이트를 찾아보세요!
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
        <Text style={styles.actionButtonText}>내 유형 알아보기</Text>
        <View style={styles.actionButtonIcon}>
          <Ionicons name="arrow-forward" size={16} color="#696969" />
        </View>
      </TouchableOpacity>
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
  mainText: {
    position: 'absolute',
    left: 59,
    top: 213,
    fontSize: 24,
    fontWeight: '600',
    color: '#1C1C1C',
    lineHeight: 33.6,
    textAlign: 'center',
  },
  illustrationContainer: {
    position: 'absolute',
    left: 83,
    top: 289,
    width: 247,
    height: 261,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  actionButton: {
    position: 'absolute',
    left: 95,
    top: 648,
    width: 222,
    height: 56,
    backgroundColor: '#696969',
    borderRadius: 9,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  actionButtonText: {
    position: 'absolute',
    left: 35,
    top: 19,
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
  actionButtonIcon: {
    position: 'absolute',
    left: 161,
    top: 15,
    width: 26,
    height: 26,
    backgroundColor: '#D9D9D9',
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
});