import * as React from 'react';
import type { SvgProps } from 'react-native-svg';
import Svg, { Path, Circle } from 'react-native-svg';

export function Info({ color = '#C9B1FF', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={2} />
      <Path d="M12 8V8.01M12 11V16" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
