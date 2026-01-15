import {
  HyperExpressAdapter,
  NestHyperExpressApplication,
} from '@/adapters';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './middleware/error.middleware';
import './path-register';

const logger = new Logger('Bootstrap');
let app: NestHyperExpressApplication;

// Optimize bootstrap for faster cold starts
async function bootstrap() {
  try {
    if (!app) {
      const hyperExpressAdapter = new HyperExpressAdapter({
        // Request body size limits - prevent DoS attacks
        max_body_length: 10 * 1024 * 1024, // 10MB max body size
        trust_proxy: process.env.NODE_ENV === 'production',
      });

      app = await NestFactory.create<NestHyperExpressApplication>(
        AppModule,
        hyperExpressAdapter,
        {
          logger:
            process.env.NODE_ENV === 'production'
              ? ['error', 'warn']
              : ['error', 'warn', 'log', 'debug'],
          bufferLogs: true,
        },
      );

      // Note: HyperExpress doesn't support Helmet directly
      // Security headers are handled via middleware or reverse proxy (nginx/cloudflare)
      logger.log('HyperExpress adapter initialized');

      // ============================================
      // Security: CORS Configuration
      // ============================================
      const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:8081', // Expo dev
        process.env.NEXT_PUBLIC_CLIENT_URL,
        process.env.CLIENT_URL,
      ].filter(Boolean) as string[];

      app.enableCors({
        origin: (origin, callback) => {
          // Allow requests with no origin (mobile apps, curl, etc.)
          if (!origin) {
            callback(null, true);
            return;
          }
          if (allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            logger.warn(`CORS blocked request from origin: ${origin}`);
            callback(new Error('Not allowed by CORS'), false);
          }
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: [
          'Content-Type',
          'Authorization',
          'X-Requested-With',
          'Accept',
          'Origin',
          'X-CSRF-Token',
        ],
        exposedHeaders: [
          'X-RateLimit-Limit',
          'X-RateLimit-Remaining',
          'X-RateLimit-Reset',
        ],
        maxAge: 86400, // 24 hours preflight cache
      });
      logger.log('CORS configured with allowed origins');

      // ============================================
      // Security: Global Validation Pipe
      // ============================================
      app.useGlobalPipes(new ValidationPipe({
        transform: true, // Auto-transform payloads to DTO instances
        whitelist: true, // Strip properties not in DTO
        forbidNonWhitelisted: true, // Throw error if non-whitelisted properties sent
        forbidUnknownValues: true, // Throw error on unknown values in nested objects
        disableErrorMessages: process.env.NODE_ENV === 'production', // Hide validation details in production
        validationError: {
          target: false, // Don't expose target object
          value: false, // Don't expose invalid values
        },
        stopAtFirstError: false, // Return all validation errors
      }));
      logger.log('Global ValidationPipe enabled');

      // ============================================
      // Security: Global Exception Filter
      // ============================================
      app.useGlobalFilters(new GlobalExceptionFilter());
      logger.log('Global exception filter enabled');

      logger.log('NestJS application initialized with HyperExpress and security layers');

      // Update port listening logic
      if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
        const port = process.env.PORT || 4000;
        await app.listen(port, '0.0.0.0'); // Explicitly bind to all interfaces
        logger.log(`Server listening on port ${port}`);
      }
    }
    return app;
  } catch (error) {
    logger.error('Error in bootstrap:', error);
    throw error;
  }
}

// Vercel serverless handler
// Note: HyperExpress is designed for long-running servers, not serverless
// For serverless deployments, consider using Fastify adapter instead
export default async function handler(
  req: unknown,
  res: { status: (code: number) => { json: (body: unknown) => void } },
) {
  try {
    if (!app) {
      app = await bootstrap();
    }

    await app.init();
    const hyperExpressInstance = app.getHttpAdapter().getInstance();
    // HyperExpress handles requests differently than Fastify
    // This may require additional adaptation for serverless environments
    (hyperExpressInstance as { server?: { emit: (event: string, req: unknown, res: unknown) => void } }).server?.emit('request', req, res);
  } catch (error) {
    logger.error('Error in serverless handler:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}

// For local development
if (require.main === module) {
  bootstrap().catch(error => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });
}
