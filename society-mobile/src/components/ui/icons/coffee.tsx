import * as React from 'react';
import type { SvgProps } from 'react-native-svg';
import Svg, { Path } from 'react-native-svg';

export function Coffee({ color = '#FF8E72', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M17 8H18C19.6569 8 21 9.34315 21 11C21 12.6569 19.6569 14 18 14H17"
        stroke={color}
        strokeWidth={2}
      />
      <Path
        d="M3 8H17V16C17 18.2091 15.2091 20 13 20H7C4.79086 20 3 18.2091 3 16V8Z"
        stroke={color}
        strokeWidth={2}
      />
      <Path
        d="M6 4C6 4 7 6 10 6C13 6 14 4 14 4"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}
