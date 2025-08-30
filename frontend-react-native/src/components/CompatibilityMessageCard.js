import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const CompatibilityMessageCard = ({ compatibilityScore, message, maxWidth = 280 }) => {
  return (
    <View style={[styles.container, { maxWidth }]}>
      <View style={styles.compatibilityHeader}>
        <Text style={styles.compatibilityText}>
          나와 궁합 점수 {Math.round(compatibilityScore * 100)}%인 사용자
        </Text>
      </View>
      <Text style={styles.messageText}>
        {message}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 12,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  compatibilityHeader: {
    borderRadius: 12,
    borderColor: '#10B585',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  compatibilityText: {
    color: '#000',
    fontSize: 12,
    fontFamily: 'Pretendard',
    fontWeight: '600',
    lineHeight: 16,
  },
  messageText: {
    color: '#000',
    fontSize: 13,
    fontFamily: 'Pretendard',
    fontWeight: '500',
    lineHeight: 18,
    opacity: 0.9,
  },
});

export default CompatibilityMessageCard;
