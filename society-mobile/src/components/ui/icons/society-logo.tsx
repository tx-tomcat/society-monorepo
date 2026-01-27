import * as React from 'react';
import { Image, type ImageStyle, type StyleProp } from 'react-native';

type HiremeLogoProps = {
  width?: number;
  height?: number;
  color?: string;
  style?: StyleProp<ImageStyle>;
};

export function HiremeLogo({ width = 48, height = 48, color, style }: HiremeLogoProps) {
  return (
    <Image
      source={require('../../../../assets/logo.png')}
      style={[{ width, height, tintColor: color }, style]}
      resizeMode="contain"
    />
  );
}

