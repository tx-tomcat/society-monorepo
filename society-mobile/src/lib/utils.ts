import { Linking } from 'react-native';
import type { StoreApi, UseBoundStore } from 'zustand';

export function openLinkInBrowser(url: string) {
  Linking.canOpenURL(url).then((canOpen) => canOpen && Linking.openURL(url));
}

type WithSelectors<S> = S extends { getState: () => infer T }
  ? S & { use: { [K in keyof T]: () => T[K] } }
  : never;

export const createSelectors = <S extends UseBoundStore<StoreApi<object>>>(
  _store: S
) => {
  let store = _store as WithSelectors<typeof _store>;
  store.use = {};
  for (const k of Object.keys(store.getState())) {
    (store.use as Record<string, () => unknown>)[k] = () =>
      store((s) => s[k as keyof typeof s]);
  }

  return store;
};

/** Vietnamese Dong currency symbol (U+20AB) */
const VND_SYMBOL = '₫';

/** Options for formatting Vietnamese Dong currency */
export type FormatVNDOptions = {
  /** Whether to show currency symbol (default: true) */
  showSymbol?: boolean;
  /** Position of currency symbol (default: 'prefix') */
  symbolPosition?: 'prefix' | 'suffix';
  /** Use abbreviated format like 1.5M instead of 1,500,000 (default: false) */
  abbreviated?: boolean;
};

/**
 * Format a number as Vietnamese Dong (VND) currency
 * @param amount - The amount to format
 * @param options - Optional formatting options
 * @returns Formatted string like "₫1.234.567"
 * @example
 * formatVND(1500000) // "₫1.500.000"
 * formatVND(1500000, { abbreviated: true }) // "₫1.5M"
 * formatVND(1500000, { symbolPosition: 'suffix' }) // "1.500.000₫"
 */
export function formatVND(amount: number, options?: FormatVNDOptions): string {
  const {
    showSymbol = true,
    symbolPosition = 'prefix',
    abbreviated = false,
  } = options ?? {};

  let formattedAmount: string;

  if (abbreviated) {
    const absAmount = Math.abs(amount);
    const sign = amount < 0 ? '-' : '';
    if (absAmount >= 1_000_000_000) {
      formattedAmount = `${sign}${(absAmount / 1_000_000_000).toFixed(1)}B`;
    } else if (absAmount >= 1_000_000) {
      formattedAmount = `${sign}${(absAmount / 1_000_000).toFixed(1)}M`;
    } else if (absAmount >= 1_000) {
      formattedAmount = `${sign}${(absAmount / 1_000).toFixed(0)}K`;
    } else {
      formattedAmount = new Intl.NumberFormat('vi-VN').format(amount);
    }
  } else {
    // Handle negative numbers properly
    const absAmount = Math.abs(amount);
    const formatted = new Intl.NumberFormat('vi-VN').format(absAmount);
    formattedAmount = amount < 0 ? `-${formatted}` : formatted;
  }

  if (!showSymbol) {
    return formattedAmount;
  }

  // Use consistent VND_SYMBOL (₫) for both prefix and suffix
  return symbolPosition === 'prefix'
    ? `${VND_SYMBOL}${formattedAmount}`
    : `${formattedAmount}${VND_SYMBOL}`;
}
