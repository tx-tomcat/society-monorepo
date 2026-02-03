import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Bank info with logos from VietQR API
const BANK_INFO: Record<string, { name: string; logo: string }> = {
  mb: {
    name: 'MB Bank',
    logo: 'https://is2-ssl.mzstatic.com/image/thumb/Purple122/v4/f4/0a/b6/f40ab6a2-e67d-e267-9c46-ae03dfa238a9/AppIcon-0-0-1x_U007emarketing-0-0-0-7-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/1200x630wa.png',
  },
  tcb: {
    name: 'Techcombank',
    logo: 'https://is5-ssl.mzstatic.com/image/thumb/Purple122/v4/b2/b4/d1/b2b4d153-ed9f-aab6-996c-205c583c1339/AppIcon-0-0-1x_U007emarketing-0-0-0-10-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/1200x630wa.png',
  },
  vcb: {
    name: 'Vietcombank',
    logo: 'https://is4-ssl.mzstatic.com/image/thumb/Purple122/v4/c6/c9/ed/c6c9ed04-11f8-7269-fcc3-9609126682c0/AppIcon-1x_U007emarketing-0-7-0-0-85-220.png/1200x630wa.png',
  },
  icb: {
    name: 'VietinBank',
    logo: 'https://is4-ssl.mzstatic.com/image/thumb/Purple112/v4/14/04/b8/1404b8f4-a91f-f8bf-7af5-1a0e59bbdf19/AppIcon-0-0-1x_U007emarketing-0-0-0-7-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/1200x630wa.png',
  },
  vpb: {
    name: 'VPBank',
    logo: 'https://is3-ssl.mzstatic.com/image/thumb/Purple122/v4/0f/45/e5/0f45e506-590d-860d-8a0f-61c460d8b6dd/AppIcon-0-0-1x_U007emarketing-0-0-0-7-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/1200x630wa.png',
  },
  bidv: {
    name: 'BIDV',
    logo: 'https://is1-ssl.mzstatic.com/image/thumb/Purple112/v4/88/1b/e6/881be6df-e9b6-8b66-e0fb-2499ac874734/AppIcon-1x_U007emarketing-0-6-0-0-85-220.png/1200x630wa.png',
  },
  vba: {
    name: 'Agribank',
    logo: 'https://is1-ssl.mzstatic.com/image/thumb/Purple112/v4/a6/7e/98/a67e98e6-20c2-5f96-c364-f79a9fe03819/AppIcon-1x_U007emarketing-0-5-0-0-85-220.png/1200x630wa.png',
  },
  tpb: {
    name: 'TPBank',
    logo: 'https://is3-ssl.mzstatic.com/image/thumb/Purple122/v4/c3/31/46/c3314678-be31-dda0-621b-ff8f9f100c82/AppIcon-0-0-1x_U007emarketing-0-0-0-7-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/1200x630wa.png',
  },
  cake: {
    name: 'CAKE',
    logo: 'https://is1-ssl.mzstatic.com/image/thumb/Purple122/v4/7e/52/78/7e5278a7-0a19-3d30-fb30-e4a1be011e11/AppIcon-0-0-1x_U007emarketing-0-0-0-7-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/1200x630wa.png',
  },
  acb: {
    name: 'ACB',
    logo: 'https://is4-ssl.mzstatic.com/image/thumb/Purple122/v4/a1/ae/1e/a1ae1e68-2d58-92bc-9ec5-42917a59f767/AppIcon-1x_U007emarketing-0-7-0-0-85-220.png/1200x630wa.png',
  },
  ocb: {
    name: 'OCB',
    logo: 'https://is4-ssl.mzstatic.com/image/thumb/Purple122/v4/f0/66/94/f066942c-2cc6-2c87-407b-a38f2e99656f/AppIcon-0-0-1x_U007emarketing-0-0-0-10-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/1200x630wa.png',
  },
  lpb: {
    name: 'LienVietPostBank',
    logo: 'https://is2-ssl.mzstatic.com/image/thumb/Purple112/v4/d6/dd/3a/d6dd3a04-f846-e108-12bf-74436cc7340a/AppIcon-0-0-1x_U007emarketing-0-0-0-10-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/1200x630wa.png',
  },
  timo: {
    name: 'Timo',
    logo: 'https://is3-ssl.mzstatic.com/image/thumb/Purple122/v4/a2/74/38/a274389d-f000-71b1-645c-91e9922cd577/AppIcon-0-0-1x_U007emarketing-0-0-0-7-0-0-P3-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/1200x630wa.png',
  },
};

export type BankDeeplinkInfo = {
  appId: string;
  name: string;
  logo: string;
  deeplink: string;
};

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
   * Generate unique HMXXXXXXX code (no hyphen for cleaner display)
   * Uses alphanumeric chars excluding confusing ones (0,O,1,I,L)
   */
  generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'HM';
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
   * Get bank app deeplinks for Vietnamese banks using VietQR universal format
   * Format: https://dl.vietqr.io/pay?app={appId}&ba={account}@{bankCode}&am={amount}&tn={memo}&bn={accountName}
   * Banks with autofill=1 support automatic form filling (BIDV, OCB, ACB)
   */
  getBankDeeplinks(amount: number, code: string): BankDeeplinkInfo[] {
    // VietQR bank account format: {accountNumber}@{bankCode}
    const bankAccount = `${this.accountNumber}@${this.bankCode.toLowerCase()}`;
    const encodedName = encodeURIComponent(this.accountName);

    // Build deeplink for a specific bank app
    const buildDeeplink = (appId: string): string => {
      return `https://dl.vietqr.io/pay?app=${appId}&ba=${bankAccount}&am=${amount}&tn=${code}&bn=${encodedName}`;
    };

    // Top banks sorted by monthly installs (most popular first)
    // Banks with autofill=1: bidv, ocb, acb (auto-fill payment info)
    const bankOrder = ['mb', 'tcb', 'vcb', 'icb', 'vpb', 'bidv', 'vba', 'tpb', 'cake', 'acb', 'ocb', 'lpb', 'timo'];

    return bankOrder.map((appId) => ({
      appId,
      name: BANK_INFO[appId]?.name || appId.toUpperCase(),
      logo: BANK_INFO[appId]?.logo || '',
      deeplink: buildDeeplink(appId),
    }));
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
   * Extract HMXXXXXXX code from webhook content field
   * Supports both formats: HMXXXXXXX (new) and HM-XXXXXXX (legacy)
   */
  extractCode(content: string): string | null {
    if (!content) return null;
    // Match both new format (HMXXXXXXX) and legacy format (HM-XXXXXXX)
    const match = content.match(/HM-?([A-Z0-9]{7})/i);
    if (!match) return null;
    // Normalize to new format without hyphen
    return ('HM' + match[1]).toUpperCase();
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
