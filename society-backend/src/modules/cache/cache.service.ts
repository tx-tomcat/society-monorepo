import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleInit {
  private redis: Redis | null = null;
  private readonly logger = new Logger(CacheService.name);
  private readonly DEFAULT_TTL = 300; // 5 minutes
  private isConnected = false;

  constructor(private configService: ConfigService) { }

  async onModuleInit() {
    await this.initializeRedisConnection();
  }

  private async initializeRedisConnection(): Promise<void> {
    // Prefer REDIS_URL if available, otherwise construct from individual params
    const redisUrl = this.configService.get('REDIS_URL');


    let connectionString: string | undefined;

    if (redisUrl) {
      connectionString = redisUrl;
    }

    // Skip Redis if not configured
    if (!connectionString) {
      this.logger.warn(
        'Redis not configured - CacheService running in no-op mode',
      );
      return;
    }

    try {
      this.redis = new Redis(connectionString, {
        maxRetriesPerRequest: 3,
        connectTimeout: 10000,
        lazyConnect: true,
        retryStrategy(times) {
          if (times > 5) {
            // Stop retrying after 5 attempts
            return null;
          }
          const delay = Math.min(times * 1000, 5000);
          return delay;
        },
      });

      this.redis.on('error', (error) => {
        this.isConnected = false;
        this.logger.error(`Redis connection error: ${error.message}`);
      });

      this.redis.on('connect', () => {
        this.isConnected = true;
        this.logger.log('Successfully connected to Redis');
      });

      this.redis.on('close', () => {
        this.isConnected = false;
        this.logger.warn('Redis connection closed');
      });

      this.logger.log('Initialized Redis connection (lazy)');
    } catch (error) {
      this.logger.error(
        `Failed to initialize Redis: ${(error as Error).message}`,
      );
      this.logger.warn('CacheService will run in no-op mode');
      this.redis = null;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) {
      return null;
    }
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      this.logger.error(`Cache get error: ${(error as Error).message}`);
      return null;
    }
  }

  async set(
    key: string,
    value: unknown,
    ttl: number = this.DEFAULT_TTL,
  ): Promise<void> {
    if (!this.redis) {
      return;
    }
    try {
      const serializedValue = JSON.stringify(value);
      await this.redis.setex(key, ttl, serializedValue);
    } catch (error) {
      this.logger.error(`Cache set error: ${(error as Error).message}`);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.redis) {
      return;
    }
    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Cache delete error: ${(error as Error).message}`);
    }
  }

  /**
   * Check if cache is available
   */
  isAvailable(): boolean {
    return this.redis !== null && this.isConnected;
  }
} 
