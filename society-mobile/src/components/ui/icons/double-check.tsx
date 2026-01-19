import * as React from 'react';
import type { SvgProps } from 'react-native-svg';
import Svg, { Path } from 'react-native-svg';

interface DoubleCheckProps extends SvgProps {
  read?: boolean;
}

export function DoubleCheck({
  color,
  read = false,
  ...props
}: DoubleCheckProps) {
  const checkColor = color || (read ? '#4ECDC4' : '#9B95A3');
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M2 12L7 17L17 7"
        stroke={checkColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7 12L12 17L22 7"
        stroke={checkColor}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
