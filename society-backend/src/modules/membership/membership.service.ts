import { PrismaService } from '@/prisma/prisma.service';
import { MembershipStatus, MembershipTier } from '@generated/client';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Cron } from '@nestjs/schedule';
import { WalletService } from '../wallet/wallet.service';
import {
  ActiveMembershipResponse,
  MembershipBenefitsResponse,
  MembershipPricingResponse,
  MembershipPurchaseResponse,
} from './dto/membership.dto';
import { MembershipPaymentCompletedEvent } from './events/membership.events';
import { WALLET_EVENTS } from '../wallet/events/wallet.events';

const TIER_ORDER: Record<MembershipTier, number> = {
  SILVER: 1,
  GOLD: 2,
  PLATINUM: 3,
} as const;

const FREE_DEFAULTS: MembershipBenefitsResponse = {
  tier: null,
  forYouLimit: 1,
  maxPendingBookings: 3,
  freeCancellationHours: 24,
  priorityBooking: false,
  nearbySearch: false,
  earlyAccess: false,
  dedicatedSupport: false,
};

@Injectable()
export class MembershipService {
  private readonly logger = new Logger(MembershipService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
  ) {}

  /**
   * Get all membership pricing tiers
   */
  async getPricing(): Promise<MembershipPricingResponse[]> {
    const tiers = await this.prisma.membershipPricingTier.findMany({
      orderBy: { price: 'asc' },
    });

    return tiers.map((t) => ({
      tier: t.tier,
      name: t.name,
      durationDays: t.durationDays,
      price: t.price,
      forYouLimit: t.forYouLimit,
      maxPendingBookings: t.maxPendingBookings,
      freeCancellationHours: t.freeCancellationHours,
      priorityBooking: t.priorityBooking,
      nearbySearch: t.nearbySearch,
      earlyAccess: t.earlyAccess,
      dedicatedSupport: t.dedicatedSupport,
      description: t.description,
    }));
  }

  /**
   * Get the active membership for a user (ACTIVE and not expired)
   */
  async getActiveMembership(userId: string): Promise<ActiveMembershipResponse | null> {
    const membership = await this.prisma.hirerMembership.findFirst({
      where: {
        userId,
        status: MembershipStatus.ACTIVE,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!membership) return null;

    return {
      id: membership.id,
      tier: membership.tier,
      status: membership.status,
      price: membership.price,
      startedAt: membership.startedAt?.toISOString() || null,
      expiresAt: membership.expiresAt?.toISOString() || null,
      createdAt: membership.createdAt.toISOString(),
    };
  }

  /**
   * Get the tier string for a user, or null if no active membership
   */
  async getUserTier(userId: string): Promise<string | null> {
    const active = await this.prisma.hirerMembership.findFirst({
      where: {
        userId,
        status: MembershipStatus.ACTIVE,
        expiresAt: { gt: new Date() },
      },
      select: { tier: true },
    });

    return active?.tier || null;
  }

  /**
   * Get the benefits for a user based on their active membership tier
   * Falls back to free defaults if no active membership
   */
  async getUserBenefits(userId: string): Promise<MembershipBenefitsResponse> {
    const active = await this.prisma.hirerMembership.findFirst({
      where: {
        userId,
        status: MembershipStatus.ACTIVE,
        expiresAt: { gt: new Date() },
      },
      select: { tier: true },
    });

    if (!active) return { ...FREE_DEFAULTS };

    const pricing = await this.prisma.membershipPricingTier.findUnique({
      where: { tier: active.tier },
    });

    if (!pricing) return { ...FREE_DEFAULTS };

    return {
      tier: pricing.tier,
      forYouLimit: pricing.forYouLimit,
      maxPendingBookings: pricing.maxPendingBookings,
      freeCancellationHours: pricing.freeCancellationHours,
      priorityBooking: pricing.priorityBooking,
      nearbySearch: pricing.nearbySearch,
      earlyAccess: pricing.earlyAccess,
      dedicatedSupport: pricing.dedicatedSupport,
    };
  }

  /**
   * Purchase a membership tier via QR payment
   * Rejects if user already has an active membership of the same or higher tier
   */
  async purchaseMembership(
    userId: string,
    tier: MembershipTier,
  ): Promise<MembershipPurchaseResponse> {
    // Check for existing active membership
    const existingActive = await this.prisma.hirerMembership.findFirst({
      where: {
        userId,
        status: MembershipStatus.ACTIVE,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingActive) {
      const existingOrder = TIER_ORDER[existingActive.tier];
      const requestedOrder = TIER_ORDER[tier];

      if (requestedOrder <= existingOrder) {
        throw new BadRequestException(
          `You already have an active ${existingActive.tier} membership. You can only upgrade to a higher tier.`,
        );
      }
    }

    // Get pricing for the requested tier
    const pricing = await this.prisma.membershipPricingTier.findUnique({
      where: { tier },
    });

    if (!pricing) {
      throw new BadRequestException(`Invalid membership tier: ${tier}`);
    }

    // Create PENDING membership record
    const membership = await this.prisma.hirerMembership.create({
      data: {
        userId,
        tier,
        status: MembershipStatus.PENDING,
        price: pricing.price,
      },
    });

    // Create QR payment request via wallet service
    const paymentData = await this.walletService.createMembershipPaymentRequest(
      userId,
      membership.id,
      pricing.price,
    );

    this.logger.log(
      `Membership purchase initiated: ${membership.id} (${tier}) for user ${userId}`,
    );

    return {
      membershipId: membership.id,
      tier: membership.tier,
      price: membership.price,
      paymentRequestId: paymentData.id,
      code: paymentData.code,
      qrUrl: paymentData.qrUrl,
      deeplinks: paymentData.deeplinks,
      accountInfo: paymentData.accountInfo,
      expiresAt: paymentData.expiresAt,
    };
  }

  /**
   * Activate a membership after payment is completed
   * If the user has an existing active membership, extend from current expiresAt
   */
  @OnEvent(WALLET_EVENTS.MEMBERSHIP_PAYMENT_COMPLETED)
  async activateMembership(event: MembershipPaymentCompletedEvent): Promise<void> {
    const membership = await this.prisma.hirerMembership.findUnique({
      where: { id: event.membershipId },
    });

    if (!membership) {
      this.logger.error(`Membership not found for activation: ${event.membershipId}`);
      return;
    }

    if (membership.status === MembershipStatus.ACTIVE) {
      this.logger.log(`Membership ${event.membershipId} already active`);
      return;
    }

    // Check for existing active membership to determine start date
    const existingActive = await this.prisma.hirerMembership.findFirst({
      where: {
        userId: membership.userId,
        status: MembershipStatus.ACTIVE,
        expiresAt: { gt: new Date() },
        id: { not: membership.id },
      },
    });

    const now = new Date();
    let startDate: Date;

    if (existingActive && existingActive.expiresAt) {
      // Extend from current membership's expiry
      startDate = existingActive.expiresAt;

      // Mark the old membership as expired since they're upgrading
      await this.prisma.hirerMembership.update({
        where: { id: existingActive.id },
        data: { status: MembershipStatus.EXPIRED },
      });

      this.logger.log(
        `Existing membership ${existingActive.id} expired due to upgrade`,
      );
    } else {
      startDate = now;
    }

    // Get duration from pricing tier
    const pricing = await this.prisma.membershipPricingTier.findUnique({
      where: { tier: membership.tier },
    });

    const durationDays = pricing?.durationDays || 30;
    const expiresAt = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

    await this.prisma.hirerMembership.update({
      where: { id: event.membershipId },
      data: {
        status: MembershipStatus.ACTIVE,
        startedAt: now,
        expiresAt,
      },
    });

    this.logger.log(
      `Membership ${event.membershipId} activated for user ${membership.userId} (${membership.tier}), expires at ${expiresAt.toISOString()}`,
    );
  }

  /**
   * Expire memberships that have passed their expiresAt date
   * Runs every hour
   */
  @Cron('0 * * * *')
  async expireMemberships(): Promise<void> {
    const result = await this.prisma.hirerMembership.updateMany({
      where: {
        status: MembershipStatus.ACTIVE,
        expiresAt: { lt: new Date() },
      },
      data: {
        status: MembershipStatus.EXPIRED,
      },
    });

    if (result.count > 0) {
      this.logger.log(`Expired ${result.count} memberships`);
    }
  }

  /**
   * Get membership history for a user
   */
  async getMembershipHistory(
    userId: string,
    limit = 10,
  ): Promise<ActiveMembershipResponse[]> {
    const memberships = await this.prisma.hirerMembership.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return memberships.map((m) => ({
      id: m.id,
      tier: m.tier,
      status: m.status,
      price: m.price,
      startedAt: m.startedAt?.toISOString() || null,
      expiresAt: m.expiresAt?.toISOString() || null,
      createdAt: m.createdAt.toISOString(),
    }));
  }
}
