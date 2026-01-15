import * as React from 'react';
import type { SvgProps } from 'react-native-svg';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

// Red Envelope (Li Xi) - Vietnamese Cultural Icon
export function RedEnvelope({ ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      <Rect x={4} y={3} width={16} height={18} rx={2} fill="#FF6B8A" />
      <Path d="M4 8H20" stroke="#CC0000" strokeWidth={2} />
      <Circle cx={12} cy={14} r={4} fill="#FFD93D" stroke="#CC0000" strokeWidth={1} />
      <Path
        d="M12 12V16M10 14H14"
        stroke="#CC0000"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}
