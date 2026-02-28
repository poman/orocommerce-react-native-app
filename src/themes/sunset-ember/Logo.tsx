import React from 'react';
import { BrandLogo } from '@/src/components/OroLogo';

const SunsetEmberLogo: React.FC<{ width: number; height: number; color?: string }> = ({
  width,
  height,
}) => (
  <BrandLogo
    width={width}
    height={height}
    color="#DC2626"
    textColor="#DC2626"
    name="OroCommerce"
  />
);

export default SunsetEmberLogo;
