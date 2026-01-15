import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

import colors from '@/components/ui/colors';

type Props = {
  color?: string;
  size?: number;
};

export const Paperclip = ({
  color = colors.charcoal[900],
  size = 20,
}: Props) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M16.25 8.54167V12.9167C16.25 16.0417 14.7917 17.5 11.6667 17.5H8.33333C5.20833 17.5 3.75 16.0417 3.75 12.9167V8.54167C3.75 5.41667 5.20833 3.95833 8.33333 3.95833H11.6667C14.7917 3.95833 16.25 5.41667 16.25 8.54167Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 2.5V8.33333"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
