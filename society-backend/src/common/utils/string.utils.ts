/**
 * String utility functions for Society backend
 */
export class StringUtils {
  /**
   * Mask sensitive data (account numbers, cards, etc.)
   */
  static maskSensitiveData(
    value: string,
    visibleChars: number = 4,
    maskChar: string = '*',
  ): string {
    if (value.length <= visibleChars) return value;
    return maskChar.repeat(value.length - visibleChars) + value.slice(-visibleChars);
  }

  /**
   * Generate a unique code with prefix
   */
  static generateCode(prefix: string, length: number = 6): string {
    const year = new Date().getFullYear();
    const random = Math.random()
      .toString(36)
      .substring(2, 2 + length)
      .toUpperCase();
    return `${prefix}-${year}-${random}`;
  }

  /**
   * Generate booking code
   */
  static generateBookingCode(): string {
    return this.generateCode('SOC', 6);
  }

  /**
   * Truncate text with ellipsis
   */
  static truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Safely get first element from JSON array field
   */
  static safeJsonArrayFirst<T>(value: unknown, defaultValue: T | null = null): T | null {
    if (Array.isArray(value) && value.length > 0) {
      return value[0] as T;
    }
    return defaultValue;
  }

  /**
   * Safely convert JSON array field to typed array
   */
  static safeJsonArray<T>(value: unknown, defaultValue: T[] = []): T[] {
    if (Array.isArray(value)) {
      return value as T[];
    }
    return defaultValue;
  }
}
