import type { AxiosError } from 'axios';
import { Dimensions, Platform } from 'react-native';
import { showMessage } from 'react-native-flash-message';

export const IS_IOS = Platform.OS === 'ios';
const { width, height } = Dimensions.get('screen');

export const WIDTH = width;
export const HEIGHT = height;

// for onError react queries and mutations
export const showError = (error: AxiosError) => {
  console.log(JSON.stringify(error?.response?.data));
  const description = extractError(error?.response?.data).trimEnd();

  showMessage({
    message: 'Error',
    description,
    type: 'danger',
    duration: 4000,
    autoHide: true,
  });
};

export const showErrorMessage = (message: string = 'Something went wrong') => {
  showMessage({
    message,
    type: 'danger',
    duration: 4000,
    autoHide: true,
  });
};

export const showSuccessMessage = (message: string, description?: string) => {
  showMessage({
    message,
    description,
    type: 'success',
    duration: 3000,
    autoHide: true,
  });
};

export const showInfoMessage = (message: string, description?: string) => {
  showMessage({
    message,
    description,
    type: 'info',
    duration: 3000,
    autoHide: true,
  });
};

export const showWarningMessage = (message: string, description?: string) => {
  showMessage({
    message,
    description,
    type: 'warning',
    duration: 4000,
    autoHide: true,
  });
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
