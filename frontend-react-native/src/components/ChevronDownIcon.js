import React from 'react';
import Svg, { Path } from 'react-native-svg';

const ChevronDownIcon = ({ width = 10, height = 6, color = "#999999" }) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 10 6" fill="none">
      <Path
        d="M1.20711 0.5C0.761654 0.5 0.538571 1.03857 0.853553 1.35355L4.64645 5.14645C4.84171 5.34171 5.15829 5.34171 5.35355 5.14645L9.14645 1.35355C9.46143 1.03857 9.23835 0.5 8.79289 0.5H1.20711Z"
        fill={color}
      />
    </Svg>
  );
};

export default ChevronDownIcon;