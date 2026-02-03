import {
  Body,
  Controller,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { Public } from '../../../common/decorators/public.decorator';
import { SepayWebhookDto } from '../../wallet/dto/wallet.dto';
import { WalletService } from '../../wallet/wallet.service';
import { SepayService } from '../services/sepay.service';

@Public()
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly walletService: WalletService,
    private readonly sepayService: SepayService,
  ) {}

  /**
   * SePay bank transfer webhook endpoint
   * Receives incoming payment notifications from SePay
   */
  @Post('bank-transfer')
  @HttpCode(HttpStatus.OK)
  async handleBankTransferWebhook(
    @Headers('authorization') authHeader: string,
    @Body() payload: SepayWebhookDto,
  ): Promise<{ success: boolean; error?: string; retryable?: boolean }> {
    // Verify API key
    if (!this.sepayService.verifyWebhook(authHeader)) {
      this.logger.warn('Invalid SePay webhook API key attempt', {
        receivedKeyPrefix: authHeader?.substring(0, 8),
      });
      throw new UnauthorizedException('Invalid API key');
    }

    try {
      await this.walletService.processWebhook(payload);

      this.logger.log('SePay webhook processed successfully', {
        transactionId: payload.id,
        code: payload.code,
        amount: payload.transferAmount,
      });

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      this.logger.error('SePay webhook processing failed', {
        transactionId: payload.id,
        code: payload.code,
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Determine if error is retryable
      const nonRetryableErrors = [
        'Invalid payment code',
        'Payment request not found',
        'already processed',
        'Invalid amount',
      ];

      const isRetryable = !nonRetryableErrors.some(msg =>
        errorMessage.toLowerCase().includes(msg.toLowerCase())
      );

      // Return error status so payment provider can retry if appropriate
      return {
        success: false,
        error: 'Webhook processing failed',
        retryable: isRetryable,
      };
    }
  }
}
