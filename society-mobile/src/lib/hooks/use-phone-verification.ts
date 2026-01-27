import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';

import { phoneVerificationService } from '../api/services/phone-verification.service';

// Vietnam phone regex
const VIETNAM_PHONE_REGEX = /^(\+84|84|0)(3|5|7|8|9)[0-9]{8}$/;

/**
 * Normalize Vietnam phone to E.164 format
 */
export function normalizeVietnamPhone(phone: string): string {
  let normalized = phone.replace(/\s+/g, '');
  if (normalized.startsWith('0')) {
    normalized = '+84' + normalized.slice(1);
  } else if (normalized.startsWith('84') && !normalized.startsWith('+')) {
    normalized = '+' + normalized;
  } else if (!normalized.startsWith('+84')) {
    normalized = '+84' + normalized;
  }
  return normalized;
}

/**
 * Validate Vietnam phone number
 */
export function isValidVietnamPhone(phone: string): boolean {
  return VIETNAM_PHONE_REGEX.test(phone);
}

/**
 * Hook for phone verification status
 */
export function usePhoneVerificationStatus() {
  return useQuery({
    queryKey: ['phone-verification', 'status'],
    queryFn: () => phoneVerificationService.getStatus(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for phone verification flow
 */
export function usePhoneVerification() {
  const queryClient = useQueryClient();
  const [verificationState, setVerificationState] = React.useState<
    'idle' | 'sending' | 'code_sent' | 'verifying' | 'success' | 'error'
  >('idle');
  const [error, setError] = React.useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = React.useState<string>('');
  const [retryAfter, setRetryAfter] = React.useState<number>(0);

  // Countdown timer for retry
  React.useEffect(() => {
    if (retryAfter <= 0) return;

    const timer = setInterval(() => {
      setRetryAfter((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [retryAfter]);

  // Send OTP mutation
  const sendOtpMutation = useMutation({
    mutationFn: (phone: string) => phoneVerificationService.sendOtp(phone),
  });

  // Verify OTP mutation
  const verifyOtpMutation = useMutation({
    mutationFn: ({ phone, otp }: { phone: string; otp: string }) =>
      phoneVerificationService.verifyOtp(phone, otp),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['phone-verification'] });
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
    },
  });

  /**
   * Step 1: Send OTP code via Zalo
   */
  const sendCode = React.useCallback(
    async (phone: string) => {
      try {
        setError(null);
        setVerificationState('sending');

        // Validate phone format
        if (!isValidVietnamPhone(phone)) {
          throw new Error('Invalid Vietnam phone number');
        }

        const normalizedPhone = normalizeVietnamPhone(phone);
        setPhoneNumber(normalizedPhone);

        const result = await sendOtpMutation.mutateAsync(normalizedPhone);

        if (result.success) {
          setVerificationState('code_sent');
          return { success: true };
        }

        // Handle rate limiting
        if (result.retryAfter) {
          setRetryAfter(result.retryAfter);
        }

        throw new Error(result.message);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to send code';
        setError(message);
        setVerificationState('error');
        return { success: false, error: message };
      }
    },
    [sendOtpMutation]
  );

  /**
   * Step 2: Verify the OTP code
   */
  const verifyCode = React.useCallback(
    async (otp: string) => {
      if (!phoneNumber) {
        setError('No verification in progress');
        return { success: false, error: 'No verification in progress' };
      }

      try {
        setError(null);
        setVerificationState('verifying');

        const result = await verifyOtpMutation.mutateAsync({
          phone: phoneNumber,
          otp,
        });

        if (result.success) {
          setVerificationState('success');
          return { success: true };
        }

        throw new Error(result.message);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Invalid code';
        setError(message);
        setVerificationState('error');
        return { success: false, error: message };
      }
    },
    [phoneNumber, verifyOtpMutation]
  );

  /**
   * Reset state
   */
  const reset = React.useCallback(() => {
    setVerificationState('idle');
    setError(null);
    setPhoneNumber('');
    setRetryAfter(0);
  }, []);

  return {
    // State
    verificationState,
    error,
    phoneNumber,
    retryAfter,
    isCodeSent: verificationState === 'code_sent',
    isSending: verificationState === 'sending',
    isVerifying: verificationState === 'verifying',
    isSuccess: verificationState === 'success',
    canResend: retryAfter === 0,

    // Actions
    sendCode,
    verifyCode,
    reset,

    // Mutation states
    isSendingCode: sendOtpMutation.isPending,
    isVerifyingCode: verifyOtpMutation.isPending,
  };
}
