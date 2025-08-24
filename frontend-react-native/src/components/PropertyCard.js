import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PropertyCard = ({ property, onPress, onFavorite, isFavorited = false }) => {
  const formatPrice = (price, type) => {
    if (!price || isNaN(price)) return '가격 정보 없음';
    
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice)) return '가격 정보 없음';
    
    if (type === '월세') {
      const monthlyPrice = property.price_monthly || 0;
      // price_deposit이 이미 만원 단위인 경우
      const deposit = Math.floor(numericPrice);
      const monthly = Math.floor(monthlyPrice);
      return `${deposit}/${monthly}만원`;
    } else {
      // 전세나 매매의 경우
      if (numericPrice >= 10000) {
        const eok = Math.floor(numericPrice / 10000);
        const man = Math.floor(numericPrice % 10000);
        if (eok > 0 && man > 0) {
          return `${eok}억${man}만원`;
        } else if (eok > 0) {
          return `${eok}억원`;
        } else {
          return `${man}만원`;
        }
      } else {
        return `${numericPrice}만원`;
      }
    }
  };

  const getRoomTypeText = (area, rooms) => {
    // rooms 데이터가 없는 경우 면적을 기준으로 추정
    if (!rooms || rooms === undefined) {
      const numericArea = typeof area === 'string' && area.includes('㎡') 
        ? parseFloat(area) 
        : parseFloat(area);
      
      if (numericArea && numericArea <= 35) {
        return '원룸';
      } else if (numericArea && numericArea <= 50) {
        return '투룸';
      } else if (numericArea && numericArea <= 70) {
        return '쓰리룸';
      } else {
        return '원룸'; // 기본값
      }
    }
    
    if (rooms === 1) {
      return '원룸';
    } else if (rooms === 2) {
      return '투룸';
    } else if (rooms === 3) {
      return '쓰리룸';
    } else {
      return `${rooms}룸`;
    }
  };

  const getFloorText = (floor) => {
    if (!floor) return '';
    if (floor === 1) return '1층';
    if (floor < 0) return `지하${Math.abs(floor)}층`;
    return `${floor}층`;
  };

  const getAreaText = (area) => {
    if (!area) return '';
    
    // 이미 단위가 포함된 문자열인 경우 (예: "29.82㎡")
    if (typeof area === 'string' && area.includes('㎡')) {
      const numericArea = parseFloat(area);
      if (isNaN(numericArea) || numericArea <= 0) return '';
      const pyeong = Math.round(numericArea * 0.3025);
      return `${pyeong}평`;
    }
    
    // 숫자인 경우
    if (isNaN(area)) return '';
    const numericArea = parseFloat(area);
    if (isNaN(numericArea) || numericArea <= 0) return '';
    const pyeong = Math.round(numericArea * 0.3025);
    return `${pyeong}평`;
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardContent}>
        {/* 매물 이미지 */}
        <View style={styles.imageContainer}>
          <View style={styles.placeholderImage}>
            <Ionicons name="home-outline" size={24} color="#999" />
          </View>
        </View>

        {/* 매물 정보 */}
        <View style={styles.propertyInfo}>
          <Text style={styles.priceText}>
            {formatPrice(property.price_deposit, property.transaction_type)}
          </Text>
          
          <Text style={styles.detailText}>
            {getRoomTypeText(property.area, property.rooms)} | {getAreaText(property.area)} | {getFloorText(property.floor)}
          </Text>
          
          <Text style={styles.addressText} numberOfLines={1}>
            {property.address}
          </Text>
          
          {/* 집주인 인증 뱃지 */}
          <View style={styles.badgeContainer}>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#FF6600" />
              <Text style={styles.badgeText}>집주인 인증</Text>
            </View>
          </View>
        </View>

        {/* 즐겨찾기 버튼 */}
        <TouchableOpacity 
          style={styles.favoriteButton}
          onPress={() => onFavorite && onFavorite(property)}
        >
          <Ionicons 
            name={isFavorited ? "heart" : "heart-outline"} 
            size={24} 
            color={isFavorited ? "#FF6B6B" : "#999"} 
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    marginVertical: 6,
    marginHorizontal: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  imageContainer: {
    marginRight: 16,
  },
  placeholderImage: {
    width: 80,
    height: 80,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  propertyInfo: {
    flex: 1,
    paddingRight: 8,
  },
  priceText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  badgeContainer: {
    flexDirection: 'row',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    color: '#FF6600',
    marginLeft: 4,
    fontWeight: '500',
  },
  favoriteButton: {
    padding: 8,
  },
});

export default PropertyCard;