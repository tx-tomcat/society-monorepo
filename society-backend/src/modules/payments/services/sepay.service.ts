import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SepayService {
  private readonly logger = new Logger(SepayService.name);

  private readonly accountNumber: string;
  private readonly bankCode: string;
  private readonly accountName: string;
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.accountNumber = this.configService.get<string>('SEPAY_ACCOUNT_NUMBER', '');
    this.bankCode = this.configService.get<string>('SEPAY_BANK_CODE', '');
    this.accountName = this.configService.get<string>('SEPAY_ACCOUNT_NAME', '');
    this.apiKey = this.configService.get<string>('SEPAY_API_KEY', '');
  }

  /**
   * Check if SePay is configured
   */
  isConfigured(): boolean {
    return !!(this.accountNumber && this.bankCode && this.apiKey);
  }

  /**
   * Generate unique HM-XXXXXXX code
   * Uses alphanumeric chars excluding confusing ones (0,O,1,I,L)
   */
  generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'HM-';
    for (let i = 0; i < 7; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Build SePay QR URL
   */
  generateQrUrl(amount: number, code: string): string {
    const params = new URLSearchParams({
      acc: this.accountNumber,
      bank: this.bankCode,
      amount: amount.toString(),
      des: code,
    });
    return `https://qr.sepay.vn/img?${params.toString()}`;
  }

  /**
   * Get bank app deeplinks for Vietnamese banks
   */
  getBankDeeplinks(amount: number, code: string): Record<string, string> {
    const acc = this.accountNumber;
    const name = encodeURIComponent(this.accountName);

    return {
      tpbank: `https://link.tpb.vn/transfer?acc=${acc}&bank=TPB&amount=${amount}&memo=${code}&name=${name}`,
      vietcombank: `https://vcbdigibank.vietcombank.com.vn/transfer?acc=${acc}&amount=${amount}&memo=${code}`,
      techcombank: `https://link.techcombank.com/transfer?acc=${acc}&amount=${amount}&memo=${code}`,
      mbbank: `https://online.mbbank.com.vn/transfer?acc=${acc}&amount=${amount}&memo=${code}`,
      acb: `https://acb.com.vn/transfer?acc=${acc}&amount=${amount}&memo=${code}`,
      bidv: `https://smartbanking.bidv.com.vn/transfer?acc=${acc}&amount=${amount}&memo=${code}`,
    };
  }

  /**
   * Verify webhook API key from Authorization header
   */
  verifyWebhook(authHeader: string | undefined): boolean {
    if (!authHeader) return false;
    const expected = `Apikey ${this.apiKey}`;
    return authHeader === expected;
  }

  /**
   * Extract HM-XXXXXXX code from webhook content field
   */
  extractCode(content: string): string | null {
    if (!content) return null;
    const match = content.match(/HM-([A-Z0-9]{7})/i);
    return match ? match[0].toUpperCase() : null;
  }

  /**
   * Get account info for display
   */
  getAccountInfo(): { bankCode: string; accountNumber: string; accountName: string } {
    return {
      bankCode: this.bankCode,
      accountNumber: this.accountNumber,
      accountName: this.accountName,
    };
  }
}
