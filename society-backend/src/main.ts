import {
  NestUltimateExpressApplication,
  UltimateExpressAdapter,
} from '@/adapters';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import compression from 'compression';
import helmet from 'helmet';
import * as zlib from 'zlib';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './middleware/error.middleware';
import { MessagePackInterceptor } from './middleware/messagepack.interceptor';
import './path-register';

const logger = new Logger('Bootstrap');
let app: NestUltimateExpressApplication;

// Optimize bootstrap for faster cold starts
async function bootstrap() {
  try {
    if (!app) {
      app = await NestFactory.create<NestUltimateExpressApplication>(
        AppModule,
        new UltimateExpressAdapter({
          bodyMethods: ['POST', 'PUT', 'PATCH'],
          catchAsyncErrors: true,
        }),
        {
          logger: ['error', 'warn', 'log', 'debug'],
        },
      );

      // ============================================
      // Security: Helmet - HTTP Security Headers
      // ============================================
      // Ultimate Express is Express-compatible, so we can use helmet middleware directly
      app.use(
        helmet({
          // Content Security Policy
          contentSecurityPolicy: {
            directives: {
              defaultSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", 'data:', 'https:'],
              scriptSrc: ["'self'"],
              objectSrc: ["'none'"],
              upgradeInsecureRequests: [],
            },
          },
          // Cross-Origin settings
          crossOriginEmbedderPolicy: false, // Disable for API compatibility
          crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow cross-origin for API
          // X-Frame-Options - prevent clickjacking
          frameguard: { action: 'deny' },
          // HSTS - enforce HTTPS in production
          hsts:
            process.env.NODE_ENV === 'production'
              ? { maxAge: 31536000, includeSubDomains: true, preload: true }
              : false,
          // Prevent MIME type sniffing
          noSniff: true,
          // X-XSS-Protection (legacy but still useful)
          xssFilter: true,
          // Referrer Policy
          referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
          // DNS Prefetch Control
          dnsPrefetchControl: { allow: false },
        }),
      );
      logger.log('Helmet security headers configured');

      // ============================================
      // Performance: Brotli/Gzip Compression
      // ============================================
      // Brotli provides ~90% compression for JSON (vs ~70% for Gzip)
      // Falls back to Gzip for clients that don't support Brotli
      app.use(
        compression({
          // Only compress responses > 1KB (compression overhead not worth it for small payloads)
          threshold: 1024,
          // Compression level for Gzip (0-9), level 6 is default balance
          level: 6,
          // Brotli options for text/JSON compression
          brotli: {
            params: {
              [zlib.constants.BROTLI_PARAM_MODE]: zlib.constants.BROTLI_MODE_TEXT,
              [zlib.constants.BROTLI_PARAM_QUALITY]: 4, // Fast compression with good ratio (0-11)
            },
          },
          // Filter: compress JSON, text, and other compressible content
          filter: (req, res) => {
            // Don't compress if client explicitly requests no compression
            if (req.headers['x-no-compression']) {
              return false;
            }
            // Use default filter (compresses based on content-type)
            return compression.filter(req, res);
          },
        }),
      );
      logger.log('Brotli/Gzip compression enabled (up to 90% bandwidth reduction)');

      logger.log('Ultimate Express adapter initialized (6-12x faster than standard Express)');

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
      app.useGlobalPipes(
        new ValidationPipe({
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
        }),
      );
      logger.log('Global ValidationPipe enabled');

      // ============================================
      // Security: Global Exception Filter
      // ============================================
      app.useGlobalFilters(new GlobalExceptionFilter());
      logger.log('Global exception filter enabled');

      // ============================================
      // Performance: MessagePack Serialization
      // ============================================
      // Responds with MessagePack when client sends Accept: application/msgpack
      // 30-50% smaller than JSON, faster parsing on mobile
      app.useGlobalInterceptors(new MessagePackInterceptor());
      logger.log('MessagePack serialization enabled (30-50% smaller payloads)');

      logger.log(
        'NestJS application initialized with Ultimate Express and security layers',
      );

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
// Note: Ultimate Express uses uWebSockets.js which may have limitations in serverless
export default async function handler(
  req: unknown,
  res: { status: (code: number) => { json: (body: unknown) => void } },
) {
  try {
    if (!app) {
      app = await bootstrap();
    }

    await app.init();
    const expressInstance = app.getHttpAdapter().getInstance();
    // Ultimate Express is Express-compatible, so we can use the standard handler pattern
    (expressInstance as (req: unknown, res: unknown) => void)(req, res);
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
  bootstrap().catch((error) => {
    logger.error('Failed to start server:', error);
    process.exit(1);
  });
}
