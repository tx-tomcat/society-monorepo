/**
 * Date utility functions for Society backend
 */
export class DateUtils {
  /**
   * Calculate age from date of birth
   */
  static calculateAge(dateOfBirth: Date): number {
    if (!dateOfBirth) {
      return 0;
    }
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())
    ) {
      age--;
    }
    return age;
  }

  /**
   * Get start of day in local timezone
   */
  static getStartOfDay(date: Date = new Date()): Date {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  /**
   * Get end of day in local timezone
   */
  static getEndOfDay(date: Date = new Date()): Date {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return end;
  }

  /**
   * Get start of week (Monday)
   */
  static getStartOfWeek(date: Date = new Date()): Date {
    const start = new Date(date);
    const dayOfWeek = start.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    start.setDate(start.getDate() - diff);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  /**
   * Get start of month
   */
  static getStartOfMonth(date: Date = new Date()): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  /**
   * Get start of year
   */
  static getStartOfYear(date: Date = new Date()): Date {
    return new Date(date.getFullYear(), 0, 1);
  }

  /**
   * Format date as YYYY-MM-DD
   */
  static formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  /**
   * Parse time string to hours and minutes
   */
  static parseTimeString(time: string): { hours: number; minutes: number } {
    const [hours, minutes] = time.split(':').map(Number);
    return { hours, minutes };
  }

  /**
   * Calculate duration in minutes between two time strings
   */
  static calculateDurationMinutes(startTime: string, endTime: string): number {
    const start = this.parseTimeString(startTime);
    const end = this.parseTimeString(endTime);
    return end.hours * 60 + end.minutes - (start.hours * 60 + start.minutes);
  }

  /**
   * Calculate duration in hours between two time strings
   */
  static calculateDurationHours(startTime: string, endTime: string): number {
    return this.calculateDurationMinutes(startTime, endTime) / 60;
  }

  /**
   * Get period bounds for statistics
   */
  static getPeriodBounds(period: 'week' | 'month' | 'year') {
    const now = new Date();

    switch (period) {
      case 'week': {
        const startOfWeek = this.getStartOfWeek(now);
        const startOfLastWeek = new Date(startOfWeek);
        startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);
        return {
          current: { start: startOfWeek, end: now },
          previous: { start: startOfLastWeek, end: startOfWeek },
        };
      }

      case 'month': {
        const startOfMonth = this.getStartOfMonth(now);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        return {
          current: { start: startOfMonth, end: now },
          previous: { start: startOfLastMonth, end: endOfLastMonth },
        };
      }

      case 'year': {
        const startOfYear = this.getStartOfYear(now);
        const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
        const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31);
        return {
          current: { start: startOfYear, end: now },
          previous: { start: startOfLastYear, end: endOfLastYear },
        };
      }
    }
  }

  /**
   * Check if a date is today
   */
  static isToday(date: Date): boolean {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  }

  /**
   * Check if a date is in the future
   */
  static isFuture(date: Date): boolean {
    return date.getTime() > Date.now();
  }
}
