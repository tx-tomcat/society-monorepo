import * as React from 'react';
import type { SvgProps } from 'react-native-svg';
import Svg, { Circle, Path } from 'react-native-svg';

export function Help({ color = '#6B6572', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={2} />
      <Path
        d="M9 9C9 7.5 10.5 6.5 12 6.5C13.5 6.5 15 7.5 15 9C15 10.5 13 11 12 12V14"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Circle cx={12} cy={17} r={1} fill={color} />
    </Svg>
  );
}
