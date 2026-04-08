import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../core/infrastructure/prisma/prisma.service';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cleans up old idempotency records.
   * Runs every hour. Retains records for 24 hours.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleIdempotencyCleanup() {
    this.logger.log('Starting IdempotencyRecord cleanup...');
    
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - 24);

    try {
      const { count } = await this.prisma.idempotencyRecord.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      if (count > 0) {
        this.logger.log(`Cleaned up ${count} expired idempotency records.`);
      }
    } catch (error) {
      this.logger.error('Error cleaning up idempotency records', error.stack);
    }
  }

  /**
   * Cleans up expired access tickets.
   * Runs every hour.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleAccessTicketCleanup() {
    this.logger.log('Starting AccessTicket cleanup...');

    try {
      const { count } = await this.prisma.accessTicket.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      });

      if (count > 0) {
        this.logger.log(`Cleaned up ${count} expired access tickets.`);
      }
    } catch (error) {
      this.logger.error('Error cleaning up access tickets', error.stack);
    }
  }
}
