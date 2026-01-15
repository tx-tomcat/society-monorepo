import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

import colors from '@/components/ui/colors';

type Props = {
  color?: string;
  size?: number;
};

export const GenderFemale = ({
  color = colors.neutral[300],
  size = 14,
}: Props) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <Path
        d="M7 4.375C5.41188 4.375 4.125 5.66188 4.125 7.25C4.125 8.83812 5.41188 10.125 7 10.125C8.58812 10.125 9.875 8.83812 9.875 7.25C9.875 5.66188 8.58812 4.375 7 4.375ZM7 10.125V12.25M7 12.25H5.6875M7 12.25H8.3125"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
