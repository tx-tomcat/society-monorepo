import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    // Determine status code
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Build error response preserving context
    const errorResponse: Record<string, unknown> = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      // Handle both string messages and detailed error objects
      // This preserves validation errors, rate limit details, etc.
      if (typeof exceptionResponse === 'string') {
        errorResponse.message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        Object.assign(errorResponse, exceptionResponse);
      }
    } else if (exception instanceof Error) {
      errorResponse.message = exception.message;

      // Include stack trace in development for debugging
      if (process.env.NODE_ENV !== 'production') {
        errorResponse.stack = exception.stack;
      }
    } else {
      errorResponse.message = 'Internal server error';
    }

    // Log error details for monitoring
    const logContext = {
      status,
      url: request.url,
      method: request.method,
      ip: request.ip,
    };

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - ${status}`,
        exception instanceof Error ? exception.stack : JSON.stringify(exception),
        logContext,
      );
    } else if (status >= 400) {
      this.logger.warn(`${request.method} ${request.url} - ${status}`, logContext);
    }

    response.status(status).send(errorResponse);
  }
} 