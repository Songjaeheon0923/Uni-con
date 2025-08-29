import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

const RulesGuideIcon = ({ size = 60 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <Circle cx="30" cy="30" r="30" fill="#10B585" />
      <Path 
        d="M22.4463 40.6383V17H17.7016C17.009 17 16.4463 17.5626 16.4463 18.2553V39.383C16.4463 40.0757 17.009 40.6383 17.7016 40.6383H22.4463Z" 
        fill="white" 
        stroke="white" 
        strokeWidth="1.27751" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      <Path 
        d="M40.4463 40.6383V17H23.9463V40.6383H40.4463Z" 
        fill="white" 
        stroke="white" 
        strokeWidth="1.27751" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      <Path 
        d="M29.1963 24.0426H34.6963" 
        stroke="#10B585" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
      />
      <Path 
        d="M29.1963 28H34.6963" 
        stroke="#10B585" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
      />
      <Path 
        d="M29.1963 31.9574H34.6963" 
        stroke="#10B585" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
      />
    </Svg>
  );
};

export default RulesGuideIcon;