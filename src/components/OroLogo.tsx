import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Text as SvgText } from 'react-native-svg';

interface LogoProps {
  width?: number;
  height?: number;
  color?: string;
}

/**
 * OroCommerce diamond logo rendered as an SVG component.
 * Based on /assets/images/mob_logo.svg — accepts a custom fill color.
 */
const OroLogo: React.FC<LogoProps> = ({ width = 32, height = 32, color = '#B48C50' }) => (
  <Svg width={width} height={height} viewBox="0 0 360 360" fill="none">
    <Path
      d="M281.606 244.157C278.026 240.578 273.129 239.347 266.913 240.465C260.697 241.583 255.015 244.717 249.866 249.866C244.717 255.015 241.583 260.697 240.465 266.913C239.347 273.129 240.578 278.026 244.157 281.605C247.737 285.185 252.634 286.415 258.85 285.297C265.065 284.179 270.748 281.046 275.897 275.897C281.046 270.748 284.18 265.065 285.298 258.85C286.416 252.634 285.185 247.736 281.606 244.157ZM304.257 169.443L189.72 54.9066C188.31 53.4966 186.349 53.0176 183.836 53.4695C181.324 53.9214 179.053 55.1616 177.025 57.1901L57.1903 177.024C55.1619 179.053 53.9217 181.323 53.4698 183.836C53.0178 186.349 53.4969 188.31 54.9069 189.72L169.444 304.257C170.854 305.667 172.815 306.146 175.328 305.694C177.84 305.242 180.111 304.002 182.139 301.973L301.974 182.139C304.002 180.111 305.242 177.84 305.694 175.327C306.146 172.815 305.667 170.853 304.257 169.443ZM121.355 76.4165C119.619 74.6811 117.503 75.0617 115.007 77.5582L77.5585 115.006C75.0619 117.503 74.6814 119.619 76.4168 121.354C78.1522 123.09 80.2681 122.709 82.7647 120.213L120.213 82.7644C122.709 80.2679 123.09 78.1519 121.355 76.4165ZM186.158 6.40664L352.757 173.006C358.397 178.646 360.313 186.491 358.506 196.542C356.698 206.593 351.737 215.675 343.623 223.789L223.789 343.623C215.675 351.737 206.593 356.698 196.542 358.505C186.491 360.313 178.646 358.397 173.006 352.757L6.40689 186.158C0.766826 180.518 -1.14935 172.672 0.658359 162.622C2.46607 152.571 7.42681 143.488 15.5406 135.375L135.375 15.5403C143.489 7.42656 152.571 2.46581 162.622 0.658102C172.673 -1.14961 180.518 0.766568 186.158 6.40664Z"
      fill={color}
    />
  </Svg>
);

export default OroLogo;

interface BrandLogoProps {
  width: number;
  height: number;
  color?: string;
  /** Short store name displayed next to the diamond icon */
  name: string;
  /** Text color (defaults to color) */
  textColor?: string;
}

/**
 * Combined brand logo: 32×32 diamond icon + short store name as SVG text.
 * Used by theme Logo components to render a full branded header mark.
 */
export const BrandLogo: React.FC<BrandLogoProps> = ({
  width,
  height,
  color = '#B48C50',
  name,
  textColor,
}) => {
  const iconSize = Math.min(height, 32);
  const nameColor = textColor ?? color;
  const textWidth = Math.max(width - iconSize - 8, 60);
  const fontSize = Math.min(iconSize * 0.886, 22);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', height, gap: 6 }}>
      <OroLogo width={iconSize} height={iconSize} color={color} />
      <Svg width={textWidth} height={height} viewBox={`0 0 ${textWidth} ${height}`}>
        <SvgText
          x="0"
          y={height / 2}
          textAnchor="start"
          alignmentBaseline="central"
          fontSize={fontSize}
          fontWeight="700"
          fill={nameColor}
          letterSpacing={0.5}
        >
          {name}
        </SvgText>
      </Svg>
    </View>
  );
};
