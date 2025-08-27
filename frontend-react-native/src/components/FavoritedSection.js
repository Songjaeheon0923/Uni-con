import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const FavoritedSection = ({ 
  userCount = 0, 
  showMatchScores = false, 
  onToggleMatchScores 
}) => {
  return (
    <View style={styles.favoritedSection}>
      <View style={styles.favoritedLeft}>
        <Text style={styles.favoritedText}>이 매물을 찜한 유저 {userCount}명</Text>
      </View>
      <View style={styles.favoritedRight}>
        <TouchableOpacity
          style={[styles.matchScoreToggle, showMatchScores && styles.matchScoreToggleActive]}
          onPress={onToggleMatchScores}
        >
          <Text style={[styles.matchScoreToggleText, showMatchScores && styles.matchScoreToggleTextActive]}>
            궁합 점수 확인하기
          </Text>
        </TouchableOpacity>
        <View style={styles.heartIcon}>
          <Ionicons name="heart" size={16} color="#FC6339" />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  favoritedSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
  },
  favoritedLeft: {
    flex: 1,
  },
  favoritedText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  favoritedRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  matchScoreToggle: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f5f5f5',
  },
  matchScoreToggleActive: {
    backgroundColor: '#10B585',
  },
  matchScoreToggleText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  matchScoreToggleTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  heartIcon: {
    width: 21,
    height: 21,
    borderRadius: 10.5,
    backgroundColor: 'white',
    borderWidth: 0.5,
    borderColor: '#D9D9D9',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default FavoritedSection;