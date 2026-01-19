import * as React from 'react';
import type { SvgProps } from 'react-native-svg';
import Svg, { Path } from 'react-native-svg';

export function Receipt({ color = '#6B6572', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M4 2V22L6 20L8 22L10 20L12 22L14 20L16 22L18 20L20 22V2L18 4L16 2L14 4L12 2L10 4L8 2L6 4L4 2Z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Path
        d="M8 8H16M8 12H14M8 16H12"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}
