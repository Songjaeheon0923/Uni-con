import React from 'react';
import Svg, { Path } from 'react-native-svg';

const KakaoIcon = ({ size = 24 }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3C7.03 3 3 6.24 3 10.25c0 2.52 1.94 4.75 4.88 6.12-.19-.69-.37-1.19-.5-1.59L6.4 13.12c-.69-.81-1.12-1.87-1.12-3.12 0-2.69 3.13-4.88 7-4.88s7 2.19 7 4.88-3.13 4.88-7 4.88c-.44 0-.87-.06-1.28-.19L9.12 16c-.06.19-.19.44-.25.69C10.06 16.88 11 17 12 17c4.97 0 9-3.24 9-7.25S16.97 3 12 3z"
        fill="#3C1E1E"
      />
    </Svg>
  );
};

export default KakaoIcon;