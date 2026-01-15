import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReferralService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate unique referral code for user
   */
  async generateCode(userId: string): Promise<string> {
    // Check if user already has a referral code
    const existing = await this.prisma.referral.findUnique({
      where: { userId },
    });

    if (existing) {
      return existing.code;
    }

    // Generate a unique code
    let code: string;
    let attempts = 0;
    const maxAttempts = 10;

    do {
      code = this.generateRandomCode();
      const exists = await this.prisma.referral.findUnique({
        where: { code },
      });

      if (!exists) {
        break;
      }

      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      throw new BadRequestException('Failed to generate unique referral code');
    }

    // Create referral record
    const referral = await this.prisma.referral.create({
      data: {
        userId,
        code,
      },
    });

    return referral.code;
  }

  /**
   * Get user's referral info
   */
  async getReferralInfo(userId: string) {
    const referral = await this.prisma.referral.findUnique({
      where: { userId },
      include: {
        referredUsers: {
          select: {
            id: true,
            email: true,
            fullName: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!referral) {
      return null;
    }

    return {
      code: referral.code,
      totalUses: referral.totalUses,
      totalEarnings: referral.totalEarnings,
      isActive: referral.isActive,
      referredUsers: referral.referredUsers.map((user) => ({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        createdAt: user.createdAt,
      })),
    };
  }

  /**
   * Apply referral code during signup
   */
  async applyReferralCode(newUserId: string, code: string): Promise<void> {
    const referral = await this.prisma.referral.findUnique({
      where: { code },
    });

    if (!referral) {
      throw new NotFoundException('Invalid referral code');
    }

    if (!referral.isActive) {
      throw new BadRequestException('Referral code is not active');
    }

    // Check if user is trying to use their own code
    if (referral.userId === newUserId) {
      throw new BadRequestException('Cannot use your own referral code');
    }

    // Check if user already has a referrer
    const user = await this.prisma.user.findUnique({
      where: { id: newUserId },
      select: { referredById: true },
    });

    if (user?.referredById) {
      throw new BadRequestException('User has already used a referral code');
    }

    // Link user to referral and update stats
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: newUserId },
        data: { referredById: referral.id },
      }),
      this.prisma.referral.update({
        where: { id: referral.id },
        data: {
          totalUses: { increment: 1 },
        },
      }),
    ]);
  }

  /**
   * Credit referral bonus when referred user completes first booking
   */
  async creditReferralBonus(referredUserId: string, bookingAmount: number): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: referredUserId },
      select: { referredById: true },
    });

    if (!user?.referredById) {
      return; // User has no referrer
    }

    const referral = await this.prisma.referral.findUnique({
      where: { id: user.referredById },
    });

    if (!referral) {
      return;
    }

    // Calculate bonus (e.g., 5% of booking amount, capped at 500,000 VND)
    const bonusPercent = 5;
    const maxBonus = 500000;
    const bonus = Math.min(Math.floor(bookingAmount * bonusPercent / 100), maxBonus);

    // Update referral earnings
    await this.prisma.referral.update({
      where: { id: referral.id },
      data: {
        totalEarnings: { increment: bonus },
      },
    });

    // Note: Actual payment of bonus would be handled by the earnings/payments module
    // This just tracks the referral earnings
  }

  /**
   * Get referral leaderboard
   */
  async getLeaderboard(limit = 10) {
    const topReferrers = await this.prisma.referral.findMany({
      where: {
        isActive: true,
        totalUses: { gt: 0 },
      },
      orderBy: [
        { totalEarnings: 'desc' },
        { totalUses: 'desc' },
      ],
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return topReferrers.map((referral, index) => ({
      rank: index + 1,
      userId: referral.user.id,
      displayName: referral.user.fullName || 'Anonymous',
      avatarUrl: referral.user.avatarUrl,
      totalUses: referral.totalUses,
      totalEarnings: referral.totalEarnings,
    }));
  }

  /**
   * Get referral statistics for a user
   */
  async getStats(userId: string) {
    const referral = await this.prisma.referral.findUnique({
      where: { userId },
      include: {
        referredUsers: {
          select: { id: true },
        },
      },
    });

    if (!referral) {
      return {
        totalReferrals: 0,
        totalEarnings: 0,
        code: null,
      };
    }

    return {
      totalReferrals: referral.totalUses,
      totalEarnings: referral.totalEarnings,
      code: referral.code,
    };
  }

  /**
   * Validate referral code without applying it
   */
  async validateCode(code: string): Promise<{ valid: boolean; message?: string }> {
    const referral = await this.prisma.referral.findUnique({
      where: { code },
    });

    if (!referral) {
      return { valid: false, message: 'Invalid referral code' };
    }

    if (!referral.isActive) {
      return { valid: false, message: 'Referral code is no longer active' };
    }

    return { valid: true };
  }

  /**
   * Deactivate referral code
   */
  async deactivateCode(userId: string): Promise<void> {
    await this.prisma.referral.update({
      where: { userId },
      data: { isActive: false },
    });
  }

  /**
   * Generate random referral code
   */
  private generateRandomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'SOC'; // Prefix for Society
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}
