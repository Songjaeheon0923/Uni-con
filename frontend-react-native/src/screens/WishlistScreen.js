// src/screens/WishlistScreen.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function WishlistScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>찜 목록</Text>
      <Text style={styles.subtitle}>즐겨찾기한 매물들이 여기에 올 예정</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
});
