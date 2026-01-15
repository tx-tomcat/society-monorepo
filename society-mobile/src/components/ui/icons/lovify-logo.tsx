import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

type Props = {
  color?: string;
  size?: number;
};

export const LovifyLogo = ({ color = '#C9A961', size = 28 }: Props) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Path
        d="M14 25.2C13.3 25.2 12.6 24.95 12.05 24.4L5.55 17.9C2.1 14.45 2.1 8.75 5.55 5.3C6.72 4.13 8.26 3.5 9.91 3.5C11.56 3.5 13.1 4.13 14.27 5.3L14 5.57L14.73 4.84C15.9 3.67 17.44 3.04 19.09 3.04C20.74 3.04 22.28 3.67 23.45 4.84C26.9 8.29 26.9 13.99 23.45 17.44L16.95 23.94C16.4 24.49 15.7 24.74 15 24.74L14 25.2Z"
        fill={color}
      />
    </Svg>
  );
};
