import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { BookingStatus, EarningsStatus, WithdrawalStatus, VerificationStatus } from '@generated/client';
import { PrismaService } from '@/prisma/prisma.service';
import {
  CreateBankAccountDto,
  WithdrawFundsDto,
  GetTransactionsQueryDto,
  EarningsOverviewResponse,
  TransactionItem,
  BankAccountItem,
  WithdrawalResponse,
  PeriodData,
} from '../dto/earnings.dto';
import { WITHDRAWAL_LIMITS } from '@/common/constants/business.constants';
import { StringUtils } from '@/common/utils/string.utils';
import { VerificationService } from '../../verification/services/verification.service';

@Injectable()
export class EarningsService {
  private readonly logger = new Logger(EarningsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly verificationService: VerificationService,
  ) {}

  /**
   * Get earnings overview
   */
  async getEarningsOverview(userId: string): Promise<EarningsOverviewResponse> {
    const companion = await this.prisma.companionProfile.findUnique({
      where: { userId },
    });

    if (!companion) {
      throw new NotFoundException('Companion profile not found');
    }

    // Get released earnings (available balance)
    const releasedEarnings = await this.prisma.earning.findMany({
      where: {
        companionId: companion.id,
        status: EarningsStatus.AVAILABLE,
      },
      select: { netAmount: true },
    });

    // Get total withdrawals
    const completedWithdrawals = await this.prisma.withdrawal.findMany({
      where: {
        companionId: companion.id,
        status: WithdrawalStatus.COMPLETED,
      },
      select: { amount: true },
    });

    const totalReleased = releasedEarnings.reduce((sum, e) => sum + e.netAmount, 0);
    const totalWithdrawn = completedWithdrawals.reduce((sum, w) => sum + w.amount, 0);
    const availableBalance = totalReleased - totalWithdrawn;

    // Get pending earnings (held)
    const pendingEarnings = await this.prisma.earning.findMany({
      where: {
        companionId: companion.id,
        status: EarningsStatus.PENDING,
      },
      select: { netAmount: true },
    });

    const pendingBalance = pendingEarnings.reduce((sum, e) => sum + e.netAmount, 0);

    // Get total earnings (all released)
    const totalEarnings = totalReleased;

    // Calculate period stats
    const periodStats = await this.calculatePeriodStats(companion.id);

    return {
      availableBalance,
      pendingBalance,
      totalEarnings,
      periodStats,
    };
  }

  /**
   * Calculate period statistics
   */
  private async calculatePeriodStats(companionId: string): Promise<{
    thisWeek: PeriodData;
    thisMonth: PeriodData;
    thisYear: PeriodData;
  }> {
    const now = new Date();

    // This week (starting Monday)
    const startOfWeek = new Date(now);
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWeek.setDate(now.getDate() - diff);
    startOfWeek.setHours(0, 0, 0, 0);

    // Last week
    const startOfLastWeek = new Date(startOfWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    // This month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Last month
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // This year
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    // Last year
    const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
    const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31);

    const [thisWeekData, lastWeekData, thisMonthData, lastMonthData, thisYearData, lastYearData] =
      await Promise.all([
        this.getEarningsInRange(companionId, startOfWeek, now),
        this.getEarningsInRange(companionId, startOfLastWeek, startOfWeek),
        this.getEarningsInRange(companionId, startOfMonth, now),
        this.getEarningsInRange(companionId, startOfLastMonth, endOfLastMonth),
        this.getEarningsInRange(companionId, startOfYear, now),
        this.getEarningsInRange(companionId, startOfLastYear, endOfLastYear),
      ]);

    return {
      thisWeek: {
        amount: thisWeekData.earnings,
        bookings: thisWeekData.count,
        change: this.calculateChange(thisWeekData.earnings, lastWeekData.earnings),
      },
      thisMonth: {
        amount: thisMonthData.earnings,
        bookings: thisMonthData.count,
        change: this.calculateChange(thisMonthData.earnings, lastMonthData.earnings),
      },
      thisYear: {
        amount: thisYearData.earnings,
        bookings: thisYearData.count,
        change: this.calculateChange(thisYearData.earnings, lastYearData.earnings),
      },
    };
  }

  private async getEarningsInRange(
    companionId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<{ count: number; earnings: number }> {
    const earnings = await this.prisma.earning.findMany({
      where: {
        companionId,
        status: EarningsStatus.AVAILABLE,
        releasedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: { netAmount: true },
    });

    return {
      count: earnings.length,
      earnings: earnings.reduce((sum, e) => sum + e.netAmount, 0),
    };
  }

  private calculateChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  /**
   * Get transaction history
   */
  async getTransactions(
    userId: string,
    query: GetTransactionsQueryDto,
  ): Promise<{ transactions: TransactionItem[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const companion = await this.prisma.companionProfile.findUnique({
      where: { userId },
    });

    if (!companion) {
      return { transactions: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } };
    }

    const { page = 1, limit = 20, period } = query;

    // Calculate date filter based on period
    let dateFilter: { gte?: Date; lte?: Date } | undefined;
    if (period) {
      const now = new Date();
      const startDate = new Date();

      switch (period) {
        case 'week':
          // Start of current week (Monday)
          const dayOfWeek = now.getDay();
          const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          startDate.setDate(now.getDate() - diff);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'month':
          startDate.setDate(1);
          startDate.setHours(0, 0, 0, 0);
          break;
        case 'year':
          startDate.setMonth(0, 1);
          startDate.setHours(0, 0, 0, 0);
          break;
      }

      dateFilter = { gte: startDate, lte: now };
    }

    // Get earnings as transactions
    const earnings = await this.prisma.earning.findMany({
      where: {
        companionId: companion.id,
        status: EarningsStatus.AVAILABLE,
        ...(dateFilter && { releasedAt: dateFilter }),
      },
      orderBy: { releasedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        booking: {
          include: {
            hirer: true,
          },
        },
      },
    });

    const total = await this.prisma.earning.count({
      where: {
        companionId: companion.id,
        status: EarningsStatus.AVAILABLE,
        ...(dateFilter && { releasedAt: dateFilter }),
      },
    });

    const transactions: TransactionItem[] = earnings.map((e) => ({
      id: e.id,
      type: 'earning' as const,
      description: `${e.booking.occasionType.toLowerCase().replace('_', ' ')} - ${e.booking.hirer?.fullName || 'Anonymous'}`,
      amount: e.netAmount,
      date: e.releasedAt?.toISOString().split('T')[0] || e.createdAt.toISOString().split('T')[0],
      status: 'completed' as const,
      bookingId: e.bookingId,
    }));

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get bank accounts
   */
  async getBankAccounts(userId: string): Promise<{ accounts: BankAccountItem[] }> {
    const companion = await this.prisma.companionProfile.findUnique({
      where: { userId },
    });

    if (!companion) {
      return { accounts: [] };
    }

    const accounts = await this.prisma.bankAccount.findMany({
      where: { companionId: companion.id },
      orderBy: { createdAt: 'desc' },
    });

    const accountList: BankAccountItem[] = accounts.map((a) => ({
      id: a.id,
      bankName: a.bankName,
      accountNumber: this.maskAccountNumber(a.accountNumber),
      accountHolder: a.accountHolder,
      isDefault: a.isPrimary,
      createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : String(a.createdAt),
    }));

    return { accounts: accountList };
  }

  private maskAccountNumber(accountNumber: string): string {
    if (accountNumber.length <= 4) return accountNumber;
    return '*'.repeat(accountNumber.length - 4) + accountNumber.slice(-4);
  }

  /**
   * Add bank account
   */
  async addBankAccount(userId: string, dto: CreateBankAccountDto): Promise<BankAccountItem> {
    const companion = await this.prisma.companionProfile.findUnique({
      where: { userId },
    });

    if (!companion) {
      throw new NotFoundException('Companion profile not found');
    }

    // Check if this is the first account (make it primary)
    const existingAccounts = await this.prisma.bankAccount.count({
      where: { companionId: companion.id },
    });

    const account = await this.prisma.bankAccount.create({
      data: {
        companion: { connect: { id: companion.id } },
        bankName: dto.bankName,
        accountNumber: dto.accountNumber,
        accountHolder: dto.accountHolder,
        isPrimary: existingAccounts === 0,
        isVerified: false,
      },
    });

    // Invalidate bank account list cache
    await this.prisma.invalidateModelCache('bankAccount');

    return {
      id: account.id,
      bankName: account.bankName,
      accountNumber: this.maskAccountNumber(account.accountNumber),
      accountHolder: account.accountHolder,
      isDefault: account.isPrimary,
      createdAt: account.createdAt.toISOString(),
    };
  }

  /**
   * Delete bank account
   */
  async deleteBankAccount(userId: string, accountId: string): Promise<{ success: boolean }> {
    const companion = await this.prisma.companionProfile.findUnique({
      where: { userId },
    });

    if (!companion) {
      throw new NotFoundException('Companion profile not found');
    }

    const account = await this.prisma.bankAccount.findFirst({
      where: {
        id: accountId,
        companionId: companion.id,
      },
    });

    if (!account) {
      throw new NotFoundException('Bank account not found');
    }

    await this.prisma.bankAccount.delete({
      where: { id: accountId },
    });

    // If this was the primary account, make another one primary
    if (account.isPrimary) {
      const anotherAccount = await this.prisma.bankAccount.findFirst({
        where: { companionId: companion.id },
      });

      if (anotherAccount) {
        await this.prisma.bankAccount.update({
          where: { id: anotherAccount.id },
          data: { isPrimary: true },
        });
      }
    }

    // Invalidate bank account list cache
    await this.prisma.invalidateModelCache('bankAccount');

    return { success: true };
  }

  /**
   * Withdraw funds with validation and transaction safety
   * First withdrawal requires completed KYC (identity verification)
   */
  async withdrawFunds(userId: string, dto: WithdrawFundsDto): Promise<WithdrawalResponse> {
    const companion = await this.prisma.companionProfile.findUnique({
      where: { userId },
    });

    if (!companion) {
      throw new NotFoundException('Companion profile not found');
    }

    // Check if this is the first withdrawal - KYC required for first withdrawal
    const previousWithdrawals = await this.prisma.withdrawal.findMany({
      where: {
        companionId: companion.id,
        status: WithdrawalStatus.COMPLETED,
      },
      take: 1,
    });

    const isFirstWithdrawal = previousWithdrawals.length === 0;

    if (isFirstWithdrawal) {
      // Verify KYC (identity verification) is completed
      const verificationStatus = await this.verificationService.getStatus(userId);
      const identityVerification = verificationStatus.identity;

      if (!identityVerification || identityVerification.status !== VerificationStatus.VERIFIED) {
        this.logger.warn(`First withdrawal blocked for user ${userId} - KYC not completed`);
        throw new ForbiddenException({
          message: 'Identity verification (KYC) is required before your first withdrawal',
          error: 'KYC_REQUIRED',
          kycRequired: true,
          kycStatus: identityVerification?.status || 'NOT_STARTED',
        });
      }
    }

    // Calculate available balance
    const releasedEarnings = await this.prisma.earning.findMany({
      where: {
        companionId: companion.id,
        status: EarningsStatus.AVAILABLE,
      },
      select: { netAmount: true },
    });

    const completedWithdrawals = await this.prisma.withdrawal.findMany({
      where: {
        companionId: companion.id,
        status: WithdrawalStatus.COMPLETED,
      },
      select: { amount: true },
    });

    const pendingWithdrawals = await this.prisma.withdrawal.findMany({
      where: {
        companionId: companion.id,
        status: WithdrawalStatus.PENDING,
      },
      select: { amount: true },
    });

    const totalReleased = releasedEarnings.reduce((sum, e) => sum + e.netAmount, 0);
    const totalWithdrawn = completedWithdrawals.reduce((sum, w) => sum + w.amount, 0);
    const totalPending = pendingWithdrawals.reduce((sum, w) => sum + w.amount, 0);
    const availableBalance = totalReleased - totalWithdrawn - totalPending;

    // Validate withdrawal amount
    if (dto.amount < WITHDRAWAL_LIMITS.MIN_AMOUNT) {
      throw new BadRequestException(
        `Minimum withdrawal amount is ${WITHDRAWAL_LIMITS.MIN_AMOUNT.toLocaleString()} VND`,
      );
    }

    if (dto.amount > WITHDRAWAL_LIMITS.MAX_AMOUNT) {
      throw new BadRequestException(
        `Maximum withdrawal amount is ${WITHDRAWAL_LIMITS.MAX_AMOUNT.toLocaleString()} VND per transaction`,
      );
    }

    // Check daily withdrawal limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayWithdrawals = await this.prisma.withdrawal.findMany({
      where: {
        companionId: companion.id,
        requestedAt: {
          gte: today,
          lt: tomorrow,
        },
        status: {
          in: [WithdrawalStatus.PENDING, WithdrawalStatus.PROCESSING, WithdrawalStatus.COMPLETED],
        },
      },
      select: { amount: true },
    });

    const todayTotal = todayWithdrawals.reduce((sum, w) => sum + w.amount, 0);
    const remainingDailyLimit = WITHDRAWAL_LIMITS.MAX_DAILY_AMOUNT - todayTotal;

    if (dto.amount > remainingDailyLimit) {
      throw new BadRequestException(
        `Daily withdrawal limit exceeded. Remaining today: ${remainingDailyLimit.toLocaleString()} VND (limit: ${WITHDRAWAL_LIMITS.MAX_DAILY_AMOUNT.toLocaleString()} VND/day)`,
      );
    }

    if (availableBalance < dto.amount) {
      throw new BadRequestException(
        `Insufficient balance. Available: ${availableBalance.toLocaleString()} VND`,
      );
    }

    const bankAccount = await this.prisma.bankAccount.findFirst({
      where: {
        id: dto.bankAccountId,
        companionId: companion.id,
      },
    });

    if (!bankAccount) {
      throw new NotFoundException('Bank account not found');
    }

    // Calculate withdrawal fee
    const fee = Math.max(
      Math.round(dto.amount * WITHDRAWAL_LIMITS.FEE_RATE),
      WITHDRAWAL_LIMITS.MIN_FEE,
    );
    const netAmount = dto.amount - fee;

    // Estimated arrival
    const estimatedArrival = new Date();
    estimatedArrival.setDate(estimatedArrival.getDate() + WITHDRAWAL_LIMITS.PROCESSING_DAYS);

    // Create withdrawal record
    const withdrawal = await this.prisma.withdrawal.create({
      data: {
        companionId: companion.id,
        bankAccountId: bankAccount.id,
        amount: dto.amount,
        status: WithdrawalStatus.PENDING,
      },
    });

    return {
      id: withdrawal.id,
      amount: dto.amount,
      fee,
      netAmount,
      bankAccount: {
        bankName: bankAccount.bankName,
        accountNumber: StringUtils.maskSensitiveData(bankAccount.accountNumber, 4),
      },
      estimatedArrival: estimatedArrival.toISOString().split('T')[0],
      status: 'pending',
    };
  }
}
