import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

import colors from '@/components/ui/colors';

type Props = {
  color?: string;
  size?: number;
};

export const Smiley = ({ color = colors.charcoal[900], size = 20 }: Props) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M10 17.5C14.1421 17.5 17.5 14.1421 17.5 10C17.5 5.85786 14.1421 2.5 10 2.5C5.85786 2.5 2.5 5.85786 2.5 10C2.5 14.1421 5.85786 17.5 10 17.5Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6.875 9.375C7.39277 9.375 7.8125 8.95527 7.8125 8.4375C7.8125 7.91973 7.39277 7.5 6.875 7.5C6.35723 7.5 5.9375 7.91973 5.9375 8.4375C5.9375 8.95527 6.35723 9.375 6.875 9.375Z"
        fill={color}
      />
      <Path
        d="M13.125 9.375C13.6428 9.375 14.0625 8.95527 14.0625 8.4375C14.0625 7.91973 13.6428 7.5 13.125 7.5C12.6072 7.5 12.1875 7.91973 12.1875 8.4375C12.1875 8.95527 12.6072 9.375 13.125 9.375Z"
        fill={color}
      />
      <Path
        d="M7.08331 12.0833C7.08331 12.0833 8.12498 13.5417 9.99998 13.5417C11.875 13.5417 12.9166 12.0833 12.9166 12.0833"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};
