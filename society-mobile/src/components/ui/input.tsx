import * as React from 'react';
import type {
  Control,
  FieldValues,
  Path,
  RegisterOptions,
} from 'react-hook-form';
import { useController } from 'react-hook-form';
import type { TextInputProps } from 'react-native';
import {
  I18nManager,
  StyleSheet,
  TextInput as NTextInput,
  View,
} from 'react-native';
import { tv } from 'tailwind-variants';

import colors from './colors';
import { Text } from './text';

const inputTv = tv({
  slots: {
    container: 'mb-2 gap-2',
    label:
      'text-lg font-semibold leading-[1.6] tracking-[0.2px] text-midnight dark:text-white',
    input:
      'min-h-[65px] rounded-[10px] border border-border-light bg-warmwhite px-5 py-[18px] text-lg font-semibold leading-[1.6] tracking-[0.2px] text-midnight dark:border-charcoal-700 dark:bg-charcoal-800 dark:text-white',
    errorContainer:
      'mt-2 flex-row items-center gap-2 rounded-md bg-danger-50 px-3 py-2',
    errorText: 'flex-1 text-sm leading-[1.6] tracking-[0.2px] text-danger-500',
  },

  variants: {
    focused: {
      true: {
        input: 'border-rose-400 dark:border-rose-400',
      },
    },
    error: {
      true: {
        input: 'border-2 border-danger-500 dark:border-danger-500',
        label: 'text-midnight dark:text-white',
      },
    },
    success: {
      true: {
        input: 'border-2 border-teal-400 dark:border-teal-400',
      },
    },
    disabled: {
      true: {
        input: 'bg-neutral-200 dark:bg-neutral-700',
      },
    },
  },
  defaultVariants: {
    focused: false,
    error: false,
    success: false,
    disabled: false,
  },
});

export interface NInputProps extends TextInputProps {
  label?: string;
  disabled?: boolean;
  error?: string;
  success?: boolean;
}

type TRule<T extends FieldValues> =
  | Omit<
      RegisterOptions<T>,
      'disabled' | 'valueAsNumber' | 'valueAsDate' | 'setValueAs'
    >
  | undefined;

export type RuleType<T extends FieldValues> = { [name in keyof T]: TRule<T> };
export type InputControllerType<T extends FieldValues> = {
  name: Path<T>;
  control: Control<T>;
  rules?: RuleType<T>;
};

interface ControlledInputProps<T extends FieldValues>
  extends NInputProps,
    InputControllerType<T> {}

export const Input = React.forwardRef<NTextInput, NInputProps>((props, ref) => {
  const { label, error, success, testID, ...inputProps } = props;
  const [isFocussed, setIsFocussed] = React.useState(false);
  const onBlur = React.useCallback(() => setIsFocussed(false), []);
  const onFocus = React.useCallback(() => setIsFocussed(true), []);

  const styles = React.useMemo(
    () =>
      inputTv({
        error: Boolean(error),
        success: Boolean(success),
        focused: isFocussed,
        disabled: Boolean(props.disabled),
      }),
    [error, success, isFocussed, props.disabled]
  );

  return (
    <View className={styles.container()}>
      {label && (
        <Text
          testID={testID ? `${testID}-label` : undefined}
          className={styles.label()}
        >
          {label}
        </Text>
      )}
      <NTextInput
        testID={testID}
        ref={ref}
        placeholderTextColor={colors.neutral[400]}
        className={styles.input()}
        onBlur={onBlur}
        onFocus={onFocus}
        textAlignVertical="center"
        {...inputProps}
        style={StyleSheet.flatten([
          {
            writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
            textAlign: I18nManager.isRTL ? 'right' : 'left',
            fontSize: 18,
            fontFamily: 'Urbanist_600SemiBold',
            paddingVertical: 0,
          },
          inputProps.style,
        ])}
      />
      {error && (
        <View
          className={styles.errorContainer()}
          testID={testID ? `${testID}-error-container` : undefined}
        >
          <Text
            testID={testID ? `${testID}-error` : undefined}
            className={styles.errorText()}
          >
            {error}
          </Text>
        </View>
      )}
    </View>
  );
});

// only used with react-hook-form
export function ControlledInput<T extends FieldValues>(
  props: ControlledInputProps<T>
) {
  const { name, control, rules, ...inputProps } = props;

  const { field, fieldState } = useController({ control, name, rules });
  return (
    <Input
      ref={field.ref}
      autoCapitalize="none"
      onChangeText={field.onChange}
      value={(field.value as string) || ''}
      {...inputProps}
      error={fieldState.error?.message}
    />
  );
}
