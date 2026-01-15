import * as React from 'react';
import type { SvgProps } from 'react-native-svg';
import Svg, { Path, Rect } from 'react-native-svg';

export function Briefcase({ color = '#6B6572', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Rect x={3} y={7} width={18} height={14} rx={2} stroke={color} strokeWidth={2} />
      <Path
        d="M8 7V5C8 3.89543 8.89543 3 10 3H14C15.1046 3 16 3.89543 16 5V7"
        stroke={color}
        strokeWidth={2}
      />
      <Path d="M3 12H21" stroke={color} strokeWidth={2} />
      <Path d="M10 12V14H14V12" stroke={color} strokeWidth={2} />
    </Svg>
  );
}
