import React from 'react';
import Svg, { Path } from 'react-native-svg';

const ChatIcon = ({ size = 21, color = 'black' }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 21 21" fill="none">
      <Path
        d="M1.54102 10.4985C1.54102 8.12233 2.48496 5.84345 4.16518 4.16323C5.84541 2.483 8.12428 1.53906 10.5005 1.53906C12.8767 1.53906 15.1555 2.483 16.8358 4.16323C18.516 5.84345 19.4599 8.12233 19.4599 10.4985V16.199C19.4599 17.1487 19.4599 17.6213 19.3188 18.0009C19.2066 18.3018 19.031 18.575 18.804 18.802C18.577 19.0291 18.3037 19.2047 18.0029 19.3169C17.6232 19.458 17.1495 19.458 16.2009 19.458H10.5005C8.12428 19.458 5.84541 18.514 4.16518 16.8338C2.48496 15.1536 1.54102 12.8747 1.54102 10.4985Z"
        stroke={color}
        strokeWidth="2.10811"
      />
      <Path
        d="M7.14062 9.37891H13.8602M10.5004 13.8586H13.8602"
        stroke={color}
        strokeWidth="2.10811"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

export default ChatIcon;