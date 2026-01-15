import * as React from 'react';
import type { SvgProps } from 'react-native-svg';
import Svg, { Path, Circle } from 'react-native-svg';

export function Occasions({ color = '#FF6B8A', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={2} />
      <Path d="M8 16H16L18 22H6L8 16Z" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 4V2M8 5L6 3M16 5L18 3" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
