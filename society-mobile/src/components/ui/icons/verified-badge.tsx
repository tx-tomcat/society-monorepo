import * as React from 'react';
import type { SvgProps } from 'react-native-svg';
import Svg, { Path } from 'react-native-svg';

export function VerifiedBadge({ color = '#4ECDC4', ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M12 2L14.4 4.4L17.6 3.6L18.4 6.8L21.6 7.6L20.8 10.8L23.2 13.2L20.8 15.6L21.6 18.8L18.4 19.6L17.6 22.8L14.4 22L12 24.4L9.6 22L6.4 22.8L5.6 19.6L2.4 18.8L3.2 15.6L0.8 13.2L3.2 10.8L2.4 7.6L5.6 6.8L6.4 3.6L9.6 4.4L12 2Z"
        fill={color}
      />
      <Path
        d="M8 12L11 15L16 9"
        stroke="white"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
