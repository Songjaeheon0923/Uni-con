import React from 'react';
import Svg, { Path } from 'react-native-svg';

const VotingIcon = ({ size = 16, color = "#333333" }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 6C7 4.34315 8.34315 3 10 3H14C15.6569 3 17 4.34315 17 6V8H19C20.1046 8 21 8.89543 21 10V18C21 19.1046 20.1046 20 19 20H5C3.89543 20 3 19.1046 3 18V10C3 8.89543 3.89543 8 5 8H7V6ZM9 8H15V6C15 5.44772 14.5523 5 14 5H10C9.44772 5 9 5.44772 9 6V8ZM5 10V18H19V10H5Z"
        fill={color}
      />
      <Path
        d="M8 13C8.55228 13 9 12.5523 9 12C9 11.4477 8.55228 11 8 11C7.44772 11 7 11.4477 7 12C7 12.5523 7.44772 13 8 13Z"
        fill={color}
      />
      <Path
        d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z"
        fill={color}
      />
    </Svg>
  );
};

export default VotingIcon;