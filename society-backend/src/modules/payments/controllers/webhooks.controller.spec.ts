import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WalletService } from '@/modules/wallet/wallet.service';
import { SepayService } from '../services/sepay.service';
import { SepayWebhookDto } from '@/modules/wallet/dto/wallet.dto';

describe('WebhooksController', () => {
  let controller: WebhooksController;
  let walletService: jest.Mocked<WalletService>;
  let sepayService: jest.Mocked<SepayService>;

  const mockWalletService = {
    processWebhook: jest.fn(),
  };

  const mockSepayService = {
    verifyWebhook: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WebhooksController],
      providers: [
        { provide: WalletService, useValue: mockWalletService },
        { provide: SepayService, useValue: mockSepayService },
      ],
    }).compile();

    controller = module.get<WebhooksController>(WebhooksController);
    walletService = module.get(WalletService);
    sepayService = module.get(SepayService);
    jest.clearAllMocks();
  });

  describe('handleBankTransferWebhook', () => {
    const validPayload: SepayWebhookDto = {
      id: 123,
      gateway: 'SePay',
      transactionDate: '2026-02-03T10:00:00Z',
      accountNumber: '123456789',
      code: 'SOC123456',
      content: 'Payment for booking',
      transferType: 'in',
      transferAmount: 500000,
      accumulated: 500000,
      subAccount: null,
      referenceCode: 'REF123',
      description: 'Test payment',
    };

    it('should return success when webhook processes successfully', async () => {
      mockSepayService.verifyWebhook.mockReturnValue(true);
      mockWalletService.processWebhook.mockResolvedValue(undefined);

      const result = await controller.handleBankTransferWebhook(
        'test-api-key',
        validPayload,
      );

      expect(result).toEqual({ success: true });
      expect(mockWalletService.processWebhook).toHaveBeenCalledWith(validPayload);
    });

    it('should return error status when webhook processing fails', async () => {
      mockSepayService.verifyWebhook.mockReturnValue(true);
      mockWalletService.processWebhook.mockRejectedValue(
        new Error('Database connection failed'),
      );

      const result = await controller.handleBankTransferWebhook(
        'test-api-key',
        validPayload,
      );

      expect(result).toEqual({
        success: false,
        error: 'Webhook processing failed',
        retryable: true,
      });
    });

    it('should return non-retryable error for validation failures', async () => {
      mockSepayService.verifyWebhook.mockReturnValue(true);
      mockWalletService.processWebhook.mockRejectedValue(
        new Error('Invalid payment code format'),
      );

      const result = await controller.handleBankTransferWebhook(
        'test-api-key',
        validPayload,
      ) as { success: boolean; retryable?: boolean };

      // Validation errors should not trigger retry
      expect(result.success).toBe(false);
      expect(result.retryable).toBe(false);
    });

    it('should reject invalid API key', async () => {
      mockSepayService.verifyWebhook.mockReturnValue(false);

      await expect(
        controller.handleBankTransferWebhook('invalid-key', validPayload),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
