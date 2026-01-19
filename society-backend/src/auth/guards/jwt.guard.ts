import { UserRole, UserStatus } from '@generated/client';
import { ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthGuard } from '@nestjs/passport';
import { createHash } from 'crypto';
import { CacheService } from '../../modules/cache/cache.service';
import { PrismaService } from '../../prisma/prisma.service';

type CachedUser = {
  id: string;
  zaloId: string;
  role: UserRole;
  status: UserStatus;
};

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly CACHE_PREFIX = 'auth:session:';

  constructor(
    private prisma: PrismaService,
    private cacheService: CacheService,
    private jwtService: JwtService,
  ) {
    super();


  }

  /**
   * Hash token for cache key (don't store full token in Redis)
   */
  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex').substring(0, 32);
  }

  /**
   * Invalidate cached session for a token (call on logout)
   */
  async invalidateSession(token: string): Promise<void> {
    const cacheKey = `${this.CACHE_PREFIX}${this.hashToken(token)}`;
    await this.cacheService.del(cacheKey);
    this.logger.debug('Session cache invalidated');
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      return false;
    }

    try {
      const cacheKey = `${this.CACHE_PREFIX}${this.hashToken(token)}`;

      // 1. Try to get user from cache first
      const cachedUser = await this.cacheService.get<CachedUser>(cacheKey);
      if (cachedUser) {
        // Verify cached user is still valid (not suspended/deleted)
        if (cachedUser.status === UserStatus.SUSPENDED) {
          throw new UnauthorizedException('Your account has been suspended. Please contact support.');
        }
        if (cachedUser.status === UserStatus.DELETED) {
          throw new UnauthorizedException('This account has been deleted.');
        }

        request.user = {
          id: cachedUser.id,
          zaloId: cachedUser.zaloId,
          sub: cachedUser.id,
          role: cachedUser.role,
          status: cachedUser.status,
        };
        this.logger.debug(`Cache hit for user: ${cachedUser.zaloId}`);
        return true;
      }

      // 2. Cache miss - try Society JWT first (Zalo auth)
      let dbUser = await this.verifySocietyJwt(token);


      if (!dbUser) {
        return false;
      }

      // 4. Check if user account is active
      if (dbUser.status === UserStatus.SUSPENDED) {
        throw new UnauthorizedException('Your account has been suspended. Please contact support.');
      }

      if (dbUser.status === UserStatus.DELETED) {
        throw new UnauthorizedException('This account has been deleted.');
      }

      // 5. Cache the verified user data
      const userToCache: CachedUser = {
        id: dbUser.id,
        zaloId: dbUser.zaloId,
        role: dbUser.role,
        status: dbUser.status,
      };
      await this.cacheService.set(cacheKey, userToCache, this.CACHE_TTL);
      this.logger.debug(`Cached session for user: ${dbUser.zaloId}`);
      this.logger.debug(`User: ${JSON.stringify(dbUser)}`);

      // 6. Add user to request
      request.user = {
        id: dbUser.id,
        zaloId: dbUser.zaloId,
        sub: dbUser.id,
        role: dbUser.role,
        status: dbUser.status,
      };
      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error('JWT Guard error:', error);
      return false;
    }
  }

  /**
   * Verify Society-issued JWT token (from Zalo auth)
   */
  private async verifySocietyJwt(token: string): Promise<{ id: string; zaloId: string; role: UserRole; status: UserStatus } | null> {
    try {
      const payload = this.jwtService.verify(token);

      if (!payload.sub) {
        return null;
      }

      const dbUser = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!dbUser) {
        return null;
      }

      return {
        id: dbUser.id,
        zaloId: dbUser.zaloId,
        role: dbUser.role,
        status: dbUser.status,
      };
    } catch {
      // Token is not a valid Society JWT, return null to try Supabase
      return null;
    }
  }



  private extractToken(request: { headers: { authorization?: string } }): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
