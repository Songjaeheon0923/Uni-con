import React from 'react';
import { Svg, Path, G, Defs, Filter, FeFlood, FeColorMatrix, FeOffset, FeGaussianBlur, FeComposite, FeBlend } from 'react-native-svg';

const ShareIcon = ({ size = 20, color = "black" }) => {
  const aspectRatio = 25/26;
  const height = size / aspectRatio;
  return (
    <Svg width={size} height={height} viewBox="0 0 25 26" fill="none">
      <Defs>
        <Filter id="filter0_d_628_34375" x="0.492857" y="0.121428" width="24.2145" height="25.3" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
          <FeFlood floodOpacity="0" result="BackgroundImageFix"/>
          <FeColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
          <FeOffset dy="1.62857"/>
          <FeGaussianBlur stdDeviation="1.62857"/>
          <FeComposite in2="hardAlpha" operator="out"/>
          <FeColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0"/>
          <FeBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_628_34375"/>
          <FeBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_628_34375" result="shape"/>
        </Filter>
      </Defs>
      <G filter="url(#filter0_d_628_34375)">
        <Path d="M12.6 4.08571V13.3143M15.8571 6.25714L12.6 3L9.34286 6.25714M5 11.6857V17.1143C5 17.6902 5.22877 18.2425 5.636 18.6497C6.04322 19.0569 6.59553 19.2857 7.17143 19.2857H18.0286C18.6045 19.2857 19.1568 19.0569 19.564 18.6497C19.9712 18.2425 20.2 17.6902 20.2 17.1143V11.6857" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" shapeRendering="crispEdges"/>
      </G>
    </Svg>
  );
};

export default ShareIcon;