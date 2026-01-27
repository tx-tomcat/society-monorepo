import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { IdempotencyService } from '@/common/services/idempotency.service';
import { WalletService } from './wallet.service';

@Injectable()
export class WalletScheduler {
  private readonly logger = new Logger(WalletScheduler.name);

  constructor(
    private readonly walletService: WalletService,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  /**
   * Cleanup expired payment requests every 5 minutes
   */
  @Cron(CronExpression.EVERY_5_MINUTES)
  async handleExpiredRequests(): Promise<void> {
    this.logger.debug('Running expired payment requests cleanup...');
    await this.walletService.cleanupExpiredRequests();
  }

  /**
   * Cleanup expired idempotency keys every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleExpiredIdempotencyKeys(): Promise<void> {
    this.logger.debug('Running expired idempotency keys cleanup...');
    await this.idempotencyService.cleanupExpiredKeys();
  }
}
