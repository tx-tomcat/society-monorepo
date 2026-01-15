import {
  Body,
  Controller,
  Post,
  Get,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  Headers,
  Ip,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  SendMagicLinkDto,
  VerifyOtpDto,
  ExchangeCodeDto,
  RefreshTokenDto,
  CheckOtpStatusDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt.guard';
import { RateLimitGuard } from '../modules/security/guards/rate-limit.guard';
import { RateLimit } from '../modules/security/decorators/rate-limit.decorator';
import { RateLimitType } from '../modules/security/dto/security.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * Send magic link to email
   * POST /auth/magic-link
   * Rate limited: 5 requests per 5 minutes per IP
   * CAPTCHA required after 3 failed attempts
   */
  @Post('magic-link')
  @UseGuards(RateLimitGuard)
  @RateLimit(RateLimitType.LOGIN, (ctx) => ctx.switchToHttp().getRequest().ip)
  @HttpCode(HttpStatus.OK)
  async sendMagicLink(@Body() dto: SendMagicLinkDto, @Ip() ip: string) {
    return this.authService.sendMagicLink(dto.email, dto.userType, dto.captchaToken, ip);
  }

  /**
   * Verify OTP code (for mobile apps)
   * POST /auth/verify-otp
   * Rate limited: 5 requests per 5 minutes per IP
   * CAPTCHA required after 3 failed attempts
   */
  @Post('verify-otp')
  @UseGuards(RateLimitGuard)
  @RateLimit(RateLimitType.LOGIN, (ctx) => ctx.switchToHttp().getRequest().ip)
  @HttpCode(HttpStatus.OK)
  async verifyOtp(@Body() dto: VerifyOtpDto, @Ip() ip: string) {
    return this.authService.verifyOtp(dto.email, dto.token, dto.captchaToken, ip);
  }

  /**
   * Exchange auth code for session (callback from magic link)
   * POST /auth/callback
   * Rate limited: 5 requests per 5 minutes per IP
   */
  @Post('callback')
  @UseGuards(RateLimitGuard)
  @RateLimit(RateLimitType.LOGIN, (ctx) => ctx.switchToHttp().getRequest().ip)
  @HttpCode(HttpStatus.OK)
  async exchangeCode(@Body() dto: ExchangeCodeDto) {
    return this.authService.exchangeCodeForSession(dto.code);
  }

  /**
   * Refresh access token
   * POST /auth/refresh
   * Rate limited: 5 requests per 5 minutes per IP
   */
  @Post('refresh')
  @UseGuards(RateLimitGuard)
  @RateLimit(RateLimitType.LOGIN, (ctx) => ctx.switchToHttp().getRequest().ip)
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshSession(dto.refreshToken);
  }

  /**
   * Resend magic link
   * POST /auth/resend
   * Rate limited: 5 requests per 5 minutes per IP
   */
  @Post('resend')
  @UseGuards(RateLimitGuard)
  @RateLimit(RateLimitType.LOGIN, (ctx) => ctx.switchToHttp().getRequest().ip)
  @HttpCode(HttpStatus.OK)
  async resendMagicLink(@Body() dto: SendMagicLinkDto) {
    return this.authService.resendMagicLink(dto.email);
  }

  /**
   * Sign out (invalidate session)
   * POST /auth/signout
   */
  @Post('signout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async signOut(@Headers('authorization') auth: string) {
    const token = auth?.replace('Bearer ', '');
    return this.authService.signOut(token);
  }

  /**
   * Get current user profile
   * GET /auth/me
   */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    return {
      user: req.user,
    };
  }

  /**
   * Validate token (for other services)
   * GET /auth/validate
   */
  @Get('validate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async validateToken(@Request() req) {
    return {
      valid: true,
      user: req.user,
    };
  }

  /**
   * Get OTP status for an email
   * POST /auth/otp-status
   * Returns rate limit info, failure count, lockout status, and CAPTCHA status
   * Useful for UI to show remaining attempts
   */
  @Post('otp-status')
  @HttpCode(HttpStatus.OK)
  async getOtpStatus(@Body() dto: CheckOtpStatusDto) {
    return this.authService.getOtpStatus(dto.email);
  }

  /**
   * Get CAPTCHA configuration
   * GET /auth/captcha-config
   * Returns provider, site key, and whether CAPTCHA is enabled
   */
  @Get('captcha-config')
  getCaptchaConfig() {
    return this.authService.getCaptchaConfig();
  }
}
