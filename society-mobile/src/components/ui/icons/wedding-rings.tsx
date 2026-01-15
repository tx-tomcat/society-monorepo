import * as React from 'react';
import type { SvgProps } from 'react-native-svg';
import Svg, { Path, Circle } from 'react-native-svg';

export function WeddingRings({ color = '#FF6B8A', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Circle cx={9} cy={12} r={5} stroke={color} strokeWidth={2} />
      <Circle cx={15} cy={12} r={5} stroke={color} strokeWidth={2} />
      <Path
        d="M7 8L5 4M11 8L13 4"
        stroke="#FFD93D"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}
