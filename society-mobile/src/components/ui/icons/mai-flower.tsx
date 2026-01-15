import * as React from 'react';
import type { SvgProps } from 'react-native-svg';
import Svg, { Ellipse, Circle } from 'react-native-svg';

// Mai Flower - Vietnamese Yellow Apricot for Tet/Holiday
export function MaiFlower({ ...props }: SvgProps) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
      {/* Flower petals */}
      <Ellipse cx={12} cy={6} rx={3} ry={4} fill="#FFD93D" />
      <Ellipse cx={6} cy={11} rx={3} ry={4} fill="#FFD93D" transform="rotate(-45 6 11)" />
      <Ellipse cx={18} cy={11} rx={3} ry={4} fill="#FFD93D" transform="rotate(45 18 11)" />
      <Ellipse cx={8} cy={17} rx={3} ry={4} fill="#FFD93D" transform="rotate(-20 8 17)" />
      <Ellipse cx={16} cy={17} rx={3} ry={4} fill="#FFD93D" transform="rotate(20 16 17)" />
      {/* Center */}
      <Circle cx={12} cy={12} r={3} fill="#FF8E72" />
      <Circle cx={12} cy={12} r={1.5} fill="#FFD93D" />
    </Svg>
  );
}
