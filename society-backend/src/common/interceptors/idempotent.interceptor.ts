import {
  BadRequestException,
  CallHandler,
  ConflictException,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { createHash } from 'crypto';

import { PrismaService } from '@/prisma/prisma.service';
import { IDEMPOTENT_KEY, IdempotentOptions } from '../decorators/idempotent.decorator';

const IDEMPOTENCY_HEADER = 'x-idempotency-key';

@Injectable()
export class IdempotentInterceptor implements NestInterceptor {
  private readonly logger = new Logger(IdempotentInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<unknown>> {
    const options = this.reflector.get<IdempotentOptions | undefined>(
      IDEMPOTENT_KEY,
      context.getHandler(),
    );

    // Not marked as idempotent, proceed normally
    if (!options) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const idempotencyKey = request.headers[IDEMPOTENCY_HEADER];

    // No idempotency key provided, proceed normally
    if (!idempotencyKey) {
      return next.handle();
    }

    // Validate idempotency key format (1-255 alphanumeric, hyphens, underscores)
    if (
      typeof idempotencyKey !== 'string' ||
      idempotencyKey.length < 1 ||
      idempotencyKey.length > 255 ||
      !/^[a-zA-Z0-9_-]+$/.test(idempotencyKey)
    ) {
      throw new BadRequestException(
        'X-Idempotency-Key must be 1-255 alphanumeric characters, hyphens, or underscores',
      );
    }

    const userId = request.user?.id;
    if (!userId) {
      this.logger.warn('Idempotency key provided but no user authenticated');
      return next.handle();
    }

    const endpoint = `${request.method} ${request.route?.path || request.url}`;
    const requestHash = this.hashRequestBody(request.body);

    // Check for existing idempotency key
    const existing = await this.prisma.idempotencyKey.findUnique({
      where: { key: idempotencyKey },
    });

    if (existing) {
      // Check if expired
      if (existing.expiresAt < new Date()) {
        // Delete expired key and proceed
        await this.prisma.idempotencyKey.delete({
          where: { key: idempotencyKey },
        });
      } else {
        // Validate it's from the same user and endpoint
        if (existing.userId !== userId) {
          throw new ConflictException('Idempotency key belongs to another user');
        }

        if (existing.endpoint !== endpoint) {
          throw new ConflictException(
            'Idempotency key was used for a different endpoint',
          );
        }

        // Validate request body hash if available
        if (existing.requestHash && existing.requestHash !== requestHash) {
          throw new ConflictException(
            'Idempotency key was used with different request parameters',
          );
        }

        // Return cached response
        this.logger.log(
          `Returning cached response for idempotency key: ${idempotencyKey}`,
        );
        response.status(existing.responseCode);
        return of(existing.responseBody);
      }
    }

    // Proceed with request and cache response
    return next.handle().pipe(
      tap({
        next: async (data) => {
          try {
            const ttl = options.ttl ?? 86400;
            const expiresAt = new Date(Date.now() + ttl * 1000);

            await this.prisma.idempotencyKey.create({
              data: {
                key: idempotencyKey,
                userId,
                endpoint,
                requestHash,
                responseCode: response.statusCode || 200,
                responseBody: data as object,
                expiresAt,
              },
            });

            this.logger.log(
              `Cached response for idempotency key: ${idempotencyKey}`,
            );
          } catch (error) {
            // If we get a unique constraint error, another request beat us
            // This is fine - the response was already processed
            if (
              error instanceof Error &&
              error.message.includes('Unique constraint')
            ) {
              this.logger.warn(
                `Idempotency key ${idempotencyKey} already exists (race condition)`,
              );
            } else {
              this.logger.error(
                `Failed to cache idempotency response: ${error}`,
              );
            }
          }
        },
        error: async (error) => {
          // Don't cache error responses - allow retries
          this.logger.debug(
            `Not caching error response for idempotency key: ${idempotencyKey}`,
          );
        },
      }),
    );
  }

  private hashRequestBody(body: unknown): string | null {
    if (!body || Object.keys(body as object).length === 0) {
      return null;
    }
    return createHash('sha256').update(JSON.stringify(body)).digest('hex');
  }
}
