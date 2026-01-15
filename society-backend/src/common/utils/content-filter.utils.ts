/**
 * Content filtering utilities for message moderation
 * Blocks phone numbers, emails, social media handles, and other prohibited content
 */

// Phone number patterns (Vietnamese and international)
// Note: No global flag to avoid lastIndex issues with .test()
const PHONE_PATTERNS = [
  /(?:\+?84|0)(?:3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])\d{7}/, // Vietnamese mobile
  /\b\d{10,11}\b/, // Generic 10-11 digit numbers
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/, // US-style phone
];

// Email pattern
const EMAIL_PATTERN = /[\w.-]+@[\w.-]+\.\w{2,}/i;

// Social media and messaging app references
const SOCIAL_MEDIA_PATTERNS = [
  /\bzalo\b/i,
  /\btelegram\b/i,
  /\bwhatsapp\b/i,
  /\bfacebook\b/i,
  /\bfb\.com\b/i,
  /\bmessenger\b/i,
  /\binstagram\b/i,
  /\bline\b/i,
  /\bviber\b/i,
  /\bwechat\b/i,
  /\bsignal\b/i,
  /\bsnapchat\b/i,
  /\btiktok\b/i,
  /\btwitter\b/i,
  /\b@[a-zA-Z0-9_]{3,}/, // Social media handles
];

// URL patterns
const URL_PATTERN = /https?:\/\/[^\s]+/i;

export type ContentFilterReason =
  | 'phone_number'
  | 'email'
  | 'social_media'
  | 'url'
  | 'prohibited_content';

export interface ContentFilterResult {
  isBlocked: boolean;
  reason?: ContentFilterReason;
  message?: string;
  sanitized: string;
}

/**
 * Check if content contains phone numbers
 */
function containsPhoneNumber(content: string): boolean {
  return PHONE_PATTERNS.some((pattern) => pattern.test(content));
}

/**
 * Check if content contains email addresses
 */
function containsEmail(content: string): boolean {
  return EMAIL_PATTERN.test(content);
}

/**
 * Check if content contains social media references
 */
function containsSocialMedia(content: string): boolean {
  return SOCIAL_MEDIA_PATTERNS.some((pattern) => pattern.test(content));
}

/**
 * Check if content contains URLs
 */
function containsUrl(content: string): boolean {
  return URL_PATTERN.test(content);
}

/**
 * Filter message content for prohibited patterns
 * Returns whether content should be blocked and the reason
 */
export function filterMessageContent(content: string): ContentFilterResult {
  if (!content || typeof content !== 'string') {
    return { isBlocked: false, sanitized: content || '' };
  }

  // Check for phone numbers
  if (containsPhoneNumber(content)) {
    return {
      isBlocked: true,
      reason: 'phone_number',
      message: 'Messages cannot contain phone numbers. Please use the in-app communication.',
      sanitized: content,
    };
  }

  // Check for emails
  if (containsEmail(content)) {
    return {
      isBlocked: true,
      reason: 'email',
      message: 'Messages cannot contain email addresses. Please use the in-app communication.',
      sanitized: content,
    };
  }

  // Check for social media references
  if (containsSocialMedia(content)) {
    return {
      isBlocked: true,
      reason: 'social_media',
      message: 'Messages cannot contain social media references. Please use the in-app communication.',
      sanitized: content,
    };
  }

  // Check for URLs
  if (containsUrl(content)) {
    return {
      isBlocked: true,
      reason: 'url',
      message: 'Messages cannot contain external links.',
      sanitized: content,
    };
  }

  return {
    isBlocked: false,
    sanitized: content,
  };
}

/**
 * Sanitize content by masking prohibited patterns (for display purposes)
 * This is used when you want to allow the message but mask sensitive info
 */
export function sanitizeMessageContent(content: string): string {
  if (!content || typeof content !== 'string') {
    return content || '';
  }

  let sanitized = content;

  // Mask phone numbers (create global regex for replacement)
  PHONE_PATTERNS.forEach((pattern) => {
    sanitized = sanitized.replace(new RegExp(pattern.source, 'gi'), '[Phone Hidden]');
  });

  // Mask emails
  sanitized = sanitized.replace(new RegExp(EMAIL_PATTERN.source, 'gi'), '[Email Hidden]');

  // Mask URLs
  sanitized = sanitized.replace(new RegExp(URL_PATTERN.source, 'gi'), '[Link Hidden]');

  return sanitized;
}
