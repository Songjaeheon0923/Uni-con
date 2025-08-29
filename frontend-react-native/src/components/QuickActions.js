import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import FavoritePropertyIcon from './icons/FavoritePropertyIcon';
import CommonInterestsIcon from './icons/CommonInterestsIcon';

const QuickActions = ({ onActionPress, visible, height = 280 }) => {
  if (!visible) return null;

  const actions = [
    {
      id: 'favorites',
      title: '관심 매물',
      iconFamily: 'Custom',
      iconName: 'FavoritePropertyIcon'
    },
    {
      id: 'common_interests', 
      title: '공통 관심',
      iconFamily: 'Custom',
      iconName: 'CommonInterestsIcon'
    },
    {
      id: 'rules',
      title: '규칙/가이드',
      iconFamily: 'Image',
      iconName: 'rule'
    },
    {
      id: 'payment',
      title: '정산/결제',
      iconFamily: 'Image',
      iconName: 'payment'
    }
  ];

  return (
    <View style={[styles.container, { height }]}>      
      <View style={styles.actionsContainer}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.actionItem}
            onPress={() => onActionPress(action.id)}
          >
            {action.iconFamily === 'Custom' && (
              <>
                {action.iconName === 'FavoritePropertyIcon' && <FavoritePropertyIcon size={60} />}
                {action.iconName === 'CommonInterestsIcon' && <CommonInterestsIcon size={60} />}
              </>
            )}
            {action.iconFamily === 'Image' && (
              <Image 
                source={
                  action.iconName === 'rule' 
                    ? require('../../assets/rule.png') 
                    : require('../../assets/payment.png')
                } 
                style={{ width: 60, height: 60 }} 
              />
            )}
            <Text style={styles.actionText}>{action.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    width: '100%',
    // height는 동적으로 props에서 받음
  },
  actionsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between', // space-around에서 space-between으로 변경하여 간격 넓힘
    alignItems: 'flex-start', // center에서 flex-start로 변경하여 위로 정렬
    paddingHorizontal: 40, // 33에서 20으로 줄여서 버튼들이 더 넓게 분산되도록 조정
    paddingTop: 50, // 20에서 40으로 증가하여 더 위로 올림 (픽셀 조정 가능)
  },
  actionItem: {
    width: 60,
    alignItems: 'center',
    gap: 12,
  },
  actionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 12.66,
    fontFamily: 'Pretendard',
    fontWeight: '500',
    color: '#000000',
    textAlign: 'center',
    lineHeight: 28.84,
  },
});

export default QuickActions;