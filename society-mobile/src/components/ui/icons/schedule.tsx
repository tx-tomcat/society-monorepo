import * as React from 'react';
import type { SvgProps } from 'react-native-svg';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export function Schedule({ color = '#FF6B8A', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Rect
        x={3}
        y={4}
        width={18}
        height={18}
        rx={2}
        stroke={color}
        strokeWidth={2}
      />
      <Path d="M3 10H21" stroke={color} strokeWidth={2} />
      <Path
        d="M8 2V6M16 2V6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Circle cx={8} cy={15} r={1.5} fill={color} />
      <Circle cx={12} cy={15} r={1.5} fill={color} />
      <Circle cx={16} cy={15} r={1.5} fill={color} />
    </Svg>
  );
}
