import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import type { BaseToastProps, ToastConfig } from 'react-native-toast-message';

// Premium color palette matching Society app design system
const colors = {
  // Success - Teal (matching teal-400)
  teal: {
    50: '#EDFCFB',
    100: '#D0F5F3',
    400: '#4ECDC4',
  },
  // Error - Rose/Coral (matching rose-400 for consistency)
  rose: {
    50: '#FFF5F5',
    100: '#FFE5E5',
    400: '#FF6B6B',
  },
  // Info - Lavender (matching lavender-400)
  lavender: {
    50: '#F8F5FF',
    100: '#EDE5FF',
    400: '#C9B1FF',
  },
  // Neutrals
  midnight: '#2D2A33',
  text: {
    secondary: '#6B6572',
  },
  white: '#FFFFFF',
};

type ToastType = 'success' | 'error' | 'info';

// Premium SVG Icons
function SuccessIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Circle cx={10} cy={10} r={10} fill={colors.teal[400]} />
      <Path
        d="M6 10.5L8.5 13L14 7"
        stroke={colors.white}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ErrorIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Circle cx={10} cy={10} r={10} fill={colors.rose[400]} />
      <Path
        d="M7 7L13 13M13 7L7 13"
        stroke={colors.white}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function InfoIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Circle cx={10} cy={10} r={10} fill={colors.lavender[400]} />
      <Path
        d="M10 6V6.5M10 9V14"
        stroke={colors.white}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// Toast Icon component
function ToastIcon({ type }: { type: ToastType }) {
  switch (type) {
    case 'success':
      return <SuccessIcon />;
    case 'error':
      return <ErrorIcon />;
    case 'info':
      return <InfoIcon />;
    default:
      return <InfoIcon />;
  }
}

// Premium Toast component matching Society design system
function CustomToast({
  text1,
  text2,
  type,
  onPress,
  hide,
}: BaseToastProps & { type: ToastType; hide?: () => void }) {
  const themeConfig = {
    success: {
      backgroundColor: colors.teal[50],
      borderColor: colors.teal[100],
      accentColor: colors.teal[400],
      iconBg: colors.teal[100],
    },
    error: {
      backgroundColor: colors.rose[50],
      borderColor: colors.rose[100],
      accentColor: colors.rose[400],
      iconBg: colors.rose[100],
    },
    info: {
      backgroundColor: colors.lavender[50],
      borderColor: colors.lavender[100],
      accentColor: colors.lavender[400],
      iconBg: colors.lavender[100],
    },
  };

  const theme = themeConfig[type];

  const handleDismiss = () => {
    if (hide) {
      hide();
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={onPress}
      style={styles.wrapper}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.backgroundColor,
            borderColor: theme.borderColor,
          },
        ]}
      >
        {/* Accent bar */}
        <View
          style={[styles.accentBar, { backgroundColor: theme.accentColor }]}
        />

        {/* Content */}
        <View style={styles.content}>
          {/* Icon with subtle background */}
          <View style={[styles.iconContainer, { backgroundColor: theme.iconBg }]}>
            <ToastIcon type={type} />
          </View>

          {/* Text content */}
          <View style={styles.textContainer}>
            {text1 ? (
              <Text style={styles.title} numberOfLines={1}>
                {text1}
              </Text>
            ) : null}
            {text2 ? (
              <Text style={styles.message} numberOfLines={2}>
                {text2}
              </Text>
            ) : null}
          </View>

          {/* Dismiss button */}
          <TouchableOpacity
            onPress={handleDismiss}
            style={styles.dismissButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
              <Path
                d="M4 4L12 12M12 4L4 12"
                stroke={theme.accentColor}
                strokeWidth={1.5}
                strokeLinecap="round"
              />
            </Svg>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Toast configuration for react-native-toast-message
export const toastConfig: ToastConfig = {
  success: (props) => <CustomToast {...props} type="success" />,
  error: (props) => <CustomToast {...props} type="error" />,
  info: (props) => <CustomToast {...props} type="info" />,
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    width: '100%',
  },
  container: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: colors.midnight,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingLeft: 16,
    paddingRight: 8,
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: 'Urbanist_600SemiBold',
    fontSize: 15,
    lineHeight: 20,
    color: colors.midnight,
    letterSpacing: -0.3,
  },
  message: {
    fontFamily: 'Urbanist_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: colors.text.secondary,
    letterSpacing: -0.1,
  },
  dismissButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
