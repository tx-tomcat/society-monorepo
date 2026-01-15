import { Injectable, Logger } from '@nestjs/common';
import { VerificationStatus } from '@generated/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CacheService } from '../../cache/cache.service';
import { FraudRiskLevel, ReportFraudDto } from '../dto/security.dto';
import { RiskAssessment, RiskFactor, FraudReportInfo } from '../interfaces/security.interface';

interface UserBehavior {
  bookingsLastDay: number;
  cancellationsLastWeek: number;
  accountAge: number; // days
  isVerified: boolean;
  trustScore: number;
  deviceCount: number;
  disputeCount: number;
}

@Injectable()
export class FraudDetectionService {
  private readonly logger = new Logger(FraudDetectionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
  ) {}

  async assessRisk(userId: string): Promise<RiskAssessment> {
    const behavior = await this.getUserBehavior(userId);
    const factors: RiskFactor[] = [];

    // Account age factor
    if (behavior.accountAge < 1) {
      factors.push({
        name: 'new_account',
        score: 30,
        weight: 1,
        description: 'Account created within the last 24 hours',
      });
    } else if (behavior.accountAge < 7) {
      factors.push({
        name: 'new_account',
        score: 15,
        weight: 0.8,
        description: 'Account created within the last week',
      });
    }

    // Verification status
    if (!behavior.isVerified) {
      factors.push({
        name: 'unverified',
        score: 20,
        weight: 0.9,
        description: 'User has not completed verification',
      });
    }

    // Trust score
    if (behavior.trustScore < 50) {
      factors.push({
        name: 'low_trust_score',
        score: 30,
        weight: 1,
        description: 'User has low trust score',
      });
    }

    // Cancellation pattern
    if (behavior.cancellationsLastWeek > 3) {
      factors.push({
        name: 'high_cancellation',
        score: 35,
        weight: 0.9,
        description: 'High number of booking cancellations',
      });
    }

    // Disputes
    if (behavior.disputeCount > 0) {
      factors.push({
        name: 'has_disputes',
        score: Math.min(behavior.disputeCount * 20, 60),
        weight: 1.1,
        description: `User has ${behavior.disputeCount} dispute(s)`,
      });
    }

    // Device count
    if (behavior.deviceCount > 5) {
      factors.push({
        name: 'multiple_devices',
        score: 25,
        weight: 0.7,
        description: 'Logged in from many devices',
      });
    }

    // Calculate overall score
    const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0) || 1;
    const weightedScore = factors.reduce((sum, f) => sum + f.score * f.weight, 0);
    const overallScore = Math.min(Math.round(weightedScore / totalWeight), 100);

    // Determine risk level
    let riskLevel: FraudRiskLevel;
    if (overallScore >= 70) {
      riskLevel = FraudRiskLevel.CRITICAL;
    } else if (overallScore >= 50) {
      riskLevel = FraudRiskLevel.HIGH;
    } else if (overallScore >= 30) {
      riskLevel = FraudRiskLevel.MEDIUM;
    } else {
      riskLevel = FraudRiskLevel.LOW;
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (riskLevel === FraudRiskLevel.CRITICAL) {
      recommendations.push('Immediate account review required');
      recommendations.push('Consider temporary suspension');
    } else if (riskLevel === FraudRiskLevel.HIGH) {
      recommendations.push('Manual review recommended');
      recommendations.push('Monitor user activity closely');
    } else if (riskLevel === FraudRiskLevel.MEDIUM) {
      recommendations.push('Enhanced verification may be needed');
    }

    return {
      userId,
      overallRisk: riskLevel,
      riskScore: overallScore,
      factors,
      recommendations,
    };
  }

  async reportFraud(
    reporterId: string,
    dto: ReportFraudDto,
  ): Promise<FraudReportInfo> {
    // Create a security event for the fraud report
    const event = await this.prisma.securityEvent.create({
      data: {
        userId: dto.userId,
        eventType: 'fraud_report',
        ipAddress: '',
        userAgent: '',
        details: {
          reportedBy: reporterId,
          riskLevel: dto.riskLevel,
          fraudType: dto.fraudType,
          description: dto.description,
          evidence: dto.evidence,
        },
        severity: dto.riskLevel === FraudRiskLevel.CRITICAL ? 'critical' : 'warning',
      },
    });

    this.logger.warn(`Fraud report created for user ${dto.userId} by ${reporterId}`);

    // Get user name for response
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { fullName: true },
    });

    return {
      id: event.id,
      userId: dto.userId,
      userName: user?.fullName || null,
      riskLevel: dto.riskLevel,
      fraudType: dto.fraudType,
      description: dto.description,
      evidence: dto.evidence || {},
      status: 'PENDING',
      reviewedBy: null,
      createdAt: event.createdAt,
      reviewedAt: null,
    };
  }

  async getPendingFraudReports(): Promise<FraudReportInfo[]> {
    // Return fraud-related security events
    const events = await this.prisma.securityEvent.findMany({
      where: { eventType: 'fraud_report' },
      include: {
        user: {
          select: { fullName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return events.map((e) => {
      const details = e.details as Record<string, unknown>;
      return {
        id: e.id,
        userId: e.userId || '',
        userName: e.user?.fullName || null,
        riskLevel: (details.riskLevel as FraudRiskLevel) || FraudRiskLevel.LOW,
        fraudType: (details.fraudType as string) || 'unknown',
        description: (details.description as string) || '',
        evidence: (details.evidence as Record<string, unknown>) || {},
        status: (details.reviewed as boolean) ? 'REVIEWED' : 'PENDING',
        reviewedBy: (details.reviewerId as string) || null,
        createdAt: e.createdAt,
        reviewedAt: details.reviewedAt ? new Date(details.reviewedAt as string) : null,
      };
    });
  }

  async reviewFraudReport(
    reportId: string,
    reviewerId: string,
    approved: boolean,
    notes?: string,
  ) {
    const event = await this.prisma.securityEvent.findUnique({
      where: { id: reportId },
    });

    if (event) {
      const existingDetails = event.details as Record<string, unknown>;
      await this.prisma.securityEvent.update({
        where: { id: reportId },
        data: {
          details: {
            ...existingDetails,
            reviewed: true,
            reviewerId,
            reviewedAt: new Date().toISOString(),
            decision: approved ? 'confirmed' : 'dismissed',
            notes,
          },
        },
      });
    }

    return { success: true };
  }

  async detectSuspiciousPatterns(userId: string): Promise<string[]> {
    const patterns: string[] = [];
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Check for excessive cancellations
    const cancellations = await this.prisma.booking.count({
      where: {
        OR: [{ hirerId: userId }, { companionId: userId }],
        status: 'CANCELLED',
        updatedAt: { gte: weekAgo },
      },
    });

    if (cancellations >= 5) {
      patterns.push('excessive_cancellations');
    }

    // Check for disputes
    const disputes = await this.prisma.booking.count({
      where: {
        OR: [{ hirerId: userId }, { companionId: userId }],
        status: 'DISPUTED',
      },
    });

    if (disputes >= 2) {
      patterns.push('multiple_disputes');
    }

    // Check for security events
    const securityEvents = await this.prisma.securityEvent.count({
      where: {
        userId,
        severity: { in: ['warning', 'critical'] },
        createdAt: { gte: dayAgo },
      },
    });

    if (securityEvents > 5) {
      patterns.push('multiple_security_events');
    }

    // Check for failed payment attempts
    const failedPayments = await this.prisma.payment.count({
      where: {
        userId,
        status: 'FAILED',
        createdAt: { gte: weekAgo },
      },
    });

    if (failedPayments >= 3) {
      patterns.push('multiple_failed_payments');
    }

    return patterns;
  }

  private async getUserBehavior(userId: string): Promise<UserBehavior> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return {
        bookingsLastDay: 0,
        cancellationsLastWeek: 0,
        accountAge: 0,
        isVerified: false,
        trustScore: 0,
        deviceCount: 0,
        disputeCount: 0,
      };
    }

    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const accountAgeMs = Date.now() - user.createdAt.getTime();
    const accountAgeDays = accountAgeMs / (1000 * 60 * 60 * 24);

    // Get bookings count in last day
    const bookingCount = await this.prisma.booking.count({
      where: {
        OR: [{ hirerId: userId }, { companionId: userId }],
        createdAt: { gte: dayAgo },
      },
    });

    // Get cancellations in last week
    const cancellationCount = await this.prisma.booking.count({
      where: {
        OR: [{ hirerId: userId }, { companionId: userId }],
        status: 'CANCELLED',
        updatedAt: { gte: weekAgo },
      },
    });

    // Get dispute count
    const disputeCount = await this.prisma.booking.count({
      where: {
        OR: [{ hirerId: userId }, { companionId: userId }],
        status: 'DISPUTED',
      },
    });

    // Get device count from security events
    const deviceEvents = await this.prisma.securityEvent.findMany({
      where: { userId, eventType: 'device_login' },
      select: { details: true },
      distinct: ['details'],
      take: 20,
    });

    // Check verification status
    const verification = await this.prisma.verification.findFirst({
      where: { userId, status: VerificationStatus.VERIFIED },
    });

    return {
      bookingsLastDay: bookingCount,
      cancellationsLastWeek: cancellationCount,
      accountAge: accountAgeDays,
      isVerified: !!verification,
      trustScore: user.trustScore ?? 100,
      deviceCount: deviceEvents.length,
      disputeCount,
    };
  }
}
