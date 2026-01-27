import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../auth/guards/jwt.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SendOtpDto, VerifyOtpDto } from './dto/phone-verification.dto';
import { PhoneVerificationService } from './phone-verification.service';

@Controller('phone-verification')
@UseGuards(JwtAuthGuard)
export class PhoneVerificationController {
  constructor(
    private phoneVerificationService: PhoneVerificationService,
  ) {}

  /**
   * Send OTP to phone number via Zalo ZNS
   */
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  async sendOtp(
    @CurrentUser('id') userId: string,
    @Body() dto: SendOtpDto,
  ) {
    return this.phoneVerificationService.sendOtp(userId, dto.phoneNumber);
  }

  /**
   * Verify OTP code
   */
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async verify(
    @CurrentUser('id') userId: string,
    @Body() dto: VerifyOtpDto,
  ) {
    return this.phoneVerificationService.verifyOtp(
      userId,
      dto.phoneNumber,
      dto.otp,
    );
  }

  /**
   * Get current verification status
   */
  @Get('status')
  async getStatus(@CurrentUser('id') userId: string) {
    return this.phoneVerificationService.getStatus(userId);
  }
}
