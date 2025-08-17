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
import { formatRentPrice } from '../utils/priceFormatter';

export default function LandlordInfoScreen({ route, navigation }) {
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

  const handleCall = () => {
    Alert.alert('전화걸기', '전화를 걸겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '전화걸기', onPress: () => console.log('전화걸기') },
    ]);
  };

  const handleViewContract = () => {
    navigation.navigate('ContractView', { roomId });
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
        {/* 가격 정보 */}
        <View style={styles.priceContainer}>
          <Text style={styles.price}>
            {formatRentPrice(room.price_deposit, room.price_monthly)}
          </Text>
          <Text style={styles.description}>
            넓고 깔끔한 풀 옵션 원룸
          </Text>
        </View>

        {/* 상세 정보 */}
        <View style={styles.detailsContainer}>
          <Text style={styles.sectionTitle}>상세 정보</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>건물 유형</Text>
            <Text style={styles.detailValue}>가나빌라빌라</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>층/층 구조</Text>
            <Text style={styles.detailValue}>4층 / 5층</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>방개수/전용면적</Text>
            <Text style={styles.detailValue}>{room.rooms || 1}개 / {room.area}㎡</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>관리비</Text>
            <Text style={styles.detailValue}>7만원 (수도 포함)</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>방향</Text>
            <Text style={styles.detailValue}>남향</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>난방종류</Text>
            <Text style={styles.detailValue}>개별난방</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>엘리베이터</Text>
            <Text style={styles.detailValue}>있음</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>입구구조</Text>
            <Text style={styles.detailValue}>독립 (원룸 내부로 가기)</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>사용승인일</Text>
            <Text style={styles.detailValue}>2024.03.25</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>최초등록일</Text>
            <Text style={styles.detailValue}>2024.09.23</Text>
          </View>
        </View>

        {/* 집주인 정보 */}
        <View style={styles.landlordContainer}>
          <Text style={styles.sectionTitle}>집주인 정보</Text>
          <Text style={styles.verificationBadge}>✓ 확인된 집주인</Text>
          
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

        {/* 매물 계약서 확인하기 */}
        <View style={styles.contractContainer}>
          <Text style={styles.sectionTitle}>이 매물 계약서 확인하기</Text>
          <TouchableOpacity style={styles.contractPreview} onPress={handleViewContract}>
            <Image 
              source={{ uri: 'https://via.placeholder.com/300x400/f0f0f0/666?text=계약서' }}
              style={styles.contractImage}
              resizeMode="contain"
            />
            <TouchableOpacity style={styles.contractButton} onPress={handleViewContract}>
              <Text style={styles.contractButtonText}>계약서 접수하기</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>

        {/* 하단 버튼들 */}
        <View style={styles.bottomButtons}>
          <TouchableOpacity style={styles.roommateButton}>
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
  priceContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  detailsContainer: {
    padding: 16,
    borderBottomWidth: 8,
    borderBottomColor: '#f8f9fa',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  landlordContainer: {
    padding: 16,
    borderBottomWidth: 8,
    borderBottomColor: '#f8f9fa',
  },
  verificationBadge: {
    fontSize: 12,
    color: '#4CAF50',
    marginBottom: 16,
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
  },
  contractImage: {
    width: 250,
    height: 300,
    backgroundColor: '#f0f0f0',
    marginBottom: 16,
    borderRadius: 8,
  },
  contractButton: {
    backgroundColor: '#666',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contractButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomButtons: {
    padding: 16,
    flexDirection: 'row',
    gap: 12,
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