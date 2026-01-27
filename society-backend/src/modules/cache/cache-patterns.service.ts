import { Injectable, Logger } from '@nestjs/common';
import { CacheService } from './cache.service';

/**
 * Cache TTL constants (in seconds)
 */
export const CACHE_TTL = {
  COMPANION_PROFILE: 900, // 15 minutes
  COMPANION_BROWSE: 300, // 5 minutes
  OCCASIONS: 86400, // 24 hours
  HOLIDAYS: 86400, // 24 hours
  USER_SETTINGS: 900, // 15 minutes
  BOOSTED_COMPANIONS: 300, // 5 minutes
} as const;

/**
 * Cache key patterns
 */
export const CACHE_KEYS = {
  companion: (id: string) => `companion:${id}`,
  companionsBrowse: (hash: string) => `companions:browse:${hash}`,
  occasionsAll: () => 'occasions:all',
  holidays: (year: number) => `holidays:${year}`,
  userSettings: (userId: string) => `settings:${userId}`,
  boostedCompanions: () => 'companions:boosted',
} as const;

/**
 * Service providing common caching patterns with cache-aside strategy
 */
@Injectable()
export class CachePatternsService {
  private readonly logger = new Logger(CachePatternsService.name);

  constructor(private readonly cache: CacheService) {}

  /**
   * Generic cache-aside pattern: try cache first, then fetch from source
   * @param key Cache key
   * @param ttl TTL in seconds
   * @param fetcher Function to fetch data if not in cache
   * @returns Cached or freshly fetched data
   */
  async getOrFetch<T>(
    key: string,
    ttl: number,
    fetcher: () => Promise<T | null>,
  ): Promise<T | null> {
    // Try cache first
    const cached = await this.cache.get<T>(key);
    if (cached !== null) {
      this.logger.debug(`Cache hit: ${key}`);
      return cached;
    }

    // Fetch from source
    this.logger.debug(`Cache miss: ${key}`);
    const data = await fetcher();

    // Cache the result if not null
    if (data !== null) {
      await this.cache.set(key, data, ttl);
    }

    return data;
  }

  /**
   * Invalidate a single cache key
   */
  async invalidate(key: string): Promise<void> {
    await this.cache.del(key);
    this.logger.debug(`Cache invalidated: ${key}`);
  }

  /**
   * Invalidate multiple cache keys
   */
  async invalidateMany(keys: string[]): Promise<void> {
    await Promise.all(keys.map((key) => this.cache.del(key)));
    this.logger.debug(`Cache invalidated: ${keys.join(', ')}`);
  }

  /**
   * Invalidate companion-related caches when a profile is updated
   */
  async invalidateCompanion(companionId: string): Promise<void> {
    await this.invalidateMany([
      CACHE_KEYS.companion(companionId),
      CACHE_KEYS.boostedCompanions(),
      // Note: Browse cache invalidation would require pattern matching
      // which Redis supports but adds complexity. For now, rely on TTL.
    ]);
  }

  /**
   * Invalidate occasions cache (called when admin updates occasions)
   */
  async invalidateOccasions(): Promise<void> {
    await this.invalidate(CACHE_KEYS.occasionsAll());
  }

  /**
   * Invalidate holidays cache for a specific year
   */
  async invalidateHolidays(year: number): Promise<void> {
    await this.invalidate(CACHE_KEYS.holidays(year));
  }

  /**
   * Invalidate user settings cache
   */
  async invalidateUserSettings(userId: string): Promise<void> {
    await this.invalidate(CACHE_KEYS.userSettings(userId));
  }

  /**
   * Check if cache is available
   */
  isAvailable(): boolean {
    return this.cache.isAvailable();
  }
}
