import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { PaymentInitResult, PaymentCallbackResult } from '../interfaces/payment.interface';
import { VnpayCallbackDto, PaymentProvider } from '../dto/payment.dto';

@Injectable()
export class VnpayService {
  private readonly logger = new Logger(VnpayService.name);
  private readonly tmnCode: string;
  private readonly hashSecret: string;
  private readonly vnpUrl: string;
  private readonly returnUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.tmnCode = this.configService.get<string>('VNPAY_TMN_CODE') || '';
    this.hashSecret = this.configService.get<string>('VNPAY_HASH_SECRET') || '';
    this.vnpUrl = this.configService.get<string>('VNPAY_URL') || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    this.returnUrl = `${this.configService.get<string>('SERVER_URL')}/webhooks/vnpay`;

    if (!this.tmnCode || !this.hashSecret) {
      this.logger.warn('VNPay credentials not configured');
    }
  }

  async createPayment(
    paymentId: string,
    amountVnd: number,
    description: string,
    returnUrl?: string,
  ): Promise<PaymentInitResult> {
    const date = new Date();
    const createDate = this.formatDate(date);
    const orderId = paymentId.replace(/-/g, '').substring(0, 20);
    const expireDate = this.formatDate(new Date(date.getTime() + 15 * 60 * 1000));

    const params: Record<string, string> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: description || 'Society subscription payment',
      vnp_OrderType: 'other',
      vnp_Amount: (amountVnd * 100).toString(), // VNPay requires amount in smallest unit
      vnp_ReturnUrl: returnUrl || this.returnUrl,
      vnp_IpAddr: '127.0.0.1',
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
    };

    // Sort params alphabetically
    const sortedParams = this.sortObject(params);

    // Create signing data
    const signData = new URLSearchParams(sortedParams).toString();
    const hmac = crypto.createHmac('sha512', this.hashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    // Add signature
    sortedParams.vnp_SecureHash = signed;

    const paymentUrl = `${this.vnpUrl}?${new URLSearchParams(sortedParams).toString()}`;

    return {
      paymentId,
      provider: PaymentProvider.VNPAY,
      paymentUrl,
      expiresAt: new Date(date.getTime() + 15 * 60 * 1000),
    };
  }

  verifyCallback(params: VnpayCallbackDto): PaymentCallbackResult {
    const secureHash = params.vnp_SecureHash;

    // Remove hash from params for verification
    const verifyParams: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      if (key !== 'vnp_SecureHash' && key !== 'vnp_SecureHashType' && value) {
        verifyParams[key] = value;
      }
    }

    // Sort and create sign data
    const sortedParams = this.sortObject(verifyParams);
    const signData = new URLSearchParams(sortedParams).toString();
    const hmac = crypto.createHmac('sha512', this.hashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (secureHash !== signed) {
      this.logger.warn('VNPay signature verification failed');
      return {
        success: false,
        paymentId: params.vnp_TxnRef,
        amount: parseInt(params.vnp_Amount) / 100,
        error: 'Invalid signature',
      };
    }

    const responseCode = params.vnp_ResponseCode;
    const transactionStatus = params.vnp_TransactionStatus;

    if (responseCode === '00' && transactionStatus === '00') {
      return {
        success: true,
        paymentId: params.vnp_TxnRef,
        transactionId: params.vnp_TransactionNo,
        amount: parseInt(params.vnp_Amount) / 100,
      };
    }

    return {
      success: false,
      paymentId: params.vnp_TxnRef,
      amount: parseInt(params.vnp_Amount) / 100,
      error: `Payment failed: ${responseCode}`,
    };
  }

  private sortObject(obj: Record<string, string>): Record<string, string> {
    const sorted: Record<string, string> = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
      sorted[key] = obj[key];
    }
    return sorted;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }

  isConfigured(): boolean {
    return !!(this.tmnCode && this.hashSecret);
  }
}
