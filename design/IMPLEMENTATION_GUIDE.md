# Society - Implementation Guide for Developers

---

## 1. Tailwind CSS Configuration

### 1.1 tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary Brand Colors
        'rose-pink': {
          DEFAULT: '#FF6B8A',
          light: '#FF8FA6',
          dark: '#E5526F',
          10: 'rgba(255, 107, 138, 0.1)',
          20: 'rgba(255, 107, 138, 0.2)',
        },
        'warm-coral': {
          DEFAULT: '#FF8E72',
          light: '#FFA891',
          dark: '#E57558',
        },

        // Accent Colors
        'sunny-yellow': {
          DEFAULT: '#FFD93D',
          light: '#FFE270',
          dark: '#E5C235',
        },
        'lavender': {
          DEFAULT: '#C9B1FF',
          light: '#DED0FF',
          dark: '#A890E5',
          10: 'rgba(201, 177, 255, 0.1)',
        },
        'success-teal': {
          DEFAULT: '#4ECDC4',
          light: '#7EDAD4',
          dark: '#3AB5AC',
        },

        // Background Colors
        'warm-white': '#FFFBF7',
        'soft-pink': '#FFF0F3',

        // Text Colors
        'text': {
          primary: '#2D2A32',
          secondary: '#6B6572',
          tertiary: '#9B95A3',
          disabled: '#C4C0CA',
          inverse: '#FFFFFF',
        },

        // Border Colors
        'border': {
          light: '#F0ECF3',
          DEFAULT: '#E5E1E9',
        },
        'divider': '#F5F2F7',

        // Semantic Colors
        'success': '#4ECDC4',
        'warning': '#FFB84D',
        'error': '#FF6B6B',
        'info': '#6B8AFF',
      },

      fontFamily: {
        'primary': ['Be Vietnam Pro', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },

      fontSize: {
        'display': ['36px', { lineHeight: '44px', letterSpacing: '-0.02em', fontWeight: '700' }],
        'h1': ['28px', { lineHeight: '36px', letterSpacing: '-0.01em', fontWeight: '700' }],
        'h2': ['22px', { lineHeight: '28px', fontWeight: '600' }],
        'h3': ['18px', { lineHeight: '24px', fontWeight: '600' }],
        'h4': ['16px', { lineHeight: '22px', fontWeight: '600' }],
        'body-lg': ['16px', { lineHeight: '24px', fontWeight: '400' }],
        'body': ['15px', { lineHeight: '22px', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '20px', fontWeight: '400' }],
        'caption': ['12px', { lineHeight: '16px', fontWeight: '500' }],
        'tiny': ['10px', { lineHeight: '14px', letterSpacing: '0.02em', fontWeight: '600' }],
      },

      spacing: {
        '0.5': '2px',
        '1': '4px',
        '1.5': '6px',
        '2': '8px',
        '2.5': '10px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '7': '28px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
        '14': '56px',
        '16': '64px',
        '20': '80px',
        '13': '52px', // Button height
        '11': '44px', // Medium button
      },

      borderRadius: {
        'none': '0px',
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
        '3xl': '24px',
        'full': '9999px',
      },

      boxShadow: {
        'sm': '0px 1px 2px rgba(45, 42, 50, 0.04), 0px 2px 4px rgba(45, 42, 50, 0.02)',
        'md': '0px 2px 4px rgba(45, 42, 50, 0.04), 0px 4px 8px rgba(45, 42, 50, 0.04)',
        'lg': '0px 4px 8px rgba(45, 42, 50, 0.04), 0px 8px 16px rgba(45, 42, 50, 0.06)',
        'xl': '0px 8px 16px rgba(45, 42, 50, 0.06), 0px 16px 32px rgba(45, 42, 50, 0.08)',
        'pink': '0px 4px 12px rgba(255, 107, 138, 0.3)',
        'teal': '0px 4px 12px rgba(78, 205, 196, 0.3)',
      },

      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #FF6B8A 0%, #FF8E72 100%)',
        'gradient-warm': 'linear-gradient(135deg, #FF8E72 0%, #FFD93D 100%)',
        'gradient-soft': 'linear-gradient(180deg, #FFF0F3 0%, #FFFBF7 100%)',
        'gradient-trust': 'linear-gradient(135deg, #4ECDC4 0%, #6B8AFF 100%)',
        'gradient-premium': 'linear-gradient(135deg, #C9B1FF 0%, #FF8FA6 100%)',
      },

      animation: {
        'spin': 'spin 1s linear infinite',
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 1.5s infinite',
        'online-pulse': 'online-pulse 2s infinite',
      },

      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'online-pulse': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(78, 205, 196, 0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(78, 205, 196, 0)' },
        },
      },
    },
  },
  plugins: [],
}
```

### 1.2 Global Styles (globals.css)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  * {
    -webkit-tap-highlight-color: transparent;
  }

  html {
    font-family: 'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, sans-serif;
    background-color: #FFFBF7;
    color: #2D2A32;
  }
}

@layer components {
  /* Primary Button */
  .btn-primary {
    @apply bg-gradient-primary text-white font-semibold
           h-13 px-6 rounded-full shadow-pink
           active:scale-[0.98] active:shadow-md
           disabled:opacity-50 disabled:shadow-none
           transition-all duration-200;
  }

  /* Secondary Button */
  .btn-secondary {
    @apply bg-transparent border-2 border-rose-pink text-rose-pink font-semibold
           h-13 px-6 rounded-full
           active:bg-rose-pink-10
           disabled:opacity-50
           transition-all duration-200;
  }

  /* Ghost Button */
  .btn-ghost {
    @apply bg-transparent text-rose-pink font-semibold
           h-11 px-4 rounded-lg
           active:bg-rose-pink-10
           transition-all duration-150;
  }

  /* Input Field */
  .input {
    @apply bg-soft-pink border-2 border-transparent rounded-lg
           h-13 px-4 text-body text-text-primary
           placeholder:text-text-tertiary
           focus:bg-white focus:border-rose-pink focus:outline-none
           transition-all duration-200;
  }

  /* Card */
  .card {
    @apply bg-white rounded-xl shadow-md
           active:scale-[0.98] active:shadow-sm
           transition-all duration-200;
  }

  /* Badge */
  .badge {
    @apply inline-flex items-center gap-1
           px-2 py-1 rounded-full
           text-tiny font-semibold;
  }

  .badge-verified {
    @apply bg-success-teal text-white;
  }

  .badge-pending {
    @apply bg-sunny-yellow/20 text-sunny-yellow-dark;
  }

  .badge-active {
    @apply bg-rose-pink/20 text-rose-pink-dark;
  }

  /* Skeleton */
  .skeleton {
    @apply bg-gradient-to-r from-soft-pink via-warm-white to-soft-pink
           bg-[length:200%_100%] animate-shimmer
           rounded-lg;
  }

  /* Online Indicator */
  .online-indicator {
    @apply w-2.5 h-2.5 bg-success-teal rounded-full
           border-2 border-white
           animate-online-pulse;
  }
}

@layer utilities {
  /* Safe area utilities */
  .pt-safe {
    padding-top: env(safe-area-inset-top, 44px);
  }

  .pb-safe {
    padding-bottom: env(safe-area-inset-bottom, 34px);
  }

  /* Hide scrollbar */
  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }

  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
}
```

---

## 2. React Native / Expo Setup

### 2.1 Theme Configuration (theme/index.ts)

```typescript
export const colors = {
  // Primary Brand Colors
  rosePink: {
    DEFAULT: '#FF6B8A',
    light: '#FF8FA6',
    dark: '#E5526F',
    10: 'rgba(255, 107, 138, 0.1)',
    20: 'rgba(255, 107, 138, 0.2)',
  },
  warmCoral: {
    DEFAULT: '#FF8E72',
    light: '#FFA891',
    dark: '#E57558',
  },
  sunnyYellow: {
    DEFAULT: '#FFD93D',
    light: '#FFE270',
    dark: '#E5C235',
  },
  lavender: {
    DEFAULT: '#C9B1FF',
    light: '#DED0FF',
    dark: '#A890E5',
    10: 'rgba(201, 177, 255, 0.1)',
  },
  successTeal: {
    DEFAULT: '#4ECDC4',
    light: '#7EDAD4',
    dark: '#3AB5AC',
  },

  // Backgrounds
  warmWhite: '#FFFBF7',
  softPink: '#FFF0F3',
  cardBg: '#FFFFFF',

  // Text
  text: {
    primary: '#2D2A32',
    secondary: '#6B6572',
    tertiary: '#9B95A3',
    disabled: '#C4C0CA',
    inverse: '#FFFFFF',
  },

  // Borders
  border: {
    light: '#F0ECF3',
    default: '#E5E1E9',
  },
  divider: '#F5F2F7',

  // Semantic
  success: '#4ECDC4',
  warning: '#FFB84D',
  error: '#FF6B6B',
  info: '#6B8AFF',
} as const;

export const spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
} as const;

export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
} as const;

export const typography = {
  display: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '700' as const,
    letterSpacing: -0.72,
  },
  h1: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700' as const,
    letterSpacing: -0.28,
  },
  h2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600' as const,
  },
  h3: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600' as const,
  },
  h4: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '600' as const,
  },
  bodyLg: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400' as const,
  },
  bodySm: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
  },
  tiny: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
} as const;

export const shadows = {
  sm: {
    shadowColor: '#2D2A32',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#2D2A32',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#2D2A32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#2D2A32',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  pink: {
    shadowColor: '#FF6B8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 4,
  },
} as const;
```

### 2.2 Component Examples

**Button Component (components/Button.tsx)**

```typescript
import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
}) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const sizeStyles = {
    sm: { height: 36, paddingHorizontal: spacing[4] },
    md: { height: 44, paddingHorizontal: spacing[5] },
    lg: { height: 52, paddingHorizontal: spacing[6] },
  };

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={disabled || loading}
        activeOpacity={0.9}
        style={[
          styles.buttonBase,
          sizeStyles[size],
          fullWidth && styles.fullWidth,
          disabled && styles.disabled,
        ]}
      >
        <LinearGradient
          colors={['#FF6B8A', '#FF8E72']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, sizeStyles[size]]}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.primaryText}>{title}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.buttonBase,
        sizeStyles[size],
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.rosePink.DEFAULT} />
      ) : (
        <Text
          style={[
            styles.buttonText,
            variant === 'secondary' && styles.secondaryText,
            variant === 'ghost' && styles.ghostText,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonBase: {
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  gradient: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.full,
    ...shadows.pink,
  },
  primaryText: {
    color: colors.text.inverse,
    ...typography.h4,
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.rosePink.DEFAULT,
  },
  secondaryText: {
    color: colors.rosePink.DEFAULT,
    ...typography.h4,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderRadius: borderRadius.lg,
  },
  ghostText: {
    color: colors.rosePink.DEFAULT,
    ...typography.h4,
  },
  buttonText: {
    ...typography.h4,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
});
```

**Input Component (components/Input.tsx)**

```typescript
import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import { Eye, EyeSlash } from 'phosphor-react-native';
import { colors, spacing, borderRadius, typography } from '../theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helper,
  leftIcon,
  rightIcon,
  isPassword = false,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          error && styles.inputError,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
          style={[styles.input, leftIcon && styles.inputWithLeftIcon]}
          placeholderTextColor={colors.text.tertiary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPassword && !showPassword}
          {...props}
        />

        {isPassword && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.rightIcon}
          >
            {showPassword ? (
              <EyeSlash size={20} color={colors.text.tertiary} />
            ) : (
              <Eye size={20} color={colors.text.tertiary} />
            )}
          </TouchableOpacity>
        )}

        {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
      </View>

      {(error || helper) && (
        <Text style={[styles.helper, error && styles.errorText]}>
          {error || helper}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing[4],
  },
  label: {
    ...typography.caption,
    color: colors.text.secondary,
    marginBottom: spacing[2],
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.softPink,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
    height: 52,
    paddingHorizontal: spacing[4],
  },
  inputFocused: {
    backgroundColor: colors.cardBg,
    borderColor: colors.rosePink.DEFAULT,
  },
  inputError: {
    borderColor: colors.error,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
    height: '100%',
  },
  inputWithLeftIcon: {
    marginLeft: spacing[2],
  },
  leftIcon: {
    marginRight: spacing[2],
  },
  rightIcon: {
    marginLeft: spacing[2],
  },
  helper: {
    ...typography.caption,
    color: colors.text.tertiary,
    marginTop: spacing[1],
  },
  errorText: {
    color: colors.error,
  },
});
```

**Companion Card Component (components/CompanionCard.tsx)**

```typescript
import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, ShieldCheck } from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, borderRadius, typography, shadows } from '../theme';

interface CompanionCardProps {
  companion: {
    id: string;
    name: string;
    age: number;
    photo: string;
    rating: number;
    reviewCount: number;
    price: number;
    isOnline: boolean;
    isVerified: boolean;
    services: string[];
  };
  onPress: () => void;
  style?: any;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - spacing[5] * 2 - spacing[3]) / 2;

export const CompanionCard: React.FC<CompanionCardProps> = ({
  companion,
  onPress,
  style,
}) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + '₫';
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.9}
      style={[styles.container, style]}
    >
      <Image source={{ uri: companion.photo }} style={styles.image} />

      {/* Online Indicator */}
      {companion.isOnline && <View style={styles.onlineIndicator} />}

      {/* Gradient Overlay */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.7)']}
        style={styles.gradient}
      >
        {/* Verified Badge */}
        {companion.isVerified && (
          <View style={styles.verifiedBadge}>
            <ShieldCheck size={12} color="#FFFFFF" weight="fill" />
          </View>
        )}

        {/* Name & Age */}
        <Text style={styles.name} numberOfLines={1}>
          {companion.name}, {companion.age}
        </Text>

        {/* Rating */}
        <View style={styles.ratingRow}>
          <Star size={14} color={colors.sunnyYellow.DEFAULT} weight="fill" />
          <Text style={styles.rating}>
            {companion.rating.toFixed(1)} ({companion.reviewCount})
          </Text>
        </View>

        {/* Price */}
        <Text style={styles.price}>
          From {formatPrice(companion.price)}/hr
        </Text>

        {/* Service Tags */}
        <View style={styles.tags}>
          {companion.services.slice(0, 2).map((service, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{service}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    aspectRatio: 4 / 5,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    backgroundColor: colors.softPink,
    ...shadows.md,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  onlineIndicator: {
    position: 'absolute',
    top: spacing[3],
    right: spacing[3],
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.successTeal.DEFAULT,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing[3],
    paddingTop: spacing[10],
  },
  verifiedBadge: {
    position: 'absolute',
    top: -spacing[8],
    left: spacing[3],
    backgroundColor: colors.successTeal.DEFAULT,
    borderRadius: borderRadius.full,
    padding: spacing[1],
  },
  name: {
    ...typography.h4,
    color: colors.text.inverse,
    marginBottom: spacing[1],
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  rating: {
    ...typography.bodySm,
    color: colors.text.inverse,
    marginLeft: spacing[1],
  },
  price: {
    ...typography.bodySm,
    color: colors.text.inverse,
    marginBottom: spacing[2],
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[1],
  },
  tag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[0.5],
  },
  tagText: {
    ...typography.tiny,
    color: colors.text.inverse,
  },
});
```

---

## 3. Quick Reference - Common Patterns

### 3.1 Tailwind Class Combos

```jsx
// Primary Button
className="bg-gradient-to-r from-rose-pink to-warm-coral text-white font-semibold h-13 px-6 rounded-full shadow-pink active:scale-[0.98]"

// Secondary Button
className="bg-transparent border-2 border-rose-pink text-rose-pink font-semibold h-13 px-6 rounded-full active:bg-rose-pink-10"

// Input Field
className="bg-soft-pink border-2 border-transparent rounded-lg h-13 px-4 focus:bg-white focus:border-rose-pink"

// Card
className="bg-white rounded-xl shadow-md p-4"

// Badge - Verified
className="bg-success-teal text-white text-tiny font-semibold px-2 py-1 rounded-full"

// Badge - Pending
className="bg-sunny-yellow/20 text-sunny-yellow-dark text-tiny font-semibold px-2 py-1 rounded-full"

// Section Header
className="flex justify-between items-center px-5 py-4"

// Online Indicator
className="w-2.5 h-2.5 bg-success-teal rounded-full border-2 border-white animate-online-pulse"
```

### 3.2 Layout Patterns

```jsx
// Screen Container
<View className="flex-1 bg-warm-white pt-safe">

// Horizontal Scroll Cards
<ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="px-5 gap-3">

// Grid of Cards (2 columns)
<View className="flex-row flex-wrap px-5 gap-3">

// Sticky Footer
<View className="absolute bottom-0 left-0 right-0 bg-white shadow-xl px-5 py-4 pb-safe">

// Bottom Tab Bar
<View className="flex-row justify-around items-center h-14 bg-white shadow-lg pb-safe">
```

### 3.3 Color Usage Quick Guide

| Use Case | Color | Tailwind Class |
|----------|-------|----------------|
| Primary CTA | Rose Pink | `bg-rose-pink` or `bg-gradient-primary` |
| Secondary CTA | Rose Pink (outline) | `border-rose-pink text-rose-pink` |
| Success/Verified | Success Teal | `bg-success-teal` |
| Warning/Pending | Sunny Yellow | `bg-sunny-yellow` |
| Error | Error Red | `bg-error` |
| Primary Text | Text Primary | `text-text-primary` |
| Secondary Text | Text Secondary | `text-text-secondary` |
| Muted Text | Text Tertiary | `text-text-tertiary` |
| Background | Warm White | `bg-warm-white` |
| Card Background | Soft Pink | `bg-soft-pink` |

---

## 4. File Structure

```
/app
  /(tabs)
    /index.tsx          # Home/Discovery
    /search.tsx         # Search & Filters
    /bookings.tsx       # My Bookings
    /chat.tsx           # Chat List
    /profile.tsx        # Profile & Settings
  /companion/[id].tsx   # Companion Profile
  /booking/
    /[companionId].tsx  # Booking Flow
    /[bookingId]/
      /active.tsx       # Active Booking
      /review.tsx       # Post-Booking Review
  /auth/
    /login.tsx
    /register.tsx
    /verify.tsx

/components
  /ui
    /Button.tsx
    /Input.tsx
    /Card.tsx
    /Badge.tsx
    /Avatar.tsx
    /Modal.tsx
    /BottomSheet.tsx
  /companion
    /CompanionCard.tsx
    /CompanionGallery.tsx
    /ReviewCard.tsx
  /booking
    /BookingCard.tsx
    /StatusBadge.tsx
    /PriceSummary.tsx
  /navigation
    /TabBar.tsx
    /Header.tsx

/theme
  /index.ts             # All theme exports
  /colors.ts
  /typography.ts
  /spacing.ts

/hooks
  /useAuth.ts
  /useBooking.ts
  /useCompanion.ts

/utils
  /formatters.ts        # Price, date formatting
  /validators.ts        # Form validation
```

---

## 5. Vietnamese Localization Notes

### Currency Formatting
```typescript
// Always use Vietnamese Dong
const formatPrice = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
};

// Examples:
// 400000 -> "400.000₫"
// 1200000 -> "1.200.000₫"
```

### Date Formatting
```typescript
// Vietnamese date format: DD/MM/YYYY
const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
};

// For display: "Thứ Ba, 24 tháng 12, 2024"
const formatDateLong = (date: Date): string => {
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
};
```

### Phone Number Format
```typescript
// Vietnamese phone: +84 XXX XXX XXX
const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('84')) {
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8)}`;
  }
  return phone;
};
```
