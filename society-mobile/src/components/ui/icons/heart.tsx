import * as React from 'react';
import type { SvgProps } from 'react-native-svg';
import Svg, { Path } from 'react-native-svg';

interface HeartProps extends SvgProps {
  filled?: boolean;
}

export function Heart({
  color = '#FF6B8A',
  filled = false,
  ...props
}: HeartProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M12 21C12 21 3 15 3 9C3 6 5.5 3 8.5 3C10.5 3 12 5 12 5C12 5 13.5 3 15.5 3C18.5 3 21 6 21 9C21 15 12 21 12 21Z"
        fill={filled ? color : 'none'}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
