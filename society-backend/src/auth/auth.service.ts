import { UserRole, UserStatus } from '@generated/client';
import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import axios from 'axios';
import { StringUtils } from '../common/utils/string.utils';
import { CaptchaService } from '../modules/security/services/captcha.service';
import { RateLimiterService } from '../modules/security/services/rate-limiter.service';
import { PrismaService } from '../prisma/prisma.service';

export interface AuthUser {
  id: string;
  email: string;
  supabaseId: string;
  role: UserRole;
  isNewUser: boolean;
}

export interface ZaloUserInfo {
  id: string;
  name: string;
  picture?: {
    data?: {
      url?: string;
    };
  };
}

export interface ZaloAuthResponse {
  user: {
    id: string;
    email: string | null;
    phone: string | null;
    fullName: string;
    avatarUrl: string | null;
    role: UserRole | null;
    status: 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DELETED';
    isVerified: boolean;
    trustScore: number;
  };
  token: string;
  refreshToken: string;
  isNewUser: boolean;
  /** Whether user has completed their profile (companion or hirer profile exists) */
  hasProfile: boolean;
}

@Injectable()
export class AuthService {
  private supabase: SupabaseClient | null = null;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private rateLimiter: RateLimiterService,
    private captchaService: CaptchaService,
    private jwtService: JwtService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_KEY');

    // Supabase is optional when using Zalo-only auth
    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.logger.log('Supabase client initialized (legacy auth support)');
    } else {
      this.logger.warn('Supabase not configured - only Zalo auth available');
    }
  }

  /**
   * Check if Supabase is available (for legacy email auth)
   */
  private ensureSupabaseAvailable(): SupabaseClient {
    if (!this.supabase) {
      throw new BadRequestException('Email authentication is not available. Please use Zalo login.');
    }
    return this.supabase;
  }

  /**
   * Send Magic Link to user's email
   * This is the primary authentication method
   * Includes brute force protection with CAPTCHA after threshold
   */
  async sendMagicLink(
    email: string,
    userType?: 'hirer' | 'companion',
    captchaToken?: string,
    remoteIp?: string,
  ) {
    const normalizedEmail = email.toLowerCase().trim();

    // Validate email format
    if (!this.isValidEmail(normalizedEmail)) {
      throw new BadRequestException('Invalid email address');
    }

    // Check if CAPTCHA is required due to brute force detection
    const captchaValidation = await this.captchaService.validateCaptchaIfRequired(
      normalizedEmail,
      captchaToken,
      remoteIp,
    );

    if (!captchaValidation.valid) {
      const captchaConfig = this.captchaService.getCaptchaConfig();
      throw new BadRequestException({
        message: captchaValidation.message,
        error: 'CAPTCHA_REQUIRED',
        captchaRequired: true,
        captchaProvider: captchaConfig.provider,
        captchaSiteKey: captchaConfig.siteKey,
      });
    }

    // Check OTP request rate limit (3 requests per 5 minutes)
    const rateLimitCheck = await this.rateLimiter.checkOtpRequestLimit(normalizedEmail);
    if (!rateLimitCheck.allowed) {
      this.logger.warn(`OTP request rate limit exceeded for ${StringUtils.maskEmail(normalizedEmail)}`);
      throw new BadRequestException({
        message: rateLimitCheck.message,
        error: 'RATE_LIMIT_EXCEEDED',
        retryAfter: rateLimitCheck.delaySeconds,
        resetAt: rateLimitCheck.resetAt,
      });
    }

    const redirectUrl = `${this.configService.get('CLIENT_URL')}/auth/callback`;

    const { error } = await this.ensureSupabaseAvailable().auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          user_type: userType,
        },
      },
    });

    if (error) {
      this.logger.error(`Magic link error: ${error.message}`);
      throw new BadRequestException('Failed to send magic link. Please try again.');
    }

    // Record successful OTP request
    await this.rateLimiter.recordOtpRequest(normalizedEmail);

    this.logger.log(`Magic link sent to ${StringUtils.maskEmail(normalizedEmail)}`);

    return {
      success: true,
      message: 'Check your email for the magic link',
      email: normalizedEmail,
      remaining: rateLimitCheck.remaining - 1,
    };
  }

  /**
   * Verify OTP token (for mobile apps that use code instead of link)
   * Includes progressive delays after failed attempts and CAPTCHA protection
   */
  async verifyOtp(
    email: string,
    token: string,
    captchaToken?: string,
    remoteIp?: string,
  ) {
    const normalizedEmail = email.toLowerCase().trim();

    // Check if CAPTCHA is required due to brute force detection
    const captchaValidation = await this.captchaService.validateCaptchaIfRequired(
      normalizedEmail,
      captchaToken,
      remoteIp,
    );

    if (!captchaValidation.valid) {
      const captchaConfig = this.captchaService.getCaptchaConfig();
      throw new BadRequestException({
        message: captchaValidation.message,
        error: 'CAPTCHA_REQUIRED',
        captchaRequired: true,
        captchaProvider: captchaConfig.provider,
        captchaSiteKey: captchaConfig.siteKey,
      });
    }

    // Check OTP verification rate limit with progressive delays
    const rateLimitCheck = await this.rateLimiter.checkOtpVerifyLimit(normalizedEmail);
    if (!rateLimitCheck.allowed) {
      this.logger.warn(`OTP verification rate limit exceeded for ${StringUtils.maskEmail(normalizedEmail)}`);
      throw new BadRequestException({
        message: rateLimitCheck.message,
        error: rateLimitCheck.lockedUntil ? 'ACCOUNT_LOCKED' : 'RATE_LIMIT_EXCEEDED',
        retryAfter: rateLimitCheck.delaySeconds,
        resetAt: rateLimitCheck.resetAt,
        lockedUntil: rateLimitCheck.lockedUntil,
      });
    }

    const { data, error } = await this.ensureSupabaseAvailable().auth.verifyOtp({
      email: normalizedEmail,
      token,
      type: 'email',
    });

    if (error || !data.user) {
      // Record failed attempt with progressive delay
      const failureResult = await this.rateLimiter.recordOtpFailure(normalizedEmail);

      // Also record for brute force detection (CAPTCHA trigger)
      const bruteForceResult = await this.captchaService.recordFailedAttempt(normalizedEmail);

      this.logger.error(`OTP verification error for ${StringUtils.maskEmail(normalizedEmail)}: ${error?.message}`);

      // Provide informative error response
      const captchaConfig = this.captchaService.getCaptchaConfig();
      const errorResponse: {
        message: string;
        error: string;
        failureCount: number;
        nextAttemptDelay: number;
        lockedUntil?: Date;
        captchaRequired?: boolean;
        captchaProvider?: string;
        captchaSiteKey?: string;
      } = {
        message: 'Invalid or expired code',
        error: 'INVALID_OTP',
        failureCount: failureResult.failureCount,
        nextAttemptDelay: failureResult.nextAttemptDelay,
      };

      // Check if CAPTCHA will be required for next attempt
      if (bruteForceResult.captchaRequired) {
        errorResponse.captchaRequired = true;
        errorResponse.captchaProvider = captchaConfig.provider;
        errorResponse.captchaSiteKey = captchaConfig.siteKey;
        errorResponse.message = 'Invalid code. CAPTCHA verification will be required for next attempt.';
      }

      if (failureResult.lockedUntil) {
        errorResponse.message = `Account temporarily locked due to too many failed attempts. Try again after ${failureResult.lockedUntil.toISOString()}`;
        errorResponse.error = 'ACCOUNT_LOCKED';
        errorResponse.lockedUntil = failureResult.lockedUntil;
      } else if (failureResult.nextAttemptDelay > 0 && !bruteForceResult.captchaRequired) {
        errorResponse.message = `Invalid or expired code. Please wait ${failureResult.nextAttemptDelay} seconds before trying again.`;
      }

      throw new UnauthorizedException(errorResponse);
    }

    // Record successful verification - resets failure count and brute force counter
    await this.rateLimiter.recordOtpSuccess(normalizedEmail);
    await this.captchaService.recordSuccessfulAttempt(normalizedEmail);

    return this.handleAuthenticatedUser(data.user, data.session?.access_token);
  }

  /**
   * Exchange auth code for session (callback from magic link)
   */
  async exchangeCodeForSession(code: string) {
    const { data, error } = await this.ensureSupabaseAvailable().auth.exchangeCodeForSession(code);

    if (error || !data.user) {
      this.logger.error(`Code exchange error: ${error?.message}`);
      throw new UnauthorizedException('Invalid or expired link');
    }

    return this.handleAuthenticatedUser(data.user, data.session?.access_token);
  }

  /**
   * Validate access token and return user
   */
  async validateToken(token: string): Promise<AuthUser> {
    try {
      const { data: { user }, error } = await this.ensureSupabaseAvailable().auth.getUser(token);

      if (error || !user) {
        throw new UnauthorizedException('Invalid token');
      }

      // Get user from our database
      const dbUser = await this.prisma.user.findFirst({
        where: {
          email: user.email,
        },
      });

      if (!dbUser) {
        // User authenticated but not in our DB yet
        return {
          id: user.id,
          email: user.email!,
          supabaseId: user.id,
          role: UserRole.HIRER, // Default role for new users
          isNewUser: true,
        };
      }

      return {
        id: dbUser.id,
        email: dbUser.email!,
        supabaseId: user.id,
        role: dbUser.role,
        isNewUser: false,
      };
    } catch (error) {
      this.logger.error('Token validation error:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  /**
   * Refresh session
   */
  async refreshSession(refreshToken: string) {
    const { data, error } = await this.ensureSupabaseAvailable().auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error || !data.session) {
      throw new UnauthorizedException('Failed to refresh session');
    }

    return {
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
      expiresAt: data.session.expires_at,
    };
  }

  /**
   * Sign out user
   */
  async signOut(token: string) {
    // Supabase admin API to revoke session
    const { error } = await this.ensureSupabaseAvailable().auth.admin.signOut(token);

    if (error) {
      this.logger.warn(`Sign out warning: ${error.message}`);
    }

    return { success: true };
  }

  /**
   * Resend magic link (with rate limiting)
   * Uses same rate limits as sendMagicLink
   */
  async resendMagicLink(email: string) {
    return this.sendMagicLink(email);
  }

  /**
   * Get OTP failure status for an email
   * Useful for UI to show remaining attempts, lockout info, and CAPTCHA status
   */
  async getOtpStatus(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const failureStatus = await this.rateLimiter.getOtpFailureStatus(normalizedEmail);
    const requestLimit = await this.rateLimiter.checkOtpRequestLimit(normalizedEmail);
    const verifyLimit = await this.rateLimiter.checkOtpVerifyLimit(normalizedEmail);
    const bruteForceStatus = await this.captchaService.getBruteForceStatus(normalizedEmail);
    const captchaConfig = this.captchaService.getCaptchaConfig();

    return {
      email: normalizedEmail,
      requestsRemaining: requestLimit.remaining,
      requestsResetAt: requestLimit.resetAt,
      verifyAttemptsRemaining: verifyLimit.remaining,
      verifyResetAt: verifyLimit.resetAt,
      failureCount: failureStatus.failureCount,
      isLocked: failureStatus.isLocked,
      lockedUntil: failureStatus.lockedUntil,
      nextAttemptDelay: failureStatus.nextAttemptDelay,
      captcha: {
        required: bruteForceStatus.captchaRequired,
        threshold: bruteForceStatus.threshold,
        failureCount: bruteForceStatus.failureCount,
        provider: captchaConfig.provider,
        siteKey: bruteForceStatus.captchaRequired ? captchaConfig.siteKey : undefined,
      },
    };
  }

  /**
   * Get CAPTCHA configuration for client
   */
  getCaptchaConfig() {
    return this.captchaService.getCaptchaConfig();
  }

  // ============================================
  // Zalo Authentication
  // ============================================

  /**
   * Authenticate with Zalo access token
   * 1. Validate token with Zalo API
   * 2. Get user info from Zalo
   * 3. Create/update user in database
   * 4. Issue Society JWT tokens
   */
  async authenticateWithZalo(
    accessToken: string,
    zaloRefreshToken?: string,
  ): Promise<ZaloAuthResponse> {
    try {
      // 1. Get user info from Zalo API
      const zaloUser = await this.getZaloUserInfo(accessToken);

      if (!zaloUser || !zaloUser.id) {
        throw new UnauthorizedException('Invalid Zalo access token');
      }

      this.logger.log(`Zalo user authenticated: ${zaloUser.id} (${zaloUser.name})`);

      // 2. Find or create user in our database by Zalo ID
      let dbUser = await this.prisma.user.findFirst({
        where: {
          zaloId: zaloUser.id,
        },
        include: {
          companionProfile: true,
          hirerProfile: true,
        },
      });

      const isNewUser = !dbUser;

      if (!dbUser) {
        // Create new user with Zalo info
        dbUser = await this.prisma.user.create({
          data: {
            zaloId: zaloUser.id,
            fullName: zaloUser.name || 'Zalo User',
            avatarUrl: zaloUser.picture?.data?.url,
            status: UserStatus.ACTIVE,
            isVerified: true
          },
          include: {
            companionProfile: true,
            hirerProfile: true,
          },
        });

        this.logger.log(`New user created from Zalo: ${zaloUser.id} (${zaloUser.name || 'unnamed'})`);
      } else {
        // Update avatar if changed
        if (zaloUser.picture?.data?.url && dbUser.avatarUrl !== zaloUser.picture.data.url) {
          await this.prisma.user.update({
            where: { id: dbUser.id },
            data: { avatarUrl: zaloUser.picture.data.url },
          });
        }
      }

      // 3. Generate Society JWT tokens
      const payload = {
        sub: dbUser.id,
        zaloId: zaloUser.id,
        role: dbUser.role,
      };

      const token = this.jwtService.sign(payload);
      const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });

      // 4. Determine if user has completed their profile
      // For COMPANION: requires a companionProfile record
      // For HIRER: requires gender and dateOfBirth (hirerProfile has only optional fields)
      const hasProfile = dbUser.role === UserRole.COMPANION
        ? !!dbUser.companionProfile
        : !!(dbUser.gender && dbUser.dateOfBirth);

      return {
        user: {
          id: dbUser.id,
          email: dbUser.email,
          phone: dbUser.phone,
          fullName: dbUser.fullName,
          avatarUrl: dbUser.avatarUrl,
          role: dbUser.role,
          status: dbUser.status as 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DELETED',
          isVerified: dbUser.isVerified,
          trustScore: dbUser.trustScore || 0,
        },
        token,
        refreshToken,
        isNewUser,
        hasProfile,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(`Zalo authentication error: ${error.message}`, error.stack);
      throw new UnauthorizedException('Zalo authentication failed');
    }
  }

  /**
   * Refresh Society JWT token
   */
  async refreshSocietyToken(refreshToken: string): Promise<{ token: string; refreshToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken);

      // Get updated user data
      const dbUser = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!dbUser) {
        throw new UnauthorizedException('User not found');
      }

      if (dbUser.status === 'SUSPENDED' || dbUser.status === 'DELETED') {
        throw new UnauthorizedException('Account is not active');
      }

      const newPayload = {
        sub: dbUser.id,
        zaloId: dbUser.zaloId,
        role: dbUser.role,
      };

      const newToken = this.jwtService.sign(newPayload);
      const newRefreshToken = this.jwtService.sign(newPayload, { expiresIn: '30d' });

      return {
        token: newToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      this.logger.error(`Token refresh error: ${error.message}`);
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Set user role after initial registration
   * Allows new users to choose hirer or companion role
   */
  async setUserRole(userId: string, role: 'hirer' | 'companion'): Promise<{ id: string; role: UserRole }> {
    const backendRole = role === 'companion' ? UserRole.COMPANION : UserRole.HIRER;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Only allow role change if user doesn't have a role yet or is changing from default HIRER
    if (user.role && user.role !== UserRole.HIRER) {
      throw new BadRequestException('User role cannot be changed once set');
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { role: backendRole },
    });

    this.logger.log(`User ${userId} role set to ${role}`);

    return { id: updatedUser.id, role: updatedUser.role };
  }

  /**
   * Get user info from Zalo API
   */
  private async getZaloUserInfo(accessToken: string): Promise<ZaloUserInfo> {
    try {
      this.logger.log(`Fetching Zalo user info with token: ${StringUtils.maskToken(accessToken)}`);

      const response = await axios.get('https://graph.zalo.me/v2.0/me', {
        params: {
          access_token: accessToken,
          fields: 'id,name,picture',
        },
      });

      this.logger.log(`Zalo API response: ${JSON.stringify(response.data)}`);

      if (response.data.error) {
        this.logger.error(`Zalo API error: ${JSON.stringify(response.data.error)}`);
        throw new UnauthorizedException('Invalid Zalo access token');
      }

      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(`Zalo API request failed: ${error.message}`);
        this.logger.error(`Zalo API response status: ${error.response?.status}`);
        this.logger.error(`Zalo API response data: ${JSON.stringify(error.response?.data)}`);
        if (error.response?.status === 401) {
          throw new UnauthorizedException('Invalid or expired Zalo access token');
        }
      }
      throw error;
    }
  }

  // ============================================
  // Private helpers
  // ============================================

  /**
   * Handle authenticated user - sync with our database
   */
  private async handleAuthenticatedUser(
    supabaseUser: SupabaseUser,
    accessToken?: string,
  ) {
    const email = supabaseUser.email!;
    const userType = supabaseUser.user_metadata?.user_type as 'hirer' | 'companion' | undefined;

    // Check if user exists in our database
    let dbUser = await this.prisma.user.findFirst({
      where: {
        email,
      },
      include: {
        companionProfile: true,
        hirerProfile: true,
      },
    });

    const isNewUser = !dbUser;

    if (!dbUser) {
      // Determine role based on user type (default to HIRER)
      const role = userType === 'companion' ? UserRole.COMPANION : UserRole.HIRER;


      this.logger.log(`New user created: ${StringUtils.maskEmail(email)} (${role})`);
    }

    // Determine if user has completed their profile
    // For COMPANION: requires a companionProfile record
    // For HIRER: requires gender and dateOfBirth (hirerProfile has only optional fields)
    const hasProfile = dbUser.role === UserRole.COMPANION
      ? !!dbUser.companionProfile
      : !!(dbUser.gender && dbUser.dateOfBirth);

    return {
      user: {
        id: dbUser.id,
        email: dbUser.email,
        fullName: dbUser.fullName,
        role: dbUser.role,
        status: dbUser.status,
        isVerified: dbUser.isVerified,
        hasProfile,
      },
      session: {
        accessToken,
        expiresAt: supabaseUser.confirmed_at,
      },
      isNewUser,
    };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
