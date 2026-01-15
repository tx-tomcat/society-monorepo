import * as React from 'react';
import Svg, { Path } from 'react-native-svg';

import colors from '@/components/ui/colors';

type Props = {
  color?: string;
  size?: number;
  width?: number;
  height?: number;
};

export const MoreVertical = ({
  color = colors.charcoal[900],
  size = 28,
  width,
  height,
}: Props) => {
  const w = width ?? size;
  const h = height ?? size;
  return (
    <Svg width={w} height={h} viewBox="0 0 28 28" fill="none">
      <Path
        d="M14 15.1667C14.6444 15.1667 15.1667 14.6444 15.1667 14C15.1667 13.3556 14.6444 12.8333 14 12.8333C13.3557 12.8333 12.8334 13.3556 12.8334 14C12.8334 14.6444 13.3557 15.1667 14 15.1667Z"
        fill={color}
      />
      <Path
        d="M14 8.16667C14.6444 8.16667 15.1667 7.64433 15.1667 7C15.1667 6.35567 14.6444 5.83333 14 5.83333C13.3557 5.83333 12.8334 6.35567 12.8334 7C12.8334 7.64433 13.3557 8.16667 14 8.16667Z"
        fill={color}
      />
      <Path
        d="M14 22.1667C14.6444 22.1667 15.1667 21.6443 15.1667 21C15.1667 20.3557 14.6444 19.8333 14 19.8333C13.3557 19.8333 12.8334 20.3557 12.8334 21C12.8334 21.6443 13.3557 22.1667 14 22.1667Z"
        fill={color}
      />
    </Svg>
  );
};
