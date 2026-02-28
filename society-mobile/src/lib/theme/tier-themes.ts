import colors from '@/components/ui/colors';

export type TierThemeColors = {
  primary: string;
  secondary: string;
  primaryLight: string;
  background: string;
  softBackground: string;
  gradient: [string, string];
};

const DEFAULT_THEME: TierThemeColors = {
  primary: colors.rose[400],
  secondary: colors.coral[400],
  primaryLight: colors.rose[50],
  background: colors.warmwhite.DEFAULT,
  softBackground: colors.softpink.DEFAULT,
  gradient: [colors.rose[400], colors.coral[400]],
};

export const TIER_THEMES: Record<string, TierThemeColors> = {
  DEFAULT: DEFAULT_THEME,
  SILVER: DEFAULT_THEME,
  GOLD: {
    primary: '#C8922D',
    secondary: '#E8B84A',
    primaryLight: '#FFF6E8',
    background: '#FFFCF5',
    softBackground: '#FFF6E8',
    gradient: ['#C8922D', '#E8B84A'],
  },
  PLATINUM: {
    primary: '#7B5EA7',
    secondary: '#9D7FCC',
    primaryLight: '#F4F0FA',
    background: '#FDFBFF',
    softBackground: '#F4F0FA',
    gradient: ['#7B5EA7', '#9D7FCC'],
  },
};

export function getTierTheme(
  tier: string | null | undefined
): TierThemeColors {
  if (!tier) return TIER_THEMES.DEFAULT;
  return TIER_THEMES[tier] ?? TIER_THEMES.DEFAULT;
}
