import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const FavoriteRoomsScreen = ({ navigation }) => {
  const [favoriteRooms, setFavoriteRooms] = useState([
    {
      id: 1,
      image: null,
      price: '월세 3,000 / 35만원',
      type: '원룸',
      size: '6평',
      floor: '4층',
      maintenance: '관리비 7만원',
      location: '안암역 10분 거리',
      verified: true,
      likes: 13,
    },
    {
      id: 2,
      image: null,
      price: '월세 5,000 / 40만원',
      type: '투룸',
      size: '8평',
      floor: '2층',
      maintenance: '관리비 5만원',
      location: '고려대역 5분 거리',
      verified: true,
      likes: 21,
    },
    {
      id: 3,
      image: null,
      price: '월세 2,000 / 30만원',
      type: '원룸',
      size: '5평',
      floor: '3층',
      maintenance: '관리비 8만원',
      location: '안암역 15분 거리',
      verified: false,
      likes: 8,
    },
  ]);

  const renderRoomCard = ({ item }) => (
    <TouchableOpacity style={styles.cardContainer}>
      <View style={styles.imageContainer}>
        <View style={styles.imagePlaceholder} />
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.contentHeader}>
          <View style={styles.contentLeft}>
            <Text style={styles.price}>{item.price}</Text>
            <Text style={styles.roomInfo}>
              {item.type} | {item.size} | {item.floor}
            </Text>
            <Text style={styles.additionalInfo}>
              {item.maintenance} | {item.location}
            </Text>
            {item.verified && (
              <View style={styles.verificationBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#FF6600" />
                <Text style={styles.verificationText}>집주인 인증</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.heartContainer}>
            <Ionicons name="heart" size={20} color="#FF6B6B" />
            <Text style={styles.heartCount}>{item.likes}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>관심 목록</Text>
      </View>

      <FlatList
        data={favoriteRooms}
        renderItem={renderRoomCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 0,
    marginBottom: 0,
    flexDirection: 'row',
    minHeight: 120,
    borderBottomWidth: 1,
    borderBottomColor: '#E9ECEF',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  imageContainer: {
    width: 100,
    height: 100,
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E9ECEF',
    borderRadius: 8,
  },
  infoContainer: {
    flex: 1,
    paddingLeft: 15,
    justifyContent: 'center',
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  contentLeft: {
    flex: 1,
    paddingRight: 12,
  },
  heartContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  heartCount: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '500',
    color: '#212529',
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 4,
  },
  roomInfo: {
    fontSize: 13,
    fontWeight: '500',
    color: '#495057',
    marginBottom: 3,
  },
  additionalInfo: {
    fontSize: 11,
    color: '#6C757D',
    marginBottom: 6,
  },
  verificationBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF5F0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE5D9',
  },
  verificationText: {
    fontSize: 11,
    color: '#FF6600',
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default FavoriteRoomsScreen;
