import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post
} from '@nestjs/common';
import { Public } from '../../../common/decorators/public.decorator';
import { BankTransferWebhookDto } from '../dto/payment.dto';
import { BankTransferService } from '../services/bank-transfer.service';

// Momo return params type
interface MomoReturnParams {
  resultCode: string | number;
  orderId: string;
  message?: string;
}

@Public()
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly bankTransferService: BankTransferService,
  ) { }




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
