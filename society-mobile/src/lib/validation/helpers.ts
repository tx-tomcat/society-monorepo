/**
 * Validation helper functions
 */
import type { ZodError, ZodIssue } from 'zod';

/**
 * Extract the first error message from a Zod error
 */
export function getFirstZodError(error: ZodError): string {
  const issues = error.issues || [];
  const firstError = issues[0] as ZodIssue | undefined;
  return firstError?.message || 'validation.unknown_error';
}

/**
 * Format validation errors for display
 * Returns a map of field names to error messages
 */
export function formatZodErrors(error: ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  const issues = error.issues || [];
  for (const err of issues) {
    const path = err.path.join('.');
    if (!result[path]) {
      result[path] = err.message;
    }
  }
  return result;
}

/**
 * Validate a Vietnamese phone number
 */
export function isValidVietnamPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  const regex = /^(0?)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/;
  return regex.test(cleaned);
}

/**
 * Validate an email address
 */
export function isValidEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email.toLowerCase().trim());
}

/**
 * Validate an OTP code (6 digits)
 */
export function isValidOtp(otp: string): boolean {
  return /^[0-9]{6}$/.test(otp);
}

/**
 * Format phone number for display (Vietnamese format)
 * Example: 0912345678 -> 091 234 5678
 */
export function formatPhoneDisplay(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
  }
  if (cleaned.length === 9) {
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5)}`;
  }
  return phone;
}

/**
 * Mask phone number for privacy
 * Example: 0912345678 -> 091 xxx 5678
 */
export function maskPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length >= 7) {
    const start = cleaned.slice(0, 3);
    const end = cleaned.slice(-3);
    return `${start} xxx ${end}`;
  }
  return phone;
}

/**
 * Mask email for privacy
 * Example: john@example.com -> j***@example.com
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (local && domain) {
    return `${local[0]}***@${domain}`;
  }
  return email;
}

/**
 * Calculate age from date of birth
 */
export function calculateAge(dateOfBirth: Date): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
}

/**
 * Check if user is at least 18 years old
 */
export function isAdult(dateOfBirth: Date): boolean {
  return calculateAge(dateOfBirth) >= 18;
}

/**
 * Sanitize user input (remove potentially harmful characters)
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .slice(0, 1000); // Limit length
}

/**
 * Format currency in VND
 */
export function formatVND(amount: number): string {
  return amount.toLocaleString('vi-VN') + 'đ';
}

/**
 * Parse VND string to number
 */
export function parseVND(value: string): number {
  const cleaned = value.replace(/[^\d]/g, '');
  return parseInt(cleaned, 10) || 0;
}
