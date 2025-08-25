import React from 'react';
import Svg, { Path } from 'react-native-svg';

const LocationIcon = ({ width = 22, height = 23, color = "#595959" }) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 22 23" fill="none">
      <Path
        d="M5.86638 4.86387C7.2325 3.52507 9.07178 2.77949 10.9845 2.78916C12.8973 2.79882 14.7289 3.56294 16.0815 4.91547C17.434 6.268 18.1981 8.09965 18.2078 10.0124C18.2174 11.9251 17.4718 13.7644 16.133 15.1305L12.2959 18.9677C11.9521 19.3114 11.4858 19.5045 10.9997 19.5045C10.5136 19.5045 10.0473 19.3114 9.70354 18.9677L5.86638 15.1305C4.50502 13.769 3.74023 11.9226 3.74023 9.99721C3.74023 8.07186 4.50502 6.22537 5.86638 4.86387Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill="none"
      />
      <Path
        d="M11 12.748C12.5188 12.748 13.75 11.5168 13.75 9.99805C13.75 8.47926 12.5188 7.24805 11 7.24805C9.48122 7.24805 8.25 8.47926 8.25 9.99805C8.25 11.5168 9.48122 12.748 11 12.748Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
};

export default LocationIcon;
