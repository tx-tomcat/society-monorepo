import * as React from 'react';
import type { SvgProps } from 'react-native-svg';
import Svg, { Path, Circle } from 'react-native-svg';

export function Gps({ color = '#4ECDC4', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Circle cx={12} cy={12} r={8} stroke={color} strokeWidth={2} />
      <Circle cx={12} cy={12} r={3} fill={color} />
      <Path
        d="M12 2V6M12 18V22M2 12H6M18 12H22"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}
