import { Gender, Prisma, ReportType, UserRole, UserStatus } from '@generated/client';
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  CreateCompanionProfileDto,
  CreateUserDto,
  RegisterUserDto,
  UpdateUserDto,
} from '../dto/create-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    try {
      // Check if user already exists
      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            createUserDto.email ? { email: createUserDto.email } : undefined,
            createUserDto.phone ? { phone: createUserDto.phone } : undefined,
          ].filter(Boolean) as Prisma.UserWhereInput[],
        },
      });

      if (existingUser) {
        throw new ConflictException('User already exists');
      }

      const user = await this.prisma.user.create({
        data: {
          email: createUserDto.email,
          phone: createUserDto.phone,
          fullName: createUserDto.fullName,
          role: (createUserDto.role as UserRole) || UserRole.HIRER,
          status: UserStatus.PENDING,
          settings: {
            create: {},
          },
        },
        include: {
          settings: true,
        },
      });

      this.logger.log(`Created user: ${user.id}`);
      return user;
    } catch (error) {
      this.logger.error('Error creating user:', error);
      throw error;
    }
  }

  async registerUser(registerData: RegisterUserDto) {
    try {
      // Validate age - must be 18 or older
      if (registerData.dateOfBirth) {
        const birthDate = new Date(registerData.dateOfBirth);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        if (age < 18) {
          throw new BadRequestException('You must be at least 18 years old to register');
        }
      }

      // Check if user already exists
      const existingUser = await this.prisma.user.findFirst({
        where: {
          OR: [
            registerData.email ? { email: registerData.email } : undefined,
            registerData.phone ? { phone: registerData.phone } : undefined,
          ].filter(Boolean) as Prisma.UserWhereInput[],
        },
      });

      if (existingUser) {
        throw new ConflictException('User already exists with this email or phone');
      }

      const user = await this.prisma.user.create({
        data: {
          email: registerData.email,
          phone: registerData.phone,
          fullName: registerData.fullName,
          gender: registerData.gender as Gender,
          dateOfBirth: registerData.dateOfBirth,
          avatarUrl: registerData.avatarUrl,
          role: registerData.role as UserRole,
          status: UserStatus.PENDING,
          settings: {
            create: {},
          },
          // Create role-specific profile
          ...(registerData.role === 'HIRER'
            ? { hirerProfile: { create: {} } }
            : {}),
        },
        include: {
          settings: true,
          hirerProfile: true,
        },
      });

      this.logger.log(`Registered user: ${user.id} as ${registerData.role}`);
      return user;
    } catch (error) {
      this.logger.error('Error registering user:', error);
      throw error;
    }
  }

  async createCompanionProfile(
    userId: string,
    profileData: CreateCompanionProfileDto,
  ) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { companionProfile: true },
      });

      if (!user) {
        throw new NotFoundException(`User with id ${userId} not found`);
      }

      if (user.role !== UserRole.COMPANION) {
        throw new BadRequestException('User is not registered as a companion');
      }

      // Upsert companion profile
      await this.prisma.companionProfile.upsert({
        where: { userId },
        create: {
          userId,
          bio: profileData.bio,
          heightCm: profileData.heightCm,
          languages: profileData.languages || [],
          hourlyRate: profileData.hourlyRate,
          halfDayRate: profileData.halfDayRate,
          fullDayRate: profileData.fullDayRate,
        },
        update: {
          bio: profileData.bio,
          heightCm: profileData.heightCm,
          languages: profileData.languages || [],
          hourlyRate: profileData.hourlyRate,
          halfDayRate: profileData.halfDayRate,
          fullDayRate: profileData.fullDayRate,
        },
      });

      // Create settings if they don't exist
      await this.prisma.userSettings.upsert({
        where: { userId },
        create: { userId },
        update: {},
      });

      // Fetch and return the complete user with profile
      const updatedUser = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          companionProfile: true,
          settings: true,
        },
      });

      this.logger.log(`Created/updated companion profile for user: ${userId}`);
      return updatedUser!;
    } catch (error) {
      this.logger.error('Error creating companion profile:', error);
      throw error;
    }
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        companionProfile: {
          include: {
            photos: true,
            services: true,
            availability: true,
          },
        },
        hirerProfile: true,
        settings: true,
        verifications: {
          where: { status: 'VERIFIED' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByIds(ids: string[]) {
    const users = await this.prisma.user.findMany({
      where: { id: { in: ids } },
      include: {
        companionProfile: {
          select: {
            bio: true,
            hourlyRate: true,
            ratingAvg: true,
            ratingCount: true,
          },
        },
      },
    });

    return users.map((user) => ({
      id: user.id,
      role: user.role,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      gender: user.gender,
      companionProfile: user.companionProfile,
    }));
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
      include: {
        companionProfile: true,
        hirerProfile: true,
      },
    });
  }

  async findByPhone(phone: string) {
    return this.prisma.user.findUnique({
      where: { phone },
      include: {
        companionProfile: true,
        hirerProfile: true,
      },
    });
  }

  async updateUser(userId: string, updateData: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        fullName: updateData.fullName,
        avatarUrl: updateData.avatarUrl,
        gender: updateData.gender as Gender,
        dateOfBirth: updateData.dateOfBirth,
        phone: updateData.phone,
      },
      include: {
        companionProfile: true,
        hirerProfile: true,
        settings: true,
      },
    });

    this.logger.log(`Updated user: ${userId}`);
    return user;
  }

  async updateStatus(userId: string, status: UserStatus) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { status },
    });
  }

  async activateUser(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.ACTIVE,
      },
    });
  }

  async blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
      throw new BadRequestException('Cannot block yourself');
    }

    // Check if block already exists
    const existingBlock = await this.prisma.userBlock.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    });

    if (existingBlock) {
      throw new ConflictException('User already blocked');
    }

    const block = await this.prisma.userBlock.create({
      data: {
        blockerId,
        blockedId,
      },
    });

    this.logger.log(`User ${blockerId} blocked user ${blockedId}`);
    return block;
  }

  async unblockUser(blockerId: string, blockedId: string) {
    const block = await this.prisma.userBlock.findUnique({
      where: {
        blockerId_blockedId: {
          blockerId,
          blockedId,
        },
      },
    });

    if (!block) {
      throw new NotFoundException('Block not found');
    }

    await this.prisma.userBlock.delete({
      where: { id: block.id },
    });

    this.logger.log(`User ${blockerId} unblocked user ${blockedId}`);
    return { success: true };
  }

  async getBlockedUsers(userId: string) {
    const blocks = await this.prisma.userBlock.findMany({
      where: { blockerId: userId },
      include: {
        blocked: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    });

    return blocks.map((block) => ({
      id: block.blocked.id,
      fullName: block.blocked.fullName,
      avatarUrl: block.blocked.avatarUrl,
      blockedAt: block.createdAt,
    }));
  }

  async reportUser(
    reporterId: string,
    reportedId: string,
    type: ReportType,
    description: string,
    evidenceUrls?: string[],
    bookingId?: string,
  ) {
    if (reporterId === reportedId) {
      throw new BadRequestException('Cannot report yourself');
    }

    const report = await this.prisma.report.create({
      data: {
        reporterId,
        reportedId,
        type,
        description,
        evidenceUrls: evidenceUrls || [],
        bookingId,
      },
    });

    this.logger.log(
      `User ${reporterId} reported user ${reportedId} for: ${type}`,
    );
    return report;
  }

  async resetOnboarding(userId: string) {
    try {
      // Delete profiles if they exist
      await this.prisma.companionProfile.deleteMany({
        where: { userId },
      });

      await this.prisma.hirerProfile.deleteMany({
        where: { userId },
      });

      // Reset user status to pending
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          status: UserStatus.PENDING,
        },
      });

      this.logger.log(`Reset onboarding for user: ${userId}`);
      return user;
    } catch (error) {
      this.logger.error('Error resetting onboarding:', error);
      throw error;
    }
  }

  async deleteAccount(userId: string) {
    // Check for pending/active bookings before allowing deletion
    const pendingBookings = await this.prisma.booking.findMany({
      where: {
        OR: [
          { hirerId: userId },
          { companionId: userId },
        ],
        status: {
          in: ['PENDING', 'CONFIRMED', 'ACTIVE'],
        },
      },
      select: {
        id: true,
        status: true,
        startTime: true,
        endTime: true,
      },
    });

    if (pendingBookings.length > 0) {
      const bookingDetails = pendingBookings.map(b => ({
        id: b.id,
        status: b.status,
        startTime: b.startTime.toISOString(),
        endTime: b.endTime.toISOString(),
      }));

      throw new BadRequestException({
        message: 'Cannot delete account with pending or active bookings',
        error: 'PENDING_BOOKINGS_EXIST',
        pendingBookingsCount: pendingBookings.length,
        bookings: bookingDetails,
        suggestion: 'Please complete or cancel all pending bookings before deleting your account',
      });
    }

    // Soft delete - mark as deleted
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: UserStatus.DELETED,
        email: `deleted_${userId}@deleted.local`,
        phone: null,
      },
    });

    this.logger.log(`User ${userId} account deleted`);
    return { success: true };
  }

  async completeOnboarding(userId: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.ACTIVE },
      include: {
        companionProfile: true,
        hirerProfile: true,
        settings: true,
      },
    });

    this.logger.log(`User ${userId} completed onboarding`);
    return user;
  }

  async verifyUser(userId: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { isVerified: true },
    });

    this.logger.log(`User ${userId} verified`);
    return user;
  }

  async updateTrustScore(userId: string, score: number) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { trustScore: Math.max(0, Math.min(100, score)) },
    });

    this.logger.log(`Updated trust score for user ${userId} to ${score}`);
    return user;
  }

  /**
   * GDPR Data Export - Export all user's personal data
   * Returns a comprehensive JSON object with all user data
   */
  async exportUserData(userId: string): Promise<GdprDataExport> {
    this.logger.log(`Starting GDPR data export for user: ${userId}`);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        companionProfile: {
          include: {
            photos: true,
            services: true,
            availability: true,
          },
        },
        hirerProfile: true,
        settings: true,
        verifications: true,
        emergencyContacts: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Fetch bookings (as hirer and as companion)
    const bookingsAsHirer = await this.prisma.booking.findMany({
      where: { hirerId: userId },
      include: {
        companion: {
          select: { id: true, fullName: true },
        },
        transactions: true,
      },
    });

    const bookingsAsCompanion = await this.prisma.booking.findMany({
      where: { companionId: userId },
      include: {
        hirer: {
          select: { id: true, fullName: true },
        },
        transactions: true,
      },
    });

    // Fetch reviews (given and received)
    const reviewsGiven = await this.prisma.review.findMany({
      where: { reviewerId: userId },
    });

    const reviewsReceived = await this.prisma.review.findMany({
      where: { revieweeId: userId },
    });

    // Fetch messages sent by user
    const messagesSent = await this.prisma.message.findMany({
      where: { senderId: userId },
      select: {
        id: true,
        content: true,
        createdAt: true,
        conversationId: true,
      },
    });

    // Fetch conversations user participated in
    const conversationParticipants = await this.prisma.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          select: {
            id: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    // Fetch notifications
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        isRead: true,
        createdAt: true,
      },
    });

    // Fetch payment methods
    const paymentMethods = await this.prisma.paymentMethod.findMany({
      where: { userId },
      select: {
        id: true,
        type: true,
        last4: true,
        bankName: true,
        isDefault: true,
        createdAt: true,
      },
    });

    // Fetch transactions
    const transactions = await this.prisma.transaction.findMany({
      where: { userId },
      select: {
        id: true,
        type: true,
        amount: true,
        currency: true,
        status: true,
        createdAt: true,
      },
    });

    // Fetch reports made by user
    const reportsMade = await this.prisma.report.findMany({
      where: { reporterId: userId },
      select: {
        id: true,
        type: true,
        description: true,
        status: true,
        createdAt: true,
      },
    });

    // Fetch blocks
    const blockedUsers = await this.prisma.userBlock.findMany({
      where: { blockerId: userId },
      include: {
        blocked: {
          select: { id: true, fullName: true },
        },
      },
    });

    // Fetch favorites
    const favorites = await this.prisma.favoriteCompanion.findMany({
      where: { hirerId: userId },
      include: {
        companion: {
          select: { id: true, fullName: true },
        },
      },
    });

    // Fetch emergency events
    const emergencyEvents = await (this.prisma as unknown as {
      emergencyEvent: {
        findMany: (args: unknown) => Promise<EmergencyEventData[]>;
      };
    }).emergencyEvent.findMany({
      where: { userId },
    });

    // Compile the export data
    const exportData: GdprDataExport = {
      exportedAt: new Date().toISOString(),
      userId: user.id,
      profile: {
        email: user.email,
        phone: user.phone,
        fullName: user.fullName,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth?.toISOString() || null,
        avatarUrl: user.avatarUrl,
        role: user.role,
        status: user.status,
        isVerified: user.isVerified,
        trustScore: user.trustScore,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
      },
      companionProfile: user.companionProfile
        ? {
            bio: user.companionProfile.bio,
            heightCm: user.companionProfile.heightCm,
            languages: user.companionProfile.languages,
            hourlyRate: Number(user.companionProfile.hourlyRate),
            halfDayRate: user.companionProfile.halfDayRate
              ? Number(user.companionProfile.halfDayRate)
              : null,
            fullDayRate: user.companionProfile.fullDayRate
              ? Number(user.companionProfile.fullDayRate)
              : null,
            ratingAvg: user.companionProfile.ratingAvg
              ? Number(user.companionProfile.ratingAvg)
              : null,
            ratingCount: user.companionProfile.ratingCount,
            photos: user.companionProfile.photos.map((p) => ({
              url: p.url,
              isPrimary: p.isPrimary,
            })),
            services: user.companionProfile.services.map((s) => ({
              name: s.name,
              description: s.description,
            })),
            availability: user.companionProfile.availability.map((a) => ({
              dayOfWeek: a.dayOfWeek,
              startTime: a.startTime,
              endTime: a.endTime,
            })),
          }
        : null,
      hirerProfile: user.hirerProfile
        ? {
            company: user.hirerProfile.company,
            occupation: user.hirerProfile.occupation,
            interests: user.hirerProfile.interests,
          }
        : null,
      settings: user.settings
        ? {
            language: user.settings.language,
            notificationsEnabled: user.settings.notificationsEnabled,
            emailNotifications: user.settings.emailNotifications,
            smsNotifications: user.settings.smsNotifications,
            marketingEmails: user.settings.marketingEmails,
            profileVisibility: user.settings.profileVisibility,
          }
        : null,
      emergencyContacts: (user.emergencyContacts || []).map((c) => ({
        name: c.name,
        phone: c.phone,
        relationship: c.relationship,
        isPrimary: c.isPrimary,
      })),
      verifications: user.verifications.map((v) => ({
        type: v.type,
        status: v.status,
        verifiedAt: v.verifiedAt?.toISOString() || null,
      })),
      bookingsAsHirer: bookingsAsHirer.map((b) => ({
        id: b.id,
        companionName: b.companion.fullName,
        occasionType: b.occasionType,
        status: b.status,
        startTime: b.startTime.toISOString(),
        endTime: b.endTime.toISOString(),
        totalAmount: Number(b.totalAmount),
        createdAt: b.createdAt.toISOString(),
      })),
      bookingsAsCompanion: bookingsAsCompanion.map((b) => ({
        id: b.id,
        hirerName: b.hirer.fullName,
        occasionType: b.occasionType,
        status: b.status,
        startTime: b.startTime.toISOString(),
        endTime: b.endTime.toISOString(),
        totalAmount: Number(b.totalAmount),
        createdAt: b.createdAt.toISOString(),
      })),
      reviewsGiven: reviewsGiven.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
      })),
      reviewsReceived: reviewsReceived.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        createdAt: r.createdAt.toISOString(),
      })),
      messagesSent: messagesSent.map((m) => ({
        id: m.id,
        content: m.content,
        conversationId: m.conversationId,
        createdAt: m.createdAt.toISOString(),
      })),
      conversations: conversationParticipants.map((p) => ({
        conversationId: p.conversation.id,
        joinedAt: p.createdAt.toISOString(),
      })),
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        isRead: n.isRead,
        createdAt: n.createdAt.toISOString(),
      })),
      paymentMethods: paymentMethods.map((pm) => ({
        id: pm.id,
        type: pm.type,
        last4: pm.last4,
        bankName: pm.bankName,
        isDefault: pm.isDefault,
        createdAt: pm.createdAt.toISOString(),
      })),
      transactions: transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: Number(t.amount),
        currency: t.currency,
        status: t.status,
        createdAt: t.createdAt.toISOString(),
      })),
      reportsMade: reportsMade.map((r) => ({
        id: r.id,
        type: r.type,
        description: r.description,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
      })),
      blockedUsers: blockedUsers.map((b) => ({
        userId: b.blocked.id,
        blockedAt: b.createdAt.toISOString(),
      })),
      favorites: favorites.map((f) => ({
        companionId: f.companion.id,
        companionName: f.companion.fullName,
        notes: f.notes,
        addedAt: f.createdAt.toISOString(),
      })),
      emergencyEvents: emergencyEvents.map((e) => ({
        id: e.id,
        alertType: e.alertType,
        status: e.status,
        triggeredAt: e.triggeredAt.toISOString(),
        resolvedAt: e.resolvedAt?.toISOString() || null,
      })),
    };

    this.logger.log(`GDPR data export completed for user: ${userId}`);
    return exportData;
  }
}

// Type definitions for GDPR export
interface EmergencyEventData {
  id: string;
  alertType: string;
  status: string;
  triggeredAt: Date;
  resolvedAt: Date | null;
}

interface GdprDataExport {
  exportedAt: string;
  userId: string;
  profile: {
    email: string | null;
    phone: string | null;
    fullName: string;
    gender: string | null;
    dateOfBirth: string | null;
    avatarUrl: string | null;
    role: string;
    status: string;
    isVerified: boolean;
    trustScore: number;
    createdAt: string;
    updatedAt: string;
  };
  companionProfile: {
    bio: string | null;
    heightCm: number | null;
    languages: string[];
    hourlyRate: number;
    halfDayRate: number | null;
    fullDayRate: number | null;
    ratingAvg: number | null;
    ratingCount: number;
    photos: Array<{ url: string; isPrimary: boolean }>;
    services: Array<{ name: string; description: string | null }>;
    availability: Array<{ dayOfWeek: number; startTime: string; endTime: string }>;
  } | null;
  hirerProfile: {
    company: string | null;
    occupation: string | null;
    interests: string[];
  } | null;
  settings: {
    language: string;
    notificationsEnabled: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
    marketingEmails: boolean;
    profileVisibility: string;
  } | null;
  emergencyContacts: Array<{
    name: string;
    phone: string;
    relationship: string | null;
    isPrimary: boolean;
  }>;
  verifications: Array<{
    type: string;
    status: string;
    verifiedAt: string | null;
  }>;
  bookingsAsHirer: Array<{
    id: string;
    companionName: string;
    occasionType: string;
    status: string;
    startTime: string;
    endTime: string;
    totalAmount: number;
    createdAt: string;
  }>;
  bookingsAsCompanion: Array<{
    id: string;
    hirerName: string;
    occasionType: string;
    status: string;
    startTime: string;
    endTime: string;
    totalAmount: number;
    createdAt: string;
  }>;
  reviewsGiven: Array<{
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
  }>;
  reviewsReceived: Array<{
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
  }>;
  messagesSent: Array<{
    id: string;
    content: string;
    conversationId: string;
    createdAt: string;
  }>;
  conversations: Array<{
    conversationId: string;
    joinedAt: string;
  }>;
  notifications: Array<{
    id: string;
    type: string;
    title: string;
    body: string;
    isRead: boolean;
    createdAt: string;
  }>;
  paymentMethods: Array<{
    id: string;
    type: string;
    last4: string | null;
    bankName: string | null;
    isDefault: boolean;
    createdAt: string;
  }>;
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    currency: string;
    status: string;
    createdAt: string;
  }>;
  reportsMade: Array<{
    id: string;
    type: string;
    description: string;
    status: string;
    createdAt: string;
  }>;
  blockedUsers: Array<{
    userId: string;
    blockedAt: string;
  }>;
  favorites: Array<{
    companionId: string;
    companionName: string;
    notes: string | null;
    addedAt: string;
  }>;
  emergencyEvents: Array<{
    id: string;
    alertType: string;
    status: string;
    triggeredAt: string;
    resolvedAt: string | null;
  }>;
}
