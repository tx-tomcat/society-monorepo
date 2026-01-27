import * as React from 'react';
import type { SvgProps } from 'react-native-svg';
import Svg, { Path, Rect } from 'react-native-svg';

import colors from '@/components/ui/colors';

type Props = SvgProps & {
  color?: string;
  width?: number;
  height?: number;
};

export const QrCode = ({
  color = colors.midnight.DEFAULT,
  width = 24,
  height = 24,
  ...props
}: Props) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...props}>
      <Rect
        x="3"
        y="3"
        width="7"
        height="7"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect
        x="14"
        y="3"
        width="7"
        height="7"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect
        x="3"
        y="14"
        width="7"
        height="7"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 14H17V17"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M17 21H21V17"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M21 14H14V21"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
