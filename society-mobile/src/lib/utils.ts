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

/** Common language codes to human-readable names */
const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  vi: 'Tiếng Việt',
  zh: '中文',
  ja: '日本語',
  ko: '한국어',
  fr: 'Français',
  de: 'Deutsch',
  es: 'Español',
  pt: 'Português',
  ru: 'Русский',
  th: 'ไทย',
  id: 'Bahasa',
};

/**
 * Convert a language code to its human-readable name
 * @param code - ISO 639-1 language code (e.g., 'en', 'vi')
 * @returns Human-readable language name
 */
export function getLanguageName(code: string): string {
  return LANGUAGE_NAMES[code.toLowerCase()] || code.toUpperCase();
}

/**
 * Format an array of language codes to human-readable names
 * @param codes - Array of ISO 639-1 language codes
 * @param limit - Maximum number of languages to show (default: all)
 * @returns Formatted string like "English, Tiếng Việt"
 */
export function formatLanguages(codes: string[], limit?: number): string {
  const names = codes.map(getLanguageName);
  const limited = limit ? names.slice(0, limit) : names;
  return limited.join(', ');
}

/**
 * Get the localized occasion name based on current locale
 * @param occasion - Occasion object with nameEn and nameVi
 * @param locale - Current locale ('en' or 'vi'), defaults to 'vi'
 * @returns Localized occasion name
 */
export function getOccasionName(
  occasion: { nameEn: string; nameVi: string } | undefined,
  locale: string = 'vi'
): string {
  if (!occasion) return '';
  return locale === 'en' ? occasion.nameEn : occasion.nameVi;
}

/**
 * Format a date string to a relative time string (e.g., "2 weeks ago")
 * @param dateString - ISO date string
 * @returns Relative time string
 */
export function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return months === 1 ? '1 month ago' : `${months} months ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    return years === 1 ? '1 year ago' : `${years} years ago`;
  }
}
