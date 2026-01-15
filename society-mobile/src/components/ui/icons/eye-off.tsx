import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

import colors from '@/components/ui/colors';

type Props = {
  color?: string;
  size?: number;
};

export const EyeOff = ({ color = colors.charcoal[400], size = 20 }: Props) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M14.95 14.95C13.5255 16.0358 11.7904 16.6374 10 16.6667C4.16667 16.6667 1.66667 10 1.66667 10C2.49598 8.15509 3.73486 6.52268 5.28333 5.21667L14.95 14.95Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8.25 3.53334C8.82365 3.39907 9.41093 3.3324 10 3.33334C15.8333 3.33334 18.3333 10 18.3333 10C17.9286 10.9463 17.4061 11.8373 16.775 12.65"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M1.66667 1.66667L18.3333 18.3333"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
