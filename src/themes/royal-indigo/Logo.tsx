import React from 'react';
import { BrandLogo } from '@/src/components/OroLogo';

const RoyalIndigoLogo: React.FC<{ width: number; height: number; color?: string }> = ({
  width,
  height,
}) => (
  <BrandLogo
    width={width}
    height={height}
    color="#4F46E5"
    textColor="#4F46E5"
    name="OroCommerce"
  />
);

export default RoyalIndigoLogo;
