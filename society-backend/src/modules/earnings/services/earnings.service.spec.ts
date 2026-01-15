import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EarningsService } from './earnings.service';
import { PrismaService } from '@/prisma/prisma.service';
import { VerificationService } from '../../verification/services/verification.service';
import { EarningsStatus, WithdrawalStatus, ServiceType, VerificationStatus } from '@generated/client';

describe('EarningsService', () => {
  let service: EarningsService;

  const mockPrismaService = {
    companionProfile: {
      findUnique: jest.fn(),
    },
    earning: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    withdrawal: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
    bankAccount: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockVerificationService = {
    getStatus: jest.fn(),
    initiateIdentityVerification: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EarningsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: VerificationService,
          useValue: mockVerificationService,
        },
      ],
    }).compile();

    service = module.get<EarningsService>(EarningsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getEarningsOverview', () => {
    it('should return earnings overview', async () => {
      const mockCompanion = {
        id: 'comp-1',
      };

      const mockReleasedEarnings = [
        { netAmount: 1000000 },
        { netAmount: 1500000 },
      ];

      const mockPendingEarnings = [{ netAmount: 500000 }];

      const mockCompletedWithdrawals = [{ amount: 200000 }];

      mockPrismaService.companionProfile.findUnique.mockResolvedValue(mockCompanion);
      mockPrismaService.earning.findMany
        .mockResolvedValueOnce(mockReleasedEarnings) // Released earnings
        .mockResolvedValueOnce(mockPendingEarnings) // Pending earnings
        .mockResolvedValueOnce([]) // This week
        .mockResolvedValueOnce([]) // Last week
        .mockResolvedValueOnce([]) // This month
        .mockResolvedValueOnce([]) // Last month
        .mockResolvedValueOnce([]) // This year
        .mockResolvedValueOnce([]); // Last year

      mockPrismaService.withdrawal.findMany.mockResolvedValue(mockCompletedWithdrawals);

      const result = await service.getEarningsOverview('user-1');

      expect(result.availableBalance).toBe(2300000); // 2500000 - 200000
      expect(result.pendingBalance).toBe(500000);
      expect(result.totalEarnings).toBe(2500000);
    });

    it('should throw NotFoundException when companion not found', async () => {
      mockPrismaService.companionProfile.findUnique.mockResolvedValue(null);

      await expect(service.getEarningsOverview('non-existent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getTransactions', () => {
    it('should return transaction history', async () => {
      const mockCompanion = { id: 'comp-1' };
      const mockEarnings = [
        {
          id: 'earning-1',
          netAmount: 1275000,
          bookingId: 'booking-1',
          releasedAt: new Date(),
          createdAt: new Date(),
          booking: {
            occasionType: ServiceType.CASUAL_OUTING,
            hirer: { fullName: 'John' },
          },
        },
      ];

      mockPrismaService.companionProfile.findUnique.mockResolvedValue(mockCompanion);
      mockPrismaService.earning.findMany.mockResolvedValue(mockEarnings);
      mockPrismaService.earning.count.mockResolvedValue(1);

      const result = await service.getTransactions('user-1', {});

      expect(result.transactions).toHaveLength(1);
      expect(result.transactions[0].type).toBe('earning');
    });

    it('should return empty transactions when no companion profile', async () => {
      mockPrismaService.companionProfile.findUnique.mockResolvedValue(null);

      const result = await service.getTransactions('user-1', {});

      expect(result.transactions).toHaveLength(0);
    });
  });

  describe('getBankAccounts', () => {
    it('should return bank accounts with masked numbers', async () => {
      const mockCompanion = { id: 'comp-1' };
      const mockAccounts = [
        {
          id: 'acc-1',
          bankName: 'Vietcombank',
          accountNumber: '1234567890',
          accountHolder: 'Nguyen Van A',
          isPrimary: true,
          createdAt: new Date(),
        },
      ];

      mockPrismaService.companionProfile.findUnique.mockResolvedValue(mockCompanion);
      mockPrismaService.bankAccount.findMany.mockResolvedValue(mockAccounts);

      const result = await service.getBankAccounts('user-1');

      expect(result.accounts).toHaveLength(1);
      expect(result.accounts[0].accountNumber).toBe('******7890');
    });
  });

  describe('addBankAccount', () => {
    it('should add new bank account', async () => {
      const mockCompanion = { id: 'comp-1' };
      const mockAccount = {
        id: 'acc-1',
        bankName: 'Vietcombank',
        accountNumber: '1234567890',
        accountHolder: 'Nguyen Van A',
        isPrimary: true,
        createdAt: new Date(),
      };

      mockPrismaService.companionProfile.findUnique.mockResolvedValue(mockCompanion);
      mockPrismaService.bankAccount.count.mockResolvedValue(0);
      mockPrismaService.bankAccount.create.mockResolvedValue(mockAccount);

      const result = await service.addBankAccount('user-1', {
        bankName: 'Vietcombank',
        accountNumber: '1234567890',
        accountHolder: 'Nguyen Van A',
      });

      expect(result.bankName).toBe('Vietcombank');
      expect(result.isDefault).toBe(true);
    });

    it('should throw NotFoundException when companion not found', async () => {
      mockPrismaService.companionProfile.findUnique.mockResolvedValue(null);

      await expect(
        service.addBankAccount('user-1', {
          bankName: 'Vietcombank',
          accountNumber: '1234567890',
          accountHolder: 'Test',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('withdrawFunds', () => {
    it('should process withdrawal', async () => {
      const mockCompanion = { id: 'comp-1', userId: 'user-1' };
      const mockBankAccount = {
        id: 'acc-1',
        bankName: 'Vietcombank',
        accountNumber: '1234567890',
      };

      // Mock KYC verification status (verified user with previous withdrawals)
      mockVerificationService.getStatus.mockResolvedValue({
        identity: { status: VerificationStatus.VERIFIED },
      });

      // Mock released earnings (5,000,000 VND available)
      mockPrismaService.companionProfile.findUnique.mockResolvedValue(mockCompanion);
      mockPrismaService.earning.findMany.mockResolvedValue([{ netAmount: 5000000 }]);
      mockPrismaService.withdrawal.findMany
        .mockResolvedValueOnce([{ amount: 100000 }]) // Completed withdrawals (not first withdrawal)
        .mockResolvedValueOnce([]) // Pending withdrawals
        .mockResolvedValueOnce([]); // Today's withdrawals
      mockPrismaService.bankAccount.findFirst.mockResolvedValue(mockBankAccount);
      mockPrismaService.withdrawal.create.mockResolvedValue({
        id: 'withdrawal-1',
        amount: 1000000,
        status: WithdrawalStatus.PENDING,
      });

      const result = await service.withdrawFunds('user-1', {
        amount: 1000000,
        bankAccountId: 'acc-1',
      });

      expect(result.amount).toBe(1000000);
      expect(result.fee).toBe(10000); // 1% of 1000000 = 10000
      expect(result.netAmount).toBe(990000);
    });

    it('should throw BadRequestException for insufficient balance', async () => {
      const mockCompanion = { id: 'comp-1', userId: 'user-1' };

      // Mock KYC verification status
      mockVerificationService.getStatus.mockResolvedValue({
        identity: { status: VerificationStatus.VERIFIED },
      });

      mockPrismaService.companionProfile.findUnique.mockResolvedValue(mockCompanion);
      mockPrismaService.earning.findMany.mockResolvedValue([{ netAmount: 500000 }]);
      mockPrismaService.withdrawal.findMany
        .mockResolvedValueOnce([{ amount: 100000 }]) // Completed withdrawals (not first withdrawal)
        .mockResolvedValueOnce([]) // Pending withdrawals
        .mockResolvedValueOnce([]); // Today's withdrawals

      await expect(
        service.withdrawFunds('user-1', { amount: 1000000, bankAccountId: 'acc-1' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException for invalid bank account', async () => {
      const mockCompanion = { id: 'comp-1', userId: 'user-1' };

      // Mock KYC verification status
      mockVerificationService.getStatus.mockResolvedValue({
        identity: { status: VerificationStatus.VERIFIED },
      });

      mockPrismaService.companionProfile.findUnique.mockResolvedValue(mockCompanion);
      mockPrismaService.earning.findMany.mockResolvedValue([{ netAmount: 5000000 }]);
      mockPrismaService.withdrawal.findMany
        .mockResolvedValueOnce([{ amount: 100000 }]) // Completed withdrawals (not first withdrawal)
        .mockResolvedValueOnce([]) // Pending withdrawals
        .mockResolvedValueOnce([]); // Today's withdrawals
      mockPrismaService.bankAccount.findFirst.mockResolvedValue(null);

      await expect(
        service.withdrawFunds('user-1', { amount: 1000000, bankAccountId: 'invalid-acc' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should require KYC for first withdrawal', async () => {
      const mockCompanion = { id: 'comp-1', userId: 'user-1' };

      // Mock KYC verification status - NOT verified
      mockVerificationService.getStatus.mockResolvedValue({
        identity: { status: VerificationStatus.PENDING },
      });

      mockPrismaService.companionProfile.findUnique.mockResolvedValue(mockCompanion);
      mockPrismaService.withdrawal.findMany
        .mockResolvedValueOnce([]); // No completed withdrawals - this is first withdrawal

      await expect(
        service.withdrawFunds('user-1', { amount: 1000000, bankAccountId: 'acc-1' }),
      ).rejects.toThrow('Identity verification (KYC) is required before your first withdrawal');
    });

    it('should process first withdrawal when KYC is verified', async () => {
      const mockCompanion = { id: 'comp-1', userId: 'user-1' };
      const mockBankAccount = {
        id: 'acc-1',
        bankName: 'Vietcombank',
        accountNumber: '1234567890',
      };

      // Mock KYC verification status - verified
      mockVerificationService.getStatus.mockResolvedValue({
        identity: { status: VerificationStatus.VERIFIED },
      });

      mockPrismaService.companionProfile.findUnique.mockResolvedValue(mockCompanion);
      mockPrismaService.earning.findMany.mockResolvedValue([{ netAmount: 5000000 }]);
      mockPrismaService.withdrawal.findMany
        .mockResolvedValueOnce([]) // No completed withdrawals - first withdrawal
        .mockResolvedValueOnce([]) // Pending withdrawals
        .mockResolvedValueOnce([]); // Today's withdrawals
      mockPrismaService.bankAccount.findFirst.mockResolvedValue(mockBankAccount);
      mockPrismaService.withdrawal.create.mockResolvedValue({
        id: 'withdrawal-1',
        amount: 1000000,
        status: WithdrawalStatus.PENDING,
      });

      const result = await service.withdrawFunds('user-1', {
        amount: 1000000,
        bankAccountId: 'acc-1',
      });

      expect(result.amount).toBe(1000000);
      expect(mockVerificationService.getStatus).toHaveBeenCalledWith('user-1');
    });
  });
});
