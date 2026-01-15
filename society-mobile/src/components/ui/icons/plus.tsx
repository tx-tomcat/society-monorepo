import * as React from 'react';
import type { SvgProps } from 'react-native-svg';
import Svg, { Path } from 'react-native-svg';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const colors = require('../colors');

type Props = SvgProps & {
  color?: string;
  size?: number;
};

export const Plus = ({
  color = colors.charcoal[900],
  size = 24,
  ...props
}: Props) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
      <Path
        d="M6 12H18"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 18V6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
