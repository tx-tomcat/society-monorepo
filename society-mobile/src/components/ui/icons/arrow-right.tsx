import * as React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import colors from '@/components/ui/colors';

type Props = {
  color?: string;
  size?: number;
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
};

export const ArrowRight = ({
  color = colors.charcoal[900],
  size = 28,
  width,
  height,
  style,
}: Props) => {
  const w = width ?? size;
  const h = height ?? size;
  return (
    <Svg width={w} height={h} viewBox="0 0 28 28" fill="none" style={style}>
      <Path
        d="M17.5 7L24 14L17.5 21"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
