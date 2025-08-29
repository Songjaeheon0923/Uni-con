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
              tabBarActiveTintColor: '#000000',
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
          <Svg width="97" height="97" viewBox="0 0 97 97" fill="none">
            {/* 외부 원 */}
            <Path d="M48.5 96.5C75.2843 96.5 96.5 75.2843 96.5 48.5C96.5 21.7157 75.2843 0.5 48.5 0.5C21.7157 0.5 0.5 21.7157 0.5 48.5C0.5 75.2843 21.7157 96.5 48.5 96.5Z" fill="white" stroke="#FC6339"/>
            {/* 방패 */}
            <Path d="M48.5 22L26 32V47C26 60.875 35.6 73.85 48.5 77C61.4 73.85 71 60.875 71 47V32L48.5 22Z" fill="#FC6339"/>
            {/* 체크 표시 */}
            <Path d="M59.0564 40.293L44.4303 56.001L36.8672 48.147" stroke="white" strokeWidth="4.36331" strokeLinecap="round" strokeLinejoin="round"/>
          </Svg>
        </View>

        {/* 제목 */}
        <Text style={styles.title}>계약서 안전성 검증하기</Text>
        <Text style={styles.subtitle}>AI가 계약서를 분석하여 위험 요소를 찾아드립니다</Text>

        {/* 기능 설명 */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                {/* 문서 아이콘 */}
                <Path fillRule="evenodd" clipRule="evenodd" d="M22.6452 8.387C22.6452 8.3164 22.6171 8.2487 22.5672 8.1988C22.5173 8.1489 22.4496 8.1209 22.379 8.1209H14.9274C14.151 8.1209 13.4064 8.4293 12.8574 8.9783C12.3084 9.5273 12 10.2719 12 11.0483V25.9515C12 26.7279 12.3084 27.4725 12.8574 28.0215C13.4064 28.5705 14.151 28.8789 14.9274 28.8789H25.5726C26.349 28.8789 27.0936 28.5705 27.6426 28.0215C28.1916 27.4725 28.5 26.7279 28.5 25.9515V15.4628C28.5 15.3922 28.472 15.3245 28.4221 15.2746C28.3721 15.2247 28.3045 15.1967 28.2339 15.1967H23.4435C23.2318 15.1967 23.0287 15.1126 22.879 14.9629C22.7293 14.8131 22.6452 14.61 22.6452 14.3983V8.387ZM23.4435 18.766C23.6553 18.766 23.8584 18.8501 24.0081 18.9999C24.1578 19.1496 24.2419 19.3527 24.2419 19.5644C24.2419 19.7761 24.1578 19.9792 24.0081 20.1289C23.8584 20.2787 23.6553 20.3628 23.4435 20.3628H17.0565C16.8447 20.3628 16.6416 20.2787 16.4919 20.1289C16.3422 19.9792 16.2581 19.7761 16.2581 19.5644C16.2581 19.3527 16.3422 19.1496 16.4919 18.9999C16.6416 18.8501 16.8447 18.766 17.0565 18.766H23.4435ZM23.4435 23.0241C23.6553 23.0241 23.8584 23.1082 24.0081 23.2579C24.1578 23.4076 24.2419 23.6107 24.2419 23.8225C24.2419 24.0342 24.1578 24.2373 24.0081 24.387C23.8584 24.5367 23.6553 24.6208 23.4435 24.6208H17.0565C16.8447 24.6208 16.6416 24.5367 16.4919 24.387C16.3422 24.2373 16.2581 24.0342 16.2581 23.8225C16.2581 23.6107 16.3422 23.4076 16.4919 23.2579C16.6416 23.1082 16.8447 23.0241 17.0565 23.0241H23.4435Z" fill="black"/>
                <Path d="M24.2422 8.7313C24.2422 8.5354 24.4476 8.4109 24.5999 8.5333C24.729 8.6376 24.8436 8.759 24.9437 8.8974L28.1511 13.3651C28.2235 13.4673 28.1447 13.5993 28.0191 13.5993H24.5083C24.4377 13.5993 24.37 13.5713 24.3201 13.5214C24.2702 13.4715 24.2422 13.4038 24.2422 13.3332V8.7313Z" fill="black"/>
              </Svg>
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
              <Svg width="36" height="36" viewBox="0 0 40 40" fill="none">
                {/* 경고 삼각형 */}
                <Path fillRule="evenodd" clipRule="evenodd" d="M20 9.5L9 28.5H31L20 9.5Z" fill="black" stroke="black" strokeWidth="2" strokeLinejoin="round"/>
                <Path d="M20 24.5V25M20 16.5L20.004 21.5" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </Svg>
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
              <Ionicons name="checkmark-circle" size={24} color="#000" />
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
            <Ionicons name="information-circle" size={18} color="#666" />
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
    backgroundColor: '#F2F2F2',
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: '#F2F2F2',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 10,
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
    backgroundColor: '#F2F2F2',
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
    color: '#000',
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
    marginBottom: 20,
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
    borderColor: '#000',
    borderWidth: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: '#666',
    lineHeight: 20,
  },
  noticeContainer: {
    backgroundColor: '#E2E2E2',
    borderRadius: 20,
    padding: 16,
    marginBottom: 5,
    marginHorizontal: 20,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  noticeTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#595959',
    marginLeft: 6,
  },
  noticeText: {
    fontSize: 11,
    color: '#595959',
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
    borderRadius: 100,
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
