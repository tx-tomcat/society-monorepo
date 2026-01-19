import * as React from 'react';
import type { SvgProps } from 'react-native-svg';
import Svg, { Path } from 'react-native-svg';

export function Trash({ color = '#FF5757', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Path d="M3 6H21" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <Path
        d="M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6"
        stroke={color}
        strokeWidth={2}
      />
      <Path
        d="M5 6L6 20C6 20.5523 6.44772 21 7 21H17C17.5523 21 18 20.5523 18 20L19 6"
        stroke={color}
        strokeWidth={2}
      />
      <Path
        d="M10 10V17M14 10V17"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}
