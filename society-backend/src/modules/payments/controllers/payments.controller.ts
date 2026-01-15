import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { User } from '../../../auth/decorators/user.decorator';
import { PaymentsService } from '../services/payments.service';
import { CreateBookingPaymentDto, RefundRequestDto } from '../dto/payment.dto';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  /**
   * Create payment for a booking
   */
  @Post('booking')
  async createBookingPayment(
    @User() userId: string,
    @Body() dto: CreateBookingPaymentDto,
  ) {
    return this.paymentsService.createBookingPayment(userId, dto);
  }

  /**
   * Get payment history
   */
  @Get('history')
  async getPaymentHistory(
    @User() userId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.paymentsService.getPaymentHistory(
      userId,
      limit ? parseInt(limit) : 20,
      offset ? parseInt(offset) : 0,
    );
  }

  /**
   * Get payment by ID
   */
  @Get(':id')
  async getPayment(@User() userId: string, @Param('id') id: string) {
    return this.paymentsService.getPaymentById(userId, id);
  }

  /**
   * Request refund for a payment
   */
  @Post(':id/refund')
  async requestRefund(
    @User() userId: string,
    @Param('id') id: string,
    @Body() dto: RefundRequestDto,
  ) {
    return this.paymentsService.requestRefund(userId, id, dto);
  }
}
