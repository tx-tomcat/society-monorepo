import * as React from 'react';
import type { SvgProps } from 'react-native-svg';
import Svg, { Path, Rect } from 'react-native-svg';

export function CreditCard({ color = '#6B6572', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Rect
        x={2}
        y={5}
        width={20}
        height={14}
        rx={2}
        stroke={color}
        strokeWidth={2}
      />
      <Path d="M2 10H22" stroke={color} strokeWidth={2} />
      <Path d="M6 15H10" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
