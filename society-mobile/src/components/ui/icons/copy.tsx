import * as React from 'react';
import type { SvgProps } from 'react-native-svg';
import Svg, { Path, Rect } from 'react-native-svg';

import colors from '@/components/ui/colors';

type Props = SvgProps & {
  color?: string;
  width?: number;
  height?: number;
};

export const Copy = ({
  color = colors.midnight.DEFAULT,
  width = 24,
  height = 24,
  ...props
}: Props) => {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...props}>
      <Rect
        x="9"
        y="9"
        width="13"
        height="13"
        rx="2"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5 15H4C3.46957 15 2.96086 14.7893 2.58579 14.4142C2.21071 14.0391 2 13.5304 2 13V4C2 3.46957 2.21071 2.96086 2.58579 2.58579C2.96086 2.21071 3.46957 2 4 2H13C13.5304 2 14.0391 2.21071 14.4142 2.58579C14.7893 2.96086 15 3.46957 15 4V5"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
