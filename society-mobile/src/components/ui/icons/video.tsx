import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

import colors from '@/components/ui/colors';

type Props = {
  color?: string;
  size?: number;
};

export const Video = ({ color = colors.charcoal[900], size = 28 }: Props) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Path
        d="M11.6667 22.1667H7.00004C3.50004 22.1667 1.75 20.4167 1.75 16.9167V11.0833C1.75 7.58333 3.50004 5.83333 7.00004 5.83333H11.6667C15.1667 5.83333 16.9167 7.58333 16.9167 11.0833V16.9167C16.9167 20.4167 15.1667 22.1667 11.6667 22.1667Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M21.7884 18.9583L16.9167 15.75V12.25L21.7884 9.04167C23.5734 7.85 25.0834 8.61333 25.0834 10.7117V17.2883C25.0834 19.3867 23.5734 20.15 21.7884 18.9583Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
