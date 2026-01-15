import React from 'react';
import type { PressableProps, View } from 'react-native';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import type { VariantProps } from 'tailwind-variants';
import { tv } from 'tailwind-variants';

const button = tv({
  slots: {
    container: 'flex flex-row items-center justify-center rounded-full',
    label: 'font-bold tracking-[0.2px]',
    indicator: 'h-6 text-white',
  },

  variants: {
    variant: {
      default: {
        container: 'bg-rose-400 dark:bg-rose-400',
        label: 'text-white dark:text-white',
        indicator: 'text-white dark:text-white',
      },
      secondary: {
        container: 'bg-softpink dark:bg-charcoal-700',
        label: 'text-rose-400 dark:text-offwhite',
        indicator: 'text-rose-400 dark:text-offwhite',
      },
      outline: {
        container: 'border border-rose-400 dark:border-rose-400',
        label: 'text-rose-400 dark:text-rose-400',
        indicator: 'text-rose-400 dark:text-rose-400',
      },
      destructive: {
        container: 'bg-danger-500',
        label: 'text-white',
        indicator: 'text-white',
      },
      ghost: {
        container: 'bg-transparent',
        label: 'text-rose-400 underline dark:text-offwhite',
        indicator: 'text-rose-400 dark:text-offwhite',
      },
      link: {
        container: 'bg-transparent',
        label: 'text-rose-400 dark:text-offwhite',
        indicator: 'text-rose-400 dark:text-offwhite',
      },
      coral: {
        container: 'bg-coral-400 dark:bg-coral-400',
        label: 'text-white dark:text-white',
        indicator: 'text-white dark:text-white',
      },
      teal: {
        container: 'bg-teal-400 dark:bg-teal-400',
        label: 'text-white dark:text-white',
        indicator: 'text-white dark:text-white',
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
        container: 'bg-neutral-300 dark:bg-neutral-700',
        label: 'text-neutral-600 dark:text-neutral-500',
        indicator: 'text-neutral-400 dark:text-neutral-500',
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
}

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
      ...props
    },
    ref
  ) => {
    const styles = React.useMemo(
      () => button({ variant, disabled, size }),
      [variant, disabled, size]
    );

    return (
      <Pressable
        disabled={disabled || loading}
        className={styles.container({ className })}
        {...props}
        ref={ref}
        testID={testID}
      >
        {props.children ? (
          props.children
        ) : (
          <>
            {loading ? (
              <ActivityIndicator
                size="small"
                className={styles.indicator()}
                testID={testID ? `${testID}-activity-indicator` : undefined}
              />
            ) : (
              <Text
                testID={testID ? `${testID}-label` : undefined}
                className={styles.label({ className: textClassName })}
              >
                {text}
              </Text>
            )}
          </>
        )}
      </Pressable>
    );
  }
);
