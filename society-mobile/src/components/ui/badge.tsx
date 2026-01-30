import React from 'react';
import type { ViewProps } from 'react-native';
import { View } from 'react-native';
import type { VariantProps } from 'tailwind-variants';
import { tv } from 'tailwind-variants';

import { Text } from './text';

const badge = tv({
  slots: {
    container: 'flex-row items-center justify-center rounded-full px-3 py-1',
    label: 'text-xs font-semibold leading-[1.6] tracking-[0.2px]',
  },

  variants: {
    variant: {
      default: {
        container: 'bg-rose-400',
        label: 'text-white',
      },
      secondary: {
        container: 'bg-softpink',
        label: 'text-rose-400',
      },
      outline: {
        container: 'border border-rose-400 bg-transparent',
        label: 'text-rose-400',
      },
      verified: {
        container: 'bg-teal-400',
        label: 'text-white',
      },
      premium: {
        container: 'bg-yellow-400',
        label: 'text-midnight',
      },
      online: {
        container: 'bg-teal-400',
        label: 'text-white',
      },
      offline: {
        container: 'bg-neutral-400',
        label: 'text-white',
      },
      coral: {
        container: 'bg-coral-400',
        label: 'text-white',
      },
      lavender: {
        container: 'bg-lavender-400',
        label: 'text-midnight',
      },
      teal: {
        container: 'bg-teal-400',
        label: 'text-white',
      },
      rose: {
        container: 'bg-rose-400',
        label: 'text-white',
      },
      // Status variants for bookings
      pending: {
        container: 'bg-yellow-100',
        label: 'text-yellow-800',
      },
      confirmed: {
        container: 'bg-teal-100',
        label: 'text-teal-800',
      },
      completed: {
        container: 'bg-lavender-100',
        label: 'text-lavender-800',
      },
      cancelled: {
        container: 'bg-danger-100',
        label: 'text-danger-800',
      },
      // Occasion variant
      occasion: {
        container: 'bg-softpink',
        label: 'text-rose-500',
      },
    },
    size: {
      sm: {
        container: 'px-2 py-0.5',
        label: 'text-xs',
      },
      default: {
        container: 'px-3 py-1',
        label: 'text-xs',
      },
      lg: {
        container: 'px-4 py-1.5',
        label: 'text-sm',
      },
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
});

type BadgeVariants = VariantProps<typeof badge>;
interface Props extends BadgeVariants, Omit<ViewProps, 'children'> {
  label: string;
  icon?: React.ReactNode;
  className?: string;
  testID?: string;
}

export function Badge({
  label,
  icon,
  variant = 'default',
  size = 'default',
  className = '',
  testID,
  ...props
}: Props) {
  const styles = React.useMemo(() => badge({ variant, size }), [variant, size]);

  return (
    <View
      className={styles.container({ className })}
      testID={testID}
      {...props}
    >
      {icon && <View className="mr-1">{icon}</View>}
      <Text
        className={styles.label()}
        testID={testID ? `${testID}-label` : undefined}
      >
        {label}
      </Text>
    </View>
  );
}
