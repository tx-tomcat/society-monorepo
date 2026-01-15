import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RateLimiterService } from '../services/rate-limiter.service';
import { SecurityService } from '../services/security.service';
import { RateLimitType, SecurityEventType } from '../dto/security.dto';

export const RATE_LIMIT_KEY = 'rateLimit';

export interface RateLimitOptions {
  type: RateLimitType;
  keyGenerator?: (context: ExecutionContext) => string;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimiterService: RateLimiterService,
    private readonly securityService: SecurityService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.get<RateLimitOptions>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );

    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // Generate identifier
    let identifier: string;
    if (options.keyGenerator) {
      identifier = options.keyGenerator(context);
    } else if (request.user?.id) {
      identifier = request.user.id;
    } else {
      identifier = request.ip || 'unknown';
    }

    // Check rate limit
    const status = await this.rateLimiterService.increment(identifier, options.type);

    // Set rate limit headers
    const response = context.switchToHttp().getResponse();
    response.set('X-RateLimit-Limit', status.limit.toString());
    response.set('X-RateLimit-Remaining', status.remaining.toString());
    response.set('X-RateLimit-Reset', status.resetAt.toISOString());

    if (status.blocked) {
      // Log security event
      await this.securityService.logSecurityEvent(
        SecurityEventType.RATE_LIMIT_EXCEEDED,
        request.user?.id || null,
        request.ip,
        request.headers['user-agent'],
        { type: options.type, identifier },
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((status.resetAt.getTime() - Date.now()) / 1000),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
