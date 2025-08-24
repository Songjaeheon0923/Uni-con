import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatPrice, formatArea, getRoomType, formatFloor } from '../utils/priceUtils';

const PropertyCard = ({ property, onPress, onFavorite, isFavorited = false }) => {

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
            {formatPrice(property.price_deposit, property.transaction_type, property.price_monthly, property.room_id || property.id)}
          </Text>
          
          <Text style={styles.detailText}>
            {getRoomType(property.area, property.rooms)} | {formatArea(property.area)} | {formatFloor(property.floor)}
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