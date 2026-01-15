import * as React from 'react';
import type { SvgProps } from 'react-native-svg';
import Svg, { Path, Circle } from 'react-native-svg';

export function Family({ ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      {/* Parent 1 */}
      <Circle cx={7} cy={7} r={3} stroke="#FF6B8A" strokeWidth={2} />
      <Path d="M2 16C2 13.5 4.5 12 7 12C9.5 12 12 13.5 12 16" stroke="#FF6B8A" strokeWidth={2} />
      {/* Parent 2 */}
      <Circle cx={17} cy={7} r={3} stroke="#FF8E72" strokeWidth={2} />
      <Path d="M12 16C12 13.5 14.5 12 17 12C19.5 12 22 13.5 22 16" stroke="#FF8E72" strokeWidth={2} />
      {/* Child */}
      <Circle cx={12} cy={15} r={2} stroke="#FFD93D" strokeWidth={2} />
      <Path d="M8 21C8 19.5 10 18 12 18C14 18 16 19.5 16 21" stroke="#FFD93D" strokeWidth={2} />
    </Svg>
  );
}
