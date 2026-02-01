import * as React from 'react';
import type { SvgProps } from 'react-native-svg';
import Svg, { Path } from 'react-native-svg';

export function Fire({ color = '#2D2A33', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M12 22C16.4183 22 20 18.4183 20 14C20 9.5 16 6 14 4C14 8 11 10 10 10C9 10 7 8.5 7 6C3 9 4 14 4 14C4 18.4183 7.58172 22 12 22Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 22C14.2091 22 16 20.2091 16 18C16 15.5 14 14 12 12C10 14 8 15.5 8 18C8 20.2091 9.79086 22 12 22Z"
        fill={color}
        fillOpacity={0.2}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
