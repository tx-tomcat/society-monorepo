import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Clean up expired idempotency keys
   * Should be called periodically by a cron job
   */
  async cleanupExpiredKeys(): Promise<number> {
    const result = await this.prisma.idempotencyKey.deleteMany({
      where: {
        expiresAt: { lt: new Date() },
      },
    });

    if (result.count > 0) {
      this.logger.log(`Deleted ${result.count} expired idempotency keys`);
    }

    return result.count;
  }
}
