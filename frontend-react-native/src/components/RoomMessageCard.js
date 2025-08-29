import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatPrice, formatArea, getRoomType, formatFloor } from '../utils/priceUtils';
import FavoriteButton from './FavoriteButton';

// 매물 이미지 가져오기 (MapScreen과 동일한 로직)
const getRoomImage = (roomId) => {
  const imageIndex = parseInt(roomId?.toString().slice(-1) || '0') % 8;
  const roomImages = [
    'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
    'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
    'https://images.pexels.com/photos/2029722/pexels-photo-2029722.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
    'https://images.pexels.com/photos/1571453/pexels-photo-1571453.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
    'https://images.pexels.com/photos/2079249/pexels-photo-2079249.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
    'https://images.pexels.com/photos/2121121/pexels-photo-2121121.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
    'https://images.pexels.com/photos/1454804/pexels-photo-1454804.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop',
    'https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=400&h=300&fit=crop'
  ];
  return roomImages[imageIndex];
};

// 관리비 포맷팅 (MapScreen과 동일한 로직)
const formatMaintenanceCost = (area) => {
  if (!area) return "7만";
  const numericArea = parseFloat(area.toString().replace(/㎡/g, ''));
  if (isNaN(numericArea)) return "7만";
  const cost = Math.round(numericArea * 1000);
  const manWon = Math.round(cost / 10000);
  return `${manWon}만`;
};

// 가장 가까운 역 정보 (MapScreen과 동일한 로직)
const getNearestStation = (address) => {
  if (!address) return "안암역 10분 거리";
  if (address.includes("성수동")) return "성수역 5분 거리";
  if (address.includes("안암동")) return "안암역 7분 거리";
  if (address.includes("종로")) return "종로3가역 8분 거리";
  if (address.includes("성북")) return "성신여대입구역 10분 거리";
  if (address.includes("동대문")) return "동대문역 6분 거리";
  return "안암역 10분 거리";
};

const RoomMessageCard = ({ roomData, onPress, isFavorited = false, onFavoriteToggle }) => {
  if (!roomData) {
    return null;
  }

  // 실제 렌더링 값들 계산
  const priceText = `${roomData.transaction_type} ${formatPrice(roomData.price_deposit, roomData.transaction_type, roomData.price_monthly, roomData.room_id)}`;
  const subInfoText = `${getRoomType(roomData.area, roomData.rooms)} | ${formatArea(roomData.area)} | ${formatFloor(roomData.floor)}`;
  const addressText = `관리비 ${formatMaintenanceCost(roomData.area)}원 | ${getNearestStation(roomData.address)}`;

  return (
    <View
      style={{
        backgroundColor: '#ffffff',
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        width: '100%',
        maxWidth: 280,
      }}
    >
      {/* 상단 섹션: 이미지 + 텍스트 정보 + 찜 버튼 */}
      <View style={{
        flexDirection: 'row',
        marginBottom: 10,
      }}>
        {/* 이미지 */}
        <Image
          source={{ uri: getRoomImage(roomData?.room_id) }}
          style={{
            width: 70,
            height: 70,
            borderRadius: 8,
            marginRight: 10,
          }}
        />

        {/* 텍스트 정보 */}
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={{
            fontSize: 14,
            fontWeight: '700',
            color: '#000000',
            marginBottom: 3,
          }}>
            {priceText}
          </Text>
          <Text style={{
            fontSize: 10,
            color: '#666666',
            marginBottom: 2,
          }}>
            {subInfoText}
          </Text>
          <Text style={{
            fontSize: 10,
            color: '#666666',
            marginBottom: 6,
          }}>
            {addressText}
          </Text>
          {/* 집주인 인증 배지 */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#595959',
            paddingHorizontal: 6,
            paddingVertical: 3,
            borderRadius: 6,
            alignSelf: 'flex-start',
          }}>
            <Ionicons name="checkmark-circle" size={10} color="#fff" />
            <Text style={{
              fontSize: 9,
              color: '#fff',
              marginLeft: 3,
              fontWeight: '600',
            }}>
              집주인 인증
            </Text>
          </View>
        </View>

        {/* 찜 하트와 개수 */}
        <View style={{
          alignItems: 'center',
          justifyContent: 'flex-start',
        }}>
          <FavoriteButton
            isFavorited={isFavorited}
            onPress={onFavoriteToggle}
            size={22}
            heartSize={11}
          />
          <Text style={{
            fontSize: 10,
            color: '#999',
            fontWeight: '500',
            marginTop: 3,
            textAlign: 'center',
          }}>
            {roomData.favorite_count || 0}
          </Text>
        </View>
      </View>

      {/* 하단 섹션: 매물 확인하기 버튼 */}
      <TouchableOpacity
        style={{
          backgroundColor: '#000000',
          borderRadius: 25,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 12,
          paddingHorizontal: 20,
          position: 'relative',
          width: '100%',
        }}
        onPress={onPress}
      >
        <Text style={{
          color: '#FFFFFF',
          fontSize: 11,
          fontWeight: '700',
        }}>
          매물 확인하기
        </Text>
        <View style={{
          position: 'absolute',
          right: 3,
          width: 28,
          height: 28,
          borderRadius: 25,
          backgroundColor: '#FF6600',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Ionicons name="arrow-forward" size={25} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    </View>
  );
};


export default RoomMessageCard;
