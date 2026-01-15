import {
    BadRequestException,
    Injectable,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@generated/client';
import { RateLimiterService } from '../modules/security/services/rate-limiter.service';
import { CaptchaService } from '../modules/security/services/captcha.service';

export interface AuthUser {
  id: string;
  email: string;
  supabaseId: string;
  role: UserRole;
  isNewUser: boolean;
}

@Injectable()
export class AuthService {
  private supabase: SupabaseClient;
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private rateLimiter: RateLimiterService,
    private captchaService: CaptchaService,
  ) {
    const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
    const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration is missing');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
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
      this.logger.warn(`OTP request rate limit exceeded for ${normalizedEmail}`);
      throw new BadRequestException({
        message: rateLimitCheck.message,
        error: 'RATE_LIMIT_EXCEEDED',
        retryAfter: rateLimitCheck.delaySeconds,
        resetAt: rateLimitCheck.resetAt,
      });
    }

    const redirectUrl = `${this.configService.get('CLIENT_URL')}/auth/callback`;

    const { error } = await this.supabase.auth.signInWithOtp({
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

    this.logger.log(`Magic link sent to ${normalizedEmail}`);

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
      this.logger.warn(`OTP verification rate limit exceeded for ${normalizedEmail}`);
      throw new BadRequestException({
        message: rateLimitCheck.message,
        error: rateLimitCheck.lockedUntil ? 'ACCOUNT_LOCKED' : 'RATE_LIMIT_EXCEEDED',
        retryAfter: rateLimitCheck.delaySeconds,
        resetAt: rateLimitCheck.resetAt,
        lockedUntil: rateLimitCheck.lockedUntil,
      });
    }

    const { data, error } = await this.supabase.auth.verifyOtp({
      email: normalizedEmail,
      token,
      type: 'email',
    });

    if (error || !data.user) {
      // Record failed attempt with progressive delay
      const failureResult = await this.rateLimiter.recordOtpFailure(normalizedEmail);

      // Also record for brute force detection (CAPTCHA trigger)
      const bruteForceResult = await this.captchaService.recordFailedAttempt(normalizedEmail);

      this.logger.error(`OTP verification error for ${normalizedEmail}: ${error?.message}`);

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
    const { data, error } = await this.supabase.auth.exchangeCodeForSession(code);

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
      const { data: { user }, error } = await this.supabase.auth.getUser(token);

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
    const { data, error } = await this.supabase.auth.refreshSession({
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
    const { error } = await this.supabase.auth.admin.signOut(token);

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

      // Create new user in our database
      dbUser = await this.prisma.user.create({
        data: {
          email,
          fullName: '', // Will be set during onboarding
          role,
          status: 'PENDING',
        },
        include: {
          companionProfile: true,
          hirerProfile: true,
        },
      });

      this.logger.log(`New user created: ${email} (${role})`);
    }

    // Determine if user has completed their profile
    const hasProfile = dbUser.role === UserRole.COMPANION
      ? !!dbUser.companionProfile
      : !!dbUser.hirerProfile;

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
