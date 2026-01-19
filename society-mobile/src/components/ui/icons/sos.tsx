import * as React from 'react';
import type { SvgProps } from 'react-native-svg';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';

export function Sos({ color = '#FF5757', ...props }: SvgProps) {
  return (
    <Svg width={48} height={48} viewBox="0 0 48 48" fill="none" {...props}>
      <Circle
        cx={24}
        cy={24}
        r={22}
        fill={color}
        stroke={color}
        strokeWidth={4}
      />
      <SvgText
        x={24}
        y={30}
        textAnchor="middle"
        fontFamily="System"
        fontWeight="700"
        fontSize={16}
        fill="white"
      >
        SOS
      </SvgText>
    </Svg>
  );
}
