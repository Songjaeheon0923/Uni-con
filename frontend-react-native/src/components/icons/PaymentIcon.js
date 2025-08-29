import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

const PaymentIcon = ({ size = 60 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 60 60" fill="none">
      <Circle cx="30" cy="30" r="30" fill="#000000" />
      <Path 
        d="M18.1064 24.2734V31.2096C18.1064 32.4562 19.1182 33.468 20.3649 33.468H37.0638C38.3104 33.468 39.3223 32.4562 39.3223 31.2096V24.2734C39.3223 23.0268 38.3104 22.0149 37.0638 22.0149H20.3649C19.1182 22.0149 18.1064 23.0268 18.1064 24.2734Z" 
        fill="white" 
        stroke="white" 
        strokeWidth="1.27751" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      <Path 
        d="M39.3223 26.0819H18.1064" 
        stroke="#000000" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
      />
      <Path 
        d="M33.8511 29.8904H36.3617" 
        stroke="#000000" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
      />
      <Path 
        d="M15.5957 35.2734V41.2096C15.5957 42.4562 16.6076 43.468 17.8543 43.468H34.5532C35.7998 43.468 36.8117 42.4562 36.8117 41.2096V37.0819" 
        stroke="white" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      <Path 
        d="M36.8117 38.8904H15.5957" 
        stroke="white" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
      />
      <Path 
        d="M31.3404 40.6989H33.8511" 
        stroke="white" 
        strokeWidth="1.5" 
        strokeLinecap="round" 
      />
    </Svg>
  );
};

export default PaymentIcon;