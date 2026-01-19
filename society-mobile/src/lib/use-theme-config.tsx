import type { Theme } from '@react-navigation/native';
import { DefaultTheme } from '@react-navigation/native';

import colors from '@/components/ui/colors';

const LightTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary[400],
    background: colors.white,
  },
};

export function useThemeConfig() {
  return LightTheme;
}
