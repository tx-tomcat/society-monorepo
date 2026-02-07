import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CacheService } from '../../cache/cache.service';
import { NotificationsService } from '../../notifications/services/notifications.service';
import { UserRole, UserStatus, BookingStatus, WithdrawalStatus, VerificationStatus, Prisma } from '@generated/client';
import {
  UserSearchDto,
  UpdateUserRoleDto,
  UpdateUserStatusDto,
  BroadcastNotificationDto,
  VerificationApprovalDto,
} from '../dto/admin.dto';
import {
  AdminUserInfo,
  AdminUserDetail,
  DashboardStats,
  SystemHealth,
  AuditLogEntry,
} from '../interfaces/admin.interface';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async searchUsers(filters: UserSearchDto): Promise<{ users: AdminUserInfo[]; total: number }> {
    const where: {
      OR?: Array<{ email?: { contains: string; mode: 'insensitive' }; phone?: { contains: string }; fullName?: { contains: string; mode: 'insensitive' } }>;
      status?: UserStatus;
      role?: UserRole;
      isVerified?: boolean;
    } = {};

    if (filters.query) {
      where.OR = [
        { email: { contains: filters.query, mode: 'insensitive' } },
        { phone: { contains: filters.query } },
        { fullName: { contains: filters.query, mode: 'insensitive' } },
      ];
    }

    if (filters.status) where.status = filters.status as UserStatus;
    if (filters.role) where.role = filters.role as UserRole;
    if (filters.verified !== undefined) {
      where.isVerified = filters.verified;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          companionProfile: true,
          hirerProfile: true,
        },
        orderBy: { [filters.sortBy || 'createdAt']: filters.sortOrder || 'desc' },
        take: filters.limit || 20,
        skip: filters.offset || 0,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        phone: u.phone,
        role: u.role,
        status: u.status,
        fullName: u.fullName,
        isVerified: u.isVerified,
        hasProfile: u.role === UserRole.COMPANION ? !!u.companionProfile : !!(u.gender && u.dateOfBirth),
        createdAt: u.createdAt,
        lastLoginAt: null,
      })),
      total,
    };
  }

  async getUserDetail(userId: string): Promise<AdminUserDetail> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        companionProfile: true,
        hirerProfile: true,
        hirerBookings: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        companionBookings: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get moderation stats
    const [reportCount, warningCount] = await Promise.all([
      this.prisma.moderationQueue.count({ where: { userId } }),
      this.prisma.moderationAction.count({
        where: {
          queue: { userId },
          action: 'WARN',
        },
      }),
    ]);

    // Calculate booking stats
    const bookings = user.role === UserRole.COMPANION ? user.companionBookings : user.hirerBookings;
    const completedBookings = bookings.filter(b => b.status === BookingStatus.COMPLETED).length;

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      fullName: user.fullName,
      isVerified: user.isVerified,
      trustScore: user.trustScore,
      createdAt: user.createdAt,
      lastLoginAt: null,
      profile: user.role === UserRole.COMPANION && user.companionProfile
        ? {
            bio: user.companionProfile.bio,
            photos: [], // Photos are in a separate CompanionPhoto table
            hourlyRate: user.companionProfile.hourlyRate,
            ratingAvg: Number(user.companionProfile.ratingAvg),
            ratingCount: user.companionProfile.ratingCount,
            totalBookings: user.companionProfile.totalBookings,
            completedBookings: user.companionProfile.completedBookings,
          }
        : null,
      stats: {
        totalBookings: bookings.length,
        completedBookings,
        reports: reportCount,
        warnings: warningCount,
      },
    };
  }

  async updateUserRole(adminId: string, userId: string, dto: UpdateUserRoleDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { role: dto.role as UserRole },
    });

    await this.createAuditLog(adminId, 'UPDATE_USER_ROLE', 'user', userId, {
      newRole: dto.role,
    });

    return { success: true, role: user.role };
  }

  async updateUserStatus(adminId: string, userId: string, dto: UpdateUserStatusDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { status: dto.status as UserStatus },
    });

    await this.createAuditLog(adminId, 'UPDATE_USER_STATUS', 'user', userId, {
      newStatus: dto.status,
      reason: dto.reason,
    });

    return { success: true, status: user.status };
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const cacheKey = 'admin_dashboard_stats';
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached as string);
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      activeUsers,
      newToday,
      newThisWeek,
      newThisMonth,
      companions,
      hirers,
      pendingVerifications,
      verifiedUsers,
      rejectedVerifications,
      totalBookings,
      completedBookings,
      bookingsToday,
      pendingWithdrawals,
      pendingReports,
      pendingAppeals,
      activeSuspensions,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
      this.prisma.user.count({ where: { createdAt: { gte: today } } }),
      this.prisma.user.count({ where: { createdAt: { gte: weekAgo } } }),
      this.prisma.user.count({ where: { createdAt: { gte: monthAgo } } }),
      this.prisma.user.count({ where: { role: UserRole.COMPANION } }),
      this.prisma.user.count({ where: { role: UserRole.HIRER } }),
      this.prisma.verification.count({ where: { status: 'PENDING' } }),
      this.prisma.user.count({ where: { isVerified: true } }),
      this.prisma.verification.count({ where: { status: 'FAILED' } }),
      this.prisma.booking.count(),
      this.prisma.booking.count({ where: { status: BookingStatus.COMPLETED } }),
      this.prisma.booking.count({ where: { createdAt: { gte: today } } }),
      this.prisma.withdrawal.count({ where: { status: WithdrawalStatus.PENDING } }),
      this.prisma.moderationQueue.count({ where: { status: 'PENDING' } }),
      this.prisma.appeal.count({ where: { status: 'PENDING' } }),
      this.prisma.userSuspension.count({
        where: { liftedAt: null, OR: [{ isPermanent: true }, { suspendedUntil: { gte: now } }] },
      }),
    ]);

    // Calculate revenue from completed bookings
    const revenueData = await this.prisma.booking.aggregate({
      where: {
        status: BookingStatus.COMPLETED,
        completedAt: { gte: monthAgo },
      },
      _sum: { platformFee: true },
    });

    const stats: DashboardStats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        newToday,
        newThisWeek,
        newThisMonth,
        companions,
        hirers,
      },
      verifications: {
        pending: pendingVerifications,
        verified: verifiedUsers,
        rejected: rejectedVerifications,
      },
      bookings: {
        total: totalBookings,
        completed: completedBookings,
        today: bookingsToday,
        revenue30Days: revenueData._sum.platformFee || 0,
      },
      withdrawals: {
        pending: pendingWithdrawals,
      },
      moderation: {
        pendingReports,
        pendingAppeals,
        activeSuspensions,
      },
    };

    await this.cacheService.set(cacheKey, JSON.stringify(stats), 300); // 5 min cache
    return stats;
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const dbStart = Date.now();
    await this.prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;

    await this.cacheService.get('health_check_test');
    const hitRate = 0.85; // TODO: Calculate actual hit rate

    return {
      database: {
        status: dbLatency < 100 ? 'healthy' : dbLatency < 500 ? 'degraded' : 'down',
        latency: dbLatency,
      },
      cache: {
        status: 'healthy',
        hitRate,
      },
      storage: {
        status: 'healthy',
        usedSpace: 0,
      },
      services: [
        { name: 'API', status: 'healthy', lastCheck: new Date() },
        { name: 'Database', status: dbLatency < 500 ? 'healthy' : 'degraded', lastCheck: new Date() },
        { name: 'Cache', status: 'healthy', lastCheck: new Date() },
        { name: 'Storage', status: 'healthy', lastCheck: new Date() },
      ],
    };
  }

  async broadcastNotification(adminId: string, dto: BroadcastNotificationDto) {
    let userIds: string[] = [];

    if (dto.userIds && dto.userIds.length > 0) {
      userIds = dto.userIds;
    } else {
      const where: { role?: UserRole; isVerified?: boolean } = {};
      switch (dto.targetAudience) {
        case 'companion':
          where.role = UserRole.COMPANION;
          break;
        case 'hirer':
          where.role = UserRole.HIRER;
          break;
        case 'verified':
          where.isVerified = true;
          break;
        // 'all' - no filter
      }

      const users = await this.prisma.user.findMany({
        where,
        select: { id: true },
      });
      userIds = users.map((u) => u.id);
    }

    // Send notifications in batches
    const batchSize = 100;
    let sent = 0;

    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      await Promise.all(
        batch.map((userId) =>
          this.notificationsService.send({
            userId,
            type: 'SYSTEM',
            title: dto.title,
            body: dto.body,
          }),
        ),
      );
      sent += batch.length;
    }

    await this.createAuditLog(adminId, 'BROADCAST_NOTIFICATION', 'notification', null, {
      title: dto.title,
      targetAudience: dto.targetAudience,
      recipientCount: sent,
    });

    return { success: true, sent };
  }

  async getPendingVerifications() {
    const verifications = await this.prisma.verification.findMany({
      where: { status: 'PENDING' },
      include: {
        user: {
          include: {
            companionProfile: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return verifications.map((v) => ({
      id: v.id,
      userId: v.userId,
      userName: v.user.fullName || v.user.email,
      type: v.type,
      provider: v.provider,
      metadata: v.metadata,
      createdAt: v.createdAt,
    }));
  }

  async approveVerification(
    adminId: string,
    verificationId: string,
    dto: VerificationApprovalDto,
  ) {
    const verification = await this.prisma.verification.findUnique({
      where: { id: verificationId },
    });

    if (!verification) {
      throw new NotFoundException('Verification not found');
    }

    await this.prisma.verification.update({
      where: { id: verificationId },
      data: {
        status: dto.approved ? 'VERIFIED' : 'FAILED',
        verifiedAt: dto.approved ? new Date() : null,
      },
    });

    // Update user's verified status if approved
    if (dto.approved) {
      await this.prisma.user.update({
        where: { id: verification.userId },
        data: { isVerified: true },
      });
    }

    await this.createAuditLog(
      adminId,
      dto.approved ? 'APPROVE_VERIFICATION' : 'REJECT_VERIFICATION',
      'verification',
      verificationId,
      { userId: verification.userId, reason: dto.rejectionReason },
    );

    return { success: true };
  }

  // ============================================
  // Photo Verification Review
  // ============================================

  async getPendingPhotoVerifications() {
    const verifications = await this.prisma.photoVerification.findMany({
      where: { status: VerificationStatus.PENDING },
      include: {
        user: {
          include: {
            companionProfile: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return verifications.map((v) => ({
      id: v.id,
      userId: v.userId,
      userName: v.user.fullName || v.user.email,
      idFrontUrl: v.photoUrl,
      idBackUrl: v.idBackUrl,
      selfieUrl: v.selfieUrl,
      companionDisplayName: v.user.companionProfile?.displayName ?? null,
      createdAt: v.createdAt,
    }));
  }

  async reviewPhotoVerification(
    adminId: string,
    verificationId: string,
    dto: VerificationApprovalDto,
  ) {
    const verification = await this.prisma.photoVerification.findUnique({
      where: { id: verificationId },
    });

    if (!verification) {
      throw new NotFoundException('Photo verification not found');
    }

    if (verification.status !== VerificationStatus.PENDING) {
      throw new BadRequestException('This verification has already been reviewed');
    }

    const newStatus = dto.approved
      ? VerificationStatus.VERIFIED
      : VerificationStatus.FAILED;

    // Update PhotoVerification record
    await this.prisma.photoVerification.update({
      where: { id: verificationId },
      data: {
        status: newStatus,
        failureReason: dto.approved ? null : (dto.rejectionReason ?? null),
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
    });

    // Update CompanionProfile verificationStatus
    const companionProfile = await this.prisma.companionProfile.findFirst({
      where: { userId: verification.userId },
    });

    if (companionProfile) {
      await this.prisma.companionProfile.update({
        where: { id: companionProfile.id },
        data: { verificationStatus: newStatus },
      });
    }

    // If approved, mark user as verified
    if (dto.approved) {
      await this.prisma.user.update({
        where: { id: verification.userId },
        data: { isVerified: true },
      });

      // Send notification
      await this.notificationsService.send({
        userId: verification.userId,
        type: 'SYSTEM',
        title: 'Identity Verified',
        body: 'Your identity has been verified. You now have a verified badge on your profile!',
      });
    } else {
      // Send rejection notification
      await this.notificationsService.send({
        userId: verification.userId,
        type: 'SYSTEM',
        title: 'Verification Not Approved',
        body: dto.rejectionReason
          ? `Your verification was not approved: ${dto.rejectionReason}`
          : 'Your verification was not approved. Please resubmit with clearer photos.',
      });
    }

    await this.createAuditLog(
      adminId,
      dto.approved ? 'APPROVE_PHOTO_VERIFICATION' : 'REJECT_PHOTO_VERIFICATION',
      'photo_verification',
      verificationId,
      { userId: verification.userId, reason: dto.rejectionReason },
    );

    return { success: true };
  }

  async getPendingWithdrawals() {
    const withdrawals = await this.prisma.withdrawal.findMany({
      where: { status: WithdrawalStatus.PENDING },
      include: {
        bankAccount: {
          include: {
            companion: {
              include: {
                user: true,
              },
            },
          },
        },
      },
      orderBy: { requestedAt: 'asc' },
    });

    return withdrawals.map((w) => ({
      id: w.id,
      companionId: w.companionId,
      companionName: w.bankAccount.companion.user.fullName,
      amount: w.amount,
      bankAccount: {
        bankName: w.bankAccount.bankName,
        accountNumber: this.maskAccountNumber(w.bankAccount.accountNumber),
        accountHolder: w.bankAccount.accountHolder,
      },
      requestedAt: w.requestedAt,
    }));
  }

  async approveWithdrawal(adminId: string, withdrawalId: string) {
    const withdrawal = await this.prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
    });

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found');
    }

    await this.prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: WithdrawalStatus.COMPLETED,
        completedAt: new Date(),
      },
    });

    await this.createAuditLog(adminId, 'APPROVE_WITHDRAWAL', 'withdrawal', withdrawalId, {
      amount: withdrawal.amount,
    });

    return { success: true };
  }

  async rejectWithdrawal(adminId: string, withdrawalId: string, reason: string) {
    const withdrawal = await this.prisma.withdrawal.findUnique({
      where: { id: withdrawalId },
    });

    if (!withdrawal) {
      throw new NotFoundException('Withdrawal not found');
    }

    // Note: FAILED status is used for rejected withdrawals in the schema
    await this.prisma.withdrawal.update({
      where: { id: withdrawalId },
      data: {
        status: WithdrawalStatus.FAILED,
        completedAt: new Date(),
      },
    });

    await this.createAuditLog(adminId, 'REJECT_WITHDRAWAL', 'withdrawal', withdrawalId, {
      amount: withdrawal.amount,
      reason,
    });

    return { success: true };
  }

  async getAuditLogs(limit = 50, offset = 0): Promise<AuditLogEntry[]> {
    const logs = await this.prisma.adminAuditLog.findMany({
      include: {
        admin: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return logs.map((l) => ({
      id: l.id,
      adminId: l.adminId,
      adminName: l.admin.fullName || l.admin.email,
      action: l.action,
      targetType: l.resourceType,
      targetId: l.resourceId,
      details: l.newValue,
      ipAddress: l.ipAddress,
      createdAt: l.createdAt,
    }));
  }

  private maskAccountNumber(accountNumber: string): string {
    if (accountNumber.length <= 4) return accountNumber;
    return '*'.repeat(accountNumber.length - 4) + accountNumber.slice(-4);
  }

  private async createAuditLog(
    adminId: string,
    action: string,
    resourceType: string,
    resourceId: string | null,
    details: object,
    ipAddress?: string,
  ) {
    await this.prisma.adminAuditLog.create({
      data: {
        adminId,
        action,
        resourceType,
        resourceId,
        newValue: details as Prisma.InputJsonValue,
        ipAddress,
      },
    });
  }
}
