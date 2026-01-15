import * as React from 'react';
import type { SvgProps } from 'react-native-svg';
import Svg, { Path } from 'react-native-svg';

export function Crown({ color = '#FFD93D', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M3 18L5 8L9 11L12 5L15 11L19 8L21 18H3Z"
        fill={color}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 18H21V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V18Z"
        fill={color}
        stroke={color}
        strokeWidth={2}
      />
    </Svg>
  );
}
