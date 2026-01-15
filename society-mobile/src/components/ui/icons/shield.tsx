import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

import colors from '@/components/ui/colors';

type Props = {
  color?: string;
  size?: number;
  width?: number;
  height?: number;
};

export const Shield = ({ color = colors.rose[400], size = 20, width, height }: Props) => {
  const w = width ?? size;
  const h = height ?? size;
  return (
    <Svg width={w} height={h} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L4 6V11C4 16.55 7.84 21.74 12 23C16.16 21.74 20 16.55 20 11V6L12 2Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
