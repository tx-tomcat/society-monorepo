import { CurrentUser, CurrentUserData } from '@/common/decorators/current-user.decorator';
import { RateLimit } from '@/modules/security/decorators/rate-limit.decorator';
import { RateLimitType } from '@/modules/security/dto/security.dto';
import { RateLimitGuard } from '@/modules/security/guards/rate-limit.guard';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/guards/jwt.guard';
import { CreateBookingPaymentDto, RefundRequestDto } from '../dto/payment.dto';
import { PaymentsService } from '../services/payments.service';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) { }

  /**
   * Create payment for a booking
   */
  @Post('booking')
  @UseGuards(RateLimitGuard)
  @RateLimit(RateLimitType.PAYMENT)
  async createBookingPayment(
    @CurrentUser() user: CurrentUserData,
    @Body() dto: CreateBookingPaymentDto,
  ) {
    return this.paymentsService.createBookingPayment(user.id, dto);
  }

  /**
   * Get payment history
   */
  @Get('history')
  async getPaymentHistory(
    @CurrentUser() user: CurrentUserData,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.paymentsService.getPaymentHistory(
      user.id,
      limit ? parseInt(limit) : 20,
      offset ? parseInt(offset) : 0,
    );
  }

  /**
   * Get payment by ID
   */
  @Get(':id')
  async getPayment(@CurrentUser() user: CurrentUserData, @Param('id') id: string) {
    return this.paymentsService.getPaymentById(user.id, id);
  }

  /**
   * Request refund for a payment
   */
  @Post(':id/refund')
  @UseGuards(RateLimitGuard)
  @RateLimit(RateLimitType.PAYMENT)
  async requestRefund(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: RefundRequestDto,
  ) {
    return this.paymentsService.requestRefund(user.id, id, dto);
  }
}
