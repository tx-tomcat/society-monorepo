import * as React from 'react';
import type { SvgProps } from 'react-native-svg';
import Svg, { Path, Circle } from 'react-native-svg';

export function Money({ color = '#4ECDC4', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={2} />
      <Path
        d="M12 6V18M15 9C15 9 14 8 12 8C10 8 9 9.5 9 10.5C9 11.5 10 12 12 12.5C14 13 15 13.5 15 14.5C15 15.5 14 17 12 17C10 17 9 16 9 16"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}
