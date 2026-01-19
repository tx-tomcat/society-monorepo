import { Global, Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import KeyvRedis from '@keyv/redis';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        // Prefer REDIS_URL if available, otherwise construct from individual params
        const redisUrl = configService.get('REDIS_URL');
        const redisHost = configService.get('REDIS_HOST');
        const redisPassword = configService.get('REDIS_PASSWORD');
        const redisPort = configService.get('REDIS_PORT');

        let connectionString: string | undefined;

        if (redisUrl) {
          connectionString = redisUrl;
        } else if (redisHost && redisPassword) {
          connectionString = `rediss://default:${redisPassword}@${redisHost}:${redisPort}`;
        }

        // If Redis config is available, use Redis store
        if (connectionString) {
          try {
            const keyvRedis = new KeyvRedis(connectionString);

            return {
              stores: [keyvRedis],
              ttl: 5 * 60 * 1000, // 5 minutes default TTL
            };
          } catch (error) {
            console.warn(
              'Failed to connect to Redis, using in-memory cache:',
              error,
            );
            return {
              ttl: 5 * 60 * 1000,
            };
          }
        }

        // Fallback to in-memory cache
        return {
          ttl: 5 * 60 * 1000,
        };
      },
    }),
  ],
  providers: [PrismaService],
  exports: [PrismaService, CacheModule],
})
export class PrismaModule {}
