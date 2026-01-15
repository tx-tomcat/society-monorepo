/**
 * Business constants for Society platform
 */

/**
 * Booking fee rates and limits
 */
export const BOOKING_FEES = {
  /** Service fee charged to hirer (5%) */
  HIRER_SERVICE_FEE_RATE: 0.05,
  /** Platform fee taken from companion earnings (15%) */
  PLATFORM_FEE_RATE: 0.15,
  /** Hours before booking expires if not accepted */
  BOOKING_EXPIRY_HOURS: 24,
} as const;

/**
 * Withdrawal limits and fees
 */
export const WITHDRAWAL_LIMITS = {
  /** Minimum withdrawal amount (100k VND) */
  MIN_AMOUNT: 100000,
  /** Maximum per withdrawal (50M VND) */
  MAX_AMOUNT: 50000000,
  /** Maximum per day (100M VND) */
  MAX_DAILY_AMOUNT: 100000000,
  /** Withdrawal fee rate (1%) */
  FEE_RATE: 0.01,
  /** Minimum fee (10k VND) */
  MIN_FEE: 10000,
  /** Processing days for bank transfer */
  PROCESSING_DAYS: 2,
} as const;

/**
 * Companion profile limits
 */
export const COMPANION_LIMITS = {
  /** Maximum number of photos */
  MAX_PHOTOS: 10,
  /** Maximum bio length */
  MAX_BIO_LENGTH: 1000,
  /** Maximum bank accounts */
  MAX_BANK_ACCOUNTS: 5,
} as const;

/**
 * Time constants in milliseconds
 */
export const TIME_MS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
} as const;

/**
 * Review constraints
 */
export const REVIEW_CONSTRAINTS = {
  MIN_RATING: 1,
  MAX_RATING: 5,
  MAX_COMMENT_LENGTH: 500,
} as const;

/**
 * SOS alert constants
 */
export const SOS_CONSTANTS = {
  /** Time to auto-escalate if not acknowledged (minutes) */
  ESCALATION_TIMEOUT_MINUTES: 5,
  /** Maximum active alerts per user */
  MAX_ACTIVE_ALERTS: 1,
} as const;
