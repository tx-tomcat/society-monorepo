import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainException } from '@/common/exceptions';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let errorResponse: Record<string, unknown>;

    if (exception instanceof DomainException) {
      // Domain-specific exception with error code
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse() as Record<string, unknown>;
      errorResponse = {
        ...exceptionResponse,
        path: request.url,
      };

      this.logger.warn(
        `Domain exception: ${exception.errorCode} - ${exception.message}`,
        { metadata: exception.metadata, path: request.url },
      );
    } else if (exception instanceof HttpException) {
      // Standard NestJS HTTP exception
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      errorResponse = {
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
      };

      if (typeof exceptionResponse === 'string') {
        errorResponse.message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        Object.assign(errorResponse, exceptionResponse);
      }
    } else if (exception instanceof Error) {
      // Unhandled error
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorResponse = {
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        message: 'Internal server error',
      };

      // Log full error for debugging
      this.logger.error(
        `Unhandled exception: ${exception.message}`,
        exception.stack,
      );

      // Include stack trace in non-production
      if (process.env.NODE_ENV !== 'production') {
        errorResponse.message = exception.message;
        errorResponse.stack = exception.stack;
      }
    } else {
      // Unknown error type
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorResponse = {
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        message: 'Internal server error',
      };

      this.logger.error('Unknown exception type', exception);
    }

    response.status(status).json(errorResponse);
  }
}
