import * as React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

const ZALO_BLUE = '#0068FF';

type Props = {
  size?: number;
};

export const Zalo = ({ size = 24 }: Props) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      {/* Rounded square background */}
      <Rect width={48} height={48} rx={12} fill={ZALO_BLUE} />

      {/* Z letter - bold diagonal style */}
      <Path
        d="M12 14h14v3h-9.5l9.5 12v3H12v-3h9.5l-9.5-12v-3z"
        fill="white"
      />

      {/* alo text representation - stylized speech bubble with dot */}
      <Path
        d="M30 18c0-2.2 1.8-4 4-4s4 1.8 4 4c0 1.5-.8 2.8-2 3.5v2.5l-2-2h-0.5c-1.9-.2-3.5-1.8-3.5-4z"
        fill="white"
      />

      {/* Small dot accent */}
      <Path
        d="M35 21a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"
        fill={ZALO_BLUE}
      />
    </Svg>
  );
};

/** @deprecated Use `Zalo` instead */
export const ZaloIcon = Zalo;
