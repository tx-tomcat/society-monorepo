import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

// Vietnam phone number format: +84, 84, or 0 followed by valid prefix
const VIETNAM_PHONE_REGEX = /^(\+84|84|0)(3|5|7|8|9)[0-9]{8}$/;

export class SendOtpDto {
  @IsString()
  @IsNotEmpty()
  @Matches(VIETNAM_PHONE_REGEX, {
    message: 'Phone number must be a valid Vietnam mobile number',
  })
  phoneNumber: string;
}

export class VerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  @Matches(VIETNAM_PHONE_REGEX, {
    message: 'Phone number must be a valid Vietnam mobile number',
  })
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'OTP must be 6 digits' })
  @Matches(/^\d{6}$/, { message: 'OTP must contain only digits' })
  otp: string;
}

export class PhoneVerificationStatusDto {
  isVerified: boolean;
  phoneNumber: string | null;
  verifiedAt: Date | null;
}
