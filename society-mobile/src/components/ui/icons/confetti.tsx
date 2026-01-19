import * as React from 'react';
import type { SvgProps } from 'react-native-svg';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export function Confetti({ ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M4 20L8 4L20 16L4 20Z"
        fill="#C9B1FF"
        stroke="#C9B1FF"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <Circle cx={15} cy={5} r={2} fill="#FF6B8A" />
      <Circle cx={19} cy={9} r={1.5} fill="#FFD93D" />
      <Rect
        x={17}
        y={3}
        width={2}
        height={4}
        rx={1}
        fill="#4ECDC4"
        transform="rotate(15 17 3)"
      />
      <Path
        d="M10 10L12 12"
        stroke="white"
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Path
        d="M7 13L9 15"
        stroke="white"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}
