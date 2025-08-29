import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import HeartFilledIcon from './icons/HeartFilledIcon';
import HeartOutlineIcon from './icons/HeartOutlineIcon';

const FavoriteButton = ({ 
  isFavorited = false, 
  onPress, 
  size = 30, 
  heartSize = 15,
  style = {} 
}) => {
  const iconSize = heartSize;
  const buttonSize = size;
  const borderRadius = buttonSize / 2;

  return (
    <TouchableOpacity
      style={[
        styles.favoriteButton,
        {
          width: buttonSize,
          height: buttonSize,
          borderRadius: borderRadius,
        },
        style
      ]}
      onPress={onPress}
    >
      {isFavorited ? (
        <HeartFilledIcon size={iconSize} color="#FF6600" />
      ) : (
        <HeartOutlineIcon size={iconSize} color="#999" />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  favoriteButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 0.5,
    borderColor: '#D9D9D9',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default FavoriteButton;