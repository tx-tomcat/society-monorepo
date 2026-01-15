/* eslint-disable max-lines-per-function */
import * as LocalAuthentication from 'expo-local-authentication';
import React from 'react';

import { getItem, removeItem, setItem } from '@/lib/storage';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

export type BiometricType =
  | 'FACIAL_RECOGNITION'
  | 'FINGERPRINT'
  | 'IRIS'
  | 'NONE';

export function useBiometricAuth() {
  const [isEnabled, setIsEnabled] = React.useState(false);
  const [isAvailable, setIsAvailable] = React.useState(false);
  const [biometricType, setBiometricType] =
    React.useState<BiometricType>('NONE');
  const [isLoading, setIsLoading] = React.useState(true);

  // Check if biometric authentication is available
  React.useEffect(() => {
    const checkAvailability = async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        const available = hasHardware && isEnrolled;

        setIsAvailable(available);

        if (available) {
          const supportedTypes =
            await LocalAuthentication.supportedAuthenticationTypesAsync();

          if (
            supportedTypes.includes(
              LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
            )
          ) {
            setBiometricType('FACIAL_RECOGNITION');
          } else if (
            supportedTypes.includes(
              LocalAuthentication.AuthenticationType.FINGERPRINT
            )
          ) {
            setBiometricType('FINGERPRINT');
          } else if (
            supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)
          ) {
            setBiometricType('IRIS');
          }
        }

        // Load saved preference
        const savedPreference = getItem<boolean>(BIOMETRIC_ENABLED_KEY);
        setIsEnabled(available && (savedPreference ?? false));
      } catch (error) {
        console.error('Error checking biometric availability:', error);
        setIsAvailable(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAvailability();
  }, []);

  const authenticate = React.useCallback(async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to continue',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        return { success: true };
      }

      return {
        success: false,
        error: result.error || 'Authentication failed',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication error',
      };
    }
  }, []);

  const enableBiometric = React.useCallback(async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    if (!isAvailable) {
      return {
        success: false,
        error: 'Biometric authentication is not available on this device',
      };
    }

    const authResult = await authenticate();

    if (authResult.success) {
      setItem(BIOMETRIC_ENABLED_KEY, true);
      setIsEnabled(true);
      return { success: true };
    }

    return authResult;
  }, [isAvailable, authenticate]);

  const disableBiometric = React.useCallback(async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    const authResult = await authenticate();

    if (authResult.success) {
      removeItem(BIOMETRIC_ENABLED_KEY);
      setIsEnabled(false);
      return { success: true };
    }

    return authResult;
  }, [authenticate]);

  const toggleBiometric = React.useCallback(async (): Promise<{
    success: boolean;
    error?: string;
  }> => {
    if (isEnabled) {
      return disableBiometric();
    }
    return enableBiometric();
  }, [isEnabled, enableBiometric, disableBiometric]);

  const getBiometricName = React.useCallback((): string => {
    switch (biometricType) {
      case 'FACIAL_RECOGNITION':
        return 'Face ID';
      case 'FINGERPRINT':
        return 'Touch ID';
      case 'IRIS':
        return 'Iris';
      default:
        return 'Biometric';
    }
  }, [biometricType]);

  return {
    isEnabled,
    isAvailable,
    isLoading,
    biometricType,
    authenticate,
    enableBiometric,
    disableBiometric,
    toggleBiometric,
    getBiometricName,
  };
}
