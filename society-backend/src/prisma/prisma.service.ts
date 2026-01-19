import { Prisma, PrismaClient } from '@generated/client';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { Cache } from 'cache-manager';
import { Pool } from 'pg';
import { CacheConfig, PrismaCacheProxy, PrismaModel } from './prisma.proxy';

// Type for Prisma model delegate operations
type PrismaDelegate = {
  findMany: (args: Record<string, unknown>) => Promise<unknown[]>;
  count: (args: Record<string, unknown>) => Promise<number>;
  update: (args: Record<string, unknown>) => Promise<unknown>;
};

// Pagination query arguments
interface PaginateArgs {
  page?: number;
  limit?: number;
  where?: Record<string, unknown>;
  orderBy?: Record<string, unknown> | Array<Record<string, unknown>>;
  include?: Record<string, unknown>;
  select?: Record<string, unknown>;
}

// List of Prisma model names that should be cached
const CACHED_MODELS = [
  // Core user models
  'user',
  'companionProfile',
  'hirerProfile',
  'userSettings',
  'userDevice',
  'userSession',
  'userBlock',
  'userStrike',
  'userSuspension',
  // Companion related
  'companionAvailability',
  'companionPhoto',
  'companionService',
  // Bookings & payments
  'booking',
  'payment',
  'earning',
  'withdrawal',
  'bankAccount',
  // Messaging
  'message',
  'conversation',
  // Notifications
  'notification',
  'notificationLog',
  'pushToken',
  // Social features
  'review',
  'favoriteCompanion',
  'referral',
  // Verification & security
  'verification',
  'photoVerification',
  'securityEvent',
  'ipBlocklist',
  // Moderation
  'report',
  'appeal',
  'moderationAction',
  'moderationQueue',
  // Files
  'file',
  // Admin
  'adminAuditLog',
  'profileBoost',
  // Safety & Emergency
  'emergencyContact',
  'emergencyEvent',
  // Support
  'supportTicket',
  'supportTicketMessage',
  'featureFlag',
  'systemConfig',
] as const;

type CachedModelName = (typeof CACHED_MODELS)[number];

/**
 * PrismaService with transparent caching.
 * All model queries (findUnique, findFirst, findMany, count, etc.) are cached by default.
 * Mutations (create, update, delete) automatically invalidate the cache.
 *
 * Usage remains the same as standard Prisma:
 *   const user = await this.prisma.user.findUnique({ where: { id } });
 *
 * To bypass cache for a specific query, use raw():
 *   const user = await this.prisma.raw.user.findUnique({ where: { id } });
 */
@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private pool: Pool;
  private cacheProxy: PrismaCacheProxy | null = null;
  private cachedModelProxies: Map<string, unknown> = new Map();
  private _prismaClient: PrismaClient;

  /**
   * Access to the raw PrismaClient without caching.
   * Use this when you need to bypass the cache.
   */
  public get raw(): PrismaClient {
    return this._prismaClient;
  }

  constructor(@Optional() @Inject(CACHE_MANAGER) private cacheManager?: Cache) {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    const adapter = new PrismaPg(this.pool);

    this._prismaClient = new PrismaClient({
      adapter,
      log:
        process.env.NODE_ENV === 'development'
          ? [
            { emit: 'event', level: 'query' },
            { emit: 'stdout', level: 'info' },
            { emit: 'stdout', level: 'warn' },
            { emit: 'stdout', level: 'error' },
          ]
          : [{ emit: 'stdout', level: 'error' }],
    });

    // Log queries in development
    if (process.env.NODE_ENV === 'development') {
      this._prismaClient.$on('query' as never, (e: Prisma.QueryEvent) => {
        this.logger.debug(`Query: ${e.query}`);
        this.logger.debug(`Duration: ${e.duration}ms`);
      });
    }

    // Setup model accessors that return cached proxies
    this.setupCachedModelAccessors();
  }

  /**
   * Setup getters for each model that return cached proxies
   */
  private setupCachedModelAccessors(): void {
    for (const modelName of CACHED_MODELS) {
      Object.defineProperty(this, modelName, {
        get: () => this.getCachedModel(modelName),
        enumerable: true,
        configurable: true,
      });
    }
  }

  /**
   * Get a cached model proxy or fallback to raw Prisma model
   */
  private getCachedModel(modelName: CachedModelName): unknown {
    // If no cache proxy, return raw Prisma model
    if (!this.cacheProxy) {
      return this._prismaClient[modelName as keyof PrismaClient];
    }

    // Return cached proxy (create if not exists)
    if (!this.cachedModelProxies.has(modelName)) {
      const proxy = this.cacheProxy.createProxy(modelName as PrismaModel);
      this.cachedModelProxies.set(modelName, proxy);
    }

    return this.cachedModelProxies.get(modelName);
  }

  async onModuleInit(): Promise<void> {
    try {
      await this._prismaClient.$connect();
      this.logger.log('Successfully connected to database');

      // Initialize cache proxy if cache manager is available
      if (this.cacheManager) {
        this.cacheProxy = new PrismaCacheProxy(
          this._prismaClient,
          this.cacheManager,
        );
        await this.cacheProxy.onModuleInit();
        this.logger.log('Cache proxy initialized - queries are cached by default');
      } else {
        this.logger.warn(
          'Cache manager not available - running without query caching',
        );
      }
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    // Clean up cache proxy
    if (this.cacheProxy) {
      await this.cacheProxy.onModuleDestroy();
    }

    await this._prismaClient.$disconnect();
    await this.pool.end();
    this.logger.log('Disconnected from database');
  }

  /**
   * Configure cache behavior
   */
  setCacheConfig(config: CacheConfig): void {
    if (this.cacheProxy) {
      this.cacheProxy.setConfig(config);
    }
  }

  /**
   * Invalidate cache for a specific model
   */
  async invalidateCache(
    model: string,
    args?: Record<string, unknown>,
  ): Promise<void> {
    if (this.cacheProxy) {
      await this.cacheProxy.invalidateCache(model, args);
    }
  }

  /**
   * Invalidate all cache entries for a model
   */
  async invalidateModelCache(model: string): Promise<void> {
    if (this.cacheProxy) {
      await this.cacheProxy.invalidateModelCache(model);
    }
  }

  /**
   * Execute operations in a transaction (uses raw client, no caching)
   */
  async executeInTransaction<T>(
    fn: (
      prisma: Omit<
        PrismaClient,
        '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
      >,
    ) => Promise<T>,
    options?: {
      maxWait?: number;
      timeout?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    },
  ): Promise<T> {
    return this._prismaClient.$transaction(fn, options);
  }

  /**
   * Execute a transaction (pass-through to PrismaClient)
   * Supports both interactive transactions (function form) and batch transactions (array form)
   */
  $transaction<P extends Prisma.PrismaPromise<unknown>[]>(
    arg: [...P],
    options?: { isolationLevel?: Prisma.TransactionIsolationLevel },
  ): Promise<{ [K in keyof P]: Awaited<P[K]> }>;
  $transaction<T>(
    fn: (
      prisma: Omit<
        PrismaClient,
        '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
      >,
    ) => Promise<T>,
    options?: {
      maxWait?: number;
      timeout?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    },
  ): Promise<T>;
  $transaction<T, P extends Prisma.PrismaPromise<unknown>[]>(
    arg:
      | [...P]
      | ((
          prisma: Omit<
            PrismaClient,
            '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'
          >,
        ) => Promise<T>),
    options?: {
      maxWait?: number;
      timeout?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    },
  ): Promise<T | { [K in keyof P]: Awaited<P[K]> }> {
    if (Array.isArray(arg)) {
      return this._prismaClient.$transaction(
        arg as Prisma.PrismaPromise<unknown>[],
        options,
      ) as Promise<{ [K in keyof P]: Awaited<P[K]> }>;
    }
    return this._prismaClient.$transaction(arg, options);
  }

  /**
   * Execute raw SQL query
   */
  $queryRaw<T = unknown>(
    query: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T> {
    return this._prismaClient.$queryRaw(query, ...values);
  }

  /**
   * Execute raw SQL (unsafe - use with caution)
   */
  $executeRawUnsafe(query: string): Promise<number> {
    return this._prismaClient.$executeRawUnsafe(query);
  }

  /**
   * Clean database - for testing purposes only
   */
  async cleanDatabase(): Promise<void> {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clean database in production');
    }

    const tablenames = await this._prismaClient.$queryRaw<
      Array<{ tablename: string }>
    >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

    const tables = tablenames
      .map(({ tablename }) => tablename)
      .filter((name) => name !== '_prisma_migrations')
      .map((name) => `"public"."${name}"`)
      .join(', ');

    if (tables.length > 0) {
      await this._prismaClient.$executeRawUnsafe(
        `TRUNCATE TABLE ${tables} CASCADE;`,
      );
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this._prismaClient.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Soft delete helper - updates deletedAt timestamp
   */
  async softDelete<T extends { id: string }>(
    model: Prisma.ModelName,
    id: string,
  ): Promise<T> {
    const modelName = this.toCamelCase(model);
    const delegate = this.getModelDelegate(modelName);
    const result = await delegate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    // Invalidate cache for this model
    await this.invalidateCache(modelName, { where: { id } });

    return result as T;
  }

  /**
   * Get paginated results (uses cached queries)
   */
  async paginate<T>(
    model: Prisma.ModelName,
    args: PaginateArgs,
  ): Promise<{
    data: T[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> {
    const page = Math.max(1, args.page || 1);
    const limit = Math.min(100, Math.max(1, args.limit || 10));
    const skip = (page - 1) * limit;

    const modelName = this.toCamelCase(model) as CachedModelName;

    // Use cached model if available
    const cachedModel = this.getCachedModel(modelName) as PrismaDelegate;

    const [data, total] = await Promise.all([
      cachedModel.findMany({
        where: args.where,
        orderBy: args.orderBy,
        include: args.include,
        select: args.select,
        skip,
        take: limit,
      }),
      cachedModel.count({ where: args.where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: data as T[],
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Get model delegate by name (raw, without caching)
   */
  private getModelDelegate(modelName: string): PrismaDelegate {
    const delegate = this._prismaClient[modelName as keyof PrismaClient];
    if (!delegate) {
      throw new Error(`Model ${modelName} not found`);
    }
    return delegate as unknown as PrismaDelegate;
  }

  /**
   * Convert PascalCase to camelCase
   */
  private toCamelCase(str: string): string {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }

  // ============================================================
  // Model accessors - these are defined dynamically in constructor
  // but we declare them here for TypeScript type support
  // ============================================================

  // Core user models
  declare user: PrismaClient['user'];
  declare companionProfile: PrismaClient['companionProfile'];
  declare hirerProfile: PrismaClient['hirerProfile'];
  declare userSettings: PrismaClient['userSettings'];
  declare userDevice: PrismaClient['userDevice'];
  declare userSession: PrismaClient['userSession'];
  declare userBlock: PrismaClient['userBlock'];
  declare userStrike: PrismaClient['userStrike'];
  declare userSuspension: PrismaClient['userSuspension'];
  // Companion related
  declare companionAvailability: PrismaClient['companionAvailability'];
  declare companionPhoto: PrismaClient['companionPhoto'];
  declare companionService: PrismaClient['companionService'];
  // Bookings & payments
  declare booking: PrismaClient['booking'];
  declare payment: PrismaClient['payment'];
  declare earning: PrismaClient['earning'];
  declare withdrawal: PrismaClient['withdrawal'];
  declare bankAccount: PrismaClient['bankAccount'];
  // Messaging
  declare message: PrismaClient['message'];
  declare conversation: PrismaClient['conversation'];
  // Notifications
  declare notification: PrismaClient['notification'];
  declare notificationLog: PrismaClient['notificationLog'];
  declare pushToken: PrismaClient['pushToken'];
  // Social features
  declare review: PrismaClient['review'];
  declare favoriteCompanion: PrismaClient['favoriteCompanion'];
  declare referral: PrismaClient['referral'];
  // Verification & security
  declare verification: PrismaClient['verification'];
  declare photoVerification: PrismaClient['photoVerification'];
  declare securityEvent: PrismaClient['securityEvent'];
  declare ipBlocklist: PrismaClient['ipBlocklist'];
  // Moderation
  declare report: PrismaClient['report'];
  declare appeal: PrismaClient['appeal'];
  declare moderationAction: PrismaClient['moderationAction'];
  declare moderationQueue: PrismaClient['moderationQueue'];
  // Files
  declare file: PrismaClient['file'];
  // Admin
  declare adminAuditLog: PrismaClient['adminAuditLog'];
  declare profileBoost: PrismaClient['profileBoost'];
  // Safety & Emergency
  declare emergencyContact: PrismaClient['emergencyContact'];
  declare emergencyEvent: PrismaClient['emergencyEvent'];
  // Support
  declare supportTicket: PrismaClient['supportTicket'];
  declare supportTicketMessage: PrismaClient['supportTicketMessage'];
  declare featureFlag: PrismaClient['featureFlag'];
  declare systemConfig: PrismaClient['systemConfig'];
}
