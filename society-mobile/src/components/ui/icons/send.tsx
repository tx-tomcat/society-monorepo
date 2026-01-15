import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

import colors from '@/components/ui/colors';

type Props = {
  color?: string;
  size?: number;
};

export const Send = ({ color = colors.white, size = 28 }: Props) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Path
        d="M24.0284 3.97167L11.6951 16.305"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M24.0284 3.97167L16.3617 24.0283L11.6951 16.305L3.97168 11.6383L24.0284 3.97167Z"
        fill={color}
      />
    </Svg>
  );
};
