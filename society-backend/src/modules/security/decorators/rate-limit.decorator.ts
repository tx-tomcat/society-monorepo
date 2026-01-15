import { SetMetadata } from '@nestjs/common';
import { RateLimitType } from '../dto/security.dto';
import { RATE_LIMIT_KEY, RateLimitOptions } from '../guards/rate-limit.guard';

export const RateLimit = (type: RateLimitType, keyGenerator?: (context: any) => string) =>
  SetMetadata<string, RateLimitOptions>(RATE_LIMIT_KEY, { type, keyGenerator });
