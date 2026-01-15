import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Logger,
  HttpCode,
  HttpStatus,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { VnpayService } from '../services/vnpay.service';
import { MomoService } from '../services/momo.service';
import { BankTransferService } from '../services/bank-transfer.service';
import { PaymentsService } from '../services/payments.service';
import { CompanionsService } from '../../companions/services/companions.service';
import { VnpayCallbackDto, MomoCallbackDto, BankTransferWebhookDto } from '../dto/payment.dto';

// Momo return params type
interface MomoReturnParams {
  resultCode: string | number;
  orderId: string;
  message?: string;
}

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly vnpayService: VnpayService,
    private readonly momoService: MomoService,
    private readonly bankTransferService: BankTransferService,
    private readonly paymentsService: PaymentsService,
    @Inject(forwardRef(() => CompanionsService))
    private readonly companionsService: CompanionsService,
  ) {}

  @Get('vnpay')
  async handleVnpayCallback(@Query() params: VnpayCallbackDto) {
    this.logger.log(`VNPay callback received: ${JSON.stringify(params)}`);

    const result = this.vnpayService.verifyCallback(params);

    // Check if this is a boost payment (prefixed with 'boost-')
    if (result.paymentId.startsWith('boost-')) {
      const boostId = result.paymentId.replace('boost-', '');
      this.logger.log(`Processing boost payment callback for boost ${boostId}`);

      if (result.success) {
        await this.companionsService.activateBoost(boostId);
        this.logger.log(`Boost ${boostId} activated successfully`);
      } else {
        this.logger.warn(`Boost payment failed for boost ${boostId}: ${result.error}`);
      }
    } else {
      // Handle booking payment callback
      await this.paymentsService.handlePaymentCallback(
        result.paymentId,
        result.transactionId || '',
        result.success,
      );
    }

    // VNPay expects specific response format
    return { RspCode: '00', Message: 'Confirm Success' };
  }

  @Post('momo')
  @HttpCode(HttpStatus.NO_CONTENT)
  async handleMomoCallback(@Body() params: MomoCallbackDto) {
    this.logger.log(`Momo callback received: ${JSON.stringify(params)}`);

    const result = this.momoService.verifyCallback(params);

    // Check if this is a boost payment (prefixed with 'boost-')
    if (result.paymentId.startsWith('boost-')) {
      const boostId = result.paymentId.replace('boost-', '');
      this.logger.log(`Processing Momo boost payment callback for boost ${boostId}`);

      if (result.success) {
        await this.companionsService.activateBoost(boostId);
        this.logger.log(`Boost ${boostId} activated successfully via Momo`);
      } else {
        this.logger.warn(`Momo boost payment failed for boost ${boostId}: ${result.error}`);
      }
    } else {
      // Handle booking payment callback
      await this.paymentsService.handlePaymentCallback(
        result.paymentId,
        result.transactionId || '',
        result.success,
      );
    }

    // Momo expects 204 No Content on success
  }

  @Get('payments/vnpay/return')
  async handleVnpayReturn(@Query() params: VnpayCallbackDto) {
    // This endpoint handles user redirect after payment
    const result = this.vnpayService.verifyCallback(params);

    // Return page that redirects to app or shows result
    return {
      success: result.success,
      paymentId: result.paymentId,
      message: result.success ? 'Payment successful' : result.error,
    };
  }

  @Get('payments/momo/return')
  async handleMomoReturn(@Query() params: MomoReturnParams) {
    // This endpoint handles user redirect after Momo payment
    const success = params.resultCode === '0' || params.resultCode === 0;

    return {
      success,
      orderId: params.orderId,
      message: success ? 'Payment successful' : params.message || 'Payment failed',
    };
  }

  /**
   * Bank transfer webhook - handles incoming payments with notes like "order-123"
   *
   * This endpoint is called by the payment gateway when a bank transfer is received
   * to the merchant account. The transfer note contains the order reference.
   *
   * Flow:
   * 1. User creates booking -> payment record created with PENDING status
   * 2. User makes bank transfer with note "order-{paymentId}"
   * 3. Bank notifies payment gateway
   * 4. Payment gateway calls this webhook
   * 5. We match the order reference and update payment status
   */
  @Post('bank-transfer')
  @HttpCode(HttpStatus.OK)
  async handleBankTransferWebhook(@Body() payload: BankTransferWebhookDto) {
    this.logger.log(`Bank transfer webhook received: ${JSON.stringify({
      transactionId: payload.transactionId,
      amount: payload.amount,
      transferNote: payload.transferNote,
      bankCode: payload.bankCode,
    })}`);

    const result = await this.bankTransferService.processIncomingPayment(payload);

    if (!result.success) {
      this.logger.warn(`Bank transfer processing failed: ${result.message}`);
    }

    // Return standardized response
    return {
      code: result.success ? '00' : '01',
      message: result.message,
      data: {
        paymentId: result.paymentId,
        orderReference: result.orderReference,
      },
    };
  }
}
