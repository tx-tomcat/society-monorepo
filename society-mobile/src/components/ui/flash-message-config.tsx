import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import type { MessageComponentProps } from 'react-native-flash-message';
import { hideMessage } from 'react-native-flash-message';
import Svg, { Circle, Path } from 'react-native-svg';

// Premium color palette matching Society app design system
const colors = {
  // Success - Teal
  teal: {
    400: '#4ECDC4',
    500: '#3DB9B1',
  },
  // Error - Rose
  rose: {
    400: '#FF6B6B',
    500: '#E85555',
  },
  // Warning - Coral
  coral: {
    400: '#FF8E72',
    500: '#E87A5E',
  },
  // Info - Lavender
  lavender: {
    400: '#C9B1FF',
    500: '#B59EE8',
  },
  // Neutrals
  white: '#FFFFFF',
  midnight: '#2D2A33',
  warmwhite: '#FAF9F7',
};

type MessageType = 'success' | 'danger' | 'warning' | 'info' | 'default' | 'none';

// Premium SVG Icons - Larger, bolder design
function SuccessIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Circle cx={11} cy={11} r={11} fill={colors.white} fillOpacity={0.25} />
      <Path
        d="M6.5 11.5L9.5 14.5L15.5 8.5"
        stroke={colors.white}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ErrorIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Circle cx={11} cy={11} r={11} fill={colors.white} fillOpacity={0.25} />
      <Path
        d="M7.5 7.5L14.5 14.5M14.5 7.5L7.5 14.5"
        stroke={colors.white}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function WarningIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Circle cx={11} cy={11} r={11} fill={colors.white} fillOpacity={0.25} />
      <Path
        d="M11 6V12M11 15V16"
        stroke={colors.white}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function InfoIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
      <Circle cx={11} cy={11} r={11} fill={colors.white} fillOpacity={0.25} />
      <Path
        d="M11 6V7M11 10V16"
        stroke={colors.white}
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// Get icon based on message type
function MessageIcon({ type }: { type: MessageType }) {
  switch (type) {
    case 'success':
      return <SuccessIcon />;
    case 'danger':
      return <ErrorIcon />;
    case 'warning':
      return <WarningIcon />;
    case 'info':
    default:
      return <InfoIcon />;
  }
}

// Get gradient colors based on message type
function getThemeConfig(type: MessageType) {
  switch (type) {
    case 'success':
      return {
        backgroundColor: colors.teal[400],
        gradientColor: colors.teal[500],
      };
    case 'danger':
      return {
        backgroundColor: colors.rose[400],
        gradientColor: colors.rose[500],
      };
    case 'warning':
      return {
        backgroundColor: colors.coral[400],
        gradientColor: colors.coral[500],
      };
    case 'info':
    default:
      return {
        backgroundColor: colors.lavender[400],
        gradientColor: colors.lavender[500],
      };
  }
}

/**
 * Custom FlashMessage component - Premium glassmorphic design
 * Matches Society's luxury aesthetic
 */
export function CustomFlashMessage({ message }: MessageComponentProps) {
  const type = (message.type || 'info') as MessageType;
  const theme = getThemeConfig(type);

  const handleDismiss = () => {
    hideMessage();
  };

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.container,
          { backgroundColor: theme.backgroundColor },
        ]}
      >
        {/* Content */}
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <MessageIcon type={type} />
          </View>

          {/* Text content */}
          <View style={styles.textContainer}>
            {message.message ? (
              <Text style={styles.title} numberOfLines={2}>
                {message.message}
              </Text>
            ) : null}
            {message.description ? (
              <Text style={styles.description} numberOfLines={3}>
                {message.description}
              </Text>
            ) : null}
          </View>


        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 8,
    width: '100%',
  },
  container: {
    borderRadius: 14,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingLeft: 16,
    paddingRight: 12,
    gap: 14,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: 'Urbanist_700Bold',
    fontSize: 15,
    lineHeight: 20,
    color: colors.white,
    letterSpacing: -0.2,
  },
  description: {
    fontFamily: 'Urbanist_500Medium',
    fontSize: 13,
    lineHeight: 18,
    color: colors.white,
    opacity: 0.9,
    letterSpacing: -0.1,
  },
  dismissButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
