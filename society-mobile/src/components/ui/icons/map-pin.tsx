import * as React from 'react';
import type { SvgProps } from 'react-native-svg';
import Svg, { Path, Circle } from 'react-native-svg';

export function MapPin({ color = '#FF6B8A', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M12 22C12 22 19 16 19 10C19 6.13401 15.866 3 12 3C8.13401 3 5 6.13401 5 10C5 16 12 22 12 22Z"
        stroke={color}
        strokeWidth={2}
      />
      <Circle cx={12} cy={10} r={3} stroke={color} strokeWidth={2} />
    </Svg>
  );
}
