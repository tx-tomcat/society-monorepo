import * as React from 'react';
import type { SvgProps } from 'react-native-svg';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

export function IdCard({ color = '#FF6B8A', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Rect x={2} y={4} width={20} height={16} rx={2} stroke={color} strokeWidth={2} />
      <Circle cx={8} cy={11} r={2.5} stroke={color} strokeWidth={1.5} />
      <Path d="M5 17C5 15.3431 6.34315 14 8 14C9.65685 14 11 15.3431 11 17" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M14 9H19M14 13H17" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
