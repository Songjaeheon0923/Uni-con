import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';

export default function ContractVerificationScreen({ navigation }) {
  const [isLeavingToContract, setIsLeavingToContract] = React.useState(false);

  // 탭 바 숨김 (계약서 검증 플로우 전체에서 숨김)
  useFocusEffect(
    React.useCallback(() => {
      const parent = navigation.getParent();
      if (parent) {
        parent.setOptions({
          tabBarStyle: { display: 'none' }
        });
      }
      return () => {
        // 계약서 플로우로 이동하는 경우가 아닐 때만 네비게이션 바 복원
        if (parent && !isLeavingToContract) {
          parent.setOptions({
            tabBarStyle: {
              height: 100,
              paddingBottom: 30,
              paddingTop: 15,
              backgroundColor: '#FFFFFF',
              borderTopWidth: 0,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 8,
              tabBarActiveTintColor: '#10B585',
              tabBarInactiveTintColor: '#C0C0C0',
            }
          });
        }
        // 상태 리셋
        setIsLeavingToContract(false);
      };
    }, [navigation, isLeavingToContract])
  );

  const handleTakePhoto = () => {
    setIsLeavingToContract(true);
    navigation.navigate('ContractCamera');
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 통합된 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Svg width="21" height="24" viewBox="0 0 21 24" fill="none">
              <Path d="M19 13.5C19.8284 13.5 20.5 12.8284 20.5 12C20.5 11.1716 19.8284 10.5 19 10.5V12V13.5ZM0.939341 10.9393C0.353554 11.5251 0.353554 12.4749 0.939341 13.0607L10.4853 22.6066C11.0711 23.1924 12.0208 23.1924 12.6066 22.6066C13.1924 22.0208 13.1924 21.0711 12.6066 20.4853L4.12132 12L12.6066 3.51472C13.1924 2.92893 13.1924 1.97919 12.6066 1.3934C12.0208 0.807611 11.0711 0.807611 10.4853 1.3934L0.939341 10.9393ZM19 12V10.5L2 10.5V12V13.5L19 13.5V12Z" fill="#494949"/>
            </Svg>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>계약서 안전성 검증</Text>
        </View>
        {/* 메인 아이콘 */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <Ionicons name="shield-checkmark" size={60} color="#FF6600" />
          </View>
        </View>

        {/* 제목 */}
        <Text style={styles.title}>계약서 안전성 검증하기</Text>
        <Text style={styles.subtitle}>AI가 계약서를 분석하여 위험 요소를 찾아드립니다</Text>

        {/* 기능 설명 */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="document-text" size={24} color="#FF6600" />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>계약서 분석</Text>
              <Text style={styles.featureDescription}>
                임대차 계약서의 모든 조항을 꼼꼼히 분석합니다
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="warning" size={24} color="#FF6600" />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>위험 요소 탐지</Text>
              <Text style={styles.featureDescription}>
                불리한 조항이나 주의해야 할 내용을 알려드립니다
              </Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Ionicons name="checkmark-circle" size={24} color="#FF6600" />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>안전성 점수</Text>
              <Text style={styles.featureDescription}>
                계약서의 전체적인 안전성을 점수로 제공합니다
              </Text>
            </View>
          </View>
        </View>

        {/* 주의사항 */}
        <View style={styles.noticeContainer}>
          <View style={styles.noticeHeader}>
            <Ionicons name="information-circle" size={20} color="#666" />
            <Text style={styles.noticeTitle}>주의사항</Text>
          </View>
          <Text style={styles.noticeText}>
            • 계약서 전체가 선명하게 보이도록 촬영해주세요{'\n'}
            • 여러 페이지가 있는 경우 모든 페이지를 촬영해주세요{'\n'}
            • 개인정보는 안전하게 처리됩니다{'\n'}
            • 검증 결과는 참고용이며, 법적 효력은 없습니다
          </Text>
        </View>

        {/* 사진 촬영하기 버튼 */}
        <View style={styles.cameraButtonContainer}>
          <TouchableOpacity style={styles.cameraButton} onPress={handleTakePhoto}>
            <Ionicons name="camera" size={24} color="#FFFFFF" />
            <Text style={styles.cameraButtonText}>계약서 사진 촬영하기</Text>
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 20,
    padding: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  iconContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#FFF5E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  featuresContainer: {
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF5E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  noticeContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    marginHorizontal: 20,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  noticeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginLeft: 6,
  },
  noticeText: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  cameraButtonContainer: {
    paddingHorizontal: 40,
    paddingVertical: 30,
  },
  cameraButton: {
    backgroundColor: '#FF6600',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cameraButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});