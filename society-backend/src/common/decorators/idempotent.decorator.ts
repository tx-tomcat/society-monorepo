import { SetMetadata } from '@nestjs/common';

export const IDEMPOTENT_KEY = 'idempotent';

export interface IdempotentOptions {
  /**
   * TTL in seconds for idempotency key (default: 24 hours)
   */
  ttl?: number;
}

/**
 * Mark an endpoint as idempotent.
 * Requires X-Idempotency-Key header from client.
 * If the same key is used within the TTL, returns cached response.
 */
export const Idempotent = (options: IdempotentOptions = {}) =>
  SetMetadata(IDEMPOTENT_KEY, { ttl: options.ttl ?? 86400 });
