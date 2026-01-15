import * as React from 'react';
import type { SvgProps } from 'react-native-svg';
import Svg, { Path } from 'react-native-svg';

interface ShieldCheckProps extends SvgProps {
  filled?: boolean;
}

export function ShieldCheck({ color = '#4ECDC4', filled = true, ...props }: ShieldCheckProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M12 2L4 6V11C4 16.5 7.5 21.5 12 22.5C16.5 21.5 20 16.5 20 11V6L12 2Z"
        fill={filled ? color : 'none'}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8 12L11 15L16 9"
        stroke={filled ? 'white' : color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
