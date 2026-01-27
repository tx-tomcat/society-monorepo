import { apiClient } from '../client';

export interface SendOtpResponse {
  success: boolean;
  message: string;
  retryAfter?: number;
}

export interface VerifyOtpResponse {
  success: boolean;
  message: string;
}

export interface PhoneVerificationStatus {
  isVerified: boolean;
  phoneNumber: string | null;
  verifiedAt: string | null;
}

export const phoneVerificationService = {
  /**
   * Send OTP to phone number via Zalo ZNS
   */
  async sendOtp(phoneNumber: string): Promise<SendOtpResponse> {
    return apiClient.post('/phone-verification/send-otp', { phoneNumber });
  },

  /**
   * Verify OTP code
   */
  async verifyOtp(
    phoneNumber: string,
    otp: string
  ): Promise<VerifyOtpResponse> {
    return apiClient.post('/phone-verification/verify', {
      phoneNumber,
      otp,
    });
  },

  /**
   * Get current verification status
   */
  async getStatus(): Promise<PhoneVerificationStatus> {
    return apiClient.get('/phone-verification/status');
  },
};
