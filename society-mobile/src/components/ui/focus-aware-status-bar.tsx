import { useIsFocused } from '@react-navigation/native';
import * as React from 'react';
import { Platform } from 'react-native';
import { SystemBars } from 'react-native-edge-to-edge';

type Props = {
  hidden?: boolean;
  style?: 'light' | 'dark' | 'auto';
};

export const FocusAwareStatusBar = ({ hidden = false, style }: Props) => {
  const isFocused = useIsFocused();

  if (Platform.OS === 'web') return null;

  // Always use light theme (dark status bar text on light background)
  const statusBarStyle = style === 'auto' || !style ? 'dark' : style;

  return isFocused ? (
    <SystemBars style={statusBarStyle} hidden={hidden} />
  ) : null;
};
