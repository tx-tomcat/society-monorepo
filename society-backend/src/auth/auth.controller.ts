import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards
} from '@nestjs/common';
import { RateLimit } from '../modules/security/decorators/rate-limit.decorator';
import { RateLimitType } from '../modules/security/dto/security.dto';
import { RateLimitGuard } from '../modules/security/guards/rate-limit.guard';
import { AuthService } from './auth.service';
import {
  CheckOtpStatusDto,
  RefreshTokenDto,
  SetUserRoleDto,
  ZaloAuthDto
} from './dto/auth.dto';
import { JwtAuthGuard } from './guards/jwt.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private jwtAuthGuard: JwtAuthGuard,
  ) { }


  /**
   * Refresh access token
   * POST /auth/refresh
   * Tries Society JWT refresh first (Zalo auth), falls back to Supabase (legacy)
   * Rate limited: 5 requests per 5 minutes per IP
   */
  @Post('refresh')
  @UseGuards(RateLimitGuard)
  @RateLimit(RateLimitType.LOGIN, (ctx) => ctx.switchToHttp().getRequest().ip)
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() dto: RefreshTokenDto) {
    // Try Society JWT refresh first (Zalo auth)
    try {
      return await this.authService.refreshSocietyToken(dto.refreshToken);
    } catch {
      // Fall back to Supabase refresh for legacy users
      return this.authService.refreshSession(dto.refreshToken);
    }
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
    // Invalidate cached session
    await this.jwtAuthGuard.invalidateSession(token);
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

  /**
   * Authenticate with Zalo
   * POST /auth/zalo
   * Validates Zalo access token and issues Society JWT tokens
   * Rate limited: 5 requests per 5 minutes per IP
   */
  @Post('zalo')
  @UseGuards(RateLimitGuard)
  @RateLimit(RateLimitType.LOGIN, (ctx) => ctx.switchToHttp().getRequest().ip)
  @HttpCode(HttpStatus.OK)
  async authenticateWithZalo(@Body() dto: ZaloAuthDto) {
    console.log('Zalo auth request:', dto);
    return this.authService.authenticateWithZalo(dto.accessToken, dto.refreshToken);
  }

  /**
   * Refresh Society JWT token
   * POST /auth/refresh-token
   * Refreshes the Society-issued JWT token
   */
  @Post('refresh-token')
  @UseGuards(RateLimitGuard)
  @RateLimit(RateLimitType.LOGIN, (ctx) => ctx.switchToHttp().getRequest().ip)
  @HttpCode(HttpStatus.OK)
  async refreshSocietyToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshSocietyToken(dto.refreshToken);
  }

  /**
   * Set user role after initial registration
   * POST /auth/set-role
   * Allows new users to choose hirer or companion role
   */
  @Post('set-role')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async setUserRole(@Request() req, @Body() dto: SetUserRoleDto) {
    const userId = req.user.id;
    return this.authService.setUserRole(userId, dto.role);
  }
}
