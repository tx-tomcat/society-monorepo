import { Global, Module } from '@nestjs/common';
import { CacheService } from './cache.service';
import { CachePatternsService } from './cache-patterns.service';

@Global()
@Module({
  providers: [CacheService, CachePatternsService],
  exports: [CacheService, CachePatternsService],
})
export class CacheModule {} 