import { JwtAuthGuard } from '@/auth/guards/jwt.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  CreateBankAccountDto,
  GetTransactionsQueryDto,
  WithdrawFundsDto,
} from '../dto/earnings.dto';
import { EarningsService } from '../services/earnings.service';

@Controller('companion/earnings')
@UseGuards(JwtAuthGuard)
export class EarningsController {
  constructor(private readonly earningsService: EarningsService) { }

  /**
   * Get earnings overview
   */
  @Get()
  async getEarningsOverview(@CurrentUser('id') userId: string) {
    return this.earningsService.getEarningsOverview(userId);
  }

  /**
   * Get transaction history
   */
  @Get('transactions')
  async getTransactions(
    @CurrentUser('id') userId: string,
    @Query() query: GetTransactionsQueryDto,
  ) {
    return this.earningsService.getTransactions(userId, query);
  }

  /**
   * Get bank accounts
   */
  @Get('bank-accounts')
  async getBankAccounts(@CurrentUser('id') userId: string) {
    return this.earningsService.getBankAccounts(userId);
  }

  /**
   * Add bank account
   */
  @Post('bank-accounts')
  async addBankAccount(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateBankAccountDto,
  ) {
    return this.earningsService.addBankAccount(userId, dto);
  }

  /**
   * Delete bank account
   */
  @Delete('bank-accounts/:accountId')
  async deleteBankAccount(
    @CurrentUser('id') userId: string,
    @Param('accountId') accountId: string,
  ) {
    return this.earningsService.deleteBankAccount(userId, accountId);
  }

  /**
   * Get withdrawal history
   */
  @Get('withdrawals')
  async getWithdrawalHistory(@CurrentUser('id') userId: string) {
    return this.earningsService.getWithdrawalHistory(userId);
  }

  /**
   * Withdraw funds
   */
  @Post('withdraw')
  async withdrawFunds(
    @CurrentUser('id') userId: string,
    @Body() dto: WithdrawFundsDto,
  ) {
    return this.earningsService.withdrawFunds(userId, dto);
  }
}
