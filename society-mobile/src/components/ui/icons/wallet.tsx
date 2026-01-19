import * as React from 'react';
import type { SvgProps } from 'react-native-svg';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

interface WalletProps extends SvgProps {
  filled?: boolean;
}

export function Wallet({
  color = '#6B6572',
  filled = false,
  ...props
}: WalletProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Rect
        x={2}
        y={6}
        width={20}
        height={14}
        rx={2}
        fill={filled ? color : 'none'}
        stroke={color}
        strokeWidth={2}
      />
      <Path d="M2 10H22" stroke={filled ? 'white' : color} strokeWidth={2} />
      <Circle cx={17} cy={14} r={2} fill={filled ? 'white' : color} />
      <Path
        d="M6 6V4C6 3.44772 6.44772 3 7 3H17C17.5523 3 18 3.44772 18 4V6"
        stroke={color}
        strokeWidth={2}
      />
    </Svg>
  );
}
