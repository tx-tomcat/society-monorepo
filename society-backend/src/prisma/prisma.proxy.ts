import { PrismaClient } from '@/generated/client';
import { Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { hash } from 'object-code';
import { InvalidationStrategyChain } from './invalidation-strategies';

export type PrismaModel = keyof PrismaClient;

// Query methods that can be cached
export const CACHEABLE_METHODS = [
  'findUnique',
  'findFirst',
  'findMany',
  'count',
  'aggregate',
  'groupBy',
] as const;
export type CacheableMethod = (typeof CACHEABLE_METHODS)[number];

// Methods that modify data and should invalidate cache
export const MUTATION_METHODS = [
  'create',
  'update',
  'delete',
  'updateMany',
  'deleteMany',
  'updateManyAndReturn',
  'upsert',
  'createMany',
] as const;
export type MutationMethod = (typeof MUTATION_METHODS)[number];

export type ModelMethod = CacheableMethod | MutationMethod;

// Type-safe argument types
export type CacheEntryArgs = Record<string, unknown>;
export type CacheEntryData = {
  model: string;
  args: CacheEntryArgs;
};

// Simplified type for proxy method signatures
export type ProxyMethodOptions = {
  skipCache?: boolean;
  skipInvalidation?: boolean;
  ttl?: number;
};

export type ForceInvalidateModel = {
  model: string;
  args?: CacheEntryArgs;
};

type GetDelegate<T extends PrismaModel> = PrismaClient[T];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DelegateMethodType<T, M extends string> = T[M & keyof T] extends (
  ...args: unknown[]
) => unknown
  ? T[M & keyof T]
  : never;

export type ProxyMethods<T extends PrismaModel> = {
  [M in ModelMethod & keyof GetDelegate<T>]: DelegateMethodType<
    GetDelegate<T>,
    M
  > extends never
  ? never
  : M extends CacheableMethod
  ? (
    args: Parameters<DelegateMethodType<GetDelegate<T>, M>>[0],
    ttl?: number,
  ) => ReturnType<DelegateMethodType<GetDelegate<T>, M>>
  : (
    args: Parameters<DelegateMethodType<GetDelegate<T>, M>>[0],
    forceInvalidateModels?: ForceInvalidateModel[],
  ) => ReturnType<DelegateMethodType<GetDelegate<T>, M>>;
};

// Cache configuration
export interface CacheConfig {
  ttl?: number;
  models?: Record<
    string,
    {
      ttl?: number;
      excludeOperations?: CacheableMethod[];
    }
  >;
  excludeGlobally?: CacheableMethod[];
  /** Maximum registry size before auto-pruning (default: 10000) */
  registryMaxSize?: number;
  /** Batch registry saves every N operations (default: 50) */
  registryBatchSize?: number;
  /** Debounce delay for registry saves in ms (default: 2000) */
  registryDebounceMs?: number;
}

// Type for Prisma model delegate with callable methods
// Using a more permissive type that works with Prisma's complex delegate types
interface PrismaModelDelegate {
  [key: string]: ((args: CacheEntryArgs) => Promise<unknown>) | unknown;
}

/**
 * PrismaCacheProxy wraps Prisma model operations with automatic caching.
 * It is instantiated directly by PrismaService when a cache manager is available.
 */
export class PrismaCacheProxy {
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly REGISTRY_KEY = 'prisma:cache:registry';
  private readonly REGISTRY_MAX_SIZE = 10000;
  private readonly REGISTRY_BATCH_SIZE = 50;
  private readonly REGISTRY_DEBOUNCE_MS = 2000;

  private cacheKeysRegistry = new Map<string, CacheEntryData>();
  private readonly logger = new Logger(PrismaCacheProxy.name);
  private config: CacheConfig = {
    ttl: this.DEFAULT_TTL,
    models: {},
    excludeGlobally: [],
    registryMaxSize: this.REGISTRY_MAX_SIZE,
    registryBatchSize: this.REGISTRY_BATCH_SIZE,
    registryDebounceMs: this.REGISTRY_DEBOUNCE_MS,
  };

  // Registry optimization state
  private registryLoaded = false;
  private registryDirty = false;
  private pendingSaves = 0;
  private saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private loadingPromise: Promise<void> | null = null;

  // Invalidation strategy chain
  private readonly invalidationChain: InvalidationStrategyChain;

  constructor(
    private readonly prismaClient: PrismaClient,
    private readonly cacheManager: Cache,
  ) {
    this.invalidationChain = new InvalidationStrategyChain();
  }

  /**
   * Load the cache registry from persistent storage on module initialization
   */
  async onModuleInit(): Promise<void> {
    await this.loadRegistry();
    this.registryLoaded = true;
  }

  /**
   * Flush any pending registry saves on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    // Clear timer BEFORE flushing to prevent race conditions
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
      this.saveDebounceTimer = null;
    }

    // Force flush any pending changes
    if (this.registryDirty) {
      this.registryDirty = false;
      this.pendingSaves = 0;
      await this.saveRegistry();
    }
  }

  /**
   * Configure cache behavior
   */
  setConfig(config: CacheConfig): void {
    this.config = {
      ...this.config,
      ...config,
      models: {
        ...this.config.models,
        ...(config.models || {}),
      },
    };
    this.logger.log('Cache configuration updated');
  }

  /**
   * Create a proxy for a Prisma model with caching capabilities
   */
  createProxy<T extends PrismaModel>(model: T): ProxyMethods<T> {
    const modelDelegate = this.prismaClient[model] as PrismaModelDelegate;
    const proxy = {} as ProxyMethods<T>;

    // Add cacheable methods
    for (const method of CACHEABLE_METHODS) {
      if (typeof modelDelegate[method] === 'function') {
        (proxy as Record<string, unknown>)[method] = this.createCacheableMethod(
          model,
          method,
          modelDelegate,
        );
      }
    }

    // Add mutation methods
    for (const method of MUTATION_METHODS) {
      if (typeof modelDelegate[method] === 'function') {
        (proxy as Record<string, unknown>)[method] = this.createMutationMethod(
          model,
          method,
          modelDelegate,
        );
      }
    }

    return proxy;
  }

  /**
   * Create a function that handles cacheable methods
   */
  private createCacheableMethod<
    T extends PrismaModel,
    M extends CacheableMethod,
  >(
    model: T,
    methodName: M,
    delegate: PrismaModelDelegate,
  ): (args?: CacheEntryArgs, ttl?: number) => Promise<unknown> {
    return async (args: CacheEntryArgs = {}, ttl?: number): Promise<unknown> => {
      // Skip cache if method is excluded
      const modelName = model as string;
      if (
        this.config.excludeGlobally?.includes(methodName) ||
        this.config.models?.[modelName]?.excludeOperations?.includes(methodName)
      ) {
        const method = delegate[methodName] as (
          args: CacheEntryArgs,
        ) => Promise<unknown>;
        return await method(args);
      }

      const effectiveTtl =
        ttl ||
        this.config.models?.[modelName]?.ttl ||
        this.config.ttl ||
        this.DEFAULT_TTL;

      const cacheKey = this.generateCacheKey(modelName, methodName, args);

      // Defensive cache read with fallback to database on error
      let cachedResult: unknown;
      try {
        cachedResult = await this.cacheManager.get(cacheKey);
        if (cachedResult !== undefined && cachedResult !== null) {
          this.logger.debug(`Cache hit for ${modelName}.${methodName}`);
          return cachedResult;
        }
      } catch (error) {
        this.logger.warn(
          `Cache read failed for ${modelName}.${methodName}, falling back to database`,
          error,
        );
        // Fall through to database query
      }

      // Cache miss or error - execute query
      this.logger.debug(`Cache miss for ${modelName}.${methodName}`);
      const method = delegate[methodName] as (
        args: CacheEntryArgs,
      ) => Promise<unknown>;
      const result = await method(args);

      // Only cache if we have results (but handle empty arrays and valid falsy values)
      if (result !== null && result !== undefined) {
        // Defensive cache write - don't fail query if cache write fails
        try {
          await Promise.all([
            this.cacheManager.set(cacheKey, result, effectiveTtl),
            this.registerCacheKeyOptimized(cacheKey, modelName, args),
          ]);
        } catch (error) {
          this.logger.error(
            `Failed to cache result for ${modelName}.${methodName}`,
            error,
          );
          // Don't rethrow - cache write failure shouldn't break the query
        }
      }

      return result;
    };
  }

  /**
   * Create a function that handles mutation methods
   */
  private createMutationMethod<T extends PrismaModel, M extends MutationMethod>(
    model: T,
    methodName: M,
    delegate: PrismaModelDelegate,
  ): (
    args?: CacheEntryArgs,
    forceInvalidateModels?: ForceInvalidateModel[],
  ) => Promise<unknown> {
    return async (
      args: CacheEntryArgs = {},
      forceInvalidateModels: ForceInvalidateModel[] = [],
    ): Promise<unknown> => {
      // Execute mutation
      const method = delegate[methodName] as (
        args: CacheEntryArgs,
      ) => Promise<unknown>;
      const result = await method(args);

      // Invalidate cache for this model
      await this.invalidateCacheOptimized(
        model as string,
        args,
        forceInvalidateModels,
      );

      return result;
    };
  }

  /**
   * Invalidate cache for a specific model (public API - unchanged)
   * Can be selective based on the provided args
   */
  async invalidateCache(
    model: string,
    args?: CacheEntryArgs,
    forceInvalidateModels?: ForceInvalidateModel[],
  ): Promise<void> {
    return this.invalidateCacheOptimized(model, args, forceInvalidateModels);
  }

  /**
   * Optimized invalidation - single pass, no redundant registry loads
   */
  private async invalidateCacheOptimized(
    model: string,
    args?: CacheEntryArgs,
    forceInvalidateModels?: ForceInvalidateModel[],
  ): Promise<void> {
    // Ensure registry is loaded once
    await this.ensureRegistryLoaded();

    const keysToInvalidate = new Set<string>();

    const hasFilterCriteria =
      args?.where &&
      typeof args.where === 'object' &&
      Object.keys(args.where as object).length > 0;

    if (hasFilterCriteria) {
      // Selective invalidation based on where clause
      const relatedKeys = this.findRelatedCacheKeys(model, args);
      relatedKeys.forEach((key) => keysToInvalidate.add(key));
    } else {
      // Full model invalidation - collect all keys for this model
      for (const [key, entry] of this.cacheKeysRegistry.entries()) {
        if (entry.model === model) {
          keysToInvalidate.add(key);
        }
      }
    }

    // Always invalidate findMany for this model (list queries affected by any change)
    for (const [key, entry] of this.cacheKeysRegistry.entries()) {
      if (entry.model === model && key.includes('findMany')) {
        keysToInvalidate.add(key);
      }
    }

    // Handle force invalidations
    if (forceInvalidateModels && forceInvalidateModels.length > 0) {
      for (const item of forceInvalidateModels) {
        for (const method of CACHEABLE_METHODS) {
          const cacheKey = this.generateCacheKey(
            item.model,
            method,
            item.args || {},
          );
          keysToInvalidate.add(cacheKey);
        }
      }
    }

    // Single bulk delete + single registry update
    if (keysToInvalidate.size > 0) {
      this.logger.debug(
        `Invalidating ${keysToInvalidate.size} cache keys for ${model}`,
      );

      const keysArray = Array.from(keysToInvalidate);
      await this.bulkDelete(keysArray);

      // Update registry in-memory
      for (const key of keysArray) {
        this.cacheKeysRegistry.delete(key);
      }

      // Debounced save
      this.markRegistryDirty();
    }
  }

  /**
   * Invalidate all cache entries for a specific model (public API - unchanged)
   */
  async invalidateModelCache(model: string): Promise<void> {
    await this.ensureRegistryLoaded();

    const keysToInvalidate = Array.from(this.cacheKeysRegistry.entries())
      .filter(([_, value]) => value.model === model)
      .map(([key]) => key);

    if (keysToInvalidate.length > 0) {
      this.logger.debug(
        `Invalidating all ${keysToInvalidate.length} cache keys for model ${model}`,
      );
      await this.bulkDelete(keysToInvalidate);

      for (const key of keysToInvalidate) {
        this.cacheKeysRegistry.delete(key);
      }
      this.markRegistryDirty();
    }
  }

  /**
   * Invalidate findMany cache for a model (public API - unchanged)
   */
  async invalidateFindManyCache(model: string): Promise<void> {
    await this.ensureRegistryLoaded();

    const findManyKeysToInvalidate = Array.from(
      this.cacheKeysRegistry.entries(),
    )
      .filter(([key, value]) => value.model === model && key.includes('findMany'))
      .map(([key]) => key);

    if (findManyKeysToInvalidate.length > 0) {
      await this.bulkDelete(findManyKeysToInvalidate);
      for (const key of findManyKeysToInvalidate) {
        this.cacheKeysRegistry.delete(key);
      }
      this.markRegistryDirty();
    }
  }

  /**
   * Find cache keys that might be affected by a mutation
   */
  private findRelatedCacheKeys(model: string, args: CacheEntryArgs): string[] {
    const keysToInvalidate: string[] = [];
    // Look through all registered cache keys for this model
    for (const [key, entry] of this.cacheKeysRegistry.entries()) {
      if (entry.model !== model) continue;

      // Check if the cache entry might be affected by this mutation
      if (this.mightBeAffectedBy(entry.args, args)) {
        keysToInvalidate.push(key);
      }
    }

    return keysToInvalidate;
  }

  /**
   * Determine if a cached query might be affected by a mutation
   * Delegates to InvalidationStrategyChain for modular, testable logic
   */
  private mightBeAffectedBy(
    cachedArgs: CacheEntryArgs,
    mutationArgs: CacheEntryArgs,
  ): boolean {
    return this.invalidationChain.shouldInvalidate(cachedArgs, mutationArgs);
  }

  /**
   * Generate a unique cache key for a query
   */
  private generateCacheKey(
    model: string,
    method: string,
    args: CacheEntryArgs,
  ): string {
    // Use hash directly on args - object-code handles serialization
    const hashValue = hash(args).toString();
    return `prisma:${model}:${method}:${hashValue}`;
  }

  /**
   * Bulk delete cache keys (cache-manager doesn't have mdel)
   */
  private async bulkDelete(keys: string[]): Promise<void> {
    if (keys.length === 0) return;
    await Promise.all(keys.map((key) => this.cacheManager.del(key)));
  }

  /**
   * Ensure registry is loaded (load once pattern with concurrency protection)
   */
  private async ensureRegistryLoaded(): Promise<void> {
    if (this.registryLoaded) {
      return;
    }

    // If already loading, wait for that load to complete
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    // Start loading and cache the promise to prevent concurrent loads
    this.loadingPromise = this.loadRegistry()
      .then(() => {
        this.registryLoaded = true;
        this.loadingPromise = null;
      })
      .catch((error) => {
        this.loadingPromise = null;
        throw error;
      });

    return this.loadingPromise;
  }

  /**
   * Register cache key with batched persistence (optimized)
   */
  private async registerCacheKeyOptimized(
    key: string,
    model: string,
    args: CacheEntryArgs,
  ): Promise<void> {
    try {
      this.cacheKeysRegistry.set(key, { model, args });

      // Enforce max size to prevent unbounded growth
      const maxSize = this.config.registryMaxSize || this.REGISTRY_MAX_SIZE;
      if (this.cacheKeysRegistry.size > maxSize) {
        await this.pruneRegistry();
      }

      this.pendingSaves++;

      // Batch saves every N operations
      const batchSize =
        this.config.registryBatchSize || this.REGISTRY_BATCH_SIZE;
      if (this.pendingSaves >= batchSize) {
        await this.flushRegistry();
      } else {
        this.markRegistryDirty();
      }
    } catch (error) {
      this.logger.error(
        `Failed to register cache key ${key} for model ${model}`,
        error,
      );
      // Don't rethrow - background operation shouldn't break main query flow
    }
  }

  /**
   * Mark registry as dirty and schedule debounced save
   */
  private markRegistryDirty(): void {
    this.registryDirty = true;

    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }

    const debounceMs =
      this.config.registryDebounceMs || this.REGISTRY_DEBOUNCE_MS;

    // Use void to handle async in setTimeout without unhandled promise rejection
    this.saveDebounceTimer = setTimeout(() => {
      void (async () => {
        try {
          if (this.registryDirty && this.saveDebounceTimer !== null) {
            await this.flushRegistry();
          }
        } catch (error) {
          this.logger.error('Failed to flush registry in debounce timer', error);
        }
      })();
    }, debounceMs);
  }

  /**
   * Immediately flush registry to persistent storage
   */
  private async flushRegistry(): Promise<void> {
    if (!this.registryDirty) return;

    // Clear timer first to prevent re-entrance
    const timerToCancel = this.saveDebounceTimer;
    this.saveDebounceTimer = null;
    if (timerToCancel) {
      clearTimeout(timerToCancel);
    }

    this.registryDirty = false;
    this.pendingSaves = 0;

    await this.saveRegistry();
  }

  /**
   * Prune registry when max size exceeded (FIFO eviction)
   */
  private async pruneRegistry(): Promise<void> {
    const maxSize = this.config.registryMaxSize || this.REGISTRY_MAX_SIZE;
    const targetSize = Math.floor(maxSize * 0.8);
    const entriesToRemove = this.cacheKeysRegistry.size - targetSize;

    if (entriesToRemove <= 0) return;

    this.logger.warn(
      `Registry size exceeded ${this.cacheKeysRegistry.size}. Pruning ${entriesToRemove} entries.`,
    );

    // FIFO pruning - remove oldest entries
    const keysToRemove = Array.from(this.cacheKeysRegistry.keys()).slice(
      0,
      entriesToRemove,
    );

    for (const key of keysToRemove) {
      this.cacheKeysRegistry.delete(key);
    }

    // Also remove from cache to maintain consistency
    await this.bulkDelete(keysToRemove);
  }

  /**
   * Load the cache registry from the cache store
   */
  private async loadRegistry(): Promise<void> {
    try {
      const registryData = await this.cacheManager.get<
        Record<string, CacheEntryData>
      >(this.REGISTRY_KEY);
      if (registryData && typeof registryData === 'object') {
        this.cacheKeysRegistry = new Map(Object.entries(registryData));
        this.logger.debug(
          `Loaded ${this.cacheKeysRegistry.size} cache registry entries`,
        );
      } else {
        this.cacheKeysRegistry = new Map();
        this.logger.debug(
          'No cache registry found, starting with empty registry',
        );
      }
    } catch (error) {
      this.logger.error('Failed to load cache registry', error);
      this.cacheKeysRegistry = new Map();
    }
  }

  /**
   * Save the cache registry to the cache store
   */
  private async saveRegistry(): Promise<void> {
    try {
      // Convert Map to a plain object for storage
      const registryObject = Object.fromEntries(
        this.cacheKeysRegistry.entries(),
      );

      // Use a longer TTL for the registry than regular cache entries
      const registryTtl = this.config.ttl
        ? this.config.ttl * 2
        : this.DEFAULT_TTL * 2;

      await this.cacheManager.set(
        this.REGISTRY_KEY,
        registryObject,
        registryTtl,
      );
      this.logger.debug(
        `Saved ${this.cacheKeysRegistry.size} cache registry entries`,
      );
    } catch (error) {
      this.logger.error('Failed to save cache registry', error);
    }
  }
}
