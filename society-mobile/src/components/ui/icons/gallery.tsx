import * as React from 'react';
import type { SvgProps } from 'react-native-svg';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export function Gallery({ color = '#6B6572', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Rect
        x={3}
        y={5}
        width={18}
        height={14}
        rx={2}
        stroke={color}
        strokeWidth={2}
      />
      <Circle cx={8} cy={10} r={2} fill={color} />
      <Path
        d="M21 15L16 10L11 15L8 12L3 17"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
