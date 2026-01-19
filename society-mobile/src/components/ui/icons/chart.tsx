import * as React from 'react';
import type { SvgProps } from 'react-native-svg';
import Svg, { Path, Rect } from 'react-native-svg';

export function Chart({ color = '#FF6B8A', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M3 3V21H21"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect x={7} y={13} width={3} height={6} rx={1} fill={color} />
      <Rect x={12} y={9} width={3} height={10} rx={1} fill={color} />
      <Rect x={17} y={5} width={3} height={14} rx={1} fill={color} />
    </Svg>
  );
}
