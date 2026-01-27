import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Headers,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Idempotent } from '@/common/decorators/idempotent.decorator';
import { SepayService } from '@/modules/payments/services/sepay.service';
import { WalletService } from './wallet.service';
import {
  CreateTopupDto,
  CreateBookingPaymentRequestDto,
  GetTransactionsQueryDto,
  TopupResponse,
  BookingPaymentRequestResponse,
  WalletBalanceResponse,
  TransactionsResponse,
  SepayWebhookDto,
} from './dto/wallet.dto';

@Controller('wallet')
export class WalletController {
  private readonly logger = new Logger(WalletController.name);

  constructor(
    private readonly walletService: WalletService,
    private readonly sepayService: SepayService,
  ) {}

  /**
   * Create a topup payment request
   * Supports idempotency via X-Idempotency-Key header
   */
  @Post('topup')
  @UseGuards(JwtAuthGuard)
  @Idempotent({ ttl: 3600 }) // 1 hour TTL for topup requests
  async createTopup(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateTopupDto,
  ): Promise<TopupResponse> {
    return this.walletService.createTopup(userId, dto);
  }

  /**
   * Create a booking payment request (QR payment for booking)
   * Supports idempotency via X-Idempotency-Key header
   */
  @Post('booking-payment')
  @UseGuards(JwtAuthGuard)
  @Idempotent({ ttl: 3600 }) // 1 hour TTL for payment requests
  async createBookingPaymentRequest(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateBookingPaymentRequestDto,
  ): Promise<BookingPaymentRequestResponse> {
    return this.walletService.createBookingPaymentRequest(userId, dto);
  }

  /**
   * Get wallet balance
   */
  @Get('balance')
  @UseGuards(JwtAuthGuard)
  async getBalance(@CurrentUser('id') userId: string): Promise<WalletBalanceResponse> {
    return this.walletService.getBalance(userId);
  }

  /**
   * Get payment request transactions
   */
  @Get('transactions')
  @UseGuards(JwtAuthGuard)
  async getTransactions(
    @CurrentUser('id') userId: string,
    @Query() query: GetTransactionsQueryDto,
  ): Promise<TransactionsResponse> {
    return this.walletService.getTransactions(userId, query);
  }

  /**
   * Check if user can pay a specific amount from wallet
   */
  @Get('can-pay')
  @UseGuards(JwtAuthGuard)
  async canPayFromWallet(
    @CurrentUser('id') userId: string,
    @Query('amount') amount: string,
  ): Promise<{ canPay: boolean; balance: number }> {
    const amountNum = parseInt(amount, 10);
    if (isNaN(amountNum) || amountNum <= 0) {
      return { canPay: false, balance: 0 };
    }
    const canPay = await this.walletService.canPayFromWallet(userId, amountNum);
    const { balance } = await this.walletService.getBalance(userId);
    return { canPay, balance };
  }
}

/**
 * Separate controller for webhooks (no auth guard, uses API key)
 */
@Controller('webhooks')
export class SepayWebhookController {
  private readonly logger = new Logger(SepayWebhookController.name);

  constructor(
    private readonly walletService: WalletService,
    private readonly sepayService: SepayService,
  ) {}

  /**
   * SePay webhook endpoint
   */
  @Post('sepay')
  @HttpCode(HttpStatus.OK)
  async handleSepayWebhook(
    @Headers('authorization') authHeader: string,
    @Body() payload: SepayWebhookDto,
  ): Promise<{ success: boolean }> {
    // Verify API key
    if (!this.sepayService.verifyWebhook(authHeader)) {
      this.logger.warn('Invalid SePay webhook API key');
      throw new UnauthorizedException('Invalid API key');
    }

    this.logger.log(`Received SePay webhook: ${JSON.stringify(payload)}`);

    try {
      await this.walletService.processWebhook(payload);
      return { success: true };
    } catch (error) {
      this.logger.error(`Error processing SePay webhook: ${error.message}`);
      // Still return success to prevent retries for our errors
      return { success: true };
    }
  }
}
