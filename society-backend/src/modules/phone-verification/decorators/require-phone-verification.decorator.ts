import { SetMetadata } from '@nestjs/common';
import { REQUIRE_PHONE_VERIFICATION_KEY } from '../guards/phone-verified.guard';

export const RequirePhoneVerification = () =>
  SetMetadata(REQUIRE_PHONE_VERIFICATION_KEY, true);
