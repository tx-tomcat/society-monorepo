/**
 * SMS Provider Interface
 *
 * Abstraction layer for SMS/OTP providers allowing easy switching
 * between providers (Zalo ZNS, SpeedSMS, Twilio, etc.)
 */
export interface SmsProviderResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SmsProvider {
  /**
   * Provider identifier
   */
  readonly name: string;

  /**
   * Send OTP to a phone number
   * @param phoneNumber - Vietnam phone number (will be normalized by provider)
   * @param otp - The OTP code to send
   */
  sendOtp(phoneNumber: string, otp: string): Promise<SmsProviderResult>;

  /**
   * Check if provider is properly configured
   */
  isConfigured(): boolean;
}

export const SMS_PROVIDER = Symbol('SMS_PROVIDER');
