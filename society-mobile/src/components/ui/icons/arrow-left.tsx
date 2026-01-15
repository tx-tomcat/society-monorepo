import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

import colors from '@/components/ui/colors';

type Props = {
  color?: string;
  size?: number;
  width?: number;
  height?: number;
};

export const ArrowLeft = ({
  color = colors.charcoal[900],
  size = 28,
  width,
  height,
}: Props) => {
  const w = width ?? size;
  const h = height ?? size;
  return (
    <Svg width={w} height={h} viewBox="0 0 28 28" fill="none">
      <Path
        d="M10.5 7L4 14L10.5 21"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
