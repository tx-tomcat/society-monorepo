import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

import colors from '@/components/ui/colors';

type Props = {
  color?: string;
  size?: number;
  width?: number;
  height?: number;
};

export const Camera = ({
  color = colors.charcoal[900],
  size = 20,
  width,
  height,
}: Props) => {
  const w = width || size;
  const h = height || size;
  return (
    <Svg width={w} height={h} viewBox="0 0 20 20" fill="none">
      <Path
        d="M10 12.8333C11.3807 12.8333 12.5 11.714 12.5 10.3333C12.5 8.95262 11.3807 7.83333 10 7.83333C8.61929 7.83333 7.5 8.95262 7.5 10.3333C7.5 11.714 8.61929 12.8333 10 12.8333Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 10.3333V13.8333C3 16.5 4.16667 17.6667 6.83333 17.6667H13.1667C15.8333 17.6667 17 16.5 17 13.8333V6.83333C17 4.16667 15.8333 3 13.1667 3H6.83333C4.16667 3 3 4.16667 3 6.83333"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
