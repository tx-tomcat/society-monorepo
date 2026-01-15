import {
    BadRequestException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
import { AppealStatus, ModerationStatus as PrismaModerationStatus, User } from '@generated/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
    AppealDto,
    BulkModerationDto,
    LiftSuspensionDto,
    ModerationActionDto,
    ModerationActionType,
    ModerationContentType,
    ModerationQueueFilterDto,
    ReportContentDto,
    ReportUserDto,
    ReviewAppealDto,
    SuspendUserDto
} from '../dto/moderation.dto';
import {
    AppealInfo,
    ModerationActionInfo,
    ModerationQueueItem,
    ModerationStats,
    SuspensionInfo,
    UserReportInfo,
} from '../interfaces/moderation.interface';
import { ContentReviewService } from './content-review.service';

// Helper to get display name from user
function getDisplayName(user: Pick<User, 'fullName'> | null): string | null {
  return user?.fullName || null;
}

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly contentReviewService: ContentReviewService,
  ) {}

  async reportUser(reporterId: string, dto: ReportUserDto): Promise<UserReportInfo> {
    // Check reported user exists
    const reportedUser = await this.prisma.user.findUnique({
      where: { id: dto.reportedUserId },
      select: { id: true, fullName: true },
    });

    if (!reportedUser) {
      throw new NotFoundException('User not found');
    }

    if (reporterId === dto.reportedUserId) {
      throw new BadRequestException('Cannot report yourself');
    }

    // Create report in moderation queue
    const queueItem = await this.prisma.moderationQueue.create({
      data: {
        contentType: dto.contentType || 'PROFILE',
        contentId: dto.reportedUserId,
        userId: dto.reportedUserId,
        priority: 5, // Medium priority for user reports
        flags: [dto.reason],
        status: PrismaModerationStatus.PENDING,
      },
    });

    // Get reporter info
    const reporter = await this.prisma.user.findUnique({
      where: { id: reporterId },
      select: { fullName: true },
    });

    this.logger.log(`User ${reporterId} reported user ${dto.reportedUserId}`);

    return {
      id: queueItem.id,
      reporterId: reporterId,
      reporterName: reporter?.fullName || null,
      reportedUserId: dto.reportedUserId,
      reportedUserName: reportedUser.fullName,
      reason: dto.reason,
      description: dto.description || null,
      status: 'PENDING',
      createdAt: queueItem.createdAt,
    };
  }

  async reportContent(reporterId: string, dto: ReportContentDto) {
    // Create moderation queue item
    const queueItem = await this.prisma.moderationQueue.create({
      data: {
        contentType: dto.contentType,
        contentId: dto.contentId,
        userId: reporterId, // Will be updated to actual content owner
        priority: 3,
        flags: [dto.reason],
        status: PrismaModerationStatus.PENDING,
      },
    });

    return { id: queueItem.id, message: 'Content reported for review' };
  }

  async getModerationQueue(
    filters: ModerationQueueFilterDto,
  ): Promise<ModerationQueueItem[]> {
    const items = await this.prisma.moderationQueue.findMany({
      where: {
        ...(filters.contentType && { contentType: filters.contentType }),
        ...(filters.status && { status: filters.status as PrismaModerationStatus }),
        ...(filters.minPriority !== undefined && { priority: { gte: filters.minPriority } }),
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
      take: filters.limit || 50,
      skip: filters.offset || 0,
    });

    // Fetch users for all items
    const userIds = items.map(item => item.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, fullName: true, email: true },
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    return items.map((item) => {
      const user = userMap.get(item.userId);
      return {
        id: item.id,
        contentType: item.contentType,
        contentId: item.contentId,
        userId: item.userId,
        userName: user?.fullName || null,
        userEmail: user?.email || null,
        priority: item.priority,
        flags: item.flags as string[],
        status: item.status,
        assignedTo: item.assignedTo,
        createdAt: item.createdAt,
      };
    });
  }

  async getQueueItem(queueId: string): Promise<ModerationQueueItem & { actions: ModerationActionInfo[] }> {
    const item = await this.prisma.moderationQueue.findUnique({
      where: { id: queueId },
      include: {
        actions: true,
      },
    });

    if (!item) {
      throw new NotFoundException('Queue item not found');
    }

    // Fetch the user
    const user = await this.prisma.user.findUnique({
      where: { id: item.userId },
      select: { fullName: true, email: true },
    });

    // Fetch moderator names for actions
    const moderatorIds = item.actions.map(a => a.moderatorId);
    const moderators = await this.prisma.user.findMany({
      where: { id: { in: moderatorIds } },
      select: { id: true, fullName: true },
    });
    const moderatorMap = new Map(moderators.map(m => [m.id, m]));

    return {
      id: item.id,
      contentType: item.contentType,
      contentId: item.contentId,
      userId: item.userId,
      userName: user?.fullName || null,
      userEmail: user?.email || null,
      priority: item.priority,
      flags: item.flags as string[],
      status: item.status,
      assignedTo: item.assignedTo,
      createdAt: item.createdAt,
      actions: item.actions.map((a) => ({
        id: a.id,
        queueId: a.queueId,
        moderatorId: a.moderatorId,
        moderatorName: moderatorMap.get(a.moderatorId)?.fullName || null,
        action: a.action,
        reason: a.reason,
        notes: a.notes,
        createdAt: a.createdAt,
      })),
    };
  }

  async takeAction(
    moderatorId: string,
    queueId: string,
    dto: ModerationActionDto,
  ): Promise<ModerationActionInfo> {
    const queueItem = await this.prisma.moderationQueue.findUnique({
      where: { id: queueId },
    });

    if (!queueItem) {
      throw new NotFoundException('Queue item not found');
    }

    // Create action record
    const action = await this.prisma.moderationAction.create({
      data: {
        queueId,
        moderatorId,
        action: dto.action,
        reason: dto.reason,
        notes: dto.notes,
      },
    });

    // Fetch moderator name
    const moderator = await this.prisma.user.findUnique({
      where: { id: moderatorId },
      select: { fullName: true },
    });

    // Update queue status based on action
    let newStatus: PrismaModerationStatus;
    switch (dto.action) {
      case ModerationActionType.APPROVE:
        newStatus = PrismaModerationStatus.APPROVED;
        break;
      case ModerationActionType.REJECT:
      case ModerationActionType.WARN:
      case ModerationActionType.SUSPEND:
      case ModerationActionType.BAN:
        newStatus = PrismaModerationStatus.REJECTED;
        break;
      default:
        newStatus = PrismaModerationStatus.IN_REVIEW;
    }

    await this.prisma.moderationQueue.update({
      where: { id: queueId },
      data: { status: newStatus },
    });

    // Execute action side effects
    if (dto.action === ModerationActionType.SUSPEND) {
      await this.suspendUser(moderatorId, queueItem.userId, {
        reason: dto.reason || 'Suspended due to content violation',
      });
    } else if (dto.action === ModerationActionType.BAN) {
      await this.suspendUser(moderatorId, queueItem.userId, {
        reason: dto.reason || 'Permanently banned',
        isPermanent: true,
      });
    }

    this.logger.log(`Moderator ${moderatorId} took action ${dto.action} on queue ${queueId}`);

    return {
      id: action.id,
      queueId: action.queueId,
      moderatorId: action.moderatorId,
      moderatorName: moderator?.fullName || null,
      action: action.action,
      reason: action.reason,
      notes: action.notes,
      createdAt: action.createdAt,
    };
  }

  async bulkAction(moderatorId: string, dto: BulkModerationDto) {
    const results = await Promise.all(
      dto.queueIds.map((queueId) =>
        this.takeAction(moderatorId, queueId, {
          action: dto.action,
          reason: dto.reason,
        }).catch((e) => ({ error: e.message, queueId })),
      ),
    );

    return {
      processed: results.filter((r) => !('error' in r)).length,
      failed: results.filter((r) => 'error' in r).length,
      errors: results.filter((r) => 'error' in r),
    };
  }

  async suspendUser(
    suspendedById: string,
    userId: string,
    dto: SuspendUserDto,
  ): Promise<SuspensionInfo> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, fullName: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check for existing active suspension
    const existingSuspension = await this.prisma.userSuspension.findFirst({
      where: {
        userId,
        liftedAt: null,
        OR: [
          { isPermanent: true },
          { suspendedUntil: { gte: new Date() } },
        ],
      },
    });

    if (existingSuspension) {
      throw new BadRequestException('User already has an active suspension');
    }

    const suspension = await this.prisma.userSuspension.create({
      data: {
        userId,
        reason: dto.reason,
        suspendedById,
        suspendedUntil: dto.suspendUntil,
        isPermanent: dto.isPermanent || false,
      },
    });

    // Fetch suspender name
    const suspender = await this.prisma.user.findUnique({
      where: { id: suspendedById },
      select: { fullName: true },
    });

    // Update user status
    await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'SUSPENDED' },
    });

    this.logger.log(`User ${userId} suspended by ${suspendedById}`);

    return {
      id: suspension.id,
      userId: suspension.userId,
      userName: user.fullName,
      reason: suspension.reason,
      suspendedById: suspension.suspendedById,
      suspendedByName: suspender?.fullName || null,
      suspendedAt: suspension.suspendedAt,
      suspendedUntil: suspension.suspendedUntil,
      isPermanent: suspension.isPermanent,
      liftedAt: suspension.liftedAt,
      liftedByName: null,
    };
  }

  async liftSuspension(
    liftedById: string,
    suspensionId: string,
    dto: LiftSuspensionDto,
  ) {
    const suspension = await this.prisma.userSuspension.findUnique({
      where: { id: suspensionId },
    });

    if (!suspension) {
      throw new NotFoundException('Suspension not found');
    }

    if (suspension.liftedAt) {
      throw new BadRequestException('Suspension already lifted');
    }

    await this.prisma.$transaction([
      this.prisma.userSuspension.update({
        where: { id: suspensionId },
        data: {
          liftedAt: new Date(),
          liftedById,
        },
      }),
      this.prisma.user.update({
        where: { id: suspension.userId },
        data: { status: 'ACTIVE' },
      }),
    ]);

    this.logger.log(`Suspension ${suspensionId} lifted by ${liftedById}`);

    return { success: true };
  }

  async getSuspensions(
    active = true,
    limit = 50,
    offset = 0,
  ): Promise<SuspensionInfo[]> {
    const now = new Date();
    const suspensions = await this.prisma.userSuspension.findMany({
      where: active
        ? {
            liftedAt: null,
            OR: [
              { isPermanent: true },
              { suspendedUntil: { gte: now } },
            ],
          }
        : undefined,
      orderBy: { suspendedAt: 'desc' },
      take: limit,
      skip: offset,
    });

    // Fetch all related user IDs
    const userIds = new Set<string>();
    suspensions.forEach(s => {
      userIds.add(s.userId);
      userIds.add(s.suspendedById);
      if (s.liftedById) userIds.add(s.liftedById);
    });

    const users = await this.prisma.user.findMany({
      where: { id: { in: Array.from(userIds) } },
      select: { id: true, fullName: true },
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    return suspensions.map((s) => ({
      id: s.id,
      userId: s.userId,
      userName: userMap.get(s.userId)?.fullName || null,
      reason: s.reason,
      suspendedById: s.suspendedById,
      suspendedByName: userMap.get(s.suspendedById)?.fullName || null,
      suspendedAt: s.suspendedAt,
      suspendedUntil: s.suspendedUntil,
      isPermanent: s.isPermanent,
      liftedAt: s.liftedAt,
      liftedByName: s.liftedById ? userMap.get(s.liftedById)?.fullName || null : null,
    }));
  }

  async submitAppeal(userId: string, suspensionId: string, dto: AppealDto): Promise<AppealInfo> {
    const suspension = await this.prisma.userSuspension.findFirst({
      where: { id: suspensionId, userId, liftedAt: null },
    });

    if (!suspension) {
      throw new NotFoundException('Active suspension not found');
    }

    // Check for existing pending appeal
    const existingAppeal = await this.prisma.appeal.findFirst({
      where: { suspensionId, status: AppealStatus.PENDING },
    });

    if (existingAppeal) {
      throw new BadRequestException('You already have a pending appeal');
    }

    const appeal = await this.prisma.appeal.create({
      data: {
        userId,
        suspensionId,
        appealText: dto.appealText,
        status: AppealStatus.PENDING,
      },
    });

    // Fetch user name
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true },
    });

    this.logger.log(`User ${userId} submitted appeal for suspension ${suspensionId}`);

    return {
      id: appeal.id,
      userId: appeal.userId,
      userName: user?.fullName || null,
      suspensionId: appeal.suspensionId,
      appealText: appeal.appealText,
      status: appeal.status,
      reviewedById: appeal.reviewedById,
      reviewedByName: null,
      reviewNotes: appeal.reviewNotes,
      createdAt: appeal.createdAt,
      reviewedAt: appeal.reviewedAt,
    };
  }

  async reviewAppeal(
    reviewerId: string,
    appealId: string,
    dto: ReviewAppealDto,
  ) {
    const appeal = await this.prisma.appeal.findUnique({
      where: { id: appealId },
    });

    if (!appeal) {
      throw new NotFoundException('Appeal not found');
    }

    if (appeal.status !== AppealStatus.PENDING) {
      throw new BadRequestException('Appeal already reviewed');
    }

    await this.prisma.appeal.update({
      where: { id: appealId },
      data: {
        status: dto.decision === 'APPROVED' ? AppealStatus.APPROVED : AppealStatus.REJECTED,
        reviewedById: reviewerId,
        reviewNotes: dto.notes,
        reviewedAt: new Date(),
      },
    });

    // If approved, lift the suspension
    if (dto.decision === 'APPROVED' && appeal.suspensionId) {
      await this.liftSuspension(reviewerId, appeal.suspensionId, {
        notes: `Appeal approved: ${dto.notes || 'No notes'}`,
      });
    }

    this.logger.log(`Appeal ${appealId} reviewed by ${reviewerId}: ${dto.decision}`);

    return { success: true };
  }

  async getPendingAppeals(limit = 50, offset = 0): Promise<AppealInfo[]> {
    const appeals = await this.prisma.appeal.findMany({
      where: { status: AppealStatus.PENDING },
      orderBy: { createdAt: 'asc' },
      take: limit,
      skip: offset,
    });

    // Fetch all related user IDs
    const userIds = new Set<string>();
    appeals.forEach(a => {
      userIds.add(a.userId);
      if (a.reviewedById) userIds.add(a.reviewedById);
    });

    const users = await this.prisma.user.findMany({
      where: { id: { in: Array.from(userIds) } },
      select: { id: true, fullName: true },
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    return appeals.map((a) => ({
      id: a.id,
      userId: a.userId,
      userName: userMap.get(a.userId)?.fullName || null,
      suspensionId: a.suspensionId,
      appealText: a.appealText,
      status: a.status,
      reviewedById: a.reviewedById,
      reviewedByName: a.reviewedById ? userMap.get(a.reviewedById)?.fullName || null : null,
      reviewNotes: a.reviewNotes,
      createdAt: a.createdAt,
      reviewedAt: a.reviewedAt,
    }));
  }

  async getModerationStats(): Promise<ModerationStats> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pending, reviewing, resolvedToday, pendingAppeals, activeSuspensions] =
      await Promise.all([
        this.prisma.moderationQueue.count({
          where: { status: PrismaModerationStatus.PENDING },
        }),
        this.prisma.moderationQueue.count({
          where: { status: PrismaModerationStatus.IN_REVIEW },
        }),
        this.prisma.moderationAction.count({
          where: { createdAt: { gte: today } },
        }),
        this.prisma.appeal.count({
          where: { status: AppealStatus.PENDING },
        }),
        this.prisma.userSuspension.count({
          where: {
            liftedAt: null,
            OR: [
              { isPermanent: true },
              { suspendedUntil: { gte: new Date() } },
            ],
          },
        }),
      ]);

    return {
      pendingItems: pending,
      reviewingItems: reviewing,
      resolvedToday,
      pendingAppeals,
      activeSuspensions,
    };
  }

  async autoReviewContent(
    contentType: ModerationContentType,
    contentId: string,
    content: { url?: string; text?: string; userId?: string; displayName?: string; bio?: string; photos?: string[] },
  ) {
    let result;

    switch (contentType) {
      case ModerationContentType.PROFILE:
        result = await this.contentReviewService.reviewProfile({
          displayName: content.displayName,
          bio: content.bio,
          photos: content.photos,
        });
        break;
      case ModerationContentType.PHOTO:
        result = await this.contentReviewService.reviewImage(content.url || '');
        break;
      case ModerationContentType.MESSAGE:
        result = await this.contentReviewService.reviewText(content.text || '');
        break;
      default:
        result = await this.contentReviewService.reviewText(JSON.stringify(content));
    }

    // If flagged, add to moderation queue
    if (!result.isSafe || result.flags.length > 0) {
      const priority = result.suggestedAction === 'reject' ? 8 : result.flags.length > 2 ? 6 : 4;

      await this.prisma.moderationQueue.create({
        data: {
          contentType,
          contentId,
          userId: content.userId || contentId,
          priority,
          flags: result.flags,
          status: PrismaModerationStatus.PENDING,
        },
      });
    }

    return result;
  }
}
