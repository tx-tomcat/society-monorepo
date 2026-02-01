/* eslint-disable max-lines-per-function */
import React from 'react';
import type { PressableProps, View } from 'react-native';
import {
  ActivityIndicator,
  Pressable,
  Text,
  View as RNView,
} from 'react-native';
import type { VariantProps } from 'tailwind-variants';
import { tv } from 'tailwind-variants';

// Icon component type
type IconComponent = React.ComponentType<{
  color?: string;
  width?: number;
  height?: number;
}>;

const button = tv({
  slots: {
    container: 'flex flex-row items-center justify-center rounded-full',
    label: 'font-bold tracking-[0.2px]',
    indicator: 'h-6 text-white',
    iconWrapper: 'flex-row items-center gap-2',
  },

  variants: {
    variant: {
      default: {
        container: 'bg-rose-400',
        label: 'text-white',
        indicator: 'text-white',
      },
      secondary: {
        container: 'bg-softpink',
        label: 'text-rose-400',
        indicator: 'text-rose-400',
      },
      outline: {
        container: 'border border-rose-400',
        label: 'text-rose-400',
        indicator: 'text-rose-400',
      },
      destructive: {
        container: 'bg-danger-500',
        label: 'text-white',
        indicator: 'text-white',
      },
      ghost: {
        container: 'bg-transparent',
        label: 'text-rose-400 underline',
        indicator: 'text-rose-400',
      },
      link: {
        container: 'bg-transparent',
        label: 'text-rose-400',
        indicator: 'text-rose-400',
      },
      coral: {
        container: 'bg-coral-400',
        label: 'text-white',
        indicator: 'text-white',
      },
      teal: {
        container: 'bg-teal-400',
        label: 'text-white',
        indicator: 'text-white',
      },
    },
    size: {
      default: {
        container: 'h-12 px-4',
        label: 'text-base leading-[1.6]',
      },
      lg: {
        container: 'h-14 px-8',
        label: 'text-lg leading-[1.6]',
      },
      sm: {
        container: 'h-10 px-3',
        label: 'text-sm leading-[1.6]',
        indicator: 'h-4',
      },
      icon: {
        container: 'size-12',
        label: 'text-base',
      },
    },
    disabled: {
      true: {
        container: 'bg-neutral-300',
        label: 'text-neutral-600',
        indicator: 'text-neutral-400',
      },
    },
    fullWidth: {
      true: {
        container: 'w-full',
      },
      false: {
        container: 'self-center',
      },
    },
  },
  defaultVariants: {
    variant: 'default',
    disabled: false,
    fullWidth: true,
    size: 'default',
  },
});

type ButtonVariants = VariantProps<typeof button>;
interface Props extends ButtonVariants, Omit<PressableProps, 'disabled'> {
  label?: string;
  loading?: boolean;
  className?: string;
  textClassName?: string;
  icon?: IconComponent;
  iconPosition?: 'left' | 'right';
  iconSize?: number;
  iconColor?: string;
}

// Icon color mapping based on variant
const getIconColor = (variant: string, disabled: boolean): string => {
  if (disabled) return '#a3a3a3'; // neutral-400
  switch (variant) {
    case 'default':
    case 'destructive':
    case 'coral':
    case 'teal':
      return '#FFFFFF';
    case 'secondary':
    case 'outline':
    case 'ghost':
    case 'link':
      return '#f87171'; // rose-400
    default:
      return '#FFFFFF';
  }
};

export const Button = React.forwardRef<View, Props>(
  (
    {
      label: text,
      loading = false,
      variant = 'default',
      disabled = false,
      size = 'default',
      className = '',
      testID,
      textClassName = '',
      icon: Icon,
      iconPosition = 'left',
      iconSize,
      iconColor,
      ...props
    },
    ref
  ) => {
    const styles = React.useMemo(
      () => button({ variant, disabled, size }),
      [variant, disabled, size]
    );

    // Determine icon size based on button size
    const defaultIconSize = size === 'sm' ? 16 : size === 'lg' ? 22 : 20;
    const finalIconSize = iconSize ?? defaultIconSize;
    const finalIconColor =
      iconColor ?? getIconColor(variant ?? 'default', disabled ?? false);

    const renderContent = () => {
      if (loading) {
        return (
          <ActivityIndicator
            size="small"
            className={styles.indicator()}
            testID={testID ? `${testID}-activity-indicator` : undefined}
          />
        );
      }

      const iconElement = Icon ? (
        <Icon
          color={finalIconColor}
          width={finalIconSize}
          height={finalIconSize}
        />
      ) : null;

      // Icon-only button (no label)
      if (!text && iconElement) {
        return iconElement;
      }

      // Text with icon
      if (text && iconElement) {
        return (
          <RNView className={styles.iconWrapper()}>
            {iconPosition === 'left' && iconElement}
            <Text
              testID={testID ? `${testID}-label` : undefined}
              className={styles.label({ className: textClassName })}
            >
              {text}
            </Text>
            {iconPosition === 'right' && iconElement}
          </RNView>
        );
      }

      // Text only
      return (
        <Text
          testID={testID ? `${testID}-label` : undefined}
          className={styles.label({ className: textClassName })}
        >
          {text}
        </Text>
      );
    };

    return (
      <Pressable
        disabled={disabled || loading}
        className={styles.container({ className })}
        {...props}
        ref={ref}
        testID={testID}
      >
        {props.children ? props.children : renderContent()}
      </Pressable>
    );
  }
);
