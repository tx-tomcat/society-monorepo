import * as React from 'react';
import type { SvgProps } from 'react-native-svg';
import Svg, { Path, Circle } from 'react-native-svg';

export function SocietyLogo({ color = '#FF6B8A', ...props }: SvgProps) {
  return (
    <Svg width={48} height={48} viewBox="0 0 48 48" fill="none" {...props}>
      <Path
        d="M24 42C24 42 6 30 6 18C6 12 10.5 7 16.5 7C20.5 7 23.5 10 24 12C24.5 10 27.5 7 31.5 7C37.5 7 42 12 42 18C42 30 24 42 24 42Z"
        fill={color}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 22C16 22 19 20 21 22C23 24 24 25 24 25C24 25 25 24 27 22C29 20 32 22 32 22"
        stroke="white"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx={18} cy={26} r={2} fill="white" />
      <Circle cx={30} cy={26} r={2} fill="white" />
    </Svg>
  );
}
