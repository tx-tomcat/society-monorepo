import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

import colors from '@/components/ui/colors';

type Props = {
  color?: string;
  size?: number;
};

export const Apple = ({
  color = colors.offwhite.DEFAULT,
  size = 24,
}: Props) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17.05 20.28C16.07 21.23 15.06 21.08 14.1 20.7C13.09 20.31 12.16 20.28 11.11 20.7C9.79997 21.23 9.06997 21.08 8.19997 20.28C2.33997 14.25 3.20997 5.59 9.75997 5.31C11.28 5.39 12.38 6.16 13.32 6.22C14.71 5.95 16.05 5.16 17.53 5.26C19.28 5.39 20.61 6.11 21.5 7.44C17.89 9.57 18.73 14.33 22 15.69C21.27 17.54 20.35 19.38 17.05 20.29V20.28ZM13.23 5.25C13.08 3.02 14.94 1.18 17.03 1C17.3 3.57 14.62 5.5 13.23 5.25Z"
        fill={color}
      />
    </Svg>
  );
};
