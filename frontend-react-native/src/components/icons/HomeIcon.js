import React from 'react';
import Svg, { Path } from 'react-native-svg';

const HomeIcon = ({ size = 16, color = "#333333" }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3L2 12H5V20C5 20.5523 5.44772 21 6 21H9V15C9 14.4477 9.44772 14 10 14H14C14.5523 14 15 14.4477 15 15V21H18C18.5523 21 19 20.5523 19 20V12H22L12 3Z"
        fill={color}
      />
    </Svg>
  );
};

export default HomeIcon;