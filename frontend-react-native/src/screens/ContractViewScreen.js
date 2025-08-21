import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ApiService from '../services/api';

export default function ContractViewScreen({ route, navigation }) {
  const { roomId } = route.params;
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoomDetail();
  }, [roomId]);

  const loadRoomDetail = async () => {
    try {
      setLoading(true);
      const roomData = await ApiService.getRoomDetail(roomId);
      setRoom(roomData);
    } catch (error) {
      console.error('방 정보 로드 실패:', error);
      Alert.alert('오류', '방 정보를 불러올 수 없습니다.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitContract = () => {
    Alert.alert('계약서 접수', '계약서를 접수하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '접수하기', onPress: () => console.log('계약서 접수') },
    ]);
  };

  const handleRoommateSearch = () => {
    navigation.navigate('RoommateSearch', { roomId });
  };

  const handleCall = () => {
    Alert.alert('전화걸기', '전화를 걸겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '전화걸기', onPress: () => console.log('전화걸기') },
    ]);
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

  if (!room) return null;

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.favoriteButton}>
          <Ionicons name="heart-outline" size={24} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* 집주인 정보 */}
        <View style={styles.landlordContainer}>
          <Text style={styles.sectionTitle}>집주인 정보</Text>
          <View style={styles.verificationBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#FF6600" />
            <Text style={styles.verificationText}>확인된 집주인</Text>
          </View>
          
          <View style={styles.landlordInfo}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>송*원</Text>
              </View>
            </View>
            <View style={styles.landlordDetails}>
              <Text style={styles.landlordName}>송*원</Text>
              <Text style={styles.landlordPhone}>연락처: 010-0504-123-4567 (안심번호)</Text>
              <Text style={styles.landlordNote}>소유자 선임: 등기상 소유자</Text>
            </View>
          </View>
        </View>

        {/* 계약서 정보 */}
        <View style={styles.contractContainer}>
          <Text style={styles.sectionTitle}>이 매물 계약서 확인하기</Text>
          
          <View style={styles.contractPreview}>
            <Image 
              source={{ uri: 'https://via.placeholder.com/350x450/f0f0f0/666?text=부동산매매계약서' }}
              style={styles.contractImage}
              resizeMode="contain"
            />
            
            <TouchableOpacity style={styles.contractSubmitButton} onPress={handleSubmitContract}>
              <Text style={styles.contractSubmitText}>계약서 접수하기</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 하단 버튼들 */}
        <View style={styles.bottomButtons}>
          <TouchableOpacity style={styles.roommateButton} onPress={handleRoommateSearch}>
            <Text style={styles.roommateButtonText}>룸메이트 구하기</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.callButton} onPress={handleCall}>
            <Text style={styles.callButtonText}>전화하기</Text>
            <Ionicons name="arrow-forward" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 44, // 노치 영역 고려
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  landlordContainer: {
    padding: 16,
    borderBottomWidth: 8,
    borderBottomColor: '#f8f9fa',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FFE5D9',
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: 16,
  },
  verificationText: {
    fontSize: 11,
    color: '#FF6600',
    fontWeight: '600',
  },
  landlordInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  landlordDetails: {
    flex: 1,
  },
  landlordName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  landlordPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  landlordNote: {
    fontSize: 12,
    color: '#999',
  },
  contractContainer: {
    padding: 16,
    borderBottomWidth: 8,
    borderBottomColor: '#f8f9fa',
  },
  contractPreview: {
    alignItems: 'center',
    marginTop: 16,
  },
  contractImage: {
    width: 350,
    height: 450,
    backgroundColor: '#f0f0f0',
    marginBottom: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  contractSubmitButton: {
    backgroundColor: '#666',
    borderRadius: 8,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  contractSubmitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomButtons: {
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 32,
  },
  roommateButton: {
    flex: 1,
    backgroundColor: '#666',
    borderRadius: 8,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  roommateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  callButton: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 8,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  callButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});