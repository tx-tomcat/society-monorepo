import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Vietnam phone number regex patterns:
 * - Local format: 0XXXXXXXXX (10 digits starting with 0)
 * - International format: +84XXXXXXXXX (9 digits after +84)
 * - With or without spaces/dashes
 *
 * Valid Vietnamese mobile prefixes (after 0 or +84):
 * - Viettel: 86, 96, 97, 98, 32, 33, 34, 35, 36, 37, 38, 39
 * - Vinaphone: 88, 91, 94, 81, 82, 83, 84, 85
 * - Mobifone: 89, 90, 93, 70, 76, 77, 78, 79
 * - Vietnamobile: 92, 56, 58
 * - Gmobile: 99, 59
 */
const VIETNAM_PHONE_REGEX = /^(?:\+84|0)(?:3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])\d{7}$/;

/**
 * Normalize phone number by removing spaces, dashes, and dots
 */
export function normalizePhoneNumber(phone: string): string {
  return phone.replace(/[\s\-\.()]/g, '');
}

/**
 * Check if a phone number is a valid Vietnam phone number
 */
export function isValidVietnamPhone(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  return VIETNAM_PHONE_REGEX.test(normalized);
}

/**
 * Convert phone number to standard local format (0XXXXXXXXX)
 */
export function toLocalFormat(phone: string): string {
  const normalized = normalizePhoneNumber(phone);
  if (normalized.startsWith('+84')) {
    return '0' + normalized.slice(3);
  }
  return normalized;
}

/**
 * Convert phone number to international format (+84XXXXXXXXX)
 */
export function toInternationalFormat(phone: string): string {
  const normalized = normalizePhoneNumber(phone);
  if (normalized.startsWith('0')) {
    return '+84' + normalized.slice(1);
  }
  return normalized;
}

@ValidatorConstraint({ name: 'isVietnamPhone', async: false })
export class IsVietnamPhoneConstraint implements ValidatorConstraintInterface {
  validate(phone: string): boolean {
    if (!phone) return true; // Let @IsOptional handle null/undefined
    return isValidVietnamPhone(phone);
  }

  defaultMessage(): string {
    return 'Phone number must be a valid Vietnam phone number (e.g., 0901234567 or +84901234567)';
  }
}

/**
 * Decorator to validate Vietnam phone numbers
 *
 * @example
 * class CreateUserDto {
 *   @IsVietnamPhone()
 *   phone?: string;
 * }
 */
export function IsVietnamPhone(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsVietnamPhoneConstraint,
    });
  };
}
