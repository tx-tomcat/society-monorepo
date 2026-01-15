import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

import colors from '@/components/ui/colors';

type Props = {
  color?: string;
  size?: number;
  width?: number;
  height?: number;
};

export const Filter = ({ color = colors.charcoal[900], size = 24, width, height }: Props) => {
  const w = width ?? size;
  const h = height ?? size;
  return (
    <Svg width={w} height={h} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5.4 2.1H18.6C19.7 2.1 20.6 3 20.6 4.1V6.3C20.6 7.1 20.1 8.1 19.6 8.6L15.3 12.4C14.7 12.9 14.3 13.9 14.3 14.7V19C14.3 19.6 13.9 20.4 13.4 20.7L12 21.6C10.7 22.4 8.9 21.5 8.9 19.9V14.6C8.9 13.9 8.5 13 8.1 12.5L4.3 8.5C3.8 8 3.4 7.1 3.4 6.5V4.2C3.4 3 4.3 2.1 5.4 2.1Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
