import React from 'react';
import Svg, { Path } from 'react-native-svg';

const DocumentIcon = ({ size = 24, color = 'black' }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 22C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18ZM13 4L18 9H13V4ZM7 8H10V10H7V8ZM7 12H17V14H7V12ZM7 16H17V18H7V16Z"
        fill={color}
      />
    </Svg>
  );
};

export default DocumentIcon;