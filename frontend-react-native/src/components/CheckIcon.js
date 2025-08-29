import React from 'react';
import Svg, { Path } from 'react-native-svg';

const CheckIcon = ({ width = 10, height = 7, color = "black", strokeWidth = 1.38314 }) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 10 7" fill="none">
      <Path 
        d="M8.76946 1.33667L3.97458 6.31596L1.57715 3.82631" 
        stroke={color} 
        strokeWidth={strokeWidth} 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default CheckIcon;