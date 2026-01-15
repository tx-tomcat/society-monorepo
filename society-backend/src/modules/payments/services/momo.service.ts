import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PaymentInitResult, PaymentCallbackResult } from '../interfaces/payment.interface';
import { MomoCallbackDto, PaymentProvider } from '../dto/payment.dto';

@Injectable()
export class MomoService {
  private readonly logger = new Logger(MomoService.name);
  private readonly partnerCode: string;
  private readonly accessKey: string;
  private readonly secretKey: string;
  private readonly endpoint: string;
  private readonly returnUrl: string;
  private readonly notifyUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.partnerCode = this.configService.get<string>('MOMO_PARTNER_CODE') || '';
    this.accessKey = this.configService.get<string>('MOMO_ACCESS_KEY') || '';
    this.secretKey = this.configService.get<string>('MOMO_SECRET_KEY') || '';
    this.endpoint = this.configService.get<string>('MOMO_ENDPOINT') || 'https://test-payment.momo.vn/v2/gateway/api/create';

    const serverUrl = this.configService.get<string>('SERVER_URL') || '';
    this.returnUrl = `${serverUrl}/payments/momo/return`;
    this.notifyUrl = `${serverUrl}/webhooks/momo`;

    if (!this.partnerCode || !this.accessKey || !this.secretKey) {
      this.logger.warn('Momo credentials not configured');
    }
  }

  async createPayment(
    paymentId: string,
    amountVnd: number,
    description: string,
    returnUrl?: string,
  ): Promise<PaymentInitResult> {
    const requestId = `${this.partnerCode}${Date.now()}`;
    const orderId = paymentId.replace(/-/g, '').substring(0, 50);
    const orderInfo = description || 'Society subscription payment';
    const extraData = Buffer.from(JSON.stringify({ paymentId })).toString('base64');

    // Create signature
    const rawSignature = `accessKey=${this.accessKey}&amount=${amountVnd}&extraData=${extraData}&ipnUrl=${this.notifyUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${this.partnerCode}&redirectUrl=${returnUrl || this.returnUrl}&requestId=${requestId}&requestType=captureWallet`;

    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(rawSignature)
      .digest('hex');

    const requestBody = {
      partnerCode: this.partnerCode,
      partnerName: 'Society',
      storeId: 'SocietyStore',
      requestId,
      amount: amountVnd,
      orderId,
      orderInfo,
      redirectUrl: returnUrl || this.returnUrl,
      ipnUrl: this.notifyUrl,
      lang: 'vi',
      extraData,
      requestType: 'captureWallet',
      signature,
    };

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (result.resultCode !== 0) {
        this.logger.error(`Momo payment creation failed: ${result.message}`);
        throw new Error(result.message || 'Failed to create Momo payment');
      }

      return {
        paymentId,
        provider: PaymentProvider.MOMO,
        paymentUrl: result.payUrl,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      };
    } catch (error: any) {
      this.logger.error(`Momo payment error: ${error.message}`);
      throw error;
    }
  }

  verifyCallback(params: MomoCallbackDto): PaymentCallbackResult {
    // Verify signature
    const rawSignature = `accessKey=${this.accessKey}&amount=${params.amount}&extraData=${params.extraData}&message=${params.message}&orderId=${params.orderId}&orderInfo=${params.orderInfo}&orderType=${params.orderType}&partnerCode=${params.partnerCode}&payType=${params.payType}&requestId=${params.requestId}&responseTime=${params.responseTime}&resultCode=${params.resultCode}&transId=${params.transId}`;

    const expectedSignature = crypto
      .createHmac('sha256', this.secretKey)
      .update(rawSignature)
      .digest('hex');

    if (params.signature !== expectedSignature) {
      this.logger.warn('Momo signature verification failed');
      return {
        success: false,
        paymentId: params.orderId,
        amount: params.amount,
        error: 'Invalid signature',
      };
    }

    if (params.resultCode === 0) {
      // Extract original paymentId from extraData
      let originalPaymentId = params.orderId;
      try {
        const extraData = JSON.parse(Buffer.from(params.extraData, 'base64').toString());
        originalPaymentId = extraData.paymentId || params.orderId;
      } catch {
        // Use orderId if extraData parsing fails
      }

      return {
        success: true,
        paymentId: originalPaymentId,
        transactionId: params.transId.toString(),
        amount: params.amount,
      };
    }

    return {
      success: false,
      paymentId: params.orderId,
      amount: params.amount,
      error: params.message,
    };
  }

  isConfigured(): boolean {
    return !!(this.partnerCode && this.accessKey && this.secretKey);
  }
}
