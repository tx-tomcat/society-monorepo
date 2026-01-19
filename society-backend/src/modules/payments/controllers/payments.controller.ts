import { CurrentUser, CurrentUserData } from '@/common/decorators/current-user.decorator';
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
  async requestRefund(
    @CurrentUser() user: CurrentUserData,
    @Param('id') id: string,
    @Body() dto: RefundRequestDto,
  ) {
    return this.paymentsService.requestRefund(user.id, id, dto);
  }
}
