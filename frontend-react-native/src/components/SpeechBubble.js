import React from 'react';
import { View, Text } from 'react-native';

const SpeechBubble = ({ text, style }) => {
  return (
    <View style={[style, { alignItems: 'center' }]}>
      {/* 말풍선 본체 */}
      <View style={{
        backgroundColor: '#10B585',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        position: 'relative',
        minWidth: 140,
      }}>
        <Text style={{
          color: '#fff',
          fontSize: 13,
          fontWeight: '600',
          textAlign: 'center',
        }}>
          {text}
        </Text>
      </View>

      {/* 삼각형 꼬리 */}
      <View style={{
        width: 0,
        height: 0,
        borderLeftWidth: 5,
        borderRightWidth: 5,
        borderTopWidth: 8,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: '#10B585',
        marginTop: -1,
      }} />
    </View>
  );
};

export default SpeechBubble;
