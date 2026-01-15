import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@generated/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { UpdateCompanionProfileDto } from '../dto/create-user.dto';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
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
        verifications: {
          where: { status: 'VERIFIED' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        role: user.role,
        status: user.status,
        isVerified: user.isVerified,
        trustScore: user.trustScore,
      },
      profile:
        user.role === UserRole.COMPANION
          ? user.companionProfile
          : user.hirerProfile,
      verifications: user.verifications.map((v) => ({
        type: v.type,
        verifiedAt: v.verifiedAt,
      })),
    };
  }

  async getPublicProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        companionProfile: {
          include: {
            photos: true,
            services: true,
          },
        },
        verifications: {
          where: { status: 'VERIFIED' },
          select: { type: true, verifiedAt: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Only show public profiles for companions
    if (user.role !== UserRole.COMPANION) {
      throw new NotFoundException('Profile not found');
    }

    const profile = user.companionProfile;
    if (!profile || !profile.isActive) {
      throw new NotFoundException('Profile not found or inactive');
    }

    // Return public companion profile data
    return {
      id: user.id,
      role: user.role,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
      gender: user.gender,
      isVerified: user.isVerified,
      trustScore: user.trustScore,
      companionProfile: {
        bio: profile.bio,
        heightCm: profile.heightCm,
        languages: profile.languages,
        hourlyRate: profile.hourlyRate,
        halfDayRate: profile.halfDayRate,
        fullDayRate: profile.fullDayRate,
        ratingAvg: profile.ratingAvg,
        ratingCount: profile.ratingCount,
        totalBookings: profile.totalBookings,
        photos: profile.photos,
        services: profile.services,
      },
      verifications: user.verifications,
    };
  }

  async updateCompanionProfile(
    userId: string,
    updateData: UpdateCompanionProfileDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { companionProfile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== UserRole.COMPANION) {
      throw new BadRequestException('User is not a companion');
    }

    if (!user.companionProfile) {
      throw new NotFoundException('Companion profile not found');
    }

    const updatedProfile = await this.prisma.companionProfile.update({
      where: { userId },
      data: {
        bio: updateData.bio,
        heightCm: updateData.heightCm,
        languages: updateData.languages,
        hourlyRate: updateData.hourlyRate,
        halfDayRate: updateData.halfDayRate,
        fullDayRate: updateData.fullDayRate,
        isActive: updateData.isActive,
        isHidden: updateData.isHidden,
      },
    });

    this.logger.log(`Updated companion profile for user: ${userId}`);
    return updatedProfile;
  }

  async setProfileActive(userId: string, isActive: boolean) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== UserRole.COMPANION) {
      throw new BadRequestException('User is not a companion');
    }

    await this.prisma.companionProfile.update({
      where: { userId },
      data: { isActive },
    });

    return { isActive };
  }

  async setProfileHidden(userId: string, isHidden: boolean) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== UserRole.COMPANION) {
      throw new BadRequestException('User is not a companion');
    }

    await this.prisma.companionProfile.update({
      where: { userId },
      data: { isHidden },
    });

    return { isHidden };
  }
}
