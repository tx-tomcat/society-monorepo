import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";
import { CacheService } from "../../cache/cache.service";
import {
  BlockIpDto,
  SecurityEventFilterDto,
  SecurityEventType,
} from "../dto/security.dto";
import {
  BlockedIpInfo,
  SecurityConfig,
  SecurityEventInfo,
  SecurityMetrics,
  SessionInfo,
} from "../interfaces/security.interface";
import { FraudDetectionService } from "./fraud-detection.service";
import { RateLimiterService } from "./rate-limiter.service";

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly rateLimiterService: RateLimiterService,
    private readonly fraudDetectionService: FraudDetectionService
  ) {}

  async logSecurityEvent(
    eventType: SecurityEventType,
    userId: string | null,
    ip: string | null,
    userAgent: string | null,
    details: Record<string, unknown> = {}
  ): Promise<void> {
    const severity = this.calculateEventSeverity(eventType, details);

    await this.prisma.securityEvent.create({
      data: {
        userId,
        eventType,
        ipAddress: ip || '',
        userAgent: userAgent || '',
        details: details as object,
        severity,
      },
    });

    // Alert on high-risk events
    if (severity === "critical") {
      this.logger.warn(
        `High-risk security event: ${eventType} - ${JSON.stringify(details)}`
      );
    }
  }

  async getSecurityEvents(
    filters: SecurityEventFilterDto
  ): Promise<SecurityEventInfo[]> {
    const events = await this.prisma.securityEvent.findMany({
      where: {
        ...(filters.userId && { userId: filters.userId }),
        ...(filters.eventType && { eventType: filters.eventType }),
        ...(filters.ip && { ipAddress: filters.ip }),
        ...(filters.startDate && { createdAt: { gte: filters.startDate } }),
        ...(filters.endDate && { createdAt: { lte: filters.endDate } }),
      },
      include: {
        user: { select: { fullName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: filters.limit || 50,
      skip: filters.offset || 0,
    });

    return events.map((e) => ({
      id: e.id,
      userId: e.userId,
      userName: e.user?.fullName || null,
      eventType: e.eventType,
      ip: e.ipAddress,
      userAgent: e.userAgent,
      details: e.details as Record<string, unknown>,
      riskScore: this.severityToScore(e.severity),
      createdAt: e.createdAt,
    }));
  }

  async blockIp(adminId: string, dto: BlockIpDto): Promise<BlockedIpInfo> {
    const blockedUntil = dto.durationHours
      ? new Date(Date.now() + dto.durationHours * 60 * 60 * 1000)
      : null;

    // Check if already exists
    const existing = await this.prisma.ipBlocklist.findFirst({
      where: { ipAddress: dto.ip },
    });

    let blocked;
    if (existing) {
      blocked = await this.prisma.ipBlocklist.update({
        where: { id: existing.id },
        data: {
          reason: dto.reason,
          blockedBy: adminId,
          blockedUntil,
        },
      });
    } else {
      blocked = await this.prisma.ipBlocklist.create({
        data: {
          ipAddress: dto.ip,
          reason: dto.reason,
          blockedBy: adminId,
          blockedUntil,
        },
      });
    }

    // Clear from cache
    await this.cacheService.del(`ip:allowed:${dto.ip}`);

    this.logger.log(`IP blocked: ${dto.ip} by admin ${adminId}`);

    return {
      ip: blocked.ipAddress,
      reason: blocked.reason,
      blockedBy: blocked.blockedBy,
      blockedAt: blocked.createdAt,
      expiresAt: blocked.blockedUntil,
      isPermanent: !blocked.blockedUntil,
    };
  }

  async unblockIp(ip: string): Promise<void> {
    const blocked = await this.prisma.ipBlocklist.findFirst({
      where: { ipAddress: ip },
    });

    if (blocked) {
      await this.prisma.ipBlocklist.delete({ where: { id: blocked.id } });
    }

    await this.cacheService.del(`ip:blocked:${ip}`);
    this.logger.log(`IP unblocked: ${ip}`);
  }

  async isIpBlocked(ip: string): Promise<boolean> {
    // Check cache first
    const cached = await this.cacheService.get<boolean>(`ip:blocked:${ip}`);
    if (cached !== null) return cached;

    const blocked = await this.prisma.ipBlocklist.findFirst({
      where: { ipAddress: ip },
    });

    if (!blocked) {
      await this.cacheService.set(`ip:blocked:${ip}`, false, 300);
      return false;
    }

    // Check if expired
    if (blocked.blockedUntil && blocked.blockedUntil < new Date()) {
      await this.prisma.ipBlocklist.delete({ where: { id: blocked.id } });
      await this.cacheService.set(`ip:blocked:${ip}`, false, 300);
      return false;
    }

    await this.cacheService.set(`ip:blocked:${ip}`, true, 300);
    return true;
  }

  async getBlockedIps(): Promise<BlockedIpInfo[]> {
    const blocked = await this.prisma.ipBlocklist.findMany({
      orderBy: { createdAt: "desc" },
    });

    return blocked.map((b) => ({
      ip: b.ipAddress,
      reason: b.reason,
      blockedBy: b.blockedBy,
      blockedAt: b.createdAt,
      expiresAt: b.blockedUntil,
      isPermanent: !b.blockedUntil,
    }));
  }

  async getSecurityMetrics(): Promise<SecurityMetrics> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      loginAttempts,
      failedLogins,
      blockedIps,
      suspiciousActivities,
      pendingFraudReports,
    ] = await Promise.all([
      this.prisma.securityEvent.count({
        where: { eventType: "login", createdAt: { gte: today } },
      }),
      this.prisma.securityEvent.count({
        where: { eventType: "login_failed", createdAt: { gte: today } },
      }),
      this.prisma.ipBlocklist.count(),
      this.prisma.securityEvent.count({
        where: {
          severity: { in: ["warning", "critical"] },
          createdAt: { gte: today },
        },
      }),
      this.prisma.securityEvent.count({
        where: { eventType: "fraud_report" },
      }),
    ]);

    return {
      loginAttemptsToday: loginAttempts,
      failedLoginsToday: failedLogins,
      blockedIps,
      activeSessions: 0, // Would need session tracking to implement
      suspiciousActivities,
      fraudReportsPending: pendingFraudReports,
    };
  }

  async getUserSessions(userId: string): Promise<SessionInfo[]> {
    // This would need a session tracking system to implement properly
    // For now, return empty array
    return [];
  }

  async terminateSession(userId: string, sessionId: string): Promise<void> {
    // This would need a session tracking system to implement properly
    this.logger.log(`Session terminated: ${sessionId} for user ${userId}`);
  }

  async terminateAllSessions(userId: string): Promise<void> {
    // This would need a session tracking system to implement properly
    this.logger.log(`All sessions terminated for user ${userId}`);
  }

  async getSecurityConfig(): Promise<SecurityConfig> {
    return {
      maxLoginAttempts: 5,
      lockoutDurationSeconds: 300,
      requireStrongPassword: true,
      enableTwoFactor: false,
      allowedOrigins: ["*"],
      rateLimits: await this.rateLimiterService.getLimits(),
    };
  }

  private calculateEventSeverity(
    eventType: SecurityEventType,
    details: Record<string, unknown>
  ): string {
    switch (eventType) {
      case SecurityEventType.LOGIN_FAILURE:
        const consecutiveFailures = typeof details.consecutiveFailures === 'number' ? details.consecutiveFailures : 0;
        return consecutiveFailures >= 5 ? "critical" : "warning";
      case SecurityEventType.SUSPICIOUS_ACTIVITY:
        return "warning";
      case SecurityEventType.ACCOUNT_LOCKOUT:
        return "critical";
      case SecurityEventType.PASSWORD_CHANGE:
        return details.suspicious ? "warning" : "info";
      case SecurityEventType.FRAUD_DETECTED:
        return "critical";
      default:
        return "info";
    }
  }

  private severityToScore(severity: string): number {
    switch (severity) {
      case "critical":
        return 90;
      case "warning":
        return 60;
      case "info":
      default:
        return 10;
    }
  }
}
