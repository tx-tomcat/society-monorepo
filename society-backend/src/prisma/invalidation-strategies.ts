import { CacheEntryArgs } from './prisma.proxy';

export interface InvalidationStrategy {
  shouldInvalidate(cachedArgs: CacheEntryArgs, mutationArgs: CacheEntryArgs): boolean;
}

function isCompositeKey(obj: unknown): obj is Record<string, unknown> {
  return obj !== null && typeof obj === 'object' && !Array.isArray(obj);
}

class RelationalQueryStrategy implements InvalidationStrategy {
  shouldInvalidate(cachedArgs: CacheEntryArgs): boolean {
    return !!(cachedArgs.include || cachedArgs.select);
  }
}

class BroadQueryStrategy implements InvalidationStrategy {
  shouldInvalidate(cachedArgs: CacheEntryArgs): boolean {
    return Object.keys(cachedArgs.where || {}).length === 0;
  }
}

class CompositeKeyStrategy implements InvalidationStrategy {
  shouldInvalidate(cachedArgs: CacheEntryArgs, mutationArgs: CacheEntryArgs): boolean {
    if (!mutationArgs.where) return false;

    for (const [key, value] of Object.entries(mutationArgs.where)) {
      if (isCompositeKey(value) && !key.startsWith('_')) {
        if (this.matchesCompositeKey(cachedArgs, key, value)) {
          return true;
        }
      }
    }
    return false;
  }

  private matchesCompositeKey(
    cachedArgs: CacheEntryArgs,
    key: string,
    compositeValue: Record<string, unknown>,
  ): boolean {
    const cachedValue = cachedArgs.where?.[key];
    if (cachedValue && isCompositeKey(cachedValue)) {
      for (const [fieldKey, fieldValue] of Object.entries(compositeValue)) {
        if (cachedValue[fieldKey] === fieldValue) {
          return true;
        }
      }
    }

    for (const [fieldKey, fieldValue] of Object.entries(compositeValue)) {
      if (cachedArgs.where?.[fieldKey] === fieldValue) {
        return true;
      }
      if (this.isInArray(cachedArgs.where?.[fieldKey], fieldValue)) {
        return true;
      }
    }

    return false;
  }

  private isInArray(whereValue: unknown, targetValue: unknown): boolean {
    if (!whereValue || typeof whereValue !== 'object') return false;
    const whereObj = whereValue as Record<string, unknown>;
    if (!Array.isArray(whereObj.in)) return false;
    return whereObj.in.includes(targetValue);
  }
}

class SimpleKeyStrategy implements InvalidationStrategy {
  shouldInvalidate(cachedArgs: CacheEntryArgs, mutationArgs: CacheEntryArgs): boolean {
    if (!mutationArgs.where || !cachedArgs.where) return false;

    for (const [key, value] of Object.entries(mutationArgs.where)) {
      if (cachedArgs.where[key] === value) {
        return true;
      }
      if (this.matchesInOperator(cachedArgs.where[key], value)) {
        return true;
      }
    }
    return false;
  }

  private matchesInOperator(whereValue: unknown, targetValue: unknown): boolean {
    if (!whereValue || typeof whereValue !== 'object') return false;
    const whereObj = whereValue as Record<string, unknown>;
    if (!Array.isArray(whereObj.in)) return false;
    return whereObj.in.some(item => item === targetValue);
  }
}

class ReverseLookupStrategy implements InvalidationStrategy {
  shouldInvalidate(cachedArgs: CacheEntryArgs, mutationArgs: CacheEntryArgs): boolean {
    if (!mutationArgs.where || !cachedArgs.where) return false;

    for (const [_, mutationValue] of Object.entries(mutationArgs.where)) {
      if (typeof mutationValue !== 'string' && typeof mutationValue !== 'number') {
        continue;
      }

      for (const cachedValue of Object.values(cachedArgs.where)) {
        if (isCompositeKey(cachedValue) && Object.values(cachedValue).includes(mutationValue)) {
          return true;
        }
      }
    }
    return false;
  }
}

export class InvalidationStrategyChain {
  private strategies: InvalidationStrategy[];

  constructor() {
    this.strategies = [
      new RelationalQueryStrategy(),
      new BroadQueryStrategy(),
      new CompositeKeyStrategy(),
      new SimpleKeyStrategy(),
      new ReverseLookupStrategy(),
    ];
  }

  shouldInvalidate(cachedArgs: CacheEntryArgs, mutationArgs: CacheEntryArgs): boolean {
    if (!cachedArgs.where || !mutationArgs.where) {
      return true;
    }

    return this.strategies.some(strategy =>
      strategy.shouldInvalidate(cachedArgs, mutationArgs)
    );
  }
}
