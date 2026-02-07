import type { AxiosError } from 'axios';
import { Dimensions, Platform } from 'react-native';
import { showMessage } from 'react-native-flash-message';

export const IS_IOS = Platform.OS === 'ios';
const { width, height } = Dimensions.get('screen');

export const WIDTH = width;
export const HEIGHT = height;

// for onError react queries and mutations
export const showError = (error: AxiosError) => {
  const description = extractError(error?.response?.data).trimEnd();

  setTimeout(() => {
    showMessage({
      message: 'Error',
      description,
      type: 'danger',
      animated: false,
      autoHide: true,
      duration: 3000,
    });
  }, 0);
};

export const showErrorMessage = (message: string = 'Something went wrong') => {
  setTimeout(() => {
    showMessage({
      message,
      type: 'danger',
      animated: false,
      autoHide: true,
      duration: 3000,
    });
  }, 0);
};

export const showSuccessMessage = (message: string, description?: string) => {
  setTimeout(() => {
    showMessage({
      message,
      description,
      type: 'success',
      animated: false,
      autoHide: true,
      duration: 3000,
    });
  }, 0);
};

export const showInfoMessage = (message: string, description?: string) => {
  setTimeout(() => {
    showMessage({
      message,
      description,
      type: 'info',
      animated: false,
      autoHide: true,
      duration: 3000,
    });
  }, 0);
};

export const showWarningMessage = (message: string, description?: string) => {
  setTimeout(() => {
    showMessage({
      message,
      description,
      type: 'warning',
      animated: false,
      autoHide: true,
      duration: 3000,
    });
  }, 0);
};

export const extractError = (data: unknown): string => {
  if (typeof data === 'string') {
    return data;
  }
  if (Array.isArray(data)) {
    const messages = data.map((item) => {
      return `  ${extractError(item)}`;
    });

    return `${messages.join('')}`;
  }

  if (typeof data === 'object' && data !== null) {
    const messages = Object.entries(data).map((item) => {
      const [key, value] = item;
      const separator = Array.isArray(value) ? ':\n ' : ': ';

      return `- ${key}${separator}${extractError(value)} \n `;
    });
    return `${messages.join('')} `;
  }
  return 'Something went wrong ';
};
