import React from 'react';
import { Image } from 'expo-image';

const GoldenCarbonLogo: React.FC<{ width: number; height: number; color?: string }> = ({
  width,
  height,
}) => (
  <Image
    source={require('@/assets/images/oro_logo_horizontal.png')}
    style={{ width, height }}
    contentFit="contain"
  />
);

export default GoldenCarbonLogo;
