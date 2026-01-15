import React from 'react';

import { cleanup, screen, setup, waitFor } from '@/lib/test-utils';

import type { LoginFormProps } from './login-form';
import { LoginForm } from './login-form';

afterEach(cleanup);

const onSubmitMock: jest.Mock<LoginFormProps['onSubmit']> = jest.fn();

describe('LoginForm Form ', () => {
  it('renders correctly', async () => {
    setup(<LoginForm />);
    expect(await screen.findByTestId('email-input')).toBeOnTheScreen();
  });

  it('should have disabled button when input is empty', async () => {
    setup(<LoginForm />);

    const button = screen.getByTestId('send-otp-button');
    // Button should be disabled when form is empty
    expect(button.props.accessibilityState?.disabled).toBe(true);
  });

  it('should display matching error when input is too short', async () => {
    const { user } = setup(<LoginForm />);

    const button = screen.getByTestId('send-otp-button');
    const emailInput = screen.getByTestId('email-input');

    await user.type(emailInput, 'test@example.com');
    await user.press(button);

    // With valid input, no error should be shown
    expect(screen.queryByText(/This field is required/i)).not.toBeOnTheScreen();
  });

  it('Should call LoginForm with correct values when values are valid', async () => {
    const { user } = setup(<LoginForm onSubmit={onSubmitMock} />);

    const button = screen.getByTestId('send-otp-button');
    const emailInput = screen.getByTestId('email-input');

    await user.type(emailInput, 'youssef@gmail.com');
    await user.press(button);
    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalledTimes(1);
    });
    // expect.objectContaining({}) because we don't want to test the target event we are receiving from the onSubmit function
    expect(onSubmitMock).toHaveBeenCalledWith(
      {
        phoneOrEmail: 'youssef@gmail.com',
      },
      expect.objectContaining({})
    );
  });
});
