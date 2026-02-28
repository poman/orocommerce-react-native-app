import React from 'react';
import { BrandLogo } from '@/src/components/OroLogo';

const RefreshingTealsLogo: React.FC<{ width: number; height: number; color?: string }> = ({
  width,
  height,
}) => (
  <BrandLogo
    width={width}
    height={height}
    color="#0D9488"
    textColor="#0D9488"
    name="OroCommerce"
  />
);

export default RefreshingTealsLogo;
