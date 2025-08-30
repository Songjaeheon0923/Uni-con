import React from 'react';
import Svg, { Path } from 'react-native-svg';

const ClipboardIcon = ({ size = 16, color = "#333333" }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 2C7.44772 2 7 2.44772 7 3V4H5C3.89543 4 3 4.89543 3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6C21 4.89543 20.1046 4 19 4H17V3C17 2.44772 16.5523 2 16 2H8ZM9 4H15V6H9V4ZM5 6H7V7C7 7.55228 7.44772 8 8 8H16C16.5523 8 17 7.55228 17 7V6H19V20H5V6Z"
        fill={color}
      />
    </Svg>
  );
};

export default ClipboardIcon;