import { Gender, ReportType, UserRole, UserStatus } from '@generated/client';
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
  UpdateUserDto
} from '../dto/create-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) { }



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


  async updateUser(userId: string, updateData: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
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
      },
    });

    if (pendingBookings.length > 0) {
      const bookingDetails = pendingBookings.map(b => ({
        id: b.id,
        status: b.status,

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


}
