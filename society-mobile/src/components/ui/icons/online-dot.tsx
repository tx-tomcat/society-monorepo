import * as React from 'react';
import type { SvgProps } from 'react-native-svg';
import Svg, { Circle } from 'react-native-svg';

interface OnlineDotProps extends SvgProps {
  online?: boolean;
}

export function OnlineDot({ online = true, ...props }: OnlineDotProps) {
  return (
    <Svg width={12} height={12} viewBox="0 0 12 12" fill="none" {...props}>
      {online ? (
        <Circle cx={6} cy={6} r={5} fill="#4ECDC4" stroke="white" strokeWidth={2} />
      ) : (
        <Circle cx={6} cy={6} r={4} stroke="#9B95A3" strokeWidth={2} />
      )}
    </Svg>
  );
}
