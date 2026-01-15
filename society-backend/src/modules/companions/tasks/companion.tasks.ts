import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CompanionsService } from '../services/companions.service';

@Injectable()
export class CompanionTasks {
  private readonly logger = new Logger(CompanionTasks.name);

  constructor(private readonly companionsService: CompanionsService) {}

  /**
   * Expire profile boosts that have passed their expiration time
   * Runs every 15 minutes to check for expired boosts
   */
  @Cron('0 */15 * * * *')
  async expireProfileBoosts() {
    this.logger.log('Running expire profile boosts task...');

    try {
      const result = await this.companionsService.expireOldBoosts();
      this.logger.log(`Expired ${result.count} profile boosts`);
    } catch (error) {
      this.logger.error(
        'Failed to expire profile boosts:',
        error instanceof Error ? error.message : error,
      );
    }

    this.logger.log('Expire profile boosts task finished');
  }
}
