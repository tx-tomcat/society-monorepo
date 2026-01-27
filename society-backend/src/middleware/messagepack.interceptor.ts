import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  StreamableFile,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { pack } from 'msgpackr';
import type { Request } from 'express';

/**
 * MessagePack Interceptor
 *
 * Automatically serializes responses to MessagePack format when the client
 * sends `Accept: application/msgpack` header.
 *
 * Benefits:
 * - 30-50% smaller payloads than JSON
 * - Faster parsing on mobile (binary vs text)
 * - Lower CPU usage = better battery life
 *
 * Usage:
 * - Client sends: Accept: application/msgpack
 * - Server responds with: Content-Type: application/msgpack
 * - Falls back to JSON if Accept header is not set or is application/json
 */
@Injectable()
export class MessagePackInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const acceptHeader = request.headers.accept || '';
    const wantsMessagePack = acceptHeader.includes('application/msgpack');

    // If client doesn't want MessagePack, skip this interceptor entirely
    if (!wantsMessagePack) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        if (data !== undefined && data !== null) {
          // Encode to MessagePack binary format
          const packed = pack(data);

          // Return as StreamableFile with MessagePack content type
          // This prevents JSON serialization and sends the buffer directly
          return new StreamableFile(packed, {
            type: 'application/msgpack',
          });
        }

        // For undefined/null data, let NestJS handle it normally
        return data;
      }),
    );
  }
}
