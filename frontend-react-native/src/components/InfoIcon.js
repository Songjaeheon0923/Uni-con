import React from 'react';
import Svg, { Circle, Path, G, Defs, Filter, FeFlood, FeColorMatrix, FeOffset, FeGaussianBlur, FeComposite, FeBlend } from 'react-native-svg';

const InfoIcon = ({ width = 36, height = 36 }) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 36 36" fill="none">
      <Circle cx="18" cy="16" r="14" fill="black"/>
      <G filter="url(#filter0_d_628_32627)">
        <Path 
          d="M18 23C18.3967 23 18.7294 22.8656 18.9982 22.5968C19.267 22.328 19.4009 21.9957 19.4 21.6V16C19.4 15.6033 19.2656 15.2711 18.9968 15.0032C18.728 14.7353 18.3957 14.6009 18 14.6C17.6043 14.5991 17.272 14.7335 17.0032 15.0032C16.7344 15.2729 16.6 15.6052 16.6 16V21.6C16.6 21.9967 16.7344 22.3294 17.0032 22.5982C17.272 22.867 17.6043 23.0009 18 23ZM18 11.8C18.3967 11.8 18.7294 11.6656 18.9982 11.3968C19.267 11.128 19.4009 10.7957 19.4 10.4C19.3991 10.0043 19.2647 9.672 18.9968 9.4032C18.7289 9.1344 18.3967 9 18 9C17.6033 9 17.2711 9.1344 17.0032 9.4032C16.7353 9.672 16.6009 10.0043 16.6 10.4C16.5991 10.7957 16.7335 11.1285 17.0032 11.3982C17.2729 11.6679 17.6052 11.8019 18 11.8ZM18 30C16.0633 30 14.2433 29.6323 12.54 28.8968C10.8367 28.1613 9.355 27.1641 8.095 25.905C6.835 24.6459 5.83773 23.1643 5.1032 21.46C4.36867 19.7557 4.00094 17.9357 4 16C3.99907 14.0643 4.3668 12.2443 5.1032 10.54C5.8396 8.83573 6.83687 7.35407 8.095 6.095C9.35313 4.83593 10.8348 3.83867 12.54 3.1032C14.2452 2.36773 16.0652 2 18 2C19.9348 2 21.7548 2.36773 23.46 3.1032C25.1652 3.83867 26.6469 4.83593 27.905 6.095C29.1631 7.35407 30.1609 8.83573 30.8982 10.54C31.6355 12.2443 32.0028 14.0643 32 16C31.9972 17.9357 31.6294 19.7557 30.8968 21.46C30.1641 23.1643 29.1669 24.6459 27.905 25.905C26.6431 27.1641 25.1615 28.1618 23.46 28.8982C21.7585 29.6346 19.9385 30.0019 18 30Z" 
          fill="white"
        />
      </G>
      <Defs>
        <Filter id="filter0_d_628_32627" x="0" y="0" width="36" height="36" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <FeFlood floodOpacity="0" result="BackgroundImageFix"/>
          <FeColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <FeOffset dy="2"/>
          <FeGaussianBlur stdDeviation="2"/>
          <FeComposite in2="hardAlpha" operator="out"/>
          <FeColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0"/>
          <FeBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_628_32627"/>
          <FeBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_628_32627" result="shape"/>
        </Filter>
      </Defs>
    </Svg>
  );
};

export default InfoIcon;