import React from 'react';

import { useActiveMembership } from '@/lib/hooks/use-membership';

import type { TierThemeColors } from './tier-themes';
import { getTierTheme } from './tier-themes';

const TierThemeContext = React.createContext<TierThemeColors>(
  getTierTheme(null)
);

export function useTierTheme(): TierThemeColors {
  return React.useContext(TierThemeContext);
}

export function TierThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data } = useActiveMembership();
  const tier =
    data?.active?.status === 'ACTIVE' ? data.active.tier : null;
  const theme = React.useMemo(() => getTierTheme(tier), [tier]);

  return (
    <TierThemeContext.Provider value={theme}>
      {children}
    </TierThemeContext.Provider>
  );
}
