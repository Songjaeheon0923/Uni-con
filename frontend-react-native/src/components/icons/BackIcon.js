import React from 'react';
import { Svg, Path, G, Defs, Filter, FeFlood, FeColorMatrix, FeOffset, FeGaussianBlur, FeComposite, FeBlend } from 'react-native-svg';

const BackIcon = ({ size = 29, color = "#595959" }) => {
  return (
    <Svg width={size} height={size} viewBox="3 3 24 22" fill="none">
      <Defs>
        <Filter id="filter0_d_628_34372" x="0.5" y="0.954056" width="28" height="30.0919" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <FeFlood floodOpacity="0" result="BackgroundImageFix"/>
          <FeColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <FeOffset dy="2"/>
          <FeGaussianBlur stdDeviation="2"/>
          <FeComposite in2="hardAlpha" operator="out"/>
          <FeColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0"/>
          <FeBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_628_34372"/>
          <FeBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_628_34372" result="shape"/>
        </Filter>
      </Defs>
      <G filter="url(#filter0_d_628_34372)">
        <Path d="M23 15.5C23.8284 15.5 24.5 14.8284 24.5 14C24.5 13.1716 23.8284 12.5 23 12.5V14V15.5ZM4.93934 12.9393C4.35355 13.5251 4.35355 14.4749 4.93934 15.0607L14.4853 24.6066C15.0711 25.1924 16.0208 25.1924 16.6066 24.6066C17.1924 24.0208 17.1924 23.0711 16.6066 22.4853L8.12132 14L16.6066 5.51472C17.1924 4.92893 17.1924 3.97919 16.6066 3.3934C16.0208 2.80761 15.0711 2.80761 14.4853 3.3934L4.93934 12.9393ZM23 14V12.5L6 12.5V14V15.5L23 15.5V14Z" fill={color}/>
      </G>
    </Svg>
  );
};

export default BackIcon;
