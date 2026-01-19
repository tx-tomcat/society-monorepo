import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

import colors from '@/components/ui/colors';

type Props = {
  color?: string;
  size?: number;
  width?: number;
  height?: number;
};

export const Search = ({
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
        d="M13.4167 23.9167C19.0276 23.9167 23.5833 19.361 23.5833 13.75C23.5833 8.13896 19.0276 3.58333 13.4167 3.58333C7.80564 3.58333 3.25 8.13896 3.25 13.75C3.25 19.361 7.80564 23.9167 13.4167 23.9167Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M24.75 25.0833L22.75 23.0833"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
