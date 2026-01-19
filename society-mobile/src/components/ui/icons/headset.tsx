import * as React from 'react';
import type { SvgProps } from 'react-native-svg';
import Svg, { Path, Rect } from 'react-native-svg';

export function Headset({ color = '#FF6B8A', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M4 13V11C4 6.58172 7.58172 3 12 3C16.4183 3 20 6.58172 20 11V13"
        stroke={color}
        strokeWidth={2}
      />
      <Rect
        x={2}
        y={13}
        width={4}
        height={6}
        rx={2}
        stroke={color}
        strokeWidth={2}
      />
      <Rect
        x={18}
        y={13}
        width={4}
        height={6}
        rx={2}
        stroke={color}
        strokeWidth={2}
      />
      <Path
        d="M20 19C20 20.1046 19.1046 21 18 21H14"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}
