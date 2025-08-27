import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DraggableBottomSheet from './DraggableBottomSheet';
import PropertyCard from './PropertyCard';

const BuildingClusterView = ({ building, properties, navigation, onClose, onSelectProperty, favorites = [], onToggleFavorite }) => {

  // 같은 건물 내 매물들을 층수와 호수로 정렬
  const sortedProperties = properties.sort((a, b) => {
    // 먼저 층수로 정렬
    if (a.floor !== b.floor) {
      return b.floor - a.floor; // 높은 층부터
    }
    // 같은 층이면 가격순으로 정렬
    return a.price_deposit - b.price_deposit;
  });

  const handlePropertySelect = (property) => {

    // Mock 데이터와 실제 데이터 구분하여 직접 상세 페이지로 이동
    if (navigation) {
      if (property.id && property.id.startsWith('mock_')) {
        // Mock 데이터는 알림 표시
        Alert.alert('알림', '샘플 데이터입니다. 실제 매물을 확인해주세요.');
      } else {
        // 실제 데이터는 상세 화면으로 바로 이동
        navigation.navigate('RoomDetail', { roomId: property.id });
      }
    } else {
      // navigation이 없는 경우 기존 방식 사용
      onSelectProperty(property);
    }

    onClose();
  };

  const handleFavorite = (property) => {
    if (onToggleFavorite) {
      onToggleFavorite(property);
    }
  };

  return (
    <DraggableBottomSheet
      isVisible={true}
      onClose={onClose}
      snapPoints={[0.22, 0.7, 0.9]}
      initialHeight={0.47}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <View>
          <Text style={styles.buildingName} numberOfLines={2}>{building}</Text>
          <Text style={styles.propertyCount}>매물 {properties.length}개</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* 매물 카드 리스트 */}
      <ScrollView
        style={styles.propertyList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {sortedProperties.map((property) => (
          <PropertyCard
            key={property.room_id || property.id}
            property={property}
            onPress={() => handlePropertySelect(property)}
            onFavorite={handleFavorite}
            isFavorited={favorites.includes(property.room_id || property.id)}
          />
        ))}
      </ScrollView>
    </DraggableBottomSheet>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 4,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  buildingName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    lineHeight: 24,
    maxWidth: 280,
  },
  propertyCount: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  closeButton: {
    padding: 4,
  },
  propertyList: {
    flex: 1,
    marginTop: 8,
  },
  scrollContent: {
    paddingBottom: 100, // 바텀 여유 공간
  },
});

export default BuildingClusterView;
